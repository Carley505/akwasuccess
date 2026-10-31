import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "horizontal" | "stacked" | "icon" | "mono-white";

/**
 * Akwasuccess logo.
 *
 * Until the owner supplies final SVGs (public/brand/logo-*.svg, see
 * TODO_OWNER.md), this renders a text wordmark: "Akwa" (green) "Success"
 * (ink) in the heading font with a small gold rising-arrow glyph.
 */
export function LogoGlyph({ className, mono }: { className?: string; mono?: boolean }) {
  return (
    <svg viewBox="0 0 32 24" className={className} aria-hidden="true" focusable="false">
      {/* open book */}
      <path
        d="M2 18c4-3 8-3.5 13-1.5V20C10 18 6 18.3 2 20.5z"
        fill={mono ? "currentColor" : "var(--green-700)"}
      />
      <path
        d="M17 16.5c3-1.3 6-1.6 9-1V18c-3-.5-6-.2-9 2z"
        fill={mono ? "currentColor" : "var(--gold-500)"}
      />
      {/* rising arrow */}
      <path
        d="M16 15 L27 4"
        stroke={mono ? "currentColor" : "var(--gold-500)"}
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M21.5 3.2 L29 2 L27.8 9.5 Z" fill={mono ? "currentColor" : "var(--gold-500)"} />
    </svg>
  );
}

export function Logo({
  variant = "horizontal",
  className,
  href = "/",
  priority: _priority,
}: {
  variant?: Variant;
  className?: string;
  href?: string | null;
  priority?: boolean;
}) {
  const mono = variant === "mono-white";
  const content =
    variant === "icon" ? (
      <LogoGlyph className="h-8 w-10" />
    ) : (
      <span
        className={cn(
          "inline-flex items-center gap-2",
          variant === "stacked" && "flex-col items-start gap-1",
        )}
      >
        <LogoGlyph className={cn("h-7 w-9 shrink-0", mono && "text-gold-500")} />
        <span className="font-serif text-[1.375rem] leading-none font-bold tracking-tight whitespace-nowrap">
          <span className={mono ? "text-white" : "text-link"}>Akwa</span>
          <span className={mono ? "text-white" : "text-fg"}>Success</span>
        </span>
      </span>
    );

  if (!href) return <span className={className}>{content}</span>;
  return (
    <Link href={href} className={cn("inline-flex no-underline", className)} aria-label="Akwasuccess home">
      {content}
    </Link>
  );
}
