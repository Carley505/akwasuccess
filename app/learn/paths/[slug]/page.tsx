import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPath } from "@/content/paths";
import { PageHeader, Section } from "@/components/ui/Layout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { LearningPath } from "@/components/marketing/LearningPath";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";
import { LinkButton } from "@/components/ui/Button";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const path = getPath(slug);
  if (!path) return { title: "Learning path not found" };
  return {
    title: `${path.title} — Step-by-Step Learning Path`,
    description: path.intro,
    alternates: { canonical: `/learn/paths/${path.slug}` },
  };
}

export default async function LearningPathDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const path = getPath(slug);
  if (!path) notFound();

  return (
    <>
      <PageHeader
        title={path.title}
        intro={path.intro}
        breadcrumbs={
          <Breadcrumbs items={[{ name: "Learn", href: "/learn" }, { name: path.title }]} />
        }
      />

      <Section>
        <div className="space-y-8">
          <LearningPath path={path} interactive />

          <div className="card flex flex-wrap items-center justify-between gap-4 p-6">
            <div>
              <h2 className="text-xl font-bold">Ready for the complete reference guide?</h2>
              <p className="text-muted mt-1 text-sm">
                Explore the matching eBooks and courses in our shop.
              </p>
            </div>
            <LinkButton href={`/shop/${path.category}`}>
              Browse {path.title.replace(" path", "")} eBooks
            </LinkButton>
          </div>

          {path.category === "crypto" && <DisclaimerBanner variant="crypto" />}
        </div>
      </Section>
    </>
  );
}
