import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getDb, schema as s } from "@/lib/db";
import { checkRateLimit, clientIp } from "@/lib/security";

const schema = z.object({
  name: z.string().min(1, "Please enter your name or initials.").max(80),
  location: z.string().max(80).optional().nullable(),
  productUsed: z.string().max(160).optional().nullable(),
  quote: z.string().min(10, "Please write at least a short sentence.").max(1200),
  consent: z.boolean().refine((v) => v === true, "Consent is required to share your story."),
  company_website: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(`testimonials:${clientIp(req)}`, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many submissions." }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please check your submission." },
      { status: 400 },
    );
  }
  if (parsed.data.company_website) {
    return NextResponse.json({ message: "Thank you." });
  }

  const db = await getDb();
  await db.insert(s.testimonials).values({
    name: parsed.data.name.trim(),
    location: parsed.data.location ? String(parsed.data.location).trim() : null,
    productUsed: parsed.data.productUsed ? String(parsed.data.productUsed).trim() : null,
    quote: parsed.data.quote.trim(),
    consent: true,
    status: "pending",
  });

  return NextResponse.json({
    message:
      "Thank you for sharing your story! It has been queued for review and will appear once approved.",
  });
}
