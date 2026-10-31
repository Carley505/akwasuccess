import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { footerNav } from "@/content/navigation";
import { disclaimers, site } from "@/content/site";
import { Logo } from "@/components/ui/Logo";
import { PaymentBadges } from "@/components/ui/Trust";
import { CurrencyToggle } from "@/components/ui/PriceTag";
import { t } from "@/lib/i18n";

/**
 * Site footer (Section 5.2).
 * 4 columns on desktop that collapse into accessible accordions on mobile,
 * followed by payment badges, the mandatory crypto/finance educational
 * disclaimer (Section 2.4), and copyright.
 */
export function Footer() {
  const year = new Date().getFullYear();
  const activeSocials = site.socials.filter((s) => Boolean(s.href));

  const groups = [
    { title: t.footer.shop, links: footerNav.shop },
    { title: t.footer.learnServices, links: footerNav.learnServices },
    { title: t.footer.company, links: footerNav.company },
  ];

  return (
    <footer className="pb-bottom-nav bg-green-900 text-white">
      <div className="container-site py-12 md:py-16">
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Column 1: Brand + blurb + socials */}
          <div className="space-y-4 lg:col-span-4">
            <Logo variant="mono-white" />
            <p className="max-w-sm text-sm leading-relaxed text-white/85">{t.footer.blurb}</p>
            <p className="text-xs text-white/75">
              Based in {site.location} •{" "}
              <a href={`mailto:${site.email}`} className="underline hover:text-white">
                {site.email}
              </a>
            </p>
            {activeSocials.length > 0 && (
              <ul className="flex flex-wrap gap-3 pt-1">
                {activeSocials.map((s) => (
                  <li key={s.name}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center rounded-md border border-white/20 px-3 text-xs font-semibold text-white no-underline hover:bg-white/10"
                    >
                      {s.name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Columns 2-4: Desktop columns, mobile accordions */}
          <div className="grid gap-6 md:grid-cols-3 lg:col-span-8">
            {groups.map((g) => (
              <div key={g.title}>
                {/* Desktop list */}
                <div className="hidden md:block">
                  <h2 className="mb-3 font-sans text-sm font-bold tracking-wider text-white uppercase">
                    {g.title}
                  </h2>
                  <ul className="space-y-2 text-sm text-white/85">
                    {g.links.map((l) => (
                      <li key={l.href}>
                        <Link
                          href={l.href}
                          className="inline-block py-1 no-underline hover:text-white hover:underline"
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Mobile accordion */}
                <details className="border-b border-white/15 pb-3 md:hidden">
                  <summary className="flex min-h-12 items-center justify-between font-sans text-sm font-bold tracking-wider text-white uppercase">
                    <span>{g.title}</span>
                    <ChevronDown className="chevron size-4 transition-transform" aria-hidden />
                  </summary>
                  <ul className="mt-2 space-y-1 pb-2 text-sm text-white/85">
                    {g.links.map((l) => (
                      <li key={l.href}>
                        <Link
                          href={l.href}
                          className="flex min-h-11 items-center no-underline hover:text-white"
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </details>
              </div>
            ))}
          </div>
        </div>

        {/* Payment badges + currency toggle */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/15 pt-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold tracking-wider text-white/80 uppercase">
              {t.footer.weAccept}
            </span>
            <PaymentBadges dark />
          </div>
          <div className="rounded-md bg-surface p-0.5 text-fg">
            <CurrencyToggle />
          </div>
        </div>

        {/* Mandatory educational risk disclaimer (shown on every page) */}
        <div className="mt-6 rounded-lg border border-white/15 bg-black/20 p-4 text-xs leading-relaxed text-white/85">
          <p>{disclaimers.crypto}</p>
          <p className="mt-1 font-semibold text-white">{disclaimers.shortCrypto}</p>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-xs text-white/75">
          <p>
            © {year} {site.name}. {t.footer.rights}
          </p>
          <p className="italic">{site.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
