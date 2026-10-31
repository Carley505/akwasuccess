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
Update in `/admin/products` (or `content/products.ts`):
1. **Basic Electrical, Electronics & Instrumentation Automation Technologies eBook** — final KES price, cover image (2:3 aspect ratio), page count, table of contents, full PDF/EPUB file, and free sample chapter PDF.
2. **Psychology Clinic: Health Tips for Long Life eBook** — final KES price, cover image, page count, TOC, full PDF/EPUB file, and free sample chapter PDF.
3. **The Secrets of Genuine Money eBook** — final KES price, cover image, page count, TOC, full PDF/EPUB file, and free sample chapter PDF.
4. **Cryptocurrency for Beginners** — confirm whether eBook, course, or both; supply price, cover, TOC, and files.
5. **Cryptocurrency & Blockchain Training** — confirm curriculum modules/lessons, video embeds (Mux, Bunny Stream, or unlisted YouTube), and price.
6. **Consulting Session** — confirm session packages (e.g., 30-min discovery, 60-min 1-on-1, group workshop) and KES prices.

## 3. Founder Bio, Credentials & Real Photography
Update in `content/site.ts` and `app/(marketing)/about/page.tsx`:
- Real photo of the founder (`public/images/founder.webp`).
- Confirmed list of technical/professional credentials and certifications.
- Real photos of domestic/industrial electrical installations and training sessions for `/services/electrical`.

## 4. Payment Provider Credentials
Add to `.env.local` / production hosting environment:
- **Safaricom Daraja (M-Pesa STK Push):** `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, `MPESA_PASSKEY`, `MPESA_CALLBACK_URL`, `MPESA_ENV=production`.
- **Paystack (Card + M-Pesa):** `PAYSTACK_SECRET_KEY`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`.

## 5. Policies, Service Area & Legacy "Act!" Page
- Confirm final **Refund & Returns Policy** terms in `/refund-policy`.
- Confirm what the old WordPress `/act/` page contained (currently 301-redirected into `/free`).
- Confirm exact electrical installation service area (currently listed as Nairobi & surrounding counties) and warranty note on `/services/electrical`.
- Confirm consulting booking link (`NEXT_PUBLIC_CAL_LINK` for Cal.com/Calendly, or use the built-in booking form on `/services/consulting`).

## 6. Real Learner Testimonials
- Collect written permission from real readers/clients and approve their stories in `/admin/reviews` (or submit via `/success-stories`). No sample testimonials are shown in production.

## 7. Contact Details & Social Profiles
Update in `content/site.ts` or `/admin/settings`:
- Business WhatsApp number (`NEXT_PUBLIC_WHATSAPP_NUMBER`, format `2547XXXXXXXX`).
- Business email (`NEXT_PUBLIC_CONTACT_EMAIL`).
- Official links for Facebook, X (Twitter), YouTube, LinkedIn, and TikTok.

## 8. Domain, DNS & Email Sending
- Point `akwasuccess.com` DNS to production hosting (Vercel or Cloudflare).
- Set `RESEND_API_KEY` and `EMAIL_FROM` for transactional receipts and magic-link emails.
