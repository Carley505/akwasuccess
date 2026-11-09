import crypto from "node:crypto";
import type { CategorySlug } from "@/content/categories";

export type WooRawCategory = {
  id?: number;
  name: string;
  slug: string;
};

export type WooRawDownload = {
  id: string;
  name: string;
  file: string;
};

export type WooRawImage = {
  id?: number;
  src: string;
  alt?: string;
};

export type WooRawProduct = {
  id: number;
  name: string;
  slug: string;
  status: string;
  type: string;
  price: string;
  regular_price: string;
  sale_price: string;
  virtual: boolean;
  downloadable: boolean;
  downloads: WooRawDownload[];
  download_expiry?: number;
  download_limit?: number;
  short_description?: string;
  description?: string;
  categories?: WooRawCategory[];
  images?: WooRawImage[];
  featured?: boolean;
};

/**
 * Converts a WooCommerce price string (e.g. "1.5", "$4.00", "100", "") into
 * integer US cents (e.g. 150, 400, 10000, 0).
 */
export function parseWooPriceToCents(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const cleaned = String(value).replace(/[^0-9.]/g, "");
  if (!cleaned) return 0;
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) : 0;
}

/**
 * Strips WordPress/Google-Docs HTML markup, comments, and entities into clean
 * editorial plain text.
 */
