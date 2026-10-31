import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema as s } from "@/lib/db";
import { applyCoupon } from "@/lib/pricing";

const schema = z.object({
  code: z.string().min(1).max(40),
  subtotalKes: z.number().int().min(0),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a coupon code." }, { status: 400 });
  }

  const db = await getDb();
  const code = parsed.data.code.toUpperCase().trim();
  const [coupon] = await db.select().from(s.coupons).where(eq(s.coupons.code, code));

  const res = applyCoupon(coupon, parsed.data.subtotalKes);
  if (!res.ok) {
    return NextResponse.json({ error: res.reason }, { status: 400 });
  }

  return NextResponse.json({
    code,
    discountKes: res.discountKes,
  });
}
