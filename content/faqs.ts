export type FaqItem = {
  q: string;
  a: string;
  category?: "general" | "payments" | "delivery" | "courses" | "services";
};

export const homeFaqs: FaqItem[] = [
  {
    q: "How do I receive my eBook after paying?",
    a: "As soon as your card payment is confirmed, your download link appears on the order confirmation page and is also emailed to you within 60 seconds. You can re-download your books anytime from your Account Library.",
    category: "delivery",
  },
  {
    q: "What currency and payment methods do you accept?",
    a: "All prices are listed and charged in US dollars (USD). You can pay securely from anywhere in the world using any Visa or Mastercard debit or credit card.",
    category: "payments",
  },
  {
    q: "What devices can I read the eBooks on?",
    a: "All eBooks come in standard PDF format (and EPUB where available) that opens on any Android phone, iPhone, tablet, laptop, or desktop computer—no special app required.",
    category: "delivery",
  },
  {
    q: "Are your books and courses suitable for complete beginners?",
    a: "Yes. Every guide starts from first principles in plain, friendly English. You can also download a free sample chapter on any eBook page before you buy.",
    category: "general",
  },
  {
    q: "Is your cryptocurrency and financial content investment advice?",
    a: "No. Everything on Akwasuccess is for education and general awareness only. We never offer profit guarantees, trading signals, or personalised investment advice.",
    category: "general",
  },
  {
    q: "What is your refund policy on digital products?",
    a: "Every eBook includes a free sample chapter so you can check the style and topics before buying. If you experience a technical problem with a file or duplicate charge, contact us within 7 days and we will resolve it or issue a refund.",
    category: "payments",
  },
];

export const productDefaultFaqs: FaqItem[] = [
  {
    q: "What format will I receive?",
    a: "You receive a DRM-free PDF (plus EPUB where listed) that you can read on any phone, tablet, or computer.",
  },
  {
    q: "How fast is delivery?",
    a: "Instant. As soon as your card payment completes, your secure download link unlocks on screen and is sent to your email.",
  },
  {
    q: "Do I get future updates for free?",
    a: "Yes. Whenever we update an edition, buyers can download the latest version from their Account Library at no extra cost.",
  },
  {
    q: "What if I lose my downloaded file?",
    a: "Sign in to your account with your email magic link (or use the 'Resend my download links' tool) to download a fresh copy.",
  },
];
