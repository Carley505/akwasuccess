# Open Items for the Owner (`TODO_OWNER.md`)

Everything below is wired into the site and admin panel (`/admin`) with safe placeholders so you can update it without touching code.

## 1. Final Brand Logo SVGs
Place final vector files in `public/brand/` when ready:
- `public/brand/logo-horizontal.svg` (header, invoices, emails)
- `public/brand/logo-stacked.svg` (footer, social)
- `public/brand/logo-icon.svg` (favicon, app icon)
- `public/brand/logo-mono-white.svg` (for dark green backgrounds)
*Current state:* `components/ui/Logo.tsx` renders the clean typographic wordmark (**AkwaSuccess** + rising-arrow book glyph) and the uploaded original badge (`public/brand/logo-original.png`) is showcased on the About page.

## 2. Product Details & Digital Files
Update in `/admin` (or `content/products.ts`):
1. **Basic Electrical, Electronics & Instrumentation Automation Technologies eBook** — final USD price, cover image (2:3 aspect ratio), page count, table of contents, full PDF/EPUB file, and free sample chapter PDF.
2. **Psychology Clinic: Health Tips for Long Life eBook** — final USD price, cover image, page count, TOC, full PDF/EPUB file, and free sample chapter PDF.
3. **The Secrets of Genuine Money eBook** — final USD price, cover image, page count, TOC, full PDF/EPUB file, and free sample chapter PDF.
4. **Cryptocurrency for Beginners** — confirm whether eBook, course, or both; supply USD price, cover, TOC, and files.
5. **Cryptocurrency & Blockchain Training** — confirm curriculum modules/lessons, video embeds (Mux, Bunny Stream, or unlisted YouTube), and USD price.
6. **Consulting Session** — confirm session packages (e.g., 30-min discovery, 60-min 1-on-1, group workshop) and USD prices.

## 3. Founder Bio, Credentials & Real Photography
Update in `content/site.ts` and `app/(marketing)/about/page.tsx`:
- Real photo of the founder (`public/images/founder.webp`).
- Confirmed list of technical/professional credentials and certifications.
- Real photos of domestic/industrial electrical installations and training sessions for `/services/electrical`.

## 4. Payment Provider & Headless WordPress Credentials
Add to `.env.local` / production hosting environment when ready:
- **Card Checkout (USD — In-Site Paystack Inline Popup):** `PAYSTACK_SECRET_KEY`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` (use the same live/test keys configured in the WordPress Paystack WooCommerce Payment Gateway plugin).
- **WordPress Subdomain Cutover (`cms.akwasuccess.com`):**
  1. Point `cms.akwasuccess.com` to your Hostinger WordPress installation before pointing `akwasuccess.com` to Vercel, and set `WOOCOMMERCE_URL=https://cms.akwasuccess.com` and `WOOCOMMERCE_GRAPHQL_URL=https://cms.akwasuccess.com/graphql`.
  2. **Rotate your WooCommerce REST API keys** in **WooCommerce → Settings → Advanced → REST API** (since the initial keys were shared in chat) and update `WOOCOMMERCE_CONSUMER_KEY` and `WOOCOMMERCE_CONSUMER_SECRET` in `.env.local` / Vercel.
  3. Re-upload **The Secret of Genuine Money** PDF inside the WooCommerce Product "Downloadable files" uploader so it moves from public `/wp-content/uploads/2026/09/` into protected `/wp-content/uploads/woocommerce_uploads/`.
  4. Disable WooCommerce's built-in **Processing order** and **Completed order** customer emails in **WooCommerce → Settings → Emails** so buyers only receive the Next.js receipt email with 4-hour expiring links.

## 5. Policies, Service Area & Legacy "Act!" Page
- Confirm final **Refund & Returns Policy** terms in `/refund-policy`.
- Confirm what the old WordPress `/act/` page contained (currently 301-redirected into `/free`).
- Confirm exact electrical installation service area and warranty note on `/services/electrical`.
- Confirm consulting booking link (`NEXT_PUBLIC_CAL_LINK` for Cal.com/Calendly, or use the built-in booking form on `/services/consulting`).

## 6. Real Learner Testimonials
- Collect written permission from real readers/clients and approve their stories in `/admin` (or submit via `/success-stories`). No sample testimonials are shown in production.

## 7. Contact Details & Social Profiles
Update in `content/site.ts` or `/admin`:
- Optional business WhatsApp number (`NEXT_PUBLIC_WHATSAPP_NUMBER`, international format without `+`, e.g. `15552345678`).
- Business email (`NEXT_PUBLIC_CONTACT_EMAIL`).
- Official links for Facebook, X (Twitter), YouTube, LinkedIn, and TikTok.

## 8. Domain, DNS & Email Sending
- Point `akwasuccess.com` DNS to production hosting (Vercel or Cloudflare).
- Set `RESEND_API_KEY` and `EMAIL_FROM` for transactional receipts and magic-link emails.
