import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const usdWholeFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Formats an amount stored as integer US cents, e.g. 1299 -> "$12.99".
 * All prices in the database, cart and payment providers are integer cents.
 */
export function formatMoney(cents: number) {
  return usdFormatter.format(cents / 100);
}

/** Like formatMoney but drops ".00" for whole-dollar amounts, e.g. 2500 -> "$25". */
export function formatMoneyCompact(cents: number) {
  return cents % 100 === 0 ? usdWholeFormatter.format(cents / 100) : usdFormatter.format(cents / 100);
}

/** Converts a dollar string/number typed by the owner (e.g. "12.99") to integer cents. */
export function dollarsToCents(value: unknown): number {
  const n = typeof value === "number" ? value : Number.parseFloat(String(value ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0;
}

/** Converts integer cents to a plain dollar string for form inputs, e.g. 1299 -> "12.99". */
export function centsToDollars(cents: number) {
  return (cents / 100).toFixed(2);
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
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
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");
  return new URL(path, base).toString();
}
