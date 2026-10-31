import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const kesFormatter = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  maximumFractionDigits: 0,
});

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

/** Formats whole Kenyan shillings, e.g. 1500 -> "KES 1,500". */
export function formatKes(amount: number) {
  // Intl outputs "Ksh" for en-KE in some runtimes; normalise to "KES" for clarity.
  return kesFormatter.format(amount).replace(/^Ksh\s?/, "KES ").replace(/^KES\s?/, "KES ");
}

export function formatUsd(amountKes: number, rate: number) {
  return usdFormatter.format(amountKes / rate);
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Africa/Nairobi",
});

/** DD MMM YYYY, e.g. "31 Oct 2026". */
export function formatDate(date: Date | string | number) {
  return dateFormatter.format(new Date(date));
}

export function readingTime(text: string) {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export function absoluteUrl(path = "/") {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return new URL(path, base).toString();
}
