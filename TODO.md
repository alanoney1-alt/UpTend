# UpTend TODO Tracker

This document catalogs all TODO items found in the codebase, organized by priority and category.

**Last Updated:** 2026-02-09
**Total Items:** 45

---

## 🔴 CRITICAL - Cross-Domain Architecture Issues

These require architectural decisions about how storage domains should compose with each other.

### Storage Domain Composition Pattern

**Affected Files:**
- `/server/storage/domains/ai-estimates-reviews/storage.ts` (3 TODOs)
- `/server/storage/domains/hauler-profiles/storage.ts` (3 TODOs)
- `/server/storage/domains/service-requests/storage.ts` (2 TODOs)
- `/server/storage/domains/matching/storage.ts` (1 TODO)
- `/server/storage/domains/rebates/storage.ts` (1 TODO)
- `/server/storage/domains/promotions/storage.ts` (1 TODO)

**Issue:** Multiple storage domains need to call methods from other domains (cross-domain composition), but the current architecture doesn't have a clean pattern for this.

**Examples:**
- `ai-estimates-reviews/storage.ts:42` - `getAiEstimateWithReview()` needs to fetch service request data
- `ai-estimates-reviews/storage.ts:85` - `createReview()` needs to update service request status
- `hauler-profiles/storage.ts:41` - `getHaulerWithStats()` needs service completion data
- `service-requests/storage.ts:46` - `getServiceRequestWithDetails()` needs hauler profile data

**Recommended Solution:**
1. Create a `CompositeStorage` class that has access to all domain storages
2. Move composition methods from individual domains to CompositeStorage
3. Keep individual domains focused on single-table operations
4. Update DatabaseStorage to instantiate CompositeStorage with all domains

**Priority:** HIGH - Blocks several features from working correctly

---

## 🟠 HIGH PRIORITY - Missing API Implementations

### Price Verification System (12 TODOs)

**File:** `/server/routes/jobs/price-verification.routes.ts`

**Missing Implementations:**

1. **Line 64:** Fetch customer info from database
   - Currently hardcoded mock data
   - Needs: `await db.customers.getById(customerId)`

2. **Line 87:** Send SMS to customer for price approval
   - Integration: Twilio API
   - Message template: "Your UpTend Pro has adjusted the price to $X. Approve? Reply YES or click link..."

3. **Line 92:** Schedule timeout job (30 minutes)
   - If customer doesn't respond in 30 min, auto-cancel
   - Implementation: BullMQ delayed job or PostgreSQL pg_cron

4. **Line 107 & 214:** Notify Pro to start work
   - Send push notification + SMS to Pro
   - Message: "Customer approved $X. Begin work now."

5. **Line 110 & 217:** Notify customer of price adjustment confirmation
   - Send confirmation SMS/email
   - Message: "You approved $X for [service]. Pro is starting work."

6. **Lines 206 & 267:** Retrieve original input from database
   - Currently using `any` type with empty object
   - Needs: Fetch from `service_requests.original_input` column

7. **Lines 275 & 324:** Release Pro (cancel job assignment)
   - Update `service_requests.status = 'cancelled'`
   - Free up Pro's calendar slot
   - Notify Pro: "Job cancelled - customer rejected price"

8. **Lines 278 & 327:** Send reschedule options to customer
   - Generate new quote with original Pro or different Pro
   - Message: "Would you like a new quote? Tap here to reschedule."

9. **Line 361:** Complete cancellation flow
   - Release Pro + send reschedule notification
   - Log reason for cancellation (price too high)

**Dependencies:**
- Twilio SMS integration (already configured)
- Push notification service (FCM/APNS)
- Job queue system (BullMQ recommended)

**Estimated Effort:** 2-3 days

---

### Referral System (4 TODOs)

**File:** `/server/routes/referrals/referral.routes.ts`

**Missing Storage Methods:**

1. **Line 79:** `getPartnerPartners()` - Fetch all partners for a partner
   - SQL: `SELECT * FROM partners WHERE referrer_partner_id = ?`

2. **Line 128:** `createPartnerReferral()` - Create new referral tracking entry
   - SQL: `INSERT INTO partner_referrals (partner_id, referred_customer_id, ...) VALUES (...)`

3. **Line 147:** `getPartnerReferralsByPro()` - Get all referrals made by a Pro
   - SQL: `SELECT * FROM partner_referrals WHERE partner_id = ? ORDER BY created_at DESC`

4. **Line 175:** `updatePartnerReferral()` - Update referral status/payout
   - SQL: `UPDATE partner_referrals SET status = ?, payout_amount = ? WHERE id = ?`

**Implementation:**
- Add these 4 methods to `/server/storage/domains/partners/storage.ts`
- Create `partner_referrals` table if it doesn't exist
- Add proper TypeScript interfaces

**Estimated Effort:** 4 hours

---

## 🟡 MEDIUM PRIORITY - Feature Enhancements

### HOA Management Features

**Violations System:**
- **File:** `/server/routes/hoa/violations.routes.ts`
- **Line 52:** Send notification to homeowner when violation created
  - Email + SMS with violation details and resolution deadline
- **Line 162:** Verify token for public violation access
  - Generate secure tokens for homeowner-only violation viewing

**Communications System:**
- **File:** `/server/routes/hoa/communications.routes.ts`
- **Line 83:** Actually send email/SMS using notification service
  - Currently just returns success without sending
  - Integration: SendGrid for email, Twilio for SMS
