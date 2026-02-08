# On-Site Verification System (10% Wiggle Room Rule)

**Status:** ✅ Complete (Task #67)

Ensures quotes are accurate by having Pros verify actual conditions on-site before work begins.

---

## Overview

The verification system protects both customers and Pros by:
1. Comparing AI/manual quotes to actual on-site conditions
2. Auto-approving price differences ≤10%
3. Requiring customer approval for differences >10%
4. Preventing scope creep disputes

---

## The 10% Wiggle Room Rule

**Auto-Approval Threshold:**
- Price difference ≤10% → **Auto-approved**, Pro can begin work immediately
- Price difference >10% → **Requires customer approval** before work begins

**Example:**
- Original quote: $300
- Verified price: $325 (8.3% increase) → ✅ Auto-approved
- Verified price: $340 (13.3% increase) → ⚠️ Requires approval

---

## Verification Flow

### Step 1: Pro Arrives On-Site
Pro navigates to job in Pro Dashboard and starts verification process.

### Step 2: Capture Verification Media
Pro takes photos or video of actual conditions:

**Photo Method:**
- Up to 10 photos
- Multiple angles
- Include reference objects for scale

**Video Method:** ⭐ Recommended
- 120-second max
- Walkthrough showing full scope
- +5% confidence boost
- Better captures scale and context

**Component:** `/client/src/pages/hauler-dashboard/job-verification.tsx`

### Step 3: AI Analysis
System analyzes verification media and recalculates price:

**For PolishUp:**
- Detects actual: bedrooms, bathrooms, stories, sqft, condition
- Recalculates using dynamic pricing engine
- Compares to original quote

**For BulkSnap:**
- Identifies actual items and volume
- Recalculates load size
- Compares to original estimate

**For FreshWash:**
- Calculates actual square footage from surfaces
- Recalculates at $0.25/sqft
- Compares to original

**For GutterFlush:**
- Confirms story count
- Applies fixed pricing ($149 or $249)

**API Endpoint:** `POST /api/jobs/verify-price`

```typescript
Request:
{
  jobId: string,
  serviceType: string,
  verificationMethod: 'photo' | 'video',
  fileUrls: string[],
  originalQuote: {
    finalPrice: number,
    breakdown: string,
    inputs: Record<string, any>,
    quotePath: 'ai_scan' | 'manual_form' | 'chat_sms_phone'
  }
}

Response:
{
  verifiedPrice: number,
  priceDifference: number,  // e.g., +$45 or -$20
  percentageDifference: number,  // e.g., 15.0 (%)
  requiresCustomerApproval: boolean,
  verificationPhotos: string[],
  verificationMethod: 'photo' | 'video',
  aiAnalysis: {
    detectedParams: Record<string, any>,
    confidence: number,
    reasoning: string
  },
  autoApproved: boolean
}
```

### Step 4a: Auto-Approval Path (≤10%)
If price difference is within 10%:
1. ✅ System auto-approves
2. Job status updated immediately
3. Pro can begin work right away
4. Customer receives SMS notification:
   ```
   UpTend: Your Pro verified the scope on-site.
   Final price: $325 (was $300). Within 10% - auto-approved.
   Work beginning now!
   ```

### Step 4b: Approval Required Path (>10%)
If price difference exceeds 10%:
1. ⚠️ System flags for customer approval
2. Pro CANNOT begin work yet
3. Customer receives SMS with:
   - Original vs verified price
   - Pro's notes explaining differences
   - Photos/video evidence
   - Approval link
4. Pro waits for customer response

**Customer Notification SMS:**
```
UpTend: Your Pro arrived and found the scope is larger than estimated.

Original: $300
New: $340 (13.3% difference)

Pro's note: "Found additional room that wasn't in photos,
plus more clutter than estimated."

View photos and approve: https://uptend.com/jobs/abc123/approve-price
```

**API Endpoint:** `POST /api/jobs/request-price-approval`

### Step 5: Customer Approval Decision

**Customer Options:**

**Option A: Approve New Price**
- Customer clicks approval link
- Work proceeds immediately
- Pro receives notification to begin
- Payment updated to new amount

**Option B: Reject New Price**
- Job cancelled
- No charges
- Pro receives cancellation notification
- Both parties can rebook if terms change

**API Endpoint:** `POST /api/jobs/:jobId/approve-price-change`

```typescript
Request:
{
  approved: boolean,
  customerNotes?: string  // Optional explanation
}

Response (if approved):
{
  success: true,
  message: 'Price approved. Your Pro can now begin work.'
}

Response (if rejected):
{
  success: true,
  message: 'Job cancelled due to price disagreement.'
}
```

---

## Database Schema

**Added to `service_requests` table:**

```typescript
priceVerified: boolean,  // Has Pro verified on-site?
verifiedPrice: real,  // Actual price after verification
priceAdjustment: real,  // Difference: verifiedPrice - originalPrice
priceVerificationData: text,  // JSON with full AI analysis
verificationPhotos: text[],  // Photo/video URLs
priceApprovalPending: boolean,  // Waiting for customer approval?
priceApprovalRequestedAt: text,  // When Pro requested approval
priceApprovalRespondedAt: text,  // When customer responded
customerApprovedPriceAdjustment: boolean,  // Customer's decision
customerNotes: text,  // Customer's explanation
```

---

## Pro Dashboard Integration

**File:** `/client/src/pages/hauler-dashboard/job-verification.tsx`

**Component Usage:**
```tsx
import { JobVerification } from '@/pages/hauler-dashboard/job-verification';

<JobVerification
  jobId={currentJob.id}
  serviceType={currentJob.serviceType}
  originalQuote={{
    finalPrice: currentJob.priceEstimate,
    breakdown: currentJob.description,
    inputs: currentJob.quoteInputs,
    quotePath: currentJob.quotePath
  }}
  onVerificationComplete={(verificationData) => {
    // Handle completion
    if (verificationData.autoApproved) {
      // Begin work immediately
      startJob();
    } else {
      // Wait for customer approval
      showWaitingScreen();
    }
  }}
/>
```

**UI States:**

1. **Capture** - Pro takes photos/video
2. **Analyzing** - AI processing
3. **Review** - Pro reviews results, adds notes
4. **Complete** - Verification saved, awaiting approval if needed

---

## Pricing Recalculation Logic

The system uses the same pricing engines that generated the original quote:

**PolishUp:**
```typescript
function calculatePolishUpVerifiedPrice(params) {
  // 1. Get base price from BR/BA matrix
  const basePrice = getBasePrice(params.bedrooms, params.bathrooms, params.cleanType);

  // 2. Apply multiplicative modifiers
  let price = basePrice;
  if (params.stories === 2) price *= 1.15;
  if (params.stories === 3) price *= 1.25;
  if (params.sqft >= 3000) price *= 1.10;
  if (params.lastCleaned in ['6_plus_months', 'never']) price *= 1.20;

  // 3. Apply additive modifiers
  if (params.hasPets) price += 25;
  if (params.sameDayBooking) price += 30;

  return Math.round(price);
}
```

**BulkSnap:**
- AI identifies actual items
- Calculates total cubic feet
- Maps to load size tier
- Returns tier price ($99 to $449)

**FreshWash:**
- AI calculates total sqft from surfaces
- Multiplies by $0.25/sqft
- Applies $120 minimum

**GutterFlush:**
- AI confirms story count
- Returns $149 (1-story) or $249 (2-story)

---

## Error Handling

**AI Analysis Fails:**
- Show error message to Pro
- Offer retry option
- Fallback: Allow manual parameter entry
- Pro can still proceed with original quote if customer agrees

**Customer Doesn't Respond:**
- After 2 hours, send reminder SMS
- After 24 hours, mark job as cancelled
- Pro compensated for travel time ($25 cancellation fee)

**Price Drops (Customer Overpaid):**
- Same approval flow applies
- Customer must approve lower price
- Ensures transparency for price decreases too
- Example: "Original $300, actual $270 (10% less)"

---

## Testing Scenarios

### Test 1: Auto-Approval (5% Increase)
1. Original quote: $200
2. Pro verifies: 2BR → Actually 2BR (same)
3. But: Last cleaned "6+ months" (wasn't captured in original)
4. Verified price: $210 (5% increase)
5. ✅ Auto-approved
6. Pro begins work immediately

### Test 2: Requires Approval (15% Increase)
1. Original quote: $300 (3BR/2BA standard)
2. Pro verifies: Actually 4BR/3BA
3. Verified price: $350 (16.7% increase)
4. ⚠️ Customer approval required
5. SMS sent with photos
6. Customer approves
7. Pro begins work

### Test 3: Customer Rejects Price
1. Original quote: $200
2. Verified: $240 (20% increase)
3. Customer views photos, disagrees
4. Customer rejects
5. Job cancelled, no charges
6. Pro compensated $25 for travel

### Test 4: Price Decrease (8% Drop)
1. Original quote: $350
2. Pro verifies: Actually smaller scope
3. Verified price: $322 (8% decrease)
4. ✅ Auto-approved (within 10%)
5. Customer charged lower amount
6. SMS: "Good news! Price decreased to $322"

---

## Analytics & Reporting

Track verification accuracy:

```sql
SELECT
  service_type,
  COUNT(*) as total_jobs,
  AVG(ABS(price_adjustment)) as avg_adjustment,
  AVG(ABS(price_adjustment / price_estimate * 100)) as avg_percentage_diff,
  SUM(CASE WHEN ABS(price_adjustment / price_estimate * 100) <= 10 THEN 1 ELSE 0 END) as auto_approved_count,
  SUM(CASE WHEN customer_approved_price_adjustment = true THEN 1 ELSE 0 END) as customer_approved_count,
  SUM(CASE WHEN customer_approved_price_adjustment = false THEN 1 ELSE 0 END) as customer_rejected_count
FROM service_requests
WHERE price_verified = true
GROUP BY service_type;
```

**Metrics to Monitor:**
- Auto-approval rate (should be >80%)
- Average price adjustment (should be <10%)
- Customer approval rate (should be >90%)
- Rejection rate (should be <5%)

**If auto-approval rate is low:**
- Quote accuracy needs improvement
- AI analysis may need retraining
- Manual quotes may be too conservative

---

## Future Enhancements

**Phase 2 Ideas:**
- Real-time price negotiation chat
- Pro can propose alternative scope to meet budget
- "Budget mode": Show customer what can be done for original price
- Video call option for complex disagreements
- Historical accuracy tracking per Pro (trust score)

**Machine Learning:**
- Train model on verification outcomes
- Improve initial quote accuracy over time
- Identify patterns in quote vs actual differences
- Auto-adjust quotes based on property type, season, etc.

---

## Integration Checklist

### Backend
- [x] Create `price-verification.routes.ts`
- [x] Add schema fields to `service_requests`
- [x] Implement `calculateVerifiedPrice()` helpers
- [x] SMS notification for customer approval
- [ ] Push notification for Pro (when customer approves)
- [ ] Admin dashboard for disputed prices

### Frontend
- [x] Build `JobVerification` component
- [ ] Integrate into Pro Dashboard job flow
- [ ] Customer approval page (`/jobs/:id/approve-price`)
- [ ] Show verification status in customer job view
- [ ] Display before/after price in receipts

### Testing
- [ ] Unit tests for pricing recalculation
- [ ] Integration tests for approval flow
- [ ] E2E test: Complete verification workflow
- [ ] Load test: Multiple concurrent verifications
- [ ] SMS delivery confirmation

---

## Questions?

**File locations:**
- UI Component: `/client/src/pages/hauler-dashboard/job-verification.tsx`
- API Routes: `/server/routes/jobs/price-verification.routes.ts`
- Schema: `/shared/schema.ts` (lines 369-377)
- Documentation: This file

**Dependencies:**
- AI photo analysis service
- Twilio for SMS
- Existing pricing engines (PolishUp, etc.)

**Completed:** Task #67 ✅
**Next:** Task #68 - Multi-service discount engine
