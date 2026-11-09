export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "akwa:theme";

export function parseThemePreference(raw: string | null | undefined): ThemePreference {
  return raw === "light" || raw === "dark" || raw === "system" ? raw : "light";
}

export function resolveTheme(pref: ThemePreference, systemDark: boolean): ResolvedTheme {
  if (pref === "light") return "light";
  if (pref === "dark") return "dark";
  return systemDark ? "dark" : "light";
}

export function nextThemePreference(current: ThemePreference): ThemePreference {
  if (current === "system") return "light";
  if (current === "light") return "dark";
  return "system";
}

/**
 * Blocking inline script injected into `<head>` to resolve and apply
 * `data-theme="light|dark"` before first paint, preventing any flash of
 * unstyled/wrong-theme content (FOUC). Defaults to "light".
 */
export const THEME_INIT_SCRIPT = `(function(){try{var k="${THEME_STORAGE_KEY}",p="light";try{var s=localStorage.getItem(k);if(s==="light"||s==="dark"||s==="system")p=s;}catch(e){}var m=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches;var r=p==="light"?"light":p==="dark"?"dark":(m?"dark":"light");var d=document.documentElement;d.setAttribute("data-theme",r);d.setAttribute("data-theme-pref",p);d.style.colorScheme=r;}catch(e){}})();`;
