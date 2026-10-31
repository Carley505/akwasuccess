import { seed } from "../lib/db/seed";
import { openDb } from "./db";

/**
 * Usage:
 *   npm run db:seed              # real seed data (+ sample data in development)
 *   npm run db:seed -- --no-sample
 * Sample data is never applied when NODE_ENV=production unless SHOW_SAMPLE_DATA=true.
 */
async function main() {
  const isProd = process.env.NODE_ENV === "production" && process.env.SHOW_SAMPLE_DATA !== "true";
  const sample = !isProd && !process.argv.includes("--no-sample");
  const { db, close, kind } = await openDb();
  await seed(db, { sample });
  console.log(`Seeded ${kind} database (sample data: ${sample ? "yes" : "no"}).`);
  await close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
