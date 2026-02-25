# UpTend Visual Audit — February 25, 2026

Full-page screenshots taken via browser at desktop resolution (~1280px wide).
Screenshots saved in `audit-screenshots/`.

---

## Summary

**Overall impression:** The site is professionally designed with a consistent dark navy/orange brand palette. Most pages are well-structured with working headers, footers, and navigation. However, there are several recurring issues and some page-specific problems that need attention.

### Recurring Issues (Site-Wide)

1. **"Mr. George" floating button partially overlaps content** — appears on right edge of many pages, sometimes overlapping card content (find-pro, sustainability, cost-guides, business/partners)
2. **Orange chat/booking widget (bottom-left)** with badge "2" — overlaps footer logo on some pages (smart-book, snap-quote, meet-george)
3. **Header logo partially obscured** — on several pages the "Up" text in "UpTend" is partially hidden behind the flame icon, making it look like just "Tend" (landing, services, book, contact, cost-guides)
4. **Footer "Home DNA Scan" and "Emergency Services" links are orange/red** — inconsistent with the rest of the footer link colors (all pages)
5. **No breadcrumb navigation** on any page
6. **Spanish toggle ("¿Español? Cambiar →")** only appears on landing page, not site-wide

---

## Page-by-Page Audit

### 1. `/` (Landing Page)
**Screenshot:** `audit-screenshots/01-landing.jpg`

- ✅ Header and footer present and functional
- ✅ Hero section is clear and compelling
- ✅ Service cards, testimonials, "How It Works" all render properly
- ⚠️ **Logo "Up" partially hidden** — flame icon covers the "Up" in "UpTend"
- ⚠️ **"PRICE-PROTECTED • BACKGROUND-CHECKED • LIVE TRACKING" ticker** at bottom of hero — text is very small and hard to read
- ⚠️ **Green "Español" button bottom-right** appears somewhat random/floating
- ⚠️ **Price Protection Guarantee card** — text is quite small, may be missed by users
- ⚠️ Service card images are abstract gradient shapes — could be more descriptive/recognizable

### 2. `/services`
**Screenshot:** `audit-screenshots/02-services.jpg`

- ✅ Header/footer present
- ✅ All 11 service categories displayed with pricing
- ✅ Service filter tabs work visually
- ⚠️ **Very long page** — enormous amount of content, no anchor links or quick-nav
- ⚠️ **"Top Essential Service" badge** at top partially cut off / overlapping header
- ⚠️ **Inconsistent card heights** — some service cards are much taller than others due to varying content
- ⚠️ **Orange checkmarks (✓ Licensed & Insured, ✓ Guaranteed Pricing, etc.)** are very small text
- ⚠️ **"Book Now" buttons are orange** but some appear as dark outlines — inconsistent CTA styling across cards
- ❌ **Snap quote banner** ("Have a photo? Snap a photo and get a price underbilled quote") — text appears cut off or garbled

### 3. `/find-pro`
**Screenshot:** `audit-screenshots/03-find-pro.jpg`

- ✅ Header/footer present
- ✅ Map renders with Leaflet/OpenStreetMap
- ✅ Pro cards with ratings, badges, service tags
- ⚠️ **"Mr. George" button overlaps** Marcus J.'s pro card on right side
- ⚠️ **Map is mostly empty** — only ~5 pins visible, large gray area looks sparse
- ⚠️ **"1+ years experience" and "1 month on UpTend"** shown together is confusing — which is it?
- ⚠️ **All reviews say "New to UpTend — book to be their first reviewer!"** — looks like fake/seeded data
- ⚠️ **Pro avatar initials** (AG, CR, MJ, SM, DC) — no real photos, feels impersonal
- ℹ️ Only 5 pros shown — grid layout has 3+2, bottom row looks unbalanced

### 4. `/book`
**Screenshot:** `audit-screenshots/04-book.png`

- ✅ Header/footer present
- ✅ Clean booking flow with address input
- ✅ FAQ section with expandable questions
- ⚠️ **Logo "Up" partially hidden** in header
- ⚠️ **Page is quite short/thin** — large amount of whitespace between FAQ and footer
- ⚠️ **No service selection visible** — user just enters an address, unclear what they're booking
- ⚠️ **Duplicate of landing page quote widget** — same "Get Instant Quote" section, feels redundant if user navigated here intentionally

