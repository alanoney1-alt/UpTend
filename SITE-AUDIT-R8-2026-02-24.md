# UpTend Site Audit — Round 8
**Date:** 2026-02-24  
**Auditor:** OpenClaw (automated)  
**URL:** https://uptendapp.com  
**Browser:** openclaw profile, hard refresh on every page

---

## 1. Verified Changes (Pass/Fail)

### /book Page Rebuild
| Check | Result |
|-------|--------|
| Hero headline "Book a Home Service" | ✅ PASS |
| 3 trust badges (Price Guarantee, Background Checked, Insured Pros) | ✅ PASS |
| 3-step "How it works" row | ✅ PASS |
| FloridaEstimator renders below | ✅ PASS (address input + Get Instant Quote) |
| FloridaEstimator shows all 11 services | ⚠️ PARTIAL — Estimator shows address input only, no service selector grid visible on /book (services visible on landing page) |
| FAQ accordion with 4 questions | ✅ PASS (How does pricing work? / What if I'm not satisfied? / Are your pros licensed and insured? / Can I cancel or reschedule?) |
| Apple-level polish | ✅ PASS — Clean, minimal, professional. Trust badges + steps + estimator + FAQ flow is excellent |

### /find-pro Enriched Pro Cards
| Check | Result |
|-------|--------|
| Colored avatar circles with initials | ✅ PASS (AG=green, CR=blue, MJ=purple, SM=pink, DC=teal) |
| Star ratings as actual star icons | ✅ PASS (gold filled stars visible in screenshot) |
| Prominent "Verified Pro" badge | ✅ PASS (green badge with checkmark) |
| Service tag pills | ✅ PASS (gray rounded pills: "Home Cleaning", "Carpet Cleaning", etc.) |
| Dual "Book Now" / "View Profile" buttons | ✅ PASS (orange Book Now + outlined View Profile) |
| Map markers as orange pins | ✅ PASS (confirmed in screenshot — orange/gold map pins) |

### Landing Page Tightened
| Check | Result |
|-------|--------|
| ~5 sections (not 10) | ✅ PASS — 6 sections: Hero+Quote → Services → The Fix (Homeowners/Pros) → Testimonials → CTA |
| Quote tool near the top | ✅ PASS (immediately below hero) |
| Flow: Hero+Quote → Services → How It Works → Testimonials → CTA | ⚠️ SLIGHT DEVIATION — "How It Works" is embedded in "The Fix" dual-panel, not a standalone section. Flow is: Hero+Quote → Services → The Fix (includes value props) → Testimonials → CTA. Works well. |

---

## 2. Page-by-Page Scores

### Landing Page (/) — 8.5/10
- **Visual polish:** Excellent. Dark hero, orange accents, clean typography
- **Content flow:** Tight and logical. Hero → Quote → Services → Value Props → Testimonials → CTA
- **Pricing:** Consistent (11 services with "From $XX" format)
- **Emojis:** Zero ✅
- **Issues:**
  - "Home DNA Scan" still in footer "Our Services" list (links to /services/home-audit)
  - "Home DNA Scan" also in footer "For Pros" section (links to /home-dna-scan)
  - Mr. George banner at top ("Meet Mr. George — your AI assistant") could feel cluttered on first visit

### /book — 8.5/10
- **Visual polish:** Clean, focused, professional
- **Trust signals:** Excellent (badges + steps + FAQ)
- **Issues:**
  - No service selector/grid — user lands on address input without choosing a service first. The 3-step flow says "1. Choose your service" but there's no service chooser visible
  - "Home DNA Scan" in footer
  - Mobile: bottom nav bar (Home/Book/My Jobs/Profile) appears — good for app feel

### /find-pro — 9/10
- **Visual polish:** Best page on the site. Pro cards are excellent.
- **Map + cards:** Professional, trustworthy layout
- **Issues:**
  - "Home DNA Scan" still in service filter dropdown
  - Ana G. has "Home DNA Scan" as a service tag — should this be removed from pro profiles?
  - No footer visible (page ends at pro cards) — inconsistent with other pages

### /services — 8.5/10
- **Visual polish:** Clean card layout, good "Jump to" nav
- **Content:** All 11 services with pricing, features, and Book Now buttons
- **Issues:**
  - Home DNA Scan NOT listed as a bookable service (correct — removed from service cards)
  - But still referenced in Junk Removal description ("360° Home DNA Scan")
  - "Home DNA Scan" in footer

### /pricing — 8.5/10
- **Visual polish:** Comprehensive pricing cards
- **Content:** Detailed tier breakdowns for all 11 services + liability protection section
- **Issues:**
  - "Home DNA Scan" in footer
  - Banner at top: "You can scan your home for FREE and earn $25+ in credits!" — links to /ai/home-scan. Is this still a valid offering?
  - Junk removal starts at $99 (minimum load) but also shows "$179 for 1/8 truck" — slight confusion on actual minimum

### /meet-george — 8/10
- **Visual polish:** Good feature showcase (12 capabilities)
- **Content:** Well-organized with icons and descriptions
- **Issues:**
  - No footer visible in snapshot (may be below fold)
  - "140 tools. 13 AI capabilities" claim — verify accuracy

### /home-dna-scan — 8.5/10
- **Visual polish:** Impressive. Stats, scan categories, pricing tiers, sample report
- **Content:** Well-structured sales page
- **Issues:**
  - Page still exists and is well-maintained (correct per requirements)
  - Standard: $99, Premium: $249 — pricing clear
  - "Home DNA Scan" remains in footer (expected since the page exists)

### /about — Not checked this round (lower priority)

### /business — Not checked this round (lower priority)

---

## 3. Mr. George Chat Test

**Question:** "How much does pressure washing cost?"  
**Response:** "Pressure washing starts at $120 for smaller areas, and it's $0.25 per square foot for larger spaces. Most driveways run about $150-200 depending on size..."

| Check | Result |
|-------|--------|
| Emojis in response | ✅ ZERO emojis — server-side strip working |
| Pricing accuracy | ✅ Matches /pricing page ($120 starting) |
| Professional tone | ✅ Conversational but professional |
| CTA buttons present | ✅ "See what we offer" / "Get a closer estimate" / "I'm a Pro" |
| Helpful/Not helpful feedback | ✅ Present |

---

## 4. Mobile Check (390px width)

### /book Mobile
- ✅ Trust badges wrap nicely (2 + 1 row)
- ✅ 3-step icons stack well
- ✅ Quote input is full-width and usable
- ✅ FAQ accordion works
- ✅ Bottom nav bar appears (Home/Book/My Jobs/Profile) — good mobile UX
- ⚠️ "Instant results" text gets cut on one line (minor)

### Landing Page Mobile
- ✅ Hero text readable, CTA buttons prominent
- ✅ Service grid wraps to 2-column
- ✅ "The Fix" dual panel stacks to single column
- ✅ Testimonials readable
- ⚠️ Mr. George chat bubble overlaps some content in bottom-right
- ⚠️ Hero text "Book Your Home Service. Without the headache. Instant quotes." wraps awkwardly with periods

---

## 5. Persistent Issues Across Pages

1. **"Home DNA Scan" in footer "Our Services"** — Still listed on every page. Should be removed from the main service list per previous rounds. The /home-dna-scan standalone page is fine to keep.
2. **"Home DNA Scan" in footer "For Pros" section** — Orange/highlighted link. Intentional?
3. **"Home DNA Scan" in /find-pro service filter** — Should be removed from dropdown
4. **Ana G. pro card lists "Home DNA Scan"** — Should be removed from her service tags
5. **Junk Removal references "360° Home DNA Scan"** on /services page — vestigial reference

---

## 6. Overall Score

| Category | Score |
|----------|-------|
| Landing Page | 8.5/10 |
| /book | 8.5/10 |
| /find-pro | 9/10 |
| /services | 8.5/10 |
| /pricing | 8.5/10 |
| /meet-george | 8/10 |
| /home-dna-scan | 8.5/10 |
| Mr. George Chat | 9/10 |
| Mobile (390px) | 8/10 |
| **Overall** | **8.5/10** |

---

## 7. What's Needed for 9/10

1. **Remove "Home DNA Scan" from footer service list** on all pages
2. **Remove "Home DNA Scan" from /find-pro filter dropdown**
3. **Remove "Home DNA Scan" from Ana G.'s service tags**
4. **Add service selector to /book page** — The 3-step flow says "Choose your service" but there's no service chooser. Either add service cards/buttons before the address input, or remove step 1 from the visual flow
5. **Clean up Junk Removal "360° Home DNA Scan" reference** on /services
6. **Add footer to /find-pro page** for consistency

## 8. What's Needed for 10/10

Everything above, plus:
1. **Micro-interactions** — Hover animations on service cards, smooth scroll between sections
2. **Social proof numbers** — "500+ jobs completed" or "Serving 12 Orlando neighborhoods" with real data
3. **Real pro photos** — Replace initials-in-circles with actual headshots (when available)
4. **Before/after gallery** — Photo evidence of work quality on landing page or /services
5. **Speed optimization** — Lazy-load map on /find-pro, optimize LCP
6. **SEO meta** — Verify all pages have unique title/description tags
7. **Testimonial attribution** — Add star ratings to testimonial cards
8. **Loading states** — Skeleton screens for estimator and pro cards
9. **Error states** — What happens if address lookup fails? Test edge cases
10. **Accessibility audit** — Tab order, ARIA labels, color contrast ratios
