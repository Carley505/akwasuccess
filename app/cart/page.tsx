"use client";

import Link from "next/link";
import { Trash2, ArrowRight, ShoppingBag, UserCheck, UserPlus } from "lucide-react";
import { PageHeader, Section } from "@/components/ui/Layout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { LinkButton } from "@/components/ui/Button";
import { PriceTag } from "@/components/ui/PriceTag";
import { GuaranteeBadge, PaymentBadges, SecureNote } from "@/components/ui/Trust";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";
import { EmptyState } from "@/components/ui/States";
import { cart, useCart, useCartAccountStatus } from "@/lib/cart/store";
import { computeTotals } from "@/lib/pricing";

export default function CartPage() {
  const items = useCart();
  const account = useCartAccountStatus();
  const totals = computeTotals(items.map((i) => i.priceCents));
  const hasCryptoOrFinance = items.some(
    (i) => i.categorySlug === "crypto" || i.categorySlug === "finance",
  );

  return (
    <>
      <PageHeader
        title="Your Cart"
        intro="Review your selected eBooks and courses before proceeding to instant USD card checkout."
        breadcrumbs={<Breadcrumbs items={[{ name: "Cart" }]} />}
      />

      <Section>
        {/* Account persistence & order history prompt */}
        <div className="card border-primary/30 bg-tint/30 mb-6 flex flex-wrap items-center justify-between gap-4 border p-4 text-sm">
          {account.authenticated && account.user ? (
            <div className="flex items-center gap-2.5">
              <UserCheck className="text-link size-5 shrink-0" aria-hidden />
              <p>
                Signed in as <strong>{account.user.email}</strong> — your cart items are saved to
                your account and your order history is available in{" "}
                <Link href="/account" className="link font-semibold">
                  My Account
                </Link>
                .
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-2.5">
                <UserPlus className="text-link mt-0.5 size-5 shrink-0" aria-hidden />
                <p>
                  <strong>You are free to check out as a guest.</strong> However, to{" "}
                  <strong>save &amp; persist your cart items</strong> across devices and{" "}
                  <strong>view your order history</strong> anytime, please sign up or log in.
                </p>
              </div>
              <LinkButton href="/account?redirect=/cart" variant="secondary" size="sm">
                Sign up / Log in
              </LinkButton>
            </>
          )}
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag className="size-7" aria-hidden />}
            title="Your cart is empty"
            description="Browse our beginner-friendly eBooks and courses or start with a free guide."
            action={
              <>
                <LinkButton href="/shop">Browse eBooks</LinkButton>
                <LinkButton href="/free" variant="secondary">
                  Free resources
                </LinkButton>
              </>
            }
          />
        ) : (
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-8">
              <ul className="divide-line card divide-y">
                {items.map((item) => (
                  <li
                    key={item.productId}
                    className="flex flex-wrap items-center justify-between gap-4 p-5"
                  >
                    <div>
                      <Link
                        href={`/shop/${item.slug}`}
                        className="hover:text-link font-serif text-lg font-bold no-underline"
                      >
                        {item.title}
                      </Link>
                      <p className="text-muted mt-0.5 text-xs capitalize">
                        {item.type} • Instant 4-hour timed download &amp; access
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <PriceTag amountCents={item.priceCents} />
                      <button
                        type="button"
                        onClick={() => cart.remove(item.productId)}
                        aria-label={`Remove ${item.title} from cart`}
                        className="text-muted hover:text-danger inline-flex size-11 items-center justify-center rounded-md"
                      >
                        <Trash2 className="size-5" aria-hidden />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              {hasCryptoOrFinance && <DisclaimerBanner variant="crypto" compact />}
            </div>

            <aside className="lg:col-span-4">
              <div className="card space-y-4 p-6">
                <h2 className="text-xl font-bold">Order summary</h2>
                <div className="border-line flex items-baseline justify-between border-y py-3">
                  <span className="font-semibold">Total</span>
                  <PriceTag amountCents={totals.totalCents} size="lg" />
                </div>

                <LinkButton
                  href="/checkout"
                  size="lg"
                  block
                  iconRight={<ArrowRight className="size-5" aria-hidden />}
                >
                  Proceed to checkout
                </LinkButton>

                <SecureNote />
                <PaymentBadges />
                <GuaranteeBadge />
              </div>
            </aside>
          </div>
        )}
      </Section>
    </>
  );
}