### 5. `/become-pro`
**Screenshot:** `audit-screenshots/05-become-pro.jpg`

- ✅ Header/footer present
- ✅ Strong value propositions (85%, $0 lead fees, same-day payouts)
- ✅ Testimonials from pros
- ✅ Step-by-step "How to Become a Verified Pro" section
- ⚠️ **Chat widget overlaps** earning potential cards on left side
- ⚠️ **Founder quote section** — the orange "A" avatar looks generic, no photo of Alan
- ⚠️ **"View Credentials Program" link** — not a button, easy to miss next to bright orange "Apply to Join"

### 6. `/about`
**Screenshot:** `audit-screenshots/06-about.jpg`

- ✅ Header/footer present
- ✅ Strong narrative with Alan's photo
- ✅ Values section, mission statement, impact numbers
- ⚠️ **"Mr. George" button** floats on right, partially overlapping text
- ⚠️ **"Our Values" cards** — image areas are empty gray rectangles (no actual images loaded)
- ⚠️ **"12 Service Verticals" stat** — "Service Verticals" is jargon, unclear to consumers
- ⚠️ **"Proven Impact" stats** use different formatting — "Orlando" as a stat alongside "12" and "85%" is inconsistent
- ⚠️ **Very long scrolling page** — no section anchors

### 7. `/meet-george`
**Screenshot:** `audit-screenshots/07-meet-george.jpg`

- ✅ Header/footer present
- ✅ Clean dark theme, consistent with brand
- ✅ Six capability cards are well-designed
- ✅ "How It Works" 3-step flow is clear
- ⚠️ **No visual of George** — the page is "Meet George" but there's no avatar, illustration, or screenshot of the chatbot
- ⚠️ **"Mr. George" floating button** appears in bottom-right — redundant since this IS the George page
- ⚠️ **"Just Ask George" CTA** in the orange banner — where does it go? No indication of what happens next

### 8. `/snap-quote`
**Screenshot:** `audit-screenshots/08-snap-quote.png`

- ✅ Header/footer present
- ✅ Clean, focused page with clear value prop
- ✅ Upload area with dashed border looks good
- ⚠️ **Upload area is empty** — just an icon and text, could benefit from example photos
- ⚠️ **"Mr. George" button** floating on right edge
- ⚠️ **Chat widget** overlapping footer area on left
- ⚠️ **Page feels sparse** — only 3 sections (hero, how it works, price guarantee), lots of whitespace

### 9. `/smart-book`
**Screenshot:** `audit-screenshots/09-smart-book.png`

- ✅ Header/footer present
- ✅ Service grid is clean with icons
- ✅ 11 services displayed in organized grid
- ⚠️ **Chat widget overlaps footer logo** on left side
- ⚠️ **"Mr. George" button** on right edge
- ⚠️ **Bottom row has only 2 cards** (Light Demolition, Garage Cleanout) — uneven grid, looks incomplete
- ⚠️ **"Or snap a photo" link** — small text, easy to miss
- ⚠️ **No pricing hints** — unlike /services, this shows no starting prices

### 10. `/auth`
**Screenshot:** `audit-screenshots/10-auth.png`

- ✅ Clean login form
- ✅ Homeowner/Pro toggle tabs
- ✅ Google OAuth option
- ⚠️ **Header is present but page feels plain** — no hero, no brand reinforcement
- ⚠️ **Pre-filled email visible** ("capntest@uptend.app") — this is a test account, shouldn't show in production screenshots but may indicate autofill behavior
- ⚠️ **"Mr. George" button and chat widget** present on auth page — unnecessary, could distract from login flow
- ⚠️ **No "Sign Up" tab** — only "Create a free account" link at bottom, which is easy to miss
- ⚠️ **Password field pre-filled** — autofill concern for shared devices

### 11. `/blog`
**Screenshot:** `audit-screenshots/11-blog.jpg`

