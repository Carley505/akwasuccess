import "server-only";
import { formatMoney } from "@/lib/utils";
import {
  formatPaystackWooReference,
  parseWooPriceToCents,
  type WooRawProduct,
} from "./classify";
import { isWooCommerceConfigured, wooRest } from "./client";

export type WooCustomer = {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  username?: string;
};

export type WooOrderLineItem = {
  id?: number;
  name?: string;
  product_id: number;
  quantity: number;
  subtotal?: string;
  total?: string;
};

export type WooOrderResponse = {
  id: number;
  number: string;
  order_key: string;
  status: string;
  currency: string;
  total: string;
  discount_total: string;
  customer_id: number;
  date_created_gmt?: string;
  date_paid_gmt?: string | null;
  billing?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  };
  line_items?: WooOrderLineItem[];
};

export type WooCouponResponse = {
  id: number;
  code: string;
  amount: string;
  discount_type: "percent" | "fixed_cart" | "fixed_product" | string;
  date_expires_gmt: string | null;
  usage_count: number;
  usage_limit: number | null;
  minimum_amount: string;
};

function splitName(fullName?: string | null): { firstName: string; lastName: string } {
  const clean = (fullName ?? "").trim();
  if (!clean) return { firstName: "Valued", lastName: "Learner" };
  const parts = clean.split(/\s+/);
  return {
    firstName: parts[0] ?? "Valued",
    lastName: parts.slice(1).join(" ") || "Learner",
  };
}

/**
 * Finds or creates a WooCommerce customer record by email so signed-in buyers
 * have their orders and download permissions linked in WordPress.
 */
