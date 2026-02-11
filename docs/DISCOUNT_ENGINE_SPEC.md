# Multi-Service Discount Engine

**Status:** ✅ Complete (Task #68)

Comprehensive discount system with proper stacking rules and transparent breakdown.

---

## Overview

The discount engine handles all customer discounts with clear priority rules and transparent display. Ensures customers always get the best available discount automatically.

**Key Features:**
- ✅ Multi-service cart discounts (3+ services)
- ✅ DwellScan $49 credit system
- ✅ Property Manager volume pricing
- ✅ First-time customer discount
- ✅ Promotional codes
- ✅ Smart upsell suggestions
- ✅ Real-time discount preview

---

## Discount Types

### 1. DwellScan $49 Credit

**How it works:**
- Customer books DwellScan™ home audit
- Receives $49 credit toward next service
- Credit valid for 90 days
- Applied **BEFORE** percentage discounts (maximizes savings)
- One credit per DwellScan (can't stack multiple credits)

**Example:**
```
Cart: PolishUp ($200) + BulkSnap ($300) = $500
- DwellScan Credit: -$49
= Subtotal after credit: $451
- Multi-service discount (10%): -$45
= Final: $406

Savings: $94 total ($49 credit + $45 percentage discount)
```

**Database:**
```sql
dwellscan_credits table:
- id
- customer_id
- dwellscan_job_id (which DwellScan earned this)
- credit_amount (default $49)
- used (boolean)
- used_on_booking_id
- used_at
- created_at
- expires_at (90 days from creation)
```

---

### 2. Multi-Service Cart Discounts

**Tiers:**
- **3-4 services:** 10% off
- **5+ services:** 15% off

**Applied to:** Post-credit subtotal
**Stacks with:** DwellScan credit, promo codes
**Cannot stack with:** PM tier discount (higher one wins), first-time discount

**Example:**
```
3 services: PolishUp ($200) + FreshWash ($250) + GutterFlush ($149) = $599
- 10% multi-service discount: -$60
= Final: $539
Savings: $60
```

**Visual feedback:**
- Show progress bar: "Add 1 more service to unlock 15% off!"
- Badge on cart: "🎉 10% OFF - 3 Services"

---

### 3. Property Manager Volume Pricing

**Tiers (based on property count):**
- **Bronze (5-9 properties):** 10% off
- **Silver (10-24 properties):** 15% off
- **Gold (25-49 properties):** 20% off
- **Platinum (50+ properties):** 25% off

**Replaces:** Multi-service discount (PM tier takes priority if higher)
**Applied to:** All services in cart
**Stacks with:** DwellScan credit, promo codes

**Example:**
```
PM with 30 properties (Gold tier): 20% off
Cart: 2 services = $600
- Gold tier discount (20%): -$120
= Final: $480

Note: Multi-service discount (10% for 2 services) does NOT apply
because PM discount (20%) is higher.
```

**How PM tier is determined:**
```typescript
function calculatePMTier(propertyCount: number) {
  if (propertyCount >= 50) return 'platinum'; // 25% off
  if (propertyCount >= 25) return 'gold';     // 20% off
  if (propertyCount >= 10) return 'silver';   // 15% off
  if (propertyCount >= 5) return 'bronze';    // 10% off
  return null;
}
```

---

### 4. First-Time Customer Discount

**Amount:** 10% off
**Eligibility:** Customer's very first UpTend booking
**Applied to:** Entire cart
**Cannot stack with:** Multi-service or PM discount (those take priority)
**Stacks with:** DwellScan credit, promo codes

**Logic:**
```typescript
// Only applies if no other percentage discount active
if (isFirstTimeCustomer && !hasMultiServiceDiscount && !isPM) {
  applyDiscount(0.10, 'First-Time Customer');
}
```

---

### 5. Promotional Codes

**Types:**
- **Percentage-based:** `SPRING25` = 25% off
- **Fixed amount:** `WELCOME50` = $50 off
- **Conditional:** `BUNDLE20` = 20% off when booking 2+ services

**Validation rules:**
- Minimum purchase requirement
- Minimum service count
- Expiration date
- First-time customer only (optional)
- Single-use vs multi-use

**Stacks with:** All other discounts (unless promo explicitly excludes stacking)

**Example promo codes:**
```typescript
{
  'SPRING25': {
    type: 'percentage',
    value: 0.25,
    description: '25% off Spring cleaning special',
    minPurchase: 150,
    validUntil: '2026-04-30',
  },
  'WELCOME50': {
    type: 'fixed',
    value: 50,
    description: '$50 off first-time customers',
    firstTimeOnly: true,
  },
  'BUNDLE20': {
    type: 'percentage',
    value: 0.20,
    description: '20% off when booking 2+ services',
    minServices: 2,
  },
}
```

---

## Discount Stacking Rules

**Order of application:**
1. **DwellScan Credit** - Applied to subtotal FIRST
2. **Percentage Discount** - Applied to post-credit subtotal
   - PM tier discount (if PM)
   - OR Multi-service discount (if 3+ services)
   - OR First-time discount (if first booking)
   - Choose HIGHEST applicable percentage
3. **Promo Code** - Applied to subtotal after other discounts

**Example with full stacking:**
```
Cart: 5 services = $1,000
Customer: Has DwellScan credit, booking 5 services, has promo code

Step 1: Apply DwellScan credit
$1,000 - $49 = $951

Step 2: Apply multi-service discount (15% for 5 services)
$951 × 0.15 = $142.65
$951 - $143 = $808

Step 3: Apply promo code (SPRING25 = 25% off, min $150)
$808 × 0.25 = $202
$808 - $202 = $606

Final: $606
Total savings: $394 (39.4% off!)
Breakdown: $49 credit + $143 multi-service + $202 promo
```

---

## Implementation

### Core Engine

**File:** `/client/src/lib/discount-engine.ts`

**Main function:**
```typescript
calculateDiscounts(context: DiscountContext): DiscountBreakdown

Context includes:
- services: CartService[]
- customerId
- isFirstTimeCustomer
- isPropertyManager
- pmTier
- hasDwellScanCredit
- dwellScanCreditAmount
- promoCode
```

**Returns:**
```typescript
{
  subtotal: number,
  discountsApplied: Array<{
    name: string,
    type: 'credit' | 'percentage' | 'fixed',
    amount: number,
    description: string
  }>,
  totalDiscount: number,
  finalTotal: number,
  savingsMessage: string
}
```

### UI Component

**File:** `/client/src/components/checkout/cart-summary.tsx`

**Features:**
- Real-time discount calculation as cart changes
- Active discount badges
- Line-by-line discount breakdown
- Promo code input with validation
- Upsell suggestions
- Savings message

**Usage:**
```tsx
<CartSummary
  services={cartServices}
  customerId={user.id}
  isFirstTimeCustomer={user.totalBookings === 0}
  isPropertyManager={user.accountType === 'property_manager'}
  pmTier={user.pmTier}
  hasDwellScanCredit={hasDwellScanCredit}
  dwellScanCreditAmount={49}
  onCheckout={(finalTotal, discountBreakdown) => {
    // Proceed to payment with discounts applied
  }}
/>
```

---

## Upsell Logic

### Smart Suggestions

**When cart has 2 services:**
```
💡 Add 1 more service and save $X with 10% multi-service discount!
```

**When cart has 4 services:**
```
💡 Add 1 more service and upgrade to 15% off (save an extra $Y)!
```

**When cart doesn't include DwellScan:**
```
💡 Add DwellScan™ Home Audit ($49)
Get $49 credit back toward your next service - it pays for itself!
```

**Implementation:**
```typescript
function getUpsellSuggestions(context) {
  const suggestions = [];

  // Unlock 10% discount
  if (services.length === 2) {
    const potentialSavings = Math.round(currentTotal * 0.10);
    suggestions.push({
      suggestion: 'Add 1 more service',
      savings: potentialSavings,
      description: `Unlock 10% off and save $${potentialSavings}!`
    });
  }

  // Upgrade to 15% discount
  if (services.length === 4) {
    const currentDiscount = currentTotal * 0.10;
    const betterDiscount = currentTotal * 0.15;
    const additionalSavings = betterDiscount - currentDiscount;
    suggestions.push({
      suggestion: 'Add 1 more service',
      savings: additionalSavings,
      description: `Upgrade to 15% off and save an extra $${additionalSavings}!`
    });
  }

  return suggestions;
}
```

---

## Database Tracking

### Service Request Discount Fields

**Added to `service_requests` table:**
```sql
discounts_applied TEXT,  -- JSON array of applied discounts
dwellscan_credit_used REAL,  -- Amount of credit applied
dwellscan_credit_id VARCHAR,  -- Reference to dwellscan_credits
multi_service_discount_percent REAL,  -- 0.10 or 0.15
pm_tier_discount_percent REAL,  -- 0.10, 0.15, 0.20, or 0.25
promo_code_used VARCHAR,
promo_code_discount_amount REAL,
total_discount_amount REAL,  -- Sum of all discounts
price_before_discounts REAL  -- Original subtotal
```

**Example stored data:**
```json
{
  "discounts_applied": [
    {
      "name": "DwellScan™ Credit",
      "type": "credit",
      "amount": 49,
      "description": "$49 credit from your DwellScan home audit"
    },
    {
      "name": "Multi-Service Bundle",
      "type": "percentage",
      "amount": 95,
      "description": "15% off for booking 5+ services"
    },
    {
      "name": "Promo: SPRING25",
      "type": "percentage",
      "amount": 202,
      "description": "25% off Spring cleaning special"
    }
  ],
  "dwellscan_credit_used": 49,
  "dwellscan_credit_id": "abc123",
  "multi_service_discount_percent": 0.15,
  "promo_code_used": "SPRING25",
  "promo_code_discount_amount": 202,
  "total_discount_amount": 346,
  "price_before_discounts": 952
}
```

---

## Analytics & Reporting

**Track discount effectiveness:**
```sql
-- Discount usage by type
SELECT
  CASE
    WHEN dwellscan_credit_used > 0 THEN 'DwellScan Credit'
    WHEN multi_service_discount_percent > 0 THEN 'Multi-Service'
    WHEN pm_tier_discount_percent > 0 THEN 'PM Tier'
    WHEN promo_code_used IS NOT NULL THEN 'Promo Code'
    ELSE 'No Discount'
  END as discount_type,
  COUNT(*) as bookings,
  AVG(total_discount_amount) as avg_discount,
  SUM(final_price) as revenue
FROM service_requests
GROUP BY discount_type;

-- DwellScan credit conversion rate
SELECT
  COUNT(DISTINCT dwellscan_job_id) as dwellscans_completed,
  COUNT(DISTINCT CASE WHEN used = true THEN id END) as credits_redeemed,
  ROUND(COUNT(DISTINCT CASE WHEN used = true THEN id END) * 100.0 /
        COUNT(DISTINCT dwellscan_job_id), 2) as conversion_rate
FROM dwellscan_credits;

-- Average cart size by discount tier
SELECT
  CASE
    WHEN service_count >= 5 THEN '5+ services (15% off)'
    WHEN service_count >= 3 THEN '3-4 services (10% off)'
    ELSE '1-2 services (no discount)'
  END as tier,
  COUNT(*) as bookings,
  AVG(final_price) as avg_order_value,
  AVG(total_discount_amount) as avg_discount
FROM (
  SELECT
    id,
    (SELECT COUNT(*) FROM service_requests_services WHERE booking_id = id) as service_count,
    final_price,
    total_discount_amount
  FROM service_requests
) subquery
GROUP BY tier;
```

---

## Testing Scenarios

### Test 1: DwellScan Credit + Multi-Service
```
Cart:
- DwellScan ($49)
- PolishUp ($200)
- BulkSnap ($300)
- FreshWash ($250)

Total: $799
Services: 4

Expected:
- Customer books, DwellScan credit earned
- Next booking with 3 services ($750 cart)
- DwellScan credit: -$49 → $701
- Multi-service 10%: -$70 → $631
- Total savings: $119
```

### Test 2: PM Gold Tier vs Multi-Service
```
PM with 30 properties (Gold = 20% off)
Cart: 2 services = $400

Expected:
- PM discount applies: 20% off
- Multi-service does NOT apply (PM is higher)
- Final: $320 (saved $80)
```

### Test 3: First-Time Customer
```
New customer, 1 service ($200)

Expected:
- First-time 10% off applies
- Final: $180 (saved $20)
- Message: "Welcome to UpTend! You saved $20"
```

### Test 4: Full Stack
```
Customer: Has DwellScan credit, 5 services, promo code BUNDLE20
Cart: $1,000

Expected:
1. DwellScan credit: -$49 → $951
2. Multi-service 15%: -$143 → $808
3. Promo BUNDLE20 (20%): -$162 → $646
Total savings: $354 (35.4% off)
```

---

## Future Enhancements

**Phase 2 Ideas:**
- Loyalty points program (earn points, redeem for discounts)
- Referral credits ($50 for referrer, $50 for referee)
- Birthday month special (15% off)
- Seasonal campaigns (Spring cleaning, Holiday prep)
- Bundle suggestions (commonly booked together)
- Dynamic pricing based on demand (reverse surge)
- Subscription plans (monthly cleaning + credits)

---

## Integration Checklist

### Backend
- [x] Create discount-engine.ts
- [x] Add dwellscan_credits table
- [x] Add discount tracking fields to service_requests
- [ ] API endpoint: `POST /api/discounts/validate-promo`
- [ ] API endpoint: `GET /api/customers/:id/credits`
- [ ] Webhook: Auto-create DwellScan credit on job completion
- [ ] Cron job: Expire old DwellScan credits (90 days)

### Frontend
- [x] Build CartSummary component
- [x] Real-time discount calculation
- [x] Promo code input
- [x] Upsell suggestions
- [ ] Discount preview in service selection
- [ ] "Active discounts" banner on homepage
- [ ] DwellScan credit balance in account

### Admin Dashboard
- [ ] Promo code management
- [ ] Discount usage analytics
- [ ] PM tier management
- [ ] DwellScan credit audit trail

---

## Questions?

**File locations:**
- Discount Engine: `/client/src/lib/discount-engine.ts`
- Cart UI: `/client/src/components/checkout/cart-summary.tsx`
- Schema: `/shared/schema.ts`

**Completed:** Task #68 ✅
**Next:** Task #69 - Named packages (marketing layer)
