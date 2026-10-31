import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Accessible, zero-JavaScript accordion built on <details>/<summary>.
 * Works with touch, keyboard and screen readers, and with JS disabled.
 */
export function Accordion({
  items,
  className,
  defaultOpen,
}: {
  items: { id?: string; title: ReactNode; content: ReactNode }[];
  className?: string;
  defaultOpen?: number;
}) {
  return (
    <div className={cn("divide-line border-line divide-y rounded-lg border bg-raised", className)}>
      {items.map((item, i) => (
        <details key={item.id ?? i} id={item.id} open={defaultOpen === i} className="group">
          <summary className="flex min-h-14 items-center justify-between gap-4 px-4 py-3 font-semibold md:px-5">
            <span>{item.title}</span>
            <ChevronDown
              className="chevron text-link size-5 shrink-0 transition-transform duration-200"
              aria-hidden
            />
          </summary>
          <div className="text-muted px-4 pb-5 md:px-5">{item.content}</div>
        </details>
      ))}
    </div>
  );
}
