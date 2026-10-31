import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { absoluteUrl } from "@/lib/utils";
import { JsonLd } from "@/components/seo/JsonLd";

export type Crumb = { name: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ name: "Home", href: "/" }, ...items];
  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm">
        <ol className="text-muted flex flex-wrap items-center gap-1">
          {all.map((c, i) => {
            const last = i === all.length - 1;
            return (
              <li key={`${c.name}-${i}`} className="flex items-center gap-1">
                {c.href && !last ? (
                  <Link href={c.href} className="hover:text-link inline-flex min-h-11 items-center underline-offset-2 hover:underline sm:min-h-0">
                    {c.name}
                  </Link>
                ) : (
                  <span aria-current={last ? "page" : undefined} className="text-fg line-clamp-1 font-medium">
                    {c.name}
                  </span>
                )}
                {!last && <ChevronRight className="size-4 shrink-0" aria-hidden />}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: c.name,
            ...(c.href ? { item: absoluteUrl(c.href) } : {}),
          })),
        }}
      />
    </>
  );
}
