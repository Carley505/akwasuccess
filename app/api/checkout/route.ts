import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema as s } from "@/lib/db";
import { findOrCreateUser, getSessionUser } from "@/lib/auth";
import { applyCoupon, computeTotals, effectivePrice, isPurchasable } from "@/lib/pricing";
import { initiateCardPayment, settleOrderPayment } from "@/lib/payments";
import {
  classifyWooProduct,
  createWooOrder,
  fetchLiveWooProductsByIds,
  findOrCreateWooCustomer,
  formatPaystackWooReference,
  validateWooCoupon,
} from "@/lib/woocommerce";
import { checkRateLimit, clientIp } from "@/lib/security";
import { isSampleDataVisible } from "@/content/site";

const checkoutSchema = z.object({
  email: z.string().email("Please enter a valid email address for your receipt and download link."),
  name: z.string().max(120).optional().nullable(),
  productIds: z.array(z.string().uuid()).min(1, "Your cart is empty."),
  couponCode: z.string().max(40).optional().nullable(),
  marketingConsent: z.boolean().optional().default(false),
});

function generateOrderNumber() {
  const rand = crypto.randomInt(1000, 9999);
  const stamp = Date.now().toString(36).toUpperCase().slice(-4);
  return `AK-${stamp}-${rand}`;
}

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(`checkout:${clientIp(req)}`, 15, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many checkout attempts. Please wait a minute and try again." },
      { status: 429 },
    );
  }

  const parsed = checkoutSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please check your checkout details." },
      { status: 400 },
    );
  }

  const { email, name, productIds, couponCode, marketingConsent } = parsed.data;

  const db = await getDb();
  const dbProducts = await db
    .select()
    .from(s.products)
    .where(and(inArray(s.products.id, productIds), eq(s.products.status, "published")));

  if (dbProducts.length === 0) {
    return NextResponse.json({ error: "No valid products found in cart." }, { status: 400 });
  }

  // Re-verify live prices directly from WooCommerce when products have wooId
  const wooIds = dbProducts
    .map((p) => p.wooId)
    .filter((id): id is number => typeof id === "number" && id > 0);
  const liveWooMap = await fetchLiveWooProductsByIds(wooIds);

  // Server-side authoritative pricing (NEVER trust client prices)
  const pricedItems: { product: s.Product; unitPriceCents: number }[] = [];
  for (const p of dbProducts) {
    let priceCents = p.priceCents;
    let salePriceCents = p.salePriceCents;

    if (p.wooId && liveWooMap.has(p.wooId)) {
      const liveClassified = classifyWooProduct(liveWooMap.get(p.wooId)!);
      priceCents = liveClassified.priceCents;
      salePriceCents = liveClassified.salePriceCents;
      if (priceCents !== p.priceCents || salePriceCents !== p.salePriceCents) {
        await db
          .update(s.products)
          .set({ priceCents, salePriceCents, wooSyncedAt: new Date() })
          .where(eq(s.products.id, p.id));
      }
    }

    const cleanP =
      p.isSample && !isSampleDataVisible
        ? { ...p, priceCents: 0, salePriceCents: null }
        : { ...p, priceCents, salePriceCents };

    if (!isPurchasable(cleanP)) {
      return NextResponse.json(
        { error: `"${p.title}" is not yet open for purchase.` },
        { status: 400 },
      );
    }
    pricedItems.push({ product: p, unitPriceCents: effectivePrice(cleanP) });
  }

  const rawPrices = pricedItems.map((i) => i.unitPriceCents);
  const rawSubtotal = rawPrices.reduce((a, b) => a + b, 0);

  let discountCents = 0;
  let validCouponCode: string | null = null;

  if (couponCode && couponCode.trim()) {
    const code = couponCode.toUpperCase().trim();
    const wooCoupon = await validateWooCoupon(code, rawSubtotal);
    if (wooCoupon.found) {
      if (!wooCoupon.ok) {
        return NextResponse.json({ error: wooCoupon.reason }, { status: 400 });
      }
      discountCents = wooCoupon.discountCents;
      validCouponCode = wooCoupon.code;
    } else {
      const [coupon] = await db.select().from(s.coupons).where(eq(s.coupons.code, code));
      const check = applyCoupon(coupon, rawSubtotal);
      if (!check.ok) {
        return NextResponse.json({ error: check.reason }, { status: 400 });
      }
      discountCents = check.discountCents;
      validCouponCode = code;
    }
  }

  const totals = computeTotals(rawPrices, discountCents);

  // Check if customer is signed in or checking out as a guest
  const sessionUser = await getSessionUser();
  const user = await findOrCreateUser({
    email,
    name: name ?? undefined,
    marketingConsent,
  });

  // If signed in, ensure WooCommerce customer ID is linked so their Woo account tracks the order
  let wooCustomerId = user.wooCustomerId ?? null;
  if (sessionUser && !wooCustomerId) {
    wooCustomerId = await findOrCreateWooCustomer({
      email: user.email,
      name: name ?? user.name,
    });
    if (wooCustomerId) {
      await db
        .update(s.users)
        .set({ wooCustomerId, updatedAt: new Date() })
        .where(eq(s.users.id, user.id));
    }
  }

  const orderNumber = generateOrderNumber();

  // Create authoritative order in WooCommerce when cart contains WooCommerce products
  const wooLineItems = pricedItems
    .filter((i) => typeof i.product.wooId === "number" && i.product.wooId > 0)
    .map((i) => ({ wooId: i.product.wooId!, quantity: 1 }));

  const wooOrder =
    wooLineItems.length > 0
      ? await createWooOrder({
          email: user.email,
          name: name ?? user.name,
          wooCustomerId: sessionUser ? wooCustomerId : null,
          items: wooLineItems,
          couponCode: validCouponCode,
          orderNumber,
        })
      : null;

  const [order] = await db
    .insert(s.orders)
    .values({
      number: orderNumber,
      userId: user.id,
      email: user.email,
      name: name ? name.trim() : null,
      status: "pending",
      subtotalCents: totals.subtotalCents,
      discountCents: totals.discountCents,
      totalCents: totals.totalCents,
      couponCode: validCouponCode,
      marketingConsent,
      wooOrderId: wooOrder?.wooOrderId ?? null,
      wooOrderKey: wooOrder?.wooOrderKey ?? null,
    })
    .returning();

  for (const item of pricedItems) {
    await db.insert(s.orderItems).values({
      orderId: order!.id,
      productId: item.product.id,
      title: item.product.title,
      unitPriceCents: item.unitPriceCents,
    });
  }

  if (validCouponCode) {
    const [c] = await db.select().from(s.coupons).where(eq(s.coupons.code, validCouponCode));
    if (c) {
      await db
        .update(s.coupons)
        .set({ redemptions: c.redemptions + 1 })
        .where(eq(s.coupons.code, validCouponCode));
    }
  }

  const reference =
    wooOrder?.reference ?? formatPaystackWooReference(wooOrder?.wooOrderId, order!.number);

  // Free order (total == 0) settles immediately
  if (totals.totalCents === 0) {
    const [freePayment] = await db
      .insert(s.payments)
      .values({
        orderId: order!.id,
        provider: "mock",
        method: "free",
        status: "pending",
        amountCents: 0,
        reference,
        providerRef: reference,
      })
      .returning();

    await settleOrderPayment({
      paymentId: freePayment!.id,
      dedupeKey: `free:${reference}`,
      provider: "mock",
      outcome: "succeeded",
      receiptNumber: "FREE",
    });

    return NextResponse.json({
      orderId: order!.id,
      orderNumber: order!.number,
      paymentId: freePayment!.id,
      status: "succeeded",
    });
  }

  // Card payment in USD via Paystack inline popup (Option A) or local sandbox
  const card = await initiateCardPayment({
    reference,
    email: user.email,
    amountCents: totals.totalCents,
    orderId: order!.id,
    wooOrderId: wooOrder?.wooOrderId,
  });

  const [payment] = await db
    .insert(s.payments)
    .values({
      orderId: order!.id,
      provider: card.provider,
      method: "card",
      status: card.ok ? "pending" : "failed",
      amountCents: totals.totalCents,
      reference,
      providerRef: reference,
    })
    .returning();

  if (!card.ok) {
    return NextResponse.json(
      {
        error: "Could not start card checkout. Please try again in a moment.",
        paymentId: payment!.id,
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    orderId: order!.id,
    orderNumber: order!.number,
    paymentId: payment!.id,
    provider: card.provider,
    method: "card",
    status: "pending",
    reference,
    amountCents: totals.totalCents,
    email: user.email,
    accessCode: card.accessCode,
    publicKey: card.publicKey,
    authorizationUrl: card.authorizationUrl,
  });
}
