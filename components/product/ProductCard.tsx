"use client";

import Link from "next/link";
import { Check, ShoppingBag } from "lucide-react";
import { getCategory } from "@/content/categories";
import { Badge, FormatBadge, LevelBadge, SampleBadge, type Level, typeLabel } from "@/components/ui/Badge";
import { PriceTag } from "@/components/ui/PriceTag";
import { RatingStars } from "@/components/ui/RatingStars";
import { BookMockup } from "@/components/product/BookMockup";
import { cart, useCart } from "@/lib/cart/store";
import { effectivePrice, isOnSale, isPurchasable } from "@/lib/pricing";
import { showToast } from "@/components/ui/Toast";
import { track } from "@/lib/analytics/client";
import { t } from "@/lib/i18n";
import type { ImageRef } from "@/lib/db/schema";

export type ProductCardData = {
  id: string;
  slug: string;
  type: string;
  categorySlug: string;
  title: string;
  subtitle?: string;
  level: Level;
  priceCents: number;
  salePriceCents?: number | null;
  isFree: boolean;
  isSample?: boolean;
  formats?: string[];
  cover?: ImageRef | null;
  ratingAvg?: number;
  ratingCount?: number;
};

/**
 * Product card with CSS container queries (`@container`) so its internal
 * footer adapts to narrow grid columns as well as wider horizontal cards.
 */
export function ProductCard({ product }: { product: ProductCardData }) {
  const items = useCart();
  const inCart = items.some((i) => i.productId === product.id);
  const cat = getCategory(product.categorySlug);
  const price = effectivePrice(product);
  const canBuy = isPurchasable(product);
  const onSale = isOnSale(product);
  const href = product.type === "course" ? `/courses/${product.slug}` : `/shop/${product.slug}`;

  function handleAdd() {
    if (!canBuy) return;
    cart.add({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      type: product.type,
      categorySlug: product.categorySlug,
      priceCents: price,
    });
    track("add_to_cart", { slug: product.slug, priceCents: price });
    showToast(`Added "${product.title}" to cart`);
  }

  return (
    <article className="card @container flex h-full min-w-0 flex-col overflow-hidden p-4 transition-colors hover:border-primary">
      <Link href={href} className="mx-auto block w-full max-w-[180px] no-underline sm:max-w-[200px]">
        <BookMockup
          title={product.title}
          subtitle={product.subtitle}
          categorySlug={product.categorySlug}
          type={product.type}
          cover={product.cover}
        />
      </Link>

      <div className="mt-4 flex min-w-0 flex-1 flex-col justify-between gap-3">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            {cat && <Badge tone="green">{cat.shortName}</Badge>}
            <LevelBadge level={product.level} />
            {product.formats?.[0] && <FormatBadge format={product.formats[0]} />}
            {onSale && <Badge tone="sale">Sale</Badge>}
            {product.isSample && <SampleBadge />}
          </div>

          <h3 className="text-lg leading-snug font-bold">
            <Link href={href} className="hover:text-link no-underline">
              {product.title}
            </Link>
          </h3>

          {product.subtitle && (
            <p className="text-muted mt-1 line-clamp-2 text-sm">{product.subtitle}</p>
          )}

          {product.ratingCount && product.ratingCount > 0 ? (
            <div className="mt-2">
              <RatingStars rating={product.ratingAvg ?? 0} count={product.ratingCount} />
            </div>
          ) : null}
        </div>

        <div className="border-line flex flex-col gap-2.5 border-t pt-3 @[260px]:flex-row @[260px]:items-center @[260px]:justify-between">
          <PriceTag
            amountCents={price}
            originalCents={onSale ? product.priceCents : null}
            isFree={product.isFree}
            comingSoon={!canBuy}
            size="md"
          />

          {canBuy ? (
            <button
              type="button"
              onClick={handleAdd}
              disabled={inCart}
              aria-label={
                inCart
                  ? `${product.title} is in your cart`
                  : `Add ${product.title} to cart`
              }
              className="bg-primary text-primary-fg hover:bg-primary-hover disabled:bg-tint disabled:text-link inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md px-3.5 text-sm font-semibold transition-colors"
            >
              {inCart ? (
                <>
                  <Check className="size-4" aria-hidden />
                  <span>{t.actions.inCart}</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="size-4" aria-hidden />
                  <span>{t.actions.addToCart}</span>
                </>
              )}
            </button>
          ) : (
            <Link
              href={href}
              className="border-primary text-link hover:bg-tint inline-flex min-h-11 items-center justify-center rounded-md border px-3.5 text-sm font-semibold no-underline"
            >
              View {typeLabel[product.type] ?? "details"}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
