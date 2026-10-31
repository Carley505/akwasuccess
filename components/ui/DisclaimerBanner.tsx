import { HeartPulse, ShieldAlert } from "lucide-react";
import { disclaimers } from "@/content/site";
import { cn } from "@/lib/utils";

/** Mandatory disclaimers (spec 2.4). Variants: crypto/finance and health. */
export function DisclaimerBanner({
  variant,
  className,
  compact,
}: {
  variant: "crypto" | "health";
  className?: string;
  compact?: boolean;
}) {
  const Icon = variant === "crypto" ? ShieldAlert : HeartPulse;
  return (
    <aside
      aria-label={variant === "crypto" ? "Educational notice" : "Health notice"}
      className={cn(
        "border-gold-500 bg-tint-gold text-fg flex gap-3 rounded-lg border-l-4 p-4",
        compact && "p-3 text-sm",
        className,
      )}
    >
      <Icon className="text-gold-text mt-0.5 size-5 shrink-0" strokeWidth={1.75} aria-hidden />
      <p className={cn(compact ? "text-sm" : "text-sm md:text-base")}>{disclaimers[variant]}</p>
    </aside>
  );
}
