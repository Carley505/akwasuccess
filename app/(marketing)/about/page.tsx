import type { Metadata } from "next";
import Image from "next/image";
import { BookOpen, CheckCircle2, Compass, HeartHandshake, ShieldCheck } from "lucide-react";
import { site } from "@/content/site";
import { PageHeader, Section, SectionHeading } from "@/components/ui/Layout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { LinkButton } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "About Akwasuccess & Our Mission",
  description:
    "Learn about Akwasuccess, our founder, and our mission to share practical knowledge on finance, the digital economy, and technology.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  const values = [
    {
      icon: Compass,
      title: "Clarity over jargon",
      body: "Complex subjects become simple when explained step by step in everyday English.",
    },
    {
      icon: ShieldCheck,
      title: "Honesty and risk-awareness",
      body: "We teach safety and realistic expectations first. Never hype, countdown timers, or profit promises.",
    },
    {
      icon: BookOpen,
      title: "Practical, hands-on learning",
      body: "Our eBooks, courses, and consulting focus on skills you can apply right away in real life and work.",
    },
    {
      icon: HeartHandshake,
      title: "Accessible to every learner",
      body: "Designed for phones, readable offline, and priced fairly with instant M-Pesa and card checkout.",
    },
  ];

  return (
    <>
      <PageHeader
        title="About Akwasuccess"
        intro="Knowledge as a tool for personal development, professional growth and financial empowerment."
        breadcrumbs={<Breadcrumbs items={[{ name: "About" }]} />}
      />

      <Section labelledBy="mission-heading">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <div className="prose-site lg:col-span-7">
            <h2 id="mission-heading">Why Akwasuccess exists</h2>
            <p>
              <strong>{site.name}</strong> (*{site.tagline}*) is a Nairobi-based education and
              services platform dedicated to helping learners across Kenya, East Africa, and the
              wider English-speaking world build practical skills in finance, the digital economy,
              technology, and everyday wellbeing.
            </p>
            <p>
              Too much material online is either written in dense academic language or packaged as
              flashy &ldquo;get-rich-quick&rdquo; hype. We take the opposite approach: calm,
              structured, beginner-friendly teaching that respects your time and money.
            </p>
            <p>
              Whether you are picking up your first eBook on money or cryptocurrency safety,
              studying electrical, electronics, instrumentation and automation fundamentals, or
              booking a one-on-one session, our goal is to help you understand how things work so
              you can make confident decisions of your own.
            </p>
          </div>

          <div className="lg:col-span-5">
            <div className="card bg-surface-2 flex flex-col items-center gap-4 p-6 text-center">
              <Image
                src="/brand/logo-original.png"
                alt="Akwasuccess brand emblem featuring an open green book and rising gold arrow"
                width={320}
                height={160}
                className="h-auto w-56"
              />
              <div>
                <p className="font-serif text-lg font-bold">Founder &amp; Lead Educator</p>
                <p className="text-muted mt-1 text-sm">
                  Electrical, Instrumentation &amp; Automation Specialist • Digital Economy Educator
                </p>
                <p className="text-muted mt-2 text-xs">
                  {/* TODO: owner to supply real founder photo and verified credentials */}
                  [Owner photo &amp; detailed credentials placeholder — see TODO_OWNER.md]
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section tone="warm" labelledBy="values-heading">
        <SectionHeading
          id="values-heading"
          eyebrow="Our values"
          title="How we teach and work"
          intro="Every eBook, tutorial, course and consulting session follows four principles."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {values.map(({ icon: Icon, title, body }) => (
            <div key={title} className="card p-5">
              <div className="bg-tint text-link mb-3 inline-flex size-11 items-center justify-center rounded-lg">
                <Icon className="size-5" strokeWidth={1.75} aria-hidden />
              </div>
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="text-muted mt-1.5 text-sm">{body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section labelledBy="credentials-heading">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h2 id="credentials-heading" className="gold-rule text-2xl">
              Background &amp; areas of focus
            </h2>
            <ul className="mt-6 space-y-3">
              {[
                "Domestic and industrial electrical installation, safety inspection, and fault troubleshooting",
                "Instrumentation, sensors, process control, and PLC automation fundamentals",
                "Beginner-friendly financial literacy and history-of-money education",
                "Cryptocurrency, blockchain, wallet security, and P2P safety training",
                "Personal development and healthy-lifestyle awareness",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="text-link mt-1 size-5 shrink-0" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card flex flex-col justify-between p-6 lg:col-span-5">
            <div>
              <h3 className="text-xl font-bold">Get in touch</h3>
              <p className="text-muted mt-2 text-sm">
                Have a question about an eBook, want to book a consulting session, or need an
                electrical installation quote in {site.location}? We would love to hear from you.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <LinkButton href="/contact">Contact us</LinkButton>
              <LinkButton href="/shop" variant="secondary">
                Browse eBooks
              </LinkButton>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
