/**
 * CLI script to sync categories to WordPress/WooCommerce and pull all
 * published WooCommerce products (via REST + WooGraphQL) into the database.
 */
import { eq, isNull } from "drizzle-orm";
import { categories as categoryContent } from "../content/categories";
import { seedProducts } from "../content/products";
import * as s from "../lib/db/schema";
import {
  classifyWooProduct,
  type WooRawCategory,
  type WooRawProduct,
} from "../lib/woocommerce/classify";
import { openDb } from "./db";

const WOO_ID_TO_SEED_SLUG: Record<number, string> = {
  150: "basic-electrical-electronics-instrumentation-automation-ebook",
  151: "the-secrets-of-genuine-money-ebook",
  117: "psychology-clinic-health-tips-for-long-life-ebook",
  152: "cryptocurrency-for-beginners",
  146: "consulting-session",
};

async function wooFetch<T>(endpoint: string, init?: RequestInit): Promise<T> {
  const rawBase = (process.env.WOOCOMMERCE_URL || "https://cms.akwasuccess.com")
    .trim()
    .replace(/\/+$/, "");
  const key = (process.env.WOOCOMMERCE_CONSUMER_KEY ?? "").trim();
  const secret = (process.env.WOOCOMMERCE_CONSUMER_SECRET ?? "").trim();
  if (!key || !secret) {
    throw new Error("WOOCOMMERCE_CONSUMER_KEY and WOOCOMMERCE_CONSUMER_SECRET are required.");
  }
  const auth = `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`;
  const url = `${rawBase}/wp-json/wc/v3/${endpoint.replace(/^\/+/, "")}`;

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        authorization: auth,
        "content-type": "application/json",
        "user-agent": "Akwasuccess-Sync-CLI/1.0",
        ...(init?.headers ?? {}),
      },
    });
  } catch (err) {
    if (url.includes("://cms.akwasuccess.com")) {
      res = await fetch(url.replace("://cms.akwasuccess.com", "://akwasuccess.com"), {
        ...init,
        headers: {
          authorization: auth,
          "content-type": "application/json",
          "user-agent": "Akwasuccess-Sync-CLI/1.0",
          ...(init?.headers ?? {}),
        },
      });
    } else {
      throw err;
    }
  }

  if (!res.ok) {
    throw new Error(`WooCommerce REST ${res.status} on ${endpoint}: ${await res.text()}`);
  }
  return (await res.json()) as T;
}

