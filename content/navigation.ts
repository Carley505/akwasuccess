import { categories, shopCategories } from "./categories";

export const mainNav = [
  { label: "Courses", href: "/courses" },
  { label: "Learn (Free)", href: "/learn" },
  { label: "Services", href: "/services" },
  { label: "About", href: "/about" },
] as const;

export const shopMenu = {
  categories: shopCategories.map((c) => ({
    label: c.name,
    href: c.href,
    description: c.description,
    icon: c.icon,
  })),
  formats: [
    { label: "eBooks", href: "/shop?format=ebook" },
    { label: "Courses", href: "/shop?format=course" },
    { label: "Tutorials", href: "/shop?format=tutorial" },
    { label: "Free resources", href: "/free" },
  ],
};

export const footerNav = {
  shop: [
    { label: "All products", href: "/shop" },
    ...shopCategories.map((c) => ({ label: c.name, href: c.href })),
    { label: "Courses & tutorials", href: "/courses" },
  ],
  learnServices: [
    { label: "Free learning hub", href: "/learn" },
    { label: "Crypto learning path", href: "/learn/paths/crypto" },
    { label: "Technical learning path", href: "/learn/paths/technical" },
    { label: "Free resources", href: "/free" },
    { label: "Consulting", href: "/services/consulting" },
    { label: "Electrical installation", href: "/services/electrical" },
  ],
  company: [
    { label: "About", href: "/about" },
    { label: "Success stories", href: "/success-stories" },
    { label: "Contact", href: "/contact" },
    { label: "FAQ", href: "/faq" },
    { label: "Privacy policy", href: "/privacy-policy" },
    { label: "Refund policy", href: "/refund-policy" },
    { label: "Terms of service", href: "/terms" },
    { label: "Disclaimer", href: "/disclaimer" },
  ],
};

export const drawerGroups = [
  {
    title: "Shop",
    links: [{ label: "All products", href: "/shop" }, ...categories.filter((c) => c.slug !== "services").map((c) => ({ label: c.name, href: c.href }))],
  },
  {
    title: "Learn",
    links: [
      { label: "Courses & tutorials", href: "/courses" },
      { label: "Free learning hub", href: "/learn" },
      { label: "Learning paths", href: "/learn/paths/crypto" },
      { label: "Free resources", href: "/free" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Consulting", href: "/services/consulting" },
      { label: "Electrical installation", href: "/services/electrical" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Success stories", href: "/success-stories" },
      { label: "FAQ", href: "/faq" },
      { label: "Contact", href: "/contact" },
    ],
  },
];
