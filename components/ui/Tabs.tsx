"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type TabItem = {
  id: string;
  label: string;
  content: ReactNode;
};

/**
 * Accessible tabs with arrow-key navigation on desktop and stacked sections
 * with anchor navigation on mobile (spec 8.3).
 */
export function Tabs({
  items,
  defaultId,
  stackOnMobile = false,
  ariaLabel = "Content sections",
}: {
  items: TabItem[];
  defaultId?: string;
  stackOnMobile?: boolean;
  ariaLabel?: string;
}) {
  const [active, setActive] = useState(defaultId ?? items[0]?.id ?? "");

  if (stackOnMobile) {
    return (
      <div className="max-w-full min-w-0">
        {/* Anchor jump bar on mobile */}
        <nav
          aria-label={ariaLabel}
          className="border-line mb-6 flex max-w-full gap-2 overflow-x-auto border-b pb-2 lg:hidden"
        >
          {items.map((item) => (
            <a
              key={item.id}
              href={`#section-${item.id}`}
              className="bg-surface-2 text-fg hover:text-link inline-flex min-h-11 shrink-0 items-center rounded-full px-4 text-sm font-semibold no-underline"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Desktop tablist */}
        <div
          role="tablist"
          aria-label={ariaLabel}
          className="border-line mb-6 hidden flex-wrap gap-2 border-b lg:flex"
        >
          {items.map((item, idx) => {
            const selected = item.id === active;
            return (
              <button
                key={item.id}
                role="tab"
                id={`tab-${item.id}`}
                aria-selected={selected}
                aria-controls={`panel-${item.id}`}
                tabIndex={selected ? 0 : -1}
                type="button"
                onClick={() => setActive(item.id)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                    e.preventDefault();
                    const dir = e.key === "ArrowRight" ? 1 : -1;
                    const next = items[(idx + dir + items.length) % items.length];
                    if (next) {
                      setActive(next.id);
                      document.getElementById(`tab-${next.id}`)?.focus();
                    }
                  }
                }}
                className={cn(
                  "-mb-px min-h-12 border-b-2 px-4 font-semibold transition-colors",
                  selected
                    ? "border-gold-500 text-link"
                    : "text-muted hover:text-fg border-transparent",
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Panels: all visible on mobile, active visible on desktop */}
        <div className="space-y-10 lg:space-y-0">
          {items.map((item) => {
            const selected = item.id === active;
            return (
              <section
                key={item.id}
                id={`section-${item.id}`}
                role="tabpanel"
                aria-labelledby={`tab-${item.id}`}
                className={cn(!selected && "lg:hidden")}
              >
                {item.content}
              </section>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full min-w-0">
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="border-line mb-6 flex max-w-full flex-wrap gap-1 border-b sm:gap-2"
      >
        {items.map((item) => {
          const selected = item.id === active;
          return (
            <button
              key={item.id}
              role="tab"
              id={`tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`panel-${item.id}`}
              type="button"
              onClick={() => setActive(item.id)}
              className={cn(
                "-mb-px min-h-12 border-b-2 px-4 font-semibold",
                selected
                  ? "border-gold-500 text-link"
                  : "text-muted hover:text-fg border-transparent",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {items.map((item) =>
        item.id === active ? (
          <div key={item.id} id={`panel-${item.id}`} role="tabpanel" aria-labelledby={`tab-${item.id}`}>
            {item.content}
          </div>
        ) : null,
      )}
    </div>
  );
}
