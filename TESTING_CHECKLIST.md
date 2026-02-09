# UpTend Master Implementation Testing Checklist

**Date:** February 8, 2026
**Status:** Ready for QA Testing

## Testing Priority Levels

- 🔴 **Critical**: Must work for production
- 🟡 **High**: Important for user experience
- 🟢 **Medium**: Nice to have, non-blocking

---

## 1. DwellScan Two-Tier Pricing Tests

### 🔴 Critical Tests

- [ ] **DwellScan Standard Booking ($49)**
  - Go to /book, select "DwellScan™ (Home Audit)"
  - Select "Standard" tier
  - Price shows $49
  - Complete booking
  - Verify Pro gets $25 payout
  - Verify customer gets $49 credit in their account

- [ ] **DwellScan Aerial Booking ($149)**
  - Go to /book, select "DwellScan™ (Home Audit)"
  - Select "Aerial" tier
  - Price shows $149
  - Complete booking
  - Verify 2-Pro dispatch OR 1 combined-certified Pro
  - Verify payouts: 2-Pro model (walkthrough $25, drone $55) OR 1-Pro model ($80)
  - Verify customer gets $49 credit

- [ ] **$49 Credit Application**
  - Complete a DwellScan (either tier)
  - Verify $49 credit shows in account
  - Book another service within 90 days
  - Credit automatically applied at checkout
  - Credit deducted BEFORE percentage discounts
  - Verify credit expires after 90 days

### 🟡 High Priority Tests

- [ ] **Tier Selection UI**
  - Standard tier: Shows all 7 includes
  - Aerial tier: Shows "RECOMMENDED" badge
  - Aerial tier: Shows value comparison "$290-$350 elsewhere"
  - Mobile responsive on both tiers
  - Selection state persists through booking flow

- [ ] **Cross-Sell Prompts**
  - After DwellScan Standard completion → Shows upgrade to Aerial for $100
  - After any other service → Shows DwellScan booking prompt
  - Dismiss button works
  - CTA buttons navigate correctly

---

## 2. PolishUp Dynamic Pricing Tests

### 🔴 Critical Tests

- [ ] **Base Price Matrix**
  - Studio/1BR 1BA Standard: $99
  - 3BR 2BA Deep: $299
  - 4BR 3BA Move-Out: $529
  - Verify all 9 property sizes calculate correctly

- [ ] **Multiplicative Modifiers**
  - 3BR 2BA Deep base $299 + 2-story (×1.15) = ~$344
  - 3BR 2BA Deep base $299 + 3-story (×1.25) = ~$374
  - 3BR 2BA Deep base $299 + 3,000+ sqft (×1.10) = ~$329
  - 3BR 2BA Deep base $299 + not cleaned 6+ months (×1.20) = ~$359
  - All modifiers stack correctly (multiply together, then apply)

- [ ] **Additive Modifiers**
  - Any quote + pets: +$25
  - Any quote + same-day booking: +$30
  - Both: +$55 total

- [ ] **Complete Calculation**
  - 3BR/2BA, 2-story, pets, last cleaned "never", same-day
  - Base: $299
  - Multiply: ×1.15 (stories) ×1.20 (last cleaned) = $412
  - Add: +$25 (pets) +$30 (same-day) = $467
  - Verify final price: $467

### 🟡 High Priority Tests

- [ ] **Pro Staffing Logic**
  - Standard clean any size: 1 Pro
  - Deep clean 1-2BR: 1 Pro
  - Deep clean 3+BR: 2 Pros
  - Move-out 1-2BR: 2 Pros
  - Move-out 3+BR: 3 Pros

- [ ] **Duration Estimation**
  - Standard 3BR: ~3-3.5 hours
  - Deep 3BR with 2 Pros: ~4-5 hours (accounts for parallel work)
  - Move-out 4BR with 3 Pros: ~5-6 hours
  - Duration includes story multipliers

---

## 3. Three Quoting Paths Tests

### 🔴 Critical Tests

- [ ] **Path A: AI Photo Scan**
  - Upload 3-5 photos of a property
  - AI detects bedrooms, bathrooms, stories
  - Quote generated with confidence score
  - Customer can override any field
  - Override triggers instant recalculation
  - "Switch to manual entry" link works
  - Final quote = same price as Path B for same inputs