async function main() {
  const { db, close, kind } = await openDb();
  console.log(`Connected to ${kind} database.`);

  // 1. Upsert local categories
  for (let i = 0; i < categoryContent.length; i++) {
    const c = categoryContent[i]!;
    await db
      .insert(s.categories)
      .values({
        slug: c.slug,
        name: c.name,
        description: c.description,
        position: i + 1,
      })
      .onConflictDoUpdate({
        target: s.categories.slug,
        set: { name: c.name, description: c.description, position: i + 1 },
      });
  }

  // 2. Ensure categories exist in WooCommerce
  const existingWooCats = await wooFetch<WooRawCategory[]>("products/categories?per_page=100");
  const wooCatBySlug = new Map<string, number>();
  for (const c of existingWooCats) {
    if (c.slug && typeof c.id === "number") {
      wooCatBySlug.set(c.slug.toLowerCase(), c.id);
    }
  }

  for (const cat of categoryContent) {
    if (!wooCatBySlug.has(cat.slug)) {
      try {
        const created = await wooFetch<WooRawCategory>("products/categories", {
          method: "POST",
          body: JSON.stringify({
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
          }),
        });
        if (created?.id) {
          wooCatBySlug.set(cat.slug, created.id);
          console.log(`Created WooCommerce category: ${cat.name} (${cat.slug}) -> #${created.id}`);
        }
      } catch (e) {
        console.warn(`Could not create Woo category ${cat.slug}:`, (e as Error).message);
      }
    }
  }

  // 3. Fetch published WooCommerce products
  const wooProducts = await wooFetch<WooRawProduct[]>("products?per_page=100&status=publish");
  console.log(`Fetched ${wooProducts.length} published products from WooCommerce.`);

  const now = new Date();
  for (let idx = 0; idx < wooProducts.length; idx++) {
    const woo = wooProducts[idx]!;
    const classified = classifyWooProduct(woo);

    // Assign category in WooCommerce if not already assigned
    const targetCatId = wooCatBySlug.get(classified.categorySlug);
    const currentCatIds = (woo.categories ?? [])
      .map((c) => c.id)
      .filter((id): id is number => typeof id === "number");
    const needsSlugFix = woo.id === 117 && woo.slug === "117";
    if ((targetCatId && !currentCatIds.includes(targetCatId)) || needsSlugFix) {
      const nextCatIds = targetCatId
        ? Array.from(new Set([targetCatId, ...currentCatIds]))
        : currentCatIds;
      await wooFetch(`products/${woo.id}`, {
        method: "PUT",
        body: JSON.stringify({
          categories: nextCatIds.map((id) => ({ id })),
          ...(needsSlugFix ? { slug: "psychology-clinic-health-tips" } : {}),
        }),
      }).catch(() => {});
    }

    const seedMatchSlug = WOO_ID_TO_SEED_SLUG[woo.id];
    const seedMatch = seedMatchSlug
      ? seedProducts.find((sp) => sp.slug === seedMatchSlug)
      : seedProducts.find((sp) => sp.slug === classified.slug);

    const wooImage = woo.images?.[0]?.src
      ? {
          url: woo.images[0].src.replace(/^http:\/\//i, "https://"),
          alt: woo.images[0].alt || `${woo.name} cover`,
          width: 960,
          height: 1440,
        }
      : null;

    const wooDownloads: s.WooDownloadRef[] = (woo.downloads ?? []).map((d) => ({
      id: d.id,
      name: d.name || woo.name,
      file: d.file.replace(/^http:\/\//i, "https://"),
    }));

    const formats: s.Format[] =
      classified.type === "service"
        ? ["Service", "PDF"]
        : classified.type === "course"
          ? ["PDF", "Video"]
          : ["PDF"];

    const [existingByWoo] = await db
      .select()
      .from(s.products)
      .where(eq(s.products.wooId, woo.id));
    const [existingBySlug] = existingByWoo
      ? [existingByWoo]
      : await db.select().from(s.products).where(eq(s.products.slug, classified.slug));
    const existing = existingByWoo ?? existingBySlug;

    const values = {
      slug: classified.slug,
      type: classified.type,
      categorySlug: classified.categorySlug,
      title: woo.name.trim(),
      subtitle: classified.subtitle,
      description: classified.description,
      level: classified.level,
      priceCents: classified.priceCents,
      salePriceCents: classified.salePriceCents,
      isFree: classified.isFree,
      status: "published" as const,
      isSample: false,
      featured: classified.featured,
      cover: wooImage ?? existing?.cover ?? seedMatch?.cover ?? null,
      outcomes:
        existing?.outcomes && existing.outcomes.length > 0
          ? existing.outcomes
          : seedMatch?.outcomes?.length
            ? seedMatch.outcomes
            : classified.outcomes,
      audienceFor:
        existing?.audienceFor && existing.audienceFor.length > 0
          ? existing.audienceFor
          : (seedMatch?.audienceFor ?? []),
      audienceNotFor:
        existing?.audienceNotFor && existing.audienceNotFor.length > 0
          ? existing.audienceNotFor
          : (seedMatch?.audienceNotFor ?? []),
      toc:
        existing?.toc && existing.toc.length > 0
          ? existing.toc
          : (seedMatch?.toc ?? []),
      formats,
      pages: existing?.pages ?? seedMatch?.pages ?? null,
      sampleFileKey: existing?.sampleFileKey ?? seedMatch?.sampleFileKey ?? null,
      popularity: Math.max(existing?.popularity ?? 0, 100 - idx * 4),
      wooId: woo.id,
      wooDownloads,
      wooSyncedAt: now,
      updatedAt: now,
    };

    let productId: string;
    if (existing) {
      await db.update(s.products).set(values).where(eq(s.products.id, existing.id));
      productId = existing.id;
    } else {
      const [inserted] = await db.insert(s.products).values(values).returning();
      productId = inserted!.id;
    }

    for (const dl of wooDownloads) {
      const fileKey = `woo:${woo.id}:${dl.id}`;
      const existingFiles = await db
        .select()
        .from(s.productFiles)
        .where(eq(s.productFiles.productId, productId));
      if (!existingFiles.some((f) => f.fileKey === fileKey)) {
        await db.insert(s.productFiles).values({
          productId,
          format: "PDF",
          fileKey,
          fileName: `${classified.slug}.pdf`,
        });
      }
    }

    if (classified.type === "course" || classified.type === "tutorial") {
      await db
        .insert(s.courses)
        .values({ productId, certificateEnabled: true })
        .onConflictDoNothing({ target: s.courses.productId });
    }

    console.log(
      `  ✓ [${woo.id}] ${woo.name} -> slug="${classified.slug}", cat="${classified.categorySlug}", type="${classified.type}", priceCents=${classified.priceCents}, salePriceCents=${classified.salePriceCents}`,
    );
  }

  if (wooProducts.length > 0) {
    await db
      .update(s.products)
      .set({ isSample: true, status: "draft", updatedAt: now })
      .where(isNull(s.products.wooId));
  }

  console.log("WooCommerce sync complete.");
  await close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
