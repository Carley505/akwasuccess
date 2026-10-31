"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Loader2,
  PhoneCall,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { PageHeader, Section } from "@/components/ui/Layout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button, LinkButton } from "@/components/ui/Button";
import { Field, FormAlert, Input } from "@/components/ui/Form";
import { PriceTag } from "@/components/ui/PriceTag";
import { GuaranteeBadge, PaymentBadges, SecureNote } from "@/components/ui/Trust";
import { EmptyState } from "@/components/ui/States";
import { disclaimers } from "@/content/site";
import { cart, useCart } from "@/lib/cart/store";
import { computeTotals } from "@/lib/pricing";
import { isValidKenyanPhone } from "@/lib/phone";
import { track } from "@/lib/analytics/client";
import { formatKes } from "@/lib/utils";

type PaymentStep =
  | { state: "form" }
  | {
      state: "mpesa-waiting";
      paymentId: string;
      orderId: string;
      orderNumber: string;
      provider: "mpesa" | "mock";
      message: string;
      secondsLeft: number;
    }
  | {
      state: "failed";
      paymentId: string;
      reason: string;
    };

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCart();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [method, setMethod] = useState<"mpesa" | "card">("mpesa");
  const [marketingConsent, setMarketingConsent] = useState(false);

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountKes: number;
  } | null>(null);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<PaymentStep>({ state: "form" });

  const totals = computeTotals(
    items.map((i) => i.priceKes),
    appliedCoupon?.discountKes ?? 0,
  );

  const hasCryptoOrFinance = items.some(
    (i) => i.categorySlug === "crypto" || i.categorySlug === "finance",
  );

  useEffect(() => {
    if (items.length > 0) {
      track("begin_checkout", { itemCount: items.length, totalKes: totals.totalKes });
    }
  }, [items.length, totals.totalKes]);

  // Poll M-Pesa payment status & countdown (75s timeout per Spec 8.4)
  useEffect(() => {
    if (step.state !== "mpesa-waiting") return;

    const countdown = window.setInterval(() => {
      setStep((prev) => {
        if (prev.state !== "mpesa-waiting") return prev;
        if (prev.secondsLeft <= 1) {
          track("checkout_error", { reason: "mpesa_timeout" });
          return {
            state: "failed",
            paymentId: prev.paymentId,
            reason:
              "The M-Pesa PIN prompt timed out after 75 seconds. Your cart is saved—click below to retry.",
          };
        }
        return { ...prev, secondsLeft: prev.secondsLeft - 1 };
      });
    }, 1000);

    const poll = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/${step.paymentId}/status`);
        if (!res.ok) return;
        const data = (await res.json()) as {
          status: string;
          orderId: string;
          failureReason?: string;
        };
        if (data.status === "succeeded") {
          track("purchase", { value: totals.totalKes, method: "mpesa" });
          cart.clear();
          router.push(`/checkout/order/${data.orderId}`);
        } else if (data.status === "failed" || data.status === "timeout") {
          track("checkout_error", { reason: data.status });
          setStep({
            state: "failed",
            paymentId: step.paymentId,
            reason:
              data.failureReason ||
              "M-Pesa payment was not completed. Your cart is still safe—try again when ready.",
          });
        }
      } catch {
        /* ignore transient poll error */
      }
    }, 2000);

    return () => {
      window.clearInterval(countdown);
      window.clearInterval(poll);
    };
  }, [step, router, totals.totalKes]);

  async function handleApplyCoupon() {
    setCouponMsg(null);
    const code = couponInput.trim();
    if (!code) return;
    const res = await fetch("/api/checkout/coupon", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code, subtotalKes: totals.subtotalKes }),
    });
    const data = (await res.json()) as { code?: string; discountKes?: number; error?: string };
    if (!res.ok || !data.code) {
      setAppliedCoupon(null);
      setCouponMsg(data.error ?? "Invalid coupon code.");
    } else {
      setAppliedCoupon({ code: data.code, discountKes: data.discountKes ?? 0 });
      setCouponMsg(`Applied ${data.code} (-${formatKes(data.discountKes ?? 0)})`);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address for your receipt and download link.");
      return;
    }
    if (method === "mpesa" && !isValidKenyanPhone(phone)) {
      setError(
        "Please enter a valid Kenyan M-Pesa phone number (e.g. 0712 345 678 or 0110 123 456).",
      );
      return;
    }

    setSubmitting(true);
    track("payment_method_chosen", { method });

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          phone,
          name,
          method,
          productIds: items.map((i) => i.productId),
          couponCode: appliedCoupon?.code ?? null,
          marketingConsent,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        orderId?: string;
        orderNumber?: string;
        paymentId?: string;
        provider?: "mpesa" | "paystack" | "mock";
        status?: string;
        message?: string;
        authorizationUrl?: string;
      };

      if (!res.ok || !data.orderId || !data.paymentId) {
        setError(data.error ?? "Could not start checkout. Please try again.");
        setSubmitting(false);
        return;
      }

      if (data.status === "succeeded") {
        track("purchase", { value: totals.totalKes, method });
        cart.clear();
        router.push(`/checkout/order/${data.orderId}`);
        return;
      }

      if (method === "mpesa") {
        setStep({
          state: "mpesa-waiting",
          paymentId: data.paymentId,
          orderId: data.orderId,
          orderNumber: data.orderNumber ?? "",
          provider: data.provider === "mpesa" ? "mpesa" : "mock",
          message:
            data.message ?? "Check your phone and enter your M-Pesa PIN to complete payment.",
          secondsLeft: 75,
        });
      } else if (data.provider === "mock") {
        // Sandbox card mode: settle and redirect to order confirmation
        await fetch(`/api/payments/${data.paymentId}/status`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "succeed" }),
        });
        track("purchase", { value: totals.totalKes, method: "card" });
        cart.clear();
        router.push(`/checkout/order/${data.orderId}`);
      } else if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      }
    } catch {
      setError("Network error while connecting to checkout. Your cart is safe—please retry.");
    } finally {
      setSubmitting(false);
    }
  }

  async function simulateSandbox(paymentId: string, action: "succeed" | "fail" | "timeout") {
    await fetch(`/api/payments/${paymentId}/status`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action }),
    });
  }

  if (items.length === 0 && step.state === "form") {
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
        intro="Guest checkout—your download link unlocks immediately and is emailed to you within 60 seconds."
        breadcrumbs={[
          <Breadcrumbs
            key="b"
            items={[{ name: "Cart", href: "/cart" }, { name: "Checkout" }]}
          />,
        ]}
      />

      <Section>
        {/* Collapsible order summary on mobile */}
        <details className="card mb-6 p-4 lg:hidden">
          <summary className="flex items-center justify-between font-semibold">
            <span>
              Order summary ({items.length} {items.length === 1 ? "item" : "items"})
            </span>
            <span className="flex items-center gap-1 font-bold">
              {formatKes(totals.totalKes)}
              <ChevronDown className="chevron size-4 transition-transform" aria-hidden />
            </span>
          </summary>
          <ul className="divide-line mt-3 divide-y text-sm">
            {items.map((i) => (
              <li key={i.productId} className="flex justify-between py-2">
                <span>{i.title}</span>
                <span className="font-semibold">{formatKes(i.priceKes)}</span>
              </li>
            ))}
          </ul>
        </details>

        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            {step.state === "mpesa-waiting" ? (
              <div
                role="status"
                aria-live="polite"
                className="card space-y-5 p-6 text-center md:p-8"
              >
                <div className="bg-tint text-link mx-auto grid size-14 place-items-center rounded-full">
                  <PhoneCall className="size-7" aria-hidden />
                </div>
                <h2 className="text-2xl font-bold">Check your phone and enter your M-Pesa PIN</h2>
                <p className="text-muted mx-auto max-w-md">{step.message}</p>

                <div className="text-link inline-flex items-center gap-2 text-sm font-semibold">
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  <span>Waiting for confirmation ({step.secondsLeft}s remaining)...</span>
                </div>

                {step.provider === "mock" && (
                  <div className="border-line bg-surface-2 space-y-3 rounded-lg border p-4 text-left text-xs">
                    <p className="font-bold uppercase">
                      Sandbox M-Pesa Simulator (active because live Daraja keys are not set)
                    </p>
                    <p className="text-muted">
                      Choose an outcome below to test the live webhook and polling flow:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => simulateSandbox(step.paymentId, "succeed")}
                        icon={<CheckCircle2 className="size-4" aria-hidden />}
                      >
                        Simulate PIN Approved
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => simulateSandbox(step.paymentId, "fail")}
                      >
                        Simulate Wrong PIN
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => simulateSandbox(step.paymentId, "timeout")}
                      >
                        Simulate Timeout
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : step.state === "failed" ? (
              <div role="alert" className="card space-y-4 p-6 md:p-8">
                <h2 className="text-xl font-bold">Payment was not completed</h2>
                <p className="text-muted">{step.reason}</p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => setStep({ state: "form" })}
                    icon={<RefreshCw className="size-4" aria-hidden />}
                  >
                    Try again (your cart is saved)
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setMethod("card");
                      setStep({ state: "form" });
                    }}
                  >
                    Switch to Card payment
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="card space-y-6 p-6 md:p-8" noValidate>
                <div className="space-y-4">
                  <h2 className="text-xl font-bold">1. Where should we send your download?</h2>
                  <Field
                    id="checkout-email"
                    label="Email address"
                    hint="We send your receipt, instant download link, and account magic link here."
                  >
                    <Input
                      id="checkout-email"
                      name="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </Field>

                  <Field id="checkout-name" label="Your name" optional>
                    <Input
                      id="checkout-name"
                      name="name"
                      autoComplete="name"
                      placeholder="e.g. Wanjiku Kamau"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </Field>
                </div>

                {/* Payment method selector (M-Pesa first for Kenya, then Card) */}
                <fieldset className="space-y-3">
                  <legend className="text-xl font-bold">2. Choose payment method</legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label
                      className={`card flex cursor-pointer items-start gap-3 p-4 ${
                        method === "mpesa" ? "border-primary bg-tint/40 border-2" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        value="mpesa"
                        checked={method === "mpesa"}
                        onChange={() => setMethod("mpesa")}
                        className="mt-1 size-5 accent-[var(--green-700)]"
                      />
                      <div>
                        <span className="block font-bold">M-Pesa STK Push</span>
                        <span className="text-muted text-xs">
                          Enter your number and approve with your M-Pesa PIN on your phone.
                        </span>
                      </div>
                    </label>

                    <label
                      className={`card flex cursor-pointer items-start gap-3 p-4 ${
                        method === "card" ? "border-primary bg-tint/40 border-2" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        value="card"
                        checked={method === "card"}
                        onChange={() => setMethod("card")}
                        className="mt-1 size-5 accent-[var(--green-700)]"
                      />
                      <div>
                        <span className="flex items-center gap-1.5 font-bold">
                          <CreditCard className="size-4" aria-hidden /> Card (Visa / Mastercard)
                        </span>
                        <span className="text-muted text-xs">
                          Pay securely with any local or international debit or credit card.
                        </span>
                      </div>
                    </label>
                  </div>
                </fieldset>

                {method === "mpesa" && (
                  <Field
                    id="checkout-phone"
                    label="M-Pesa phone number"
                    hint="Formats accepted: 0712 345 678, 0110 123 456, or 254712345678."
                  >
                    <Input
                      id="checkout-phone"
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      required
                      placeholder="0712 345 678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </Field>
                )}

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

                <Button type="submit" size="lg" block loading={submitting}>
                  {method === "mpesa"
                    ? `Pay ${formatKes(totals.totalKes)} with M-Pesa`
                    : `Pay ${formatKes(totals.totalKes)} by Card`}
                </Button>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <SecureNote />
                  <PaymentBadges />
                </div>
              </form>
            )}
          </div>

          {/* Desktop order summary + coupon */}
          <aside className="lg:col-span-5">
            <div className="card space-y-5 p-6">
              <h2 className="text-xl font-bold">Order summary</h2>
              <ul className="divide-line divide-y text-sm">
                {items.map((item) => (
                  <li key={item.productId} className="flex items-center justify-between gap-3 py-3">
                    <span>{item.title}</span>
                    <PriceTag amountKes={item.priceKes} size="sm" />
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
                  <dd className="font-semibold">{formatKes(totals.subtotalKes)}</dd>
                </div>
                {totals.discountKes > 0 && (
                  <div className="text-link flex justify-between">
                    <dt>Discount ({appliedCoupon?.code})</dt>
                    <dd className="font-semibold">-{formatKes(totals.discountKes)}</dd>
                  </div>
                )}
                <div className="border-line flex justify-between border-t pt-2 text-base font-bold">
                  <dt>Total</dt>
                  <dd>
                    <PriceTag amountKes={totals.totalKes} size="lg" />
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
