import type { Metadata } from "next";
import { PageHeader, Section } from "@/components/ui/Layout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";
import { ShareStoryForm } from "@/components/marketing/ShareStoryForm";
import { getApprovedTestimonials } from "@/lib/db/queries";

export const metadata: Metadata = {
  title: "Reader & Learner Stories",
  description:
    "Read real, consented stories from Akwasuccess readers and clients, or share your own learning experience.",
  alternates: { canonical: "/success-stories" },
};

export default async function SuccessStoriesPage() {
  const stories = await getApprovedTestimonials();

  return (
    <>
      <PageHeader
        title="Learner Stories"
        intro="Real experiences shared with permission by readers and clients. Individual results vary; all Akwasuccess material is educational."
        breadcrumbs={<Breadcrumbs items={[{ name: "Success stories" }]} />}
      />

      <Section>
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            {stories.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {stories.map((s) => (
                  <blockquote key={s.id} className="card flex flex-col justify-between p-5">
                    <p className="text-base">&ldquo;{s.quote}&rdquo;</p>
                    <footer className="text-muted mt-4 text-xs font-semibold">
                      {s.name}
                      {s.location ? ` • ${s.location}` : ""}
                      {s.productUsed ? ` — ${s.productUsed}` : ""}
                    </footer>
                  </blockquote>
                ))}
              </div>
            ) : (
              <div className="card space-y-3 p-6">
                <h2 className="text-xl font-bold">Real stories only—never fabricated</h2>
                <p className="text-muted text-sm">
                  We only publish verified reader stories with explicit permission. As readers share
                  their experiences using the form on this page, approved stories will appear here.
                </p>
              </div>
            )}

            <DisclaimerBanner variant="crypto" compact />
          </div>

          <div className="lg:col-span-5">
            <ShareStoryForm />
          </div>
        </div>
      </Section>
    </>
  );
}
