import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema as s } from "@/lib/db";
import { settleOrderPayment } from "@/lib/payments";

/**
 * Safaricom Daraja STK Push callback handler (Section 8.4 & 10).
 * Verifies optional webhook token and processes callbacks idempotently.
 */
export async function POST(req: NextRequest) {
  const expectedSecret = process.env.MPESA_WEBHOOK_SECRET;
  if (expectedSecret) {
    const provided = req.nextUrl.searchParams.get("secret") ?? req.headers.get("x-mpesa-secret");
    if (provided !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const body = (await req.json().catch(() => null)) as {
    Body?: {
      stkCallback?: {
        CheckoutRequestID?: string;
        ResultCode?: number;
        ResultDesc?: string;
        CallbackMetadata?: {
          Item?: { Name: string; Value?: string | number }[];
        };
      };
    };
  } | null;

  const cb = body?.Body?.stkCallback;
  if (!cb?.CheckoutRequestID) {
    return NextResponse.json({ error: "Malformed callback" }, { status: 400 });
  }

  const db = await getDb();
  const [payment] = await db
    .select()
    .from(s.payments)
    .where(eq(s.payments.providerRef, cb.CheckoutRequestID));

  if (!payment) {
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  const receiptItem = cb.CallbackMetadata?.Item?.find(
    (i) => i.Name === "MpesaReceiptNumber",
  );
  const receiptNumber = receiptItem?.Value ? String(receiptItem.Value) : undefined;
  const succeeded = cb.ResultCode === 0;

  await settleOrderPayment({
    paymentId: payment.id,
    dedupeKey: `mpesa:${cb.CheckoutRequestID}:${cb.ResultCode ?? "unknown"}`,
    provider: "mpesa",
    outcome: succeeded ? "succeeded" : "failed",
    receiptNumber,
    failureReason: succeeded ? undefined : (cb.ResultDesc || "M-Pesa payment was not completed."),
    rawPayload: body,
  });

  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
