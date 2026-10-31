"use client";

import { useSyncExternalStore } from "react";
import { site } from "@/content/site";
import { cn, formatKes, formatUsd } from "@/lib/utils";

type Currency = "KES" | "USD";
const KEY = "akwa:currency";
const listeners = new Set<() => void>();

function read(): Currency {
  if (typeof window === "undefined") return "KES";
  return window.localStorage.getItem(KEY) === "USD" ? "USD" : "KES";
}

export function setCurrency(c: Currency) {
  window.localStorage.setItem(KEY, c);
  listeners.forEach((l) => l());
}

export function useCurrency(): Currency {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => "KES",
  );
}

/** Price display. KES is primary and authoritative; USD is an approximate display only. */
export function PriceTag({
  amountKes,
  originalKes,
  isFree,
  comingSoon,
  size = "md",
  className,
}: {
  amountKes: number;
  originalKes?: number | null;
  isFree?: boolean;
  comingSoon?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const currency = useCurrency();
  const fmt = (v: number) => (currency === "USD" ? `≈ ${formatUsd(v, site.usdRate)}` : formatKes(v));
  const sizeCls = size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-lg";

  if (comingSoon) {
    return <span className={cn("text-muted font-semibold", size === "lg" ? "text-xl" : "text-sm", className)}>Price coming soon</span>;
  }
  if (isFree || amountKes === 0) {
    return <span className={cn("text-link font-bold", sizeCls, className)}>Free</span>;
  }
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2", className)}>
      <span className={cn("font-bold", sizeCls)}>{fmt(amountKes)}</span>
      {originalKes != null && originalKes > amountKes && (
        <span className="text-muted text-sm line-through">
          <span className="sr-only">Was </span>
          {fmt(originalKes)}
        </span>
      )}
    </span>
  );
}

export function CurrencyToggle({ className }: { className?: string }) {
  const currency = useCurrency();
  return (
    <div role="group" aria-label="Display currency" className={cn("inline-flex rounded-md border border-line p-0.5 text-sm", className)}>
      {(["KES", "USD"] as const).map((c) => (
        <button
          key={c}
          type="button"
          aria-pressed={currency === c}
          onClick={() => setCurrency(c)}
          className={cn(
            "min-h-9 min-w-12 rounded px-2 font-semibold",
            currency === c ? "bg-primary text-primary-fg" : "text-muted hover:text-fg",
          )}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
