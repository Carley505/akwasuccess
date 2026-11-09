/**
 * Shared helper for CLI scripts (migrate/seed). Mirrors lib/db/index.ts without
 * the `server-only` guard so it can run under tsx.
 */
import fs from "node:fs";
import path from "node:path";
import type { Database } from "../lib/db";
import * as schema from "../lib/db/schema";

function loadEnvFile(file: string) {
  try {
    const p = path.join(process.cwd(), file);
    if (!fs.existsSync(p)) return;
    const content = fs.readFileSync(p, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  } catch {}
}

loadEnvFile(".env.local");
loadEnvFile(".env");

export async function openDb(preferUnpooled = false): Promise<{ db: Database; close: () => Promise<void>; kind: string }> {
  const url =
    (preferUnpooled ? process.env.DATABASE_URL_UNPOOLED : undefined) ||
    process.env.DATABASE_URL ||
    process.env.DATABASE_POSTGRES_URL ||
    process.env.POSTGRES_URL ||
    "";
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
