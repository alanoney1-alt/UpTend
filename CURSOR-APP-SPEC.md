# UpTend Mobile App — Complete Build Spec for Cursor

## DROP THIS ENTIRE FILE INTO CURSOR AS YOUR PROJECT INSTRUCTIONS

---

## What You're Building

A React Native (Expo) mobile app where **Mr. George is the entire UI**. George is an AI home services assistant with 162 tools. The app is a chat interface first — everything happens through conversation with George. Dashboard views exist but are secondary to the chat.

**Backend is already built and live at `https://uptendapp.com`**. You are ONLY building the mobile frontend. Every API call goes to the live backend.

**Tech Stack:**
- React Native + Expo SDK 52+
- TypeScript
- React Navigation 6
- Expo Router (file-based routing)
- AsyncStorage for local persistence
- Expo Camera, Expo Image Picker
- Expo Notifications (push)
- WebSocket for real-time tracking

---

## Architecture: George IS the UI

The app has ONE primary screen: the George chat. Everything flows through it.

```
App Structure:
├── Auth (Login / Signup / Google OAuth)
├── George Chat (THE main screen — 80% of the app)
│   ├── Text messages
│   ├── Photo upload → AI vision analysis
│   ├── Embedded YouTube video player
│   ├── Clickable product links
│   ├── Booking flow (inline cards)
│   ├── Pro match results (inline cards)
│   ├── Home DNA Scan flow
│   ├── Emergency SOS mode
│   └── Quick action buttons
├── Dashboard (secondary — collapsible sections)
│   ├── Active Jobs (Uber-style tracker)
│   ├── My Home (address, home profile)
│   ├── Spending & Loyalty
│   └── Booking History
├── Pro Mode (if user is a pro)
│   ├── Available Jobs
│   ├── My Earnings
│   ├── My Rates
│   ├── Background Check form
│   ├── Academy / Certifications
│   └── Availability toggle
├── B2B Mode (if user is business)
│   ├── Properties
│   ├── Employees
│   ├── Compliance
│   └── Billing
└── Profile & Settings
```

---

## API Reference

**Base URL:** `https://uptendapp.com`
**Auth:** Cookie-based sessions (send `credentials: 'include'` on all requests)

### Authentication
```
POST /api/customers/register     — { firstName, lastName, email, password, phone? }
POST /api/customers/login        — { email, password }
POST /api/customers/logout
POST /api/haulers/register       — { email, password, firstName, lastName, phone, serviceTypes[], city, state, zip }
POST /api/haulers/login          — { email, password }
POST /api/haulers/logout
POST /api/auth/login             — { email, password } (unified — auto-detects role)
POST /api/auth/register          — { email, password, firstName, lastName, role: "customer"|"hauler" }
GET  /api/auth/user              — returns current logged-in user
GET  /api/auth/google            — Google OAuth redirect
GET  /api/auth/google/callback   — Google OAuth callback
POST /api/auth/google/token      — { idToken } for mobile Google Sign-In
```

### George AI Chat (THE CORE API)
```
POST /api/ai/guide/chat
  Body: {
    message: string,           // user's text message
    conversationHistory?: [],  // array of { role: "user"|"assistant", content: string }
    userId?: string,           // logged-in user ID
    userRole?: "customer"|"hauler"|"business",
    photoBase64?: string       // base64 photo for vision analysis
  }
  Response: {
    response: string,          // George's text response (may contain YouTube URLs and product links)
    suggestions?: string[],    // quick reply button labels
    toolsUsed?: string[],      // which tools George called
    bookingCreated?: object,   // if a booking was made
    error?: string
  }
```

**CRITICAL:** George's response text may contain:
- YouTube URLs (`https://www.youtube.com/watch?v=XXXXX`) → render as embedded video players
- Product URLs (`https://amazon.com/dp/XXX?tag=uptend20-20`) → render as tappable links that open in browser
- Markdown bold (`**text**`) → render as bold
- Markdown links (`[text](url)`) → render as tappable links

### Customer Endpoints
```
GET  /api/customers/addresses              — saved addresses
POST /api/customers/addresses              — { address, city, state, zip, lat?, lng? }
GET  /api/service-requests                 — customer's bookings
POST /api/service-requests                 — create booking
GET  /api/service-requests/:id             — booking details
POST /api/service-requests/:id/review      — { rating, comment, tags? }
GET  /api/home-inventory                   — appliance inventory
POST /api/home-inventory                   — add appliance
GET  /api/home-scan/health                 — Home DNA Scan health score
GET  /api/customer/properties              — multi-property management
POST /api/customer/properties              — add property
GET  /api/loyalty/status                   — loyalty tier + points
GET  /api/loyalty/rewards                  — available rewards
POST /api/loyalty/redeem                   — { rewardId }
GET  /api/referral/status                  — referral code + earnings
```