- [ ] **Path A: AI Video Scan**
  - Upload 30-60 second video walkthrough
  - AI extracts frames and analyzes
  - Confidence score +5% vs photos
  - De-duplicates items from multiple angles
  - Final quote generated correctly
  - Same price as manual form for same inputs

- [ ] **Path B: Manual Form**
  - Select property details (BR/BA/stories/sqft/etc.)
  - Price updates live as fields change
  - All modifiers display correctly
  - Generate quote
  - Same price as AI scan for same inputs

- [ ] **Path C: Chat/SMS**
  - Send SMS "3 bed 2 bath 2 story deep clean"
  - Bot parses property details
  - Bot generates quote using same pricing engine
  - Bot sends quote via SMS
  - Customer adjusts → bot recalculates
  - Same price as Path A/B for same inputs

### 🟡 High Priority Tests

- [ ] **Quote Validity**
  - All quotes valid for 7 days
  - Expiration date displays correctly
  - "Valid for X days" countdown accurate
  - Expired quotes cannot be booked

- [ ] **Unified PricingQuote Object**
  - All three paths produce identical object structure
  - quotePath field correctly set (ai_scan, manual_form, chat_sms_phone)
  - All required fields present
  - Verified field starts as false

---

## 4. On-Site Verification Tests

### 🔴 Critical Tests

- [ ] **10% Auto-Approval**
  - Original quote: $299
  - Pro verifies on-site, recalculates: $320 (7% difference)
  - System auto-approves (≤10%)
  - Customer notified: "Price adjusted from $299 to $320"
  - Pro can proceed immediately

- [ ] **Customer Approval Required (>10%)**
  - Original quote: $299
  - Pro verifies, recalculates: $350 (17% difference)
  - System requires customer approval
  - Customer gets SMS: "Updated price $350 (was $299). [Approve] [Cancel]"
  - Pro cannot start until approval
  - If no response in 30 min: Pro released, customer gets reschedule option

- [ ] **Price Can Go Down**
  - Original quote: $350
  - Pro verifies, actual scope is smaller: $280
  - System auto-approves (no threshold for reductions)
  - Customer notified: "Good news! Price reduced from $350 to $280"
  - Savings passed to customer immediately

### 🟡 High Priority Tests

- [ ] **Pro Verification UI**
  - Pro arrives, taps "Arrived"
  - "Verify Job Scope" screen shows
  - Pro can confirm or adjust each field
  - Pro uploads verification photos
  - System recalculates based on Pro inputs
  - Verification photos logged to job record

- [ ] **Manual vs AI Estimate Verification**
  - Customer manual estimate: "850 sqft driveway"
  - Pro AI verification from photos: "940 sqft" (11% larger)
  - System flags for customer approval
  - Pro sees: "⚠️ Actual area 11% larger. Recommend $235 (was $212)"

---

## 5. Multi-Service Discount Engine Tests

### 🔴 Critical Tests

- [ ] **Cart Discount (3+ services)**
  - Add 3 services to cart
  - Subtotal: $500
  - DwellScan credit: -$49
  - Subtotal after credit: $451
  - Multi-service discount (10%): -$45.10
  - Total: $405.90
  - Verify discount applied AFTER DwellScan credit

- [ ] **Cart Discount (5+ services)**
  - Add 5 services to cart
  - Subtotal: $1,000
  - DwellScan credit: -$49
  - Subtotal after credit: $951
  - Multi-service discount (15%): -$142.65
  - Total: $808.35

- [ ] **Rolling 30-Day Discount**
  - Customer completes 2 services in last 30 days
  - Books 3rd service (qualifies for 10%)
  - Discount automatically applied
  - Notification: "You qualify for 10% off! This is your 3rd UpTend service this month."

- [ ] **Discount Stacking Order**
  - DwellScan credit applied FIRST (flat $49)
  - Then percentage discount (10% or 15%)
  - Then promo code (if applicable)
  - Verify order is correct

### 🟡 High Priority Tests

