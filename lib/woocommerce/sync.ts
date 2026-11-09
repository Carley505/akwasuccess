import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { categories as categoryContent } from "@/content/categories";
import { seedProducts } from "@/content/products";
import { getDb, schema as s } from "@/lib/db";
import {
  classifyWooProduct,
  parseWooPriceToCents,
  type WooRawCategory,
  type WooRawProduct,
} from "./classify";
import { isWooCommerceConfigured, wooGraphQL, wooRest } from "./client";
import { fetchWooOrdersForUser, findOrCreateWooCustomer } from "./orders";

const WOO_ID_TO_SEED_SLUG: Record<number, string> = {
  150: "basic-electrical-electronics-instrumentation-automation-ebook",
  151: "the-secrets-of-genuine-money-ebook",
  117: "psychology-clinic-health-tips-for-long-life-ebook",
  152: "cryptocurrency-for-beginners",
  146: "consulting-session",
};

/**
 * Ensures the 6 content pillar categories exist in WooCommerce and assigns
 * each WooCommerce product to its classified category in WordPress.
 */
export async function syncCategoriesToWooCommerce(
  wooProducts?: WooRawProduct[],
): Promise<{ createdCategories: number; updatedProducts: number }> {
  if (!isWooCommerceConfigured()) {
    return { createdCategories: 0, updatedProducts: 0 };
  }

  let createdCategories = 0;
  let updatedProducts = 0;

  const existingCats = await wooRest<WooRawCategory[]>("products/categories?per_page=100");
  const bySlug = new Map<string, number>();
  for (const c of existingCats) {
    if (c.slug && typeof c.id === "number") {
      bySlug.set(c.slug.toLowerCase(), c.id);
    }
  }

  for (const cat of categoryContent) {
    if (!bySlug.has(cat.slug)) {
      try {
        const created = await wooRest<WooRawCategory>("products/categories", {
          method: "POST",
          body: JSON.stringify({
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
          }),
        });
        if (created?.id) {
          bySlug.set(cat.slug, created.id);
          createdCategories++;
        }
      } catch {
        // Category may already exist under another name
      }
    }
  }

  const products =
    wooProducts ?? (await wooRest<WooRawProduct[]>("products?per_page=100&status=publish"));

  for (const p of products) {
    const classified = classifyWooProduct(p);
    const targetCatId = bySlug.get(classified.categorySlug);
    if (!targetCatId) continue;

    const currentCatIds = (p.categories ?? [])
      .map((c) => c.id)
      .filter((id): id is number => typeof id === "number");

    const needsCategory = !currentCatIds.includes(targetCatId);
    const needsSlugFix = p.id === 117 && p.slug === "117";

    if (needsCategory || needsSlugFix) {
      const nextCatIds = Array.from(new Set([targetCatId, ...currentCatIds]));
      try {
        await wooRest(`products/${p.id}`, {
          method: "PUT",
          body: JSON.stringify({
            categories: nextCatIds.map((id) => ({ id })),
            ...(needsSlugFix ? { slug: "psychology-clinic-health-tips" } : {}),
          }),
        });
        updatedProducts++;
      } catch {
        // Continue syncing remaining products
      }
    }
  }

  return { createdCategories, updatedProducts };
}

/**
 * Syncs all published WooCommerce products (via REST + GraphQL verification)
 * into the local PostgreSQL `products`, `product_files`, and `courses` tables.
 */
export async function syncWooProducts(opts?: {
  pushCategoriesToWoo?: boolean;
}): Promise<{
  syncedCount: number;
  graphqlVerified: boolean;
  categoriesUpdatedInWoo: number;
}> {
  if (!isWooCommerceConfigured()) {
    return { syncedCount: 0, graphqlVerified: false, categoriesUpdatedInWoo: 0 };
  }

  const db = await getDb();

  // 1. Ensure all local categories exist (including "marketing")
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

  // 2. Fetch published products from WooCommerce REST API + verify WooGraphQL
  const [wooProducts, gqlCheck] = await Promise.all([
    wooRest<WooRawProduct[]>("products?per_page=100&status=publish"),
    wooGraphQL<{ products?: { nodes?: { databaseId: number; slug: string }[] } }>(
      "{ products(first: 25) { nodes { databaseId slug } } }",
    ),
  ]);

  let categoriesUpdatedInWoo = 0;
  if (opts?.pushCategoriesToWoo) {
    const catSync = await syncCategoriesToWooCommerce(wooProducts).catch(() => ({
      createdCategories: 0,
      updatedProducts: 0,
    }));
    categoriesUpdatedInWoo = catSync.updatedProducts;
  }

  const now = new Date();
  let syncedCount = 0;

  for (let idx = 0; idx < wooProducts.length; idx++) {
    const woo = wooProducts[idx]!;
    const classified = classifyWooProduct(woo);
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

    // Sync downloadable files into product_files
    if (wooDownloads.length > 0) {
      const existingFiles = await db
        .select()
        .from(s.productFiles)
        .where(eq(s.productFiles.productId, productId));

      for (const dl of wooDownloads) {
        const fileKey = `woo:${woo.id}:${dl.id}`;
        const extMatch = /\.([a-z0-9]{2,5})(?:$|\?)/i.exec(dl.file);
        const ext = (extMatch?.[1] ?? "pdf").toLowerCase();
        const safeTitle = classified.slug.replace(/[^a-z0-9-]+/gi, "-");
        const fileName = `${safeTitle}.${ext}`;
        const found = existingFiles.find((f) => f.fileKey === fileKey);
        if (!found) {
          await db.insert(s.productFiles).values({
            productId,
            format: ext === "epub" ? "EPUB" : "PDF",
            fileKey,
            fileName,
          });
        }
      }
    }

    // Ensure courses have a row in s.courses so /courses/[slug] and /account/courses/[slug] work
    if (classified.type === "course" || classified.type === "tutorial") {
      await db
        .insert(s.courses)
        .values({ productId, certificateEnabled: true })
        .onConflictDoNothing({ target: s.courses.productId });
    }

    syncedCount++;
  }

  // Hide old non-Woo seed placeholder products when real WooCommerce products are present
  if (syncedCount > 0) {
    await db
      .update(s.products)
      .set({ isSample: true, status: "draft", updatedAt: now })
      .where(isNull(s.products.wooId));
  }

  return {
    syncedCount,
    graphqlVerified: Boolean(gqlCheck?.products?.nodes?.length),
    categoriesUpdatedInWoo,
  };
}

