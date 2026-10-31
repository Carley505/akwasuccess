"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import type { LearningPath as LearningPathType } from "@/content/paths";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "akwa:path-progress:v1";

function loadCompleted(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function saveCompleted(ids: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

/**
 * Learning path stepper (Section 2.3 & 7).
 * Horizontal stepper on desktop (`lg+`), vertical timeline on mobile.
 * Supports toggling step completion when `interactive` is true.
 */
export function LearningPath({
  path,
  interactive = false,
  compact = false,
}: {
  path: LearningPathType;
  interactive?: boolean;
  compact?: boolean;
}) {
  const [completed, setCompleted] = useState<string[]>(() => loadCompleted());

  function toggle(stepId: string) {
    const next = completed.includes(stepId)
      ? completed.filter((id) => id !== stepId)
      : [...completed, stepId];
    setCompleted(next);
    saveCompleted(next);
    fetch("/api/progress", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ itemId: stepId, kind: "path", completed: next.includes(stepId) }),
    }).catch(() => {});
  }

  const doneCount = path.steps.filter((s) => completed.includes(s.id)).length;

  return (
    <div className="card p-5 md:p-6">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 className="text-xl font-bold">{path.title}</h3>
          <p className="text-muted mt-1 text-sm">{path.intro}</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {doneCount > 0 && (
            <span className="bg-tint text-link rounded-full px-3 py-1 font-semibold">
              {doneCount} / {path.steps.length} done
            </span>
          )}
          {compact && (
            <Link
              href={`/learn/paths/${path.slug}`}
              className="text-link inline-flex items-center gap-1 font-semibold underline-offset-2 hover:underline"
            >
              Open full path <ArrowRight className="size-4" aria-hidden />
            </Link>
          )}
        </div>
      </div>

      <ol
        className={cn(
          "relative grid gap-4",
          compact
            ? "lg:grid-cols-4 xl:grid-cols-8"
            : "md:grid-cols-2 lg:grid-cols-4",
        )}
      >
        {path.steps.map((step, idx) => {
          const isDone = completed.includes(step.id);
          return (
            <li
              key={step.id}
              className="border-line bg-surface-2 relative flex flex-col justify-between gap-2 rounded-lg border p-3.5"
            >
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "inline-flex size-7 items-center justify-center rounded-full text-xs font-bold",
                      isDone
                        ? "bg-primary text-primary-fg"
                        : "border-gold-500 bg-surface text-fg border-2",
                    )}
                  >
                    {isDone ? <Check className="size-4" aria-hidden /> : idx + 1}
                  </span>
                  {interactive && (
                    <button
                      type="button"
                      onClick={() => toggle(step.id)}
                      className="text-link min-h-9 rounded px-2 text-xs font-semibold underline-offset-2 hover:underline"
                    >
                      {isDone ? "Completed" : "Mark done"}
                    </button>
                  )}
                </div>

                <Link
                  href={step.href}
                  className="hover:text-link block font-semibold no-underline"
                >
                  {step.title}
                </Link>
                {!compact && (
                  <p className="text-muted mt-1 text-xs leading-relaxed">{step.summary}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
