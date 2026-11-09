import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("container-site", className)}>{children}</div>;
}

export function Section({
  className,
  children,
  tone = "plain",
  id,
  labelledBy,
}: {
  className?: string;
  children: ReactNode;
  tone?: "plain" | "warm" | "dark" | "tint";
  id?: string;
  labelledBy?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn(
        "section-y w-full max-w-full overflow-x-clip",
        tone === "warm" && "bg-surface-2",
        tone === "tint" && "bg-tint",
        tone === "dark" && "on-dark bg-green-900 text-white",
        className,
      )}
    >
      <div className="container-site">{children}</div>
    </section>
  );
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  intro,
  align = "left",
  action,
  as: Tag = "h2",
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  intro?: ReactNode;
  align?: "left" | "center";
  action?: ReactNode;
  as?: "h1" | "h2";
}) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-wrap items-end justify-between gap-4 md:mb-10",
        align === "center" && "flex-col items-center text-center",
      )}
    >
      <div className={cn("max-w-2xl min-w-0", align === "center" && "mx-auto")}>
        {eyebrow && (
          <p className="text-gold-text mb-2 text-xs font-semibold tracking-wide uppercase sm:text-sm">{eyebrow}</p>
        )}
        <Tag
          id={id}
          className={cn(
            "gold-rule",
            Tag === "h1" ? "text-3xl" : "text-2xl",
            align === "center" && "text-center",
          )}
        >
          {title}
        </Tag>
        {intro && <div className="text-muted mt-3 text-base sm:mt-4 sm:text-lg">{intro}</div>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  intro,
  children,
  breadcrumbs,
}: {
  title: string;
  intro?: ReactNode;
  children?: ReactNode;
  breadcrumbs?: ReactNode;
}) {
  return (
    <div className="bg-surface-2 border-line w-full max-w-full overflow-x-clip border-b">
      <div className="container-site py-8 sm:py-10 md:py-14">
        {breadcrumbs}
        <h1 className="gold-rule max-w-3xl text-2xl sm:text-3xl">{title}</h1>
        {intro && <div className="text-muted mt-3 max-w-2xl text-base sm:mt-4 sm:text-lg">{intro}</div>}
        {children}
      </div>
    </div>
  );
}
