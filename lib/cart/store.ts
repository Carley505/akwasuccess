"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * Client cart (digital goods: quantity is always 1).
 * Stored in localStorage for instant responsiveness and synced with `/api/cart`
 * when the buyer is signed in so their cart persists across devices.
 * Prices here are for DISPLAY ONLY; the server recomputes everything.
 */
export type CartItem = {
  productId: string;
  slug: string;
  title: string;
  type: string;
  categorySlug: string;
  priceCents: number;
};

export type CartAccountStatus = {
  loaded: boolean;
  authenticated: boolean;
  user: { email: string; name?: string | null } | null;
};

const KEY = "akwa:cart:v1";
const listeners = new Set<() => void>();
const accountListeners = new Set<() => void>();
let cache: CartItem[] | null = null;
const EMPTY: CartItem[] = [];

let accountState: CartAccountStatus = {
  loaded: false,
  authenticated: false,
  user: null,
};
let hydrationPromise: Promise<void> | null = null;

function notifyAccount() {
  accountListeners.forEach((l) => l());
}

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

function pushRemoteCart(items: CartItem[], merge = false) {
  if (typeof window === "undefined" || !accountState.authenticated) return;
  fetch("/api/cart", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ items, merge }),
  }).catch(() => {});
}

function save(items: CartItem[], syncRemote = true) {
  cache = items;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* storage full or disabled: keep in memory */
  }
  listeners.forEach((l) => l());
  if (syncRemote) {
    pushRemoteCart(items, false);
  }
}

async function hydrateFromAccountOnce() {
  if (typeof window === "undefined" || hydrationPromise) return;
  hydrationPromise = (async () => {
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      if (!res.ok) {
        accountState = { loaded: true, authenticated: false, user: null };
        notifyAccount();
        return;
      }
      const data = (await res.json()) as {
        authenticated?: boolean;
        user?: { email: string; name?: string | null } | null;
        items?: CartItem[];
      };

      accountState = {
        loaded: true,
        authenticated: Boolean(data.authenticated),
        user: data.user ?? null,
      };
      notifyAccount();

      if (data.authenticated) {
        const localItems = load();
        const remoteItems = Array.isArray(data.items) ? data.items : [];
        const mergedMap = new Map<string, CartItem>();
        for (const item of remoteItems) {
          mergedMap.set(item.productId, item);
        }
        for (const item of localItems) {
          if (!mergedMap.has(item.productId)) {
            mergedMap.set(item.productId, item);
          }
        }
        const merged = Array.from(mergedMap.values());
        save(merged, false);
        if (localItems.length > 0 && merged.length !== remoteItems.length) {
          pushRemoteCart(merged, true);
        }
      }
    } catch {
      accountState = { loaded: true, authenticated: false, user: null };
      notifyAccount();
    }
  })();
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

function subscribeAccount(cb: () => void) {
  accountListeners.add(cb);
  return () => accountListeners.delete(cb);
}

const SERVER_ACCOUNT_STATE: CartAccountStatus = {
  loaded: false,
  authenticated: false,
  user: null,
};

export function useCart(): CartItem[] {
  useEffect(() => {
    hydrateFromAccountOnce();
  }, []);
  return useSyncExternalStore(subscribe, load, () => EMPTY);
}

export function useCartCount(): number {
  return useCart().length;
}

export function useCartAccountStatus(): CartAccountStatus {
  useEffect(() => {
    hydrateFromAccountOnce();
  }, []);
  return useSyncExternalStore(
    subscribeAccount,
    () => accountState,
    () => SERVER_ACCOUNT_STATE,
  );
}