- [ ] **PM Volume Pricing**
  - PM account tier2 (10% discount): Books 5 services
  - Multi-service discount would be 15%
  - System applies 15% (higher of the two)
  - PM discount does NOT stack with multi-service

- [ ] **Upsell Prompts**
  - Cart with 2 services: "Add 1 more for 10% off"
  - Cart with 4 services: "Add 1 more for 15% off"
  - Prompt disappears at 5+ services

---

## 6. Named Packages Tests

### 🔴 Critical Tests

- [ ] **The Refresh Package**
  - Select package
  - Walks through quoting BulkSnap + PolishUp
  - PolishUp price dynamic based on property
  - Shows upsell: "Add 1 service for 10% off"
  - Final price accurate for customer's property

- [ ] **The Move-Out Package**
  - Select package
  - 4 services: DwellScan Aerial, BulkSnap, PolishUp Move-Out, FreshWash
  - All services quoted individually
  - 10% discount applied automatically
  - Multi-Pro note displays
  - Prices match individual service pricing

- [ ] **The Full Reset Package**
  - 5 services included
  - 15% discount applied automatically
  - DwellScan $49 credit applied first
  - Multi-Pro coordination note shows
  - Customer can add/remove services

### 🟡 High Priority Tests

- [ ] **Package Modifications**
  - Start with The Refresh (2 services)
  - Remove 1 service → discount removed
  - Add 1 service back → discount applied
  - Add 3 more services → upgrade to 15% discount

---

## 7. Multi-Pro Coordination Tests

### 🔴 Critical Tests

- [ ] **Lead Pro Assignment**
  - Multi-Pro job created
  - Highest-rated Pro assigned as Lead
  - Lead Pro gets $15 bonus
  - Lead Pro sees crew coordination UI
  - Crew members see Lead's instructions

- [ ] **Pro Payouts (Multi-Pro)**
  - 2-Pro job: Lead $135 ($40×3 + $15), Crew $120 ($40×3)
  - Discount applied to customer price
  - Discount does NOT reduce Pro payouts
  - UpTend absorbs discount from margin

### 🟡 High Priority Tests

- [ ] **Crew Coordination UI (Lead Pro)**
  - Lead sees all crew member locations (GPS)
  - Lead can assign phases
  - Lead contacts customer
  - Lead approves phase completion
  - Group messaging works

- [ ] **Customer Multi-Pro Tracking**
  - Customer sees "Your team is assembling... 2 of 3 Pros confirmed"
  - Live ETA for each Pro
  - Lead Pro contact buttons (call/message)
  - Phase timeline with progress
  - Guarantees section displays

- [ ] **Phase Sequencing**
  - DwellScan → Interior services → Exterior services
  - 30-minute buffer between phases
  - Phases tracked independently
  - All phases complete before job marked complete

---

## 8. Checkout Display Tests

### 🔴 Critical Tests

- [ ] **Line Items Display**
  - Each service shows branded name
  - Breakdown details shown
  - Subtotal calculated correctly
  - DwellScan credit line item (-$49)
  - Multi-service discount line item (-10% or -15%)
  - UpTend Protection Fee (7%)
  - Grand total accurate

- [ ] **Discount Breakdown**
  - "Discounts Applied" section in green
  - Each discount listed with amount
  - Total savings highlighted
  - Savings message: "You saved $X with [reasons]"

- [ ] **Receipt Format**
  - Service line items
  - Booking details (date, address, etc.)
  - Payment method
  - Customer info
  - Footer notes (verification, cancellation, etc.)
  - Professional formatting

### 🟡 High Priority Tests

- [ ] **Verification Note**
  - Shows: "Final price confirmed after on-site verification (±10% auto-approved)"
  - Note visible on checkout and receipt
  - Mobile-friendly formatting

---

## 9. AI Photo/Video Quote Tests

### 🔴 Critical Tests

- [ ] **Photo Upload (Mobile)**
  - Open on iPhone/Android
  - Tap "Upload Photos"
  - Camera app opens
  - Take 3 photos
  - Photos preview correctly
  - Upload progress shown
  - Analyze button enabled when complete

