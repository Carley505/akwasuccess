import { describe, expect, it } from "vitest";
import {
  applyCoupon,
  bundleSavings,
  computeTotals,
  effectivePrice,
  isOnSale,
  isPurchasable,
  type CouponRule,
} from "@/lib/pricing";

describe("Pricing & coupon engine", () => {
  it("computes effectivePrice and sale status accurately", () => {
    expect(effectivePrice({ priceCents: 1500, salePriceCents: 1200, isFree: false })).toBe(1200);
    expect(isOnSale({ priceCents: 1500, salePriceCents: 1200, isFree: false })).toBe(true);
    expect(effectivePrice({ priceCents: 1500, salePriceCents: null, isFree: true })).toBe(0);
    expect(isPurchasable({ priceCents: 0, salePriceCents: null, isFree: false })).toBe(false);
    expect(isPurchasable({ priceCents: 1000, salePriceCents: null, isFree: false })).toBe(true);
  });

  it("validates percent and fixed coupons and caps discount at subtotal", () => {
    const baseCoupon: CouponRule = {
      code: "SAMPLE10",
      type: "percent",
      value: 10,
      active: true,
      minSubtotalCents: 500,
      maxRedemptions: 10,
      redemptions: 2,
      expiresAt: null,
    };
    expect(applyCoupon(baseCoupon, 1500)).toEqual({ ok: true, discountCents: 150 });
    expect(applyCoupon(baseCoupon, 300)).toEqual({
      ok: false,
      reason: "This code needs a minimum order of $5.00.",
    });

    const expired: CouponRule = {
      ...baseCoupon,
      expiresAt: new Date("2020-01-01T00:00:00Z"),
    };
    expect(applyCoupon(expired, 1500).ok).toBe(false);
  });

  it("computes totals and honest bundle savings", () => {
    expect(computeTotals([1200, 800], 200)).toEqual({
      subtotalCents: 2000,
      discountCents: 200,
      totalCents: 1800,
    });
    expect(bundleSavings(2200, [1500, 1000])).toEqual({
      separate: 2500,
      savings: 300,
      percent: 12,
    });
  });
});
