# FreshSpace (Home Cleaning) Implementation Progress

## ✅ COMPLETED

### 1. Branding & Messaging Updates (PHASE 2)
- ✅ Fixed syntax error in `ai-analysis.ts` (blocking deployment)
- ✅ Updated all service names to branded versions:
  - Junk Removal → **ClearOut (Junk Removal)**
  - Pressure Washing → **FreshWash (Pressure Washing)**
  - Gutter Cleaning → **GutterShield (Gutter Cleaning)**
  - Moving Labor → **LiftCrew (Moving Labor)**
  - Light Demolition → **TearDown (Light Demolition)**
  - Garage Cleanout → **GarageReset (Garage Cleanout)**
  - Truck Unloading → **UnloadPro (Truck Unloading)**
  - Home Audit → **HomeScore (Home Audit)**
  - **NEW:** Home Cleaning → **FreshSpace (Home Cleaning)**

- ✅ Updated all pricing to correct values:
  - ClearOut: $99/$179/$279/$379/$449 (volume-based tiers)
  - FreshWash: $120 starting (corrected from $150)
  - GutterShield: $149 single story (corrected from $120)
  - LiftCrew: $80/hr per Pro
  - TearDown: $199 starting (corrected from $150)
  - GarageReset: $299/$499/$749/$999 (updated tiers)
  - UnloadPro: $80/hr per Pro
  - HomeScore: $49 flat
  - **FreshSpace: $99/$149/$199/$249 by size**

- ✅ Removed customer-facing "AI" language → replaced with "instant"/"smart"
- ✅ Replaced "platform" with "UpTend" in Protection Fee descriptions
- ✅ Updated files:
  - `client/src/lib/bundle-pricing.ts`
  - `client/src/pages/pricing.tsx`
  - `client/src/pages/services.tsx`
  - `server/services/ai-assistant.ts`

### 2. FreshSpace Database Schema
- ✅ Added `home_cleaning` to service type enum
- ✅ Added cleanliness scoring to `job_verification` table:
  - `cleanliness_score_before` (1-10 scale, AI-generated)
  - `cleanliness_score_after` (1-10 scale, AI-generated)

- ✅ Created `cleaning_checklists` table:
  - Links to service requests
  - Tracks room-by-room task completion
  - Fields: roomType, taskName, completed, skipped, skipReason, completedAt
  - Supports: Kitchen, Bathroom, Bedroom, Living Room, Dining Room, Office, General

- ✅ Created `recurring_subscriptions` table:
  - Customer recurring plans
  - Frequency: weekly (15% off), biweekly (10% off), monthly (5% off)
  - Home details stored as JSON
  - Preferred day and time window
  - Assigned Pro ID (same Pro every time)
  - Stripe subscription integration ready
  - Status tracking: active/paused/cancelled
  - 3-booking minimum commitment
  - Cancellation reason tracking

### 3. FreshSpace Booking Flow Component
- ✅ Created `freshspace-booking.tsx` (541 lines)
- ✅ **Step 1: Home Size Selection**
  - 4 tiers: 1-2 bed/1 bath ($99) → 5+ bed/3+ bath ($249)
  - Card-based selection with pricing

- ✅ **Step 2: Clean Type Selection**
  - Standard Clean (1x base price) - regular maintenance
  - Deep Clean (1.5x base price) - includes baseboards, appliances, cabinets
  - Move-In/Move-Out (2x base price) - comprehensive empty home clean
  - Includes list of what's covered for each type

- ✅ **Step 3: Add-Ons**
  - Inside Oven (+$35)
  - Inside Refrigerator (+$35)
  - Interior Windows (+$5 per window)
  - Laundry 2 loads (+$30)
  - Organize Closet (+$40)
  - Pet Hair Treatment (+$25)

- ✅ **Step 4: One-Time vs Recurring**
  - One-time booking option
  - Recurring with automatic discounts:
    - Weekly: 15% off
    - Biweekly: 10% off
    - Monthly: 5% off
  - Preferred day selection (Monday-Sunday)
  - Preferred time window (Morning/Afternoon/Evening)
  - Clear 3-booking minimum messaging

- ✅ **Step 5: Special Instructions**
  - Supplies option: Pro brings everything (recommended) or customer provides
  - Special instructions textarea: pets, alarm code, gate code, areas to avoid
  - **Complete price breakdown summary:**
    - Base price for home size
    - Clean type multiplier
    - Add-ons itemized
    - Recurring discount applied
    - Final total displayed

- ✅ Progress indicator (5 visual steps)
- ✅ Real-time price calculation throughout
- ✅ Mobile-responsive design
- ✅ Back navigation between steps

---

