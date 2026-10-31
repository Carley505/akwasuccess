import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { shopCategories } from "@/content/categories";
import { learningPaths } from "@/content/paths";
import { getArticles, queryProducts } from "@/lib/db/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    "",
    "/shop",
    "/courses",
    "/learn",
    "/services",
    "/services/consulting",
    "/services/electrical",
    "/about",
    "/success-stories",
    "/free",
    "/contact",
    "/faq",
    "/privacy-policy",
    "/refund-policy",
    "/terms",
    "/disclaimer",
    ...shopCategories.map((c) => `/shop/${c.slug}`),
    ...learningPaths.map((p) => `/learn/paths/${p.slug}`),
  ];

  const [{ items: products }, articles] = await Promise.all([
    queryProducts({ limit: 200 }),
    getArticles({ limit: 200 }),
  ]);

  const now = new Date();

  return [
    ...staticPaths.map((p) => ({
      url: `${site.url}${p}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: p === "" ? 1 : 0.8,
    })),
    ...products.map((prod) => ({
      url: `${site.url}/${prod.type === "course" ? "courses" : "shop"}/${prod.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...articles.map((art) => ({
      url: `${site.url}/learn/${art.slug}`,
      lastModified: art.updatedAt ?? now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
