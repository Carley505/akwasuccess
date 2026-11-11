import type { Metadata } from "next";
import { PageHeader, Section } from "@/components/ui/Layout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ShopCatalog } from "@/components/product/ShopCatalog";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";
import { queryProducts } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop eBooks, Courses & Tutorials",
  description:
    "Browse beginner-friendly eBooks, courses, tutorials and bundles on cryptocurrency, personal finance, electrical & automation skills, and wellbeing. Instant download with USD card checkout.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage() {
  const { items } = await queryProducts({});

  return (
    <>
      <PageHeader
        title="Shop eBooks, Courses & Guides"
        intro="Practical, beginner-friendly digital guides you can read on any phone, tablet, or computer. Download a free sample chapter on any eBook page."
        breadcrumbs={<Breadcrumbs items={[{ name: "Shop" }]} />}
      />

      <Section>
        <ShopCatalog products={items} initialFilters={{}} />
        <div className="mt-12">
          <DisclaimerBanner variant="crypto" compact />
        </div>
      </Section>
    </>
  );
}
