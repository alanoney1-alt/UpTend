# George — UpTend AI Home Assistant
# Replit Mobile App Spec
# Drop this into Replit and say: "Build this React Native app"

---

## 1. What This App Is

George (aka Mr. George) is a **155-tool AI home assistant** — not a chatbot. He can:
- Diagnose home problems from photos (AI vision)
- Quote and book 12+ home services with real pricing
- Find YouTube tutorials and play them inline
- Search products across Amazon, Home Depot, Lowe's with buy links
- Track warranties, appliances, home health scores
- Manage vehicles, auto diagnostics, OBD-II codes
- Emergency dispatch for urgent home issues
- Morning briefings with weather, schedule, alerts
- Pro dashboard for service providers

**The app is a mobile front-end that calls the existing UpTend backend at `https://uptendapp.com`.** George's brain (Claude AI with 155 tools) lives on the server. The app is just the interface.

---

## 2. Tech Stack

- **React Native + Expo** (managed workflow)
- **TypeScript**
- **Expo Router** for file-based navigation
- **Backend:** `https://uptendapp.com/api/*`
- **Auth:** Cookie-based sessions (send `credentials: 'include'`)
- **Push:** Expo Push Notifications
- **Video:** WebView for inline YouTube player
- **Camera:** expo-camera + expo-image-picker for Snap & Book

---

## 3. Authentication

All API calls use cookie-based sessions. Every `fetch` must include `credentials: 'include'`.

### Customer Login
```
POST /api/customers/login
Body: { "email": "...", "password": "..." }
Response: { "success": true, "userId": "abc123", "role": "customer" }
```

### Customer Registration
```
POST /api/customers/register
Body: { "email": "...", "password": "...", "firstName": "...", "lastName": "...", "phone": "..." }
Response: { "success": true, "userId": "abc123" }
```

### Pro Login
```
POST /api/haulers/login
Body: { "email": "...", "password": "..." }
Response: { "success": true, "proId": "xyz789", "role": "hauler" }
```

### Google OAuth
```
GET /api/auth/google → redirects to Google
GET /api/auth/google/callback → sets session cookie, redirects to app
```

### Get Current User
```
GET /api/auth/user
Response: { "id": "...", "email": "...", "firstName": "...", "role": "customer"|"hauler"|"admin", ... }
```

### Auth Code Example (React Native)
```typescript
const API_BASE = 'https://uptendapp.com/api';

async function apiCall(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return res.json();
}

// Login
const { success, userId } = await apiCall('/customers/login', {
  method: 'POST',
  body: JSON.stringify({ email, password }),
});
```

---

## 4. Core Screens

### 4.1 George Chat (Main Screen — Tab 1)

This is the primary screen. George is the entire experience.

**API:**
```
POST /api/ai/guide/chat
Body: {
  "message": "string",           // User's text message
  "sessionId": "string",         // Persistent session ID (generate once, store in AsyncStorage)
  "context": {                   // Optional context
    "page": "/",
    "userRole": "consumer" | "pro" | "business",
    "userName": "John"
  },
  "photoUrl": "string",          // Optional: URL of uploaded photo
  "photoAnalysis": {}            // Optional: pre-analyzed photo data
}

Response: {
  "reply": "string",             // George's text response (may contain markdown, URLs)
  "sessionId": "string",
  "quickActions": [              // Optional quick action chips
    { "label": "Book a Pro", "action": "navigate:/book" },
    { "label": "Photo Quote", "action": "message:I want to send a photo" }
  ],
  "buttons": [                   // Optional action buttons from George
    { "text": "Book Now", "action": "navigate:/book?service=home_cleaning" },
    { "text": "See Pricing", "action": "reply:What are your prices?" }
  ],
  "actions": [                   // Optional structured actions
    { "type": "booking", "data": { ... } },
    { "type": "property_scan", "data": { ... } }
  ]
}
```

**How to Render George's Responses:**

George's `reply` is plain text with markdown. Parse and render these patterns:

