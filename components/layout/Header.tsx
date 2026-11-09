"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChevronDown,
  Menu,
  MessageCircle,
  ShoppingBag,
  User,
} from "lucide-react";
import { drawerGroups, mainNav, shopMenu } from "@/content/navigation";
import { site, whatsappLink } from "@/content/site";
import { Logo } from "@/components/ui/Logo";
import { LinkButton } from "@/components/ui/Button";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { Modal } from "@/components/ui/Modal";
import { SearchBar } from "@/components/layout/SearchBar";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useCartCount } from "@/lib/cart/store";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Sticky responsive header (Section 5.2).
 * - Desktop (`lg+`): 72px height, shrinks to 60px on scroll; mega-menu for Shop;
 *   Courses | Learn (Free) | Services | About | Search | Account | Cart | "Start Free" CTA.
 * - Mobile (`<= 1023px`): Hamburger (left) | Logo (center) | Search + Cart (right);
 *   slide-in drawer with >= 48px tap targets.
 */
export function Header() {
  const pathname = usePathname();
  const cartCount = useCartCount();
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {site.announcement && (
        <div className="bg-green-900 px-4 py-2 text-center text-xs font-medium text-white">
          {site.announcement}
        </div>
      )}

      <header
        className={cn(
          "border-line bg-surface/95 sticky top-0 z-40 border-b backdrop-blur transition-[height] duration-200",
          scrolled ? "h-[60px]" : "h-[72px]",
        )}
      >
        <div className="container-site flex h-full min-w-0 items-center justify-between gap-1.5 sm:gap-3">
          {/* Mobile left: hamburger */}
          <div className="flex shrink-0 items-center lg:hidden">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label={t.nav.openMenu}
              className="text-fg hover:bg-surface-2 inline-flex size-10 items-center justify-center rounded-md sm:size-11"
            >
              <Menu className="size-5 sm:size-6" strokeWidth={1.75} aria-hidden />
            </button>
          </div>

          {/* Logo (center on mobile, left on desktop) */}
          <Logo className="min-w-0 shrink lg:mr-4" />

          {/* Desktop navigation */}
          <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
            {/* Shop mega-menu */}
            <div
              className="relative"
              onMouseEnter={() => setShopOpen(true)}
              onMouseLeave={() => setShopOpen(false)}
            >
              <button
                type="button"
                aria-expanded={shopOpen}
                aria-haspopup="true"
                onClick={() => setShopOpen((o) => !o)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setShopOpen(false);
                }}
                className={cn(
                  "hover:text-link inline-flex min-h-11 items-center gap-1 rounded-md px-3 font-semibold",
                  pathname.startsWith("/shop") && "text-link",
                )}
              >
                <span>{t.nav.shop}</span>
                <ChevronDown
                  className={cn("size-4 transition-transform", shopOpen && "rotate-180")}
                  aria-hidden
                />
              </button>

              {shopOpen && (
                <div
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setShopOpen(false);
                  }}
                  className="absolute top-full left-0 z-50 w-[560px] max-w-[calc(100vw-2rem)] pt-1.5"
                >
                  <div className="card w-full p-5 shadow-[var(--shadow-soft)]">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2 space-y-1">
                        <p className="text-muted px-2 pb-1 text-xs font-semibold tracking-wider uppercase">
                          By topic
                        </p>
                        {shopMenu.categories.map((cat) => (
                          <Link
                            key={cat.href}
                            href={cat.href}
                            onClick={() => setShopOpen(false)}
                            className="hover:bg-surface-2 flex items-start gap-3 rounded-md p-2 no-underline"
                          >
                            <span className="bg-tint text-link mt-0.5 grid size-9 shrink-0 place-items-center rounded-md">
                              <CategoryIcon name={cat.icon} className="size-4" />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold">{cat.label}</span>
                              <span className="text-muted line-clamp-1 block text-xs">
                                {cat.description}
                              </span>
                            </span>
                          </Link>
                        ))}
                      </div>

                      <div className="border-line flex flex-col justify-between border-l pl-4">
                        <div className="space-y-1">
                          <p className="text-muted pb-1 text-xs font-semibold tracking-wider uppercase">
                            By format
                          </p>
                          {shopMenu.formats.map((f) => (
                            <Link
                              key={f.href}
                              href={f.href}
                              onClick={() => setShopOpen(false)}
                              className="hover:text-link block py-1.5 text-sm font-medium no-underline"
                            >
                              {f.label}
                            </Link>
                          ))}
                        </div>

                        <Link
                          href="/shop"
                          onClick={() => setShopOpen(false)}
                          className="text-link border-line mt-4 block border-t pt-3 text-sm font-semibold no-underline hover:underline"
                        >
                          Browse all products →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {mainNav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "hover:text-link inline-flex min-h-11 items-center rounded-md px-3 font-semibold no-underline",
                    active && "text-link",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <SearchBar />

            <ThemeToggle variant="cycle" />

            <Link
              href="/account"
              aria-label={t.nav.account}
              className="text-fg hover:text-link hover:bg-surface-2 hidden size-11 items-center justify-center rounded-md lg:inline-flex"
            >
              <User className="size-5" strokeWidth={1.75} aria-hidden />
            </Link>

            <Link
              href="/cart"
              aria-label={
                cartCount > 0 ? `${t.nav.cart} (${cartCount} items)` : t.nav.cart
              }
              className="text-fg hover:text-link hover:bg-surface-2 relative inline-flex size-10 items-center justify-center rounded-md no-underline sm:size-11"
            >
              <ShoppingBag className="size-5" strokeWidth={1.75} aria-hidden />
              {cartCount > 0 && (
                <span
                  aria-hidden
                  className="bg-primary text-primary-fg absolute top-1 right-1 inline-flex min-w-5 items-center justify-center rounded-full px-1 text-[11px] leading-4 font-bold"
                >
                  {cartCount}
                </span>
              )}
            </Link>

            <LinkButton
              href="/free"
              size="sm"
              className="ml-2 hidden lg:inline-flex"
            >
              {t.nav.startFree}
            </LinkButton>
          </div>
        </div>
      </header>

      {/* Mobile slide-in drawer */}
      <Modal
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title="Menu"
        variant="drawer-left"
      >
        <nav aria-label="Mobile navigation" className="flex flex-1 flex-col justify-between gap-6">
          <div className="space-y-5">
            <LinkButton href="/free" block onClick={() => setDrawerOpen(false)}>
              {t.nav.startFree}
            </LinkButton>

            {drawerGroups.map((group) => (
              <div key={group.title}>
                <p className="text-muted mb-1.5 px-2 text-xs font-bold tracking-wider uppercase">
                  {group.title}
                </p>
                <ul className="space-y-0.5">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setDrawerOpen(false)}
                        className="hover:bg-surface-2 hover:text-link flex min-h-12 items-center rounded-md px-2 font-medium no-underline"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-line space-y-2 border-t pt-4">
            <div className="flex items-center justify-between gap-2 px-2 py-1">
              <span className="text-muted text-xs font-bold tracking-wider uppercase">
                Appearance
              </span>
              <ThemeToggle variant="segmented" />
            </div>
            <Link
              href="/account"
              onClick={() => setDrawerOpen(false)}
              className="hover:bg-surface-2 flex min-h-12 items-center gap-2.5 rounded-md px-2 font-semibold no-underline"
            >
              <User className="text-link size-5" aria-hidden />
              <span>My account & library</span>
            </Link>
            {site.whatsapp && (
              <a
                href={whatsappLink("Hello Akwasuccess")}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:bg-surface-2 flex min-h-12 items-center gap-2.5 rounded-md px-2 font-semibold no-underline"
              >
                <MessageCircle className="text-link size-5" aria-hidden />
                <span>{t.nav.chatWhatsApp}</span>
              </a>
            )}
          </div>
        </nav>
      </Modal>
    </>
  );
}
