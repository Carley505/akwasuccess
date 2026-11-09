"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { SlidersHorizontal, X } from "lucide-react";
import { shopCategories, type Category } from "@/content/categories";
import { ProductCard, type ProductCardData } from "@/components/product/ProductCard";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/States";
import { Button, LinkButton } from "@/components/ui/Button";
import { effectivePrice } from "@/lib/pricing";
import { formatMoney } from "@/lib/utils";
import { t } from "@/lib/i18n";

export type ActiveFilters = {
  category?: string;
  format?: string;
  level?: string;
  pricing?: string;
  maxPrice?: string;
  q?: string;
  sort?: string;
};

const PAGE_SIZE = 16;

export function ShopCatalog({
  products,
  activeCategory,
  initialFilters,
}: {
  products: ProductCardData[];
  activeCategory?: Category;
  initialFilters: ActiveFilters;
}) {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [filters, setFilters] = useState<ActiveFilters>(initialFilters);

  useEffect(() => {
    function syncFromUrl() {
      const sp = new URLSearchParams(window.location.search);
      setFilters({
        category: sp.get("category") ?? initialFilters.category,
        format: sp.get("format") ?? initialFilters.format,
        level: sp.get("level") ?? initialFilters.level,
        pricing: sp.get("pricing") ?? initialFilters.pricing,
        maxPrice: sp.get("maxPrice") ?? initialFilters.maxPrice,
        q: sp.get("q") ?? initialFilters.q,
        sort: sp.get("sort") ?? initialFilters.sort,
      });
    }
    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, [initialFilters]);

  function updateParam(updates: Record<string, string | undefined>) {
    const merged: ActiveFilters = { ...filters, ...updates };
    if (activeCategory) delete merged.category;
    const cleaned: ActiveFilters = {};
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== "all") {
        cleaned[k as keyof ActiveFilters] = v;
        params.set(k, v);
      }
    }
    setFilters(cleaned);
    setVisibleCount(PAGE_SIZE);
    const qs = params.toString();
    const nextUrl = qs ? `${pathname}?${qs}` : pathname;
    window.history.replaceState(null, "", nextUrl);
  }

  function resetAll() {
    setFilters({});
    setVisibleCount(PAGE_SIZE);
    window.history.replaceState(
      null,
      "",
      activeCategory ? `/shop/${activeCategory.slug}` : "/shop",
    );
  }

  const filteredProducts = useMemo(() => {
    const q = filters.q?.trim().toLowerCase();
    const maxCents = filters.maxPrice ? Number(filters.maxPrice) : undefined;

    const list = products.filter((p) => {
      if (!activeCategory && filters.category && p.categorySlug !== filters.category) {
        return false;
      }
      if (filters.format && filters.format !== "all" && p.type !== filters.format) {
        return false;
      }
      if (filters.level && filters.level !== "all" && p.level !== filters.level) {
        return false;
      }
      const price = effectivePrice(p);
      if (filters.pricing === "free" && !(p.isFree || price === 0)) {
        return false;
      }
      if (filters.pricing === "paid" && (p.isFree || price === 0)) {
        return false;
      }
      if (maxCents !== undefined && !Number.isNaN(maxCents) && price > maxCents) {
        return false;
      }
      if (q) {
        const hay = `${p.title} ${p.subtitle ?? ""} ${p.categorySlug} ${p.type}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (filters.sort === "price-asc") {
      return [...list].sort((a, b) => effectivePrice(a) - effectivePrice(b));
    }
    if (filters.sort === "price-desc") {
      return [...list].sort((a, b) => effectivePrice(b) - effectivePrice(a));
    }
    return list;
  }, [products, activeCategory, filters]);

  const chips: { key: keyof ActiveFilters; label: string }[] = [];
  if (!activeCategory && filters.category) {
    const c = shopCategories.find((cat) => cat.slug === filters.category);
    if (c) chips.push({ key: "category", label: `Topic: ${c.shortName}` });
  }
  if (filters.format) chips.push({ key: "format", label: `Format: ${filters.format}` });
  if (filters.level) chips.push({ key: "level", label: `Level: ${filters.level}` });
  if (filters.pricing && filters.pricing !== "all") {
    chips.push({ key: "pricing", label: filters.pricing === "free" ? "Free only" : "Paid" });
  }
  if (filters.maxPrice) {
    chips.push({ key: "maxPrice", label: `Up to ${formatMoney(Number(filters.maxPrice))}` });
  }
  if (filters.q) chips.push({ key: "q", label: `Search: "${filters.q}"` });

  const visibleProducts = filteredProducts.slice(0, visibleCount);

  const filterControls = (
    <div className="space-y-6">
      {/* Search within shop */}
      <div>
        <label htmlFor="shop-q" className="mb-1.5 block text-sm font-bold">
          Keyword
        </label>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            updateParam({ q: String(fd.get("q") ?? "").trim() || undefined });
            setSheetOpen(false);
          }}
          className="flex gap-2"
        >
          <input
            id="shop-q"
            name="q"
            type="search"
            key={filters.q ?? ""}
            defaultValue={filters.q ?? ""}
            placeholder="Search title or topic..."
            className="border-line bg-surface min-h-11 w-full rounded-md border px-3 text-sm"
          />
          <button
            type="submit"
            className="bg-primary text-primary-fg min-h-11 rounded-md px-3 text-sm font-semibold"
          >
            Go
          </button>
        </form>
      </div>

      {/* Category */}
      <div>
        <p className="mb-2 text-sm font-bold">Category</p>
        <ul className="space-y-1 text-sm">
          <li>
            <Link
              href="/shop"
              className={`flex min-h-10 items-center rounded px-2 py-1 no-underline ${
                !activeCategory && !filters.category
                  ? "bg-tint text-link font-semibold"
                  : "hover:bg-surface-2"
              }`}
            >
              All topics
            </Link>
          </li>
          {shopCategories.map((cat) => {
            const selected =
              activeCategory?.slug === cat.slug || filters.category === cat.slug;
            return (
              <li key={cat.slug}>
                <Link
                  href={`/shop/${cat.slug}`}
                  className={`flex min-h-10 items-center rounded px-2 py-1 no-underline ${
                    selected ? "bg-tint text-link font-semibold" : "hover:bg-surface-2"
                  }`}
                >
                  {cat.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Format */}
      <div>
        <label htmlFor="filter-format" className="mb-1.5 block text-sm font-bold">
          Format
        </label>
        <select
          id="filter-format"
          value={filters.format ?? "all"}
          onChange={(e) => updateParam({ format: e.target.value })}
          className="border-line bg-surface min-h-11 w-full rounded-md border px-3 text-sm"
        >
          <option value="all">All formats</option>
          <option value="ebook">eBook (PDF/EPUB)</option>
          <option value="course">Course</option>
          <option value="tutorial">Tutorial</option>
          <option value="service">Consulting / Service</option>
          <option value="bundle">Bundle</option>
        </select>
      </div>

      {/* Level */}
      <div>
        <label htmlFor="filter-level" className="mb-1.5 block text-sm font-bold">
          Difficulty level
        </label>
        <select
          id="filter-level"
          value={filters.level ?? "all"}
          onChange={(e) => updateParam({ level: e.target.value })}
          className="border-line bg-surface min-h-11 w-full rounded-md border px-3 text-sm"
        >
          <option value="all">All levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      {/* Free / Paid & Max price */}
      <div>
        <label htmlFor="filter-pricing" className="mb-1.5 block text-sm font-bold">
          Price
        </label>
        <select
          id="filter-pricing"
          value={filters.pricing ?? "all"}
          onChange={(e) => updateParam({ pricing: e.target.value })}
          className="border-line bg-surface min-h-11 w-full rounded-md border px-3 text-sm"
        >
          <option value="all">All prices</option>
          <option value="free">Free</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      {chips.length > 0 && (
        <Button variant="secondary" size="sm" block onClick={resetAll}>
          {t.actions.reset} all filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      {/* Desktop sidebar */}
      <aside aria-label="Product filters" className="hidden lg:col-span-3 lg:block">
        <div className="card sticky top-24 p-5">{filterControls}</div>
      </aside>

      {/* Main catalog column */}
      <div className="min-w-0 lg:col-span-9">
        {/* Toolbar: count + mobile Filter button + Sort select */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted text-sm font-medium" aria-live="polite">
            Showing <strong>{filteredProducts.length}</strong>{" "}
            {filteredProducts.length === 1 ? "resource" : "resources"}
          </p>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-2.5">
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="border-line bg-surface hover:border-primary inline-flex min-h-11 items-center gap-2 rounded-md border px-3.5 text-sm font-semibold lg:hidden"
            >
              <SlidersHorizontal className="size-4" aria-hidden />
              <span>Filter &amp; Sort</span>
            </button>

            <label htmlFor="shop-sort" className="sr-only">
              Sort products
            </label>
            <select
              id="shop-sort"
              value={filters.sort ?? "popular"}
              onChange={(e) => updateParam({ sort: e.target.value })}
              className="border-line bg-surface min-h-11 min-w-0 flex-1 rounded-md border px-3 text-sm font-medium sm:flex-initial"
            >
              <option value="popular">Sort: Popular</option>
              <option value="newest">Sort: Newest</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
            </select>
          </div>
        </div>

        {/* Active filter chips */}
        {chips.length > 0 && (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {chips.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => updateParam({ [c.key]: undefined })}
                className="bg-tint text-link inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold"
              >
                <span>{c.label}</span>
                <X className="size-3.5" aria-hidden />
              </button>
            ))}
            <button
              type="button"
              onClick={resetAll}
              className="text-link min-h-9 px-2 text-xs font-semibold underline"
            >
              {t.actions.reset}
            </button>
          </div>
        )}

        {filteredProducts.length === 0 ? (
          <EmptyState
            title="No matching eBooks or courses"
            description="Try clearing a filter, searching a broader keyword, or exploring our free learning hub."
            action={
              <>
                <Button onClick={resetAll}>{t.actions.reset} filters</Button>
                <LinkButton href="/learn" variant="secondary">
                  Visit free learning hub
                </LinkButton>
              </>
            }
          />
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
              {visibleProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>

            {visibleCount < filteredProducts.length && (
              <div className="mt-8 text-center">
                <Button
                  variant="secondary"
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                >
                  {t.actions.loadMore} ({filteredProducts.length - visibleCount} more)
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile bottom sheet */}
      <Modal
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Filter & Sort"
        variant="sheet-bottom"
      >
        {filterControls}
      </Modal>
    </div>
  );
}