- ✅ Header/footer present
- ✅ 9 blog posts displayed in 3×3 grid
- ✅ Colorful gradient header images with icons — visually appealing
- ⚠️ **All dates are 2026-02-24 or 2026-02-20** — looks like everything was published at once (bulk-generated feel)
- ⚠️ **No blog categories, tags, or search** — just a flat list
- ⚠️ **No pagination** — what happens when there are more posts?
- ⚠️ **"Mr. George" button** overlapping right-side cards
- ⚠️ **No author attribution** on cards — just dates

### 12. `/contact`
**Screenshot:** `audit-screenshots/12-contact.png`

- ✅ Header/footer present
- ✅ Clean two-column layout: contact info left, form right
- ✅ Phone, email, hours, service area all visible
- ✅ FAQ link card below contact info
- ⚠️ **"Mr. George" button** overlapping the form area on right
- ⚠️ **No CAPTCHA or spam protection visible** on the contact form
- ⚠️ **"Send Message" button** is orange outline style — inconsistent with filled orange buttons elsewhere
- ℹ️ Overall a solid, clean page

### 13. `/faq`
**Screenshot:** `audit-screenshots/13-faq.jpg`

- ✅ Header/footer present
- ✅ Category tabs (General, For Customers, For Businesses, Pricing, About & Trust, For Pros, Staffing)
- ✅ Search bar for FAQs
- ⚠️ **Extremely long page** — dozens of questions all expanded/listed, overwhelming scroll
- ⚠️ **All questions appear collapsed** — hard to scan, no visual hierarchy
- ⚠️ **Numbered items** (1-60+) create a wall of text feel
- ⚠️ **Chat widget** overlaps content on left side
- ⚠️ **Footer is compressed** at bottom — text is very small
- ❌ **Category tabs are cut off** — "Staffing" tab may not be fully visible on smaller screens

### 14. `/sustainability`
**Screenshot:** `audit-screenshots/14-sustainability.jpg`

- ✅ Header/footer present
- ✅ Strong visual hierarchy with stats (600 lbs, 78%, 200+ gal)
- ✅ Four content sections well-organized with icons
- ✅ CTA section at bottom
- ⚠️ **"Mr. George" button** overlapping content on right
- ⚠️ **Chat widget** on left side
- ⚠️ **Stats may be aspirational/projected** — "600 lbs CO2 Saved Per Job" is a bold claim with no source
- ℹ️ Overall a clean, well-designed page

### 15. `/veterans`
**Screenshot:** `audit-screenshots/15-veterans.jpg`

- ✅ Header/footer present
- ✅ Strong hero with dark theme
- ✅ Six benefit cards, MOS mapping tool, success stories
- ✅ Veteran signup form with DD-214 upload
- ⚠️ **"Mr. George" button** overlapping benefit cards on right
- ⚠️ **MOS search input** — the input field appears empty with no placeholder guidance
- ⚠️ **Success stories** — testimonials from "SGT Marcus Rivera (Ret.)" etc. appear fabricated (stock testimonials)
- ⚠️ **Form fields** in "Start Your Journey" have dark backgrounds with dark text — low contrast concern
- ⚠️ **"Disability Rating (optional)" dropdown** — sensitive field, no explanation of why it's asked

### 16. `/pro/signup`
**Screenshot:** `audit-screenshots/16-pro-signup.png`

- ✅ Clean multi-step form with progress tabs
- ✅ Google OAuth option
- ✅ Value props at bottom (85%, verified customers, guaranteed payment)
- ⚠️ **Step tabs are cut off on left** — "Personal Info" tab is partially hidden, horizontal scroll needed
- ⚠️ **Pre-filled email** ("capntest@uptend.app") and password — test data visible
- ⚠️ **No header navigation** — simplified header with just logo and "Back to Home"
- ⚠️ **"Continue to Personal Info" button** is right-aligned only — could be missed
- ⚠️ **Chat widget** present during signup flow — distracting

### 17. `/customer-dashboard`
**Screenshot:** `audit-screenshots/17-customer-dashboard.png`