### Pro Endpoints
```
GET  /api/hauler/dashboard                 — pro dashboard data
GET  /api/hauler/earnings                  — earnings breakdown
GET  /api/hauler/available-jobs            — jobs to accept
POST /api/hauler/jobs/:id/accept           — accept a job
POST /api/hauler/jobs/:id/start            — start job
POST /api/hauler/jobs/:id/complete         — complete job
POST /api/hauler/jobs/:id/photos           — upload job photos
GET  /api/pro/fee-status                   — platform fee (15% flat)
POST /api/pro/background-check             — submit background check info
GET  /api/pro/rates                        — current rate settings
POST /api/pro/rates                        — update rates per service
GET  /api/academy/certifications           — available cert programs
GET  /api/academy/my-certifications        — pro's earned certs
POST /api/academy/certifications/:slug/enroll
POST /api/academy/certifications/:slug/quiz
GET  /api/academy/earnings-potential
```

### B2B Endpoints
```
POST /api/auth/business/signup             — { companyName, email, password, businessType }
POST /api/auth/business/login              — { email, password }
GET  /api/auth/business/context            — current business context
POST /api/business-partner/employees       — add employee as pro
GET  /api/business-partner/employees       — list employees
GET  /api/b2b-pricing/plans                — available plans
POST /api/b2b-pricing/subscribe            — subscribe to plan
GET  /api/b2b/compliance/:businessId       — compliance status
GET  /api/b2b/documents/:businessId        — documents
```

### Booking & Services
```
GET  /api/services                         — all 12 service types with pricing
GET  /api/services/:type/pricing           — pricing for specific service
POST /api/smart-book                       — smart match booking (George uses this)
GET  /api/smart-book/result/:id            — match result
GET  /api/find-pro                         — search pros by service/location
GET  /api/find-pro/:id                     — pro profile
```

### Real-time
```
WebSocket: wss://uptendapp.com/ws
  Events:
  - job:status_update    — { jobId, status, proLocation? }
  - pro:location_update  — { jobId, lat, lng, eta }
  - booking:accepted     — { jobId, proName }
  - notification         — { type, title, body }
```

### Other Key Endpoints
```
GET  /api/health                           — server health check
POST /api/ai/analyze-photos                — photo analysis (GPT-5.2 vision)
POST /api/push/register                    — { expoPushToken } register for push notifications
POST /api/sms/incoming                     — Twilio SMS webhook
POST /api/voice/incoming                   — Twilio voice IVR
GET  /api/properties/lookup?address=...    — RentCast property data
```

---

## George's 162 Tools (What He Can Do)

George calls these tools server-side. The app just sends messages and renders responses. But you need to know what George can do to build appropriate UI cards:

### Booking & Pricing (12 tools)
get_service_pricing, calculate_quote, get_bundle_options, check_availability, create_booking_draft, get_customer_jobs, get_all_services, smart_match_pro, get_customer_address, check_pro_availability, send_booking_confirmation, generate_payment_link

### Home Management (20 tools)
get_home_profile, get_service_history, get_seasonal_recommendations, get_maintenance_schedule, get_neighborhood_insights, get_morning_briefing, get_weather_alerts, get_home_dashboard, get_spending_tracker, get_trash_schedule, get_home_value_estimate, get_calendar_suggestion, get_seasonal_countdown, get_tonight_checklist, set_home_reminder, get_utility_providers, get_recycling_schedule, get_sprinkler_settings, get_water_restrictions, get_home_maintenance_reminders

### DIY & Shopping (12 tools)
find_diy_tutorial, get_next_tutorial_video, search_products, get_product_recommendation, compare_prices, get_shopping_list, start_diy_project, get_seasonal_diy_suggestions, get_diy_guide, get_step_by_step_walkthrough, get_home_tips, log_diy_completion

### Home DNA Scan (4 tools)
get_home_scan_info, start_home_scan, process_home_scan_photo, get_home_scan_progress

### Vision / Photo Analysis (3 tools)
diagnose_from_photo, analyze_photo_in_chat, scan_receipt_photo

### Pro Tools (15 tools)
get_pro_dashboard, get_pro_earnings, get_pro_schedule, get_pro_certifications, get_certification_programs, start_certification_module, submit_certification_quiz, get_pro_market_insights, get_pro_reviews, get_pro_arrival_info, get_pro_demand_forecast, get_pro_customer_retention, get_pro_goal_progress, set_pro_goal, get_pro_job_prompts

