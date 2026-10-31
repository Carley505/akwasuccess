"use client";

/**
 * Privacy-friendly client analytics helper (Section 15).
 * Never sends PII (emails, phone numbers, names). Forwards to Plausible or GA4
 * when configured, and dispatches a CustomEvent for E2E/debug assertions.
 */
export type AnalyticsEventName =
  | "page_view"
  | "search_query"
  | "category_click"
  | "product_view"
  | "sample_download"
  | "add_to_cart"
  | "begin_checkout"
  | "payment_method_chosen"
  | "purchase"
  | "checkout_error"
  | "newsletter_signup"
  | "contact_submission"
  | "quote_request"
  | "scroll_depth"
  | "whatsapp_click";

type Props = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    plausible?: (event: string, opts?: { props?: Props }) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

export function track(event: AnalyticsEventName, props?: Props) {
  if (typeof window === "undefined") return;
  try {
    window.plausible?.(event, props ? { props } : undefined);
    window.gtag?.("event", event, props ?? {});
    window.dispatchEvent(new CustomEvent("akwa:analytics", { detail: { event, props } }));
  } catch {
    /* ignore tracking failures */
  }
}
