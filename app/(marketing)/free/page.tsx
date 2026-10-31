import type { Metadata } from "next";
import Link from "next/link";
import { FileDown, ArrowRight } from "lucide-react";
import { PageHeader, Section, SectionHeading } from "@/components/ui/Layout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { NewsletterForm } from "@/components/marketing/NewsletterForm";
import { Badge } from "@/components/ui/Badge";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";
import { learningPaths } from "@/content/paths";
import { seedProducts } from "@/content/products";

export const metadata: Metadata = {
  title: "Free Starter Resources & Sample Chapters",
  description:
    "Download the free Cryptocurrency Safety Checklist PDF, sample eBook chapters, and beginner learning paths.",
  alternates: { canonical: "/free" },
};

export default function FreeResourcesPage() {
  const sampleChapters = seedProducts.filter((p) => Boolean(p.sampleFileKey));

  return (
    <>
      <PageHeader
        title="Start Learning for Free"
        intro="Practical checklists, sample eBook chapters, and step-by-step beginner guides—no payment required."
        breadcrumbs={<Breadcrumbs items={[{ name: "Free resources" }]} />}
      />

      <Section tone="tint" labelledBy="checklist-heading">
        <div className="grid items-center gap-8 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-7">
            <Badge tone="gold">Free starter PDF</Badge>
            <h2 id="checklist-heading" className="gold-rule text-2xl">
              Cryptocurrency Safety Checklist (1-page PDF)
            </h2>
            <p className="text-muted">
              Keep this printable checklist beside you before setting up a wallet, writing down a
              recovery phrase, or using P2P with M-Pesa. Enter your email to receive the checklist
              and beginner study notes, or download the PDF directly below.
            </p>
            <p className="text-sm">
              <a
                href="/samples/crypto-safety-checklist.pdf"
                download
                className="link inline-flex items-center gap-1.5 font-semibold"
              >
                <FileDown className="size-4" aria-hidden />
                Download Cryptocurrency Safety Checklist (PDF)
              </a>
            </p>
          </div>

          <div className="card p-6 lg:col-span-5">
            <NewsletterForm
              source="free-page"
              buttonLabel="Send me the free checklist"
              idPrefix="free-page"
            />
          </div>
        </div>
      </Section>

      <Section labelledBy="samples-heading">
        <SectionHeading
          id="samples-heading"
          eyebrow="Try before you buy"
          title="Free sample chapters from our eBooks"
          intro="Read the first chapter of any eBook as a PDF before deciding whether to purchase the full edition."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {sampleChapters.map((p) => (
            <div key={p.slug} className="card flex flex-col justify-between gap-4 p-5">
              <div>
                <h3 className="text-lg font-bold">
                  <Link href={`/shop/${p.slug}`} className="hover:text-link no-underline">
                    {p.title}
                  </Link>
                </h3>
                <p className="text-muted mt-1 text-sm">{p.subtitle}</p>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <a
                  href={`/${p.sampleFileKey}`}
                  download
                  className="bg-primary text-primary-fg hover:bg-primary-hover inline-flex min-h-11 items-center gap-2 rounded-md px-4 font-semibold no-underline"
                >
                  <FileDown className="size-4" aria-hidden />
                  <span>Read free sample (PDF)</span>
                </a>
                <Link
                  href={`/shop/${p.slug}`}
                  className="text-link inline-flex items-center gap-1 font-semibold no-underline hover:underline"
                >
                  Book details <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="warm" labelledBy="free-paths-heading">
        <SectionHeading
          id="free-paths-heading"
          eyebrow="Structured self-study"
          title="Free guided learning paths"
          intro="Follow our recommended reading order and track your progress right in your browser."
        />
        <div className="grid gap-6 md:grid-cols-2">
          {learningPaths.map((p) => (
            <div key={p.slug} className="card flex flex-col justify-between p-6">
              <div>
                <h3 className="text-xl font-bold">{p.title}</h3>
                <p className="text-muted mt-1.5 text-sm">{p.intro}</p>
                <p className="text-muted mt-3 text-xs font-semibold">
                  {p.steps.length} structured steps
                </p>
              </div>
              <div className="mt-5">
                <Link
                  href={`/learn/paths/${p.slug}`}
                  className="text-link inline-flex items-center gap-1.5 font-semibold no-underline hover:underline"
                >
                  Start {p.title} <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <DisclaimerBanner variant="crypto" compact />
        </div>
      </Section>
    </>
  );
}
