import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { site } from "@/content/site";
import { getDb, schema as s } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { checkRateLimit, clientIp } from "@/lib/security";

const schema = z.object({
  name: z.string().min(1, "Please enter your name.").max(120),
  phone: z.string().min(6, "Please enter a valid phone number.").max(40),
  email: z.string().email().optional().or(z.literal("")),
  location: z.string().min(2, "Please enter the job location.").max(160),
  serviceType: z.string().min(1).max(80),
  description: z.string().min(5, "Please describe the work needed.").max(4000),
  photos: z.array(z.string()).max(3).optional(),
  company_website: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(`quotes:${clientIp(req)}`, 8, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please check your quote details." },
      { status: 400 },
    );
  }
  if (parsed.data.company_website) {
    return NextResponse.json({ message: "Quote request received." });
  }

  const cleanName = parsed.data.name.trim();
  const cleanPhone = parsed.data.phone.trim();
  const cleanEmail = parsed.data.email ? parsed.data.email.trim() : null;
  const cleanLocation = parsed.data.location.trim();
  const cleanDescription = parsed.data.description.trim();

  const db = await getDb();
  await db.insert(s.quoteRequests).values({
    name: cleanName,
    phone: cleanPhone,
    email: cleanEmail,
    location: cleanLocation,
    serviceType: parsed.data.serviceType,
    description: cleanDescription,
    photoKeys: parsed.data.photos ?? [],
  });

  await sendEmail({
    to: site.email,
    replyTo: cleanEmail ?? undefined,
    subject: `[Akwasuccess Quote] ${parsed.data.serviceType} — from ${cleanName}`,
    html: `<p><strong>New electrical quote request on Akwasuccess:</strong></p>
<ul>
  <li><strong>Name:</strong> ${cleanName}</li>
  <li><strong>Phone:</strong> ${cleanPhone}</li>
  <li><strong>Email:</strong> ${cleanEmail ?? "Not provided"}</li>
  <li><strong>Location:</strong> ${cleanLocation}</li>
  <li><strong>Service Type:</strong> ${parsed.data.serviceType}</li>
</ul>
<p><strong>Description:</strong></p>
<p style="white-space:pre-wrap;">${cleanDescription}</p>`,
    text: `New electrical quote request on Akwasuccess:\n\nName: ${cleanName}\nPhone: ${cleanPhone}\nEmail: ${cleanEmail ?? "Not provided"}\nLocation: ${cleanLocation}\nService Type: ${parsed.data.serviceType}\n\nDescription:\n${cleanDescription}`,
  });

  return NextResponse.json({
    message:
      "Quote request received! We will review your electrical job details and contact you within one working day.",
  });
}
