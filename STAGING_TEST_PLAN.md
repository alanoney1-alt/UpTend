# Staging Environment Testing Plan

**Purpose:** End-to-end testing of critical features before production deployment

**Date:** February 8, 2026

---

## Test Environment Setup

### Prerequisites:
- [ ] Staging database deployed with latest schema
- [ ] Staging server running at `https://staging.uptend.com`
- [ ] Test Stripe account configured
- [ ] Test Twilio account for SMS
- [ ] Test user accounts created (customer + Pro)
- [ ] Mobile devices available (iOS + Android)

### Test Accounts:
```
Customer Test Account:
  Email: test.customer@uptend.com
  Phone: +1 (555) 000-0001
  Payment: Stripe test card 4242 4242 4242 4242

Pro Test Account:
  Email: test.pro@uptend.com
  Phone: +1 (555) 000-0002
  Payout: Stripe Connect test account

Admin Test Account:
  Email: test.admin@uptend.com
  Access: Full dashboard access
```

---

## Test Suite 1: DwellScan $49 Credit System (P0 CRITICAL)

**Objective:** Verify credit issuance, storage, application, and expiry

### Test 1.1: DwellScan Standard Booking & Credit Issuance
**Priority:** P0 Critical

**Steps:**
1. Log in as test customer
2. Navigate to `/dwellscan-landing`
3. Click "Book Standard ($49)"
4. Complete booking form:
   - Address: 1025 N Mills Ave, Orlando, FL 32803
   - Date: Tomorrow
   - Time: 10:00 AM
5. Complete payment with Stripe test card
6. **Verify booking confirmation:**
   - [ ] Confirmation page shows "Booking confirmed"
   - [ ] Email received with booking details
   - [ ] SMS received: "Your DwellScan is scheduled for [date] at [time]"

**Expected Database State:**
```sql
-- Check service_requests table
SELECT * FROM service_requests WHERE customer_id = 'test_customer_id' ORDER BY created_at DESC LIMIT 1;
-- Should show: service_type = 'home_audit', tier = 'standard', price = 49

-- Check dwellscan_credits table (credit NOT yet issued)
SELECT * FROM dwellscan_credits WHERE customer_id = 'test_customer_id';
-- Should be empty (credit issued AFTER job completion)
```

### Test 1.2: Job Completion & Credit Issuance
**Priority:** P0 Critical

**Steps:**
1. Log in as test Pro
2. Navigate to "Active Jobs"
3. Find the DwellScan Standard job
4. Click "Start Job" (simulate arrival)
5. Complete walkthrough (upload 3-5 photos)
6. Click "Mark Job Complete"
7. **Verify credit issuance:**
   - [ ] Pro dashboard shows "Job marked complete"
   - [ ] Customer receives SMS: "Your DwellScan is complete! You've earned a $49 credit"

**Expected Database State:**
```sql
-- Check service_requests table (job completed)
SELECT * FROM service_requests WHERE id = 'job_id';
-- Should show: status = 'completed', completed_at = NOW()

-- Check dwellscan_credits table (credit issued)
SELECT * FROM dwellscan_credits WHERE customer_id = 'test_customer_id';
-- Should show:
--   amount = 49
--   used = false
--   expires_at = NOW() + 90 days
--   issued_at = NOW()
```

### Test 1.3: Credit Display in Customer Account
**Priority:** P0 Critical

**Steps:**
1. Log in as test customer
2. Navigate to "My Account" or "Credits"
3. **Verify credit display:**
   - [ ] Shows "$49 credit available"
   - [ ] Shows expiration date (90 days from issue)
   - [ ] Shows "Use on your next UpTend service"

### Test 1.4: Credit Application at Checkout
**Priority:** P0 Critical

**Steps:**
1. Log in as test customer (with $49 credit)
2. Book a new service (e.g., BulkSnap for $199)
3. Proceed to checkout
4. **Verify credit application:**
   - [ ] Checkout shows:
     ```
     BulkSnap (Junk Removal)          $199.00
     DwellScan Credit                 -$49.00
     ────────────────────────────────────────
     Subtotal                         $150.00
     ```
   - [ ] Credit applied BEFORE any percentage discounts
   - [ ] "You're using your $49 DwellScan credit" message displayed

**Expected Database State:**
```sql
-- Check cart/order calculation
SELECT * FROM orders WHERE customer_id = 'test_customer_id' ORDER BY created_at DESC LIMIT 1;
-- Should show:
--   subtotal = 199
--   dwellscan_credit_applied = 49
--   subtotal_after_credit = 150
--   final_total = 150 (no other discounts)
```

