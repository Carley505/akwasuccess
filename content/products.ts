import type { NewProduct } from "@/lib/db/schema";

/**
 * Product catalog seed data.
 *
 * Includes 3 mockup display items for each of the 4 shop categories
 * (Cryptocurrency & Blockchain, Financial Education, Technical Education,
 * Psychology & Health Education) plus the Consulting Session service.
 *
 * The owner can edit, replace, or delete any of these items in `/admin`.
 */
export type SeedProduct = Omit<NewProduct, "id" | "createdAt" | "updatedAt"> & {
  files?: { format: string; fileKey: string; fileName: string }[];
};

export const seedProducts: SeedProduct[] = [
  /* ======================= 1. TECHNICAL EDUCATION (3) ======================= */
  {
    slug: "basic-electrical-electronics-instrumentation-automation-ebook",
    type: "ebook",
    categorySlug: "technical",
    title: "Basic Electrical, Electronics & Instrumentation Automation Technologies",
    subtitle:
      "A beginner-friendly guide to electrical basics, electronics, instrumentation and automation.",
    description:
      "This eBook introduces the building blocks of electrical and electronic systems and shows how instrumentation and automation technologies fit together in real installations. It is written in plain language for students, technicians and curious beginners.",
    level: "beginner",
    priceCents: 1200,
    status: "published",
    featured: true,
    cover: {
      url: "/uploads/covers/basic-electrical-electronics-instrumentation-automation-ebook-1793491861945.webp",
      alt: "Basic Electrical, Electronics & Instrumentation Automation Technologies cover",
      width: 960,
      height: 1440,
    },
    formats: ["PDF"],
    pages: 120,
    sampleFileKey: "samples/basic-electrical-sample.pdf",
    popularity: 40,
    files: [
      {
        format: "PDF",
        fileKey: "products/basic-electrical-electronics.pdf",
        fileName: "Akwasuccess - Basic Electrical, Electronics & Instrumentation.pdf",
      },
    ],
  },
  {
    slug: "plc-programming-industrial-control-systems-guide",
    type: "ebook",
    categorySlug: "technical",
    title: "PLC Fundamentals & Industrial Control Systems Guide",
    subtitle:
      "Understand programmable logic controllers, ladder logic, relays, sensors and motor control panels.",
    description:
      "A practical mockup guide covering how industrial control panels are wired and programmed. Learn how digital and analog inputs/outputs work, how to read ladder logic diagrams, and how contactors, relays, and variable frequency drives (VFDs) interface with a PLC.",
    level: "intermediate",
    priceCents: 1600,
    status: "published",
    featured: false,
    cover: {
      url: "/uploads/covers/basic-electrical-electronics-instrumentation-automation-ebook-1793491861945.webp",
      alt: "PLC Fundamentals & Industrial Control Systems Guide cover",
      width: 960,
      height: 1440,
    },
    formats: ["PDF"],
    pages: 136,
    sampleFileKey: "samples/basic-electrical-sample.pdf",
    popularity: 28,
    files: [
      {
        format: "PDF",
        fileKey: "products/basic-electrical-electronics.pdf",
        fileName: "Akwasuccess - PLC Fundamentals & Control Systems.pdf",
      },
    ],
  },
  {
    slug: "practical-electrical-troubleshooting-instrumentation-tutorial",
    type: "tutorial",
    categorySlug: "technical",
    title: "Practical Electrical Troubleshooting & Process Instrumentation",
    subtitle:
      "Step-by-step fault finding with a multimeter, 4–20 mA sensor loops and safe isolation procedures.",
    description:
      "Learn a systematic, safety-first method for diagnosing tripping breakers, voltage drops, open circuits, and faulty 4–20 mA instrumentation loops in domestic and industrial systems.",
    level: "beginner",
    priceCents: 1900,
    status: "published",
    featured: false,
    cover: {
      url: "/uploads/covers/basic-electrical-electronics-instrumentation-automation-ebook-1793491861945.webp",
      alt: "Practical Electrical Troubleshooting & Process Instrumentation cover",
      width: 960,
      height: 1440,
    },
    formats: ["PDF", "Video"],
    pages: 64,
    sampleFileKey: "samples/basic-electrical-sample.pdf",
    popularity: 22,
    files: [
      {
        format: "PDF",
        fileKey: "products/basic-electrical-electronics.pdf",
        fileName: "Akwasuccess - Practical Electrical Troubleshooting.pdf",
      },
    ],
  },

  /* ==================== 2. PSYCHOLOGY & HEALTH (3) ==================== */
  {
    slug: "psychology-clinic-health-tips-for-long-life-ebook",
    type: "ebook",
    categorySlug: "psychology",
    title: "Psychology Clinic: Health Tips for Long Life",
    subtitle: "Practical psychology and healthy-lifestyle tips for everyday wellbeing.",
    description:
      "An easy-to-read eBook that shares psychology and health education for a longer, more balanced life. It is for education and awareness and does not replace professional medical care.",
    level: "beginner",
    priceCents: 800,
    status: "published",
    featured: true,
    cover: {
      url: "/uploads/covers/psychology-clinic-health-tips-for-long-life-ebook-1793492029880.webp",
      alt: "Psychology Clinic: Health Tips for Long Life cover",
      width: 960,
      height: 1440,
    },
    formats: ["PDF"],
    pages: 80,
    sampleFileKey: "samples/psychology-clinic-sample.pdf",
    popularity: 30,
    files: [
      {
        format: "PDF",
        fileKey: "products/psychology-clinic.pdf",
        fileName: "Akwasuccess - Psychology Clinic.pdf",
      },
    ],
  },
  {
    slug: "stress-resilience-emotional-wellbeing-workbook",
    type: "ebook",
    categorySlug: "psychology",
    title: "Everyday Stress Resilience & Emotional Wellbeing Workbook",
    subtitle:
      "Simple daily practices for mental clarity, healthy rest and managing modern life stress.",
    description:
      "A structured self-reflection workbook that explains how stress affects attention, sleep, and decision-making—and how to build calm, sustainable routines that support long-term emotional balance.",
    level: "beginner",
    priceCents: 1000,
    status: "published",
    featured: false,
    cover: {
      url: "/uploads/covers/psychology-clinic-health-tips-for-long-life-ebook-1793492029880.webp",
      alt: "Everyday Stress Resilience & Emotional Wellbeing Workbook cover",
      width: 960,
      height: 1440,
    },
    formats: ["PDF"],
    pages: 92,
    sampleFileKey: "samples/psychology-clinic-sample.pdf",
    popularity: 24,
    files: [
      {
        format: "PDF",
        fileKey: "products/psychology-clinic.pdf",
        fileName: "Akwasuccess - Stress Resilience & Emotional Wellbeing Workbook.pdf",
      },
    ],
  },
  {
    slug: "habits-focus-personal-development-guide",
    type: "ebook",
    categorySlug: "psychology",
    title: "Mindful Habits, Focus & Personal Growth Guide",
    subtitle:
      "Build consistent study, work and lifestyle habits without burnout or unrealistic pressure.",
    description:
      "Explore the psychology of habit formation, attention management, and steady personal development. Designed for learners and professionals balancing career growth with personal wellbeing.",
    level: "beginner",
    priceCents: 1100,
    status: "published",
    featured: false,
    cover: {
      url: "/uploads/covers/psychology-clinic-health-tips-for-long-life-ebook-1793492029880.webp",
      alt: "Mindful Habits, Focus & Personal Growth Guide cover",
      width: 960,
      height: 1440,
    },
    formats: ["PDF"],
    pages: 88,
    sampleFileKey: "samples/psychology-clinic-sample.pdf",
    popularity: 19,
    files: [
      {
        format: "PDF",
        fileKey: "products/psychology-clinic.pdf",
        fileName: "Akwasuccess - Mindful Habits, Focus & Personal Growth.pdf",
      },
    ],
  },

  /* ====================== 3. FINANCIAL EDUCATION (3) ====================== */
  {
    slug: "the-secrets-of-genuine-money-ebook",
    type: "ebook",
    categorySlug: "finance",
    title: "The Secrets of Genuine Money",
    subtitle: "Understand what money really is, where it came from and where it is going.",
    description:
      "A clear introduction to money: its history, how it works today and how the financial system is changing. Written for beginners who want to make better-informed money decisions.",
    level: "beginner",
    priceCents: 1000,
    status: "published",
    featured: true,
    cover: {
      url: "/uploads/covers/the-secrets-of-genuine-money-ebook-1793491948002.webp",
      alt: "The Secrets of Genuine Money cover",
      width: 960,
      height: 1440,
    },
    formats: ["PDF"],
    pages: 96,
    sampleFileKey: "samples/genuine-money-sample.pdf",
    popularity: 35,
    files: [
      {
        format: "PDF",
        fileKey: "products/secrets-of-genuine-money.pdf",
        fileName: "Akwasuccess - The Secrets of Genuine Money.pdf",
      },
    ],
  },
  {
    slug: "personal-budgeting-cashflow-emergency-fund-guide",
    type: "ebook",
    categorySlug: "finance",
    title: "Personal Budgeting, Cash-Flow & Emergency Fund Blueprint",
    subtitle:
      "Take control of monthly income, stop hidden spending leaks and build a reliable safety buffer.",
    description:
      "A practical, numbers-first guide to organizing personal and household finances. Learn how to track real cash flow, separate needs from impulse spending, and build an emergency reserve before taking on financial risk.",
    level: "beginner",
    priceCents: 900,
    status: "published",
    featured: false,
    cover: {
      url: "/uploads/covers/the-secrets-of-genuine-money-ebook-1793491948002.webp",
      alt: "Personal Budgeting, Cash-Flow & Emergency Fund Blueprint cover",
      width: 960,
      height: 1440,
    },
    formats: ["PDF"],
    pages: 84,
    sampleFileKey: "samples/genuine-money-sample.pdf",
    popularity: 27,
    files: [
      {
        format: "PDF",
        fileKey: "products/secrets-of-genuine-money.pdf",
        fileName: "Akwasuccess - Personal Budgeting & Emergency Fund Blueprint.pdf",
      },
    ],
  },
  {
    slug: "low-risk-wealth-building-financial-literacy-course",
    type: "course",
    categorySlug: "finance",
    title: "Foundations of Wealth & Long-Term Financial Literacy",
    subtitle:
      "Understand inflation, purchasing power, compounding and low-risk financial planning.",
    description:
      "A structured beginner course that demystifies how wealth is preserved and grown over decades. Covers inflation protection, diversification principles, and how to evaluate financial claims critically.",
    level: "beginner",
    priceCents: 2900,
    status: "published",
    featured: false,
    cover: {
      url: "/uploads/covers/the-secrets-of-genuine-money-ebook-1793491948002.webp",
      alt: "Foundations of Wealth & Long-Term Financial Literacy cover",
      width: 960,
      height: 1440,
    },
    formats: ["Video", "PDF"],
    pages: 72,
    sampleFileKey: "samples/genuine-money-sample.pdf",
    popularity: 21,
    files: [
      {
        format: "PDF",
        fileKey: "products/secrets-of-genuine-money.pdf",
        fileName: "Akwasuccess - Foundations of Wealth Course Workbook.pdf",
      },
    ],
  },

  /* ================= 4. CRYPTOCURRENCY & BLOCKCHAIN (3) ================= */
  {
    slug: "cryptocurrency-for-beginners",
    type: "ebook",
    categorySlug: "crypto",
    title: "Cryptocurrency for Beginners",
    subtitle: "Learn the fundamentals of crypto, wallets and safety, step by step.",
    description:
      "A clear, hype-free starting point for anyone new to cryptocurrency. Covers how blockchains record value, how Bitcoin and stablecoins work, how to set up a wallet safely, and how to avoid common scams.",
    level: "beginner",
    priceCents: 1500,
    status: "published",
    featured: true,
    cover: {
      url: "/uploads/covers/cryptocurrency-for-beginners-1793491001771.webp",
      alt: "Cryptocurrency for Beginners cover",
      width: 960,
      height: 1440,
    },
    formats: ["PDF"],
    pages: 110,
    sampleFileKey: "samples/crypto-beginners-sample.pdf",
    popularity: 45,
    files: [
      {
        format: "PDF",
        fileKey: "products/cryptocurrency-for-beginners.pdf",
        fileName: "Akwasuccess - Cryptocurrency for Beginners.pdf",
      },
    ],
  },
  {
    slug: "crypto-wallet-security-recovery-phrase-guide",
    type: "ebook",
    categorySlug: "crypto",
    title: "Crypto Wallet Security & Recovery Phrase Handbook",
    subtitle:
      "Protect your digital assets with hardware/software wallet best practices and P2P safety checklists.",
    description:
      "Because blockchain transactions are irreversible, security comes first. This guide walks you through custodial vs. self-custody wallets, offline seed-phrase backups, two-factor authentication, and safe P2P escrow habits.",
    level: "beginner",
    priceCents: 1200,
    status: "published",
    featured: false,
    cover: {
      url: "/uploads/covers/cryptocurrency-for-beginners-1793491001771.webp",
      alt: "Crypto Wallet Security & Recovery Phrase Handbook cover",
      width: 960,
      height: 1440,
    },
    formats: ["PDF"],
    pages: 78,
    sampleFileKey: "samples/crypto-beginners-sample.pdf",
    popularity: 32,
    files: [
      {
        format: "PDF",
        fileKey: "products/cryptocurrency-for-beginners.pdf",
        fileName: "Akwasuccess - Crypto Wallet Security Handbook.pdf",
      },
    ],
  },
  {
    slug: "cryptocurrency-blockchain-training",
    type: "course",
    categorySlug: "crypto",
    title: "Cryptocurrency & Blockchain Training",
    subtitle: "Structured video training on crypto and blockchain fundamentals.",
    description:
      "A guided course covering cryptocurrency and blockchain fundamentals, wallet security, P2P transactions, stablecoins, and an introduction to fundamental and technical analysis.",
    level: "beginner",
    priceCents: 4500,
    status: "published",
    featured: false,
    cover: {
      url: "/uploads/covers/cryptocurrency-for-beginners-1793491001771.webp",
      alt: "Cryptocurrency & Blockchain Training cover",
      width: 960,
      height: 1440,
    },
    formats: ["Video"],
    popularity: 38,
  },

  /* ======================= 5. SERVICES & CONSULTING ======================= */
  {
    slug: "consulting-session",
    type: "service",
    categorySlug: "services",
    title: "Consulting Session",
    subtitle: "One-on-one educational guidance on crypto, blockchain and financial literacy.",
    description:
      "A private session to ask questions and get structured educational guidance. Sessions are strictly educational and are not regulated investment advice.",
    level: "beginner",
    priceCents: 3000,
    status: "published",
    formats: ["Live"],
    popularity: 15,
  },
];
