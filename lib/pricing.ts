/**
 * Pricing rules. Pure functions, shared by server (authoritative) and UI.
 * The server ALWAYS recomputes totals from the database; client prices are
 * display-only. All amounts are integer US cents (USD), e.g. 1299 = $12.99.
 */
import { formatMoney } from "@/lib/utils";
export type PricedProduct = {
  priceCents: number;
  salePriceCents?: number | null;
  isFree: boolean;
};

export type CouponRule = {
  code: string;
  type: "percent" | "fixed";
  value: number;
  active: boolean;
  minSubtotalCents: number;
  maxRedemptions: number | null;
  redemptions: number;
  expiresAt: Date | null;
};

export function effectivePrice(p: PricedProduct): number {
  if (p.isFree) return 0;
  if (p.salePriceCents != null && p.salePriceCents > 0 && p.salePriceCents < p.priceCents) {
    return p.salePriceCents;
  }
  return p.priceCents;
}

/** A product can be bought when it is free, or has a price set by the owner. */
export function isPurchasable(p: PricedProduct): boolean {
  return p.isFree || p.priceCents > 0;
}

export function isOnSale(p: PricedProduct): boolean {
  return effectivePrice(p) < p.priceCents && !p.isFree;
}

export type CouponCheck = { ok: true; discountCents: number } | { ok: false; reason: string };

export function applyCoupon(
  coupon: CouponRule | null | undefined,
  subtotalCents: number,
  now = new Date(),
): CouponCheck {
  if (!coupon || !coupon.active) return { ok: false, reason: "This code is not valid." };
  if (coupon.expiresAt && coupon.expiresAt.getTime() < now.getTime()) {
    return { ok: false, reason: "This code has expired." };
  }
  if (coupon.maxRedemptions != null && coupon.redemptions >= coupon.maxRedemptions) {
    return { ok: false, reason: "This code has been fully used." };
  }
  if (subtotalCents < coupon.minSubtotalCents) {
    return { ok: false, reason: `This code needs a minimum order of ${formatMoney(coupon.minSubtotalCents)}.` };
  }
  const raw =
    coupon.type === "percent"
      ? Math.round((subtotalCents * Math.min(Math.max(coupon.value, 0), 100)) / 100)
      : Math.max(coupon.value, 0);
  return { ok: true, discountCents: Math.min(raw, subtotalCents) };
}

export type Totals = { subtotalCents: number; discountCents: number; totalCents: number };

export function computeTotals(prices: number[], discountCents = 0): Totals {
  const subtotalCents = prices.reduce((sum, p) => sum + Math.max(0, Math.round(p)), 0);
  const discount = Math.min(Math.max(0, Math.round(discountCents)), subtotalCents);
  return { subtotalCents, discountCents: discount, totalCents: subtotalCents - discount };
}

/** Savings for a bundle vs buying items separately (honest, transparent). */
export function bundleSavings(bundlePriceCents: number, itemPricesCents: number[]) {
  const separate = itemPricesCents.reduce((a, b) => a + b, 0);
  const savings = Math.max(0, separate - bundlePriceCents);
  return { separate, savings, percent: separate > 0 ? Math.round((savings / separate) * 100) : 0 };
}
