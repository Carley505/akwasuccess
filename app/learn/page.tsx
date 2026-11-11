import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { shopCategories } from "@/content/categories";
import { learningPaths } from "@/content/paths";
import { PageHeader, Section, SectionHeading } from "@/components/ui/Layout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge, LevelBadge } from "@/components/ui/Badge";
import { LearningPath } from "@/components/marketing/LearningPath";
import { NewsletterForm } from "@/components/marketing/NewsletterForm";
import { getArticles } from "@/lib/db/queries";
import { formatDate, readingTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Free Learning Hub — Beginner Guides & Articles",
  description:
    "Read free beginner guides on cryptocurrency, blockchain, personal finance, electrical & automation skills, and wellbeing.",
  alternates: { canonical: "/learn" },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function single(val: string | string[] | undefined): string | undefined {
  return Array.isArray(val) ? val[0] : val;
}

export default async function LearnHubPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const category = single(sp.category);
  const level = single(sp.level) as "beginner" | "intermediate" | "advanced" | undefined;
  const q = single(sp.q);

  const articles = await getArticles({ category, level, q });
  const startHere = articles.filter((a) => a.featured).slice(0, 3);

  return (
    <>
      <PageHeader
        title="Free Learning Hub"
        intro="Plain-English beginner guides and structured learning paths on money, cryptocurrency safety, electrical & automation skills, and wellbeing."
        breadcrumbs={<Breadcrumbs items={[{ name: "Learn" }]} />}
      />

      {/* Start Here featured picks */}
      {!category && !q && startHere.length > 0 && (
        <Section tone="warm" labelledBy="start-here-heading">
          <SectionHeading
            id="start-here-heading"
            eyebrow="Start here"
            title="Essential beginner reads"
            intro="New to Akwasuccess? Start with these three foundational guides."
          />
          <div className="grid gap-5 md:grid-cols-3">
            {startHere.map((art) => (
              <article key={art.id} className="card flex flex-col justify-between p-5">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Badge tone="gold">Start here</Badge>
                    <LevelBadge level={art.level} />
                  </div>
                  <h3 className="text-lg leading-snug font-bold">
                    <Link href={`/learn/${art.slug}`} className="hover:text-link no-underline">
                      {art.title}
                    </Link>
                  </h3>
                  <p className="text-muted mt-2 text-sm">{art.excerpt}</p>
                </div>
                <Link
                  href={`/learn/${art.slug}`}
                  className="text-link mt-4 inline-flex items-center gap-1 text-sm font-semibold no-underline hover:underline"
                >
                  Read guide ({readingTime(art.body)} min) <ArrowRight className="size-4" aria-hidden />
                </Link>
              </article>
            ))}
          </div>
        </Section>
      )}

      {/* Search & filter bar + all articles */}
      <Section labelledBy="all-articles-heading">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/learn"
              className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold no-underline ${
                !category ? "bg-primary text-primary-fg" : "bg-surface-2 hover:text-link"
              }`}
            >
              All topics
            </Link>
            {shopCategories.map((c) => (
              <Link
                key={c.slug}
                href={`/learn?category=${c.slug}`}
                className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold no-underline ${
                  category === c.slug
                    ? "bg-primary text-primary-fg"
                    : "bg-surface-2 hover:text-link"
                }`}
              >
                {c.shortName}
              </Link>
            ))}
          </div>

          <form action="/learn" method="get" role="search" className="flex gap-2">
            {category && <input type="hidden" name="category" value={category} />}
            <label htmlFor="learn-q" className="sr-only">
              Search articles
            </label>
            <input
              id="learn-q"
              name="q"
              type="search"
              defaultValue={q ?? ""}
              placeholder="Search free articles..."
              className="border-line bg-surface min-h-11 rounded-md border px-3.5 text-sm"
            />
            <button
              type="submit"
              className="bg-primary text-primary-fg min-h-11 rounded-md px-4 text-sm font-semibold"
            >
              Search
            </button>
          </form>
        </div>

        <h2 id="all-articles-heading" className="sr-only">
          Articles
        </h2>

        {articles.length === 0 ? (
          <p className="text-muted py-8 text-center">
            No articles matched your filter.{" "}
            <Link href="/learn" className="link">
              View all articles
            </Link>
            .
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((art) => (
              <article key={art.id} className="card flex flex-col justify-between p-5">
                <div>
                  <div className="text-muted mb-2 flex flex-wrap items-center gap-2 text-xs">
                    <LevelBadge level={art.level} />
                    {art.publishedAt && <span>{formatDate(art.publishedAt)}</span>}
                    <span>•</span>
                    <span>{readingTime(art.body)} min read</span>
                  </div>
                  <h3 className="text-lg leading-snug font-bold">
                    <Link href={`/learn/${art.slug}`} className="hover:text-link no-underline">
                      {art.title}
                    </Link>
                  </h3>
                  <p className="text-muted mt-2 text-sm">{art.excerpt}</p>
                </div>
                <Link
                  href={`/learn/${art.slug}`}
                  className="text-link mt-4 inline-flex items-center gap-1 text-sm font-semibold no-underline hover:underline"
                >
                  Read article <ArrowRight className="size-4" aria-hidden />
                </Link>
              </article>
            ))}
          </div>
        )}
      </Section>

      {/* Guided learning paths */}
      <Section tone="warm" labelledBy="hub-paths-heading">
        <SectionHeading
          id="hub-paths-heading"
          eyebrow="Structured self-study"
          title="Guided learning paths"
          intro="Work through our recommended sequence and mark each step complete."
        />
        <div className="space-y-6">
          {learningPaths.map((p) => (
            <LearningPath key={p.slug} path={p} interactive />
          ))}
        </div>
      </Section>

      <Section tone="tint">
        <div className="mx-auto max-w-xl space-y-4 text-center">
          <h2 className="gold-rule text-center text-2xl">
            Get new beginner guides and checklists by email
          </h2>
          <NewsletterForm source="learn-hub" idPrefix="learn-hub" />
        </div>
      </Section>
    </>
  );
}
