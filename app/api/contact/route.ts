import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { site } from "@/content/site";
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

  const cleanName = parsed.data.name.trim();
  const cleanEmail = parsed.data.email.toLowerCase().trim();
  const cleanPhone = parsed.data.phone ? String(parsed.data.phone).trim() : null;
  const cleanMessage = parsed.data.message.trim();

  const db = await getDb();
  await db.insert(s.contactMessages).values({
    name: cleanName,
    email: cleanEmail,
    phone: cleanPhone,
    topic: parsed.data.topic,
    message: cleanMessage,
  });

  await Promise.all([
    sendEmail({
      to: site.email,
      replyTo: cleanEmail,
      subject: `[Akwasuccess Contact] ${parsed.data.topic} — from ${cleanName}`,
      html: `<p><strong>New contact message received on Akwasuccess:</strong></p>
<ul>
  <li><strong>Name:</strong> ${cleanName}</li>
  <li><strong>Email:</strong> <a href="mailto:${cleanEmail}">${cleanEmail}</a></li>
  <li><strong>Phone:</strong> ${cleanPhone ?? "Not provided"}</li>
  <li><strong>Topic:</strong> ${parsed.data.topic}</li>
</ul>
<p><strong>Message:</strong></p>
<p style="white-space:pre-wrap;">${cleanMessage}</p>`,
      text: `New contact message on Akwasuccess:\n\nName: ${cleanName}\nEmail: ${cleanEmail}\nPhone: ${cleanPhone ?? "Not provided"}\nTopic: ${parsed.data.topic}\n\nMessage:\n${cleanMessage}`,
    }),
    sendEmail({
      to: cleanEmail,
      subject: "We received your message — Akwasuccess",
      html: `<p>Hello ${cleanName},</p><p>Thank you for contacting Akwasuccess regarding <strong>${parsed.data.topic}</strong>. We usually reply within one working day.</p>`,
      text: `Hello ${cleanName},\nThank you for contacting Akwasuccess regarding ${parsed.data.topic}. We usually reply within one working day.`,
    }),
  ]);

  return NextResponse.json({
    message: "Thank you! We have received your message and sent a confirmation to your email.",
  });
}
