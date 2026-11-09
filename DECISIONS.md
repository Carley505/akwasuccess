# Architectural & Design Decisions (`DECISIONS.md`)

This document records the engineering and UX decisions made while rebuilding **Akwasuccess.com** from the specification.

## 1. Typography: Fraunces + Inter (Self-Hosted WOFF2)
- **Spec 3.3** allows `Playfair Display` *or* `Fraunces` for headings and `Inter` *or* `Nunito Sans` for body/UI.
- **Decision:** We chose **Fraunces Variable** (weights 600–700, Latin subset) for headings and **Inter Variable** (weights 400–600, Latin subset) for body and UI.Both WOFF2 files are self-hosted in `app/fonts/` and loaded via `next/font/local` with `display: "swap"` and `preload: true`.
- **Why:** Fraunces has warm, bookish serifs that reinforce the "calm, confident teacher" personality and give book mockups an editorial feel without external font requests.

## 2. Database: PostgreSQL + Embedded PGlite Fallback
- **Spec 4.1** recommends PostgreSQL (Supabase or Neon).
- **Decision:** We use **Drizzle ORM** with `postgres-js` when `DATABASE_URL` points to a remote PostgreSQL server, and automatically fall back to **PGlite** (PostgreSQL compiled to WebAssembly, stored in `./.data/pglite`) when `DATABASE_URL` is unset or prefixed with `pglite:`.
- **Why:** The site uses real SQL queries, transactions, constraints, and migrations in every environment, while `npm run dev`, `npm run build`, and E2E tests work out of the box with zero external database setup.

## 3. Global Audience & USD Card Payments
- **Decision:** All product prices, coupons, and orders are denominated in **USD** and stored in the database as integer US cents (`price_cents`, `sale_price_cents`, `subtotal_cents`, `discount_cents`, `total_cents`, `amount_cents`) to eliminate floating-point rounding errors.
- Checkout is a single-page USD card flow (`lib/payments/`) supporting hosted card payment (Visa/Mastercard) with HMAC-SHA512 webhook verification and an instant sandbox simulator in local/test environments when live keys are not yet configured.

## 4. Digital Delivery & Watermarking
- **Spec 10** requires private bucket storage, short-lived signed download URLs, per-purchase daily download limits, and optional visible buyer-email watermarking on PDFs.
- **Decision:**
  - Product files live outside `/public` in `storage/private/` (or S3/Cloudflare R2 when `STORAGE_S3_ENDPOINT` is configured, signed with `aws4fetch`).
  - `/api/download/[token]` issues and verifies HMAC-SHA256 tokens signed with `AUTH_SECRET` (10-minute expiry), checks `entitlements` and enforces a 5-downloads/day limit per entitlement (resettable by admin).
  - PDF downloads are dynamically stamped in-memory using `pdf-lib` with a subtle footer (`Licensed to <buyer email> • Order #<number>`) before streaming.

## 5. Sample Data Separation (`isSample: true`)
- **Spec 2.2** states that prices, cover images, page counts, and file URLs are not yet provided, and requires that sample data be flagged `isSample: true` and hidden from production builds unless explicitly enabled.
- **Decision:**
  - `content/products.ts` holds the 6 canonical products with `priceCents: 0` ("Price coming soon").
  - `content/sample-data.ts` (`isSample: true`) overlays sample USD prices (in cents), TOCs, outcomes, and a sample bundle in development (`NODE_ENV !== "production"` or `SHOW_SAMPLE_DATA="true"`) so checkout and the course player can be tested end-to-end.
  - Testimonials and product ratings are **never** fabricated; on the home page, when no approved testimonials exist in the database, the "What you will get" benefits strip renders instead (Spec 8.1 #8).

## 6. First-Class Dark / Light / System Theme Architecture
- **Decision:**
  - Implemented a 3-state theme preference (`"light" | "dark" | "system"`) stored in `localStorage` under `akwa:theme` (`lib/theme.ts`).
  - A tiny synchronous inline `<script>` (`THEME_INIT_SCRIPT`) runs in `<head>` before first paint to set `data-theme="light|dark"` and `style.colorScheme` on `<html>`, preventing Flash of Unstyled Content (FOUC).
  - `app/globals.css` defines a single-source-of-truth `@utility theme-dark` token block applied both to `:root[data-theme="dark"]` and `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }`, paired with `@custom-variant dark` for Tailwind v4.
  - All Light and Dark token pairs are verified against WCAG 2.2 AA contrast thresholds via `scripts/check-contrast.mjs`.
  - `components/theme/ThemeToggle.tsx` uses `useSyncExternalStore` (zero hydration mismatch, cross-tab `storage` sync, live `matchMedia` listener in `system` mode, and a 150ms `[data-theme-transition]` smoothness class that respects `prefers-reduced-motion`).

## 7. Legacy `/act/` Page Redirect
- **Spec 5.1** maps `/act/` → `/free` and notes the owner should confirm what "Act!" contained.
- **Decision:** Added a permanent 301 redirect in `next.config.ts` from `/act` and `/act/` to `/free`, and listed confirmation of any legacy "Act!" copy in `TODO_OWNER.md`.

## 8. Headless WooCommerce Integration (`cms.akwasuccess.com`) & 4-Hour Timed Downloads
- **Decision:**
  - WordPress + WooCommerce + WPGraphQL + WooGraphQL ("GraphQL for eCommerce") acts as the headless catalog and order source of truth (`lib/woocommerce/`). Target WordPress subdomain is `https://cms.akwasuccess.com` (with automatic fallback to `https://akwasuccess.com` before DNS cutover).
  - Products are synced into PostgreSQL (`products.woo_id`, `products.woo_downloads`) and categorized across 6 pillars: `crypto`, `finance`, `technical`, `psychology`, `marketing`, and `services`.
  - Checkout uses **Option A (Seamless In-Site Checkout)** via Paystack's inline popup (`https://js.paystack.co/v1/inline.js`) and server-side `/api/payments/verify`, formatting the transaction reference as `{wooOrderId}_{unixSec}` so both Next.js and the WordPress Paystack gateway plugin reconcile payments. When Paystack keys are not yet set, the local sandbox simulator settles orders cleanly.
  - Signed download links (`/api/download/[token]`) expire after **4 hours** (`DOWNLOAD_EXPIRY_SEC = 14400`), proxy WooCommerce's protected downloads server-side without exposing WordPress URLs, and allow signed-in buyers to generate fresh 4-hour links anytime from their Account Library.
  - Customers can check out freely as guests, while Cart, Checkout, and Order Confirmation pages inform them to sign up/log in to persist cart items (`carts` table) and view their full WooCommerce-synced order history.
