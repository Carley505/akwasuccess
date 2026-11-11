"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronDown,
  CreditCard,
  Lock,
  ShieldAlert,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { PageHeader, Section } from "@/components/ui/Layout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button, LinkButton } from "@/components/ui/Button";
import { Field, FormAlert, Input } from "@/components/ui/Form";
import { PriceTag } from "@/components/ui/PriceTag";
import { GuaranteeBadge, PaymentBadges, SecureNote } from "@/components/ui/Trust";
import { EmptyState } from "@/components/ui/States";
import { disclaimers } from "@/content/site";
import { cart, useCart, useCartAccountStatus } from "@/lib/cart/store";
import { computeTotals } from "@/lib/pricing";
import { track } from "@/lib/analytics/client";
import { formatMoney } from "@/lib/utils";

type CheckoutResponse = {
  error?: string;
  orderId?: string;
  orderNumber?: string;
  paymentId?: string;
  provider?: "paystack" | "mock";
  status?: string;
  reference?: string;
  amountCents?: number;
  chargedCurrency?: string;
  chargedAmountSubunits?: number;
  email?: string;
  accessCode?: string;
  publicKey?: string;
  authorizationUrl?: string;
};

type PaystackInlineHandler = {
  openIframe: () => void;
};

type PaystackPopGlobal = {
  setup: (opts: {
    key: string;
    email: string;
    amount: number;
    currency: string;
    ref: string;
    access_code?: string;
    callback: (response: { reference: string }) => void;
    onClose: () => void;
  }) => PaystackInlineHandler;
};

