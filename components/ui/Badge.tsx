import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Level = "beginner" | "intermediate" | "advanced";

const levelLabel: Record<Level, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "green" | "gold" | "outline-gold" | "sale" | "info";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs leading-5 font-semibold whitespace-nowrap",
        tone === "neutral" && "bg-surface-2 text-muted border-line border",
        tone === "green" && "bg-tint text-link",
        tone === "gold" && "bg-tint-gold text-gold-text",
        tone === "outline-gold" && "border-gold-500 text-gold-text border",
        tone === "sale" && "bg-danger text-white",
        tone === "info" && "bg-info text-white",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function LevelBadge({ level }: { level: Level }) {
  const bars = level === "beginner" ? 1 : level === "intermediate" ? 2 : 3;
  return (
    <Badge tone="neutral">
      <span className="flex items-end gap-0.5" aria-hidden>
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn("w-1 rounded-sm", i <= bars ? "bg-link" : "bg-line")}
            style={{ height: 4 + i * 3 }}
          />
        ))}
      </span>
      {levelLabel[level]}
    </Badge>
  );
}

export function FormatBadge({ format }: { format: string }) {
  return <Badge tone="green">{format}</Badge>;
}

export function SampleBadge() {
  return (
    <Badge tone="info" className="uppercase">
      Sample data
    </Badge>
  );
}

export const typeLabel: Record<string, string> = {
  ebook: "eBook",
  course: "Course",
  tutorial: "Tutorial",
  service: "Service",
  bundle: "Bundle",
};
