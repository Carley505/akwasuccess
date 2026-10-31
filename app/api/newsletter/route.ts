import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getDb, schema as s } from "@/lib/db";
import { sendNewsletterWelcomeEmail } from "@/lib/email";
import { checkRateLimit, clientIp } from "@/lib/security";

const bodySchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  source: z.string().max(64).optional(),
  company_website: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(`newsletter:${clientIp(req)}`, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a minute and try again." },
      { status: 429 },
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid email address." },
      { status: 400 },
    );
  }

  if (parsed.data.company_website) {
    return NextResponse.json({ message: "Subscribed." });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const token = crypto.randomBytes(16).toString("hex");
  const db = await getDb();

  await db
    .insert(s.subscribers)
    .values({
      email,
      status: "confirmed",
      source: parsed.data.source ?? "site",
      token,
      confirmedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: s.subscribers.email,
      set: { status: "confirmed", confirmedAt: new Date() },
    });

  await sendNewsletterWelcomeEmail(email, token);

  return NextResponse.json({
    message:
      "Thank you! We have sent the free Cryptocurrency Safety Checklist (PDF) to your email.",
  });
}
