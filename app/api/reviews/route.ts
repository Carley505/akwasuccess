import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema as s } from "@/lib/db";
import { checkRateLimit, clientIp } from "@/lib/security";

const schema = z.object({
  productId: z.string().uuid(),
  email: z.string().email("Please enter the email address from your order."),
  displayName: z.string().min(1, "Please enter a display name.").max(80),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional().nullable(),
  body: z.string().min(5, "Please write a brief review.").max(2000),
  company_website: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(`reviews:${clientIp(req)}`, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many submissions." }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please check your review." },
      { status: 400 },
    );
  }
  if (parsed.data.company_website) {
    return NextResponse.json({ message: "Received." });
  }

  const db = await getDb();
  const [user] = await db
    .select()
    .from(s.users)
    .where(eq(s.users.email, parsed.data.email.toLowerCase().trim()));

  if (!user) {
    return NextResponse.json(
      { error: "Only verified buyers who purchased this item can leave a review." },
      { status: 403 },
    );
  }

  const [ent] = await db
    .select()
    .from(s.entitlements)
    .where(
      and(
        eq(s.entitlements.userId, user.id),
        eq(s.entitlements.productId, parsed.data.productId),
      ),
    );

  if (!ent) {
    return NextResponse.json(
      { error: "We could not find a purchase of this item for that email address." },
      { status: 403 },
    );
  }

  await db.insert(s.reviews).values({
    productId: parsed.data.productId,
    userId: user.id,
    rating: parsed.data.rating,
    title: parsed.data.title ? String(parsed.data.title).trim() : null,
    body: parsed.data.body.trim(),
    displayName: parsed.data.displayName.trim(),
    verified: true,
    status: "pending",
  });

  return NextResponse.json({
    message: "Thank you! Your verified buyer review has been submitted for moderation.",
  });
}