/**
 * Links a signed-in user to their WooCommerce customer record and imports any
 * orders (including past guest orders under the same email) into local orders
 * and entitlements.
 */
export async function syncUserWooOrders(user: s.User): Promise<void> {
  if (!isWooCommerceConfigured()) return;
  const db = await getDb();

  let wooCustomerId = user.wooCustomerId ?? null;
  if (!wooCustomerId) {
    wooCustomerId = await findOrCreateWooCustomer({
      email: user.email,
      name: user.name,
    });
    if (wooCustomerId) {
      await db
        .update(s.users)
        .set({ wooCustomerId, updatedAt: new Date() })
        .where(eq(s.users.id, user.id));
    }
  }

  const wooOrders = await fetchWooOrdersForUser({
    email: user.email,
    wooCustomerId,
  });

  if (wooOrders.length === 0) return;

  for (const wo of wooOrders) {
    const mappedStatus: s.Order["status"] =
      wo.status === "completed" || wo.status === "processing"
        ? "paid"
        : wo.status === "cancelled"
          ? "cancelled"
          : wo.status === "refunded"
            ? "refunded"
            : wo.status === "failed"
              ? "failed"
              : "pending";

    const [existingOrder] = await db
      .select()
      .from(s.orders)
      .where(eq(s.orders.wooOrderId, wo.id));

    const totalCents = parseWooPriceToCents(wo.total);
    const discountCents = parseWooPriceToCents(wo.discount_total);
    const subtotalCents = totalCents + discountCents;

    let localOrderId = existingOrder?.id;

    if (existingOrder) {
      await db
        .update(s.orders)
        .set({
          userId: user.id,
          status: existingOrder.status === "paid" ? "paid" : mappedStatus,
          wooOrderKey: wo.order_key || existingOrder.wooOrderKey,
          paidAt:
            mappedStatus === "paid"
              ? existingOrder.paidAt ?? (wo.date_paid_gmt ? new Date(wo.date_paid_gmt) : new Date())
              : existingOrder.paidAt,
          updatedAt: new Date(),
        })
        .where(eq(s.orders.id, existingOrder.id));
    } else {
      const orderNumber = `WC-${wo.number || wo.id}`;
      const [inserted] = await db
        .insert(s.orders)
        .values({
          number: orderNumber,
          userId: user.id,
          email: user.email,
          name:
            [wo.billing?.first_name, wo.billing?.last_name].filter(Boolean).join(" ").trim() ||
            user.name,
          status: mappedStatus,
          subtotalCents,
          discountCents,
          totalCents,
          wooOrderId: wo.id,
          wooOrderKey: wo.order_key,
          paidAt:
            mappedStatus === "paid"
              ? wo.date_paid_gmt
                ? new Date(wo.date_paid_gmt)
                : new Date()
              : null,
        })
        .onConflictDoNothing()
        .returning();
      localOrderId = inserted?.id;
    }

    if (!localOrderId) continue;

    for (const item of wo.line_items ?? []) {
      const [prod] = await db
        .select()
        .from(s.products)
        .where(eq(s.products.wooId, item.product_id));
      if (!prod) continue;

      const existingItems = await db
        .select()
        .from(s.orderItems)
        .where(
          and(
            eq(s.orderItems.orderId, localOrderId),
            eq(s.orderItems.productId, prod.id),
          ),
        );
      if (existingItems.length === 0) {
        await db.insert(s.orderItems).values({
          orderId: localOrderId,
          productId: prod.id,
          title: prod.title,
          unitPriceCents: parseWooPriceToCents(item.total ?? item.subtotal),
        });
      }

      if (mappedStatus === "paid") {
        await db
          .insert(s.entitlements)
          .values({
            userId: user.id,
            productId: prod.id,
            orderId: localOrderId,
            source: "purchase",
          })
          .onConflictDoUpdate({
            target: [s.entitlements.userId, s.entitlements.productId],
            set: { orderId: localOrderId, revokedAt: null },
          });
      }
    }
  }
}