### Communication (8 tools)
send_email_to_customer, call_customer, get_call_status, send_quote_pdf, get_pro_live_location, add_to_calendar, send_whatsapp_message, send_push_notification

### Emergency (4 tools)
activate_emergency_mode, get_emergency_shutoff_guide, generate_insurance_claim_packet, create_emergency_dispatch

### Intelligence (10 tools)
calculate_home_health_score, predict_maintenance_needs, analyze_contractor_quote, get_market_rate, get_neighborhood_insights_v2, find_neighbor_bundles, get_local_alerts, identify_pest, assess_water_damage, get_nearby_pro_deals

### Loyalty & Rewards (6 tools)
get_customer_loyalty_status, get_customer_milestones, get_wallet_balance, get_available_rewards, redeem_reward, get_referral_code

### Vehicle (8 tools)
add_vehicle_to_profile, get_vehicle_maintenance_schedule, diagnose_car_issue, search_auto_parts, find_auto_tutorial, get_obd_code, get_maintenance_due, get_purchase_history

### B2B (8 tools)
generate_service_agreement, get_document_status, get_portfolio_analytics, get_vendor_scorecard, get_billing_history, get_compliance_status, generate_roi_report, check_pro_recruitment

### Booking Management (2 tools)
cancel_booking, reschedule_booking

### Other (12 tools)
get_storm_prep_checklist, generate_claim_documentation, get_referral_status, get_neighborhood_group_deals, get_neighborhood_activity, get_local_events, get_post_booking_question, add_custom_reminder, connect_smart_home, get_smart_home_status, start_insurance_claim, get_warranty_tracker

---

## Design System

### Colors
```
Primary: #F59E0B (amber-500) — buttons, accents, George's identity
Primary Dark: #D97706 (amber-600) — hover states
Background: #FFFBF5 (warm cream) — app background
Surface: #FFFFFF — cards
Text Primary: #1E293B (slate-800)
Text Secondary: #64748B (slate-500)
Border: #E2E8F0 (slate-200)
Success: #22C55E (green-500)
Error: #EF4444 (red-500)
George Bubble: #FEF3C7 (amber-100) — George's chat messages
User Bubble: #F1F5F9 (slate-100) — user's chat messages
```

### Typography
```
Headlines: System font, bold, 24-32px
Body: System font, regular, 16px
Small: System font, 14px
Chat text: 16px (readability first)
```

### Design Rules
- ZERO emojis anywhere — clean, typographic, professional
- No gradients on cards — flat, clean surfaces
- Rounded corners: 12px cards, 24px buttons, 999px pills
- Subtle shadows only: `0 1px 3px rgba(0,0,0,0.1)`
- George's avatar: amber circle with "G" — no cartoon faces
- Apple-level polish — smooth animations, no jank
- Bottom sheet modals, not full-page transitions for quick actions

---

## Screen-by-Screen Build Guide

### 1. Splash / Onboarding (3 screens)
- Clean amber/cream splash with UpTend logo
- 3 swipe cards: "Meet George" / "Book in seconds" / "Your home, managed"
- "Get Started" → Sign Up or Log In

### 2. Auth Screens
- **Login:** Email + password, "Continue with Google" button, tabs for Homeowner / Pro
- **Sign Up (Customer):** First name, last name, email, phone (optional), password
- **Sign Up (Pro):** Same + service types multi-select, city/state/zip
- **Forgot Password:** Email input → sends reset link
- Google Sign-In: Use `expo-auth-session` with Google provider, send idToken to `POST /api/auth/google/token`

### 3. George Chat (THE MAIN SCREEN)
This is 80% of the app. Build it beautifully.

**Layout:**
- Top bar: "Mr. George" title, user avatar, settings gear
- Chat messages area (FlatList, inverted)
- Quick action chips below chat: "Book a Service", "Home Check", "Photo Diagnosis", "DIY Help"
- Input bar: text input, camera button (photo upload), send button

**Message Types to Render:**
- **Text** — plain text with markdown bold support
- **George greeting** — first message with quick action buttons
- **YouTube video** — detect `youtube.com/watch?v=` URLs → render inline video player (WebView or react-native-youtube-iframe)
- **Product links** — detect amazon/homedepot/lowes URLs → render product card with title, price, "Buy" button that opens in browser
- **Booking card** — when George creates a booking, show inline card: service, date, price, "Confirm" button
- **Pro match card** — when George matches a pro: first name, rating, price, "Book Now" button (NO last name, phone, email, or business name)
- **Photo** — when user sends a photo, show thumbnail, then George's analysis
- **Home DNA progress** — scan progress card with room-by-room checklist
- **Emergency mode** — red-tinted interface with safety steps and "Call 911" button

