// WCAG contrast audit for the light/dark token pairs in app/globals.css.
// Run: node scripts/check-contrast.mjs   (exits 1 if any pair misses its target)
const lum = (hex) => {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
// Alpha-composite fg (with alpha) over bg.
const mix = (fg, a, bg) => {
  const c = (i) =>
    Math.round(parseInt(fg.slice(i, i + 2), 16) * a + parseInt(bg.slice(i, i + 2), 16) * (1 - a));
  return `#${[1, 3, 5].map((i) => c(i).toString(16).padStart(2, "0")).join("")}`;
};

const themes = {
  light: {
    surface: "#ffffff", surface2: "#faf8f3", raised: "#ffffff", text: "#14231b", muted: "#4a5a52",
    border: "#c9d3cd", borderStrong: "#6b7b73", link: "#0b6b3a", primary: "#0b6b3a", primaryFg: "#ffffff",
    tint: "#e6f3eb", tintGold: "#fbf3d9", goldText: "#8a6a0a", danger: "#b42318", dangerSolid: "#b42318",
    success: "#0b6b3a", star: "#9a7209", warning: "#8a5a0b", info: "#175cd3", infoSolid: "#175cd3", focus: "#0b6b3a",
  },
  dark: {
    surface: "#0d1a13", surface2: "#11231a", raised: "#152a1f", text: "#e8efea", muted: "#a9b8af",
    border: "#2c4136", borderStrong: "#6f8a7b", link: "#3fb57a", primary: "#0f8247", primaryFg: "#ffffff",
    tint: "#163626", tintGold: "#2e2710", goldText: "#e3b94a", danger: "#f97066", dangerSolid: "#b42318",
    success: "#3fb57a", star: "#d4a017", warning: "#e3b94a", info: "#7cb0ff", infoSolid: "#175cd3", focus: "#3fb57a",
  },
};

let failed = 0;
const check = (theme, label, fg, bg, min) => {
  const r = ratio(fg, bg);
  const ok = r >= min;
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"} ${theme.padEnd(5)} ${label.padEnd(44)} ${r.toFixed(2)} (min ${min})`);
};

for (const [name, t] of Object.entries(themes)) {
  check(name, "text / surface", t.text, t.surface, 4.5);
  check(name, "text / surface-2", t.text, t.surface2, 4.5);
  check(name, "text / raised", t.text, t.raised, 4.5);
  check(name, "muted / surface", t.muted, t.surface, 4.5);
  check(name, "muted / surface-2", t.muted, t.surface2, 4.5);
  check(name, "muted / raised", t.muted, t.raised, 4.5);
  check(name, "placeholder (muted 90%) / surface", mix(t.muted, 0.9, t.surface), t.surface, 4.5);
  check(name, "link / surface", t.link, t.surface, 4.5);
  check(name, "link / surface-2", t.link, t.surface2, 4.5);
  check(name, "link / tint (badges, active rows)", t.link, t.tint, 4.5);
  check(name, "primary-fg / primary (button)", t.primaryFg, t.primary, 4.5);
  check(name, "gold-text / tint-gold (gold badge)", t.goldText, t.tintGold, 4.5);
  check(name, "gold-text / surface", t.goldText, t.surface, 4.5);
  check(name, "text / tint-gold (disclaimer)", t.text, t.tintGold, 4.5);
  check(name, "danger text / surface", t.danger, t.surface, 4.5);
  check(name, "danger text / raised", t.danger, t.raised, 4.5);
  check(name, "white / danger-solid (sale badge)", "#ffffff", t.dangerSolid, 4.5);
  check(name, "white / info-solid (info badge)", "#ffffff", t.infoSolid, 4.5);
  check(name, "success / surface", t.success, t.surface, 4.5);
  check(name, "warning / surface", t.warning, t.surface, 4.5);
  check(name, "info / surface", t.info, t.surface, 4.5);
  check(name, "UI: border-strong / surface (inputs)", t.borderStrong, t.surface, 3);
  check(name, "UI: focus ring / surface", t.focus, t.surface, 3);
  check(name, "UI: focus ring / raised", t.focus, t.raised, 3);
  check(name, "UI: star (rating icon) / surface", t.star, t.surface, 3);
  check(name, "UI: primary (button, border) / surface", t.primary, t.surface, 3);
}

// Always-dark brand surfaces (footer, hero band, book covers, course player).
const green900 = "#08472a";
check("both", "white / green-900", "#ffffff", green900, 4.5);
check("both", "white 75% / green-900 (footer small text)", mix("#ffffff", 0.75, green900), green900, 4.5);
check("both", "gold-500 / green-900 (icons)", "#d4a017", green900, 3);
check("both", "on-dark focus (#f2cf6b) / green-900", "#f2cf6b", green900, 3);
check("both", "white / green-600 (button hover)", "#ffffff", "#0f8247", 4.5);

process.exit(failed ? 1 : 0);
