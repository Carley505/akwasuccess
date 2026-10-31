import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { getCategory } from "@/content/categories";
import { productDefaultFaqs } from "@/content/faqs";
import { getPath } from "@/content/paths";
import { isSampleDataVisible } from "@/content/site";
import { PageHeader, Section } from "@/components/ui/Layout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge, FormatBadge, LevelBadge, SampleBadge, typeLabel } from "@/components/ui/Badge";
import { PriceTag } from "@/components/ui/PriceTag";
import { RatingStars } from "@/components/ui/RatingStars";
import { GuaranteeBadge, PaymentBadges } from "@/components/ui/Trust";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";
import { Accordion } from "@/components/ui/Accordion";
import { Tabs } from "@/components/ui/Tabs";
import { ShopCatalog, type ActiveFilters } from "@/components/product/ShopCatalog";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductBuyActions } from "@/components/product/ProductBuyActions";
import { ProductCard } from "@/components/product/ProductCard";
import { ReviewForm } from "@/components/product/ReviewForm";
import { JsonLd } from "@/components/seo/JsonLd";
import { getProductBySlug, queryProducts } from "@/lib/db/queries";
import { bundleSavings, effectivePrice, isOnSale, isPurchasable } from "@/lib/pricing";
import { absoluteUrl, formatDate, formatKes } from "@/lib/utils";
import { t } from "@/lib/i18n";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function single(val: string | string[] | undefined): string | undefined {
  return Array.isArray(val) ? val[0] : val;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const cat = getCategory(slug);
  if (cat) {
    return {
      title: `${cat.name} eBooks & Courses`,
      description: cat.description,
      alternates: { canonical: `/shop/${cat.slug}` },
    };
  }

  const data = await getProductBySlug(slug);
  if (!data) return { title: "Product not found" };
  const { product } = data;
  return {
    title: product.seoTitle || product.title,
    description: product.seoDescription || product.subtitle || product.description.slice(0, 150),
    alternates: { canonical: `/shop/${product.slug}` },
  };
}

