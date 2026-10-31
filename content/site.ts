/**
 * Site-wide settings. The owner can edit these values (or override them from
 * /admin/settings once Phase 5 is live). Values marked TODO are placeholders.
 */
export const site = {
  name: "Akwasuccess",
  tagline: "Learn, Build, Understand & Grow",
  supportingLine: "Practical knowledge on finance, the digital economy, and technology.",
  description:
    "eBooks, courses, tutorials and consulting on cryptocurrency, financial education, technical skills and personal wellbeing. Pay with M-Pesa or card.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "en-KE",
  currency: "KES",
  /** Fixed KES per 1 USD used for the optional USD display. TODO: owner to confirm. */
  usdRate: Number(process.env.NEXT_PUBLIC_USD_RATE ?? 129),
  location: "Nairobi, Kenya",
  // TODO: owner to supply real contact details (see TODO_OWNER.md).
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@akwasuccess.com",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "254700000000",
  workingHours: "Monday to Saturday, 8:00 am to 6:00 pm (EAT)",
  responseTime: "We usually reply within one working day.",
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

export const isSampleDataVisible =
  process.env.NODE_ENV !== "production" || process.env.SHOW_SAMPLE_DATA === "true";
