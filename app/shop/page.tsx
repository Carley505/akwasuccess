import type { Metadata } from "next";
import { PageHeader, Section } from "@/components/ui/Layout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ShopCatalog, type ActiveFilters } from "@/components/product/ShopCatalog";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";
import { queryProducts } from "@/lib/db/queries";

export const metadata: Metadata = {
  title: "Shop eBooks, Courses & Tutorials",
  description:
    "Browse beginner-friendly eBooks, courses, tutorials and bundles on cryptocurrency, personal finance, electrical & automation skills, and wellbeing. Pay with M-Pesa or card.",
  alternates: { canonical: "/shop" },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function single(val: string | string[] | undefined): string | undefined {
  return Array.isArray(val) ? val[0] : val;
}

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const activeFilters: ActiveFilters = {
    category: single(sp.category),
    format: single(sp.format),
    level: single(sp.level),
    pricing: single(sp.pricing),
    maxPrice: single(sp.maxPrice),
    q: single(sp.q),
    sort: single(sp.sort),
  };

  const { items } = await queryProducts({
    category: activeFilters.category,
    format: activeFilters.format,
    level: activeFilters.level as "beginner" | "intermediate" | "advanced" | undefined,
    pricing: activeFilters.pricing as "all" | "free" | "paid" | undefined,
    maxPrice: activeFilters.maxPrice ? Number(activeFilters.maxPrice) : undefined,
    q: activeFilters.q,
    sort: activeFilters.sort as "popular" | "newest" | "price-asc" | "price-desc" | undefined,
  });

  return (
    <>
      <PageHeader
        title="Shop eBooks, Courses & Guides"
        intro="Practical, beginner-friendly digital guides you can read on any phone, tablet, or computer. Download a free sample chapter on any eBook page."
        breadcrumbs={<Breadcrumbs items={[{ name: "Shop" }]} />}
      />

      <Section>
        <ShopCatalog products={items} initialFilters={activeFilters} />
        <div className="mt-12">
          <DisclaimerBanner variant="crypto" compact />
        </div>
      </Section>
    </>
  );
}
