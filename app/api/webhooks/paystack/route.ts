import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema as s } from "@/lib/db";
import {
  isPaystackAmountValid,
  settleOrderPayment,
  verifyPaystackSignature,
} from "@/lib/payments";

/**
 * Paystack webhook handler (HMAC-SHA512 signature verified, idempotent).
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get("x-paystack-signature");

  if (!verifyPaystackSignature(rawBody, sig)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as {
    event?: string;
    data?: {
      id?: number | string;
      reference?: string;
      status?: string;
      amount?: number;
      currency?: string;
    };
  };

  const ref = payload.data?.reference;
  if (!ref) {
    return NextResponse.json({ received: true });
  }

  const db = await getDb();
  const [payment] = await db
    .select()
    .from(s.payments)
    .where(eq(s.payments.reference, ref));

  if (!payment) {
    return NextResponse.json({ received: true });
  }

  // Only trust a success whose amount and currency match what we charged.
  const paidInFull = isPaystackAmountValid(
    payment.amountCents,
    Number(payload.data?.amount ?? 0),
    String(payload.data?.currency ?? ""),
    payment.providerRef,
  );
  const succeeded =
    payload.event === "charge.success" && payload.data?.status === "success" && paidInFull;
  await settleOrderPayment({
    paymentId: payment.id,
    dedupeKey: `paystack:${ref}:${payload.event ?? "event"}`,
    provider: "paystack",
    outcome: succeeded ? "succeeded" : "failed",
    receiptNumber: payload.data?.id ? String(payload.data.id) : ref,
    failureReason: succeeded
      ? undefined
      : paidInFull
        ? "Card transaction was not completed."
        : "Card transaction amount or currency did not match the order.",
    rawPayload: payload,
  });

  return NextResponse.json({ received: true });
}
