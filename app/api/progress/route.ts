import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema as s } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

const schema = z.object({
  itemId: z.string().min(1).max(120),
  kind: z.enum(["lesson", "path"]).default("lesson"),
  completed: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ stored: "local-only" });
  }
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const db = await getDb();
  if (parsed.data.completed) {
    await db
      .insert(s.progress)
      .values({
        userId: user.id,
        itemId: parsed.data.itemId,
        kind: parsed.data.kind,
      })
      .onConflictDoNothing();
  } else {
    await db
      .delete(s.progress)
      .where(
        and(eq(s.progress.userId, user.id), eq(s.progress.itemId, parsed.data.itemId)),
      );
  }

  return NextResponse.json({ stored: "db" });
}
