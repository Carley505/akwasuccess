import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { PageHeader, Section, SectionHeading } from "@/components/ui/Layout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";
import { BookingForm } from "@/components/services/BookingForm";
import { consultingPackages } from "@/content/services";

export const metadata: Metadata = {
  title: "Crypto, Blockchain & Financial Education Consulting",
  description:
    "Book a one-on-one educational consulting session on cryptocurrency, blockchain, wallet security, P2P safety, and financial literacy.",
  alternates: { canonical: "/services/consulting" },
};

export default function ConsultingPage() {
  const offerings = [
    "Cryptocurrency & blockchain guidance for beginners",
    "Wallets & recovery-phrase security setup",
    "P2P transaction fundamentals & scam prevention",
    "Investment ideas & how to evaluate risk honestly",
    "How to grow wealth through long-term financial literacy",
    "Low-risk investing education",
  ];

  const processSteps = [
    { title: "1. Book", body: "Request a slot and tell us your current experience level." },
    { title: "2. Discovery call", body: "We align on your questions and learning goals." },
    { title: "3. Session", body: "Clear, practical walkthrough at your pace (online or in-person)." },
    { title: "4. Follow-up notes", body: "Receive a written summary and checklist of key takeaways." },
  ];

  const calLink = process.env.NEXT_PUBLIC_CAL_LINK;

  return (
    <>
      <PageHeader
        title="Cryptocurrency, Blockchain & Financial Education Consulting"
        intro="Calm, one-on-one educational guidance to help you understand digital assets, protect your wallets, and build sound financial habits."
        breadcrumbs={[
          <Breadcrumbs
            key="b"
            items={[{ name: "Services", href: "/services" }, { name: "Consulting" }]}
          />,
        ]}
      />

      <Section>
        <DisclaimerBanner variant="crypto" className="mb-10" />

        <div className="grid gap-10 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-7">
            <div>
              <h2 className="gold-rule text-2xl">What we cover</h2>
              <p className="text-muted mt-3">
                Sessions are strictly educational. We never manage client funds, ask for your
                recovery phrase, or promise investment returns.
              </p>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {offerings.map((item) => (
                  <li key={item} className="card flex items-start gap-2.5 p-4 text-sm font-medium">
                    <CheckCircle2 className="text-link mt-0.5 size-5 shrink-0" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="gold-rule text-2xl">How a consulting session works</h2>
              <ol className="mt-5 grid gap-4 sm:grid-cols-2">
                {processSteps.map((s) => (
                  <li key={s.title} className="card p-4">
                    <h3 className="font-bold">{s.title}</h3>
                    <p className="text-muted mt-1 text-sm">{s.body}</p>
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <SectionHeading
                eyebrow="Packages"
                title="Session options"
                intro="Placeholder packages—final rates are confirmed with you before payment."
              />
              <div className="grid gap-4">
                {consultingPackages.map((pkg) => (
                  <div key={pkg.id} className="card p-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="text-lg font-bold">{pkg.title}</h3>
                      <span className="text-muted text-xs font-semibold">{pkg.duration}</span>
                    </div>
                    <p className="text-muted mt-1.5 text-sm">{pkg.summary}</p>
                    <p className="text-link mt-2 text-xs font-semibold">{pkg.priceNote}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6 lg:col-span-5">
            {calLink ? (
              <div className="card overflow-hidden p-4">
                <h3 className="mb-3 text-lg font-bold">Pick a time directly</h3>
                <iframe
                  src={calLink}
                  title="Schedule a consulting session"
                  className="h-[540px] w-full rounded border-0"
                  loading="lazy"
                />
              </div>
            ) : null}
            <BookingForm />
          </div>
        </div>
      </Section>
    </>
  );
}