- ❌ **PAGE NOT FOUND** — returns 404 error
- ❌ **No header or footer** on 404 page — just a centered error card
- ✅ 404 page has "Go Home" and "Browse Services" buttons
- ⚠️ **404 page lacks branding** — no navigation, no footer, feels like a dead end
- ⚠️ **Chat widget and Mr. George button still present** on 404 page

### 18. `/business/partners`
**Screenshot:** `audit-screenshots/18-business-partners.jpg`

- ✅ Header/footer present
- ✅ Clean layout with benefit cards, how-it-works, comparison table
- ✅ Comparison table (UpTend vs Traditional Lead Gen) is effective
- ⚠️ **"Mr. George" button** overlapping cards on right
- ⚠️ **Chat widget** on left
- ⚠️ **Footer is missing** on this page — screenshot shows it cuts off after the CTA section (actually footer may be below fold but page seems truncated)
- ⚠️ **"QuickBooks. Gusto. Jobber. All synced."** with "Integrations coming soon" — promising features that don't exist yet
- ℹ️ Overall solid B2B landing page

### 19. `/cost-guides`
**Screenshot:** `audit-screenshots/19-cost-guides.jpg`

- ✅ Header/footer present
- ✅ 11 service cost guide cards in clean grid
- ✅ Clear pricing ranges and per-unit labels
- ⚠️ **"Orlando Pricing Guides" label** at top is partially cut off by header
- ⚠️ **"Mr. George" button** overlapping cards on right
- ⚠️ **Bottom row has only 2 cards** — unbalanced grid
- ⚠️ **No images on cards** — all text, could benefit from service icons like on /smart-book
- ⚠️ **Chat widget** on left side

### 20. `/service-guarantee`
**Screenshot:** `audit-screenshots/20-service-guarantee.jpg`

- ✅ Clean legal/policy page layout
- ✅ Well-structured with numbered sections
- ✅ Simplified header (logo + "Back to Home")
- ⚠️ **No standard site header** — uses minimal header, inconsistent with rest of site
- ⚠️ **No standard site footer** — uses minimal footer with just legal links
- ⚠️ **"Mr. George" button** appears (labeled "str. George" in screenshot — possible rendering issue)
- ⚠️ **Chat widget** present on legal page — unnecessary
- ⚠️ **Wall of text** — no visual breaks, icons, or highlights to help scanability
- ⚠️ **"Last Updated: February 19, 2026"** — very recent, good

---

## Critical Issues (Fix First)

| Priority | Issue | Pages Affected |
|----------|-------|---------------|
| 🔴 HIGH | `/customer-dashboard` returns 404 | customer-dashboard |
| 🔴 HIGH | Logo "Up" text hidden behind icon in header | Landing, services, book, contact, cost-guides |
| 🔴 HIGH | Step tabs cut off on pro signup (horizontal overflow) | pro/signup |
| 🟡 MED | "Mr. George" button overlaps page content | 12+ pages |
| 🟡 MED | Chat widget overlaps footer/content | 10+ pages |
| 🟡 MED | "Our Values" cards show empty gray image areas | about |
| 🟡 MED | 404 page has no header/footer navigation | customer-dashboard (and any 404) |
| 🟡 MED | Blog posts all dated same day — looks auto-generated | blog |
| 🟡 MED | FAQ page is overwhelmingly long with no hierarchy | faq |
| 🟡 MED | Inconsistent header/footer on legal pages vs main pages | service-guarantee |
| 🟢 LOW | Unbalanced grid rows (2 cards in last row) | smart-book, cost-guides |
| 🟢 LOW | No breadcrumbs anywhere | all pages |
| 🟢 LOW | Spanish toggle only on landing page | site-wide |
| 🟢 LOW | Footer "Home DNA Scan" and "Emergency Services" in different color | all pages |

---

## Overall Grade: **B-**

The site looks professional and the brand is consistent. The dark navy + orange palette works well. Content is comprehensive. However, the floating widgets (Mr. George + chat) cause overlap issues on nearly every page, the logo rendering is broken, and there are several 404/missing pages. The blog and testimonials feel auto-generated. The FAQ needs restructuring. Fix the critical issues and this becomes a solid B+/A-.