- [ ] **Video Upload (Mobile)**
  - Record 45-second walkthrough
  - Video under 100MB
  - Upload with progress
  - AI extracts frames
  - Confidence +5% vs photos
  - Quote generated correctly

- [ ] **Override AI Detections**
  - AI says "3 bedrooms"
  - Customer overrides to "4 bedrooms"
  - Price recalculates instantly
  - All fields overridable
  - Final quote reflects overrides

### 🟡 High Priority Tests

- [ ] **Error Handling**
  - Upload 6 photos (over limit) → Error message
  - Upload video over 100MB → Size warning
  - Network fails during upload → Retry button
  - AI analysis fails → Fallback to manual form

---

## 10. Cross-Browser & Device Tests

### 🔴 Critical Tests

- [ ] **Mobile (iOS Safari)**
  - Booking flow complete
  - Photo capture works
  - Payments work
  - GPS tracking works

- [ ] **Mobile (Android Chrome)**
  - Booking flow complete
  - Photo capture works
  - Payments work
  - GPS tracking works

- [ ] **Desktop (Chrome)**
  - All features work
  - Responsive breakpoints correct

- [ ] **Desktop (Safari)**
  - All features work
  - No WebKit-specific bugs

---

## 11. Integration Tests

### 🔴 Critical Tests

- [ ] **Payment Processing**
  - Stripe checkout works
  - Discounts reflected in Stripe amount
  - Pro payouts calculated correctly
  - Protection fee (7%) charged correctly

- [ ] **SMS Notifications**
  - Booking confirmation sent
  - Pro dispatch notification sent
  - Price verification approval request sent
  - Job completion notification sent

- [ ] **GPS Tracking**
  - Pro locations update in real-time
  - ETAs calculate correctly
  - Geofence triggers on arrival
  - Customer sees Pro approaching

### 🟡 High Priority Tests

- [ ] **Database Integrity**
  - All quotes stored with 7-day expiry
  - DwellScan credits tracked per customer
  - Multi-service discounts logged
  - Price verification data saved

---

## 12. Performance Tests

### 🟢 Medium Priority Tests

- [ ] **Page Load Times**
  - Homepage: <2 seconds
  - Booking page: <3 seconds
  - AI analysis: <10 seconds

- [ ] **AI Analysis Speed**
  - 3 photos: <8 seconds
  - Video: <15 seconds
  - Confidence score: >80% typical

- [ ] **Mobile Performance**
  - Photo upload: <5 seconds per photo
  - Forms responsive (no lag)
  - GPS updates: <5 second intervals

---

## Test Results Summary

**Date Tested:** _____________
**Tested By:** _____________

| Section | Passed | Failed | Notes |
|---------|--------|--------|-------|
| 1. DwellScan Pricing | __ / __ | __ / __ | |
| 2. PolishUp Pricing | __ / __ | __ / __ | |
| 3. Quoting Paths | __ / __ | __ / __ | |
| 4. Verification | __ / __ | __ / __ | |
| 5. Discounts | __ / __ | __ / __ | |
| 6. Packages | __ / __ | __ / __ | |
| 7. Multi-Pro | __ / __ | __ / __ | |
| 8. Checkout | __ / __ | __ / __ | |
| 9. AI Quotes | __ / __ | __ / __ | |
| 10. Cross-Browser | __ / __ | __ / __ | |
| 11. Integration | __ / __ | __ / __ | |
| 12. Performance | __ / __ | __ / __ | |

**Overall Status:** ⬜ Pass  ⬜ Fail  ⬜ Needs Work

**Critical Blockers:**

**Known Issues:**

**Ready for Production:** ⬜ Yes  ⬜ No  ⬜ With Caveats

---

## Notes for QA Team

- Test on actual mobile devices, not just browser DevTools
- Use real Stripe test cards for payment tests
- Test GPS tracking in physical locations (drive around)
- Upload actual property photos for AI tests
- Verify Pro payouts in Stripe Connect dashboard
- Check all email/SMS templates render correctly
- Test with multiple simultaneous users
- Verify analytics tracking fires correctly

---

**Created:** February 8, 2026
**Version:** 1.0
**Status:** Ready for QA
