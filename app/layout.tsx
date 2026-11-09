import type { Metadata, Viewport } from "next";
import "./globals.css";
import { site } from "@/content/site";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { ToastRegion } from "@/components/ui/Toast";
import { ServiceWorkerRegister } from "@/components/layout/ServiceWorkerRegister";
import { JsonLd } from "@/components/seo/JsonLd";
import { t } from "@/lib/i18n";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { absoluteUrl } from "@/lib/utils";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0B6B3A" },
    { media: "(prefers-color-scheme: dark)", color: "#08472A" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name}: ${site.tagline}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: site.url,
    siteName: site.name,
    title: `${site.name}: ${site.tagline}`,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name}: ${site.tagline}`,
    description: site.description,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" data-theme-pref="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <meta name="theme-color" content="#0B6B3A" />
        <link
          rel="preload"
          href="/fonts/inter-latin-wght-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/fraunces-latin-wght-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="flex min-h-dvh w-full max-w-full flex-col overflow-x-clip">
        <a
          href="#main-content"
          className="bg-primary text-primary-fg sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:px-4 focus:py-2 focus:font-semibold"
        >
          {t.nav.skipToContent}
        </a>

        <Header />

        <main id="main-content" className="w-full max-w-full min-w-0 flex-1 overflow-x-clip">
          {children}
        </main>

        <Footer />
        <BottomNav />
        <WhatsAppButton />
        <ToastRegion />
        <ServiceWorkerRegister />

        <JsonLd
          data={[
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              name: site.name,
              url: site.url,
              email: site.email,
            },
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: site.name,
              url: site.url,
              potentialAction: {
                "@type": "SearchAction",
                target: `${absoluteUrl("/shop")}?q={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            },
          ]}
        />
      </body>
    </html>
  );
}
