/**
 * Site-wide settings. The owner can edit these values (or override them from
 * /admin/settings once Phase 5 is live). Values marked TODO are placeholders.
 */
export const site = {
  name: "Akwasuccess",
  tagline: "Learn, Build, Understand & Grow",
  supportingLine: "Practical knowledge on finance, the digital economy, and technology.",
  description:
    "eBooks, courses, tutorials and consulting on cryptocurrency, financial education, technical skills and personal wellbeing. Learn from anywhere in the world, pay securely by card in US dollars.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "en",
  /** All prices are stored and charged in US dollars (integer cents). */
  currency: "USD",
  location: "Online, serving learners worldwide",
  email: (process.env.NEXT_PUBLIC_CONTACT_EMAIL || "akwasuccess2026@gmail.com").trim(),
  /** International format, digits only (no "+"). Empty hides the WhatsApp button. */
  whatsapp: (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "2347035714013").replace(/[^0-9]/g, ""),
  workingHours: "Monday to Friday, 08:00 to 17:00 UTC",
  responseTime: "We usually reply within one working day, wherever you are.",
  socials: [
    // TODO: owner to supply real profile links. Empty hrefs are hidden.
    { name: "Facebook", href: "" },
    { name: "X (Twitter)", href: "" },
    { name: "YouTube", href: "" },
    { name: "LinkedIn", href: "" },
    { name: "TikTok", href: "" },
  ],
  /** Shown in a slim bar above the header when non-empty. */
  announcement: "",
} as const;

export const disclaimers = {
  crypto:
    "Educational notice: Cryptocurrency and digital assets involve significant risks. Information provided by Akwasuccess is educational and is not a guarantee of profit or personalised, regulated investment advice.",
  health:
    "This content is for education and awareness only. It is not a substitute for professional medical diagnosis or treatment.",
  shortCrypto: "Not financial advice. Educational content only.",
} as const;

export function whatsappLink(message?: string) {
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${site.whatsapp}${text}`;
}

export const isSampleDataVisible = process.env.SHOW_SAMPLE_DATA !== "false";
