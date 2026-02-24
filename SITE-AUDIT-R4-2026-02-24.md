# UpTend Site Audit — Round 4
**Date:** 2026-02-24  
**Auditor:** OpenClaw  
**URL:** https://uptendapp.com

---

## PAGE SCORECARD

| # | Page | Score | Notes |
|---|------|-------|-------|
| 1 | `/` (Landing) | **8/10** | Strong hero, good copy, broken map markers, Mr. George chat has emojis, "The Fix" label floating near services section |
| 2 | `/services` | **8/10** | Clean layout, all 11 services + Home DNA Scan. "Home DNA Scan" branding correct. Good pricing cards. |
| 3 | `/pricing` | **8/10** | Transparent, well-organized. Liability protection section is a strong trust signal. No emojis. All "Home DNA Scan" references correct. |
| 4 | `/find-pro` | **5/10** | **CRITICAL: Map markers are broken** — showing "Mark+" broken image text instead of pin icons. 5 demo pros visible (Ana G, Carlos R, Marcus J, Sarah M, David C) — good. Pro cards look professional. |
| 5 | `/meet-george` | **7/10** | **Emoji in heading** — "Meet Mr. George 🏠" has a house emoji. Should be zero emojis. Feature grid is clean and well-organized. "140 tools. 13 AI capabilities" is a strong line. |
| 6 | `/book` | **8/10** | Clean, simple booking page. Address input + instant quote. Footer correct. Feels a bit sparse — just a single input and footer. Could use more context/trust signals. |
| 7 | `/about` | **8.5/10** | Strong founder story. "I built UpTend because the system was broken" is compelling. Three pillars (Protect, Connect, Sustain) well-presented. "Proven Impact" stats: 12 Service Verticals, 24/7 AI Support, Orlando Born and Built, 100% Guaranteed Pricing. Good. |
| 8 | `/become-pro` | **8.5/10** | Professional. Green Track Record angle is unique. "Keep 80% of Every Job" is a strong hook. Founder quote section uses "A" avatar instead of photo — minor. 4-step signup clear. |
| 9 | `/customer-login` | **7/10** | Clean login form. No nav bar (just "Back to Home" link). Purple background is different from rest of site — slight brand inconsistency. |
| 10 | `/pro-login` | **8/10** | "Mission Control" branding is clever. Has nav bar (unlike customer login — inconsistency). Homeowner/Pro tab toggle is good UX. |
| 11 | `/home-dna-scan` | **9/10** | Best page on the site. Strong headline "Your Home Has DNA." Pricing clear ($99 Standard / $249 Premium). FAQ section. Report preview mockup. All branding correct — no "AI Home Scan" references. |
| 12 | `/emergency` | **8.5/10** | Clear, urgent design. Phone number prominent. 911 disclaimer good. 7 emergency types with color-coded cards. Clean. |
| 13 | `/blog` | **7.5/10** | 9 posts, all dated 2026-02-20 or 2026-02-24. No images on cards — text-only grid feels plain. No blog post thumbnails/featured images. Content quality looks solid. |
| 14 | `/cost-guides` | **8/10** | 11 service cost guides. Clean cards. Orange pricing stands out. Professional. |
| 15 | `/academy` | **8/10** | Clean. Verify a Pro badge checker is a nice touch. 8 trust features well-presented. |

---

## REMAINING ISSUES — Prioritized

### 🔴 CRITICAL (Must Fix)

1. **Broken map markers on `/find-pro` AND landing page** — Map pin icons show as broken image placeholders with "Mark+" alt text. This is the most visible bug on the site. The Leaflet marker icon path is likely wrong or the image file is missing. Fix: ensure `/marker-icon.png` or equivalent Leaflet default icon is served correctly.

2. **Emoji on `/meet-george` heading** — "Meet Mr. George 🏠" has a house emoji. Policy is zero emojis on the site.

3. **Mr. George chat widget has emojis everywhere** — The chat bubble button says "🏠 Mr. George 👋", quick action buttons use 🚀, 🏠, 📸, 🔧, and the chat responses use emojis. If the zero-emoji policy applies to the chat widget too, this needs a full pass.

### 🟡 MEDIUM (Should Fix)

4. **Customer login page (`/customer-login`) has no nav bar** — Just a "Back to Home" link. Pro login has the full nav bar. Inconsistent.

5. **Customer login purple background** — Different from the dark navy used across the rest of the site. Feels like a different app.

6. **Blog posts have no images/thumbnails** — Every card is text-only. Looks unfinished compared to the rest of the site. Even placeholder illustrations would help.

7. **"The Fix" label** — On the landing page near the services grid, there's a floating "The Fix" label/badge that seems orphaned. Purpose unclear.

8. **`/book` page feels empty** — Just an address input and footer. No service selection, no trust signals, no "here's what happens next." Compare to the rich landing page — this feels like a skeleton.

