import type { ComponentProps, ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const control =
  "w-full max-w-full min-w-0 min-h-12 rounded-md border border-line-strong bg-surface px-3.5 py-2.5 text-fg placeholder:text-muted/90 transition-colors focus:border-primary focus:outline-2 focus:outline-offset-0 focus:outline-[var(--focus)] aria-[invalid=true]:border-danger file:mr-3 file:rounded file:border-0 file:bg-tint file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-link";

export function Field({
  id,
  label,
  hint,
  error,
  optional,
  children,
  className,
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="font-semibold">
        {label}
        {optional && <span className="text-muted ml-1 text-sm font-normal">(optional)</span>}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="text-muted text-sm">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={`${id}-error`} className="text-danger flex items-start gap-1.5 text-sm font-medium">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

export function describedBy(id: string, hint?: unknown, error?: unknown) {
  const ids = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(control, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(control, "min-h-32 resize-y", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select className={cn(control, "appearance-auto pr-8", className)} {...props}>
      {children}
    </select>
  );
}

/** Hidden honeypot field for spam protection. Real users never see or fill it. */
export function Honeypot() {
  return (
    <div aria-hidden="true" className="sr-only pointer-events-none">
      <label htmlFor="company_website">Leave this field empty</label>
      <input id="company_website" name="company_website" type="text" tabIndex={-1} autoComplete="off" />
    </div>
  );
}

export function FormAlert({ tone, children }: { tone: "success" | "error"; children: ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-md border-l-4 p-4 text-sm font-medium",
        tone === "success" ? "border-success bg-tint text-fg" : "border-danger text-fg bg-[color-mix(in_srgb,var(--danger)_10%,transparent)]",
      )}
    >
      {children}
    </div>
  );
}
