import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema as s } from "@/lib/db";
import {
  isPaystackAmountValid,
  settleOrderPayment,
  verifyPaystackTransaction,
} from "@/lib/payments";

const verifySchema = z.object({
  paymentId: z.string().uuid().optional(),
  reference: z.string().min(1),
});

/**
 * Server-side Paystack transaction verification endpoint called after the
 * in-site Paystack inline popup completes.
 */
export async function POST(req: NextRequest) {
  const parsed = verifySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payment reference." }, { status: 400 });
  }

  const { paymentId, reference } = parsed.data;
  const db = await getDb();

  const [payment] = paymentId
    ? await db.select().from(s.payments).where(eq(s.payments.id, paymentId))
    : await db.select().from(s.payments).where(eq(s.payments.reference, reference));

  if (!payment) {
    return NextResponse.json({ error: "Payment record not found." }, { status: 404 });
  }

  if (payment.status === "succeeded") {
    return NextResponse.json({
      ok: true,
      status: "succeeded",
      orderId: payment.orderId,
    });
  }

  const verified = await verifyPaystackTransaction(payment.reference);
  const amountMatches = isPaystackAmountValid(
    payment.amountCents,
    verified.amountCents,
    verified.currency,
  );
  const succeeded = verified.ok && amountMatches;

  await settleOrderPayment({
    paymentId: payment.id,
    dedupeKey: `paystack:verify:${payment.reference}:${succeeded ? "succeeded" : verified.status}`,
    provider: "paystack",
    outcome: succeeded ? "succeeded" : "failed",
    receiptNumber: verified.transactionId ?? payment.reference,
    failureReason: succeeded
      ? undefined
      : amountMatches
        ? "Card transaction was not completed."
        : "Card transaction amount or currency did not match the order.",
    rawPayload: verified.raw ?? {},
  });

  if (!succeeded) {
    return NextResponse.json(
      {
        ok: false,
        status: "failed",
        error: "Payment could not be verified. No charge was confirmed.",
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    status: "succeeded",
    orderId: payment.orderId,
  });
}
