/**
 * Rich display metadata (outcomes, TOCs, audience, sample bundle, and course curriculum)
 * for the initial mockup catalog. The owner can update or replace any product in `/admin`.
 */
import type { SeedProduct } from "./products";

export const isSample = true as const;

type Overlay = Partial<SeedProduct>;

export const sampleProductOverlays: Record<string, Overlay> = {
  "basic-electrical-electronics-instrumentation-automation-ebook": {
    priceCents: 1200,
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
      {
        title: "Part 1: Electrical basics",
        items: ["Voltage, current and resistance", "Power and energy", "Electrical safety"],
      },
      {
        title: "Part 2: Electronics",
        items: ["Passive components", "Semiconductors", "Simple circuits"],
      },
      {
        title: "Part 3: Instrumentation",
        items: [
          "Sensors and transmitters",
          "Measuring pressure, flow, level and temperature",
        ],
      },
      {
        title: "Part 4: Automation",
        items: ["Control loops", "PLC fundamentals", "Troubleshooting"],
      },
    ],
    changelog: [{ date: "2026-10-01", note: "First edition." }],
  },
  "plc-programming-industrial-control-systems-guide": {
    priceCents: 1600,
    pages: 136,
    lastUpdatedOn: "2026-10-12",
    outcomes: [
      "Understand PLC architecture, scan cycles, and digital/analog I/O modules",
      "Read and write foundational ladder logic (NO/NC contacts, coils, timers, counters)",
      "Wire relays, contactors, overload protection, and VFD start/stop signals safely",
      "Diagnose common control panel faults systematically",
    ],
    audienceFor: [
      "Electrical technicians moving into industrial automation",
      "Engineering students learning PLC and control panel fundamentals",
    ],
    audienceNotFor: ["Advanced motion-control or distributed DCS system architects"],
    toc: [
      { title: "Chapter 1: Inside the Industrial Control Panel" },
      { title: "Chapter 2: Digital & Analog Inputs and Outputs" },
      { title: "Chapter 3: Ladder Logic Essentials (Timers, Counters & Interlocks)" },
      { title: "Chapter 4: Motor Starters, Contactors & VFD Integration" },
    ],
  },
  "practical-electrical-troubleshooting-instrumentation-tutorial": {
    priceCents: 1900,
    pages: 64,
    lastUpdatedOn: "2026-10-18",
    outcomes: [
      "Perform safe lock-out/tag-out (LOTO) and dead-circuit verification",
      "Use a multimeter to trace open circuits, short circuits, and earth faults",
      "Test and loop-check 4–20 mA pressure, temperature, and level transmitters",
    ],
    audienceFor: [
      "Maintenance electricians and instrumentation apprentices",
      "Facility technicians troubleshooting field wiring and sensors",
    ],
    audienceNotFor: ["Untrained DIYers attempting high-voltage live work"],
    toc: [
      { title: "Module 1: Safe Isolation & Multimeter Mastery" },
      { title: "Module 2: Tracing Power & Control Circuit Faults" },
      { title: "Module 3: 4–20 mA Current Loops & Sensor Diagnostics" },
    ],
  },
  "psychology-clinic-health-tips-for-long-life-ebook": {
    priceCents: 800,
    pages: 80,
    lastUpdatedOn: "2026-09-15",
    outcomes: [
      "Understand basic psychology ideas that affect daily life",
      "Build simple habits that support emotional wellbeing",
      "Recognise when to seek professional help",
    ],
    audienceFor: [
      "Anyone interested in mental and physical wellbeing",
      "Beginners in psychology",
    ],
    audienceNotFor: ["People looking for a medical diagnosis or treatment plan"],
    toc: [
      { title: "Understanding the mind" },
      { title: "Emotional wellbeing" },
      { title: "Healthy lifestyle habits" },
      { title: "Personal development" },
    ],
  },
  "stress-resilience-emotional-wellbeing-workbook": {
    priceCents: 1000,
    pages: 92,
    lastUpdatedOn: "2026-10-05",
    outcomes: [
      "Identify early physical and mental signs of chronic stress and overload",
      "Build practical evening wind-down and sleep-hygiene habits",
      "Use structured journaling prompts to process pressure clearly",
    ],
    audienceFor: [
      "Working professionals and students managing busy schedules",
      "Readers looking for practical, non-clinical emotional wellbeing tools",
    ],
    audienceNotFor: ["Anyone requiring acute clinical or psychiatric intervention"],
    toc: [
      { title: "Part 1: How Stress Works in the Body and Mind" },
      { title: "Part 2: Daily Recovery, Sleep & Energy Management" },
      { title: "Part 3: Practical Reflection & Resilience Worksheets" },
    ],
  },
  "habits-focus-personal-development-guide": {
    priceCents: 1100,
    pages: 88,
    lastUpdatedOn: "2026-10-14",
    outcomes: [
      "Design small, repeatable daily habits that compound over months",
      "Protect deep focus in an environment full of digital distractions",
      "Set realistic quarterly learning and career goals without burnout",
    ],
    audienceFor: [
      "Self-learners building technical or financial skills",
      "Anyone seeking calm, structured personal growth",
    ],
    audienceNotFor: ["Readers looking for hype or overnight transformation claims"],
    toc: [
      { title: "Chapter 1: The Cue–Routine–Reward Loop Explained" },
      { title: "Chapter 2: Reclaiming Attention & Deep Focus" },
      { title: "Chapter 3: Sustainable Goal Setting & Weekly Reviews" },
    ],
  },
  "the-secrets-of-genuine-money-ebook": {
    priceCents: 1000,
    pages: 96,
    lastUpdatedOn: "2026-08-20",
    outcomes: [
      "Explain how money developed from barter to digital money",
      "Understand what gives money its value",
      "Use simple money-management principles",
      "Think clearly about the future of money",
    ],
    audienceFor: [
      "Beginners who want to understand money",
      "Anyone building financial literacy",
    ],
    audienceNotFor: ["Readers looking for trading signals or profit promises"],
    toc: [
      { title: "The history of money" },
      { title: "Understanding money today" },
      { title: "Money management" },
      { title: "Understanding wealth" },
      { title: "The future of money" },
    ],
  },
  "personal-budgeting-cashflow-emergency-fund-guide": {
    priceCents: 900,
    pages: 84,
    lastUpdatedOn: "2026-10-08",
    outcomes: [
      "Map your true monthly income, fixed obligations, and variable spending",
      "Eliminate recurring fee leaks and unplanned impulse purchases",
      "Build a dedicated 3-to-6 month emergency buffer step by step",
    ],
    audienceFor: [
      "Individuals and households organizing their monthly finances",
      "Beginners preparing a solid foundation before investing",
    ],
    audienceNotFor: ["Anyone seeking speculative day-trading strategies"],
    toc: [
      { title: "Step 1: Auditing Your Real Monthly Cash Flow" },
      { title: "Step 2: Simple Zero-Friction Budgeting Rules" },
      { title: "Step 3: Building and Protecting Your Emergency Reserve" },
    ],
  },
  "low-risk-wealth-building-financial-literacy-course": {
    priceCents: 2900,
    pages: 72,
    lastUpdatedOn: "2026-10-16",
    outcomes: [
      "Understand how inflation erodes purchasing power and how savers respond",
      "Compare cash equivalents, government bonds, broad index funds, and real assets",
      "Evaluate risk vs. return honestly and spot financial red flags",
    ],
    audienceFor: [
      "Long-term learners who want a calm, structured financial education",
    ],
    audienceNotFor: ["Anyone looking for personalized investment brokerage or fast profits"],
    toc: [
      { title: "Module 1: Purchasing Power, Inflation & Compounding" },
      { title: "Module 2: Understanding Asset Classes & Risk" },
      { title: "Module 3: Long-Term Discipline & Risk Management" },
    ],
  },
  "cryptocurrency-for-beginners": {
    priceCents: 1500,
    pages: 110,
    lastUpdatedOn: "2026-10-10",
    outcomes: [
      "Explain what cryptocurrency and blockchain are",
      "Set up and secure a wallet, and protect your recovery phrase",
      "Understand how exchanges and P2P trading work",
      "Spot common scams and avoid them",
    ],
    audienceFor: [
      "Complete beginners",
      "People who want to understand crypto before using it",
    ],
    audienceNotFor: ["Anyone looking for guaranteed profits or trading signals"],
    toc: [
      { title: "What is cryptocurrency?" },
      { title: "How blockchain works" },
      {
        title: "Wallets and security",
        items: ["Custodial vs non-custodial", "Recovery phrase safety"],
      },
      { title: "Exchanges and P2P" },
      { title: "Stablecoins" },
      { title: "Staying safe" },
    ],
  },
  "crypto-wallet-security-recovery-phrase-guide": {
    priceCents: 1200,
    pages: 78,
    lastUpdatedOn: "2026-10-19",
    outcomes: [
      "Choose between custodial exchange accounts and self-custody software/hardware wallets",
      "Back up a 12- or 24-word recovery phrase offline without cloud or screenshot exposure",
      "Verify networks, contract addresses, and P2P escrow settlement safely",
    ],
    audienceFor: [
      "Anyone holding or planning to hold digital assets",
      "Beginners who want a step-by-step security checklist",
    ],
    audienceNotFor: ["Readers looking for token recommendations or price predictions"],
    toc: [
      { title: "Chapter 1: Private Keys, Public Addresses & Seed Phrases" },
      { title: "Chapter 2: Setting Up & Backing Up Your Wallet Offline" },
      { title: "Chapter 3: Phishing, Fake Support & P2P Escrow Safety" },
    ],
  },
  "cryptocurrency-blockchain-training": {
    priceCents: 4500,
    outcomes: [
      "Understand crypto and blockchain fundamentals",
      "Use wallets safely",
      "Understand fundamental and technical analysis basics",
    ],
  },
  "consulting-session": {
    priceCents: 3000,
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
  priceCents: 2200,
  status: "published",
  cover: {
    url: "/uploads/covers/cryptocurrency-for-beginners-1793491001771.webp",
    alt: "Crypto Starter Bundle cover",
    width: 960,
    height: 1440,
  },
  formats: ["PDF"],
  isSample: true,
  popularity: 5,
};

export const sampleBundleItems = [
  "cryptocurrency-for-beginners",
  "the-secrets-of-genuine-money-ebook",
];

/** Sample curriculum for the training course. */
export const sampleCurriculum = [
  {
    title: "Module 1: Foundations",
    lessons: [
      {
        slug: "welcome",
        title: "Welcome and how to use this course",
        durationSec: 240,
        isPreview: true,
      },
      {
        slug: "what-is-crypto",
        title: "What is cryptocurrency?",
        durationSec: 600,
        isPreview: true,
      },
      { slug: "what-is-blockchain", title: "What is blockchain?", durationSec: 720 },
    ],
  },
  {
    title: "Module 2: Wallets and security",
    lessons: [
      { slug: "wallet-types", title: "Types of wallets", durationSec: 660 },
      {
        slug: "recovery-phrase",
        title: "Protecting your recovery phrase",
        durationSec: 540,
      },
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