**Photo Upload Flow:**
1. User taps camera icon
2. Show options: "Take Photo" (Expo Camera) or "Choose from Library" (Expo ImagePicker)
3. Convert to base64
4. Send to `POST /api/ai/guide/chat` with `photoBase64` field
5. Show loading state ("George is analyzing your photo...")
6. Render George's diagnosis response

**Conversation Persistence:**
- Store conversation history in AsyncStorage
- Send last 20 messages as `conversationHistory` with each request
- Clear on explicit "New Chat" action

### 4. Customer Dashboard
Accessible from bottom tab or George saying "check your dashboard."

**Sections (collapsible accordion):**
- **Active Jobs** — Uber-style status stepper (Requested → Accepted → En Route → In Progress → Complete)
  - Tap to see live pro location on map
- **My Home** — address, Home Health Score (0-100), last scan date
- **Recent Bookings** — list with status badges
- **Spending** — monthly total, comparison to last month
- **Loyalty** — tier badge (Bronze/Silver/Gold/Platinum), points balance, available rewards

### 5. Pro Dashboard
Only visible when logged in as pro (role=hauler).

**Sections:**
- **Availability Toggle** — big on/off switch at top
- **Today's Jobs** — accepted jobs with addresses, times
- **Available Jobs** — new jobs to accept (accept/decline buttons)
- **Earnings** — today, this week, this month, with 85% keep rate shown
- **My Rates** — slider per service type within min/max range
- **Onboarding Checklist** — profile, background check, academy, bank account
- **Background Check** — form: legal name, DOB, SSN last 4, address, DL#, consent checkbox

### 6. B2B Dashboard
Only visible when logged in as business.

**Sections:**
- **Properties** — list with address, unit count, service history
- **Employees** — pros linked to this business
- **Compliance** — document status, expiration alerts
- **Billing** — current plan, invoices, usage

### 7. Profile & Settings
- Edit name, email, phone, password
- Saved addresses
- Payment methods (Stripe)
- Notification preferences
- Language toggle (English / Spanish)
- Sign out
- Delete account

### 8. Job Live Tracker (push from dashboard)
- Full-screen map (react-native-maps)
- Pro's live location pin (updates via WebSocket)
- ETA display
- Pro info card at bottom: first name, rating, vehicle description
- Status stepper overlay
- "Call George" button (opens chat about this job)

### 9. Emergency SOS
- Accessible from George chat ("I have an emergency") or dedicated button
- Red interface
- "What's happening?" → George activates emergency mode
- Inline safety steps
- "Call 911" prominent button
- George dispatches emergency pro simultaneously

---

## Bottom Navigation (3 tabs only)

```
[ Home ]    [ George ]    [ Profile ]
```

- **Home** — Dashboard (customer/pro/B2B depending on role)
- **George** — Chat screen (THE primary screen)
- **Profile** — Settings, account, sign out

George tab should have the amber highlight. It's the default/home screen.

---

## Critical Implementation Notes

### 1. George Response Parsing
Build a message renderer that detects and handles:
```typescript
// Detect YouTube URLs and render inline player
const youtubeRegex = /https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/g;

// Detect product URLs and render buy cards
const productRegex = /https?:\/\/(www\.)?(amazon|homedepot|lowes|walmart)\.com\/[^\s)]+/g;

// Detect markdown bold
const boldRegex = /\*\*(.*?)\*\*/g;

// Detect markdown links
const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
```

### 2. Auth Token Management
The backend uses HTTP-only cookies. For React Native:
- Use `credentials: 'include'` on all fetch calls
- Or extract the session cookie and store in AsyncStorage, send as `Cookie` header
- Google Sign-In: Use `expo-auth-session`, get `idToken`, send to `/api/auth/google/token`

### 3. Push Notifications
```typescript
import * as Notifications from 'expo-notifications';

// Get token and register
const token = await Notifications.getExpoPushTokenAsync();
await fetch('https://uptendapp.com/api/push/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ expoPushToken: token.data })
});
```

### 4. WebSocket for Live Tracking
```typescript
const ws = new WebSocket('wss://uptendapp.com/ws');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'pro:location_update') {
    // Update map marker
  }
};
```

