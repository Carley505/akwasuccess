"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import {
  nextThemePreference,
  parseThemePreference,
  resolveTheme,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemePreference,
} from "@/lib/theme";
import { cn } from "@/lib/utils";

const listeners = new Set<() => void>();
let mediaBound = false;
let transitionTimer: number | undefined;

function getSystemDark(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function readPreference(): ThemePreference {
  if (typeof window === "undefined") return "light";
  try {
    return parseThemePreference(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return "light";
  }
}

function applyThemeToDom(pref: ThemePreference, withTransition = false) {
  if (typeof document === "undefined") return;
  const resolved: ResolvedTheme = resolveTheme(pref, getSystemDark());
  const root = document.documentElement;

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (withTransition && !prefersReducedMotion) {
    root.setAttribute("data-theme-transition", "");
    if (transitionTimer) window.clearTimeout(transitionTimer);
    transitionTimer = window.setTimeout(() => {
      root.removeAttribute("data-theme-transition");
    }, 180);
  }

  root.setAttribute("data-theme", resolved);
  root.setAttribute("data-theme-pref", pref);
  root.style.colorScheme = resolved;

  // Update mobile browser chrome color to match active theme
  const metaTheme = document.querySelector('meta[name="theme-color"]:not([media])');
  const color = resolved === "dark" ? "#08472A" : "#0B6B3A";
  if (metaTheme) {
    metaTheme.setAttribute("content", color);
  }
}

function ensureGlobalListeners() {
  if (mediaBound || typeof window === "undefined") return;
  mediaBound = true;

  if (typeof window.matchMedia === "function") {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onMediaChange = () => {
      applyThemeToDom(readPreference(), false);
      listeners.forEach((l) => l());
    };
    mq.addEventListener?.("change", onMediaChange);
  }

  window.addEventListener("storage", (e) => {
    if (e.key === THEME_STORAGE_KEY) {
      applyThemeToDom(readPreference(), false);
      listeners.forEach((l) => l());
    }
  });
}

function subscribe(cb: () => void) {
  ensureGlobalListeners();
  if (listeners.size === 0) {
    applyThemeToDom(readPreference(), false);
  }
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function setThemePreference(pref: ThemePreference) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, pref);
  } catch {
    /* ignore storage errors in private browsing */
  }
  applyThemeToDom(pref, true);
  listeners.forEach((l) => l());
}

export function useTheme() {
  const preference = useSyncExternalStore<ThemePreference>(
    subscribe,
    readPreference,
    () => "light",
  );
  const resolved = useSyncExternalStore<ResolvedTheme>(
    subscribe,
    () => resolveTheme(readPreference(), getSystemDark()),
    () => "light",
  );

  return {
    preference,
    resolved,
    setTheme: setThemePreference,
    cycleTheme: () => setThemePreference(nextThemePreference(preference)),
  };
}

const OPTIONS: {
  value: ThemePreference;
  label: string;
  icon: typeof Sun;
}[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

/**
 * Accessible theme switcher supporting Light, Dark, and System modes.
 * - `variant="cycle"`: compact 44x44px icon button for the top header bar.
 * - `variant="segmented"`: 3-way radiogroup pill for the mobile drawer and footer.
 */
export function ThemeToggle({
  variant = "cycle",
  tone = "default",
  className,
}: {
  variant?: "cycle" | "segmented";
  tone?: "default" | "on-dark";
  className?: string;
}) {
  const { preference, resolved, setTheme, cycleTheme } = useTheme();

  if (variant === "cycle") {
    const next = nextThemePreference(preference);
    const currentLabel =
      preference === "system" ? `System (${resolved})` : preference === "dark" ? "Dark" : "Light";
    const nextLabel = next === "system" ? "System" : next === "dark" ? "Dark" : "Light";
    const Icon = preference === "system" ? Monitor : resolved === "dark" ? Moon : Sun;

    return (
      <button
        type="button"
        onClick={cycleTheme}
        aria-label={`Color theme: ${currentLabel}. Activate to switch to ${nextLabel} theme.`}
        title={`Theme: ${currentLabel} (click for ${nextLabel})`}
        className={cn(
          "inline-flex size-10 items-center justify-center rounded-md transition-colors sm:size-11",
          tone === "on-dark"
            ? "text-white/90 hover:bg-white/10 hover:text-white"
            : "text-fg hover:text-link hover:bg-surface-2",
          className,
        )}
      >
        <Icon className="size-5" strokeWidth={1.75} aria-hidden />
        <span className="sr-only">Current theme: {currentLabel}</span>
      </button>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Color theme"
      className={cn(
        "inline-flex items-center rounded-lg border p-1 text-xs font-semibold",
        tone === "on-dark"
          ? "border-white/20 bg-black/25 text-white"
          : "border-line bg-surface-2 text-fg",
        className,
      )}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = preference === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(value)}
            className={cn(
              "inline-flex min-h-9 items-center gap-1.5 rounded-md px-2.5 py-1.5 transition-colors",
              tone === "on-dark"
                ? active
                  ? "bg-white text-green-900 shadow-xs"
                  : "text-white/80 hover:text-white"
                : active
                  ? "bg-primary text-primary-fg shadow-xs"
                  : "text-muted hover:text-fg",
            )}
          >
            <Icon className="size-3.5" strokeWidth={1.75} aria-hidden />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
