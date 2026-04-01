# VIVANTE - Travel Itinerary SaaS

## Overview

Vivante is a travel itinerary planning platform that collects user preferences via a multi-step form, processes payments through MercadoPago, generates AI-powered itineraries via Groq LLM, and delivers branded PDFs via email. Target market: Latin America (Spanish-language, CLP pricing).

- **URL**: https://vivevivante.com
- **Version**: 2.0.0
- **Quality Score**: 4.5/10

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14.2.35 (App Router) |
| UI | React 18, Tailwind CSS 3.3 |
| Icons | Lucide React |
| PDF | pdfmake, html2pdf.js |
| AI | Groq API (llama-3.3-70b-versatile) |
| Payments | MercadoPago |
| Email | Resend API |
| CRM | Brevo (Sendinblue) |
| Analytics | Google Analytics (placeholder, non-functional) |
| Deploy | Vercel (inferred from maxDuration exports) |

## Environment Variables (Required)

```env
MP_ACCESS_TOKEN=           # MercadoPago payment gateway token
RESEND_API_KEY=            # Resend email delivery service
BREVO_API_KEY=             # Brevo CRM for lead management
GROQ_API_KEY=              # Groq LLM for AI suggestions/itineraries
NOTIFICATION_EMAIL=        # Admin email for order notifications
NEXT_PUBLIC_BASE_URL=      # Frontend URL (default: https://vivevivante.com)
```

## Build & Dev

```bash
npm install
npm run dev      # Development server
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint (Next.js defaults only)
```

## File Structure

```
vivante/
├── app/
│   ├── api/
│   │   ├── generate-pdf/route.js      # PDF generation (pdfmake, uses lib/)
│   │   ├── lead-capture/route.js      # Step 1 lead → Brevo (list 3)
│   │   ├── lead/route.js              # Exit-intent lead → Brevo
│   │   ├── payment/
│   │   │   ├── create-preference/route.js   # MercadoPago checkout (server-side pricing via lib/plans)
│   │   │   ├── recover-session/route.js     # Cross-device form recovery
│   │   │   └── upsell-preference/route.js   # Basic→Pro upgrade (uses UPGRADE_PRICE_CLP from lib/plans)
│   │   ├── resend-email/route.js      # Re-send itinerary email + PDF (uses lib/)
│   │   ├── send-itinerary/route.js    # Main itinerary gen (uses lib/, still GOD OBJECT)
│   │   ├── submit/route.js            # Admin notification (legacy?)
│   │   └── suggest/route.js           # AI destination suggestions (Groq) — uses all 23 form fields
│   ├── globals.css                    # Tailwind + custom animations
│   ├── layout.js                      # Root layout, fonts, GA placeholder
│   ├── page.js                        # Landing page (828 lines, monolithic)
│   ├── pago-exitoso/page.js           # Payment success + itinerary delivery
│   ├── pago-fallido/page.js           # Payment failure
│   ├── pago-pendiente/page.js         # Payment pending
│   └── upgrade-pro/page.js           # Upsell page (from email campaigns)
├── components/
│   └── TravelForm.jsx                # ACTIVE: 5-step travel form (uses PLANS from lib/)
├── lib/
│   ├── plans.js                       # PLANS array, UPGRADE_PRICE_CLP, getPlan() — single source of truth
│   ├── url-builders.js                # buildAirlineUrl(), buildAlojamientoUrl()
│   ├── text-utils.js                  # ce() emoji cleaner for PDF
│   └── email-templates.js             # buildConfirmationEmail() with isResend option
├── public/images/                     # Destination photos + logo SVG
├── next.config.js
├── package.json
├── postcss.config.js
└── tailwind.config.js
```

## User Journey

```
Landing Page (page.js)
  ├── Exit-intent popup → captures email → /api/lead → Brevo
  └── CTA "Planificar mi viaje" → opens TravelForm modal
        │
        Step 1: Name, Email, Destination choice (leads captured → /api/lead-capture)
        Step 2: Origin, Budget ($500-$15k), Days (3-30), Month, Spending priority
        Step 3: Travel type (solo/couple/family/friends), Travelers, Special occasion
        Step 4: Interests (priority-ordered, max 4), Pace, Accommodation, Diet, Airline
        Step 5: Summary review
        │
        ├── "Sorprendeme" path → /api/suggest → Groq AI → 3 destination options
        └── Plan selection: Basico ($10/9990 CLP) or Pro ($17/16990 CLP)
              │
              /api/payment/create-preference → MercadoPago checkout
              │
              ├── Approved → /pago-exitoso → /api/send-itinerary → PDF + email
              ├── Rejected → /pago-fallido → retry
              └── Pending → /pago-pendiente → wait
```

## API Routes Summary

