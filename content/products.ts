import type { NewProduct } from "@/lib/db/schema";

/**
 * REAL product seed data (from the old akwasuccess.com site).
 *
 * Prices, covers, page counts, files and tables of contents were NOT supplied.
 * `priceKes: 0` with `isFree: false` renders as "Price coming soon" and the
 * product cannot be bought until the owner sets a price in /admin.
 * TODO: owner to supply (see TODO_OWNER.md).
 */
export type SeedProduct = Omit<NewProduct, "id" | "createdAt" | "updatedAt"> & {
  files?: { format: string; fileKey: string; fileName: string }[];
};

export const seedProducts: SeedProduct[] = [
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
    priceKes: 0, // TODO: owner to supply
    status: "published",
    featured: true,
    formats: ["PDF"],
    pages: null, // TODO: owner to supply
    sampleFileKey: "samples/basic-electrical-sample.pdf", // TODO: replace placeholder sample
    popularity: 30,
    files: [
      {
        format: "PDF",
        fileKey: "products/basic-electrical-electronics.pdf", // TODO: owner to upload
        fileName: "Akwasuccess - Basic Electrical, Electronics & Instrumentation.pdf",
      },
    ],
  },
  {
    slug: "psychology-clinic-health-tips-for-long-life-ebook",
    type: "ebook",
    categorySlug: "psychology",
    title: "Psychology Clinic: Health Tips for Long Life",
    subtitle: "Practical psychology and healthy-lifestyle tips for everyday wellbeing.",
    description:
      "An easy-to-read eBook that shares psychology and health education for a longer, more balanced life. It is for education and awareness and does not replace professional medical care.",
    level: "beginner",
    priceKes: 0, // TODO: owner to supply
    status: "published",
    featured: true,
    formats: ["PDF"],
    sampleFileKey: "samples/psychology-clinic-sample.pdf",
    popularity: 20,
    files: [
      {
        format: "PDF",
        fileKey: "products/psychology-clinic.pdf",
        fileName: "Akwasuccess - Psychology Clinic.pdf",
      },
    ],
  },
  {
    slug: "the-secrets-of-genuine-money-ebook",
    type: "ebook",
    categorySlug: "finance",
    title: "The Secrets of Genuine Money",
    subtitle: "Understand what money really is, where it came from and where it is going.",
    description:
      "A clear introduction to money: its history, how it works today and how the financial system is changing. Written for beginners who want to make better-informed money decisions.",
    level: "beginner",
    priceKes: 0, // TODO: owner to supply
    status: "published",
    featured: true,
    formats: ["PDF"],
    sampleFileKey: "samples/genuine-money-sample.pdf",
    popularity: 25,
    files: [
      {
        format: "PDF",
        fileKey: "products/secrets-of-genuine-money.pdf",
        fileName: "Akwasuccess - The Secrets of Genuine Money.pdf",
      },
    ],
  },
  {
    slug: "cryptocurrency-for-beginners",
    type: "ebook",
    categorySlug: "crypto",
    title: "Cryptocurrency for Beginners",
    subtitle: "Learn the fundamentals of crypto, wallets and safety, step by step.",
    description:
      "A starting point for anyone new to cryptocurrency. Placeholder product: the owner will confirm the final format, contents and price.",
    level: "beginner",
    priceKes: 0, // TODO: owner to supply
    status: "published",
    featured: true,
    formats: ["PDF"],
    sampleFileKey: "samples/crypto-beginners-sample.pdf",
    popularity: 40,
    files: [
      {
        format: "PDF",
        fileKey: "products/cryptocurrency-for-beginners.pdf",
        fileName: "Akwasuccess - Cryptocurrency for Beginners.pdf",
      },
    ],
  },
  {
    slug: "cryptocurrency-blockchain-training",
    type: "course",
    categorySlug: "crypto",
    title: "Cryptocurrency & Blockchain Training",
    subtitle: "Structured training on crypto and blockchain fundamentals.",
    description:
      "A guided course covering cryptocurrency and blockchain fundamentals. Placeholder product: the owner will confirm the curriculum, delivery format and price.",
    level: "beginner",
    priceKes: 0, // TODO: owner to supply
    status: "published",
    formats: ["Video"],
    popularity: 35,
  },
  {
    slug: "consulting-session",
    type: "service",
    categorySlug: "services",
    title: "Consulting Session",
    subtitle: "One-on-one educational guidance on crypto, blockchain and growing wealth.",
    description:
      "A private session to ask questions and get educational guidance. Sessions are educational and are not regulated investment advice. Placeholder product: the owner will confirm packages and prices.",
    level: "beginner",
    priceKes: 0, // TODO: owner to supply
    status: "published",
    formats: ["Live"],
    popularity: 10,
  },
];
