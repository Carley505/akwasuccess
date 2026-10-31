import "server-only";
import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import { getDb, schema as s } from "@/lib/db";
import { isSampleDataVisible } from "@/content/site";
import type { ProductCardData } from "@/components/product/ProductCard";

export type ShopFilter = {
  category?: string;
  format?: string; // ebook | course | tutorial | service | bundle
  level?: "beginner" | "intermediate" | "advanced";
  minPrice?: number;
  maxPrice?: number;
  pricing?: "all" | "free" | "paid";
  q?: string;
  sort?: "popular" | "newest" | "price-asc" | "price-desc";
  limit?: number;
  offset?: number;
};

function sampleVisibilityClause() {
  return isSampleDataVisible ? undefined : eq(s.products.isSample, false);
}

async function attachRatings(products: s.Product[]): Promise<ProductCardData[]> {
  if (products.length === 0) return [];
  const db = await getDb();
  const ids = products.map((p) => p.id);
  const rows = await db
    .select({
      productId: s.reviews.productId,
      avg: sql<number>`avg(${s.reviews.rating})::float`,
      count: sql<number>`count(*)::int`,
    })
    .from(s.reviews)
    .where(and(inArray(s.reviews.productId, ids), eq(s.reviews.status, "approved")))
    .groupBy(s.reviews.productId);

  const byProduct = new Map(rows.map((r) => [r.productId, r]));

  return products.map((p) => {
    const stat = byProduct.get(p.id);
    const hideSamplePrice = p.isSample && !isSampleDataVisible;
    return {
      id: p.id,
      slug: p.slug,
      type: p.type,
      categorySlug: p.categorySlug,
      title: p.title,
      subtitle: p.subtitle,
      level: p.level,
      priceKes: hideSamplePrice ? 0 : p.priceKes,
      salePriceKes: hideSamplePrice ? null : p.salePriceKes,
      isFree: p.isFree,
      isSample: p.isSample,
      formats: p.formats ?? [],
      cover: p.cover,
      ratingAvg: stat?.avg ?? 0,
      ratingCount: stat?.count ?? 0,
    };
  });
}

export async function getFeaturedProducts(limit = 4): Promise<ProductCardData[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(s.products)
    .where(
      and(
        eq(s.products.status, "published"),
        eq(s.products.featured, true),
        sampleVisibilityClause(),
      ),
    )
    .orderBy(desc(s.products.popularity), desc(s.products.createdAt))
    .limit(limit);
  return attachRatings(rows);
}

export async function queryProducts(filter: ShopFilter = {}): Promise<{
  items: ProductCardData[];
  total: number;
}> {
  const db = await getDb();
  const conditions = [eq(s.products.status, "published"), sampleVisibilityClause()];

  if (filter.category) {
    conditions.push(eq(s.products.categorySlug, filter.category));
  }
  if (
    filter.format &&
    ["ebook", "course", "tutorial", "service", "bundle"].includes(filter.format)
  ) {
    conditions.push(
      eq(
        s.products.type,
        filter.format as "ebook" | "course" | "tutorial" | "service" | "bundle",
      ),
    );
  }
  if (filter.level && ["beginner", "intermediate", "advanced"].includes(filter.level)) {
    conditions.push(eq(s.products.level, filter.level));
  }
  if (filter.pricing === "free") {
    conditions.push(eq(s.products.isFree, true));
  } else if (filter.pricing === "paid") {
    conditions.push(and(eq(s.products.isFree, false), gte(s.products.priceKes, 1)));
  }
  if (typeof filter.minPrice === "number" && filter.minPrice > 0) {
    conditions.push(gte(s.products.priceKes, filter.minPrice));
  }
  if (typeof filter.maxPrice === "number" && filter.maxPrice > 0) {
    conditions.push(lte(s.products.priceKes, filter.maxPrice));
  }
  if (filter.q && filter.q.trim()) {
    const q = `%${filter.q.trim()}%`;
    conditions.push(
      or(
        ilike(s.products.title, q),
        ilike(s.products.subtitle, q),
        ilike(s.products.description, q),
      ),
    );
  }

  const whereClause = and(...conditions.filter(Boolean));

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(s.products)
    .where(whereClause);

  const orderBy =
    filter.sort === "newest"
      ? [desc(s.products.createdAt)]
      : filter.sort === "price-asc"
        ? [asc(s.products.priceKes), desc(s.products.popularity)]
        : filter.sort === "price-desc"
          ? [desc(s.products.priceKes), desc(s.products.popularity)]
          : [desc(s.products.popularity), desc(s.products.createdAt)];

  const rows = await db
    .select()
    .from(s.products)
    .where(whereClause)
    .orderBy(...orderBy)
    .limit(filter.limit ?? 24)
    .offset(filter.offset ?? 0);

  return {
    items: await attachRatings(rows),
    total: countRow?.count ?? 0,
  };
}

