import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { issueMagicLoginToken } from "@/lib/auth";
import { sendMagicLinkEmail } from "@/lib/email";
import { checkRateLimit, clientIp } from "@/lib/security";
import { absoluteUrl } from "@/lib/utils";

const schema = z.object({
  email: z.string().email("Please enter a valid email address."),
  redirectTo: z.string().max(120).optional(),
});

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(`magic:${clientIp(req)}`, 8, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many sign-in attempts. Please wait a minute and try again." },
      { status: 429 },
    );
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid email address." },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase().trim();
  const redirectTo = parsed.data.redirectTo?.startsWith("/")
    ? parsed.data.redirectTo
    : "/account";

  const rawToken = await issueMagicLoginToken(email, redirectTo);
  await sendMagicLinkEmail(email, rawToken);

  const isDev = process.env.NODE_ENV !== "production";

  return NextResponse.json({
    message:
      "We have sent a sign-in link to your email address. Click the link to open your account.",
    // In local dev/test without external SMTP, return the preview link so E2E and the owner can click right through.
    ...(isDev
      ? { devVerifyUrl: absoluteUrl(`/api/auth/verify?token=${encodeURIComponent(rawToken)}`) }
      : {}),
  });
}
