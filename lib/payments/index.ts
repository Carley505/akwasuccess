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

let cachedUsdToNgnRate: { rate: number; fetchedAt: number } | null = null;

async function getUsdToNgnRate(): Promise<number> {
  const envRate = Number(process.env.PAYSTACK_USD_NGN_RATE);
  if (Number.isFinite(envRate) && envRate > 0) return envRate;

  const now = Date.now();
  if (cachedUsdToNgnRate && now - cachedUsdToNgnRate.fetchedAt < 60 * 60 * 1000) {
    return cachedUsdToNgnRate.rate;
  }
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      signal: AbortSignal.timeout(3_500),
      cache: "no-store",
    });
    if (res.ok) {
      const json = (await res.json()) as { rates?: { NGN?: number } };
      const rate = Number(json.rates?.NGN);
      if (Number.isFinite(rate) && rate > 100) {
        cachedUsdToNgnRate = { rate, fetchedAt: now };
        return rate;
      }
    }
  } catch {
    // Use fallback rate if live FX lookup times out
  }
  return 1600;
}

/**
 * Initiates a Paystack card checkout in USD when PAYSTACK_SECRET_KEY is set
 * (automatically falling back to the merchant's NGN currency with live FX
 * conversion when USD settlement is not yet enabled on the Paystack account),
 * or returns a local sandbox mode when live keys have not been added yet.
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
  chargedCurrency?: string;
  chargedAmountSubunits?: number;
  errorMessage?: string;
}> {
  const secret = (process.env.PAYSTACK_SECRET_KEY ?? "").replace(/\s+/g, "");
  const publicKey = (process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? "").replace(/\s+/g, "");
  const callbackUrl = absoluteUrl(`/checkout/order/${opts.orderId}`);
  const usdCents = Math.round(opts.amountCents);

  if (!secret) {
    if (!isPaymentSandboxAllowed()) {
      return { ok: false, provider: "mock", authorizationUrl: "" };
    }
    return {
      ok: true,
      provider: "mock",
      authorizationUrl: callbackUrl,
      chargedCurrency: "USD",
      chargedAmountSubunits: usdCents,
    };
  }

  type PaystackInitResponse = {
    status?: boolean;
    message?: string;
    code?: string;
    data?: { authorization_url?: string; access_code?: string; reference?: string };
  };

  async function callPaystackInit(currency: string | undefined, amountSubunits: number) {
    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        authorization: `Bearer ${secret}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: opts.email,
        amount: amountSubunits,
        ...(currency ? { currency } : {}),
        reference: opts.reference,
        callback_url: callbackUrl,
        metadata: {
          order_id: opts.wooOrderId ?? opts.orderId,
          akwa_order_id: opts.orderId,
          woo_order_id: opts.wooOrderId ?? null,
          expected_usd_cents: usdCents,
          charged_currency: currency ?? "NGN",
          charged_subunits: amountSubunits,
        },
      }),
    });
    const data = (await res.json().catch(() => ({}))) as PaystackInitResponse;
    return { ok: res.ok, data };
  }

  // 1. Try initializing in USD first
  const usdAttempt = await callPaystackInit("USD", usdCents);
  if (usdAttempt.ok && usdAttempt.data.status && usdAttempt.data.data?.authorization_url) {
    return {
      ok: true,
      provider: "paystack",
      authorizationUrl: usdAttempt.data.data.authorization_url,
      accessCode: usdAttempt.data.data.access_code,
      publicKey: publicKey || undefined,
      chargedCurrency: "USD",
      chargedAmountSubunits: usdCents,
    };
  }

  // 2. If merchant's Paystack integration only supports NGN (unsupported_currency),
  // convert USD cents -> NGN kobo using the live exchange rate so card payments go through immediately.
  if (
    usdAttempt.data.code === "unsupported_currency" ||
    (usdAttempt.data.message ?? "").toLowerCase().includes("currency")
  ) {
    const rate = await getUsdToNgnRate();
    const ngnKobo = Math.max(100, Math.round(usdCents * rate));
    const ngnAttempt = await callPaystackInit(undefined, ngnKobo);
    if (ngnAttempt.ok && ngnAttempt.data.status && ngnAttempt.data.data?.authorization_url) {
      return {
        ok: true,
        provider: "paystack",
        authorizationUrl: ngnAttempt.data.data.authorization_url,
        accessCode: ngnAttempt.data.data.access_code,
        publicKey: publicKey || undefined,
        chargedCurrency: "NGN",
        chargedAmountSubunits: ngnKobo,
      };
    }
    return {
      ok: false,
      provider: "paystack",
      authorizationUrl: "",
      errorMessage: ngnAttempt.data.message,
    };
  }

  return {
    ok: false,
    provider: "paystack",
    authorizationUrl: "",
    errorMessage: usdAttempt.data.message,
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
  const secret = (process.env.PAYSTACK_SECRET_KEY ?? "").replace(/\s+/g, "");
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
  const secret = (process.env.PAYSTACK_SECRET_KEY ?? "").replace(/\s+/g, "");
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Verifies that a Paystack payment amount and currency match either the
 * expected USD cents on the order OR the converted settlement currency/amount
 * stored in `providerRef` (e.g. `NGN:16640000`).
 */
export function isPaystackAmountValid(
  expectedAmountCents: number,
  actualAmountCents: number,
  actualCurrency: string,
  providerRef?: string | null,
): boolean {
  const normCurrency = actualCurrency.toUpperCase();
  if (normCurrency === "USD" && Math.round(actualAmountCents) === Math.round(expectedAmountCents)) {
    return true;
  }
  if (providerRef && providerRef.includes(":")) {
    const [expectedCurr, expectedSubunitsStr] = providerRef.split(":");
    const expectedSubunits = Number(expectedSubunitsStr);
    if (
      expectedCurr &&
      normCurrency === expectedCurr.toUpperCase() &&
      Number.isFinite(expectedSubunits) &&
      Math.round(actualAmountCents) === Math.round(expectedSubunits)
    ) {
      return true;
    }
  }
  return false;
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
