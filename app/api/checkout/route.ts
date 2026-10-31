import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema as s } from "@/lib/db";
import { findOrCreateUser, setSessionCookie } from "@/lib/auth";
import { applyCoupon, computeTotals, effectivePrice, isPurchasable } from "@/lib/pricing";
import { normalizeKenyanPhone } from "@/lib/phone";
import {
  initiateCardPayment,
  initiateMpesaStkPush,
  settleOrderPayment,
} from "@/lib/payments";
import { checkRateLimit, clientIp } from "@/lib/security";
import { isSampleDataVisible } from "@/content/site";

const checkoutSchema = z.object({
  email: z.string().email("Please enter a valid email address for your receipt and download link."),
  phone: z.string().max(40).optional().nullable(),
  name: z.string().max(120).optional().nullable(),
  method: z.enum(["mpesa", "card"]),
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

  const { email, phone, name, method, productIds, couponCode, marketingConsent } = parsed.data;

  // Validate M-Pesa phone number when M-Pesa is chosen
  let normalizedPhone: string | null = null;
  if (method === "mpesa") {
    normalizedPhone = normalizeKenyanPhone(phone ?? "");
    if (!normalizedPhone) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid Kenyan M-Pesa number (e.g. 0712 345 678, 0110 123 456, or 254712345678).",
        },
        { status: 400 },
      );
    }
  } else if (phone) {
    normalizedPhone = normalizeKenyanPhone(phone) ?? phone.trim();
  }

  const db = await getDb();
  const dbProducts = await db
    .select()
    .from(s.products)
    .where(and(inArray(s.products.id, productIds), eq(s.products.status, "published")));

  if (dbProducts.length === 0) {
    return NextResponse.json({ error: "No valid products found in cart." }, { status: 400 });
  }

  // Server-side authoritative pricing (NEVER trust client prices)
  const pricedItems: { product: s.Product; unitPriceKes: number }[] = [];
  for (const p of dbProducts) {
    const cleanP =
      p.isSample && !isSampleDataVisible
        ? { ...p, priceKes: 0, salePriceKes: null }
        : p;
    if (!isPurchasable(cleanP)) {
      return NextResponse.json(
        { error: `"${p.title}" is not yet open for purchase.` },
        { status: 400 },
      );
    }
    pricedItems.push({ product: p, unitPriceKes: effectivePrice(cleanP) });
  }

  const rawPrices = pricedItems.map((i) => i.unitPriceKes);
  const rawSubtotal = rawPrices.reduce((a, b) => a + b, 0);

  let discountKes = 0;
  let validCouponCode: string | null = null;

  if (couponCode && couponCode.trim()) {
    const code = couponCode.toUpperCase().trim();
    const [coupon] = await db.select().from(s.coupons).where(eq(s.coupons.code, code));
    const check = applyCoupon(coupon, rawSubtotal);
    if (!check.ok) {
      return NextResponse.json({ error: check.reason }, { status: 400 });
    }
    discountKes = check.discountKes;
    validCouponCode = code;
  }

  const totals = computeTotals(rawPrices, discountKes);

  // Create or update guest user account automatically from email (Spec 8.4)
  const user = await findOrCreateUser({
    email,
    name: name ?? undefined,
    phone: normalizedPhone ?? undefined,
    marketingConsent,
  });

  // Set session cookie so the customer can immediately view their order & library
  await setSessionCookie({ userId: user.id, email: user.email, role: user.role });

  const orderNumber = generateOrderNumber();
  const [order] = await db
    .insert(s.orders)
    .values({
      number: orderNumber,
      userId: user.id,
      email: user.email,
      phone: normalizedPhone,
      name: name ? name.trim() : null,
      status: "pending",
      subtotalKes: totals.subtotalKes,
      discountKes: totals.discountKes,
      totalKes: totals.totalKes,
      couponCode: validCouponCode,
      marketingConsent,
    })
    .returning();

  for (const item of pricedItems) {
    await db.insert(s.orderItems).values({
      orderId: order!.id,
      productId: item.product.id,
      title: item.product.title,
      unitPriceKes: item.unitPriceKes,
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

  const reference = `AKWA_${order!.number}_${Date.now()}`;

  // Free order (total == 0) settles immediately
  if (totals.totalKes === 0) {
    const [freePayment] = await db
      .insert(s.payments)
      .values({
        orderId: order!.id,
        provider: "mock",
        method: "free",
        status: "pending",
        amountKes: 0,
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

  if (method === "mpesa") {
    const stk = await initiateMpesaStkPush({
      reference,
      phoneNormalized: normalizedPhone!,
      amountKes: totals.totalKes,
      orderNumber: order!.number,
    });

    const [payment] = await db
      .insert(s.payments)
      .values({
        orderId: order!.id,
        provider: stk.provider,
        method: "mpesa",
        status: stk.ok ? "pending" : "failed",
        amountKes: totals.totalKes,
        reference,
        providerRef: stk.providerRef || reference,
        phone: normalizedPhone,
        failureReason: stk.ok ? null : stk.message,
      })
      .returning();

    if (!stk.ok) {
      return NextResponse.json({ error: stk.message, paymentId: payment!.id }, { status: 400 });
    }

    return NextResponse.json({
      orderId: order!.id,
      orderNumber: order!.number,
      paymentId: payment!.id,
      provider: stk.provider,
      method: "mpesa",
      status: "pending",
      message: stk.message,
    });
  }

  // Card payment via Paystack (or Sandbox)
  const card = await initiateCardPayment({
    reference,
    email: user.email,
    amountKes: totals.totalKes,
    orderId: order!.id,
  });

  const [payment] = await db
    .insert(s.payments)
    .values({
      orderId: order!.id,
      provider: card.provider,
      method: "card",
      status: card.ok ? "pending" : "failed",
      amountKes: totals.totalKes,
      reference,
      providerRef: reference,
    })
    .returning();

  if (!card.ok) {
    return NextResponse.json(
      { error: "Could not start card checkout. Please try M-Pesa or retry.", paymentId: payment!.id },
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
    authorizationUrl: card.authorizationUrl,
  });
}
