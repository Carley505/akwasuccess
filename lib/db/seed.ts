import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { eq, sql } from "drizzle-orm";
import { categories as categoryContent } from "@/content/categories";
import { seedProducts, type SeedProduct } from "@/content/products";
import {
  sampleBundle,
  sampleBundleItems,
  sampleCoupon,
  sampleCurriculum,
  sampleProductOverlays,
} from "@/content/sample-data";
import type { Database } from "./index";
import * as s from "./schema";

type SeedOptions = { sample: boolean };

function shouldUseSample() {
  if (process.env.NODE_ENV === "production" && process.env.SHOW_SAMPLE_DATA !== "true") {
    return false;
  }
  return process.env.SEED_SAMPLE_DATA !== "false";
}

export async function seedIfEmpty(db: Database) {
  const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(s.categories);
  if ((row?.n ?? 0) > 0) return;
  await seed(db, { sample: shouldUseSample() });
}

async function upsertProduct(db: Database, p: SeedProduct) {
  const { files, ...data } = p;
  const [existing] = await db
    .select({ id: s.products.id })
    .from(s.products)
    .where(eq(s.products.slug, data.slug));
  let id = existing?.id;
  if (id) {
    await db
      .update(s.products)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(s.products.id, id));
  } else {
    const [inserted] = await db.insert(s.products).values(data).returning({ id: s.products.id });
    id = inserted!.id;
    for (const f of files ?? []) {
      await db.insert(s.productFiles).values({ productId: id, ...f });
    }
  }
  return id;
}

export async function seed(db: Database, opts: SeedOptions = { sample: false }) {
  // Categories
  for (const [i, c] of categoryContent.entries()) {
    await db
      .insert(s.categories)
      .values({ slug: c.slug, name: c.name, description: c.description, position: i })
      .onConflictDoUpdate({
        target: s.categories.slug,
        set: { name: c.name, description: c.description, position: i },
      });
  }

  // Products (real), optionally with sample overlays.
  const ids: Record<string, string> = {};
  for (const p of seedProducts) {
    const overlay = opts.sample ? sampleProductOverlays[p.slug] : undefined;
    const merged: SeedProduct = overlay ? { ...p, ...overlay, isSample: true } : p;
    ids[p.slug] = await upsertProduct(db, merged);
  }

  if (opts.sample) {
    const bundleId = await upsertProduct(db, {
      ...sampleBundle,
      bundleItems: sampleBundleItems.map((slug) => ids[slug]).filter(Boolean) as string[],
    });
    ids[sampleBundle.slug] = bundleId;

    await db
      .insert(s.coupons)
      .values({ code: sampleCoupon.code, type: sampleCoupon.type, value: sampleCoupon.value })
      .onConflictDoNothing();
  }

  // Course structure for the training course.
  const courseProductId = ids["cryptocurrency-blockchain-training"];
  if (courseProductId) {
    const [existingCourse] = await db
      .select()
      .from(s.courses)
      .where(eq(s.courses.productId, courseProductId));
    if (!existingCourse) {
      const [course] = await db
        .insert(s.courses)
        .values({ productId: courseProductId })
        .returning();
      if (opts.sample && course) {
        for (const [mi, m] of sampleCurriculum.entries()) {
          const [mod] = await db
            .insert(s.modules)
            .values({ courseId: course.id, title: m.title, position: mi })
            .returning();
          for (const [li, l] of m.lessons.entries()) {
            await db.insert(s.lessons).values({
              moduleId: mod!.id,
              slug: l.slug,
              title: l.title,
              position: li,
              durationSec: l.durationSec,
              isPreview: l.isPreview ?? false,
              body: "Sample lesson notes. The owner will replace this with real lesson content.",
            });
          }
        }
      }
    }
  }

  await seedArticles(db);

  // Admin user (owner) from env.
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  if (adminEmail) {
    await db
      .insert(s.users)
      .values({ email: adminEmail, role: "admin", name: "Owner" })
      .onConflictDoUpdate({ target: s.users.email, set: { role: "admin" } });
  }
}

/** Loads markdown articles from /content/articles into the database. */
export async function seedArticles(db: Database) {
  const dir = path.join(process.cwd(), "content", "articles");
  if (!fs.existsSync(dir)) return;
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".md"))) {
    const raw = fs.readFileSync(path.join(dir, file), "utf8");
    const { data, content } = matter(raw);
    const slug = (data.slug as string) ?? file.replace(/\.md$/, "");
    const values = {
      slug,
      title: String(data.title ?? slug),
      excerpt: String(data.excerpt ?? ""),
      body: content.trim(),
      categorySlug: (data.category as string) ?? null,
      level: (data.level as "beginner" | "intermediate" | "advanced") ?? "beginner",
      author: String(data.author ?? "Akwasuccess"),
      status: (data.status as "draft" | "published") ?? "published",
      featured: Boolean(data.featured),
      keyTakeaways: (data.keyTakeaways as string[]) ?? [],
      relatedProductSlug: (data.relatedProduct as string) ?? null,
      publishedAt: data.date ? new Date(data.date as string) : new Date(),
      updatedAt: data.updated ? new Date(data.updated as string) : new Date(),
    };
    await db
      .insert(s.articles)
      .values(values)
      .onConflictDoUpdate({ target: s.articles.slug, set: values });
  }
}