| Route | Method | External Service | Purpose |
|-------|--------|-----------------|---------|
| `/api/suggest` | POST | Groq API | AI destination suggestions (3 options) |
| `/api/lead-capture` | POST | Brevo | Step 1 lead capture |
| `/api/lead` | POST | Brevo | Exit-intent email capture |
| `/api/payment/create-preference` | POST | MercadoPago | Create checkout preference |
| `/api/payment/recover-session` | GET | MercadoPago | Recover formData from preference metadata |
| `/api/payment/upsell-preference` | POST | MercadoPago | Basic→Pro upgrade checkout |
| `/api/send-itinerary` | POST | Groq + Resend | Generate full itinerary + email delivery |
| `/api/generate-pdf` | POST | pdfmake | Generate branded PDF |
| `/api/resend-email` | POST | Resend + pdfmake | Re-send itinerary email |
| `/api/submit` | POST | Resend | Admin notification email |

## Brand Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Naranja Coral | #FF6332 | CTAs, primary highlights |
| Fucsia Vibrante | #E83E8C | Accents, gradients |
| Violeta Profundo | #6F42C1 | Scrolled header, subtle accents |
| Crema Suave | #FCF8F4 | Page background |
| Gris Carbon | #212529 | Body text |

## Pricing

| Plan | USD | CLP | Features |
|------|-----|-----|----------|
| Basico | $10 | 9,990 | Itinerary, flights, hotels, restaurants |
| Pro | $17 | 16,990 | + nightlife, transport, packing, health, culture |
| Upgrade | $7 | 6,790 | Basic→Pro delta |

Prices centralized in `lib/plans.js` (single source of truth). `page.js` pricing section still has its own copy for display.

## Data Storage

- **No database** -- zero SQL, Firebase, Prisma, or any DB
- **localStorage**: formData, planId, preference IDs, lead emails
- **Brevo CRM**: Lead contacts (list ID 3)
- **MercadoPago metadata**: formData embedded in payment preferences (cross-device recovery)
- **Resend**: Email delivery (no retrieval)

---

## Security Audit (28 findings)

### CRITICAL (5)

| ID | Issue | Location |
|----|-------|----------|
| C-01 | Personal email `geniraggio@hotmail.com` hardcoded | `api/submit/route.js:146` |
| C-02 | No payment verification -- itinerary generated without confirming MercadoPago approval | `pago-exitoso/page.js`, `api/send-itinerary/route.js` |
| ~~C-03~~ | ~~Test payment page deployed to production~~ | FIXED: `test-pago/` deleted |
| C-04 | Zero rate limiting on all API endpoints (Groq API abuse, email spam) | All API routes |
| C-05 | No authentication/authorization on any API endpoint | All API routes |

### HIGH (8)

| ID | Issue | Location |
|----|-------|----------|
| H-01 | `dangerouslySetInnerHTML` for GA script | `layout.js:54` |
| H-02 | HTML injection via user data in email templates (no escaping) | `submit`, `send-itinerary`, `resend-email` routes |
| H-03 | Missing CORS configuration | `next.config.js`, all routes |
| H-04 | Missing Content Security Policy headers | `next.config.js` |
| H-05 | Sensitive data in localStorage without encryption | `TravelForm.jsx`, `pago-exitoso/page.js` |
| H-06 | Insecure external image loading from loremflickr.com | `pago-exitoso/page.js:149` |
| ~~H-07~~ | ~~Client sends price to payment API~~ | FIXED: server-side lookup via `getPlan()` in `lib/plans.js` |
| H-08 | Prompt injection risk -- user input interpolated directly in AI prompts | `api/suggest/route.js`, `api/send-itinerary/route.js` |

### MEDIUM (9)

| ID | Issue |
|----|-------|
| M-01 | Placeholder GA ID (`GA_MEASUREMENT_ID`) -- analytics non-functional |
| M-02 | Missing security headers (X-Frame-Options, HSTS, etc.) |
| M-03 | TikTok link uses HTTP instead of HTTPS |
| M-04 | Weak email validation (only checks `@`) |
| M-05 | No CSRF protection on POST routes |
| M-06 | Error messages leak internal service details |
| M-07 | Missing `.gitignore` file |
| M-08 | AI response JSON parsed without schema validation |
| M-09 | `upgrade-pro` URL params allow data tampering |

### LOW (6)

| ID | Issue |
|----|-------|
| L-01 | Deprecated `images.domains` config (use `remotePatterns`) |
| L-02 | Hardcoded build ID reveals deployment date |
| L-03 | `console.log` statements in production API routes |
| L-04 | Static build ID prevents proper cache busting |
| L-05 | Unpinned dependencies with caret ranges |
| ~~L-06~~ | ~~Duplicate TravelForm component~~ | FIXED: dead copy deleted |

### Remediation Priority

