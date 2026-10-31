import { NextResponse, type NextRequest } from "next/server";
import { consumeMagicLoginToken, setSessionCookie } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const result = token ? await consumeMagicLoginToken(token) : null;

  if (!result) {
    return NextResponse.redirect(new URL("/account?error=expired-link", req.url));
  }

  await setSessionCookie({
    userId: result.user.id,
    email: result.user.email,
    role: result.user.role,
  });

  const target = result.redirectTo.startsWith("/") ? result.redirectTo : "/account";
  return NextResponse.redirect(new URL(target, req.url));
}
