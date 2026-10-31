import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getDb, schema as s } from "@/lib/db";
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

  const db = await getDb();
  await db.insert(s.quoteRequests).values({
    name: parsed.data.name.trim(),
    phone: parsed.data.phone.trim(),
    email: parsed.data.email ? parsed.data.email.trim() : null,
    location: parsed.data.location.trim(),
    serviceType: parsed.data.serviceType,
    description: parsed.data.description.trim(),
    photoKeys: parsed.data.photos ?? [],
  });

  return NextResponse.json({
    message:
      "Quote request received! We will review your electrical job details and contact you within one working day.",
  });
}