## 🚧 IN PROGRESS / TODO

### 4. Integration with Main Booking Flow
- [ ] Update `/client/src/pages/booking.tsx` to detect `home_cleaning` service type
- [ ] Route to FreshSpace booking component when home_cleaning selected
- [ ] Pass address and service type to FreshSpace component
- [ ] Handle completion callback to create service request

### 5. Room-by-Room Checklist Templates
- [ ] Create checklist template constants:
  - **Kitchen tasks** (10 items): countertops, sink, stovetop, microwave, appliances, cabinets, floor, trash, switches, +deep tasks
  - **Bathroom tasks** (8 items): toilet, shower/tub, sink/vanity, mirror, floor, trash, towels, switches, +deep tasks
  - **Bedroom tasks** (6 items): bed made, surfaces dusted, floor, trash, mirror, +deep tasks
  - **Living areas** (6 items): surfaces dusted, floor, couch, TV, trash, switches, +deep tasks
  - **General tasks** (4 items): all trash to bins, lights off, doors locked, alarm re-set
  - **Move-in/move-out additions** (7 items): closets, cabinets, light fixtures, vents, garage, patio, interior windows

- [ ] Create checklist generator function that returns appropriate tasks based on:
  - Home size (number of bedrooms/bathrooms)
  - Clean type (standard/deep/move-in-move-out)
  - Add-ons selected

### 6. Pro Dashboard: Checklist Completion Interface
- [ ] Create `/client/src/components/verification/cleaning-checklist.tsx`
- [ ] Features needed:
  - Display all checklist items grouped by room
  - Checkbox for each task
  - "Skip" button with reason input
  - Real-time progress indicator (e.g., "32/48 tasks completed")
  - Validate minimum completion rate before allowing job completion
  - Save checklist progress to database

### 7. Before/After Photo Verification with AI Cleanliness Scoring
- [ ] Extend existing job verification workflow for FreshSpace
- [ ] **Before photos:**
  - Minimum 4 required (Kitchen, Main Bathroom, Main Living Area, Worst Area)
  - AI analyzes and generates `cleanliness_score_before` (1-10 scale)
  - Scores based on: clutter level, visible dirt, organization, surfaces

- [ ] **After photos:**
  - Minimum 4 matching angles from before photos
  - AI analyzes and generates `cleanliness_score_after` (1-10 scale)
  - Compare before/after scores

- [ ] **FreshSpace Report Generation:**
  - Before/after side-by-side photos
  - Cleanliness improvement score (e.g., "3.2 → 9.4")
  - Checklist completion rate
  - Time spent
  - Rooms cleaned
  - Add-ons completed
  - Pro name and rating

### 8. Recurring Subscription Management

#### Backend (API Routes):
- [ ] `POST /api/subscriptions/create` - Create new recurring subscription
- [ ] `GET /api/subscriptions/:id` - Get subscription details
- [ ] `PUT /api/subscriptions/:id/pause` - Pause subscription
- [ ] `PUT /api/subscriptions/:id/resume` - Resume subscription
- [ ] `PUT /api/subscriptions/:id/cancel` - Cancel subscription
- [ ] `GET /api/subscriptions/customer/:customerId` - Get all customer subscriptions
- [ ] `POST /api/subscriptions/:id/skip-booking` - Skip a single booking
- [ ] `PUT /api/subscriptions/:id/reschedule` - Change day/time

#### Stripe Integration:
- [ ] Create Stripe subscription on recurring booking
- [ ] Store `stripe_subscription_id` in database
- [ ] Set up webhook handler for subscription events:
  - `invoice.payment_succeeded` → auto-create next service request
  - `invoice.payment_failed` → notify customer, retry payment
  - `customer.subscription.deleted` → mark subscription as cancelled

#### Auto-Booking Job:
- [ ] Create cron job or background worker:
  - Runs daily
  - Finds subscriptions with `next_booking_date` within 7 days
  - Auto-creates service request
  - Assigns same Pro if available (or backup Pro)
  - Sends booking confirmation email/SMS
  - Updates `next_booking_date` based on frequency

#### Customer Dashboard:
- [ ] Create `/client/src/pages/customer-subscriptions.tsx`:
  - List all active/paused/cancelled subscriptions
  - Show next scheduled clean
  - Display assigned Pro (with photo and rating)
  - Quick actions: Skip next booking, Pause, Cancel, Update day/time
  - Subscription history with all past cleans
  - Add/remove add-ons for future bookings

### 9. Cross-Sell Integration

