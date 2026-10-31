import type { Metadata } from "next";
import { disclaimers } from "@/content/site";
import { PageHeader, Section } from "@/components/ui/Layout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";

export const metadata: Metadata = {
  title: "Educational & Risk Disclaimer",
  description:
    "Important educational disclaimers regarding cryptocurrency, financial literacy, technical education, and health awareness content on Akwasuccess.",
  alternates: { canonical: "/disclaimer" },
};

export default function DisclaimerPage() {
  return (
    <>
      <PageHeader
        title="Educational & Risk Disclaimer"
        intro="Please read these notices carefully before using our eBooks, courses, articles, or consulting services."
        breadcrumbs={<Breadcrumbs items={[{ name: "Disclaimer" }]} />}
      />

      <Section>
        <div className="prose-site space-y-6">
          <DisclaimerBanner variant="crypto" />
          <DisclaimerBanner variant="health" />

          <h2>Cryptocurrency &amp; Financial Education</h2>
          <p>{disclaimers.crypto}</p>
          <p>
            Digital asset prices are highly volatile, and you can lose some or all of any capital
            you choose to put at risk. Past market behaviour never guarantees future performance.
          </p>

          <h2>Psychology &amp; Health Education</h2>
          <p>{disclaimers.health}</p>
          <p>
            Always seek the advice of a qualified physician, psychologist, or other licensed health
            provider with any questions you may have regarding a medical or mental-health condition.
          </p>

          <h2>Technical &amp; Electrical Education</h2>
          <p>
            Our technical guides explain electrical, electronics, instrumentation, and automation
            principles for educational purposes. Working on live mains electricity carries serious
            risk of injury or death; installation work must only be carried out by qualified
            personnel following proper isolation and local regulations.
          </p>
        </div>
      </Section>
    </>
  );
}
