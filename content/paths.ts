/**
 * Learning paths: the signature UI element. Each step links to a resource.
 * Step `id`s are used to store progress (localStorage for guests, DB for users).
 */
export type PathStep = {
  id: string;
  title: string;
  summary: string;
  href: string;
};

export type LearningPath = {
  slug: "crypto" | "technical";
  title: string;
  intro: string;
  category: "crypto" | "technical";
  steps: PathStep[];
};

export const learningPaths: LearningPath[] = [
  {
    slug: "crypto",
    title: "Crypto path",
    intro: "Go from \"what is crypto?\" to understanding analysis, one safe step at a time.",
    category: "crypto",
    steps: [
      { id: "crypto-1", title: "Cryptocurrency", summary: "What it is and how it differs from mobile money.", href: "/learn/what-is-cryptocurrency" },
      { id: "crypto-2", title: "Blockchain", summary: "The shared record that makes crypto work.", href: "/learn/what-is-blockchain" },
      { id: "crypto-3", title: "Wallets", summary: "Where your digital assets live, and who holds the keys.", href: "/learn/crypto-wallets-explained" },
      { id: "crypto-4", title: "Security", summary: "Protect your recovery phrase and avoid common scams.", href: "/learn/recovery-phrase-security" },
      { id: "crypto-5", title: "P2P", summary: "How peer-to-peer trading works and how to stay safe.", href: "/learn/p2p-basics" },
      { id: "crypto-6", title: "Stablecoins", summary: "Digital dollars and how they keep their value.", href: "/learn/what-are-stablecoins" },
      { id: "crypto-7", title: "Analysis", summary: "Fundamental and technical analysis, explained simply.", href: "/shop/crypto" },
      { id: "crypto-8", title: "Advanced", summary: "Training and consulting for deeper understanding.", href: "/services/consulting" },
    ],
  },
  {
    slug: "technical",
    title: "Technical path",
    intro: "Build real-world electrical and automation skills from the ground up.",
    category: "technical",
    steps: [
      { id: "tech-1", title: "Electrical Basics", summary: "Voltage, current, resistance and safety.", href: "/learn/electrical-basics-ohms-law" },
      { id: "tech-2", title: "Electronics", summary: "Components, circuits and how they behave.", href: "/learn/electronics-for-beginners" },
      { id: "tech-3", title: "Instrumentation", summary: "Measuring pressure, flow, level and temperature.", href: "/shop/technical" },
      { id: "tech-4", title: "Control Systems", summary: "Feedback loops and process control.", href: "/shop/technical" },
      { id: "tech-5", title: "Automation", summary: "PLCs and industrial automation.", href: "/shop/technical" },
      { id: "tech-6", title: "Advanced Technologies", summary: "Troubleshooting and real installation work.", href: "/services/electrical" },
    ],
  },
];

export const customerJourney = [
  { title: "Discover", summary: "Find a topic that matters to you with our free guides." },
  { title: "Learn", summary: "Read a beginner-friendly eBook at your own pace." },
  { title: "Practice", summary: "Apply what you learn with checklists and tutorials." },
  { title: "Go deeper", summary: "Take a course or book a one-on-one session." },
  { title: "Grow", summary: "Use your knowledge to make confident, informed decisions." },
];

export function getPath(slug: string) {
  return learningPaths.find((p) => p.slug === slug);
}