export async function findOrCreateWooCustomer(opts: {
  email: string;
  name?: string | null;
}): Promise<number | null> {
  if (!isWooCommerceConfigured()) return null;
  const email = opts.email.trim().toLowerCase();
  try {
    const existing = await wooRest<WooCustomer[]>(
      `customers?email=${encodeURIComponent(email)}&role=all`,
    );
    if (Array.isArray(existing) && existing.length > 0 && existing[0]?.id) {
      return existing[0].id;
    }

    const { firstName, lastName } = splitName(opts.name);
    const localPart = email.split("@")[0]?.replace(/[^a-z0-9]/gi, "").slice(0, 16) || "reader";
    const username = `${localPart}_${Math.floor(1000 + Math.random() * 9000)}`;

    const created = await wooRest<WooCustomer>("customers", {
      method: "POST",
      body: JSON.stringify({
        email,
        first_name: firstName,
        last_name: lastName,
        username,
      }),
    });
    return created?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetches live product data from WooCommerce by IDs for authoritative
 * server-side price verification during checkout.
 */
export async function fetchLiveWooProductsByIds(
  wooIds: number[],
): Promise<Map<number, WooRawProduct>> {
  const map = new Map<number, WooRawProduct>();
  if (!isWooCommerceConfigured() || wooIds.length === 0) return map;
  try {
    const uniqueIds = Array.from(new Set(wooIds));
    const rows = await wooRest<WooRawProduct[]>(
      `products?include=${uniqueIds.join(",")}&per_page=100`,
    );
    for (const p of rows) {
      if (p && typeof p.id === "number") {
        map.set(p.id, p);
      }
    }
  } catch {
    // Caller falls back to local DB prices if Woo is temporarily unreachable
  }
  return map;
}

/**
 * Creates a pending order in WooCommerce and sets `_paystack_txn_ref` in the
 * `{wooOrderId}_{unixSec}` format expected by the WordPress Paystack plugin.
 */
export async function createWooOrder(opts: {
  email: string;
  name?: string | null;
  wooCustomerId?: number | null;
  items: { wooId: number; quantity?: number }[];
  couponCode?: string | null;
  orderNumber: string;
}): Promise<{
  wooOrderId: number;
  wooOrderKey: string;
  reference: string;
  totalCents: number;
  discountCents: number;
} | null> {
  if (!isWooCommerceConfigured() || opts.items.length === 0) return null;

  try {
    const { firstName, lastName } = splitName(opts.name);
    const payload: Record<string, unknown> = {
      payment_method: "paystack",
      payment_method_title: "Paystack (Card)",
      set_paid: false,
      status: "pending",
      customer_id: opts.wooCustomerId ?? 0,
      billing: {
        first_name: firstName,
        last_name: lastName,
        email: opts.email.trim().toLowerCase(),
      },
      line_items: opts.items.map((i) => ({
        product_id: i.wooId,
        quantity: i.quantity ?? 1,
      })),
      meta_data: [
        { key: "_akwa_order_number", value: opts.orderNumber },
        { key: "_akwa_headless_checkout", value: "1" },
      ],
    };

    if (opts.couponCode && opts.couponCode.trim()) {
      payload.coupon_lines = [{ code: opts.couponCode.trim() }];
    }

    const created = await wooRest<WooOrderResponse>("orders", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const reference = formatPaystackWooReference(created.id, opts.orderNumber);

    // Store `_paystack_txn_ref` on the WooCommerce order so the WP Paystack webhook reconciles too
    await wooRest<WooOrderResponse>(`orders/${created.id}`, {
      method: "PUT",
      body: JSON.stringify({
        meta_data: [{ key: "_paystack_txn_ref", value: reference }],
      }),
    }).catch(() => {});

    return {
      wooOrderId: created.id,
      wooOrderKey: created.order_key,
      reference,
      totalCents: parseWooPriceToCents(created.total),
      discountCents: parseWooPriceToCents(created.discount_total),
    };
  } catch {
    return null;
  }
}

/**
 * Marks a WooCommerce order as paid and `completed` so WooCommerce immediately
 * grants downloadable product permissions on the order.
 */
export async function markWooOrderPaid(opts: {
  wooOrderId: number;
  transactionId?: string;
  reference?: string;
}): Promise<WooOrderResponse | null> {
  if (!isWooCommerceConfigured() || !opts.wooOrderId) return null;
  try {
    return await wooRest<WooOrderResponse>(`orders/${opts.wooOrderId}`, {
      method: "PUT",
      body: JSON.stringify({
        set_paid: true,
        status: "completed",
        transaction_id: opts.transactionId ?? opts.reference ?? "",
        ...(opts.reference
          ? { meta_data: [{ key: "_paystack_txn_ref", value: opts.reference }] }
          : {}),
      }),
    });
  } catch {
    return null;
  }
}

/**
 * Fetches orders from WooCommerce matching a user's customer_id or billing email.
 */
export async function fetchWooOrdersForUser(opts: {
  email: string;
  wooCustomerId?: number | null;
}): Promise<WooOrderResponse[]> {
  if (!isWooCommerceConfigured()) return [];
  const cleanEmail = opts.email.trim().toLowerCase();
  const byId = new Map<number, WooOrderResponse>();

  try {
    const queries: Promise<WooOrderResponse[]>[] = [
      wooRest<WooOrderResponse[]>(`orders?search=${encodeURIComponent(cleanEmail)}&per_page=50`),
    ];
    if (opts.wooCustomerId && opts.wooCustomerId > 0) {
      queries.push(
        wooRest<WooOrderResponse[]>(`orders?customer=${opts.wooCustomerId}&per_page=50`),
      );
    }
    const results = await Promise.allSettled(queries);
    for (const r of results) {
      if (r.status === "fulfilled" && Array.isArray(r.value)) {
        for (const o of r.value) {
          const billEmail = (o.billing?.email ?? "").trim().toLowerCase();
          const matchesEmail = billEmail === cleanEmail;
          const matchesCustomer =
            Boolean(opts.wooCustomerId) && o.customer_id === opts.wooCustomerId;
          if (matchesEmail || matchesCustomer) {
            byId.set(o.id, o);
          }
        }
      }
    }
  } catch {
    // Ignore network errors and fall back to local orders
  }

  return Array.from(byId.values());
}

/**
 * Validates a coupon code against WooCommerce first (if configured).
 */
export async function validateWooCoupon(
  code: string,
  subtotalCents: number,
  now = new Date(),
): Promise<
  | { found: true; ok: true; discountCents: number; code: string }
  | { found: true; ok: false; reason: string }
  | { found: false }
> {
  if (!isWooCommerceConfigured()) return { found: false };
  try {
    const clean = code.trim();
    const coupons = await wooRest<WooCouponResponse[]>(
      `coupons?code=${encodeURIComponent(clean)}`,
    );
    if (!Array.isArray(coupons) || coupons.length === 0) {
      return { found: false };
    }
    const c = coupons[0]!;
    if (c.date_expires_gmt && new Date(c.date_expires_gmt).getTime() < now.getTime()) {
      return { found: true, ok: false, reason: "This code has expired." };
    }
    if (c.usage_limit != null && c.usage_count >= c.usage_limit) {
      return { found: true, ok: false, reason: "This code has been fully used." };
    }
    const minCents = parseWooPriceToCents(c.minimum_amount);
    if (minCents > 0 && subtotalCents < minCents) {
      return {
        found: true,
        ok: false,
        reason: `This code needs a minimum order of ${formatMoney(minCents)}.`,
      };
    }

    let discountCents = 0;
    if (c.discount_type === "percent") {
      const pct = Math.min(Math.max(Number.parseFloat(c.amount) || 0, 0), 100);
      discountCents = Math.round((subtotalCents * pct) / 100);
    } else {
      discountCents = parseWooPriceToCents(c.amount);
    }

    return {
      found: true,
      ok: true,
      code: c.code.toUpperCase(),
      discountCents: Math.min(discountCents, subtotalCents),
    };
  } catch {
    return { found: false };
  }
}
