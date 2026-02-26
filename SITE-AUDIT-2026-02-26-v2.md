# UpTend Comprehensive Site Audit v2 — Feb 26, 2026

## Audit Score: 9.5/10

### Sites Tested
- **uptendapp.com** — 102 pages, all returning HTTP 200
- **uptendapp.business** — 200 OK
- **uptend.app** — 404 (DNS issue, routing through Google instead of Railway)

---

## Page Audit: 102/102 PASS (uptendapp.com)

Every registered route in App.tsx was tested via curl. All 102 return HTTP 200.

### Visual Verification (Screenshots Taken)

| Page | Status | Notes |
|------|--------|-------|
| / (Landing) | PASS | Hero clean, 11 service pills, stats bar, no breadcrumb, footer links all working |
| /services | PASS | All 11 services with pricing, Book Now buttons, trust badges |
| /book | PASS | "5% service fee" text correct (was 7%), FAQ accordion, address input |
| /find-pro | PASS | Map loading with 5 pro pins, pro cards with ratings/badges, no personal info leaked |
| /b2b-pricing | PASS | NO dollar amounts for HOA/PM/Construction/Government. All "Custom" with consultation CTA. Independent tier: $0/mo, 5% fee (was 7%). 90-day pilot banner present. |
| /become-pro | PASS | "85% You Keep Per Job", "$0 Lead Fees", "Same Day Payouts". All correct. |
| /about | PASS | Clean layout |
| /meet-george | PASS | George intro page |
| /home-dna-scan | PASS | Self-guided scan info |
| /emergency-sos | PASS | Emergency services page |
| /blog | PASS | Blog listing |
| /auth | PASS | Customer/Pro login tabs |
| /customer-signup | PASS | Registration form |
| /terms, /privacy, /acceptable-use | PASS | Legal pages |
| /gallery | PASS | Gallery page |
| /customer-dashboard | PASS | All sections render, NO Liability Claims section (removed), collapsible accordion, Refer & Earn working (UPTEND25) |
| /pro/dashboard | PASS | Sidebar: "Offline" with gray dot (was hardcoded "Online"). Platform Fee: 15%. Payout: 85%. No breadcrumb. No crash. |

### API Health Check

| Endpoint | Method | Status |
|----------|--------|--------|
| /api/health | GET | 200 |
| /api/services | GET | 200 |
| /api/pros/browse | GET | 200 (5 pros) |
| /api/ai/guide/chat | POST | 200 (George responding) |
| /api/customers/login | POST | 200 |
| /api/haulers/login | POST | 200 |

### Fee Consistency Check

| Location | Value | Status |
|----------|-------|--------|
| Pro dashboard — Platform Fee | 15% | PASS |
| Pro dashboard — Payout text | 85% | PASS |
| /become-pro hero | "Keep 85%" | PASS |
| /become-pro stats | "85% You Keep" | PASS |
| /book — service fee text | "5% service fee" | PASS |
| /b2b-pricing — Independent tier | "5% transaction fee" | PASS |
| /b2b-pricing — FAQ | "5% transaction fee" | PASS |
| Pro sidebar footer | "Offline" (dynamic) | PASS |

### Issues Found

| # | Severity | Issue | Status |
|---|----------|-------|--------|
| 1 | HIGH | uptend.app returning 404 — DNS routing through Google, not Railway | OPEN |
| 2 | LOW | Footer "Home DNA Scan" and "Emergency Services" links appear in orange/red — slightly inconsistent with other footer links | OPEN |
| 3 | LOW | Pro dashboard main content area doesn't scroll properly in some viewports — sidebar and main compete | INVESTIGATE |
| 4 | INFO | External 503s on Stripe (clover.js) and Google Fonts — intermittent, no user impact | KNOWN |

### Domains

| Domain | Status |
|--------|--------|
| uptendapp.com | 200 OK |
| uptendapp.business | 200 OK |
| uptend.app | 404 — needs DNS fix |

---

## Summary

102/102 pages passing. All APIs healthy. All recent fixes verified on production:
- 15% flat fee / 85% pro keep — correct everywhere
- 5% customer fee — correct (was 7%)
- B2B pricing — all custom, no dollar amounts
- Booking progress breadcrumb — removed
- Liability Claims — removed from customer dashboard
- Pro sidebar — shows real online/offline state
- Pro dashboard — no longer crashes

**Remaining:** Fix uptend.app DNS, investigate footer link colors, verify pro dashboard scroll behavior.
