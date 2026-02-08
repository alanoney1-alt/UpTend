# Three Quoting Paths - Implementation Guide

**Status:** ✅ Complete (Task #66)

All three quoting paths now use the same underlying pricing engines, ensuring **consistent pricing** regardless of customer entry point.

---

## Overview

UpTend offers three ways for customers to get quotes:

### Path A: AI Scan (Photos/Video)
**Component:** `/client/src/components/pricing/ai-scan-quote.tsx`

- Customer uploads photos (up to 5) or video (60 seconds max)
- AI analyzes images using GPT-4o Vision
- **Video gets +5% confidence boost** (better context, scale, shows all angles)
- Returns property details, item identification, or surface measurements
- Generates quote using appropriate pricing engine

**Services supported:**
- ✅ PolishUp: AI detects bedrooms, bathrooms, stories, sqft, condition
- ✅ BulkSnap: AI identifies items, estimates volume
- ✅ FreshWash: AI calculates total square footage from surfaces
- ✅ GutterFlush: AI identifies story count from roofline

**API Endpoints:**
- `POST /api/ai/analyze-photos` - For photo uploads
- `POST /api/ai/analyze-video` - For video uploads (extracts up to 12 frames)

---

### Path B: Manual Form
**Component:** `/client/src/components/pricing/manual-quote-form.tsx`

- Customer fills out a form with property/service details
- **Live price updates** as they type (instant feedback)
- No photos required
- Uses same pricing engines as AI scan

**Currently supported:**
- ✅ PolishUp: Full form with bedrooms, bathrooms, stories, sqft, pets, last cleaned, same-day
- 🔄 Other services: Coming soon

**Integration:**
```tsx
import { ManualQuoteForm } from "@/components/pricing/manual-quote-form";

<ManualQuoteForm
  serviceType="polishup"
  onQuoteGenerated={(quote) => {
    // quote is a PricingQuote object
    // Navigate to booking or save quote
  }}
/>
```

---

### Path C: Chat/SMS/Phone
**Module:** `/server/services/pricing-calculator-for-ai.ts`

- Conversational quote gathering via chatbot or SMS
- AI assistant asks follow-up questions to gather details
- Uses helper functions to calculate prices
- Ensures same pricing as Path A and Path B

**Functions available:**
- `calculatePolishUpPriceForAI()` - Home cleaning quotes
- `calculateDwellScanPriceForAI()` - Home audit quotes
- `calculateBulkSnapPriceForAI()` - Junk removal quotes
- `calculateFreshWashPriceForAI()` - Pressure washing quotes
- `calculateGutterFlushPriceForAI()` - Gutter cleaning quotes
- `calculateLiftCrewPriceForAI()` - Moving labor quotes
- `getFollowUpQuestions()` - Service-specific question suggestions

**Example usage in AI assistant:**
```typescript
import {
  calculatePolishUpPriceForAI,
  formatPriceForConversation
} from './pricing-calculator-for-ai';

// Customer says: "I need a 3 bedroom, 2 bath deep clean"
const quote = calculatePolishUpPriceForAI({
  bedrooms: 3,
  bathrooms: 2,
  cleanType: 'deep',
  stories: 1,
});

// AI responds: "For a 3BR/2BA deep clean, your price is $299.
// This includes everything and takes about 4 hours with 2 Pros."
```

---

## Unified Quote Interface

All three paths output the **same PricingQuote object** (defined in `/client/src/lib/pricing-quote.ts`):

```typescript
interface PricingQuote {
  serviceType: string;              // e.g., "polishup"
  serviceBranded: string;            // e.g., "PolishUp™"
  inputs: Record<string, any>;       // Customer-provided inputs
  quotePath: 'ai_scan' | 'manual_form' | 'chat_sms_phone';
  basePrice: number;
  modifiers: Array<{
    name: string;
    value: number;
    type: 'multiplicative' | 'additive';
  }>;
  finalPrice: number;
  estimatedDuration: string;
  estimatedPros: number;
  breakdown: string;
  createdAt: Date;
  expiresAt: Date;                   // 7-day validity
  verified: boolean;                 // False until Pro verifies on-site
  verifiedPrice?: number;            // May differ after verification
  verificationNotes?: string;
}
```

---

## Pricing Engines

### PolishUp Dynamic Pricing
**File:** `/client/src/lib/polishup-pricing.ts`

**Input:**
```typescript
{
  cleanType: 'standard' | 'deep' | 'move_out',
  bedrooms: 0 | 1 | 2 | 3 | 4 | 5,
  bathrooms: 1 | 1.5 | 2 | 2.5 | 3 | 3.5 | 4,
  stories: 1 | 2 | 3,
  sqft?: number,
  hasPets: boolean,
  lastCleaned: '30_days' | '1_6_months' | '6_plus_months' | 'never',
  sameDayBooking: boolean,
}
```

**Logic:**
1. Get base price from BR/BA matrix
2. Apply multiplicative modifiers (stories, sqft, last cleaned) - these stack
3. Apply additive modifiers (pets +$25, same-day +$30)
4. Calculate Pro staffing (1-3 Pros based on clean type and size)
5. Estimate duration (accounts for parallel work efficiency)

**Example:**
- 3BR/2BA, standard clean, 2-story, pets
- Base: $179
- × 1.15 (two-story) = $205.85
- + $25 (pets) = $230.85
- Final: **$231**

---

### DwellScan Pricing
**File:** `/client/src/constants/services.ts` (home_audit section)

**Tiers:**
- Standard: $49 (1 Pro, 30 min walkthrough, Pro earns $25)
- Aerial: $149 (2 Pros or 1 combined, 45 min, Pros earn $25 + $55 or $80)

**Credit:**
- Customer gets $49 credit toward next service (90-day expiry)
- Credit applied BEFORE percentage discounts
- One credit per DwellScan booked

---

### BulkSnap Volume-Based Pricing
Load size tiers:
- Minimum (1-2 items): $99
- 1/8 Truck: $179
- 1/4 Truck: $279
- 1/2 Truck: $379
- 3/4 Truck: $449
- Full Truck: $449

---

### FreshWash Square Footage Pricing
- $0.25 per sqft
- Minimum: $120 (480 sqft)
- AI can calculate sqft from photos

---

### GutterFlush Fixed Pricing
- 1-Story: $149
- 2-Story: $249

---

### LiftCrew Hourly Pricing
- $80/hour per Pro
- 1-hour minimum
- Multi-Pro crews: 1-3 Pros

---

## Integration Points

### Booking Flow Integration
The QuotePathSelector component can be integrated into the booking flow:

```tsx
import { QuotePathSelector } from "@/components/pricing/quote-path-selector";

<QuotePathSelector
  serviceType="polishup"
  onQuoteGenerated={(quote) => {
    // Save quote, proceed to booking
    setQuoteData(quote);
    setStep('booking');
  }}
  onBack={() => setStep('service-selection')}
/>
```

### Florida Estimator Integration
For the frictionless flow (address → service → quote → auth):

```tsx
// In florida-estimator.tsx after service selection:
if (selectedService === 'home_cleaning') {
  return (
    <QuotePathSelector
      serviceType="polishup"
      onQuoteGenerated={(quote) => {
        // Redirect to auth with quote preserved
        navigate(`/auth?redirect=booking&quoteId=${quote.id}`);
      }}
    />
  );
}
```

### Chatbot Integration
Update `/server/services/ai-assistant.ts` to import pricing calculators:

```typescript
import {
  calculatePolishUpPriceForAI,
  getFollowUpQuestions
} from './pricing-calculator-for-ai';

// In conversation handler:
if (userIntent === 'get_quote' && service === 'polishup') {
  const extractedParams = extractParamsFromMessage(userMessage);
  const quote = calculatePolishUpPriceForAI(extractedParams);

  const followUps = getFollowUpQuestions('polishup', extractedParams);

  return {
    message: `For a ${quote.breakdown}, your price is ${quote.price}. ${followUps.join(' ')}`,
    quote: quote,
  };
}
```

---

## Quote Validity & Verification

1. **Quote Creation:** All quotes have 7-day validity period
2. **Pre-Booking:** Customer books based on quote (verified: false)
3. **On-Site Verification:** Pro arrives, takes photos/video
4. **AI Verification:** System analyzes on-site photos, recalculates price
5. **10% Wiggle Room:**
   - If difference ≤10%, auto-approve
   - If difference >10%, Pro must notify customer for approval
6. **Verified Quote:** After approval, set verified: true, verifiedPrice: actual

See **Task #67** for on-site verification system details.

---

## Testing Checklist

### Path A (AI Scan)
- [ ] Upload 5 photos → AI analysis completes → Quote generated
- [ ] Upload 1 video → AI extracts frames → Quote shows +5% confidence
- [ ] Low confidence (<70%) → Manual override fields appear
- [ ] PolishUp: AI correctly detects BR/BA/stories
- [ ] BulkSnap: AI identifies items and estimates volume
- [ ] FreshWash: AI calculates sqft from surfaces

### Path B (Manual Form)
- [ ] Fill PolishUp form → Price updates in real-time
- [ ] Change bedrooms → Price recalculates instantly
- [ ] Toggle pets → +$25 appears
- [ ] Toggle same-day → +$30 appears
- [ ] Select "never cleaned" → +20% surcharge applies
- [ ] Confirm quote → PricingQuote object created

### Path C (Chat/SMS)
- [ ] Ask chatbot for PolishUp quote → Bot asks BR/BA
- [ ] Provide details → Bot calculates price using pricing engine
- [ ] Price matches Path A and Path B for same inputs
- [ ] SMS bot integration works (same pricing logic)

### Unified Output
- [ ] All three paths produce identical PricingQuote objects
- [ ] Quote has correct 7-day expiry date
- [ ] Quote stores quotePath correctly (ai_scan/manual_form/chat_sms_phone)

---

## Next Steps (Task #67)

Build the **on-site verification system**:
1. Pro takes verification photos via Pro Dashboard
2. AI analyzes photos, recalculates measurements
3. Compare verifiedPrice to originalPrice
4. If within 10%, auto-approve
5. If >10%, trigger customer approval flow
6. Update quote with verified: true

See `/VERIFICATION_SYSTEM_SPEC.md` for full implementation details.

---

## Questions?

Contact: Implementation complete as of Task #66
Dependencies: `@/lib/polishup-pricing`, `@/lib/pricing-quote`, GPT-4o Vision API