export function stripHtmlToText(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<\/(p|div|h[1-6]|li|tr|br)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#8211;|&ndash;/gi, "–")
    .replace(/&#8212;|&mdash;/gi, "—")
    .replace(/&#8217;|&rsquo;/gi, "’")
    .replace(/&#8220;|&ldquo;|&#8221;|&rdquo;|&quot;/gi, '"')
    .replace(/&#038;|&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n\n")
    .trim();
}

/**
 * Canonical slug aliases so legacy internal links, learning paths, and E2E
 * routes resolve seamlessly to the corresponding WooCommerce products.
 */
export const WOO_SLUG_ALIASES: Record<string, string> = {
  "basic-electrical-electronics-instrumentation-automation-ebook":
    "applied-electrical-electronics-and-instrumentation-automation-technologies",
  "the-secrets-of-genuine-money-ebook": "the-secret-of-genuine-money",
  "psychology-clinic-health-tips-for-long-life-ebook": "psychology-clinic-health-tips",
  "117": "psychology-clinic-health-tips",
  "cryptocurrency-for-beginners": "cryptocurrency",
  "cryptocurrency-blockchain-training": "cryptocurrency-2021-trading-course",
  "consulting-session": "consulting",
};

export function normalizeWooProductSlug(woo: Pick<WooRawProduct, "id" | "name" | "slug">): string {
  const raw = (woo.slug || "").trim().toLowerCase();
  if (!raw || /^\d+$/.test(raw)) {
    if (woo.id === 117 || /psychology clinic/i.test(woo.name)) {
      return "psychology-clinic-health-tips";
    }
    return woo.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  return raw;
}

export type ClassifiedWooProduct = {
  slug: string;
  categorySlug: CategorySlug;
  type: "ebook" | "course" | "tutorial" | "service" | "bundle";
  level: "beginner" | "intermediate" | "advanced";
  priceCents: number;
  salePriceCents: number | null;
  isFree: boolean;
  featured: boolean;
  subtitle: string;
  description: string;
  outcomes: string[];
};

const FEATURED_WOO_IDS = new Set([150, 151, 152, 117, 168, 166]);

/**
 * Deterministically classifies a WooCommerce product into our 6 content pillars
 * (crypto, finance, technical, psychology, marketing, services) and product
 * format (ebook, course, tutorial, service).
 */
export function classifyWooProduct(woo: WooRawProduct): ClassifiedWooProduct {
  const slug = normalizeWooProductSlug(woo);
  const hay = `${woo.name} ${slug} ${(woo.categories ?? []).map((c) => `${c.slug} ${c.name}`).join(" ")}`.toLowerCase();

  let categorySlug: CategorySlug = "crypto";
  const explicitCat = (woo.categories ?? []).find((c) =>
    ["crypto", "finance", "technical", "psychology", "marketing", "services"].includes(
      c.slug.toLowerCase(),
    ),
  );

  if (explicitCat) {
    categorySlug = explicitCat.slug.toLowerCase() as CategorySlug;
  } else if (/\b(tiktok|instagram|facebook|marketing|social media)\b/.test(hay)) {
    categorySlug = "marketing";
  } else if (/\b(electric|electronics|instrumentation|automation|plc)\b/.test(hay)) {
    categorySlug = "technical";
  } else if (/\b(psychology|health|wellbeing|mental|drawing|creative)\b/.test(hay)) {
    categorySlug = "psychology";
  } else if (/\b(genuine money|money|budget|wealth-building|financial)\b/.test(hay) && !/\bcrypto\b/.test(hay)) {
    categorySlug = "finance";
  } else if (/\bconsult(ing|ation)?\b/.test(hay)) {
    categorySlug = "crypto";
  } else {
    categorySlug = "crypto";
  }

  let type: ClassifiedWooProduct["type"] = "ebook";
  if (/\bconsult(ing|ation)?\b/.test(hay)) {
    type = "service";
  } else if (/\b(course|training|strategy|bot|vwap|a-ztm|ztm)\b/.test(hay)) {
    type = "course";
  } else if (woo.id === 152) {
    type = "course";
  }

  let level: ClassifiedWooProduct["level"] = "beginner";
  if (/\b(bot|python|vwap|automation|instrumentation)\b/.test(hay)) {
    level = "intermediate";
  }

  const regularCents = parseWooPriceToCents(woo.regular_price);
  const currentCents = parseWooPriceToCents(woo.price);
  const saleCents = parseWooPriceToCents(woo.sale_price);

  let priceCents = regularCents > 0 ? regularCents : currentCents;
  let salePriceCents: number | null = null;
  if (saleCents > 0 && priceCents > saleCents) {
    salePriceCents = saleCents;
  } else if (currentCents > 0 && regularCents > currentCents) {
    priceCents = regularCents;
    salePriceCents = currentCents;
  }

  const shortClean = stripHtmlToText(woo.short_description);
  const fullClean = stripHtmlToText(woo.description);

  const subtitle =
    (shortClean.split("\n")[0] ?? "").slice(0, 220) ||
    (fullClean.split("\n")[0] ?? "").slice(0, 220) ||
    "Practical, step-by-step digital guide and resource from Akwasuccess.";

  const description =
    fullClean ||
    shortClean ||
    `${woo.name} — practical digital education from Akwasuccess with instant 4-hour download access upon purchase.`;

  const outcomes =
    categorySlug === "marketing"
      ? [
          "Plan and structure high-performing social media content step by step",
          "Grow an engaged audience organically and understand campaign fundamentals",
          "Apply practical checklists and repeatable growth workflows",
        ]
      : categorySlug === "technical"
        ? [
            "Understand core electrical, electronics, and instrumentation concepts clearly",
            "Read industrial control and automation fundamentals with confidence",
            "Bridge classroom theory and practical field applications",
          ]
        : categorySlug === "psychology"
          ? [
              "Build sustainable daily habits for physical and mental wellbeing",
              "Understand nutrition, rest, hydration, and stress management",
              "Apply practical personal development steps in everyday life",
            ]
          : categorySlug === "finance"
            ? [
                "Understand how money works and how lasting wealth is built",
                "Develop a disciplined, clear financial mindset",
                "Recognize genuine value creation vs. short-term speculation",
              ]
            : [
                "Master cryptocurrency, Bitcoin, and blockchain fundamentals safely",
                "Understand market structure, indicators, and risk management",
                "Access your course resource immediately after payment",
              ];

  return {
    slug,
    categorySlug,
    type,
    level,
    priceCents,
    salePriceCents,
    isFree: false,
    featured: Boolean(woo.featured) || FEATURED_WOO_IDS.has(woo.id),
    subtitle,
    description,
    outcomes,
  };
}

/**
 * Formats the Paystack reference as `{wooOrderId}_{unixSeconds}` so the
 * WordPress Paystack WooCommerce Payment Gateway plugin (`explode('_', $ref)`)
 * can reconcile webhooks natively alongside our headless backend.
 */
export function formatPaystackWooReference(
  wooOrderId: number | null | undefined,
  orderNumber: string,
  nowMs = Date.now(),
): string {
  const sec = Math.floor(nowMs / 1000);
  if (wooOrderId && wooOrderId > 0) {
    return `${wooOrderId}_${sec}`;
  }
  return `AKWA_${orderNumber}_${sec}`;
}

export function parseWooOrderIdFromReference(reference: string): number | null {
  const match = /^(\d+)_\d+$/.exec(reference.trim());
  if (!match) return null;
  const id = Number.parseInt(match[1]!, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

/**
 * Verifies a WooCommerce webhook `x-wc-webhook-signature` header (base64
 * HMAC-SHA256 of the raw request body).
 */
export function verifyWooWebhookSignature(
  rawBody: string,
  signature: string | null,
  secret?: string,
): boolean {
  const key = secret || process.env.WOOCOMMERCE_WEBHOOK_SECRET || process.env.AUTH_SECRET;
  if (!key || !signature) return false;
  const expected = crypto.createHmac("sha256", key).update(rawBody).digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature.trim());
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
