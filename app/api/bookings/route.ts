import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getDb, schema as s } from "@/lib/db";
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

  const db = await getDb();
  await db.insert(s.bookings).values({
    name: parsed.data.name.trim(),
    email: parsed.data.email.toLowerCase().trim(),
    phone: parsed.data.phone.trim(),
    packageId: parsed.data.packageId,
    preferredDate: parsed.data.preferredDate ? String(parsed.data.preferredDate) : null,
    notes: parsed.data.notes ? String(parsed.data.notes) : null,
  });

  return NextResponse.json({
    message:
      "Booking request received! We will confirm your session slot by email and WhatsApp within one working day.",
  });
}
