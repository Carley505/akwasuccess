import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import { getDb, schema as s } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const db = await getDb();
  const rows = await db.select().from(s.subscribers).orderBy(desc(s.subscribers.createdAt));

  const header = "email,status,source,created_at";
  const lines = rows.map(
    (r) =>
      `"${r.email.replace(/"/g, '""')}","${r.status}","${(r.source ?? "").replace(/"/g, '""')}","${r.createdAt.toISOString()}"`,
  );

  return new NextResponse([header, ...lines].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="akwasuccess-subscribers.csv"',
    },
  });
}
