import type { Metadata } from "next";
import { Cpu, Gauge, ShieldCheck, Wrench, Zap } from "lucide-react";
import { site } from "@/content/site";
import { PageHeader, Section } from "@/components/ui/Layout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ElectricalQuoteForm } from "@/components/services/ElectricalQuoteForm";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Domestic & Industrial Electrical Installation in Nairobi",
  description:
    "Domestic and industrial electrical installation, fault troubleshooting, instrumentation, and PLC automation support in Nairobi and surrounding areas.",
  alternates: { canonical: "/services/electrical" },
};

export default function ElectricalServicesPage() {
  const services = [
    {
      icon: Zap,
      title: "Domestic Electrical Installation",
      body: "Complete house wiring, lighting, sockets, distribution boards (consumer units), surge protection, and proper earthing.",
    },
    {
      icon: Wrench,
      title: "Electrical Troubleshooting & Repairs",
      body: "Systematic fault finding for tripping breakers, earth leakage, voltage drops, and damaged circuits.",
    },
    {
      icon: Gauge,
      title: "Instrumentation & Process Control",
      body: "Installation, wiring, and loop checking for temperature, pressure, level, and flow sensors and transmitters.",
    },
    {
      icon: Cpu,
      title: "Industrial Automation & PLC Support",
      body: "Control panel wiring, motor starters, relays, VFD integration, and PLC input/output troubleshooting.",
    },
  ];

  return (
    <>
      <PageHeader
        title="Domestic & Industrial Electrical Installation"
        intro="Safe, tidy, standards-compliant electrical installation, troubleshooting, instrumentation, and automation support."
        breadcrumbs={[
          <Breadcrumbs
            key="b"
            items={[
              { name: "Services", href: "/services" },
              { name: "Electrical installation" },
            ]}
          />,
        ]}
      />

      <Section>
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-7">
            <div>
              <h2 className="gold-rule text-2xl">Services we provide</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {services.map(({ icon: Icon, title, body }) => (
                  <div key={title} className="card p-5">
                    <div className="bg-tint text-link mb-3 inline-flex size-11 items-center justify-center rounded-lg">
                      <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                    </div>
                    <h3 className="text-lg font-bold">{title}</h3>
                    <p className="text-muted mt-1.5 text-sm">{body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card space-y-3 p-6">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="text-link size-6 shrink-0" aria-hidden />
                <h2 className="text-xl font-bold">Safety, compliance &amp; service area</h2>
              </div>
              <p className="text-muted text-sm">
                <strong>Service area:</strong> Nairobi and surrounding counties (Kiambu, Machakos,
                Kajiado; industrial callouts across Kenya by arrangement —{" "}
                <em>TODO: owner to confirm exact coverage and warranty terms</em>).
              </p>
              <p className="text-muted text-sm">
                Every job starts with proper isolation, circuit verification, correct cable sizing,
                and clean labelling so your installation stays safe and maintainable for years.
              </p>
            </div>

            <div>
              <h2 className="gold-rule text-2xl">Work gallery</h2>
              <p className="text-muted mt-2 text-sm">
                {/* TODO: owner to supply real installation photos */}
                Real installation and panel work photos will be added here by the owner (see{" "}
                <code>TODO_OWNER.md</code>).
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {[
                  "Distribution board & circuit labelling",
                  "Industrial control panel & relay wiring",
                  "Instrumentation sensor & transmitter loop",
                ].map((caption) => (
                  <div
                    key={caption}
                    className="card bg-surface-2 flex aspect-[4/3] items-center justify-center p-4 text-center text-xs font-medium text-muted"
                  >
                    [Photo placeholder: {caption}]
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <ElectricalQuoteForm />
          </div>
        </div>
      </Section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: `${site.name} Electrical & Automation Services`,
          url: `${site.url}/services/electrical`,
          email: site.email,
          areaServed: "Nairobi, Kenya",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Nairobi",
            addressCountry: "KE",
          },
        }}
      />
    </>
  );
}