export default async function ShopCategoryOrProductPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;

  // 1. Category route (/shop/crypto | /shop/finance | /shop/technical | /shop/psychology)
  const category = getCategory(slug);
  if (category) {
    if (category.slug === "services") {
      redirect("/services");
    }
    const sp = await searchParams;
    const activeFilters: ActiveFilters = {
      format: single(sp.format),
      level: single(sp.level),
      pricing: single(sp.pricing),
      maxPrice: single(sp.maxPrice),
      q: single(sp.q),
      sort: single(sp.sort),
    };
    const { items } = await queryProducts({
      category: category.slug,
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
          title={category.name}
          intro={category.description}
          breadcrumbs={
            <Breadcrumbs items={[{ name: "Shop", href: "/shop" }, { name: category.shortName }]} />
          }
        >
          <ul className="mt-4 flex flex-wrap gap-1.5 text-xs">
            {category.topics.slice(0, 8).map((topic) => (
              <li
                key={topic}
                className="border-line bg-surface rounded-full border px-2.5 py-1 font-medium"
              >
                {topic}
              </li>
            ))}
          </ul>
        </PageHeader>

        <Section>
          <ShopCatalog
            products={items}
            activeCategory={category}
            initialFilters={activeFilters}
          />
          {category.disclaimer && (
            <div className="mt-10">
              <DisclaimerBanner variant={category.disclaimer} />
            </div>
          )}
        </Section>
      </>
    );
  }

  // 2. Product detail route (/shop/[slug])
  const data = await getProductBySlug(slug);
  if (!data) notFound();

  const { product, reviews, related, bundleProducts } = data;
  const prodCategory = getCategory(product.categorySlug);
  const hideSamplePrice = product.isSample && !isSampleDataVisible;
  const displayProduct = {
    ...product,
    priceKes: hideSamplePrice ? 0 : product.priceKes,
    salePriceKes: hideSamplePrice ? null : product.salePriceKes,
  };

  const price = effectivePrice(displayProduct);
  const canBuy = isPurchasable(displayProduct);
  const onSale = isOnSale(displayProduct);

  const ratingCount = reviews.length;
  const ratingAvg =
    ratingCount > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / ratingCount : 0;

  const faqs =
    product.faqs && product.faqs.length > 0 ? product.faqs : productDefaultFaqs;

  const outcomes =
    product.outcomes && product.outcomes.length > 0
      ? product.outcomes
      : [
          "Understand the core principles step by step in plain English",
          "Build practical knowledge you can apply with confidence",
          "Avoid common beginner pitfalls and safety mistakes",
        ];

  const audienceFor =
    product.audienceFor && product.audienceFor.length > 0
      ? product.audienceFor
      : [
          "Beginners looking for a clear, structured introduction",
          "Students, self-learners, and professionals refreshing their foundations",
        ];

  const audienceNotFor =
    product.audienceNotFor && product.audienceNotFor.length > 0
      ? product.audienceNotFor
      : [
          "Anyone looking for get-rich-quick schemes, trading signals, or profit promises",
        ];

  const matchingPath =
    product.categorySlug === "technical"
      ? getPath("technical")
      : product.categorySlug === "crypto"
        ? getPath("crypto")
        : undefined;

  const savingsInfo =
    product.type === "bundle" && bundleProducts.length > 0 && canBuy
      ? bundleSavings(
          price,
          bundleProducts.map((bp) => effectivePrice(bp)),
        )
      : null;

  const disclaimerVariant: "crypto" | "health" =
    product.categorySlug === "psychology" ? "health" : "crypto";

  return (
    <>
      <div className="bg-surface-2 border-line border-b py-4">
        <div className="container-site">
          <Breadcrumbs
            items={[
              { name: "Shop", href: "/shop" },
              ...(prodCategory
                ? [{ name: prodCategory.shortName, href: prodCategory.href }]
                : []),
              { name: product.title },
            ]}
          />
        </div>
      </div>

      <Section>
        {/* Top two-column hero: Gallery (left) + Sticky Buy Box (right) */}
        <div className="grid items-start gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <ProductGallery
              title={product.title}
              subtitle={product.subtitle}
              categorySlug={product.categorySlug}
              type={product.type}
              cover={product.cover}
              previewImages={product.previewImages ?? []}
              toc={product.toc ?? []}
              outcomes={outcomes}
            />
          </div>

          <div className="lg:sticky lg:top-24 lg:col-span-7">
            <div className="card @container space-y-5 p-6 md:p-8">
              <div className="flex flex-wrap items-center gap-2">
                {prodCategory && <Badge tone="green">{prodCategory.name}</Badge>}
                <Badge tone="outline-gold">{typeLabel[product.type] ?? "eBook"}</Badge>
                <LevelBadge level={product.level} />
                {product.isSample && isSampleDataVisible && <SampleBadge />}
              </div>

              <h1 className="text-2xl md:text-3xl">{product.title}</h1>
              {product.subtitle && <p className="text-muted text-lg">{product.subtitle}</p>}

              {ratingCount > 0 && <RatingStars rating={ratingAvg} count={ratingCount} />}

              <div className="border-line flex flex-wrap items-baseline justify-between gap-3 border-y py-4">
                <div>
                  <PriceTag
                    amountKes={price}
                    originalKes={onSale ? displayProduct.priceKes : null}
                    isFree={displayProduct.isFree}
                    comingSoon={!canBuy}
                    size="lg"
                  />
                  {savingsInfo && savingsInfo.savings > 0 && (
                    <p className="text-link mt-1 text-xs font-semibold">
                      Transparent bundle savings: save {formatKes(savingsInfo.savings)} (
                      {savingsInfo.percent}% vs buying separately at{" "}
                      {formatKes(savingsInfo.separate)})
                    </p>
                  )}
                </div>
                <span className="text-link text-xs font-semibold">
                  {t.product.instantDownload}
                </span>
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
                  sampleFileKey: product.sampleFileKey,
                }}
              />

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <PaymentBadges />
                <GuaranteeBadge />
              </div>

              {/* Mini facts */}
              <dl className="border-line grid grid-cols-2 gap-3 border-t pt-4 text-xs sm:grid-cols-3">
                <div>
                  <dt className="text-muted">Format</dt>
                  <dd className="mt-0.5 flex flex-wrap gap-1 font-semibold">
                    {(product.formats?.length ? product.formats : ["PDF"]).map((f) => (
                      <FormatBadge key={f} format={f} />
                    ))}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Length</dt>
                  <dd className="mt-0.5 font-semibold">
                    {product.pages && !hideSamplePrice
                      ? `${product.pages} pages`
                      : "Full guide (owner updating page count)"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Level</dt>
                  <dd className="mt-0.5 font-semibold capitalize">{product.level}</dd>
                </div>
                <div>
                  <dt className="text-muted">Language</dt>
                  <dd className="mt-0.5 font-semibold">{product.language}</dd>
                </div>
                <div>
                  <dt className="text-muted">Last updated</dt>
                  <dd className="mt-0.5 font-semibold">
                    {product.lastUpdatedOn ? formatDate(product.lastUpdatedOn) : "Current edition"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Devices</dt>
                  <dd className="mt-0.5 font-semibold">Phone, tablet, laptop</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Below: Tabs on desktop, stacked sections with anchor nav on mobile */}
        <div className="mt-14">
          <Tabs
            stackOnMobile
            ariaLabel="Product details"
            items={[
              {
                id: "overview",
                label: "What you will learn",
                content: (
                  <div className="grid gap-8 lg:grid-cols-12">
                    <div className="space-y-4 lg:col-span-7">
                      <h2 className="gold-rule text-2xl">What you will learn</h2>
                      <p className="text-muted">{product.description}</p>
                      <ul className="mt-4 space-y-2.5">
                        {outcomes.map((o) => (
                          <li key={o} className="flex items-start gap-2.5">
                            <CheckCircle2
                              className="text-link mt-0.5 size-5 shrink-0"
                              aria-hidden
                            />
                            <span>{o}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Who this is for / not for */}
                    <div className="space-y-4 lg:col-span-5">
                      <div className="card p-5">
                        <h3 className="text-lg font-bold">Who this is for</h3>
                        <ul className="mt-3 space-y-2 text-sm">
                          {audienceFor.map((item) => (
                            <li key={item} className="flex items-start gap-2">
                              <CheckCircle2
                                className="text-link mt-0.5 size-4 shrink-0"
                                aria-hidden
                              />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="card p-5">
                        <h3 className="text-lg font-bold">Who this is NOT for</h3>
                        <ul className="mt-3 space-y-2 text-sm">
                          {audienceNotFor.map((item) => (
                            <li key={item} className="flex items-start gap-2">
                              <XCircle
                                className="text-muted mt-0.5 size-4 shrink-0"
                                aria-hidden
                              />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                id: "toc",
                label: "Table of contents",
                content: (
                  <div className="max-w-3xl space-y-4">
                    <h2 className="gold-rule text-2xl">Table of contents</h2>
                    {product.toc && product.toc.length > 0 ? (
                      <Accordion
                        defaultOpen={0}
                        items={product.toc.map((sec, idx) => ({
                          id: `toc-${idx}`,
                          title: sec.title,
                          content:
                            sec.items && sec.items.length > 0 ? (
                              <ul className="list-disc space-y-1 pl-5 text-sm">
                                {sec.items.map((it) => (
                                  <li key={it}>{it}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm">Included in the full edition.</p>
                            ),
                        }))}
                      />
                    ) : (
                      <p className="text-muted text-sm">
                        The detailed chapter outline is being finalised by the owner. Download the
                        free sample PDF above to preview the opening chapter.
                      </p>
                    )}

                    {product.changelog && product.changelog.length > 0 && (
                      <div className="card mt-6 p-4 text-xs">
                        <p className="font-bold uppercase">Edition &amp; update notes</p>
                        <ul className="text-muted mt-2 space-y-1">
                          {product.changelog.map((c) => (
                            <li key={`${c.date}-${c.note}`}>
                              <strong>{formatDate(c.date)}:</strong> {c.note}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ),
              },
              {
                id: "author",
                label: "About the author",
                content: (
                  <div className="card max-w-3xl space-y-3 p-6">
                    <h2 className="text-2xl font-bold">About the author — {product.author}</h2>
                    <p className="text-muted">
                      Akwasuccess creates practical, beginner-friendly educational resources on
                      personal finance, cryptocurrency safety, electrical and automation
                      technologies, and personal wellbeing from Nairobi, Kenya. Every guide focuses
                      on clarity, safety, and honest foundations.
                    </p>
                    <Link
                      href="/about"
                      className="text-link inline-flex items-center gap-1 text-sm font-semibold no-underline hover:underline"
                    >
                      Learn more about Akwasuccess <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  </div>
                ),
              },
              {
                id: "reviews",
                label: `Reviews (${ratingCount})`,
                content: (
                  <div className="grid gap-8 lg:grid-cols-12">
                    <div className="space-y-4 lg:col-span-7">
                      <h2 className="gold-rule text-2xl">Verified buyer reviews</h2>
                      {ratingCount === 0 ? (
                        <p className="text-muted text-sm">
                          No verified buyer reviews yet. We never display fabricated reviews—if you
                          have purchased this guide, share your honest feedback using the form.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {reviews.map((r) => (
                            <article key={r.id} className="card p-5">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-bold">{r.title || `${r.rating} / 5 stars`}</p>
                                <Badge tone="green">Verified buyer</Badge>
                              </div>
                              <p className="mt-2 text-sm">{r.body}</p>
                              <p className="text-muted mt-3 text-xs">
                                {r.displayName} • {formatDate(r.createdAt)}
                              </p>
                            </article>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="lg:col-span-5">
                      <ReviewForm productId={product.id} />
                    </div>
                  </div>
                ),
              },
              {
                id: "faq",
                label: "FAQ",
                content: (
                  <div className="max-w-3xl space-y-4">
                    <h2 className="gold-rule text-2xl">Frequently asked questions</h2>
                    <Accordion
                      items={faqs.map((f, i) => ({
                        id: `pfaq-${i}`,
                        title: f.q,
                        content: <p>{f.a}</p>,
                      }))}
                    />
                  </div>
                ),
              },
            ]}
          />
        </div>

        {/* Related products & Continue the learning path */}
        {related.length > 0 && (
          <div className="mt-16 space-y-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="gold-rule text-2xl">Related resources</h2>
              {matchingPath && (
                <Link
                  href={`/learn/paths/${matchingPath.slug}`}
                  className="text-link inline-flex items-center gap-1 text-sm font-semibold no-underline hover:underline"
                >
                  Continue the {matchingPath.title} <ArrowRight className="size-4" aria-hidden />
                </Link>
              )}
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

        {/* Mandatory Disclaimer Banner */}
        <div className="mt-12">
          <DisclaimerBanner variant={disclaimerVariant} />
        </div>
      </Section>

      {/* Product + Offer (+ AggregateRating when real) JSON-LD */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.title,
          description: product.description,
          sku: product.slug,
          url: absoluteUrl(`/shop/${product.slug}`),
          brand: { "@type": "Brand", name: "Akwasuccess" },
          offers: {
            "@type": "Offer",
            priceCurrency: "KES",
            price: price,
            availability: canBuy
              ? "https://schema.org/InStock"
              : "https://schema.org/PreOrder",
            url: absoluteUrl(`/shop/${product.slug}`),
          },
          ...(ratingCount > 0
            ? {
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: Number(ratingAvg.toFixed(1)),
                  reviewCount: ratingCount,
                },
              }
            : {}),
        }}
      />
    </>
  );
}