### Test 1.5: Credit Marked as Used After Purchase
**Priority:** P0 Critical

**Steps:**
1. Complete payment for the service (from Test 1.4)
2. **Verify credit marked as used:**
   - [ ] Checkout confirmation shows "Credit applied"
   - [ ] Customer account no longer shows credit

**Expected Database State:**
```sql
-- Check dwellscan_credits table (credit used)
SELECT * FROM dwellscan_credits WHERE customer_id = 'test_customer_id';
-- Should show:
--   used = true
--   used_at = NOW()
--   used_on_booking_id = 'new_booking_id'
```

### Test 1.6: Credit Expiry After 90 Days
**Priority:** P1 High

**Steps:**
1. Manually update credit expiration date to past:
   ```sql
   UPDATE dwellscan_credits
   SET expires_at = NOW() - INTERVAL '1 day'
   WHERE customer_id = 'test_customer_id' AND used = false;
   ```
2. Log in as test customer
3. Attempt to book a new service
4. **Verify expired credit not applied:**
   - [ ] Checkout does NOT show credit
   - [ ] Customer account shows "Expired credit: $49 (expired on [date])"

### Test 1.7: Multiple Credits (One Per DwellScan)
**Priority:** P1 High

**Steps:**
1. Complete a DwellScan Standard booking (issues $49 credit)
2. Complete a DwellScan Aerial booking (issues another $49 credit)
3. Check customer account
4. **Verify credit stacking:**
   - [ ] Shows "$98 in credits available" (2 × $49)
   - [ ] Both credits listed separately with expiration dates

**Expected Database State:**
```sql
SELECT * FROM dwellscan_credits WHERE customer_id = 'test_customer_id' AND used = false;
-- Should return 2 rows, each with amount = 49
```

### Test 1.8: Credit Applied Before Percentage Discounts
**Priority:** P0 Critical

**Steps:**
1. Log in as test customer with $49 credit
2. Book 3 services (qualifies for 10% multi-service discount):
   - BulkSnap: $199
   - PolishUp: $179
   - FreshWash: $150
3. Proceed to checkout
4. **Verify stacking order:**
   - [ ] Checkout shows:
     ```
     BulkSnap                         $199.00
     PolishUp                         $179.00
     FreshWash                        $150.00
     ────────────────────────────────────────
     Subtotal                         $528.00
     DwellScan Credit                 -$49.00
     Subtotal After Credit            $479.00
     Multi-Service Discount (10%)     -$47.90
     ────────────────────────────────────────
     Total                            $431.10
     ```
   - [ ] Credit applied FIRST, then percentage discount

**Formula Verification:**
```
Subtotal: $528
Credit: -$49 → $479
Discount: $479 × 0.10 = -$47.90 → $431.10 ✓
```

---

## Test Suite 2: On-Site Verification System (P0 CRITICAL)

**Objective:** Test 10% auto-approval threshold and customer approval flow

### Test 2.1: Price Increase ≤ 10% (Auto-Approve)
**Priority:** P0 Critical

**Steps:**
1. Customer books PolishUp 3BR/2BA Deep Clean for $299
2. Pro arrives, verifies actual scope: 3BR/2.5BA (not 2BA)
3. Pro submits verification via Pro Dashboard:
   - Verified inputs: bedrooms=3, bathrooms=2.5
   - Verification photos: 3 photos of property
4. **Expected behavior:**
   - [ ] System recalculates price: $299 → $320 (7% increase)
   - [ ] Auto-approves (within 10% threshold)
   - [ ] Customer receives SMS: "Price adjusted from $299 to $320 (7% difference, within our 10% accuracy guarantee)"
   - [ ] Pro receives notification: "Work approved, you can start!"

**API Call:**
```bash
POST /api/jobs/job_123/verify-price
{
  "proId": "pro_456",
  "originalQuote": { "finalPrice": 299, "serviceType": "home_cleaning", "inputs": { "bedrooms": 3, "bathrooms": 2 } },
  "verifiedServiceInputs": { "bedrooms": 3, "bathrooms": 2.5 },
  "verificationPhotos": [
    { "url": "https://...", "timestamp": "2026-02-08T10:00:00Z" }
  ],
  "proNotes": "Customer said 2BA but there is a half bath off kitchen"
}
```

**Expected Response:**
```json
{
  "success": true,
  "verification": {
    "originalPrice": 299,
    "verifiedPrice": 320,
    "priceDifference": 21,
    "percentageDifference": 0.0702,
    "requiresApproval": false,
    "autoApproved": true,
    "reason": "Price increased by 7.0% (within 10% threshold). Auto-approved."
  },
  "message": "Price adjustment auto-approved. Pro can start work."
}
```

