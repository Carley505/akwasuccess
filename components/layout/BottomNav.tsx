"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Home, ShoppingBag, Store, User } from "lucide-react";
import { useCartCount } from "@/lib/cart/store";
import { cn } from "@/lib/utils";

const items = [
  { label: "Home", href: "/", icon: Home },
  { label: "Shop", href: "/shop", icon: Store },
  { label: "Learn", href: "/learn", icon: BookOpen },
  { label: "Cart", href: "/cart", icon: ShoppingBag, isCart: true },
  { label: "Account", href: "/account", icon: User },
] as const;

/**
 * Fixed bottom navigation bar for phones (`<= 640px`, spec 5.2).
 * Safe-area aware (`env(safe-area-inset-bottom)`), tap targets >= 48px.
 */
export function BottomNav() {
  const pathname = usePathname();
  const cartCount = useCartCount();

  return (
    <nav
      aria-label="Bottom navigation"
      className="border-line bg-surface/95 safe-bottom fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur sm:hidden"
    >
      <ul className="grid h-16 grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href} className="flex">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex w-full flex-col items-center justify-center gap-0.5 text-xs font-semibold no-underline",
                  active ? "text-link" : "text-muted hover:text-fg",
                )}
              >
                <span className="relative">
                  <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                  {"isCart" in item && item.isCart && cartCount > 0 && (
                    <span
                      aria-hidden
                      className="bg-primary text-primary-fg absolute -top-1.5 -right-2.5 inline-flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-4 font-bold"
                    >
                      {cartCount}
                    </span>
                  )}
                </span>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
