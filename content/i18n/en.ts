/**
 * UI strings (English, Kenya). Components read strings via `t()` from
 * lib/i18n so a Swahili dictionary (sw.ts) can be added later with the same keys.
 */
export const en = {
  nav: {
    home: "Home",
    shop: "Shop",
    courses: "Courses",
    learn: "Learn",
    learnFree: "Learn (Free)",
    services: "Services",
    about: "About",
    cart: "Cart",
    account: "Account",
    search: "Search",
    startFree: "Start Free",
    menu: "Menu",
    closeMenu: "Close menu",
    openMenu: "Open menu",
    skipToContent: "Skip to content",
    allProducts: "All products",
    chatWhatsApp: "Chat on WhatsApp",
    contact: "Contact",
    faq: "FAQ",
    free: "Free resources",
    successStories: "Success stories",
  },
  actions: {
    buyNow: "Buy now",
    addToCart: "Add to cart",
    added: "Added",
    inCart: "In cart",
    readSample: "Read a free sample",
    viewAll: "View all",
    browseEbooks: "Browse eBooks",
    startLearningFree: "Start learning free",
    subscribe: "Get it free",
    send: "Send message",
    retry: "Try again",
    loadMore: "Load more",
    reset: "Reset",
    apply: "Apply",
    close: "Close",
    download: "Download",
    continue: "Continue",
    notifyMe: "Notify me",
  },
  trust: {
    payments: "Secure M-Pesa & card payments",
    instant: "Instant download",
    beginner: "Beginner-friendly",
    paySecurely: "Pay securely with M-Pesa or card",
    privacy: "We respect your privacy. Unsubscribe any time.",
  },
  product: {
    instantDownload: "Instant digital download",
    priceComingSoon: "Price coming soon",
    free: "Free",
    sample: "Sample data",
  },
  footer: {
    blurb:
      "Practical knowledge on finance, the digital economy and technology, written for beginners in Kenya, East Africa and beyond.",
    shop: "Shop",
    learnServices: "Learn & Services",
    company: "Company & Legal",
    rights: "All rights reserved.",
    weAccept: "We accept",
  },
} as const;

export type Dictionary = typeof en;
