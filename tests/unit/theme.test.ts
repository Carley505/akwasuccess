import { describe, expect, it } from "vitest";
import {
  nextThemePreference,
  parseThemePreference,
  resolveTheme,
  THEME_INIT_SCRIPT,
} from "@/lib/theme";

describe("Theme preference & resolution", () => {
  it("parses valid preferences and defaults invalid values to light", () => {
    expect(parseThemePreference("light")).toBe("light");
    expect(parseThemePreference("dark")).toBe("dark");
    expect(parseThemePreference("system")).toBe("system");
    expect(parseThemePreference(null)).toBe("light");
    expect(parseThemePreference("solarized")).toBe("light");
  });

  it("resolves light, dark, and system against OS prefers-color-scheme", () => {
    expect(resolveTheme("light", false)).toBe("light");
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
    expect(resolveTheme("dark", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme("system", true)).toBe("dark");
  });

  it("cycles preferences predictably: system -> light -> dark -> system", () => {
    expect(nextThemePreference("system")).toBe("light");
    expect(nextThemePreference("light")).toBe("dark");
    expect(nextThemePreference("dark")).toBe("system");
  });

  it("provides a synchronous FOUC-prevention script", () => {
    expect(THEME_INIT_SCRIPT).toContain("data-theme");
    expect(THEME_INIT_SCRIPT).toContain("prefers-color-scheme: dark");
  });
});
