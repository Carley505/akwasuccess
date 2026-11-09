import type { Metadata } from "next";
import { Briefcase, Wrench, ArrowRight } from "lucide-react";
import { PageHeader, Section } from "@/components/ui/Layout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { LinkButton } from "@/components/ui/Button";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";

export const metadata: Metadata = {
  title: "Services & Consulting",
  description:
    "Cryptocurrency, blockchain and financial education consulting, plus domestic and industrial electrical installation services.",
  alternates: { canonical: "/services" },
};

export default function ServicesOverviewPage() {
  return (
    <>
      <PageHeader
        title="Services & Consulting"
        intro="Educational consulting on cryptocurrency, blockchain and personal finance, plus hands-on domestic and industrial electrical installation."
        breadcrumbs={<Breadcrumbs items={[{ name: "Services" }]} />}
      />

      <Section>
        <div className="grid gap-8 md:grid-cols-2">
          <article className="card flex flex-col justify-between p-6 md:p-8">
            <div className="space-y-4">
              <div className="bg-tint text-link inline-flex size-12 items-center justify-center rounded-lg">
                <Briefcase className="size-6" strokeWidth={1.75} aria-hidden />
              </div>
              <h2 className="text-2xl font-bold">
                Cryptocurrency, Blockchain &amp; Financial Education Consulting
              </h2>
              <p className="text-muted">
                Practical, one-on-one or small-group educational sessions covering wallet setup,
                recovery phrase security, P2P safety, understanding blockchain technology, and
                low-risk financial literacy principles.
              </p>
              <ul className="text-muted list-disc space-y-1.5 pl-5 text-sm">
                <li>Cryptocurrency &amp; blockchain fundamentals for beginners</li>
                <li>Wallet security &amp; recovery-phrase protection walkthrough</li>
                <li>Safe P2P transaction habits &amp; scam prevention</li>
                <li>Understanding money, wealth growth &amp; low-risk investing education</li>
              </ul>
            </div>
            <div className="mt-8">
              <LinkButton
                href="/services/consulting"
                iconRight={<ArrowRight className="size-4" aria-hidden />}
              >
                View consulting packages &amp; book
              </LinkButton>
            </div>
          </article>

          <article className="card flex flex-col justify-between p-6 md:p-8">
            <div className="space-y-4">
              <div className="bg-tint text-link inline-flex size-12 items-center justify-center rounded-lg">
                <Wrench className="size-6" strokeWidth={1.75} aria-hidden />
              </div>
              <h2 className="text-2xl font-bold">
                Domestic &amp; Industrial Electrical Installation
              </h2>
              <p className="text-muted">
                Safe, compliant electrical wiring, fault troubleshooting, instrumentation, and
                automation support for homes, commercial buildings, and industrial facilities.
              </p>
              <ul className="text-muted list-disc space-y-1.5 pl-5 text-sm">
                <li>Domestic house wiring, distribution boards &amp; earthing</li>
                <li>Industrial power, control panels, sensors &amp; PLC troubleshooting</li>
                <li>Instrumentation calibration &amp; process control support</li>
                <li>Electrical safety inspections &amp; upgrades</li>
              </ul>
            </div>
            <div className="mt-8">
              <LinkButton
                href="/services/electrical"
                iconRight={<ArrowRight className="size-4" aria-hidden />}
              >
                Request an installation quote
              </LinkButton>
            </div>
          </article>
        </div>

        <div className="mt-10">
          <DisclaimerBanner variant="crypto" />
        </div>
      </Section>
    </>
  );
}
