import type { Metadata } from "next";
import { site } from "@/content/site";
import { PageHeader, Section } from "@/components/ui/Layout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of service governing the use of Akwasuccess eBooks, courses, consulting, and electrical installation services.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <>
      <PageHeader
        title="Terms of Service"
        intro="Plain-language terms for using Akwasuccess digital products, courses, consulting, and technical services."
        breadcrumbs={<Breadcrumbs items={[{ name: "Terms" }]} />}
      />

      <Section>
        <div className="prose-site">
          <p>
            <strong>Last updated:</strong> 31 Oct 2026
          </p>

          <h2>1. Personal licence for digital products</h2>
          <p>
            When you purchase or download an eBook, checklist, or course from {site.name}, you
            receive a personal, non-transferable licence to read and use the material for your own
            learning. You may not resell, redistribute, upload to public file-sharing sites, or
            remove copyright notices from our files.
          </p>

          <h2>2. Educational nature of content (No guarantee of outcomes)</h2>
          <p>
            All eBooks, articles, courses, and consulting sessions are provided strictly for{" "}
            <strong>general education and awareness</strong>. We do not provide regulated investment
            advice, financial brokerage, tax advice, or medical diagnosis. You are solely
            responsible for your own financial, technical, and personal decisions.
          </p>

          <h2>3. Consulting services</h2>
          <p>
            Consulting sessions focus on explaining concepts, security practices, and educational
            frameworks. {site.name} will never ask for your wallet recovery phrase or take custody
            of your funds, and makes no guarantee of financial profit or investment performance.
          </p>

          <h2>4. Electrical installation &amp; technical services</h2>
          <p>
            On-site electrical installation, troubleshooting, and instrumentation work is performed
            according to the written scope of work and quotation agreed with the client prior to
            commencement. Unsafe DIY modifications made by third parties after handover are not
            covered.
          </p>

          <h2>5. Governing law</h2>
          <p>
            These terms are governed by applicable international commercial and consumer protection
            laws. Any questions may be sent
            to <a href={`mailto:${site.email}`}>{site.email}</a>.
          </p>
        </div>
      </Section>
    </>
  );
}
