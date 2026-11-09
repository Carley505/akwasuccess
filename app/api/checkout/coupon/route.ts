import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema as s } from "@/lib/db";
import { applyCoupon } from "@/lib/pricing";
import { validateWooCoupon } from "@/lib/woocommerce";

const schema = z.object({
  code: z.string().min(1).max(40),
  subtotalCents: z.number().int().min(0),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a coupon code." }, { status: 400 });
  }

  const code = parsed.data.code.toUpperCase().trim();
  const wooRes = await validateWooCoupon(code, parsed.data.subtotalCents);
  if (wooRes.found) {
    if (!wooRes.ok) {
      return NextResponse.json({ error: wooRes.reason }, { status: 400 });
    }
    return NextResponse.json({
      code: wooRes.code,
      discountCents: wooRes.discountCents,
    });
  }

  const db = await getDb();
  const [coupon] = await db.select().from(s.coupons).where(eq(s.coupons.code, code));

  const res = applyCoupon(coupon, parsed.data.subtotalCents);
  if (!res.ok) {
    return NextResponse.json({ error: res.reason }, { status: 400 });
  }

  return NextResponse.json({
    code,
    discountCents: res.discountCents,
  });
}