### 🟢 LOW (Polish)

9. **Become-Pro founder quote uses "A" avatar** — Should use Alan's actual photo for authenticity.

10. **All blog posts dated same day** — 6 of 9 posts are dated 2026-02-24 (today). Looks like they were all published at once. Stagger the dates for authenticity.

11. **Landing page "¿Español? Cambiar →"** — Good for bilingual users but the arrow is plain text. Could be styled as a more visible toggle.

12. **Home DNA Scan page** — One of the stats says "72% Of homeowners don't know their water heater's age" — verify this stat is sourced/accurate.

13. **Cost guides page** — The "Orlando Pricing Guides" badge at top is cut off slightly.

---

## FOOTER VERIFICATION (All Pages)

| Check | Status |
|-------|--------|
| hello@uptendapp.com | ✅ Present on all pages |
| (407) 338-3342 | ✅ Present on all pages |
| Social links (FB, IG, TikTok) | ✅ Present on all pages |
| No admin link | ✅ Clean — no admin links |
| "Home DNA Scan" (not "AI Home Scan") | ✅ Correct everywhere |
| Emergency Services link (orange) | ✅ Present in footer |
| Copyright 2026 | ✅ Correct |

---

## SPECIFIC VERIFICATIONS

| Check | Status |
|-------|--------|
| Map markers = proper pin icons | ❌ **BROKEN** — both landing page and /find-pro |
| Find a Pro shows demo pros | ✅ 5 demo pros with ratings, reviews, services |
| George chat works | ✅ Chat opens, responds, knows about Home DNA Scan |
| George knows about Home DNA | ✅ Detailed response about Home DNA Scan including $45 pro payout, certification |
| Booking flow works | ✅ Address input on /book page functional |
| Mobile responsive (390px) | ✅ Landing page stacks properly, readable, no overflow |
| No "AI Home Scan" references | ✅ All rebranded to "Home DNA Scan" |
| No emojis on pages | ❌ Emoji on /meet-george heading + Mr. George chat widget |

---

## DESIGN QUALITY ASSESSMENT

### What looks Apple-level:
- **Landing page hero** — Bold typography, clear CTA, dark background. Professional.
- **Home DNA Scan page** — Best designed page. Strong visual hierarchy, compelling copy, clear pricing.
- **Emergency page** — Functional, clear, appropriately urgent.
- **Pricing page** — Clean card layout, liability protection section adds trust.
- **Service cards** — Consistent formatting across all 11 services.

### What looks developer-grade:
- **Blog page** — No images, no visual personality. Functional but bland.
- **Book page** — Too sparse. Feels like a forgotten page.
- **Customer login** — Purple background breaks the brand. Minimal.
- **Map markers** — Broken images are the most amateur-looking thing on the entire site.

### Consistency:
- **Good:** Navigation, footer, color scheme (dark navy + orange), typography are consistent across 13/15 pages.
- **Bad:** Customer login is visually disconnected (purple bg, no nav). Pro login has nav but customer doesn't.

### Contrast & Readability:
- ✅ All text is readable. White/light text on dark backgrounds works well.
- ✅ Orange accent colors have sufficient contrast.
- Minor: Some light gray text on white cards (pricing page) could be slightly darker.

### Spacing:
- ✅ Generally good. Sections breathe well.
- The landing page is long but each section is well-separated.
- Blog cards could use more internal padding.

---

## OVERALL SCORE: **7.5 / 10**

The site is solid and professional for a startup. The core pages (landing, services, pricing, Home DNA, emergency, about) are well-designed. But the broken map markers, emoji violations, and a few underdeveloped pages (blog, book) hold it back.

---

## WHAT'S NEEDED FOR 10/10

1. **Fix map marker icons** — This is the single biggest visual bug. Both landing page and /find-pro. Likely a Leaflet icon path issue. Should take 5 minutes.

2. **Remove all emojis** — /meet-george heading, Mr. George chat widget buttons and messages. Replace with SVG icons or plain text.

3. **Add blog post images** — Each post needs at least a hero/thumbnail image. Even AI-generated illustrations of homes, tools, etc.

4. **Redesign `/book` page** — Add service selection cards, trust badges, "What happens next" steps, maybe testimonial snippet. Currently too bare.

5. **Unify login pages** — Both customer and pro login should have the same nav bar and background treatment. Use the dark navy, not purple.

6. **Stagger blog dates** — Backdate posts to look organic (spread over weeks/months).

7. **Add founder photo to become-pro quote** — Replace the "A" avatar with Alan's actual photo.

8. **Add micro-interactions** — Hover effects on cards, smooth scroll, subtle animations on the feature grids. This is what separates "good" from "Apple-level."

9. **Add Open Graph / social preview images** — For sharing on social media (not checked in this audit but likely missing).

10. **Performance audit** — Check page load times, image optimization, Core Web Vitals (not covered in this visual audit).
