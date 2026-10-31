"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Accessible modal or slide-over drawer built on Radix Dialog (focus trap,
 * Escape to close, focus restoration, ARIA attributes).
 */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  variant = "center",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  variant?: "center" | "drawer-left" | "drawer-right" | "sheet-bottom";
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px]" />
        <Dialog.Content
          className={cn(
            "bg-surface text-fg border-line fixed z-50 flex flex-col focus:outline-none",
            variant === "center" &&
              "top-1/2 left-1/2 max-h-[90dvh] w-[min(92vw,560px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border p-6 shadow-[var(--shadow-soft)]",
            variant === "drawer-left" &&
              "inset-y-0 left-0 h-dvh w-[min(88vw,360px)] overflow-y-auto border-r p-5",
            variant === "drawer-right" &&
              "inset-y-0 right-0 h-dvh w-[min(92vw,400px)] overflow-y-auto border-l p-5",
            variant === "sheet-bottom" &&
              "inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-xl border-t p-5",
          )}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <Dialog.Title className="font-serif text-xl font-bold">{title}</Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close"
                className="text-muted hover:text-fg hover:bg-surface-2 grid size-11 place-items-center rounded-md"
              >
                <X className="size-5" aria-hidden />
              </button>
            </Dialog.Close>
          </div>
          {description ? (
            <Dialog.Description className="text-muted mb-4 text-sm">{description}</Dialog.Description>
          ) : (
            <Dialog.Description className="sr-only">{title}</Dialog.Description>
          )}
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