export async function getProductBySlug(slug: string) {
  const db = await getDb();
  const [product] = await db
    .select()
    .from(s.products)
    .where(and(eq(s.products.slug, slug), eq(s.products.status, "published")));

  if (!product) return null;
  if (product.isSample && product.type === "bundle" && !isSampleDataVisible) return null;

  const approvedReviews = await db
    .select()
    .from(s.reviews)
    .where(and(eq(s.reviews.productId, product.id), eq(s.reviews.status, "approved")))
    .orderBy(desc(s.reviews.createdAt));

  const files = await db
    .select()
    .from(s.productFiles)
    .where(eq(s.productFiles.productId, product.id));

  const relatedRows = await db
    .select()
    .from(s.products)
    .where(
      and(
        eq(s.products.status, "published"),
        eq(s.products.categorySlug, product.categorySlug),
        sql`${s.products.id} <> ${product.id}`,
        sampleVisibilityClause(),
      ),
    )
    .limit(3);

  const related = await attachRatings(relatedRows);

  // If bundle, fetch included items
  let bundleProducts: s.Product[] = [];
  if (product.bundleItems && product.bundleItems.length > 0) {
    bundleProducts = await db
      .select()
      .from(s.products)
      .where(inArray(s.products.id, product.bundleItems));
  }

  return {
    product,
    reviews: approvedReviews,
    files,
    related,
    bundleProducts,
  };
}

export async function getCoursesWithCurriculum() {
  const db = await getDb();
  const rows = await db
    .select()
    .from(s.products)
    .where(
      and(
        eq(s.products.status, "published"),
        inArray(s.products.type, ["course", "tutorial"]),
        sampleVisibilityClause(),
      ),
    )
    .orderBy(desc(s.products.popularity));

  const cards = await attachRatings(rows);
  const results = [];

  for (const card of cards) {
    const [course] = await db
      .select()
      .from(s.courses)
      .where(eq(s.courses.productId, card.id));

    let lessonsCount = 0;
    let totalDurationSec = 0;

    if (course) {
      const mods = await db
        .select()
        .from(s.modules)
        .where(eq(s.modules.courseId, course.id));
      if (mods.length > 0) {
        const modIds = mods.map((m) => m.id);
        const lessonRows = await db
          .select()
          .from(s.lessons)
          .where(inArray(s.lessons.moduleId, modIds));
        lessonsCount = lessonRows.length;
        totalDurationSec = lessonRows.reduce((sum, l) => sum + (l.durationSec ?? 0), 0);
      }
    }

    results.push({ ...card, lessonsCount, totalDurationSec });
  }

  return results;
}

export async function getCourseBySlug(slug: string) {
  const db = await getDb();
  const [product] = await db
    .select()
    .from(s.products)
    .where(and(eq(s.products.slug, slug), eq(s.products.status, "published")));
  if (!product) return null;

  const [course] = await db
    .select()
    .from(s.courses)
    .where(eq(s.courses.productId, product.id));

  const curriculum: {
    id: string;
    title: string;
    position: number;
    lessons: s.Lesson[];
  }[] = [];

  if (course) {
    const mods = await db
      .select()
      .from(s.modules)
      .where(eq(s.modules.courseId, course.id))
      .orderBy(asc(s.modules.position));
    for (const m of mods) {
      const lessonRows = await db
        .select()
        .from(s.lessons)
        .where(eq(s.lessons.moduleId, m.id))
        .orderBy(asc(s.lessons.position));
      curriculum.push({ id: m.id, title: m.title, position: m.position, lessons: lessonRows });
    }
  }

  return { product, course, curriculum };
}

export async function getArticles(filter?: {
  category?: string;
  level?: "beginner" | "intermediate" | "advanced";
  q?: string;
  limit?: number;
}) {
  const db = await getDb();
  const conds = [eq(s.articles.status, "published")];
  if (filter?.category) conds.push(eq(s.articles.categorySlug, filter.category));
  if (filter?.level) conds.push(eq(s.articles.level, filter.level));
  if (filter?.q && filter.q.trim()) {
    const q = `%${filter.q.trim()}%`;
    conds.push(or(ilike(s.articles.title, q), ilike(s.articles.excerpt, q))!);
  }

  return db
    .select()
    .from(s.articles)
    .where(and(...conds))
    .orderBy(desc(s.articles.publishedAt), desc(s.articles.createdAt))
    .limit(filter?.limit ?? 50);
}

export async function getArticleBySlug(slug: string) {
  const db = await getDb();
  const [article] = await db
    .select()
    .from(s.articles)
    .where(and(eq(s.articles.slug, slug), eq(s.articles.status, "published")));
  if (!article) return null;

  const relatedArticles = await db
    .select()
    .from(s.articles)
    .where(
      and(
        eq(s.articles.status, "published"),
        sql`${s.articles.id} <> ${article.id}`,
        article.categorySlug ? eq(s.articles.categorySlug, article.categorySlug) : undefined,
      ),
    )
    .limit(3);

  let relatedProduct: ProductCardData | null = null;
  if (article.relatedProductSlug) {
    const [prod] = await db
      .select()
      .from(s.products)
      .where(eq(s.products.slug, article.relatedProductSlug));
    if (prod) {
      const [card] = await attachRatings([prod]);
      relatedProduct = card ?? null;
    }
  }

  return { article, relatedArticles, relatedProduct };
}

export async function getApprovedTestimonials() {
  const db = await getDb();
  return db
    .select()
    .from(s.testimonials)
    .where(and(eq(s.testimonials.status, "approved"), eq(s.testimonials.consent, true)))
    .orderBy(desc(s.testimonials.createdAt));
}
