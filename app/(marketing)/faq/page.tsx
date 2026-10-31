import type { Metadata } from "next";
import Link from "next/link";
import { homeFaqs, productDefaultFaqs } from "@/content/faqs";
import { PageHeader, Section } from "@/components/ui/Layout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Accordion } from "@/components/ui/Accordion";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Frequently Asked Questions (FAQ)",
  description:
    "Answers to common questions about buying Akwasuccess eBooks with M-Pesa or card, instant downloads, courses, and consulting.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  const allFaqs = [...homeFaqs, ...productDefaultFaqs];

  return (
    <>
      <PageHeader
        title="Frequently Asked Questions"
        intro="Everything you need to know about M-Pesa and card checkout, instant eBook delivery, device compatibility, and our educational policy."
        breadcrumbs={<Breadcrumbs items={[{ name: "FAQ" }]} />}
      />

      <Section>
        <div className="mx-auto max-w-3xl space-y-6">
          <Accordion
            defaultOpen={0}
            items={allFaqs.map((f, i) => ({
              id: `faq-${i}`,
              title: f.q,
              content: <p>{f.a}</p>,
            }))}
          />
          <p className="text-muted text-center text-sm">
            Still need help?{" "}
            <Link href="/contact" className="link">
              Send us a message or chat on WhatsApp
            </Link>
            .
          </p>
        </div>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: allFaqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }}
        />
      </Section>
    </>
  );
}
