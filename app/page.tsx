import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, FileDown, ShieldCheck, Wrench, Briefcase } from "lucide-react";
import { categories } from "@/content/categories";
import { customerJourney, learningPaths } from "@/content/paths";
import { homeFaqs } from "@/content/faqs";
import { site } from "@/content/site";
import { Section, SectionHeading } from "@/components/ui/Layout";
import { LinkButton } from "@/components/ui/Button";
import { TrustRow } from "@/components/ui/Trust";
import { CategoryCard } from "@/components/ui/CategoryCard";
import { BookMockup } from "@/components/product/BookMockup";
import { ProductCard } from "@/components/product/ProductCard";
import { LearningPath } from "@/components/marketing/LearningPath";
import { NewsletterForm } from "@/components/marketing/NewsletterForm";
import { Accordion } from "@/components/ui/Accordion";
import { Badge } from "@/components/ui/Badge";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getApprovedTestimonials,
  getArticles,
  getFeaturedProducts,
} from "@/lib/db/queries";
import { formatDate, readingTime } from "@/lib/utils";
import { t } from "@/lib/i18n";

export default async function HomePage() {
  const [featured, latestArticles, testimonials] = await Promise.all([
    getFeaturedProducts(4),
    getArticles({ limit: 3 }),
    getApprovedTestimonials(),
  ]);

  const heroBooks = featured.slice(0, 3);

  return (
    <>
      {/* 1. Hero */}
      <section className="bg-surface-2 border-line w-full max-w-full overflow-x-clip border-b py-10 sm:py-12 md:py-20">
        <div className="container-site grid items-center gap-8 sm:gap-10 lg:grid-cols-12">
          <div className="min-w-0 space-y-5 sm:space-y-6 lg:col-span-7">
            <p className="text-gold-text text-xs font-bold tracking-wider uppercase sm:text-sm">
              {site.name} • {site.tagline}
            </p>
            <h1 className="gold-rule text-3xl">
              Learn practical skills for money, technology and life.
            </h1>
            <p className="text-muted max-w-xl text-base sm:text-lg">
              Beginner-friendly eBooks, courses, tutorials and one-on-one consulting on
              cryptocurrency, personal finance, electrical &amp; automation skills, and everyday
              wellbeing.
            </p>

            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap">
              <LinkButton href="/shop" size="lg">
                {t.actions.browseEbooks}
              </LinkButton>
              <LinkButton href="/learn" variant="secondary" size="lg">
                {t.actions.startLearningFree}
              </LinkButton>
            </div>

            <TrustRow className="pt-2" />
          </div>

          {/* Flat 3-book mockup showcase (right on desktop, below on mobile) */}
          <div className="min-w-0 lg:col-span-5">
            <div className="mx-auto grid max-w-sm grid-cols-3 items-end gap-2.5 sm:max-w-md sm:gap-4">
              {heroBooks.map((b, idx) => (
                <Link
                  key={b.id}
                  href={`/shop/${b.slug}`}
                  className={idx === 1 ? "-translate-y-2 no-underline" : "no-underline"}
                >
                  <BookMockup
                    title={b.title}
                    categorySlug={b.categorySlug}
                    type={b.type}
                    cover={b.cover}
                    priority={idx === 1}
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Category cards (5 pillars) */}
      <Section labelledBy="pillars-heading">
        <SectionHeading
          id="pillars-heading"
          eyebrow="Five learning pillars"
          title="Choose what you want to understand next"
          intro="Clear, structured education written for beginners worldwide."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {categories.map((cat) => (
            <CategoryCard key={cat.slug} category={cat} />
          ))}
        </div>
      </Section>

      {/* 3. Featured eBooks */}
      <Section tone="warm" labelledBy="featured-heading">
        <SectionHeading
          id="featured-heading"
          eyebrow="Featured eBooks"
          title="Practical guides you can read on any phone or computer"
          intro="Download a free sample chapter on any book page before you buy."
          action={
            <LinkButton
              href="/shop"
              variant="secondary"
              size="sm"
              iconRight={<ArrowRight className="size-4" aria-hidden />}
            >
              {t.actions.viewAll}
            </LinkButton>
          }
        />

        {/* 1-col on mobile, 2-col on tablet, 4-col on desktop */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </Section>

      {/* 4. How it works / Your Learning Journey */}
      <Section labelledBy="journey-heading">
        <SectionHeading
          id="journey-heading"
          eyebrow="How it works"
          title="Your learning journey, step by step"
          intro="Start with free guides, go deeper with an eBook or course, and apply what you learn."
        />
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {customerJourney.map((step, i) => (
            <li key={step.title} className="card flex flex-col gap-2 p-5">
              <span className="border-gold-500 text-fg inline-flex size-9 items-center justify-center rounded-full border-2 font-serif text-base font-bold">
                {i + 1}
              </span>
              <h3 className="mt-1 text-lg font-bold">{step.title}</h3>
              <p className="text-muted text-sm">{step.summary}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* 5. Learning paths */}
      <Section tone="warm" labelledBy="paths-heading">
        <SectionHeading
          id="paths-heading"
          eyebrow="Guided learning paths"
          title="Follow a clear order from beginner to confident"
          intro="No guesswork about what to read first. Pick a path and work through one topic at a time."
        />
        <div className="space-y-6">
          {learningPaths.map((path) => (
            <LearningPath key={path.slug} path={path} compact />
          ))}
        </div>
      </Section>

      {/* 6. Free resource / lead magnet */}
      <Section tone="tint" labelledBy="lead-magnet-heading">
        <div className="grid items-center gap-6 sm:gap-8 lg:grid-cols-12">
          <div className="min-w-0 space-y-3 lg:col-span-7">
            <Badge tone="gold">Free PDF checklist</Badge>
            <h2 id="lead-magnet-heading" className="gold-rule text-2xl">
              Free: Cryptocurrency Safety Checklist (PDF)
            </h2>
            <p className="text-muted max-w-xl">
              Not ready to buy yet? Start with our one-page safety checklist covering recovery
              phrases, wallet security, and how to spot common P2P scams.
            </p>
            <p className="text-sm">
              <a
                href="/samples/crypto-safety-checklist.pdf"
                download
                className="link inline-flex flex-wrap items-center gap-1.5 font-semibold"
              >
                <FileDown className="size-4 shrink-0" aria-hidden />
                <span>Or download the PDF directly right now</span>
              </a>
            </p>
          </div>
          <div className="card min-w-0 p-4 sm:p-6 lg:col-span-5">
            <NewsletterForm
              source="home-lead-magnet"
              buttonLabel="Send me the checklist"
              idPrefix="home-magnet"
            />
          </div>
        </div>
      </Section>

      {/* 7. About snippet */}
      <Section labelledBy="about-snippet-heading">
        <div className="grid items-center gap-6 sm:gap-8 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-4">
            <div className="card bg-surface-2 flex aspect-[4/3] flex-col items-center justify-center p-5 text-center sm:p-6">
              <div className="bg-tint text-link mb-3 grid size-16 place-items-center rounded-full font-serif text-2xl font-bold">
                AS
              </div>
              <p className="font-serif text-lg font-bold">Founder, Akwasuccess</p>
              <p className="text-muted mt-1 text-xs">
                Technical &amp; Financial Educator • Global Online Platform
              </p>
              <p className="text-muted mt-2 text-[11px]">
                {/* TODO: owner to supply real founder photo */}
                [Owner photo placeholder — see TODO_OWNER.md]
              </p>
            </div>
          </div>

          <div className="space-y-4 lg:col-span-8">
            <p className="text-gold-text text-sm font-bold tracking-wider uppercase">
              About the teacher
            </p>
            <h2 id="about-snippet-heading" className="gold-rule text-2xl">
              Knowledge as a tool for personal and financial growth
            </h2>
            <p className="text-muted">
              Akwasuccess was created to make practical subjects—money, digital assets, electrical
              and automation systems, and personal wellbeing—clear and approachable for everyday
              learners. Every guide is written in plain language, grounded in real hands-on
              experience, and honest about risks. Whether you are studying for your career or
              making sense of the digital economy, you learn at your own pace without hype.
            </p>
            <ul className="text-muted flex flex-wrap gap-2 text-xs font-semibold">
              <li className="border-line bg-surface-2 rounded-full border px-3 py-1">
                Electrical, Electronics &amp; Instrumentation
              </li>
              <li className="border-line bg-surface-2 rounded-full border px-3 py-1">
                Industrial Automation &amp; PLC Systems
              </li>
              <li className="border-line bg-surface-2 rounded-full border px-3 py-1">
                Cryptocurrency &amp; Financial Literacy Education
              </li>
            </ul>
            <div className="pt-2">
              <LinkButton href="/about" variant="secondary" size="sm">
                Read the full story
              </LinkButton>
            </div>
          </div>
        </div>
      </Section>

      {/* 8. Social proof (real testimonials only) OR "What you will get" benefits strip */}
      <Section tone="warm" labelledBy="proof-heading">
        {testimonials.length > 0 ? (
          <>
            <SectionHeading
              id="proof-heading"
              eyebrow="Reader stories"
              title="What learners say"
              intro="Real feedback shared with permission. Individual experiences vary; all material is educational."
            />
            <div className="grid gap-4 md:grid-cols-3">
              {testimonials.slice(0, 3).map((item) => (
                <blockquote key={item.id} className="card flex flex-col justify-between p-5">
                  <p className="text-base">&ldquo;{item.quote}&rdquo;</p>
                  <footer className="text-muted mt-4 text-xs font-semibold">
                    {item.name}
                    {item.location ? ` • ${item.location}` : ""}
                    {item.productUsed ? ` (${item.productUsed})` : ""}
                  </footer>
                </blockquote>
              ))}
            </div>
          </>
        ) : (
          <>
            <SectionHeading
              id="proof-heading"
              eyebrow="Why learn with Akwasuccess"
              title="What you will get with every guide"
              intro="No hype or unrealistic promises—just clear, structured explanations you can use."
            />
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: BookOpen,
                  title: "Written in plain English",
                  body: "Every concept is explained from scratch with relatable, real-world examples for learners everywhere.",
                },
                {
                  icon: ShieldCheck,
                  title: "Honest about risks",
                  body: "We teach safety, recovery-phrase protection, and risk awareness first—never 'guaranteed returns'.",
                },
                {
                  icon: CheckCircle2,
                  title: "Read on any device, keep forever",
                  body: "Pay securely in under a minute by card in USD, download your PDF immediately, and get free future updates.",
                },
              ].map(({ icon: Icon, title, body }) => (
                <div key={title} className="card p-5">
                  <div className="bg-tint text-link mb-3 inline-flex size-11 items-center justify-center rounded-lg">
                    <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                  </div>
                  <h3 className="text-lg font-bold">{title}</h3>
                  <p className="text-muted mt-1.5 text-sm">{body}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </Section>

      {/* 9. Services teaser */}
      <Section labelledBy="services-heading">
        <SectionHeading
          id="services-heading"
          eyebrow="Services & consulting"
          title="Need personal guidance or hands-on technical work?"
          intro="Book a one-on-one educational consulting session or request a quote for electrical installation."
        />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card flex flex-col justify-between p-6">
            <div>
              <div className="bg-tint text-link mb-4 inline-flex size-12 items-center justify-center rounded-lg">
                <Briefcase className="size-6" strokeWidth={1.75} aria-hidden />
              </div>
              <h3 className="text-xl font-bold">
                Crypto, Blockchain &amp; Financial Education Consulting
              </h3>
              <p className="text-muted mt-2 text-sm">
                One-on-one and small-group educational sessions covering wallet setup, security, P2P
                safety, understanding digital assets, and low-risk financial literacy concepts.
              </p>
            </div>
            <div className="mt-6">
              <LinkButton href="/services/consulting" variant="secondary">
                Explore consulting
              </LinkButton>
            </div>
          </div>

          <div className="card flex flex-col justify-between p-6">
            <div>
              <div className="bg-tint text-link mb-4 inline-flex size-12 items-center justify-center rounded-lg">
                <Wrench className="size-6" strokeWidth={1.75} aria-hidden />
              </div>
              <h3 className="text-xl font-bold">
                Domestic &amp; Industrial Electrical Installation
              </h3>
              <p className="text-muted mt-2 text-sm">
                Safe, reliable electrical wiring, troubleshooting, instrumentation, and automation
                support for homes, workshops, and industrial facilities.
              </p>
            </div>
            <div className="mt-6">
              <LinkButton href="/services/electrical" variant="secondary">
                Request an electrical quote
              </LinkButton>
            </div>
          </div>
        </div>
      </Section>

      {/* 10. Latest articles */}
      <Section tone="warm" labelledBy="articles-heading">
        <SectionHeading
          id="articles-heading"
          eyebrow="Free learning hub"
          title="Latest beginner guides"
          intro="Read free step-by-step articles before diving into our full eBooks and courses."
          action={
            <LinkButton
              href="/learn"
              variant="secondary"
              size="sm"
              iconRight={<ArrowRight className="size-4" aria-hidden />}
            >
              All free articles
            </LinkButton>
          }
        />
        <div className="grid gap-5 md:grid-cols-3">
          {latestArticles.map((art) => (
            <article key={art.id} className="card flex flex-col justify-between p-5">
              <div>
                <div className="text-muted mb-2 flex items-center gap-2 text-xs">
                  {art.publishedAt && <span>{formatDate(art.publishedAt)}</span>}
                  <span>•</span>
                  <span>{readingTime(art.body)} min read</span>
                </div>
                <h3 className="text-lg leading-snug font-bold">
                  <Link href={`/learn/${art.slug}`} className="hover:text-link no-underline">
                    {art.title}
                  </Link>
                </h3>
                <p className="text-muted mt-2 line-clamp-3 text-sm">{art.excerpt}</p>
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
      </Section>

      {/* 11. FAQ */}
      <Section labelledBy="faq-heading">
        <SectionHeading
          id="faq-heading"
          eyebrow="Common questions"
          title="Frequently asked questions"
          intro="Clear answers on USD card payments, instant delivery, device support, and refunds."
        />
        <div className="mx-auto max-w-3xl">
          <Accordion
            items={homeFaqs.map((f, i) => ({
              id: `home-faq-${i}`,
              title: f.q,
              content: <p>{f.a}</p>,
            }))}
          />
          <p className="text-muted mt-4 text-center text-sm">
            Have another question?{" "}
            <Link href="/faq" className="link">
              View all FAQs
            </Link>{" "}
            or{" "}
            <Link href="/contact" className="link">
              contact us
            </Link>
            .
          </p>
        </div>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: homeFaqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }}
        />
      </Section>

      {/* 12. Final CTA band (dark green background, gold accent line) */}
      <Section tone="dark" labelledBy="final-cta-heading">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mx-auto mb-4 block h-1 w-14 rounded-full bg-gold-500" aria-hidden />
          <h2 id="final-cta-heading" className="text-2xl text-white md:text-3xl">
            Start your learning journey today.
          </h2>
          <p className="mt-3 text-white/85">
            Explore our beginner-friendly eBooks or start with a free guide at your own pace.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
            <LinkButton href="/shop" size="lg">
              {t.actions.browseEbooks}
            </LinkButton>
            <LinkButton href="/free" variant="gold" size="lg">
              Get free resources
            </LinkButton>
          </div>
        </div>
      </Section>
    </>
  );
}
