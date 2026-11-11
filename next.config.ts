import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content Security Policy. Third-party origins are limited to payment
 * providers, Turnstile, analytics and video hosts used by the site.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""} https://challenges.cloudflare.com https://plausible.io https://js.paystack.co`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://plausible.io https://api.paystack.co https://*.ingest.sentry.io",
  "frame-src https://challenges.cloudflare.com https://checkout.paystack.com https://cal.com https://calendly.com https://player.mux.com https://iframe.mediadelivery.net https://www.youtube-nocookie.com",
  "media-src 'self' blob: https:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.paystack.com",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
]
  .join("; ")
  .replace(/\s{2,}/g, " ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: isDev ? csp.replace("upgrade-insecure-requests", "") : csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
];

/** 301 redirects from the old WordPress URLs (spec 5.1). */
const legacyRedirects: [string, string][] = [
  ["/what-we-do/ebooks", "/shop"],
  ["/what-we-do/crypto-training", "/shop/crypto"],
  ["/what-we-do/tutorials", "/courses"],
  ["/what-we-do/63-2", "/services/consulting"],
  ["/what-we-do/consulting", "/services/consulting"],
  ["/what-we-do", "/services"],
  ["/about/success-stories", "/success-stories"],
  ["/act", "/free"],
  ["/contact-us", "/contact"],
  ["/refund_returns", "/refund-policy"],
  ["/my-account", "/account"],
  ["/product/:slug", "/shop/:slug"],
  ["/product-category/:slug", "/shop"],
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // PGlite ships WebAssembly + data files that must not be bundled.
  serverExternalPackages: ["@electric-sql/pglite"],
  outputFileTracingIncludes: {
    "/*": ["./drizzle/**/*", "./content/**/*"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 414, 640, 768, 1024, 1280, 1536, 1920],
    qualities: [60, 75],
    remotePatterns: [
      { protocol: "https", hostname: "darkgrey-lemur-121864.hostingersite.com" },
      { protocol: "https", hostname: "cms.akwasuccess.com" },
      { protocol: "https", hostname: "akwasuccess.com" },
    ],
  },
  async redirects() {
    return legacyRedirects.flatMap(([source, destination]) => [
      { source, destination, permanent: true },
      { source: `${source}/`, destination, permanent: true },
    ]);
  },
  async rewrites() {
    return [
      {
        source: "/wp-content/:path*",
        destination: "https://darkgrey-lemur-121864.hostingersite.com/wp-content/:path*",
      },
    ];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/fonts/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
