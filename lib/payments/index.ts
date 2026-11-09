import "server-only";
import crypto from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { getDb, schema as s } from "@/lib/db";
import { findOrCreateUser, issueMagicLoginToken } from "@/lib/auth";
import { createSignedDownloadToken } from "@/lib/storage";
import { sendOrderReceiptEmail } from "@/lib/email";
import { markWooOrderPaid } from "@/lib/woocommerce";
import { absoluteUrl } from "@/lib/utils";

/**
 * True when the local payment sandbox may be used. Without live card keys the
 * sandbox instantly "approves" payments, so it must NEVER be reachable in
 * production unless the owner explicitly opts in with ALLOW_PAYMENT_SANDBOX=true.
 */
export function isPaymentSandboxAllowed() {
  return process.env.NODE_ENV !== "production" || process.env.ALLOW_PAYMENT_SANDBOX === "true";
}

/**
 * Initiates a Paystack card checkout in USD when PAYSTACK_SECRET_KEY is set
 * (returning both `accessCode` for the seamless in-site Paystack inline popup
 * and `authorizationUrl` fallback), or returns a local sandbox mode when live
 * keys have not been added yet.
 */
export async function initiateCardPayment(opts: {
  reference: string;
  email: string;
  amountCents: number;
  orderId: string;
  wooOrderId?: number | null;
}): Promise<{
  ok: boolean;
  provider: "paystack" | "mock";
  authorizationUrl: string;
  accessCode?: string;
  publicKey?: string;
}> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
  const callbackUrl = absoluteUrl(`/checkout/order/${opts.orderId}`);

  if (!secret) {
    if (!isPaymentSandboxAllowed()) {
      return { ok: false, provider: "mock", authorizationUrl: "" };
    }
    return {
      ok: true,
      provider: "mock",
      authorizationUrl: callbackUrl,
    };
  }

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      authorization: `Bearer ${secret}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email: opts.email,
      amount: Math.round(opts.amountCents), // USD, in cents
      currency: "USD",
      reference: opts.reference,
      callback_url: callbackUrl,
      metadata: {
        order_id: opts.wooOrderId ?? opts.orderId,
        akwa_order_id: opts.orderId,
        woo_order_id: opts.wooOrderId ?? null,
      },
    }),
  });
  const data = (await res.json()) as {
    status?: boolean;
    data?: { authorization_url?: string; access_code?: string; reference?: string };
  };
  if (!res.ok || !data.status || !data.data?.authorization_url) {
    return { ok: false, provider: "paystack", authorizationUrl: "" };
  }
  return {
    ok: true,
    provider: "paystack",
    authorizationUrl: data.data.authorization_url,
    accessCode: data.data.access_code,
    publicKey: publicKey || undefined,
  };
}

export async function verifyPaystackTransaction(reference: string): Promise<{
  ok: boolean;
  status: string;
  amountCents: number;
  currency: string;
  transactionId?: string;
  raw?: unknown;
}> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !reference) {
    return { ok: false, status: "unconfigured", amountCents: 0, currency: "" };
  }
  try {
    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          authorization: `Bearer ${secret}`,
          "content-type": "application/json",
        },
        cache: "no-store",
      },
    );
    const json = (await res.json()) as {
      status?: boolean;
      data?: {
        id?: number | string;
        status?: string;
        amount?: number;
        currency?: string;
        reference?: string;
      };
    };
    const d = json.data;
    if (!res.ok || !json.status || !d) {
      return { ok: false, status: "verify_failed", amountCents: 0, currency: "", raw: json };
    }
    return {
      ok: d.status === "success",
      status: d.status ?? "unknown",
      amountCents: Number(d.amount ?? 0),
      currency: String(d.currency ?? "").toUpperCase(),
      transactionId: d.id ? String(d.id) : reference,
      raw: json,
    };
  } catch {
    return { ok: false, status: "network_error", amountCents: 0, currency: "" };
  }
}

export function verifyPaystackSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Verifies that a Paystack payment amount and currency match the expected USD
 * cents on the order.
 */
export function isPaystackAmountValid(
  expectedAmountCents: number,
  actualAmountCents: number,
  actualCurrency: string,
): boolean {
  return (
    actualCurrency.toUpperCase() === "USD" &&
    Math.round(actualAmountCents) === Math.round(expectedAmountCents)
  );
}

/**
 * Idempotently settles a payment, marks the local & WooCommerce orders paid,
 * grants entitlements (including expanding bundle items), and emails the
 * receipt + 4-hour timed download links.
 */
export async function settleOrderPayment(opts: {
  paymentId: string;
  dedupeKey: string;
  provider: "paystack" | "mock";
  outcome: "succeeded" | "failed" | "timeout";
  receiptNumber?: string;
  failureReason?: string;
  rawPayload?: unknown;
}) {
  const db = await getDb();

  // 1. Idempotency check via payment_events.dedupeKey
  const [existingEvent] = await db
    .select()
    .from(s.paymentEvents)
    .where(eq(s.paymentEvents.dedupeKey, opts.dedupeKey));
  if (existingEvent) {
    return { alreadyProcessed: true };
  }

  const [payment] = await db
    .select()
    .from(s.payments)
    .where(eq(s.payments.id, opts.paymentId));
  if (!payment) return { alreadyProcessed: false, error: "Payment not found" };

  await db.insert(s.paymentEvents).values({
    paymentId: payment.id,
    provider: opts.provider,
    type: opts.outcome,
    dedupeKey: opts.dedupeKey,
    payload: opts.rawPayload ?? {},
  });

  if (opts.outcome !== "succeeded") {
    await db
      .update(s.payments)
      .set({
        status: opts.outcome,
        failureReason: opts.failureReason ?? "Payment was not completed.",
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(s.payments.id, payment.id));
    return { alreadyProcessed: false, status: opts.outcome };
  }

  const receiptNumber = opts.receiptNumber ?? `AKWA${Date.now().toString().slice(-6)}`;

  await db
    .update(s.payments)
    .set({
      status: "succeeded",
      receiptNumber,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(s.payments.id, payment.id));

  const [order] = await db.select().from(s.orders).where(eq(s.orders.id, payment.orderId));
  if (!order) return { alreadyProcessed: false };

  const user = await findOrCreateUser({
    email: order.email,
    name: order.name,
    phone: order.phone,
    marketingConsent: order.marketingConsent,
  });

  // Mark the authoritative WooCommerce order paid & completed so Woo grants download permissions
  let wooOrderKey = order.wooOrderKey;
  if (order.wooOrderId) {
    const updatedWoo = await markWooOrderPaid({
      wooOrderId: order.wooOrderId,
      transactionId: receiptNumber,
      reference: payment.reference,
    });
    if (updatedWoo?.order_key) {
      wooOrderKey = updatedWoo.order_key;
    }
  }

  await db
    .update(s.orders)
    .set({
      userId: user.id,
      status: "paid",
      wooOrderKey,
      paidAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(s.orders.id, order.id));

  const items = await db
    .select()
    .from(s.orderItems)
    .where(eq(s.orderItems.orderId, order.id));

  const prodIds = items.map((i) => i.productId);
  const prods =
    prodIds.length > 0
      ? await db.select().from(s.products).where(inArray(s.products.id, prodIds))
      : [];

  // Expand any bundle into its constituent product IDs as well
  const entitlementProductIds = new Set<string>();
  for (const p of prods) {
    entitlementProductIds.add(p.id);
    for (const childId of p.bundleItems ?? []) {
      entitlementProductIds.add(childId);
    }
  }

  const emailItems: { title: string; downloadUrl?: string; accessUrl?: string }[] = [];

  for (const productId of entitlementProductIds) {
    await db
      .insert(s.entitlements)
      .values({
        userId: user.id,
        productId,
        orderId: order.id,
        source: "purchase",
      })
      .onConflictDoUpdate({
        target: [s.entitlements.userId, s.entitlements.productId],
        set: { orderId: order.id, revokedAt: null },
      });

    const [ent] = await db
      .select()
      .from(s.entitlements)
      .where(and(eq(s.entitlements.userId, user.id), eq(s.entitlements.productId, productId)));

    const [prod] = await db.select().from(s.products).where(eq(s.products.id, productId));
    const [file] = await db
      .select()
      .from(s.productFiles)
      .where(eq(s.productFiles.productId, productId));

    let downloadUrl: string | undefined;
    if (ent && file) {
      const token = await createSignedDownloadToken({
        entitlementId: ent.id,
        productFileId: file.id,
        userId: user.id,
        buyerEmail: user.email,
        orderNumber: order.number,
      });
      downloadUrl = absoluteUrl(`/api/download/${token}`);
    }
    if (prod) {
      const accessUrl =
        prod.type === "course" || prod.type === "tutorial"
          ? absoluteUrl(`/account/courses/${prod.slug}?order=${order.id}`)
          : undefined;
      emailItems.push({ title: prod.title, downloadUrl, accessUrl });
    }
  }

  if (!order.receiptSentAt) {
    const rawLogin = await issueMagicLoginToken(user.email, "/account/library");
    const magicLinkUrl = absoluteUrl(`/api/auth/verify?token=${encodeURIComponent(rawLogin)}`);
    await sendOrderReceiptEmail({
      email: user.email,
      orderNumber: order.number,
      totalCents: order.totalCents,
      items: emailItems,
      magicLinkUrl,
    });
    await db
      .update(s.orders)
      .set({ receiptSentAt: new Date() })
      .where(eq(s.orders.id, order.id));
  }

  return { alreadyProcessed: false, status: "succeeded" };
}