1. **Plain text** → Chat bubble with markdown rendering (bold, italic, links)
2. **YouTube URLs** (`https://www.youtube.com/watch?v=XXXXX`) → Extract video ID, render inline video player using WebView
3. **Product/retailer URLs** (amazon.com, homedepot.com, lowes.com) → Render as tappable product cards that open in external browser
4. **Markdown links** `[text](url)` → Tappable links
5. **`buttons` array** → Render as tappable action chips below the message
6. **`quickActions` array** → Persistent quick action bar at bottom of chat

**Button/Action Types:**
- `"navigate:/path"` → Navigate within the app
- `"reply:message text"` → Send that text as the user's next message
- `"action:startBooking"` → Trigger app-specific action
- `"message:text"` → Same as reply

**Chat Rendering Code Example:**
```typescript
// Extract YouTube video IDs from text
function extractVideoIds(text: string): string[] {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/g;
  const ids: string[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) ids.push(match[1]);
  return ids;
}

// Render markdown-like formatting
function renderContent(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

// For each message, check for YouTube URLs and render video player
const videoIds = extractVideoIds(message.reply);
// Render each videoId as: <WebView source={{ uri: `https://www.youtube.com/embed/${videoId}` }} />
```

**Camera Button (Snap & Book):**
The chat screen should have a camera icon button. When tapped, open the camera or photo picker, then send the photo to Snap & Book API (see section 4.2).

**Photo Upload for Chat:**
```
POST /api/ai/guide/photo-analyze
Body: { "photoUrl": "data:image/jpeg;base64,...", "sessionId": "...", "serviceType": "junk_removal" }
Response: { "success": true, "analysis": { "detectedItems": [...], "priceRange": { "min": 99, "max": 299 }, ... } }
```

### 4.2 Snap & Book (Photo → Quote → Book in 60 seconds)

Accessible from camera button in chat or as standalone flow.

```
POST /api/snap-quote
Body: {
  "imageBase64": "base64-encoded-image",  // or "data:image/jpeg;base64,..."
  "description": "optional text",
  "address": "optional address"
}

Response: {
  "success": true,
  "confidence": "high" | "medium" | "low",
  "analysis": {
    "serviceType": "junk_removal",
    "serviceLabel": "Junk Removal",
    "problemDescription": "Half truck load of household items",
    "estimatedHours": 2
  },
  "quote": {
    "basePrice": 99,
    "adjustments": [{ "label": "Full truck load", "amount": 200 }],
    "totalPrice": 345,
    "priceDisplay": "$345",
    "guarantee": "Price Protection Guarantee -- this is your maximum price"
  },
  "bookingUrl": "/book?service=junk_removal&price=345&snapQuoteId=abc123",
  "snapQuoteId": "abc123"
}
```

**Book from Snap Quote:**
```
POST /api/snap-quote/:snapQuoteId/book
Body: { "scheduledDate": "2026-03-15", "scheduledTime": "morning" }
Response: {
  "success": true,
  "booking": {
    "serviceRequestId": "...",
    "serviceType": "junk_removal",
    "guaranteedCeiling": 345,
    "scheduledDate": "2026-03-15",
    "status": "requested"
  }
}
```

**UI Flow:**
1. Customer takes/selects photo
2. Show photo preview with loading animation ("George is analyzing...")
3. Show: AI analysis, service detected, price with guarantee badge
4. "Book Now" button → date/time picker → confirm

### 4.3 Home Dashboard

```
GET /api/service-requests              → Customer's jobs (status, dates, prices, assigned pro)
GET /api/loyalty/{userId}              → Loyalty tier, points, lifetime spend
GET /api/notifications                 → Job updates, alerts
GET /api/home-profile                  → Property data (beds, baths, sqft, pool, appliances)
GET /api/spending-tracker?period=month → Spending by category, budget tracking
GET /api/calendar/upcoming             → Upcoming scheduled services
GET /api/home-scan/progress            → Home DNA Scan status and credits
```

**Dashboard Cards:**
- Active jobs with status badge (pending → confirmed → en_route → in_progress → completed)
- Upcoming bookings
- Home Health Score (0-100)
- Loyalty tier progress
- Recent spending summary
- Maintenance reminders due

### 4.4 Booking Flow

**Step 1: Service Selection**
```
GET /api/certifications     → List of available services
GET /api/app-data/services  → Full service catalog with pricing
```

**Step 2: Details & Quote**
Use George chat or manual selection. For manual:
```
POST /api/pricing/quote
Body: { "serviceType": "home_cleaning", "selections": { "bedrooms": 3, "bathrooms": 2, "cleanType": "standard" } }
Response: { "totalPrice": 149, "breakdown": [...], "guaranteedCeiling": 149 }
```

**Step 3: Schedule & Book**
```
POST /api/service-requests
Body: {
  "serviceType": "home_cleaning",
  "pickupAddress": "123 Main St",
  "pickupCity": "Orlando",
  "pickupZip": "32801",
  "scheduledFor": "2026-03-15T09:00:00",
  "loadEstimate": "standard",
  "priceEstimate": 149,
  "description": "3 bed / 2 bath standard clean"
}
Response: { "id": "sr_abc123", "status": "requested", ... }
```

### 4.5 Find a Pro

```
GET /api/haulers/available?service=home_cleaning&zip=32801
Response: [
  {
    "id": "...",
    "companyName": "Marcus Cleaning Co",
    "rating": 4.9,
    "reviewCount": 47,
    "jobsCompleted": 203,
    "verified": true,
    "serviceTypes": ["home_cleaning", "carpet_cleaning"],
    "profilePhotoUrl": "..."
  }
]
```

**Pro Card UI:** Name, star rating, review count, jobs completed, verified badge, service types.

### 4.6 Home DNA Scan

Free home walkthrough — customer earns $25 credit + $1 per appliance scanned.

```
POST /api/home-scan/start
Body: { "customerId": "..." }
Response: { "scanSessionId": "...", "instructions": "...", "rooms": [...] }

