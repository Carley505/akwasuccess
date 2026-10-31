/**
 * Shared helper for CLI scripts (migrate/seed). Mirrors lib/db/index.ts without
 * the `server-only` guard so it can run under tsx.
 */
import fs from "node:fs";
import path from "node:path";
import type { Database } from "../lib/db";
import * as schema from "../lib/db/schema";

export async function openDb(): Promise<{ db: Database; close: () => Promise<void>; kind: string }> {
  const url = process.env.DATABASE_URL ?? "";
  if (url && !url.startsWith("pglite:")) {
    const postgres = (await import("postgres")).default;
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const client = postgres(url, { max: 1, prepare: false });
    return { db: drizzle(client, { schema }), close: () => client.end(), kind: "postgres" };
  }
  const dir = url.startsWith("pglite:") ? url.slice(7) : path.join(process.cwd(), ".data", "pglite");
  if (dir !== "memory") {
    fs.mkdirSync(dir, { recursive: true });
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const client = new PGlite(dir);
  return {
    db: drizzle(client, { schema }) as unknown as Database,
    close: () => client.close(),
    kind: "pglite",
  };
}
