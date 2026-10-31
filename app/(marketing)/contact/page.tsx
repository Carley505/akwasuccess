import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle } from "lucide-react";
import { site, whatsappLink } from "@/content/site";
import { PageHeader, Section } from "@/components/ui/Layout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ContactForm } from "@/components/marketing/ContactForm";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Contact Akwasuccess by form, email, or WhatsApp for help with eBook downloads, courses, consulting, or electrical installation.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const activeSocials = site.socials.filter((s) => Boolean(s.href));

  return (
    <>
      <PageHeader
        title="Contact Us"
        intro="Have a question about an eBook, course, consulting session, or electrical installation? Reach out below."
        breadcrumbs={<Breadcrumbs items={[{ name: "Contact" }]} />}
      />

      <Section>
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <ContactForm />
          </div>

          <aside className="space-y-4 lg:col-span-5">
            <div className="card space-y-4 p-6">
              <h2 className="text-xl font-bold">Direct contact</h2>
              <p className="text-muted text-sm">{site.responseTime}</p>

              <a
                href={whatsappLink("Hello Akwasuccess, I would like to enquire about...")}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary text-primary-fg hover:bg-primary-hover flex min-h-12 items-center justify-center gap-2 rounded-md px-5 font-semibold no-underline"
              >
                <MessageCircle className="size-5" aria-hidden />
                <span>Chat with us on WhatsApp</span>
              </a>

              <ul className="space-y-3 pt-2 text-sm">
                <li className="flex items-start gap-2.5">
                  <Mail className="text-link mt-0.5 size-5 shrink-0" aria-hidden />
                  <div>
                    <p className="font-semibold">Email</p>
                    <a href={`mailto:${site.email}`} className="link">
                      {site.email}
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <Clock className="text-link mt-0.5 size-5 shrink-0" aria-hidden />
                  <div>
                    <p className="font-semibold">Working hours</p>
                    <p className="text-muted">{site.workingHours}</p>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <MapPin className="text-link mt-0.5 size-5 shrink-0" aria-hidden />
                  <div>
                    <p className="font-semibold">Location</p>
                    <p className="text-muted">{site.location}</p>
                  </div>
                </li>
              </ul>

              {activeSocials.length > 0 && (
                <div className="border-line border-t pt-4">
                  <p className="mb-2 text-xs font-bold tracking-wider uppercase">Social profiles</p>
                  <div className="flex flex-wrap gap-2">
                    {activeSocials.map((s) => (
                      <a
                        key={s.name}
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border-line hover:border-primary inline-flex min-h-11 items-center rounded-md border px-3 text-sm font-semibold no-underline"
                      >
                        {s.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
