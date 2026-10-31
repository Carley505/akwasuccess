import path from "node:path";
import { openDb } from "./db";

async function main() {
  const { db, close, kind } = await openDb();
  const folder = path.join(process.cwd(), "drizzle");
  if (kind === "pglite") {
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await migrate(db as any, { migrationsFolder: folder });
  } else {
    const { migrate } = await import("drizzle-orm/postgres-js/migrator");
    await migrate(db, { migrationsFolder: folder });
  }
  console.log(`Migrations applied (${kind}).`);
  await close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
