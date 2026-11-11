import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { site } from "@/content/site";
import { getDb, schema as s } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { checkRateLimit, clientIp } from "@/lib/security";

const schema = z.object({
  name: z.string().min(1, "Please enter your name.").max(120),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().min(6, "Please enter your phone number.").max(40),
  packageId: z.string().min(1).max(60),
  preferredDate: z.string().max(40).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  company_website: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(`bookings:${clientIp(req)}`, 8, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please check your booking details." },
      { status: 400 },
    );
  }
  if (parsed.data.company_website) {
    return NextResponse.json({ message: "Booking received." });
  }

  const cleanName = parsed.data.name.trim();
  const cleanEmail = parsed.data.email.toLowerCase().trim();
  const cleanPhone = parsed.data.phone.trim();
  const cleanDate = parsed.data.preferredDate ? String(parsed.data.preferredDate) : null;
  const cleanNotes = parsed.data.notes ? String(parsed.data.notes) : null;

  const db = await getDb();
  await db.insert(s.bookings).values({
    name: cleanName,
    email: cleanEmail,
    phone: cleanPhone,
    packageId: parsed.data.packageId,
    preferredDate: cleanDate,
    notes: cleanNotes,
  });

  await sendEmail({
    to: site.email,
    replyTo: cleanEmail,
    subject: `[Akwasuccess Booking] ${parsed.data.packageId} — from ${cleanName}`,
    html: `<p><strong>New consulting booking request on Akwasuccess:</strong></p>
<ul>
  <li><strong>Name:</strong> ${cleanName}</li>
  <li><strong>Email:</strong> ${cleanEmail}</li>
  <li><strong>Phone:</strong> ${cleanPhone}</li>
  <li><strong>Package:</strong> ${parsed.data.packageId}</li>
  <li><strong>Preferred Date:</strong> ${cleanDate ?? "Not specified"}</li>
</ul>
<p><strong>Notes:</strong></p>
<p style="white-space:pre-wrap;">${cleanNotes ?? "None"}</p>`,
    text: `New consulting booking request on Akwasuccess:\n\nName: ${cleanName}\nEmail: ${cleanEmail}\nPhone: ${cleanPhone}\nPackage: ${parsed.data.packageId}\nPreferred Date: ${cleanDate ?? "Not specified"}\n\nNotes:\n${cleanNotes ?? "None"}`,
  });

  return NextResponse.json({
    message:
      "Booking request received! We will confirm your session slot by email and WhatsApp within one working day.",
  });
}
