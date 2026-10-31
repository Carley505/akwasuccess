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

## 3. Payments: Provider-Agnostic `PaymentProvider` with Daraja M-Pesa + Paystack + Sandbox Simulator
- **Spec 4.1 & 8.4** require M-Pesa STK Push (Safaricom Daraja) and Card + M-Pesa via Paystack/Flutterwave, with webhook-verified, idempotent settlement.
- **Decision:** We implemented a clean `PaymentProvider` interface in `lib/payments/` with:
  1. **Safaricom Daraja STK Push** (`lib/payments/daraja.ts`) for direct M-Pesa prompt (`07xx`, `01xx`, `2547...`, `2541...` normalized to `254...`).
  2. **Paystack** (`lib/payments/paystack.ts`) for Visa/Mastercard and M-Pesa in Kenya (HMAC-SHA512 webhook verification).
  3. **Sandbox Simulator** (`lib/payments/sandbox.ts`) active when live keys are not yet configured, supporting end-to-end STK Push polling, instant success, wrong-PIN failure, timeout, and idempotent webhook replay so staging and Playwright tests can exercise every path.

## 4. Digital Delivery & Watermarking
- **Spec 10** requires private bucket storage, short-lived signed download URLs, per-purchase daily download limits, and optional visible buyer-email watermarking on PDFs.
- **Decision:**
  - Product files live outside `/public` in `storage/private/` (or S3/Cloudflare R2 when `STORAGE_S3_ENDPOINT` is configured, signed with `aws4fetch`).
  - `/api/download/[token]` issues and verifies HMAC-SHA256 tokens signed with `AUTH_SECRET` (10-minute expiry), checks `entitlements` and enforces a 5-downloads/day limit per entitlement (resettable by admin).
  - PDF downloads are dynamically stamped in-memory using `pdf-lib` with a subtle footer (`Licensed to <buyer email> • Order #<number>`) before streaming.

## 5. Sample Data Separation (`isSample: true`)
- **Spec 2.2** states that prices, cover images, page counts, and file URLs are not yet provided, and requires that sample data be flagged `isSample: true` and hidden from production builds unless explicitly enabled.
- **Decision:**
  - `content/products.ts` holds the 6 canonical products with `priceKes: 0` ("Price coming soon").
  - `content/sample-data.ts` (`isSample: true`) overlays sample KES prices, TOCs, outcomes, and a sample bundle in development (`NODE_ENV !== "production"` or `SHOW_SAMPLE_DATA="true"`) so checkout and the course player can be tested end-to-end.
  - Testimonials and product ratings are **never** fabricated; on the home page, when no approved testimonials exist in the database, the "What you will get" benefits strip renders instead (Spec 8.1 #8).

## 6. Legacy `/act/` Page Redirect
- **Spec 5.1** maps `/act/` → `/free` and notes the owner should confirm what "Act!" contained.
- **Decision:** Added a permanent 301 redirect in `next.config.ts` from `/act` and `/act/` to `/free`, and listed confirmation of any legacy "Act!" copy in `TODO_OWNER.md`.
