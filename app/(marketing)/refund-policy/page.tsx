import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/content/site";
import { PageHeader, Section } from "@/components/ui/Layout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export const metadata: Metadata = {
  title: "Refund & Returns Policy",
  description:
    "Clear refund and returns policy for Akwasuccess digital eBooks, courses, and consulting sessions.",
  alternates: { canonical: "/refund-policy" },
};

export default function RefundPolicyPage() {
  return (
    <>
      <PageHeader
        title="Refund & Returns Policy"
        intro="Clear, honest terms for digital eBooks, online courses, and consulting bookings."
        breadcrumbs={<Breadcrumbs items={[{ name: "Refund policy" }]} />}
      />

      <Section>
        <div className="prose-site">
          <p>
            <strong>Last updated:</strong> 31 Oct 2026{" "}
            <em>(TODO: owner to confirm final refund window and terms)</em>
          </p>

          <h2>1. Try a free sample before you buy</h2>
          <p>
            Every eBook on {site.name} includes a <strong>free sample chapter</strong> and a full
            table of contents so you can inspect the writing style, level, and topics before
            completing payment.
          </p>

          <h2>2. Digital eBooks &amp; downloadable files</h2>
          <p>
            Because digital PDF/EPUB files are delivered immediately and cannot be &ldquo;returned&rdquo;
            once downloaded, completed downloads are generally non-refundable. However, we will
            gladly issue a full refund or replacement within <strong>7 days of purchase</strong> if:
          </p>
          <ul>
            <li>You were charged twice by mistake (for example, a duplicate M-Pesa or card payment).</li>
            <li>The file is corrupted or cannot be opened and our support team cannot fix it for you.</li>
            <li>You have not yet downloaded or accessed the digital product and ask to cancel within 7 days.</li>
          </ul>

          <h2>3. Online courses</h2>
          <p>
            If you purchase a course and find within <strong>7 days</strong> (and with less than
            25% of lessons viewed) that it is not right for your level, contact us for a refund.
          </p>

          <h2>4. Consulting sessions</h2>
          <p>
            You may reschedule or cancel a consulting booking up to 24 hours before the scheduled
            start time for a full refund.
          </p>

          <h2>5. How to request help or a refund</h2>
          <p>
            Email <a href={`mailto:${site.email}`}>{site.email}</a> or message us via the{" "}
            <Link href="/contact">Contact page</Link> with your Order Number or M-Pesa receipt code.
            We respond within one working day.
          </p>
        </div>
      </Section>
    </>
  );
}
