import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getDb, schema as s } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { checkRateLimit, clientIp } from "@/lib/security";

const schema = z.object({
  name: z.string().min(1, "Please enter your name.").max(120),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().max(40).optional().nullable(),
  topic: z.string().min(1).max(60),
  message: z.string().min(5, "Please enter a slightly longer message.").max(4000),
  company_website: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(`contact:${clientIp(req)}`, 8, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many messages. Please wait a minute and try again." },
      { status: 429 },
    );
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please check your form details." },
      { status: 400 },
    );
  }

  if (parsed.data.company_website) {
    return NextResponse.json({ message: "Message received." });
  }

  const db = await getDb();
  await db.insert(s.contactMessages).values({
    name: parsed.data.name.trim(),
    email: parsed.data.email.toLowerCase().trim(),
    phone: parsed.data.phone ? String(parsed.data.phone).trim() : null,
    topic: parsed.data.topic,
    message: parsed.data.message.trim(),
  });

  await sendEmail({
    to: parsed.data.email.toLowerCase().trim(),
    subject: "We received your message — Akwasuccess",
    html: `<p>Hello ${parsed.data.name},</p><p>Thank you for contacting Akwasuccess regarding <strong>${parsed.data.topic}</strong>. We usually reply within one working day.</p>`,
    text: `Hello ${parsed.data.name},\nThank you for contacting Akwasuccess regarding ${parsed.data.topic}. We usually reply within one working day.`,
  });

  return NextResponse.json({
    message: "Thank you! We have received your message and sent a confirmation to your email.",
  });
}
