/**
 * The five content pillars. Slugs are used in URLs (/shop/[category]).
 * Icons are Lucide icon names resolved in components/ui/CategoryIcon.tsx.
 */
export type CategorySlug =
  | "crypto"
  | "finance"
  | "technical"
  | "psychology"
  | "marketing"
  | "services";

export type Category = {
  slug: CategorySlug;
  name: string;
  shortName: string;
  description: string;
  topics: string[];
  icon: "coins" | "wallet" | "cpu" | "brain" | "megaphone" | "briefcase";
  disclaimer?: "crypto" | "health";
  /** Where the category card links to. */
  href: string;
};

export const categories: Category[] = [
  {
    slug: "crypto",
    name: "Cryptocurrency & Blockchain",
    shortName: "Crypto",
    description: "Crypto and blockchain fundamentals for beginners, plus training and consulting.",
    topics: [
      "What is cryptocurrency",
      "What is blockchain",
      "Bitcoin & digital assets",
      "Wallets",
      "Wallet security",
      "Recovery phrase security",
      "Exchanges",
      "P2P transactions",
      "Stablecoins",
      "Blockchain technology",
      "Fundamental analysis",
      "Technical analysis",
      "Digital finance",
    ],
    icon: "coins",
    disclaimer: "crypto",
    href: "/shop/crypto",
  },
  {
    slug: "finance",
    name: "Financial Education",
    shortName: "Finance",
    description: "Understand money, build financial literacy and see how the financial system is changing.",
    topics: [
      "History of money",
      "Understanding money",
      "Financial literacy",
      "Money management",
      "Understanding wealth",
      "The future of money",
    ],
    icon: "wallet",
    disclaimer: "crypto",
    href: "/shop/finance",
  },
  {
    slug: "technical",
    name: "Technical Education",
    shortName: "Technical",
    description: "Electrical, electronics, instrumentation and automation, explained step by step.",
    topics: [
      "Basic electrical & electronics",
      "Electrical engineering fundamentals",
      "Electronics for beginners",
      "Instrumentation & control",
      "Industrial automation",
      "PLC & control systems",
      "Sensors & instrumentation",
      "Process control",
      "Electrical troubleshooting",
    ],
    icon: "cpu",
    href: "/shop/technical",
  },
  {
    slug: "psychology",
    name: "Psychology & Health Education",
    shortName: "Psychology & Health",
    description: "Education and awareness for a healthier mind and lifestyle.",
    topics: [
      "Psychology for beginners",
      "Psychology tips",
      "Emotional wellbeing",
      "Healthy lifestyle education",
      "Personal development",
    ],
    icon: "brain",
    disclaimer: "health",
    href: "/shop/psychology",
  },
  {
    slug: "marketing",
    name: "Digital & Social Media Marketing",
    shortName: "Marketing",
    description:
      "Practical social media growth, content strategy, and campaign training for TikTok, Instagram, and Facebook.",
    topics: [
      "TikTok marketing strategy",
      "Instagram brand growth",
      "Facebook organic & paid campaigns",
      "Audience building",
      "Content creation",
      "Social commerce",
    ],
    icon: "megaphone",
    href: "/shop/marketing",
  },
  {
    slug: "services",
    name: "Services & Consulting",
    shortName: "Services",
    description:
      "Crypto and blockchain consulting, investment education, and domestic or industrial electrical installation.",
    topics: [
      "Crypto & blockchain consulting",
      "Investment ideas",
      "Wealth growth",
      "Low-risk investing guidance",
      "Electrical installation (domestic & industrial)",
    ],
    icon: "briefcase",
    href: "/services",
  },
];

export const shopCategories = categories.filter((c) => c.slug !== "services");

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}
