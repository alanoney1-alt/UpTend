# UpTend QA Report — February 12, 2026

**Tester:** OpenClaw QA Bot  
**Date:** 2026-02-12 00:09–00:20 EST  
**Environment:** localhost:5000, Vite dev server, Mac mini (arm64)  
**Severity Scale:** 🔴 Critical (blocks launch) | 🟡 Medium | 🟢 Minor

---

## 🔴 SHOWSTOPPER: Intermittent White Screen of Death (WSOD)

**The entire app crashes to a blank white page intermittently.** This is the #1 issue that MUST be fixed before launch.

### Root Cause
- **"Invalid hook call"** error in `<TooltipProvider>` → `<App>` component
- The Vite dev server produces multiple versions of React chunks with different `?v=` cache-busting hashes (e.g., `chunk-LPF6KSF2.js?v=50aaea66` vs `?v=80bf7ec3` vs `?v=dc255099`)
- When the server restarts or HMR fails, the browser loads modules from mixed versions → two React copies → hooks crash → blank page
- **Vite HMR WebSocket always fails** (`ws://localhost:5000/vite-hmr` → 400, falls back to `ws://localhost:5173` → refused). This means HMR never works, so every code change requires a full page reload
- The **Service Worker** aggressively caches old responses, making the stale-module problem worse

### Impact
- After any server restart, users see a **permanent white screen** until they hard-refresh with cache clear
- Happened on `/`, `/customer-login`, and likely all routes
- No error boundary catches this — just a blank page with no user feedback

