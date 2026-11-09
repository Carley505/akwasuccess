import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema as s } from "@/lib/db";
import { isPaymentSandboxAllowed, settleOrderPayment } from "@/lib/payments";

type Params = Promise<{ id: string }>;

export async function GET(_req: NextRequest, { params }: { params: Params }) {
  const { id } = await params;
  const db = await getDb();
  const [payment] = await db.select().from(s.payments).where(eq(s.payments.id, id));
  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }
  const [order] = await db.select().from(s.orders).where(eq(s.orders.id, payment.orderId));

  return NextResponse.json({
    paymentId: payment.id,
    orderId: payment.orderId,
    orderNumber: order?.number,
    provider: payment.provider,
    method: payment.method,
    status: payment.status,
    failureReason: payment.failureReason,
    receiptNumber: payment.receiptNumber,
  });
}

const simSchema = z.object({
  action: z.enum(["succeed", "fail", "timeout"]),
});

/**
 * Local sandbox endpoint so development, staging and E2E tests can
 * deterministically settle a test card payment (success, failure or timeout).
 * Only permitted when payment.provider === "mock" AND the sandbox is allowed
 * (never in production unless ALLOW_PAYMENT_SANDBOX=true).
 */
export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { id } = await params;
  if (!isPaymentSandboxAllowed()) {
    return NextResponse.json({ error: "Simulation not available" }, { status: 403 });
  }
  const parsed = simSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const db = await getDb();
  const [payment] = await db.select().from(s.payments).where(eq(s.payments.id, id));
  if (!payment || payment.provider !== "mock") {
    return NextResponse.json({ error: "Simulation not available" }, { status: 403 });
  }

  const { action } = parsed.data;
  const outcome =
    action === "succeed" ? "succeeded" : action === "timeout" ? "timeout" : "failed";
  const reason =
    action === "fail"
      ? "The card payment was declined or cancelled."
      : action === "timeout"
        ? "The card payment timed out before it was completed."
        : undefined;

  await settleOrderPayment({
    paymentId: payment.id,
    dedupeKey: `sim:${payment.id}:${outcome}`,
    provider: "mock",
    outcome,
    receiptNumber: action === "succeed" ? `SIM${Date.now().toString().slice(-6)}` : undefined,
    failureReason: reason,
    rawPayload: { simulated: action },
  });

  return NextResponse.json({ status: outcome, failureReason: reason });
}
