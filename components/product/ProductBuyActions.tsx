"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Check, FileDown, ShoppingBag, Zap } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/Button";
import { PriceTag } from "@/components/ui/PriceTag";
import { cart, useCart } from "@/lib/cart/store";
import { effectivePrice, isOnSale, isPurchasable } from "@/lib/pricing";
import { showToast } from "@/components/ui/Toast";
import { track } from "@/lib/analytics/client";
import { t } from "@/lib/i18n";

const FREE_BOOK_LINKS: Record<string, { readUrl: string; pdfUrl: string }> = {
  "chambers-twentieth-century-dictionary": {
    readUrl: "https://archive.org/details/dli.bengal.10689.11967/mode/2up",
    pdfUrl: "https://archive.org/download/dli.bengal.10689.11967/10689.11967.pdf",
  },
  "psychology-of-singing": {
    readUrl: "https://archive.org/details/cu31924021742659/mode/2up",
    pdfUrl: "https://archive.org/download/cu31924021742659/cu31924021742659.pdf",
  },
};

export function ProductBuyActions({
  product,
}: {
  product: {
    id: string;
    slug: string;
    title: string;
    type: string;
    categorySlug: string;
    priceCents: number;
    salePriceCents: number | null;
    isFree: boolean;
    sampleFileKey?: string | null;
    freeDownloadUrl?: string | null;
  };
}) {
  const router = useRouter();
  const items = useCart();
  const inCart = items.some((i) => i.productId === product.id);
  const boxRef = useRef<HTMLDivElement>(null);
  const [showStickyMobile, setShowStickyMobile] = useState(false);

  const price = effectivePrice(product);
  const canBuy = isPurchasable(product);
  const onSale = isOnSale(product);

  useEffect(() => {
    track("product_view", { slug: product.slug, priceCents: price });
  }, [product.slug, price]);

  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry) {
          setShowStickyMobile(!entry.isIntersecting && entry.boundingClientRect.top < 0);
        }
      },
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  function addItem() {
    cart.add({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      type: product.type,
      categorySlug: product.categorySlug,
      priceCents: price,
    });
    track("add_to_cart", { slug: product.slug, priceCents: price });
  }

  function handleBuyNow() {
    if (!canBuy) return;
    addItem();
    router.push("/checkout");
  }

  function handleAddToCart() {
    if (!canBuy) return;
    addItem();
    showToast(`Added "${product.title}" to cart`);
  }

  const freeLinks = FREE_BOOK_LINKS[product.slug];
  const directFreePdf = product.freeDownloadUrl || freeLinks?.pdfUrl || null;
  const directFreeRead = freeLinks?.readUrl || directFreePdf;

  return (
    <>
      <div ref={boxRef} className="space-y-3">
        {product.isFree && directFreePdf ? (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {directFreeRead && (
              <a
                href={directFreeRead}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("sample_download", { slug: product.slug })}
                className="bg-primary text-primary-fg hover:bg-primary-hover flex min-h-12 items-center justify-center gap-2 rounded-md px-5 font-semibold no-underline transition-colors"
              >
                <BookOpen className="size-5" aria-hidden />
                <span>Read Book Online</span>
              </a>
            )}
            <a
              href={directFreePdf}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("sample_download", { slug: product.slug })}
              className="border-line hover:border-primary bg-surface-2 text-fg flex min-h-12 items-center justify-center gap-2 rounded-md border px-5 font-semibold no-underline transition-colors"
            >
              <FileDown className="text-link size-5" aria-hidden />
              <span>Download Free PDF</span>
            </a>
          </div>
        ) : canBuy ? (
          <div className="grid gap-2.5 sm:grid-cols-2">
            <Button
              size="lg"
              onClick={handleBuyNow}
              icon={<Zap className="size-5" aria-hidden />}
            >
              {t.actions.buyNow}
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={handleAddToCart}
              disabled={inCart}
              icon={
                inCart ? (
                  <Check className="size-5" aria-hidden />
                ) : (
                  <ShoppingBag className="size-5" aria-hidden />
                )
              }
            >
              {inCart ? t.actions.inCart : t.actions.addToCart}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-muted text-sm">
              Final pricing is being updated by the owner. Ask us on WhatsApp or contact us to be
              notified as soon as this edition opens.
            </p>
            <LinkButton href="/contact" variant="secondary" block>
              Enquire / Notify me
            </LinkButton>
          </div>
        )}

        {product.sampleFileKey && (
          <a
            href={`/${product.sampleFileKey}`}
            download
            onClick={() => track("sample_download", { slug: product.slug })}
            className="border-line hover:border-primary bg-surface-2 text-fg flex min-h-12 w-full items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold no-underline transition-colors"
          >
            <FileDown className="text-link size-4" aria-hidden />
            <span>{t.actions.readSample} (PDF)</span>
          </a>
        )}
      </div>

      {/* Sticky mobile bottom buy bar (spec 6.2 Rule 14 & 8.3): appears after buy box scrolls out of view, hidden on lg+ */}
      {showStickyMobile && canBuy && (
        <div
          aria-label="Quick purchase bar"
          className="border-line bg-surface/95 fixed inset-x-0 bottom-16 z-30 flex items-center justify-between gap-3 border-t px-4 py-2.5 shadow-[var(--shadow-soft)] backdrop-blur sm:bottom-0 lg:hidden"
        >
          <div>
            <p className="line-clamp-1 text-xs font-medium">{product.title}</p>
            <PriceTag
              amountCents={price}
              originalCents={onSale ? product.priceCents : null}
              isFree={product.isFree}
              size="sm"
            />
          </div>
          <Button size="sm" onClick={handleBuyNow}>
            {t.actions.buyNow}
          </Button>
        </div>
      )}
    </>
  );
}
