import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import GithubSlugger from "github-slugger";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { getCategory } from "@/content/categories";
import { Section } from "@/components/ui/Layout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge, LevelBadge } from "@/components/ui/Badge";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";
import { NewsletterForm } from "@/components/marketing/NewsletterForm";
import { ProductCard } from "@/components/product/ProductCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { getArticleBySlug } from "@/lib/db/queries";
import { absoluteUrl, formatDate, readingTime } from "@/lib/utils";

type Params = Promise<{ slug: string }>;

function extractHeadings(markdown: string): { id: string; text: string }[] {
  const slugger = new GithubSlugger();
  const lines = markdown.split(/\r?\n/);
  const headings: { id: string; text: string }[] = [];
  for (const line of lines) {
    const m = /^##\s+(.+)$/.exec(line.trim());
    if (m?.[1]) {
      const text = m[1].replace(/[*_`]/g, "").trim();
      headings.push({ id: slugger.slug(text), text });
    }
  }
  return headings;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getArticleBySlug(slug);
  if (!data) return { title: "Article not found" };
  return {
    title: data.article.seoTitle || data.article.title,
    description: data.article.seoDescription || data.article.excerpt,
    alternates: { canonical: `/learn/${data.article.slug}` },
  };
}

export default async function ArticlePage({ params }: { params: Params }) {
  const { slug } = await params;
  const data = await getArticleBySlug(slug);
  if (!data) notFound();

  const { article, relatedArticles, relatedProduct } = data;
  const cat = article.categorySlug ? getCategory(article.categorySlug) : undefined;
  const headings = extractHeadings(article.body);
  const mins = readingTime(article.body);

  return (
    <>
      <div className="bg-surface-2 border-line border-b py-10 md:py-14">
        <div className="container-site max-w-4xl">
          <Breadcrumbs
            items={[
              { name: "Learn", href: "/learn" },
              ...(cat ? [{ name: cat.shortName, href: `/learn?category=${cat.slug}` }] : []),
              { name: article.title },
            ]}
          />

          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
            {cat && <Badge tone="green">{cat.name}</Badge>}
            <LevelBadge level={article.level} />
            <span className="text-muted">{mins} min read</span>
            <span className="text-muted">•</span>
            <span className="text-muted">By {article.author}</span>
            {article.updatedAt && (
              <>
                <span className="text-muted">•</span>
                <span className="text-muted">Updated {formatDate(article.updatedAt)}</span>
              </>
            )}
          </div>

          <h1 className="gold-rule text-3xl">{article.title}</h1>
          {article.excerpt && <p className="text-muted mt-4 text-lg">{article.excerpt}</p>}
        </div>
      </div>

      <Section>
        <div className="mx-auto grid max-w-5xl items-start gap-10 lg:grid-cols-12">
          {/* Sticky Table of Contents on desktop */}
          {headings.length > 0 && (
            <aside
              aria-label="Table of contents"
              className="hidden lg:sticky lg:top-24 lg:col-span-4 lg:block"
            >
              <div className="card p-5">
                <p className="mb-3 text-xs font-bold tracking-wider uppercase">On this page</p>
                <ul className="space-y-2 text-sm">
                  {headings.map((h) => (
                    <li key={h.id}>
                      <a
                        href={`#${h.id}`}
                        className="text-muted hover:text-link block no-underline"
                      >
                        {h.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          )}

          {/* Main article body (max 65ch) */}
          <div className={headings.length > 0 ? "lg:col-span-8" : "lg:col-span-12"}>
            {/* Key takeaways box */}
            {article.keyTakeaways && article.keyTakeaways.length > 0 && (
              <div className="card bg-surface-2 mb-8 max-w-[65ch] p-5">
                <h2 className="text-lg font-bold">Key takeaways</h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {article.keyTakeaways.map((k) => (
                    <li key={k} className="flex items-start gap-2">
                      <CheckCircle2 className="text-link mt-0.5 size-4 shrink-0" aria-hidden />
                      <span>{k}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <article className="prose-site">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]}>
                {article.body}
              </ReactMarkdown>
            </article>

            {/* Relevant disclaimer */}
            {cat?.disclaimer && (
              <div className="mt-8 max-w-[65ch]">
                <DisclaimerBanner variant={cat.disclaimer} />
              </div>
            )}

            {/* Inline CTA to the matching eBook/course */}
            {relatedProduct && (
              <div className="mt-10 max-w-[65ch] space-y-3">
                <h2 className="text-xl font-bold">Go deeper with the full guide</h2>
                <div className="max-w-sm">
                  <ProductCard product={relatedProduct} />
                </div>
              </div>
            )}

            {/* Newsletter box */}
            <div className="card bg-tint mt-10 max-w-[65ch] space-y-3 p-6">
              <h2 className="text-xl font-bold">
                Free: Cryptocurrency Safety Checklist (PDF)
              </h2>
              <p className="text-muted text-sm">
                Get our 1-page printable safety checklist and new beginner guides sent to your
                inbox.
              </p>
              <NewsletterForm source={`article:${article.slug}`} idPrefix="article-nl" />
            </div>

            {/* Related articles */}
            {relatedArticles.length > 0 && (
              <div className="mt-12 max-w-[65ch] space-y-4">
                <h2 className="gold-rule text-2xl">Related articles</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {relatedArticles.map((ra) => (
                    <Link
                      key={ra.id}
                      href={`/learn/${ra.slug}`}
                      className="card hover:border-primary flex flex-col justify-between p-4 no-underline"
                    >
                      <div>
                        <h3 className="text-base font-bold">{ra.title}</h3>
                        <p className="text-muted mt-1 line-clamp-2 text-xs">{ra.excerpt}</p>
                      </div>
                      <span className="text-link mt-3 inline-flex items-center gap-1 text-xs font-semibold">
                        Read next <ArrowRight className="size-3.5" aria-hidden />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description: article.excerpt,
          author: { "@type": "Organization", name: article.author },
          datePublished: article.publishedAt?.toISOString(),
          dateModified: article.updatedAt.toISOString(),
          mainEntityOfPage: absoluteUrl(`/learn/${article.slug}`),
        }}
      />
    </>
  );
}