1. **Week 1**: C-02 (payment verification), C-03 (remove test page), H-07 (server-side pricing)
2. **Week 2**: C-04 (rate limiting), C-01 (remove hardcoded email), H-02 (HTML escaping), H-08 (prompt sanitization)
3. **Week 3-4**: Security headers (H-03, H-04, M-02), authentication (C-05), .gitignore (M-07)

---

## Code Quality Issues

### Architecture (IMPROVED)

- **God Object**: `send-itinerary/route.js` still large but reduced (~2,300 lines) — PDF gen, Brevo CRM, Resend delivery
- ~~PDF generation duplicated 3x~~ — PDF gen still per-file but URL builders and email templates extracted to `lib/`
- ~~URL builders duplicated 3x~~ — FIXED: centralized in `lib/url-builders.js`
- ~~Email HTML builder duplicated 2x~~ — FIXED: centralized in `lib/email-templates.js`
- **Shared `lib/` directory** with `plans.js`, `url-builders.js`, `text-utils.js`, `email-templates.js`
- ~~Dead code~~ — FIXED: `app/components/TravelForm.jsx`, `components/Header.jsx`, `test-pago/page.js` deleted

### Files Exceeding 500 Lines

| File | Lines |
|------|-------|
| `api/send-itinerary/route.js` | ~2,300 |
| `pago-exitoso/page.js` | 1,386 |
| `components/TravelForm.jsx` | ~940 |
| `page.js` | 828 |
| `api/generate-pdf/route.js` | ~770 |

### React Patterns (NEEDS IMPROVEMENT)

- Monolithic 828-line landing page with zero component extraction
- 11 useState calls + 22-field formData object without useReducer
- No React.memo, useMemo, or useCallback anywhere
- Inline anonymous async handlers (45+ lines) on every render
- `formData` spread-copied on every single field update

### Next.js (NEEDS IMPROVEMENT)

- All pages use `'use client'` -- zero Server Components (harms SSR/SEO)
- Native `<img>` tags instead of `next/image` (no optimization)
- Hero images via CSS `background-image` bypass optimization (3.3 MB total)
- TravelForm not dynamically imported (970 lines in main bundle)
- `export const dynamic = 'force-dynamic'` on client components (no effect)

### Performance (NEEDS IMPROVEMENT)

- Unoptimized local images: Santorini 1 MB, Tokio 821 KB, Torres del Paine 794 KB
- All 4 hero images load simultaneously
- Exit-intent scroll listener fires on every scroll (no throttle)
- `pdfmake` in production dependencies may inflate client bundle
- `getMesOptions()` creates 18 Date objects on every render

### Accessibility (POOR)

- Missing ARIA labels on close buttons, carousel dots, step indicators
- No focus trapping in modals (Tab escapes to hidden content)
- No skip-to-content link
- Color contrast concerns (white text on orange/pink gradients)
- Form inputs missing `<label>` elements

### SEO (NEEDS IMPROVEMENT)

- Client-side rendering only -- crawlers get empty shell
- No structured data (JSON-LD) for pricing/reviews
- No sitemap.xml or robots.txt
- OG image is SVG (not supported by most platforms)
- GA placeholder non-functional

### Maintainability (POOR)

- No TypeScript (22-field formData flows through entire system untyped)
- Zero tests (no unit, integration, or E2E)
- No ESLint/Prettier config beyond Next.js defaults
- No `.env.example` documenting required variables
- Hardcoded Groq model (`llama-3.3-70b-versatile`)
- Image filenames with spaces require `encodeURI()` workarounds

---

## Top 10 Improvement Priorities

1. ~~Extract shared lib/~~ -- DONE: `plans.js`, `url-builders.js`, `email-templates.js`, `text-utils.js`
2. ~~Delete dead code~~ -- DONE: `app/components/TravelForm.jsx`, `components/Header.jsx`, `test-pago/page.js`
3. **Add payment verification** -- verify MercadoPago `payment_id` status before generating itinerary
4. ~~Server-side price lookup~~ -- DONE: `create-preference` uses `getPlan()` from `lib/plans.js`
5. **Convert landing page to Server Component** -- extract interactive parts as client islands
6. **Add rate limiting** -- `@upstash/ratelimit` on all API routes
7. **Replace `<img>` with `next/image`** -- optimize hero + destination images
8. **Add TypeScript** -- at minimum, define `FormData` interface
9. **Break up God Objects** -- split `send-itinerary/route.js` and `pago-exitoso/page.js`
10. **Add `.env.example`**, `.gitignore`, and basic test suite

---

## Conventions

- Language: Spanish (UI copy, variable names mix Spanish/English)
- Styling: Tailwind CSS primary, inline styles for non-Tailwind pages
- State: React hooks (useState/useEffect), no global state
- Data persistence: localStorage (client), MercadoPago metadata (cross-device)
- Fonts: Syne (headings, 700/800), Inter (body, 300/400/600)
- Animations: CSS fade-in, gradient transitions, carousel auto-rotate (5s)