- **Line 205:** Implement dedicated communications table
  - Currently using service_requests as proxy
  - Should have proper `hoa_communications` table

**Properties System:**
- **File:** `/server/routes/hoa/properties.routes.ts`
- **Line 149:** Check for active violations before deleting property
  - Prevent deletion if property has open violations
  - Suggest resolution: "Cannot delete - 3 active violations. Resolve first?"

**Estimated Effort:** 1 week for all HOA features

---

### Admin Features

**Carbon Tracking:**
- **File:** `/server/routes/admin/carbon-tracking.routes.ts`
- **Line 95:** Implement monthly aggregation from ESG impact logs
  - Currently returns hardcoded data
  - SQL: `SELECT DATE_TRUNC('month', created_at), SUM(co2_avoided_lbs) FROM esg_impact_logs GROUP BY 1`

**Subscription Cron:**
- **File:** `/server/routes/admin/subscription-cron.routes.ts`
- **Line 21:** Add admin role check
  - Security: Only admins should trigger cron manually
  - Check: `if (req.user.role !== 'admin') throw new Error('Unauthorized')`

**Estimated Effort:** 1 day

---

### AI Chatbot

**File:** `/server/routes/ai/chatbot.routes.ts`

**Line 111-112:** Callback request handling
- Store callback requests in database (`callback_requests` table)
- Send notification to admin/sales team (Slack webhook or email)
- Track response time metrics

**Estimated Effort:** 4 hours

---

### Payment Webhooks

**File:** `/server/webhookHandlers.ts`

**Line 41:** `payment_intent.succeeded` handler
- Update order status in database
- Send confirmation email to customer
- Trigger job dispatch to Pro

**Line 47:** `payment_intent.payment_failed` handler
- Notify customer of failed payment
- Retry logic with different payment method
- Cancel job if retries exhausted

**Estimated Effort:** 6 hours

---

### Subscription Auto-Booking

**File:** `/server/jobs/subscription-auto-booking.ts`

**Line 105:** Send notifications after auto-booking
- Customer notification: "Your scheduled [service] has been automatically booked for [date]"
- Pro notification: "New recurring job assigned: [customer] - [service]"

**Estimated Effort:** 2 hours

---

### Pro Academy

**File:** `/server/routes/hauler/academy.routes.ts`

**Line 134:** Proper badge ID generation and storage
- Currently using placeholder badge IDs
- Generate unique badge identifiers
- Store in `pro_badges` table with earned_at timestamp

**Estimated Effort:** 3 hours

---

### HOA Referral Payments

**File:** `/server/routes/hoa/referral-payments.routes.ts`

**Line 153:** Implement when needed
- Placeholder route for future functionality
- Design spec needed before implementation

**Estimated Effort:** TBD

---

## 🟢 LOW PRIORITY - Nice to Have

### PDF Generation

**File:** `/client/src/pages/home-health-audit.tsx`

**Line 182:** Implement PDF generation for audit reports
- Library: `jsPDF` or `pdfmake`
- Generate downloadable audit report with:
  - Property details
  - All inspection findings
  - Photos
  - Recommendations
  - ESG metrics

**Estimated Effort:** 1 day

---

### Authentication (Attached Assets)

**File:** `/attached_assets/upyck-routes-NO-FAKE-DATA_1769483463573.ts`

**Line 3008:** Consider requiring auth in production
- Legacy code consideration
- Review if this route needs auth protection

**Estimated Effort:** 1 hour review

---

## 📊 Priority Summary

| Priority | Count | Estimated Total Effort |
|----------|-------|------------------------|
| 🔴 Critical (Cross-domain) | 11 | 1 week (architectural) |
| 🟠 High (Missing APIs) | 16 | 3-4 days |
| 🟡 Medium (Features) | 16 | 2 weeks |
| 🟢 Low (Nice to have) | 2 | 1-2 days |
| **TOTAL** | **45** | **~4 weeks** |

---

## 🎯 Recommended Implementation Order

### Phase 1: Architecture (Week 1)
1. Resolve cross-domain composition pattern
2. Implement CompositeStorage class
3. Refactor affected storage domains

### Phase 2: Core Features (Week 2)
1. Complete price verification system (highest user impact)
2. Implement referral system storage methods
3. Add notification integrations (SMS/email)

### Phase 3: Admin & HOA (Week 3)
1. HOA violations notifications
2. HOA communications sending
3. Admin carbon tracking aggregation
4. Subscription cron security

### Phase 4: Polish (Week 4)
1. Payment webhook handlers
2. Pro academy badge generation
3. Chatbot callback storage
4. PDF generation for audits

---

## 🔧 Technical Debt Notes

**Patterns to Avoid:**
- Using `any` types (found in price verification routes)
- Hardcoded mock data in API responses
- Missing error handling in async operations
- Cross-domain calls within individual storage domains

**Best Practices to Follow:**
- All TODOs should have a GitHub issue created
- Each TODO should have acceptance criteria
- Cross-domain operations should go through CompositeStorage
- All notification sends should be queued (don't block API responses)

---

## 📝 Notes

- This document should be updated whenever TODOs are added or completed
- Use `git grep "TODO"` to verify this list stays in sync with codebase
- Consider using a project management tool (Linear, Jira) for tracking
- Each TODO should eventually become a proper user story or task