#### After LiftCrew Booking Completion:
- [ ] Show cross-sell prompt:
  - "Your move is done! Need a move-out clean at your old place?"
  - "Book FreshSpace Move-Out and save 10%"
  - Button: "Book Move-Out Clean"
  - Link directly to FreshSpace booking with:
    - `cleanType` pre-selected as "moveInOut"
    - Apply 10% discount code automatically

#### After GarageReset Booking Completion:
- [ ] Show cross-sell prompt:
  - "Garage looking great! Want the rest of the house to match?"
  - "Book a FreshSpace Standard Clean"
  - Button: "Clean My Home"

#### After ClearOut Booking Completion:
- [ ] Show cross-sell prompt:
  - "Now that the clutter is gone, let us make it shine."
  - "Book FreshSpace and save 10% as a returning customer"
  - Button: "Book Cleaning"

#### On HomeScore Results Page:
- [ ] If cleanliness score is low (< 6), recommend:
  - "A FreshSpace Deep Clean could transform your space."
  - "Starting at $149"
  - Button: "Get a Quote"

### 10. Chat Bot & SMS Bot Updates

#### Update AI Knowledge Base:
- [ ] Add FreshSpace pricing tiers to `ai-assistant.ts`:
  - Standard pricing by home size
  - Deep clean multiplier (1.5x)
  - Move-in/move-out multiplier (2x)
  - All add-on options and prices
  - Recurring discounts (weekly 15%, biweekly 10%, monthly 5%)

- [ ] Add qualifying questions for bots:
  - "How many bedrooms and bathrooms?"
  - "What type of clean? Standard, deep, or move-in/move-out?"
  - "One-time or recurring? Recurring saves 10-15%!"

- [ ] Add booking flow guidance:
  - Bot asks questions → calculates instant price → provides booking link

- [ ] Update SMS bot to handle FreshSpace inquiries:
  - Recognize keywords: "cleaning", "clean", "maid", "house cleaning"
  - Respond with FreshSpace intro and pricing
  - Offer to book via link

### 11. Pro Onboarding for Cleaning Specialty

#### Pro Profile Updates:
- [ ] Add `"cleaning"` to `serviceTypes` array in `haulerProfiles` table
- [ ] During Pro onboarding, add "Home Cleaning" checkbox to service selection

#### Cleaning-Specific Verification:
- [ ] Add optional certification upload during onboarding:
  - Residential cleaning experience verification
  - Years of experience input
  - References (2 required)

#### Training Module:
- [ ] Create `/client/src/pages/pro-academy/freshspace-training.tsx`:
  - UpTend cleaning standards walkthrough
  - Photo documentation requirements (before/after angles)
  - Checklist completion walkthrough
  - Quality score tracking explanation
  - First 5 jobs flagged for quality monitoring

#### Supply Kit Option (Future Feature):
- [ ] Pro can request UpTend-provided cleaning supply kit
- [ ] Kit includes all standard cleaning supplies
- [ ] Kit cost deducted from first payout

### 12. Matching & Assignment Logic

#### Recurring Booking Assignment:
- [ ] When recurring subscription created, assign Pro and store `assigned_pro_id`
- [ ] For each auto-generated booking:
  - Check if assigned Pro is available on preferred day/time
  - If available: assign automatically
  - If not available: find backup Pro and notify customer:
    - "Your regular Pro [Name] isn't available this week."
    - "[Backup Pro Name] will take care of your home — same quality guaranteed."

#### Pro Availability for Recurring:
- [ ] Allow Pros to set recurring availability schedule:
  - Which days they're available for recurring bookings
  - Block out specific dates (vacations, etc.)
  - System respects these preferences when assigning

### 13. Pricing & Payment Updates

#### Service Starting Prices:
- [x] Already updated in `bundle-pricing.ts`:
  - `home_cleaning: 99`

#### Payment Flow:
- [ ] Support BNPL (Afterpay/Klarna) for FreshSpace bookings $199+
- [ ] For recurring subscriptions:
  - Customer payment method stored via Stripe
  - Auto-charge on day of each scheduled clean (24 hours before)
  - If payment fails: retry once, then notify customer and pause schedule

### 14. Email/SMS Notifications

#### New Templates Needed:
- [ ] **Booking Confirmation:**
  - "FreshSpace clean scheduled for [date] at [time]"
  - Assigned Pro name and photo
  - What to expect / prep checklist

- [ ] **Pro ETA Notification:**
  - "Your Pro is on the way! ETA: 15 minutes"
  - Live tracking link

- [ ] **Job Started:**
  - "Your FreshSpace clean has started"
  - Estimated completion time

- [ ] **Job Completed - Awaiting Review:**
  - "Your clean is done! Review your FreshSpace Report"
  - Link to before/after photos and checklist
  - Approve or flag issues