### Test 2.2: Price Increase > 10% (Requires Approval)
**Priority:** P0 Critical

**Steps:**
1. Customer books PolishUp 3BR/2BA Deep Clean for $299
2. Pro arrives, verifies actual scope: 4BR/2.5BA (not 3BR/2BA)
3. Pro submits verification
4. **Expected behavior:**
   - [ ] System recalculates price: $299 → $429 (43% increase)
   - [ ] Requires customer approval (exceeds 10% threshold)
   - [ ] Customer receives SMS: "Updated price: $429 (was $299, +$130, 43% increase). Reply APPROVE to proceed or DECLINE to reschedule. Must respond within 30 minutes."
   - [ ] Pro receives notification: "Waiting for customer approval. You will be notified when customer responds."

**Expected Response:**
```json
{
  "success": true,
  "verification": {
    "originalPrice": 299,
    "verifiedPrice": 429,
    "priceDifference": 130,
    "percentageDifference": 0.435,
    "requiresApproval": true,
    "autoApproved": false,
    "reason": "Price increased by 43.5% (exceeds 10% threshold). Customer approval required."
  },
  "requiresApproval": true,
  "message": "Customer approval required. SMS sent."
}
```

### Test 2.3: Customer Approves Price Increase
**Priority:** P0 Critical

**Steps:**
1. Customer receives SMS from Test 2.2
2. Customer replies "APPROVE" (or clicks Approve button in SMS)
3. **Expected behavior:**
   - [ ] System marks approval request as approved
   - [ ] Pro receives SMS: "Customer approved $429 price. You can start work!"
   - [ ] Customer receives confirmation SMS: "Price approved. Work will begin shortly."

**API Call:**
```bash
POST /api/jobs/job_123/verification/ver_123/approve
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Customer approved price adjustment. Pro can begin work.",
  "nextAction": "notify_pro_start_work"
}
```

### Test 2.4: Customer Declines Price Increase
**Priority:** P0 Critical

**Steps:**
1. Customer receives SMS from Test 2.2
2. Customer replies "DECLINE" (or clicks Decline button)
3. **Expected behavior:**
   - [ ] System marks approval request as declined
   - [ ] Pro receives SMS: "Customer declined price adjustment. Job cancelled. You will be paid $0 for travel time."
   - [ ] Customer receives SMS: "Job cancelled. We'll send you reschedule options shortly."

**API Call:**
```bash
POST /api/jobs/job_123/verification/ver_123/decline
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Customer declined price adjustment. Job cancelled.",
  "nextAction": "release_pro_offer_reschedule"
}
```

### Test 2.5: Approval Timeout (30 Minutes)
**Priority:** P0 Critical

**Steps:**
1. Customer receives SMS from Test 2.2
2. Customer does NOT respond within 30 minutes
3. **Expected behavior (after 30 min):**
   - [ ] System automatically marks approval request as expired
   - [ ] Pro receives SMS: "Customer did not respond. Job cancelled. You will be paid $0 for travel time."
   - [ ] Customer receives SMS: "Your approval request expired. Job cancelled. We'll send reschedule options."

**API Call (triggered by timeout job):**
```bash
POST /api/jobs/job_123/verification/ver_123/timeout
```

### Test 2.6: Price Decrease (Always Auto-Approve)
**Priority:** P0 Critical

**Steps:**
1. Customer books PolishUp 4BR/3BA Deep Clean for $429
2. Pro arrives, verifies actual scope: 3BR/2BA (smaller than estimated)
3. Pro submits verification
4. **Expected behavior:**
   - [ ] System recalculates price: $429 → $299 (30% decrease)
   - [ ] Auto-approves (price reductions always auto-approve, no threshold)
   - [ ] Customer receives SMS: "Good news! Price reduced from $429 to $299. Savings of $130 passed to you!"
   - [ ] Pro receives notification: "Work approved, you can start!"

**Expected Response:**
```json
{
  "success": true,
  "verification": {
    "originalPrice": 429,
    "verifiedPrice": 299,
    "priceDifference": -130,
    "percentageDifference": 0.303,
    "requiresApproval": false,
    "autoApproved": true,
    "reason": "Price reduced by $130.00. Auto-approved."
  },
  "message": "Price adjustment auto-approved. Pro can start work."
}
```

---

## Test Suite 3: AI Photo/Video Quote System (P1 HIGH)

**Objective:** Verify AI analysis accuracy and quote generation

### Test 3.1: Photo Upload & Analysis (Junk Removal)
**Priority:** P1 High

