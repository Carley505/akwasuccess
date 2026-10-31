import "server-only";
import crypto from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { getDb, schema as s } from "@/lib/db";
import { findOrCreateUser, issueMagicLoginToken } from "@/lib/auth";
import { createSignedDownloadToken } from "@/lib/storage";
import { sendOrderReceiptEmail } from "@/lib/email";
import { absoluteUrl } from "@/lib/utils";

export type StkPushResult = {
  ok: boolean;
  provider: "mpesa" | "mock";
  providerRef: string;
  message: string;
};

/**
 * Initiates a Safaricom Daraja STK Push when MPESA_CONSUMER_KEY is set,
 * or falls back to the built-in sandbox simulator so local/staging environments
 * can test the full 60–90s polling, success, wrong-PIN, and timeout paths.
 */
export async function initiateMpesaStkPush(opts: {
  reference: string;
  phoneNormalized: string; // 2547xxxxxxxx
  amountKes: number;
  orderNumber: string;
}): Promise<StkPushResult> {
  const key = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;
  const passkey = process.env.MPESA_PASSKEY;
  const shortcode = process.env.MPESA_SHORTCODE || "174379";

  if (!key || !secret || !passkey) {
    return {
      ok: true,
      provider: "mock",
      providerRef: `ws_CO_${Date.now()}_${opts.reference.slice(-6)}`,
      message:
        "Sandbox mode: Check your phone and enter your M-Pesa PIN (or use the Sandbox Simulator controls on screen).",
    };
  }

  const baseUrl =
    process.env.MPESA_ENV === "production"
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke";

  const auth = Buffer.from(`${key}:${secret}`).toString("base64");
  const tokenRes = await fetch(
    `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { authorization: `Basic ${auth}` } },
  );
  if (!tokenRes.ok) {
    return {
      ok: false,
      provider: "mpesa",
      providerRef: "",
      message: "Could not connect to M-Pesa right now. Please try again.",
    };
  }
  const { access_token } = (await tokenRes.json()) as { access_token: string };

  const timestamp = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 14);
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
  const callbackUrl =
    process.env.MPESA_CALLBACK_URL || absoluteUrl("/api/webhooks/mpesa");

  const stkRes = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${access_token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.max(1, Math.round(opts.amountKes)),
      PartyA: opts.phoneNormalized,
      PartyB: shortcode,
      PhoneNumber: opts.phoneNormalized,
      CallBackURL: callbackUrl,
      AccountReference: `AKWA-${opts.orderNumber}`,
      TransactionDesc: `Akwasuccess Order ${opts.orderNumber}`,
    }),
  });

  const stkData = (await stkRes.json()) as {
    ResponseCode?: string;
    CheckoutRequestID?: string;
    CustomerMessage?: string;
    errorMessage?: string;
  };

  if (!stkRes.ok || stkData.ResponseCode !== "0" || !stkData.CheckoutRequestID) {
    return {
      ok: false,
      provider: "mpesa",
      providerRef: "",
      message:
        stkData.CustomerMessage ||
        stkData.errorMessage ||
        "M-Pesa could not send the PIN prompt. Please check your number and retry.",
    };
  }

  return {
    ok: true,
    provider: "mpesa",
    providerRef: stkData.CheckoutRequestID,
    message: stkData.CustomerMessage || "Check your phone and enter your M-Pesa PIN.",
  };
}

/**
 * Initiates a Paystack card (or M-Pesa) checkout session when PAYSTACK_SECRET_KEY
 * is set, or returns a local sandbox redirect URL.
 */
export async function initiateCardPayment(opts: {
  reference: string;
  email: string;
  amountKes: number;
  orderId: string;
}): Promise<{ ok: boolean; provider: "paystack" | "mock"; authorizationUrl: string }> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const callbackUrl = absoluteUrl(`/checkout/order/${opts.orderId}`);

  if (!secret) {
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
      amount: Math.round(opts.amountKes * 100), // KES cents
      currency: "KES",
      reference: opts.reference,
      callback_url: callbackUrl,
    }),
  });
  const data = (await res.json()) as {
    status?: boolean;
    data?: { authorization_url?: string };
  };
  if (!res.ok || !data.status || !data.data?.authorization_url) {
    return { ok: false, provider: "paystack", authorizationUrl: "" };
  }
  return {
    ok: true,
    provider: "paystack",
    authorizationUrl: data.data.authorization_url,
  };
}

export function verifyPaystackSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

/**
 * Idempotently settles a payment, marks the order paid, grants entitlements
 * (including expanding bundle items), and emails the receipt + download links.
 */
export async function settleOrderPayment(opts: {
  paymentId: string;
  dedupeKey: string;
  provider: "mpesa" | "paystack" | "mock";
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

  await db
    .update(s.payments)
    .set({
      status: "succeeded",
      receiptNumber: opts.receiptNumber ?? `AKWA${Date.now().toString().slice(-6)}`,
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

  await db
    .update(s.orders)
    .set({
      userId: user.id,
      status: "paid",
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

  const emailItems: { title: string; downloadUrl?: string }[] = [];

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
      emailItems.push({ title: prod.title, downloadUrl });
    }
  }

  if (!order.receiptSentAt) {
    const rawLogin = await issueMagicLoginToken(user.email, "/account/library");
    const magicLinkUrl = absoluteUrl(`/api/auth/verify?token=${encodeURIComponent(rawLogin)}`);
    await sendOrderReceiptEmail({
      email: user.email,
      orderNumber: order.number,
      totalKes: order.totalKes,
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