- [ ] **Recurring Booking Reminder:**
  - "Your FreshSpace clean is scheduled for tomorrow at [time]"
  - Option to skip or reschedule

- [ ] **Recurring Payment Confirmation:**
  - "Payment of $[amount] processed for your FreshSpace clean"
  - Next scheduled clean: [date]

- [ ] **Recurring Subscription Created:**
  - "Your [frequency] FreshSpace plan is active!"
  - Next clean: [date]
  - Your assigned Pro: [name]
  - Manage subscription link

### 15. Admin Dashboard Features

- [ ] View all recurring subscriptions (active/paused/cancelled)
- [ ] Monitor churn rate (cancellation reasons)
- [ ] Track Pro quality scores for FreshSpace jobs
- [ ] View cleanliness score improvements across all jobs
- [ ] Flag jobs with low customer satisfaction for review

### 16. Testing & QA

- [ ] Unit tests for FreshSpace booking component
- [ ] Integration tests for recurring subscription creation
- [ ] Test Stripe webhook handlers
- [ ] Test auto-booking cron job
- [ ] Test Pro checklist completion flow
- [ ] Test before/after AI cleanliness scoring
- [ ] E2E test: Complete booking flow → Job completion → Customer approval
- [ ] E2E test: Recurring subscription → Auto-booking → Pro assignment

---

## 📊 Progress Summary

**Completed:** 3 major components (database schema, booking flow, branding updates)

**In Progress:** 0

**Remaining:** 13 major features/integrations

**Estimated Work:**
- Core functionality: ~15-20 hours
- Recurring subscription system: ~8-10 hours
- Pro dashboard & checklist: ~6-8 hours
- Cross-sells & notifications: ~4-6 hours
- Testing & QA: ~4-6 hours

**Total Estimated:** ~37-50 hours

---

## 🎯 Next Priority Tasks (Recommended Order)

1. **Integration with main booking flow** (2 hours)
   - Route home_cleaning service type to FreshSpace component
   - Handle service request creation with FreshSpace details

2. **Room-by-room checklist templates** (3 hours)
   - Define all task templates
   - Create checklist generator function
   - Seed database with checklist when FreshSpace job created

3. **Pro dashboard checklist interface** (6 hours)
   - Build UI for task completion
   - Real-time progress tracking
   - Integration with job verification flow

4. **Before/after photo AI scoring** (4 hours)
   - Extend GPT-4o Vision prompt for cleanliness scoring
   - Generate before/after scores
   - Create FreshSpace Report component

5. **Chat/SMS bot updates** (2 hours)
   - Add FreshSpace to knowledge base
   - Update qualifying question logic
   - Test bot conversations

6. **Recurring subscription backend** (8 hours)
   - API routes for CRUD operations
   - Stripe subscription integration
   - Auto-booking cron job

7. **Customer subscription dashboard** (5 hours)
   - UI for managing subscriptions
   - View upcoming cleans
   - Skip/pause/cancel actions

8. **Cross-sell prompts** (3 hours)
   - After-booking modals
   - Discount code logic
   - Link generation

---

## 🔍 Files Modified/Created So Far

### Modified:
1. `shared/schema.ts` - Added home_cleaning service, cleanliness scores, new tables
2. `client/src/lib/bundle-pricing.ts` - Updated pricing for all services, added HOURLY_RATE_PER_PRO
3. `client/src/pages/pricing.tsx` - Branded service names, correct pricing, added FreshSpace
4. `client/src/pages/services.tsx` - Branded service names, correct pricing, added FreshSpace
5. `server/services/ai-assistant.ts` - Updated knowledge base with branded names and pricing
6. `server/services/ai-analysis.ts` - Fixed syntax error

### Created:
1. `client/src/components/booking/freshspace-booking.tsx` - Complete 5-step booking flow (541 lines)

### Git Commits:
1. `72b6cbc` - Update service branding and pricing across application
2. `1e4e3dc` - Fix branding: Replace FlowGuard with GutterShield
3. `f43d595` - Add FreshSpace (Home Cleaning) database schema
4. `c64ed9a` - Build FreshSpace booking flow component

---

## 📝 Notes

- All pricing is calculated dynamically based on home size, clean type, add-ons, and recurring frequency
- Recurring subscriptions require 3-booking minimum, then month-to-month
- Same Pro assigned to all recurring bookings for consistency (builds customer trust)
- Cross-sell prompts target logical upsells (move-out clean after LiftCrew, etc.)
- AI cleanliness scoring provides objective before/after comparison for customer satisfaction
- Room-by-room checklists ensure thorough and consistent cleaning quality

---

**Last Updated:** 2025-02-08
**Status:** Foundation complete, ready for integration and remaining features
