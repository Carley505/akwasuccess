"use client";

import { useSyncExternalStore } from "react";

/**
 * Client cart (digital goods: quantity is always 1).
 * Stored in localStorage so it survives payment failures and reloads.
 * Prices here are for DISPLAY ONLY; the server recomputes everything.
 */
export type CartItem = {
  productId: string;
  slug: string;
  title: string;
  type: string;
  categorySlug: string;
  priceKes: number;
};

const KEY = "akwa:cart:v1";
const listeners = new Set<() => void>();
let cache: CartItem[] | null = null;
const EMPTY: CartItem[] = [];

function load(): CartItem[] {
  if (typeof window === "undefined") return EMPTY;
  if (cache) return cache;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    cache = Array.isArray(parsed) ? parsed : [];
  } catch {
    cache = [];
  }
  return cache!;
}

function save(items: CartItem[]) {
  cache = items;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* storage full or disabled: keep in memory */
  }
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      cache = null;
      listeners.forEach((l) => l());
    }
  });
}

export const cart = {
  get: load,
  add(item: CartItem) {
    const items = load();
    if (items.some((i) => i.productId === item.productId)) return;
    save([...items, item]);
  },
  remove(productId: string) {
    save(load().filter((i) => i.productId !== productId));
  },
  clear() {
    save([]);
  },
  has(productId: string) {
    return load().some((i) => i.productId === productId);
  },
};

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useCart(): CartItem[] {
  return useSyncExternalStore(subscribe, load, () => EMPTY);
}

export function useCartCount(): number {
  return useCart().length;
}