**Steps:**
1. Navigate to `/book?service=junk_removal`
2. Select "Get AI Quote from Photos"
3. Upload 3 photos:
   - Photo 1: Couch (3-seat)
   - Photo 2: Coffee table + 2 chairs
   - Photo 3: 5 cardboard boxes
4. Click "Analyze Photos"
5. **Verify AI response (within 10 seconds):**
   - [ ] Loading state appears: "Our AI is analyzing your photos..."
   - [ ] Identified items: ["3-seat couch", "coffee table", "2 chairs", "5 cardboard boxes"]
   - [ ] Estimated volume: ~150-200 cubic feet
   - [ ] Recommended load size: "medium" (1/4 truck)
   - [ ] Confidence: 0.75-0.90
   - [ ] Price: $199-$249 (medium load size)

**API Call:**
```bash
POST /api/ai/analyze-photos
{
  "photoUrls": ["https://...", "https://...", "https://..."],
  "serviceType": "junk_removal"
}
```

### Test 3.2: Video Walkthrough Analysis
**Priority:** P1 High

**Steps:**
1. Navigate to `/book?service=garage_cleanout`
2. Select "Get AI Quote from Video"
3. Record 45-second garage walkthrough video showing:
   - Old refrigerator
   - Washer + dryer
   - Shelving unit
   - Multiple boxes (~10-15)
   - Lawn mower
4. Upload video
5. **Verify AI response (within 15 seconds):**
   - [ ] Video uploads successfully
   - [ ] AI extracts 12 frames
   - [ ] Identified items: refrigerator, washer, dryer, shelving, boxes (count), lawn mower
   - [ ] No item duplication (refrigerator seen from 3 angles only counted once)
   - [ ] Confidence: 0.85-0.95 (+5% boost for video)
   - [ ] Estimated volume: ~300-400 cubic feet
   - [ ] Recommended load size: "large" (1/2 truck)
   - [ ] Price: $299-$379

### Test 3.3: Override AI Detections
**Priority:** P1 High

**Steps:**
1. Complete Test 3.1 (photo upload with AI quote)
2. AI incorrectly identified "5 cardboard boxes" but there are actually 10
3. Click "Edit" next to "5 cardboard boxes"
4. Change to "10 cardboard boxes"
5. Click "Recalculate"
6. **Verify instant recalculation:**
   - [ ] Price updates within 1 second
   - [ ] New volume: +50 cubic feet
   - [ ] New price reflects additional boxes
   - [ ] Confidence remains same

### Test 3.4: Pressure Washing Square Footage from Photos
**Priority:** P1 High

**Steps:**
1. Navigate to `/book?service=pressure_washing`
2. Select "Get AI Quote from Photos"
3. Upload 2 photos:
   - Photo 1: Driveway with car (reference object)
   - Photo 2: House siding with front door (reference object)
4. Click "Analyze Photos"
5. **Verify AI response:**
   - [ ] Identified surfaces: ["driveway", "siding"]
   - [ ] Driveway dimensions: "~40ft × 10ft" → ~400 sqft
   - [ ] Siding dimensions: "~45ft × 10ft (2 sides)" → ~450 sqft
   - [ ] Total sqft: ~850 sqft
   - [ ] Price: 850 × $0.25 = $212.50
   - [ ] Confidence: 0.70-0.85

---

## Test Suite 4: Multi-Service Discount Engine (P1 HIGH)

### Test 4.1: Cart with 3 Services (10% Discount)
**Priority:** P1 High

**Steps:**
1. Add 3 services to cart:
   - BulkSnap: $199
   - PolishUp: $179
   - FreshWash: $150
2. Proceed to checkout
3. **Verify discount:**
   - [ ] Subtotal: $528
   - [ ] Multi-Service Discount (10%): -$52.80
   - [ ] Total: $475.20

### Test 4.2: Cart with 5 Services (15% Discount)
**Priority:** P1 High

**Steps:**
1. Add 5 services to cart:
   - DwellScan Aerial: $149
   - BulkSnap: $199
   - PolishUp: $249
   - FreshWash: $150
   - GutterFlush: $149
2. Proceed to checkout
3. **Verify discount:**
   - [ ] Subtotal: $896
   - [ ] Multi-Service Discount (15%): -$134.40
   - [ ] Total: $761.60

---

## Test Suite 5: Named Packages (P2 MEDIUM)

### Test 5.1: The Move-Out Package
**Priority:** P2 Medium