function loadPaystackInlineScript(): Promise<PaystackPopGlobal | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  const w = window as unknown as { PaystackPop?: PaystackPopGlobal };
  if (w.PaystackPop) return Promise.resolve(w.PaystackPop);

  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://js.paystack.co/v1/inline.js"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(w.PaystackPop ?? null), { once: true });
      existing.addEventListener("error", () => resolve(null), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => resolve(w.PaystackPop ?? null);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
}

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCart();
  const account = useCartAccountStatus();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountCents: number;
  } | null>(null);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveEmail = email || account.user?.email || "";
  const effectiveName = name || account.user?.name || "";

  const totals = computeTotals(
    items.map((i) => i.priceCents),
    appliedCoupon?.discountCents ?? 0,
  );

  const hasCryptoOrFinance = items.some(
    (i) => i.categorySlug === "crypto" || i.categorySlug === "finance",
  );

  async function handleApplyCoupon() {
    setCouponMsg(null);
    const code = couponInput.trim();
    if (!code) return;
    const res = await fetch("/api/checkout/coupon", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code, subtotalCents: totals.subtotalCents }),
    });
    const data = (await res.json()) as { code?: string; discountCents?: number; error?: string };
    if (!res.ok || !data.code) {
      setAppliedCoupon(null);
      setCouponMsg(data.error ?? "Invalid coupon code.");
    } else {
      setAppliedCoupon({ code: data.code, discountCents: data.discountCents ?? 0 });
      setCouponMsg(`Applied ${data.code} (-${formatMoney(data.discountCents ?? 0)})`);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!effectiveEmail.trim() || !effectiveEmail.includes("@")) {
      setError("Please enter a valid email address for your receipt and 4-hour download link.");
      return;
    }

    setSubmitting(true);
    track("payment_method_chosen", { method: "card" });

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: effectiveEmail,
          name: effectiveName,
          productIds: items.map((i) => i.productId),
          couponCode: appliedCoupon?.code ?? null,
          marketingConsent,
        }),
      });
      const data = (await res.json()) as CheckoutResponse;

      if (!res.ok || !data.orderId || !data.paymentId) {
        track("checkout_error", { reason: "checkout_start_failed" });
        setError(data.error ?? "Could not start checkout. Please try again.");
        setSubmitting(false);
        return;
      }

      if (data.status === "succeeded") {
        track("purchase", { value: totals.totalCents, currency: "USD" });
        cart.clear();
        router.push(`/checkout/order/${data.orderId}`);
        return;
      }

      if (data.provider === "mock") {
        // Sandbox fallback when live Paystack keys have not been added yet
        await fetch(`/api/payments/${data.paymentId}/status`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "succeed" }),
        });
        track("purchase", { value: totals.totalCents, currency: "USD" });
        cart.clear();
        router.push(`/checkout/order/${data.orderId}`);
        return;
      }

      // Option A: Seamless In-Site Paystack Inline Checkout
      const publicKey = (
        data.publicKey ||
        process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ||
        ""
      ).replace(/\s+/g, "");

      if (publicKey && data.reference) {
        const paystackPop = await loadPaystackInlineScript();
        if (paystackPop) {
          const handler = paystackPop.setup({
            key: publicKey,
            email: data.email || effectiveEmail.trim(),
            amount: data.chargedAmountSubunits ?? data.amountCents ?? totals.totalCents,
            currency: data.chargedCurrency || "USD",
            ref: data.reference,
            access_code: data.accessCode,
            callback: (response) => {
              void (async () => {
                setSubmitting(true);
                const verifyRes = await fetch("/api/payments/verify", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({
                    paymentId: data.paymentId,
                    reference: response.reference || data.reference,
                  }),
                });
                const verifyJson = (await verifyRes.json().catch(() => ({}))) as {
                  ok?: boolean;
                  error?: string;
                };
                if (!verifyRes.ok || !verifyJson.ok) {
                  setError(
                    verifyJson.error ??
                      "We could not confirm your payment yet. If your card was charged, check your email in 60 seconds.",
                  );
                  setSubmitting(false);
                  return;
                }
                track("purchase", { value: totals.totalCents, currency: "USD" });
                cart.clear();
                router.push(`/checkout/order/${data.orderId}`);
              })();
            },
            onClose: () => {
              setSubmitting(false);
              setError(
                "Payment popup was closed before completion. Your cart is safe—click Pay securely when ready.",
              );
            },
          });
          handler.openIframe();
          return;
        }
      }

      // Fallback to Paystack authorization URL if inline script is blocked by browser extension
      if (data.authorizationUrl) {
        window.location.assign(data.authorizationUrl);
        return;
      }
      setSubmitting(false);
    } catch {
      setError("Network error while connecting to checkout. Your cart is safe—please retry.");
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <>
        <PageHeader
          title="Checkout"
          breadcrumbs={<Breadcrumbs items={[{ name: "Checkout" }]} />}
        />
        <Section>
          <EmptyState
            title="Your cart is empty"
            description="Add an eBook or course before checking out."
            action={<LinkButton href="/shop">Browse eBooks</LinkButton>}
          />
        </Section>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Secure Checkout"
        intro="Seamless in-site checkout — your 4-hour timed download link and course access unlock immediately on the confirmation page and by email. All prices are in US dollars (USD)."
        breadcrumbs={[
          <Breadcrumbs
            key="b"
            items={[{ name: "Cart", href: "/cart" }, { name: "Checkout" }]}
          />,
        ]}
      />

      <Section>
        {/* Guest freedom vs Account sign-up/log-in notice */}
        <div className="card border-primary/30 bg-tint/30 mb-6 flex flex-wrap items-center justify-between gap-4 border p-4 text-sm">
          {account.authenticated && account.user ? (
            <div className="flex items-center gap-2.5">
              <UserCheck className="text-link size-5 shrink-0" aria-hidden />
              <p>
                Signed in as <strong>{account.user.email}</strong> — this order will be saved to
                your account order history and library.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-2.5">
                <UserPlus className="text-link mt-0.5 size-5 shrink-0" aria-hidden />
                <p>
                  <strong>Guest checkout is open:</strong> you can complete your purchase right now
                  without an account. To <strong>view your order history</strong>,{" "}
                  <strong>save &amp; persist your cart items</strong>, or generate fresh 4-hour
                  download links anytime, please sign up or log in.
                </p>
              </div>
              <LinkButton href="/account?redirect=/checkout" variant="secondary" size="sm">
                Sign up / Log in
              </LinkButton>
            </>
          )}
        </div>

        {/* Collapsible order summary on mobile */}
        <details className="card mb-6 p-4 lg:hidden">
          <summary className="flex items-center justify-between font-semibold">
            <span>
              Order summary ({items.length} {items.length === 1 ? "item" : "items"})
            </span>
            <span className="flex items-center gap-1 font-bold">
              {formatMoney(totals.totalCents)}
              <ChevronDown className="chevron size-4 transition-transform" aria-hidden />
            </span>
          </summary>
          <ul className="divide-line mt-3 divide-y text-sm">
            {items.map((i) => (
              <li key={i.productId} className="flex justify-between py-2">
                <span>{i.title}</span>
                <span className="font-semibold">{formatMoney(i.priceCents)}</span>
              </li>
            ))}
          </ul>
        </details>

        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <form onSubmit={onSubmit} className="card space-y-6 p-6 md:p-8" noValidate>
              <div className="space-y-4">
                <h2 className="text-xl font-bold">1. Where should we send your download?</h2>
                <Field
                  id="checkout-email"
                  label="Email address"
                  hint="We send your receipt, 4-hour timed download link, and account sign-in link here."
                >
                  <Input
                    id="checkout-email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                    value={effectiveEmail}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Field>

                <Field id="checkout-name" label="Your name" optional>
                  <Input
                    id="checkout-name"
                    name="name"
                    autoComplete="name"
                    placeholder="e.g. Alex Morgan"
                    value={effectiveName}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Field>
              </div>

              <fieldset className="space-y-3">
                <legend className="text-xl font-bold">2. Payment (In-Site Card Checkout)</legend>
                <div className="card border-primary bg-tint/40 flex items-start gap-3 border-2 p-4">
                  <CreditCard className="text-link mt-0.5 size-5 shrink-0" aria-hidden />
                  <div>
                    <span className="block font-bold">Credit or debit card (Paystack Inline)</span>
                    <span className="text-muted text-xs">
                      Visa, Mastercard and major cards worldwide. Complete payment right on this
                      page in US dollars (USD). Once confirmed, your 4-hour download and course
                      access unlock immediately.
                    </span>
                  </div>
                </div>
              </fieldset>

              <label className="flex items-start gap-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={(e) => setMarketingConsent(e.target.checked)}
                  className="mt-1 size-5 rounded border-line accent-[var(--green-700)]"
                />
                <span className="text-muted">
                  Send me occasional free study guides and new eBook updates (optional;
                  unsubscribe anytime).
                </span>
              </label>

              {error && <FormAlert tone="error">{error}</FormAlert>}

              {hasCryptoOrFinance && (
                <div className="border-gold-500 bg-tint-gold flex items-start gap-2.5 rounded-md border-l-4 p-3 text-xs">
                  <ShieldAlert
                    className="text-gold-text mt-0.5 size-4 shrink-0"
                    aria-hidden
                  />
                  <p>{disclaimers.crypto}</p>
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                block
                loading={submitting}
                icon={<Lock className="size-4" aria-hidden />}
              >
                {totals.totalCents === 0
                  ? "Get your free download"
                  : `Pay ${formatMoney(totals.totalCents)} securely`}
              </Button>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <SecureNote />
                <PaymentBadges />
              </div>
            </form>
          </div>

          {/* Desktop order summary + coupon */}
          <aside className="lg:col-span-5">
            <div className="card space-y-5 p-6">
              <h2 className="text-xl font-bold">Order summary</h2>
              <ul className="divide-line divide-y text-sm">
                {items.map((item) => (
                  <li key={item.productId} className="flex items-center justify-between gap-3 py-3">
                    <span>{item.title}</span>
                    <PriceTag amountCents={item.priceCents} size="sm" />
                  </li>
                ))}
              </ul>

              {/* Coupon box */}
              <div className="border-line space-y-2 border-t pt-4">
                <label htmlFor="coupon-code" className="block text-xs font-bold uppercase">
                  Coupon code
                </label>
                <div className="flex gap-2">
                  <Input
                    id="coupon-code"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Enter code"
                    className="min-h-11 text-sm"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleApplyCoupon}
                  >
                    Apply
                  </Button>
                </div>
                {couponMsg && <p className="text-muted text-xs">{couponMsg}</p>}
              </div>

              <dl className="border-line space-y-2 border-t pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Subtotal</dt>
                  <dd className="font-semibold">{formatMoney(totals.subtotalCents)}</dd>
                </div>
                {totals.discountCents > 0 && (
                  <div className="text-link flex justify-between">
                    <dt>Discount ({appliedCoupon?.code})</dt>
                    <dd className="font-semibold">-{formatMoney(totals.discountCents)}</dd>
                  </div>
                )}
                <div className="border-line flex justify-between border-t pt-2 text-base font-bold">
                  <dt>Total (USD)</dt>
                  <dd>
                    <PriceTag amountCents={totals.totalCents} size="lg" />
                  </dd>
                </div>
              </dl>

              <GuaranteeBadge />
              <p className="text-muted text-xs">
                By completing your purchase you agree to our{" "}
                <Link href="/terms" className="link">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/refund-policy" className="link">
                  Refund Policy
                </Link>
                .
              </p>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
