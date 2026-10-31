"use client";

import { useSyncExternalStore } from "react";
import { CheckCircle2, Info, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastMessage = {
  id: string;
  title: string;
  tone?: "success" | "error" | "info";
};

let toasts: ToastMessage[] = [];
const EMPTY_TOASTS: ToastMessage[] = [];
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export function showToast(title: string, tone: ToastMessage["tone"] = "success") {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  toasts = [...toasts, { id, title, tone }];
  notify();
  if (typeof window !== "undefined") {
    window.setTimeout(() => dismissToast(id), 4000);
  }
}

export function dismissToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  notify();
}

export function ToastRegion() {
  const items = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => toasts,
    () => EMPTY_TOASTS,
  );
  if (items.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed right-4 bottom-20 z-50 flex max-w-sm flex-col gap-2 sm:bottom-6"
    >
      {items.map((item) => {
        const Icon =
          item.tone === "error" ? AlertCircle : item.tone === "info" ? Info : CheckCircle2;
        return (
          <div
            key={item.id}
            role="status"
            className={cn(
              "card pointer-events-auto flex items-center gap-3 px-4 py-3 shadow-[var(--shadow-soft)]",
              item.tone === "error" && "border-danger",
            )}
          >
            <Icon
              className={cn(
                "size-5 shrink-0",
                item.tone === "error" ? "text-danger" : "text-link",
              )}
              aria-hidden
            />
            <span className="text-sm font-medium">{item.title}</span>
            <button
              type="button"
              onClick={() => dismissToast(item.id)}
              className="text-muted hover:text-fg ml-auto grid size-8 place-items-center rounded"
              aria-label="Dismiss notification"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        );
      })}
    </div>
  );
}