**Steps:**
1. Navigate to `/packages`
2. Select "The Move-Out" package
3. Walk through quoting for each service:
   - DwellScan Aerial: $149
   - BulkSnap: $199 (AI quote or manual)
   - PolishUp Move-Out: $429 (dynamic based on 3BR/2BA)
   - FreshWash: $150
4. **Verify package discount:**
   - [ ] Subtotal: $927
   - [ ] Multi-Service Discount (10%): -$92.70
   - [ ] Total: $834.30

---

## Database Verification Queries

### Check DwellScan Credit Status:
```sql
SELECT
  c.id,
  c.customer_id,
  c.amount,
  c.used,
  c.expires_at,
  c.issued_at,
  c.used_at,
  c.used_on_booking_id,
  sr.service_type as issued_from_service
FROM dwellscan_credits c
LEFT JOIN service_requests sr ON c.issued_from_dwellscan_id = sr.id
WHERE c.customer_id = 'test_customer_id'
ORDER BY c.created_at DESC;
```

### Check Verification Logs:
```sql
SELECT
  v.verification_id,
  v.job_id,
  v.original_price,
  v.verified_price,
  v.price_difference,
  v.percentage_difference,
  v.auto_approved,
  v.requires_approval,
  v.customer_approved,
  v.customer_declined,
  v.verified_at,
  v.customer_responded_at
FROM price_verifications v
WHERE v.job_id = 'job_id'
ORDER BY v.verified_at DESC;
```

### Check Multi-Service Discounts Applied:
```sql
SELECT
  o.id,
  o.customer_id,
  o.subtotal,
  o.dwellscan_credit_applied,
  o.multi_service_discount_percent,
  o.multi_service_discount_amount,
  o.final_total,
  o.created_at
FROM orders o
WHERE o.customer_id = 'test_customer_id'
ORDER BY o.created_at DESC
LIMIT 5;
```

---

## Performance Benchmarks

### Expected Response Times:
- [ ] Photo upload (3 photos): <5 seconds
- [ ] AI photo analysis: <10 seconds
- [ ] Video upload (45 seconds): <8 seconds
- [ ] AI video analysis: <15 seconds
- [ ] Price verification calculation: <500ms
- [ ] Checkout with discounts: <1 second
- [ ] SMS delivery: <3 seconds

---

## Mobile Device Testing

### iOS Safari:
- [ ] Photo capture from camera works
- [ ] Video recording works (max 60 seconds)
- [ ] GPS location capture for verification photos
- [ ] Stripe payment flow works
- [ ] SMS links open correctly

### Android Chrome:
- [ ] Photo capture from camera works
- [ ] Video recording works (max 60 seconds)
- [ ] GPS location capture for verification photos
- [ ] Stripe payment flow works
- [ ] SMS links open correctly

---

## Success Criteria

### DwellScan Credit System (Must Pass All):
- ✅ Credit issued after job completion
- ✅ Credit stored with 90-day expiry
- ✅ Credit applied at checkout BEFORE percentage discounts
- ✅ Credit marked as used after purchase
- ✅ Expired credits not applied
- ✅ Multiple credits stack correctly

### On-Site Verification (Must Pass All):
- ✅ 10% threshold auto-approves price increases
- ✅ >10% price increases require customer approval
- ✅ Customer can approve/decline via SMS
- ✅ 30-minute timeout releases Pro and offers reschedule
- ✅ Price decreases always auto-approve
- ✅ Pro cannot start work without approval

### AI Quote System (Must Pass 80%+):
- ✅ Photo analysis completes in <10 seconds
- ✅ Item identification accuracy >75%
- ✅ Volume estimation within ±20%
- ✅ Price calculation matches manual quote for same inputs
- ✅ Override functionality works instantly

---

## Issues & Bugs Tracker

**Critical Issues (Block Production):**
- [ ] Issue #1: [Description]
- [ ] Issue #2: [Description]

**High Priority Issues (Fix Before Launch):**
- [ ] Issue #3: [Description]

**Medium Priority Issues (Can Fix Post-Launch):**
- [ ] Issue #4: [Description]

---

## Sign-Off

**Tested By:** _________________
**Date:** _________________

**DwellScan Credit:** ☐ PASS  ☐ FAIL  ☐ NEEDS WORK
**On-Site Verification:** ☐ PASS  ☐ FAIL  ☐ NEEDS WORK
**AI Quote System:** ☐ PASS  ☐ FAIL  ☐ NEEDS WORK
**Multi-Service Discounts:** ☐ PASS  ☐ FAIL  ☐ NEEDS WORK

**Ready for Production:** ☐ YES  ☐ NO  ☐ WITH CAVEATS

**Notes:**
_______________________________________________________
_______________________________________________________
_______________________________________________________