### 5. Photo Upload
```typescript
const pickImage = async () => {
  const result = await ImagePicker.launchCameraAsync({
    base64: true,
    quality: 0.7,
    allowsEditing: true,
  });
  if (!result.canceled) {
    const base64 = result.assets[0].base64;
    // Send to George
    const response = await fetch('https://uptendapp.com/api/ai/guide/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        message: 'Analyze this photo',
        photoBase64: base64,
        userId: currentUser.id,
        userRole: 'customer'
      })
    });
  }
};
```

### 6. Offline Support
- Cache last George conversation in AsyncStorage
- Show cached dashboard data when offline
- Queue messages when offline, send when back online
- Show "Offline" banner at top

### 7. Deep Linking
```
uptend://chat                    — open George chat
uptend://chat?message=emergency  — open chat with emergency message
uptend://job/:id                 — open job tracker
uptend://book?service=junk_removal — open chat with booking intent
```

---

## Services & Pricing (for reference)

| Service | Starting Price |
|---------|---------------|
| Junk Removal | $99 |
| Pressure Washing | $120 |
| Handyman | $75/hr |
| Home Cleaning | $99 |
| Gutter Cleaning (1-story) | $150 |
| Gutter Cleaning (2-story) | $225 |
| Landscaping | $59 |
| Moving Labor | $65/hr |
| Demolition | $199 |
| Garage Cleanout | $129 |
| Pool Cleaning | $120/mo |
| Carpet Cleaning | $50/room |

Platform fees: 15% pro / 5% customer service fee

---

## What NOT to Build
- No admin panel (web only)
- No accounting/invoicing (web only)
- No content management (web only)
- No competitor mentions anywhere
- No emojis anywhere
- No AI/ML language on customer-facing screens (say "George" not "AI")
- No pro contact details to customers (first name + rating only)

---

## Brand Voice
George is: direct, knowledgeable, warm but not cheesy, zero filler words, zero emojis. He's the friend who knows everything about homes and can actually get things done — not a chatbot, not a virtual assistant, but a real home expert who happens to live in your phone.

---

## File Structure (suggested)
```
src/
├── app/                    # Expo Router
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── forgot-password.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx     # Bottom tab navigator
│   │   ├── index.tsx       # Dashboard (home tab)
│   │   ├── george.tsx      # George chat (main tab)
│   │   └── profile.tsx     # Profile & settings
│   ├── job/[id].tsx        # Live job tracker
│   ├── pro/
│   │   ├── dashboard.tsx
│   │   ├── rates.tsx
│   │   ├── background-check.tsx
│   │   └── academy.tsx
│   └── business/
│       ├── dashboard.tsx
│       └── employees.tsx
├── components/
│   ├── chat/
│   │   ├── ChatBubble.tsx
│   │   ├── MessageRenderer.tsx   # Parses George responses
│   │   ├── VideoPlayer.tsx       # YouTube embed
│   │   ├── ProductCard.tsx       # Product link card
│   │   ├── BookingCard.tsx       # Inline booking card
│   │   ├── ProMatchCard.tsx      # Pro match result
│   │   ├── PhotoUpload.tsx       # Camera/gallery picker
│   │   └── QuickActions.tsx      # Chip buttons
│   ├── dashboard/
│   │   ├── JobStepper.tsx
│   │   ├── HomeScore.tsx
│   │   └── LoyaltyBadge.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       └── Avatar.tsx
├── services/
│   ├── api.ts              # API client with auth
│   ├── george.ts           # George chat API wrapper
│   ├── websocket.ts        # WebSocket connection
│   └── storage.ts          # AsyncStorage helpers
├── hooks/
│   ├── useAuth.ts
│   ├── useGeorge.ts        # Chat state management
│   └── useWebSocket.ts
├── constants/
│   ├── colors.ts
│   ├── services.ts         # Service types + prices
│   └── config.ts           # API base URL
└── types/
    └── index.ts            # TypeScript interfaces
```

---

## Quick Start Commands
```bash
npx create-expo-app uptend-app --template expo-template-blank-typescript
cd uptend-app
npx expo install expo-camera expo-image-picker expo-notifications expo-auth-session expo-web-browser react-native-maps react-native-webview @react-navigation/native @react-navigation/bottom-tabs react-native-safe-area-context react-native-screens react-native-gesture-handler react-native-reanimated
```

---

## THE MOST IMPORTANT THING

George is not a feature. George IS the app. When someone opens this app, they see George. When they want to book, George handles it. When they want DIY help, George finds the video and the parts. When they have an emergency, George dispatches help. When they want to check their home health, George walks them through the scan.

The dashboard and profile screens are supporting cast. George is the star.

Build it like Apple would build iMessage if iMessage could book your plumber, diagnose your roof leak from a photo, and save you money on every home repair.
