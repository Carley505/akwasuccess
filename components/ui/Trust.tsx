import { BookOpen, Download, Lock, RotateCcw, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Payment method badges. Flat, text-based marks (no third-party logo images)
 * to stay lightweight and on-brand. Replace with official artwork if desired.
 */
export function PaymentBadges({ className, dark }: { className?: string; dark?: boolean }) {
  const chip = cn(
    "inline-flex h-8 items-center rounded-md border px-2.5 text-xs font-bold tracking-wide",
    dark ? "border-white/25 bg-white text-ink-900" : "border-line bg-white text-ink-900",
  );
  return (
    <ul className={cn("flex flex-wrap items-center gap-2", className)} aria-label="Accepted payment methods">
      <li className={chip}>
        <span className="text-[#1a1f71] italic">VISA</span>
      </li>
      <li className={chip} aria-label="Mastercard">
        <span className="flex" aria-hidden>
          <span className="size-4 rounded-full bg-[#eb001b]" />
          <span className="-ml-1.5 size-4 rounded-full bg-[#f79e1b] mix-blend-multiply" />
        </span>
        <span className="ml-1.5">Mastercard</span>
      </li>
    </ul>
  );
}

export function TrustRow({ className }: { className?: string }) {
  const items = [
    { icon: ShieldCheck, label: t.trust.payments },
    { icon: Download, label: t.trust.instant },
    { icon: BookOpen, label: t.trust.beginner },
  ];
  return (
    <ul className={cn("text-muted flex flex-wrap gap-x-5 gap-y-2 text-sm", className)}>
      {items.map(({ icon: Icon, label }) => (
        <li key={label} className="flex items-center gap-1.5">
          <Icon className="text-link size-4" strokeWidth={1.75} aria-hidden />
          {label}
        </li>
      ))}
    </ul>
  );
}

export function GuaranteeBadge({ className }: { className?: string }) {
  return (
    <div className={cn("text-muted flex items-start gap-2 text-sm", className)}>
      <RotateCcw className="text-link mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden />
      <p>
        Questions about your purchase? Read our{" "}
        <Link href="/refund-policy" className="link">
          refund policy
        </Link>
        .
      </p>
    </div>
  );
}

export function SecureNote({ className }: { className?: string }) {
  return (
    <p className={cn("text-muted flex items-center gap-1.5 text-sm", className)}>
      <Lock className="text-link size-4" strokeWidth={1.75} aria-hidden />
      {t.trust.paySecurely}
    </p>
  );
}
