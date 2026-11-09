import "server-only";
import fs from "node:fs";
import path from "node:path";
import { drizzle as drizzlePg, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;

/**
 * Database client.
 *
 * - Production / staging: set DATABASE_URL to a PostgreSQL connection string
 *   (Neon, Supabase, RDS...). Uses postgres-js.
 * - Local development: when DATABASE_URL is empty or starts with "pglite:",
 *   an embedded PostgreSQL (PGlite, WebAssembly) stores data in ./.data/pglite.
 *   It is migrated and seeded automatically on first use so `npm run dev`
 *   works with zero setup.
 */
type Global = typeof globalThis & { __akwaDb?: Promise<Database> };
const g = globalThis as Global;

export function getDatabaseUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.DATABASE_POSTGRES_URL ||
    process.env.POSTGRES_URL ||
    ""
  );
}

export function isEmbeddedDb() {
  const url = getDatabaseUrl();
  return url === "" || url.startsWith("pglite:");
}

async function createDb(): Promise<Database> {
  const url = getDatabaseUrl();

  if (!isEmbeddedDb()) {
    const postgres = (await import("postgres")).default;
    const client = postgres(url, { max: 5, prepare: false });
    return drizzlePg(client, { schema });
  }

  const dir = url.startsWith("pglite:")
    ? url.slice("pglite:".length)
    : process.env.VERCEL
      ? path.join("/tmp", "akwa-pglite")
      : path.join(process.cwd(), ".data", "pglite");
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle: drizzleLite } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");

  let client;
  try {
    if (dir !== "memory") {
      fs.mkdirSync(dir, { recursive: true });
    }
    client = dir === "memory" ? new PGlite() : new PGlite(dir, { relaxedDurability: true });
  } catch {
    // Fallback to in-memory PGlite if filesystem is read-only or locked
    client = new PGlite({ relaxedDurability: true });
  }
  const db = drizzleLite(client, { schema });
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });

  const { seedIfEmpty } = await import("./seed");
  await seedIfEmpty(db as unknown as Database);

  return db as unknown as Database;
}

export function getDb(): Promise<Database> {
  if (!g.__akwaDb) {
    g.__akwaDb = createDb().catch((err) => {
      g.__akwaDb = undefined;
      throw err;
    });
  }
  return g.__akwaDb;
}

export { schema };
