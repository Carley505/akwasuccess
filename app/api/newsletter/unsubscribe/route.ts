import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema as s } from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  if (token) {
    const db = await getDb();
    await db
      .update(s.subscribers)
      .set({ status: "unsubscribed" })
      .where(eq(s.subscribers.token, token));
  }
  return new NextResponse(
    `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribed | Akwasuccess</title></head><body style="font-family:sans-serif;max-width:480px;margin:48px auto;padding:16px;text-align:center;"><h1>You have been unsubscribed</h1><p>You will no longer receive newsletter emails from Akwasuccess.</p><p><a href="/" style="color:#0B6B3A;">Return to Akwasuccess</a></p></body></html>`,
    { headers: { "content-type": "text/html; charset=utf-8" } },
  );
}
