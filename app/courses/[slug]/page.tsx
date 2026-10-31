import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, PlayCircle } from "lucide-react";
import { getCategory } from "@/content/categories";
import { productDefaultFaqs } from "@/content/faqs";
import { isSampleDataVisible } from "@/content/site";
import { PageHeader, Section } from "@/components/ui/Layout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge, LevelBadge, SampleBadge } from "@/components/ui/Badge";
import { PriceTag } from "@/components/ui/PriceTag";
import { GuaranteeBadge, PaymentBadges } from "@/components/ui/Trust";
import { Accordion } from "@/components/ui/Accordion";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";
import { ProductBuyActions } from "@/components/product/ProductBuyActions";
import { LinkButton } from "@/components/ui/Button";
import { JsonLd } from "@/components/seo/JsonLd";
import { getCourseBySlug } from "@/lib/db/queries";
import { effectivePrice, isOnSale, isPurchasable } from "@/lib/pricing";
import { absoluteUrl } from "@/lib/utils";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCourseBySlug(slug);
  if (!data) return { title: "Course not found" };
  return {
    title: data.product.title,
    description: data.product.subtitle || data.product.description.slice(0, 150),
    alternates: { canonical: `/courses/${data.product.slug}` },
  };
}

function fmtMins(sec: number) {
  return `${Math.max(1, Math.round(sec / 60))} min`;
}

export default async function CourseDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const data = await getCourseBySlug(slug);
  if (!data) notFound();

  const { product, curriculum } = data;
  const cat = getCategory(product.categorySlug);
  const hideSamplePrice = product.isSample && !isSampleDataVisible;
  const displayProduct = {
    ...product,
    priceKes: hideSamplePrice ? 0 : product.priceKes,
    salePriceKes: hideSamplePrice ? null : product.salePriceKes,
  };

  const price = effectivePrice(displayProduct);
  const canBuy = isPurchasable(displayProduct);
  const onSale = isOnSale(displayProduct);

  const totalLessons = curriculum.reduce((n, m) => n + m.lessons.length, 0);
  const totalSec = curriculum.reduce(
    (s, m) => s + m.lessons.reduce((ls, l) => ls + (l.durationSec ?? 0), 0),
    0,
  );

  const outcomes =
    product.outcomes && product.outcomes.length > 0
      ? product.outcomes
      : [
          "Understand cryptocurrency and blockchain fundamentals clearly",
          "Set up and protect your wallets and recovery phrases",
          "Evaluate risk honestly and avoid common P2P scams",
        ];

  return (
    <>
      <PageHeader
        title={product.title}
        intro={product.subtitle || product.description}
        breadcrumbs={
          <Breadcrumbs items={[{ name: "Courses", href: "/courses" }, { name: product.title }]} />
        }
      >
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          {cat && <Badge tone="green">{cat.name}</Badge>}
          <LevelBadge level={product.level} />
          {product.isSample && isSampleDataVisible && <SampleBadge />}
          <span className="text-muted inline-flex items-center gap-1 font-medium">
            <PlayCircle className="size-4" aria-hidden /> {totalLessons} lessons
          </span>
          <span className="text-muted inline-flex items-center gap-1 font-medium">
            <Clock className="size-4" aria-hidden /> {fmtMins(totalSec)} total
          </span>
        </div>
      </PageHeader>

      <Section>
        <div className="grid items-start gap-10 lg:grid-cols-12">
          <div className="space-y-10 lg:col-span-7">
            {/* Outcomes */}
            <div>
              <h2 className="gold-rule text-2xl">What you will learn</h2>
              <p className="text-muted mt-3">{product.description}</p>
              <ul className="mt-4 space-y-2.5">
                {outcomes.map((o) => (
                  <li key={o} className="flex items-start gap-2.5">
                    <CheckCircle2 className="text-link mt-0.5 size-5 shrink-0" aria-hidden />
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Curriculum accordion */}
            <div>
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="gold-rule text-2xl">Course curriculum</h2>
                <Link
                  href={`/account/courses/${product.slug}`}
                  className="text-link text-sm font-semibold no-underline hover:underline"
                >
                  Watch free preview lesson →
                </Link>
              </div>

              {curriculum.length > 0 ? (
                <Accordion
                  defaultOpen={0}
                  items={curriculum.map((mod) => ({
                    id: mod.id,
                    title: `${mod.title} (${mod.lessons.length} lessons)`,
                    content: (
                      <ul className="divide-line divide-y text-sm">
                        {mod.lessons.map((l) => (
                          <li
                            key={l.id}
                            className="flex flex-wrap items-center justify-between gap-2 py-2.5"
                          >
                            <span className="flex items-center gap-2 font-medium text-fg">
                              <PlayCircle className="text-link size-4 shrink-0" aria-hidden />
                              <span>{l.title}</span>
                              {l.isPreview && (
                                <Link
                                  href={`/account/courses/${product.slug}?lesson=${l.slug}`}
                                  className="bg-tint text-link rounded-full px-2 py-0.5 text-xs font-semibold no-underline"
                                >
                                  Free preview
                                </Link>
                              )}
                            </span>
                            <span className="text-muted text-xs">{fmtMins(l.durationSec)}</span>
                          </li>
                        ))}
                      </ul>
                    ),
                  }))}
                />
              ) : (
                <p className="text-muted text-sm">
                  Curriculum modules and video lessons are being finalised by the owner.
                </p>
              )}
            </div>

            {/* Instructor */}
            <div className="card space-y-2 p-6">
              <h2 className="text-xl font-bold">Your instructor — Akwasuccess</h2>
              <p className="text-muted text-sm">
                Taught in a calm, structured style focused on practical understanding, safety, and
                real East African context.Includes a downloadable PDF certificate upon completion.
              </p>
            </div>

            {/* FAQs */}
            <div>
              <h2 className="gold-rule mb-4 text-2xl">Course FAQ</h2>
              <Accordion
                items={productDefaultFaqs.map((f, i) => ({
                  id: `cfaq-${i}`,
                  title: f.q,
                  content: <p>{f.a}</p>,
                }))}
              />
            </div>

            <DisclaimerBanner variant="crypto" />
          </div>

          {/* Sticky buy box */}
          <aside className="lg:sticky lg:top-24 lg:col-span-5">
            <div className="card space-y-5 p-6">
              <div className="flex items-baseline justify-between gap-2">
                <PriceTag
                  amountKes={price}
                  originalKes={onSale ? displayProduct.priceKes : null}
                  isFree={displayProduct.isFree}
                  comingSoon={!canBuy}
                  size="lg"
                />
                <span className="text-link text-xs font-semibold">Lifetime access</span>
              </div>

              <ProductBuyActions
                product={{
                  id: product.id,
                  slug: product.slug,
                  title: product.title,
                  type: product.type,
                  categorySlug: product.categorySlug,
                  priceKes: displayProduct.priceKes,
                  salePriceKes: displayProduct.salePriceKes,
                  isFree: displayProduct.isFree,
                }}
              />

              <LinkButton
                href={`/account/courses/${product.slug}`}
                variant="ghost"
                size="sm"
                block
              >
                Open course player (free preview available)
              </LinkButton>

              <PaymentBadges />
              <GuaranteeBadge />
            </div>
          </aside>
        </div>
      </Section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Course",
          name: product.title,
          description: product.description,
          provider: {
            "@type": "Organization",
            name: "Akwasuccess",
            sameAs: absoluteUrl("/"),
          },
        }}
      />
    </>
  );
}
