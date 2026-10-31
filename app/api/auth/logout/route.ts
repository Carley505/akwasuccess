import { NextResponse, type NextRequest } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  await clearSessionCookie();
  return NextResponse.redirect(new URL("/account", req.url), { status: 303 });
}