POST /api/ai/room-scanner/analyze
Body: { "customerId": "...", "scanSessionId": "...", "roomName": "kitchen", "photoUrl": "data:..." }
Response: { "appliances": [...], "creditsEarned": 3, "totalCredits": 28 }

GET /api/home-scan/progress?customerId=...
Response: { "totalItems": 12, "creditsEarned": 37, "tier": "standard", "rooms": [...] }
```

**UI:** Room-by-room guided photo capture. Show credits earned, progress bar, appliance cards.

### 4.7 Profile

```
GET /api/auth/user                → User info
GET /api/loyalty/{userId}         → Loyalty tier, points
GET /api/referrals/mine           → Referral code, credits earned, pending
GET /api/vehicles                 → Customer's vehicles
GET /api/appliances               → Registered appliances
GET /api/warranties               → Warranty tracker
GET /api/purchases                → Purchase history
```

### 4.8 Pro Dashboard (if role = "hauler")

Separate tab layout for pros.

```
GET /api/haulers/dashboard           → Earnings, rating, jobs completed, tier
GET /api/haulers/earnings?period=month → Detailed earnings breakdown
GET /api/haulers/jobs                → Available and active jobs
GET /api/haulers/certifications      → Active certs, available programs
GET /api/haulers/quality-score       → Quality metrics
GET /api/haulers/jobs/:id/snap-details → Snap & Book job details with customer photo
```

**Pro Dashboard Cards:**
- Monthly earnings with goal progress
- Rating (e.g., 4.9 stars, 47 reviews)
- Active jobs list
- Certification progress (Bronze → Silver → Gold → Elite)
- Weekly payout info (payouts every Thursday)

---

## 5. All 12 Services (with Current Pricing)

| Service | Starting Price | Unit | Branded Name |
|---------|---------------|------|-------------|
| **Junk Removal** | $99 | flat | BulkSnap |
| **Home Cleaning** | $99 | dynamic (by home size) | PolishUp |
| **Carpet Cleaning** | $50/room | per room ($100 min) | DeepFiber |
| **Pressure Washing** | $120 | flat | FreshWash |
| **Landscaping** | $59 | flat (one-time mow) | FreshCut |
| **Pool Cleaning** | $99/mo | monthly | PoolSpark |
| **Handyman** | $75/hr | hourly (1-hr min) | FixIt |
| **Gutter Cleaning** | $129 | flat | GutterFlush |
| **Moving Labor** | $65/hr per mover | hourly | LiftCrew |
| **Garage Cleanout** | $129 | flat | GarageReset |
| **Light Demolition** | $199 | flat | Teardown |
| **Home DNA Scan** | **Free** | flat | DwellScan |

### Detailed Pricing

**Junk Removal:**
- Minimum (1-2 items): $99
- 1/8 Truck: $179, 1/4: $279, 1/2: $379, 3/4: $449, Full: $549
- Volume discount: 10% off at $400+, 15% at $600+

**Home Cleaning (by home size + clean type):**
- Standard, Deep, or Move-Out
- Price depends on bedrooms, bathrooms, stories
- 2-story surcharge applies
- Add-ons: fridge interior, oven, windows, laundry

**Carpet Cleaning:**
- Standard Steam: $50/room
- Deep Clean: $75/room
- Pet Treatment: $89/room
- Hallway: $25, Stairs: $25/flight
- Scotchgard: $20/room add-on
- Packages: 3BR/2BA $129, 4-5BR $215
- $100 minimum charge

**Landscaping:**
- One-time mow: $59 (≤1/4 acre), $89 (≤1/2 acre)
- Yard cleanup: $149-$299
- Mow & Go: $99/mo (≤1/4 acre), $149/mo (≤1/2 acre)
- Full Service: $159/mo (≤1/4 acre), $219/mo (≤1/2 acre)
- Premium: $249/mo (≤1/4 acre), $329/mo (≤1/2 acre)

**Pool Cleaning:**
- Basic: $99/mo (chemicals + skim)
- Standard: $165/mo (+ brush + vacuum)
- Full Service: $210/mo (+ tile + equipment)
- One-Time Deep Clean: $249

**Gutter Cleaning:**
- 1-Story (≤150 ft): $129
- 1-Story Large (150-250 ft): $179
- 2-Story (≤150 ft): $199
- 2-Story Large (150-250 ft): $259
- 3-Story: $350

**Moving Labor:** $65/hr per mover, 2-hour minimum
- Sub-types: Furniture Moving, Truck/Pod Unloading, General Labor

**Handyman:** $75/hr, 1-hour minimum, 10% discount for 3+ tasks

**Home DNA Scan:** Both Standard and Aerial are **FREE**
- $25 credit toward next booking
- $1 per appliance scanned (~$40-50 typical)
- Standard: 30 min interior + exterior walkthrough
- Aerial: 45 min with FAA-certified drone

---

## 6. Push Notifications

### Register Push Token
```
POST /api/push/register
Body: { "token": "ExponentPushToken[xxx]", "platform": "ios" | "android" }
```

### Notification Types
- **Job updates:** Status changes (confirmed, pro en route, in progress, completed)
- **Booking confirmations:** Service booked successfully
- **George alerts:** Maintenance reminders, seasonal tips, weather warnings
- **Pro notifications:** New job available, earnings update, certification reminder

Use Expo Push Notifications SDK. Register token on app launch after permission granted.

---

## 7. Design Guidelines

### Color Palette
- **Primary orange accent:** `#ea580c` (CTAs, send button, active states)
- **Amber/warm:** `#f59e0b` (George's brand color, pill/fab)
- **Background:** Cream/off-white (`#fffbf5`) for light mode
- **Chat bubbles — user:** Amber/orange (`#f59e0b`) with white text
- **Chat bubbles — George:** Light gray (`rgba(0,0,0,0.04)`) with dark text
- **Text:** Slate dark (`#1e293b`)
- **Muted text:** `#94a3b8`

### Typography
- Clean, crisp, Apple-level polish
- Chat text: 12-13px, leading 1.5
- Headers: Semibold
- No emojis in George's responses (enforced server-side)

### Layout
- **Bottom tab navigation:**
  1. **George** (chat icon) — Main chat screen
  2. **Book** (calendar/wrench icon) — Service booking flow
  3. **Home** (house icon) — Dashboard
  4. **Profile** (person icon) — Account, settings

### Animation
- Smooth transitions between screens
- Chat typing indicator: 3 bouncing dots (amber color)
- Gentle pulse on George chat pill when closed (every 30s)
- Photo analysis: loading shimmer on image

### George Chat Pill (when minimized)
- Floating button bottom-right: amber rounded pill
- Text: "Mr. George"
- Taps to open full chat

---

## 8. Key API Headers

Every request:
```
Content-Type: application/json
credentials: 'include'   // For cookie-based auth (React Native: use cookies library or session management)
```

For React Native, since `credentials: 'include'` works differently, use a cookie management library like `@react-native-cookies/cookies` or manage session tokens via `Set-Cookie` headers.

---

## 9. Complete API Reference

### Authentication
| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/api/customers/login` | `{ email, password }` | `{ success, userId, role }` |
| POST | `/api/customers/register` | `{ email, password, firstName, lastName, phone }` | `{ success, userId }` |
| POST | `/api/haulers/login` | `{ email, password }` | `{ success, proId, role }` |
| GET | `/api/auth/user` | — | `{ id, email, firstName, role, ... }` |
| GET | `/api/auth/google` | — | Redirects to Google OAuth |
| POST | `/api/auth/logout` | — | `{ success }` |

### George Chat
| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/api/ai/guide/chat` | `{ message, sessionId, context?, photoUrl? }` | `{ reply, sessionId, quickActions, buttons, actions }` |
| POST | `/api/ai/guide/photo-analyze` | `{ photoUrl, sessionId, serviceType? }` | `{ success, analysis }` |
| POST | `/api/ai/guide/property-scan` | `{ address, sessionId }` | `{ success, property }` |
| POST | `/api/ai/guide/lock-quote` | `{ service, price, address, sessionId }` | `{ success, quote }` |
| POST | `/api/ai/guide/bundle-estimate` | `{ services: string[] }` | `{ breakdown, total, discount }` |
| POST | `/api/ai/guide/verify-receipt` | `{ receiptUrl, serviceKey, claimedPrice }` | `{ success, priceMatch }` |
| GET | `/api/ai/guide/history` | — | `{ conversations: [...] }` |
| POST | `/api/ai/guide/feedback` | `{ sessionId, messageId, feedbackType }` | `{ success }` |

### Snap & Book
| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/api/snap-quote` | `{ imageBase64, description?, address? }` | `{ success, confidence, analysis, quote, snapQuoteId }` |
| POST | `/api/snap-quote/:id/book` | `{ scheduledDate, scheduledTime }` | `{ success, booking }` |

### Service Requests (Jobs)
| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/api/service-requests` | — | `[{ id, serviceType, status, scheduledFor, price, ... }]` |
| POST | `/api/service-requests` | `{ serviceType, pickupAddress, ... }` | `{ id, status, ... }` |
| GET | `/api/service-requests/:id` | — | Full job details |
| PATCH | `/api/service-requests/:id` | `{ status, ... }` | Updated job |

### Customer
| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/api/customers/account` | — | Account details |
| GET | `/api/loyalty/:userId` | — | `{ tier, points, lifetimeSpend }` |
| GET | `/api/referrals/mine` | — | `{ code, link, referrals: [...] }` |
| GET | `/api/notifications` | — | `[{ id, type, title, message, read }]` |
| GET | `/api/vehicles` | — | `[{ id, year, make, model, ... }]` |
| GET | `/api/appliances` | — | `[{ id, name, brand, model, age, ... }]` |
| GET | `/api/warranties` | — | `[{ id, product, expiresAt, status }]` |

### Home Profile & Intelligence
| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/api/home-profile` | — | `{ beds, baths, sqft, pool, yearBuilt, ... }` |
| GET | `/api/spending-tracker` | `?period=month` | `{ total, budget, byCategory, ... }` |
| GET | `/api/calendar/upcoming` | — | `[{ date, service, status }]` |

### Home DNA Scan
| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/api/home-scan/start` | `{ customerId }` | `{ scanSessionId, rooms }` |
| POST | `/api/ai/room-scanner/analyze` | `{ customerId, scanSessionId, roomName, photoUrl }` | `{ appliances, creditsEarned }` |
| GET | `/api/home-scan/progress` | `?customerId=...` | `{ totalItems, credits, tier }` |

### Pro Dashboard
| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/api/haulers/dashboard` | — | `{ earnings, rating, jobsCompleted, tier, ... }` |
| GET | `/api/haulers/earnings` | `?period=month` | `{ total, jobCount, byService }` |
| GET | `/api/haulers/jobs` | — | `[{ id, serviceType, status, scheduledFor, payout }]` |
| GET | `/api/haulers/certifications` | — | `{ active, available, currentTier }` |
| GET | `/api/haulers/quality-score` | — | `{ score, metrics }` |
| GET | `/api/haulers/jobs/:id/snap-details` | — | `{ snapDetails: { analysis, pricing, equipment } }` |
| GET | `/api/haulers/available` | `?service=X&zip=Y` | `[{ pro profiles }]` |

### Pricing
| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/api/certifications` | — | Service catalog |
| POST | `/api/pricing/quote` | `{ serviceType, selections }` | `{ totalPrice, breakdown }` |
| GET | `/api/app-data/services` | — | All services with full pricing |

### Push Notifications
| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/api/push/register` | `{ token, platform }` | `{ success }` |

### Miscellaneous
| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/api/emergency` | — | Emergency service info |
| POST | `/api/contact` | `{ name, email, message }` | `{ success }` |
| GET | `/api/public/services` | — | Public service list |

---

## 10. George's 155+ Tools (What the App Should Know)

George has these capabilities server-side. The app doesn't call these directly — they're invoked via the chat API. But the app should be designed to handle their outputs:

**Pricing & Booking:** get_service_pricing, calculate_quote, get_bundle_options, check_availability, create_booking_draft, get_all_services, get_multi_pro_quotes, get_nearby_pro_deals, apply_save_discount, get_rebooking_suggestions

**Home Intelligence:** get_home_profile, get_service_history, get_seasonal_recommendations, get_maintenance_schedule, get_neighborhood_insights, calculate_home_health_score, predict_maintenance_needs, get_home_value_estimate

**Photo/Vision:** diagnose_from_photo, process_home_scan_photo, identify_part_from_photo, scan_receipt_photo, scan_receipt

**Video & Tutorials:** find_diy_tutorial, get_next_tutorial_video, find_auto_tutorial, get_quick_tutorial, get_diy_guide, get_step_by_step_walkthrough

**Shopping:** search_products, get_product_recommendation, compare_prices, get_shopping_list, search_auto_parts

**Home DNA Scan:** start_home_scan, process_home_scan_photo, get_home_scan_progress, get_wallet_balance, get_home_scan_info

**Warranties & Purchases:** get_warranty_tracker, get_warranty_dashboard, register_warranty, update_appliance_purchase_date, get_purchase_history, connect_retailer_account, log_diy_maintenance, get_maintenance_due

**Customer Jobs & Loyalty:** get_customer_jobs, get_customer_loyalty_status, get_customer_milestones, get_available_rewards, redeem_reward, get_referral_status, get_referral_code

**Daily Engagement:** get_morning_briefing, get_weather_alerts, get_home_dashboard, get_spending_tracker, get_trash_schedule, get_calendar_suggestion, get_seasonal_countdown, get_tonight_checklist

**Home Utilities:** get_recycling_schedule, get_sprinkler_settings, get_water_restrictions, set_home_reminder, get_utility_providers

**Emergency:** get_emergency_pros, get_disaster_mode_status, activate_emergency_mode, get_emergency_shutoff_guide, create_emergency_dispatch, start_insurance_claim, generate_insurance_claim_packet, generate_claim_documentation, get_storm_prep_checklist

**Community:** get_neighborhood_activity, get_local_events, get_neighborhood_group_deals, get_neighborhood_insights_v2, find_neighbor_bundles, get_local_alerts, create_group_deal, get_neighborhood_deals

**Auto/Vehicle:** add_vehicle_to_profile, get_vehicle_maintenance_schedule, diagnose_car_issue, search_auto_parts, find_auto_tutorial, get_obd_code

**Pro Tools:** get_pro_dashboard, get_pro_earnings, get_pro_schedule, get_pro_certifications, get_certification_programs, start_certification_module, submit_certification_quiz, get_pro_market_insights, get_pro_reviews, get_pro_goal_progress, set_pro_goal, get_pro_demand_forecast, get_pro_customer_retention, get_pro_arrival_info, get_pro_job_prompts, get_pro_performance_analytics, set_pro_earnings_goal, suggest_pro_goal, get_optimized_route, get_weekly_route_summary

**Pro Field Assist:** identify_part_from_photo, find_replacement_part, get_technical_reference, troubleshoot_on_site, find_nearest_supply_store, submit_pro_site_report

**B2B:** get_portfolio_analytics, get_vendor_scorecard, get_billing_history, get_compliance_status, generate_roi_report, generate_service_agreement, get_document_status, get_document_tracker, get_compliance_report

**Communication:** send_email_to_customer, call_customer, get_call_status, send_quote_pdf, get_pro_live_location, add_to_calendar, send_whatsapp_message, send_push_notification

**DIY Coaching:** get_diy_disclaimer_consent, record_diy_disclaimer_acknowledgment, log_diy_completion, check_pro_recruitment, show_pro_earnings_preview, start_pro_application, start_diy_project, get_seasonal_diy_suggestions

**Smart Home:** connect_smart_home, get_smart_home_status

**Drone Scan:** book_drone_scan, get_drone_scan_status

**Pest & Damage:** identify_pest, assess_water_damage

**Cost Intelligence:** analyze_contractor_quote, get_market_rate

**Consent:** check_user_consent, request_consent

**Passive Data:** get_next_passive_question, get_customer_hoa, report_hoa_rule

---

## 11. Key Business Rules

1. **Guaranteed Price Ceiling:** Every booking has a maximum price. Customer never pays more unless they approve a scope change.
2. **7% Protection Fee:** Included in quoted prices. Covers $1M liability insurance, background-checked pros, satisfaction guarantee. Never mention it separately.
3. **Service Area:** Orlando metro (Orange, Seminole, Osceola counties), Florida only.
4. **All pros:** Background-checked, $1M liability insured, verified.
5. **Bundle Discounts:** 3-5 services = 10% off, 6+ services = 15% off.
6. **Buy Now Pay Later:** Available for jobs $199+ (Affirm/Klarna).
7. **Payouts:** Pros get paid every Thursday.
8. **Referral Program:** $50 for referrer, $50 for referred (after first job).
9. **Home DNA Scan Credit:** $25 toward next booking, valid 90 days.

---

## 12. App Navigation Structure

```
Tab Bar:
├── George (chat)          → ChatScreen
│   ├── Camera (snap & book)
│   └── Voice input
├── Book                   → ServiceListScreen
│   ├── ServiceDetailScreen
│   ├── QuoteScreen
│   └── ScheduleScreen
├── Home                   → DashboardScreen
│   ├── JobDetailScreen
│   ├── HomeScanScreen
│   ├── SpendingScreen
│   └── MaintenanceScreen
└── Profile                → ProfileScreen
    ├── LoyaltyScreen
    ├── ReferralsScreen
    ├── VehiclesScreen
    ├── AppliancesScreen
    ├── WarrantiesScreen
    └── SettingsScreen

Auth (pre-login):
├── LoginScreen
├── RegisterScreen
└── Google OAuth WebView

Pro Mode (if role=hauler):
├── ProDashboard
├── ProJobs
├── ProEarnings
├── ProCertifications
└── ProProfile
```

---

*This is a FRONTEND mobile app. All AI, pricing, and business logic lives on the server at https://uptendapp.com. The app calls APIs and renders responses. George's 155-tool brain runs server-side via Claude AI.*
