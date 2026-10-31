import { NextResponse, type NextRequest } from "next/server";
import { getArticles, queryProducts } from "@/lib/db/queries";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const [{ items: prods }, arts] = await Promise.all([
    queryProducts({ q, limit: 5 }),
    getArticles({ q, limit: 3 }),
  ]);

  const results = [
    ...prods.map((p) => ({
      title: p.title,
      href: p.type === "course" ? `/courses/${p.slug}` : `/shop/${p.slug}`,
      kind: "product" as const,
      type: p.type,
      category: p.categorySlug,
    })),
    ...arts.map((a) => ({
      title: a.title,
      href: `/learn/${a.slug}`,
      kind: "article" as const,
      category: a.categorySlug ?? undefined,
    })),
  ];

  return NextResponse.json({ results });
}
