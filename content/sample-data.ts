/**
 * SAMPLE DATA. isSample: true.
 *
 * Applied ONLY in development (or when SHOW_SAMPLE_DATA=true) so checkout,
 * product pages and course player can be demonstrated before the owner
 * supplies real details. Everything here is illustrative and must be replaced.
 * Production seeding refuses to apply it.
 */
import type { SeedProduct } from "./products";

export const isSample = true as const;

type Overlay = Partial<SeedProduct>;

export const sampleProductOverlays: Record<string, Overlay> = {
  "basic-electrical-electronics-instrumentation-automation-ebook": {
    priceKes: 1200,
    pages: 120,
    lastUpdatedOn: "2026-10-01",
    outcomes: [
      "Explain voltage, current, resistance and power in simple terms",
      "Read basic circuit diagrams and identify common components",
      "Understand how sensors and instruments measure real-world values",
      "Describe how PLCs and control systems automate processes",
      "Apply a safe, step-by-step approach to electrical troubleshooting",
    ],
    audienceFor: [
      "Students starting electrical or electronics courses",
      "Technicians who want a clear refresher",
      "Curious beginners who want to understand how things work",
    ],
    audienceNotFor: [
      "Experienced engineers looking for advanced design theory",
      "Anyone looking for a licence or certification course",
    ],
    toc: [
      { title: "Part 1: Electrical basics", items: ["Voltage, current and resistance", "Power and energy", "Electrical safety"] },
      { title: "Part 2: Electronics", items: ["Passive components", "Semiconductors", "Simple circuits"] },
      { title: "Part 3: Instrumentation", items: ["Sensors and transmitters", "Measuring pressure, flow, level and temperature"] },
      { title: "Part 4: Automation", items: ["Control loops", "PLC fundamentals", "Troubleshooting"] },
    ],
    changelog: [{ date: "2026-10-01", note: "Sample entry: first edition." }],
  },
  "psychology-clinic-health-tips-for-long-life-ebook": {
    priceKes: 800,
    pages: 80,
    lastUpdatedOn: "2026-09-15",
    outcomes: [
      "Understand basic psychology ideas that affect daily life",
      "Build simple habits that support emotional wellbeing",
      "Recognise when to seek professional help",
    ],
    audienceFor: ["Anyone interested in mental and physical wellbeing", "Beginners in psychology"],
    audienceNotFor: ["People looking for a medical diagnosis or treatment plan"],
    toc: [
      { title: "Understanding the mind" },
      { title: "Emotional wellbeing" },
      { title: "Healthy lifestyle habits" },
      { title: "Personal development" },
    ],
  },
  "the-secrets-of-genuine-money-ebook": {
    priceKes: 1000,
    pages: 96,
    lastUpdatedOn: "2026-08-20",
    outcomes: [
      "Explain how money developed from barter to digital money",
      "Understand what gives money its value",
      "Use simple money-management principles",
      "Think clearly about the future of money",
    ],
    audienceFor: ["Beginners who want to understand money", "Anyone building financial literacy"],
    audienceNotFor: ["Readers looking for trading signals or profit promises"],
    toc: [
      { title: "The history of money" },
      { title: "Understanding money today" },
      { title: "Money management" },
      { title: "Understanding wealth" },
      { title: "The future of money" },
    ],
  },
  "cryptocurrency-for-beginners": {
    priceKes: 1500,
    pages: 110,
    lastUpdatedOn: "2026-10-10",
    outcomes: [
      "Explain what cryptocurrency and blockchain are",
      "Set up and secure a wallet, and protect your recovery phrase",
      "Understand how exchanges and P2P trading work",
      "Spot common scams and avoid them",
    ],
    audienceFor: ["Complete beginners", "People who want to understand crypto before using it"],
    audienceNotFor: ["Anyone looking for guaranteed profits or trading signals"],
    toc: [
      { title: "What is cryptocurrency?" },
      { title: "How blockchain works" },
      { title: "Wallets and security", items: ["Custodial vs non-custodial", "Recovery phrase safety"] },
      { title: "Exchanges and P2P" },
      { title: "Stablecoins" },
      { title: "Staying safe" },
    ],
  },
  "cryptocurrency-blockchain-training": {
    priceKes: 4500,
    outcomes: [
      "Understand crypto and blockchain fundamentals",
      "Use wallets safely",
      "Understand fundamental and technical analysis basics",
    ],
  },
  "consulting-session": {
    priceKes: 3000,
  },
};

/** A sample bundle demonstrating transparent savings (Phase 6). */
export const sampleBundle: SeedProduct = {
  slug: "crypto-starter-bundle",
  type: "bundle",
  categorySlug: "crypto",
  title: "Crypto Starter Bundle",
  subtitle: "Cryptocurrency for Beginners plus The Secrets of Genuine Money.",
  description:
    "Sample bundle. Shows how bundles display transparent savings. The owner decides real bundles and prices.",
  level: "beginner",
  priceKes: 2200,
  status: "published",
  formats: ["PDF"],
  isSample: true,
  popularity: 5,
};

export const sampleBundleItems = ["cryptocurrency-for-beginners", "the-secrets-of-genuine-money-ebook"];

/** Sample curriculum for the training course. */
export const sampleCurriculum = [
  {
    title: "Module 1: Foundations",
    lessons: [
      { slug: "welcome", title: "Welcome and how to use this course", durationSec: 240, isPreview: true },
      { slug: "what-is-crypto", title: "What is cryptocurrency?", durationSec: 600, isPreview: true },
      { slug: "what-is-blockchain", title: "What is blockchain?", durationSec: 720 },
    ],
  },
  {
    title: "Module 2: Wallets and security",
    lessons: [
      { slug: "wallet-types", title: "Types of wallets", durationSec: 660 },
      { slug: "recovery-phrase", title: "Protecting your recovery phrase", durationSec: 540 },
    ],
  },
  {
    title: "Module 3: Using crypto safely",
    lessons: [
      { slug: "exchanges-p2p", title: "Exchanges and P2P basics", durationSec: 780 },
      { slug: "stablecoins", title: "Stablecoins explained", durationSec: 480 },
      { slug: "analysis-intro", title: "Introduction to analysis", durationSec: 900 },
    ],
  },
];

export const sampleCoupon = { code: "SAMPLE10", type: "percent" as const, value: 10 };