### Fix Required
1. Fix HMR WebSocket configuration (the `/vite-hmr` path isn't being proxied through the Express WebSocket handler properly — conflicts with the `/ws` WebSocket for the app)
2. Add a React Error Boundary wrapper around `<App>` that shows "Something went wrong, please refresh"
3. Disable or fix the Service Worker for dev mode — it's caching stale Vite assets
4. **For production:** Build static assets (`npm run build`) — this eliminates the Vite dev server issue entirely. DO NOT deploy the dev server to production.

---

## ❌ FAILED — Broken Things

### F1. 🔴 Server Crashes Under Load
- The Express/Vite server crashes repeatedly during normal browsing
- After serving a few pages, `lsof -i :5000` shows nothing — server silently exits
- No error message in logs before crash
- **Impact:** Users will get connection refused randomly

### F2. 🔴 Vite HMR WebSocket Completely Broken
- **URL:** Every page
- **Error:** `WebSocket connection to 'ws://localhost:5000/vite-hmr' failed: Unexpected response code: 400`
- Falls back to `ws://localhost:5173` which also fails (ERR_CONNECTION_REFUSED)
- **Impact:** Developers can't hot-reload; contributes to WSOD bug

### F3. 🟡 PWA Icon Missing
- **Error:** `Error while trying to use the following icon from the Manifest: http://localhost:5000/icons/icon-144x144.png (Download error or resource isn't a valid image)`
- The 144x144 icon referenced in manifest.json doesn't exist or is corrupt
- **Impact:** PWA install prompt may fail; mobile "Add to Home Screen" won't work properly

### F4. 🟡 PostCSS Warning
- `A PostCSS plugin did not pass the 'from' option to 'postcss.parse'`
- Appears on every CSS transformation
- **Impact:** Could cause imported CSS assets to be incorrectly transformed

### F5. 🟡 Missing Environment Variables
- `AI_INTEGRATIONS_OPENAI_API_KEY` — AI features won't work
- `SENDGRID_API_KEY` — Email notifications won't send
- `TWILIO_ACCOUNT_SID/AUTH_TOKEN/PHONE_NUMBER` — SMS notifications won't work
- `REPL_ID` — Some features may not work
- **Impact:** AI Guide, email notifications, and SMS booking updates will all fail silently

### F6. 🟡 Google Maps API Key Exposed in Client Response
- `GET /api/google/places-key` returns `{"apiKey":"AIzaSyD-TsZZcOLsrGK54U18qVRyOaQU7KmSyLg"}`
- This key is visible to anyone with dev tools open
- **Impact:** API key should be restricted by HTTP referrer on Google Cloud Console

---

## ⚠️ WARNING — Things That Work But Need Attention

### W1. Spanish Translation Incomplete
- **URL:** `/` (landing page)
- Most of the page translates correctly when set to Spanish (ES)
- **NOT translated (still in English):**
  - "All Services" heading
  - Service card names: "Junk Removal", "Pressure Washing", "Gutter Cleaning", "Moving Labor", "Handyman Services", "Light Demolition", "Garage Cleanout", "Home Cleaning", "Pool Cleaning", "Landscaping", "Carpet Cleaning"
  - Service card prices: "From $99", "From $120", etc.
  - AI Home Audit section: "Complete home documentation: Standard ($49)..."
  - "$49 / $149" pricing text
- **Footer "Conectar" section** mixes English and Spanish: "Questions? Call us at (407) 338-3342" is in English while surrounded by Spanish text

### W2. AI Guide Widget Auto-Opens and Blocks Forms
- **URL:** `/customer-signup`, potentially all pages
- The UpTend Guide chat widget opens automatically and covers the signup form
- Users can't see or interact with form fields behind it
- Minimizing it doesn't prevent it from re-opening
- **Fix:** Don't auto-open the guide on form pages, or at minimum keep it minimized by default

### W3. Footer Links Point to `/services/material-recovery` Instead of `/services/junk-removal`
- The footer "Remoción de Basura" (Junk Removal) link goes to `/services/material-recovery`
- This is inconsistent with the main nav which uses `/services/junk-removal`
- May be intentional (rebranding) but could confuse users if the routes don't all resolve

### W4. Signup Form Has Autofill Leakage
- Email field on `/customer-signup` was pre-filled with `testcustomer1@uptend.app` from a previous session
- This could be browser autofill, but the field should use `autocomplete="off"` or `autocomplete="new-email"` to prevent leaking other users' emails on shared computers

### W5. Footer Contact Section Says "Serving Greater Orlando Metro" — Verify This Is Still Correct
- If expanding to other markets, this needs to be updated

### W6. No 404 Page Verified
- Could not verify `/nonexistent-page` behavior due to server crashes
- SPA likely shows content for any route (falls through to index.html) — needs explicit 404 handling

### W7. Slow First Load (~20-30 seconds)
- Vite needs to pre-bundle all dependencies on first request
- First visit to `http://localhost:5000/` takes 20-30+ seconds
- **For production:** Pre-build with `npm run build` to serve static assets instantly

---

## ✅ PASSED — Things That Work

### P1. Landing Page (when it loads)
- ✅ Hero section renders with correct branding and messaging
- ✅ Service cards display with images, names, and pricing
- ✅ Navigation links present: Services, Pricing, About, Academy, Join the Pros, Log In, Book Now
- ✅ Footer with complete service links, contact info, phone/email
- ✅ UpTend Guide chat widget present with input field, voice button, photo upload
- ✅ Instant Quote widget with address input field
- ✅ "What does UpTend mean?" section explains the brand
- ✅ Three-phase value prop (Intelligence, Action, Impact)
- ✅ Trust section (Criminal Background, $1M Insurance, Real-Time Tracking)
- ✅ "Why we built UpTend" story section
- ✅ "Two-Sided Promise" section for pros
- ✅ "What do I get for $49?" Home Health Check section
- ✅ "Build a Verified Green Track Record" pro recruitment section
- ✅ Spanish toggle works (ES ↔ EN)

### P2. Customer Signup (`/customer-signup`)
- ✅ Form renders with: First Name, Last Name, Email, Phone, SMS consent checkbox, Password, Confirm Password
- ✅ Security messaging present ("Your information is secure and encrypted")
- ✅ Payment notice: "no charges until you confirm a booking"
- ✅ "Already have an account? Sign in" link present → `/customer-login`
- ✅ "Back to Home" link works

### P3. API Endpoints
- ✅ `POST /api/customers/login` — works (`testcustomer1@uptend.app` / `TestPass123!`)
- ✅ `POST /api/pros/login` — works (`testpro1@uptend.app` / `TestPass123!`)
- ✅ `POST /api/admin/login` — works (`UpTendAdmin2026!`)
- ✅ `GET /api/auth/user` — returns user data with session cookie
- ✅ `GET /api/google/places-key` — returns API key
- ✅ `POST /api/analytics/track` — tracking events work
- ✅ Stripe integration initialized: Account `acct_1SnpmiQ0k7kxrNee`, charges enabled

### P4. Server Features
- ✅ WebSocket server initialized on `/ws`
- ✅ Matching Timer running (every 5 seconds)
- ✅ Location Cleanup service running (hourly)
- ✅ ESG Auditor scheduled
- ✅ Property Intelligence cron jobs running
- ✅ Helmet security middleware active
- ✅ CORS configured
- ✅ Rate limiting on API endpoints (10,000/15min dev, 200/15min prod)
- ✅ Auth rate limiting (20/15min)

---

## 💰 PRICING CHECK — All Prices Found

### Landing Page Service Cards
| Service | Price Shown | Notes |
|---------|------------|-------|
| AI Home Audit | $49 / $149 | Standard vs Aerial |
| Junk Removal | From $99 | |
| Pressure Washing | From $120 | |
| Gutter Cleaning | From $149 | |
| Moving Labor | $80/hr | |
| Handyman Services | From $49/hr | |
| Light Demolition | From $199 | |
| Garage Cleanout | From $299 | |
| Home Cleaning | From $99 | |
| Pool Cleaning | From $69 | |
| Landscaping | From $35 | |
| Carpet Cleaning | From $49 | |

### Home Health Check Section
- Price: **$49** for 30-minute audit
- Credited 100% toward first booking
- Report Card mentions: Roof Shingles (CRITICAL), Driveway Algae, Garage Clutter
- "Total Audit Value: $250"
- Book Audit button: "$49"
- $49 credit toward first/next booking included in both Standard and Aerial packages

### $1M Liability Insurance
- Mentioned in Trust section: coverage up to $1,000,000

### ⚠️ Pricing Consistency Issues
- Could not verify individual service page pricing due to server crashes
- Could not verify booking flow pricing or bundle discount calculation
- **Landing page prices shown above should be cross-referenced with service detail pages and booking flow**

---

## 🔧 TESTS NOT COMPLETED (Server Instability)

Due to repeated server crashes, the following could NOT be tested:

1. **Booking Flow** — Could not complete any booking (junk removal, pressure washing, home cleaning, or bundles)
2. **Customer Dashboard** — Could not verify Home Score, Impact, Job History, Subscriptions, Referral, Loyalty
3. **Pro Dashboard** — Could not verify job list, accept/start/complete flow, earnings
4. **Admin Panel** — Could not verify dashboard, jobs list, users list
5. **Individual Service Pages** — `/services/junk-removal` through `/services/carpet-cleaning`
6. **AI Pages** — `/ai`, `/ai/photo-quote`, `/ai/document-scanner`
7. **Other Pages** — `/about`, `/faq`, `/contact`, `/sustainability`, `/become-pro`
8. **Edge Cases** — Validation errors, 404 page, auth redirects, double-submit prevention
9. **Mobile Responsiveness** — Could not resize and test
10. **Bundle Discount Calculation** — 10% discount verification impossible without working booking flow

---

## 🎯 PRIORITY FIX LIST (For Tomorrow's Deploy)

### Must Fix Before Launch (🔴)
1. **Build for production** — Do NOT deploy the Vite dev server. Run `npm run build` and serve static assets.
2. **Fix server crash bug** — The Express server silently exits under normal use
3. **Add Error Boundary** — Wrap `<App>` so crashes show a "please refresh" message instead of white screen
4. **Remove/disable Service Worker** in production or ensure it properly cache-busts on deploys

### Should Fix (🟡)
5. Complete Spanish translations for service cards and AI sections
6. Fix PWA icon-144x144.png
7. Don't auto-open Guide widget on form pages
8. Set up required environment variables (OpenAI, SendGrid, Twilio)
9. Restrict Google Maps API key by HTTP referrer

### Nice to Have (🟢)
10. Fix PostCSS warning
11. Add proper 404 route handling
12. Fix Vite HMR WebSocket for development

---

*Report generated by OpenClaw QA at 2026-02-12 00:25 EST*
