import type { Metadata } from "next";
import { site } from "@/content/site";
import { PageHeader, Section } from "@/components/ui/Layout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Akwasuccess collects, uses, and protects your personal data under the Kenya Data Protection Act (2019).",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageHeader
        title="Privacy Policy"
        intro="Plain-language explanation of how we handle your data, aligned with the Kenya Data Protection Act (2019)."
        breadcrumbs={<Breadcrumbs items={[{ name: "Privacy policy" }]} />}
      />

      <Section>
        <div className="prose-site">
          <p>
            <strong>Last updated:</strong> 31 Oct 2026
          </p>
          <p>
            {site.name} (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) respects your
            privacy and is committed to protecting your personal data in accordance with the{" "}
            <strong>Kenya Data Protection Act, 2019</strong>.
          </p>

          <h2>1. Minimum data we collect</h2>
          <ul>
            <li>
              <strong>When you buy an eBook or course:</strong> your email address (to send your
              receipt, download link, and account login link), your M-Pesa phone number (when paying
              with M-Pesa), and your optional name.
            </li>
            <li>
              <strong>Payment card details:</strong> we <strong>never</strong> see or store your
              debit or credit card number. Card payments are processed directly by our licensed
              payment provider.
            </li>
            <li>
              <strong>Newsletter &amp; free resources:</strong> your email address when you ask us
              to send a free guide or checklist. You can unsubscribe with one click in any email.
            </li>
            <li>
              <strong>Contact &amp; electrical quote forms:</strong> the contact details and job
              description you submit so we can reply to your request.
            </li>
          </ul>

          <h2>2. Why we use your data</h2>
          <p>
            We use your information only to deliver the products or services you requested, send
            transactional receipts and download links, keep legal tax/accounting records, and—only
            when you opt in—send educational updates.
          </p>

          <h2>3. Cookies and analytics</h2>
          <p>
            We use essential cookies to keep you signed in to your Account Library. We prefer
            cookieless, privacy-friendly analytics that do not track you across other websites or
            collect personal identifiers.
          </p>

          <h2>4. Your rights under the Kenya Data Protection Act</h2>
          <p>
            You have the right to request access to the personal data we hold about you, ask us to
            correct inaccurate details, withdraw marketing consent at any time, or request deletion
            of your account data (subject to statutory invoice retention rules).
          </p>

          <h2>5. Contact our data team</h2>
          <p>
            To exercise any of these rights, email{" "}
            <a href={`mailto:${site.email}`}>{site.email}</a>.
          </p>
        </div>
      </Section>
    </>
  );
}
