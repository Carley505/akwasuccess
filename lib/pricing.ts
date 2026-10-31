/**
 * Pricing rules. Pure functions, shared by server (authoritative) and UI.
 * The server ALWAYS recomputes totals from the database; client prices are
 * display-only.
 */
export type PricedProduct = {
  priceKes: number;
  salePriceKes?: number | null;
  isFree: boolean;
};

export type CouponRule = {
  code: string;
  type: "percent" | "fixed";
  value: number;
  active: boolean;
  minSubtotalKes: number;
  maxRedemptions: number | null;
  redemptions: number;
  expiresAt: Date | null;
};

export function effectivePrice(p: PricedProduct): number {
  if (p.isFree) return 0;
  if (p.salePriceKes != null && p.salePriceKes > 0 && p.salePriceKes < p.priceKes) {
    return p.salePriceKes;
  }
  return p.priceKes;
}

/** A product can be bought when it is free, or has a price set by the owner. */
export function isPurchasable(p: PricedProduct): boolean {
  return p.isFree || p.priceKes > 0;
}

export function isOnSale(p: PricedProduct): boolean {
  return effectivePrice(p) < p.priceKes && !p.isFree;
}

export type CouponCheck = { ok: true; discountKes: number } | { ok: false; reason: string };

export function applyCoupon(
  coupon: CouponRule | null | undefined,
  subtotalKes: number,
  now = new Date(),
): CouponCheck {
  if (!coupon || !coupon.active) return { ok: false, reason: "This code is not valid." };
  if (coupon.expiresAt && coupon.expiresAt.getTime() < now.getTime()) {
    return { ok: false, reason: "This code has expired." };
  }
  if (coupon.maxRedemptions != null && coupon.redemptions >= coupon.maxRedemptions) {
    return { ok: false, reason: "This code has been fully used." };
  }
  if (subtotalKes < coupon.minSubtotalKes) {
    return { ok: false, reason: `This code needs a minimum order of KES ${coupon.minSubtotalKes}.` };
  }
  const raw =
    coupon.type === "percent"
      ? Math.round((subtotalKes * Math.min(Math.max(coupon.value, 0), 100)) / 100)
      : Math.max(coupon.value, 0);
  return { ok: true, discountKes: Math.min(raw, subtotalKes) };
}

export type Totals = { subtotalKes: number; discountKes: number; totalKes: number };

export function computeTotals(prices: number[], discountKes = 0): Totals {
  const subtotalKes = prices.reduce((sum, p) => sum + Math.max(0, Math.round(p)), 0);
  const discount = Math.min(Math.max(0, Math.round(discountKes)), subtotalKes);
  return { subtotalKes, discountKes: discount, totalKes: subtotalKes - discount };
}

/** Savings for a bundle vs buying items separately (honest, transparent). */
export function bundleSavings(bundlePriceKes: number, itemPricesKes: number[]) {
  const separate = itemPricesKes.reduce((a, b) => a + b, 0);
  const savings = Math.max(0, separate - bundlePriceKes);
  return { separate, savings, percent: separate > 0 ? Math.round((savings / separate) * 100) : 0 };
}
