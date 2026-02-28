# George App — Complete Build Spec

## CHANGELOG (Latest Updates — 2026-02-27 Night)
- **Founding Member Discounts**: Payment card shows $25 credit + 10% off line items. API returns `foundingDiscount` object from `POST /api/payments/create-intent`. Account tab shows perks remaining via `GET /api/founding-status`.
- **Sponsored Product Placement**: Full spec added — product cards in chat with tracking, API endpoints for impressions/clicks, 14 sponsorship categories. Same card component for organic + sponsored.
- **B2B Experience**: New section — free Home DNA Scan for every HOA/PM/construction property. George onboards residents via chat. B2B dashboard features. Resident app experience.
- **Pro Home DNA Scan**: Free scan perk for pros, accessible from Pro Account tab. "Home DNA Certified" badge.
- **Pro Chat Expanded**: George talks tools, bulk buying, financial responsibility, the grind. Sponsored products in pro chat too.
- **All emails from george@uptendapp.com** — this is the customer service identity.
- **George personality fully defined in system prompt** (`server/services/george-agent.ts`) — backstory, voice style, humor, photo ID, adapts to audience, reads the room.

---

## Vision
George is not an app. George is an AI entity that lives in your phone and takes care of your home. Think: if Tesla built a home services robot, this is the app it would use to talk to you. The UI should feel like communicating with an intelligence — not browsing a marketplace.

Every interaction should feel like the future. Apple-level haptics, Uber-level maps, Tesla-level ambition. This app makes every other home services app look like Craigslist.

---

## Tech Stack (already in project)
- **Expo SDK 54** + React Native
- **react-native-reanimated** — all animations (spring physics, shared element transitions)
- **react-native-gesture-handler** — swipes, long-press, pan gestures
- **react-native-maps** — live tracking, pro routing, job maps
- **expo-haptics** — tactile feedback on every meaningful interaction
- **expo-av** — voice input/output
- **expo-camera** — photo-first service requests
- **expo-linear-gradient** — depth and polish
- **NativeWind / Tailwind** — styling
- **WebSocket** — real-time job updates, pro location, George typing state

### Additional packages needed:
- **lottie-react-native** — George avatar animations, loading states, celebration moments
- **expo-blur** — frosted glass overlays, modal backgrounds
- **@gorhom/bottom-sheet** — buttery smooth bottom sheets for in-chat actions
- **react-native-skia** — custom drawn elements, particle effects for celebrations
- **expo-speech** — George can speak responses aloud
- **expo-notifications** — push notifications that route back to George

---

## App Structure

### Tab Bar (4 tabs, floating pill style)
Floating translucent tab bar with blur background. No hard borders. Tabs have micro-animations on select.

| Tab | Icon | Purpose |
|-----|------|---------|
| **George** | George's face (animated) | Chat home screen — where everything happens |
| **My Home** | House icon | Home profile, DNA scan, maintenance timeline |
| **Jobs** | Calendar/checkmark | Active jobs with live tracking, past jobs, receipts |
| **Account** | Person icon | Payment, settings, referrals, rewards |

**Tab bar specs:**
- Floating 8px above bottom safe area
- Blur background (expo-blur, intensity 80)
- Active tab: icon scales up 1.15x with spring animation + haptic (ImpactFeedbackStyle.Light)
- Inactive tabs: 50% opacity
- Hide on scroll down in George chat, show on scroll up
- When a job is live, Jobs tab pulses subtly with a green dot

---

## Screen 1: George Chat (Home Tab)

This is THE screen. 80% of app time happens here.

### Layout
```
┌─────────────────────────┐
│  George          [···]  │  ← Header: George's name + status + menu
│─────────────────────────│
│                         │
│  George's messages      │
│  (left-aligned, dark    │
│   bubbles with avatar)  │
│                         │
│      User messages      │
│      (right-aligned,    │
│       amber bubbles)    │
│                         │
│  ┌─── Action Card ───┐  │  ← Inline cards (scheduling, pricing, etc.)
│  │                    │  │
│  └────────────────────┘  │
│                         │
│─────────────────────────│
│ [📷] [🎤] [  Message...  ] [→] │  ← Input bar
└─────────────────────────┘
```

### George's Messages
- **Appear with spring animation** — translateY from 20 to 0, opacity 0→1, spring config: damping 15, stiffness 150
- **Avatar**: George's face (Lottie animated — subtle idle breathing, blinks occasionally)
- **Bubble style**: Dark navy (#0f172a) with very subtle border, 16px padding, 20px border radius
- **Text**: SF Pro, 16px, white, line height 24
- **Haptic**: ImpactFeedbackStyle.Light on each new message arrival
- **Long press**: Context menu (Copy, Share, Save to Home Profile) with haptic
- **Links are tappable** with highlight animation

### User's Messages
- **Bubble style**: Amber/orange gradient (subtle, not garish), white text
- **Send animation**: Slide up + scale from input bar position
- **Haptic**: ImpactFeedbackStyle.Medium on send

### Typing Indicator
NOT three bouncing dots. George's avatar has a thinking animation — his eyes look up/around subtly (Lottie), with a soft pulsing glow around the avatar. Text below: "George is thinking..." in muted gray, italic.

### Input Bar
- Floating above keyboard with blur background
- **Camera button** (left): Opens custom camera overlay
- **Voice button** (left of text): Hold-to-talk with expanding ring animation + haptic pulse every 500ms while held
- **Text input**: Expanding, multiline, auto-grows up to 4 lines
- **Send button**: Appears only when text is present, animated scale-in, amber colored
- **Haptic**: NotificationFeedbackType.Success on send

### In-Chat Action Cards

These are the magic. When George needs structured input, cards appear INSIDE the chat flow. They're not separate screens.

#### Service Request Card
Triggered when user describes a problem or sends a photo.
```
┌─────────────────────────────────┐
│  🏠 Gutter Cleaning             │
│                                 │
│  Based on your 2,400 sq ft home │
│  ┌─────────────────────────┐    │
│  │ Standard Clean    $150  │    │
│  │ Deep Clean        $225  │    │
│  └─────────────────────────┘    │
│                                 │
│  [ Book Now ]                   │
│  George: "I'd go with standard, │
│  your gutters were done 6mo ago"│
└─────────────────────────────────┘
```
- Card slides in with spring animation
- Options are tappable with haptic feedback
- "Book Now" button has gradient + subtle pulse animation
- Haptic: ImpactFeedbackStyle.Heavy on Book Now tap

#### Scheduling Card
```
┌─────────────────────────────────┐
│  📅 Pick a time                  │
│                                 │
│  ┌───┬───┬───┬───┬───┬───┬───┐ │
│  │ M │ T │ W │ T │ F │ S │ S │ │
│  ├───┼───┼───┼───┼───┼───┼───┤ │
│  │   │   │ ● │   │ ● │ ● │   │ │  ← Dots = available
│  └───┴───┴───┴───┴───┴───┴───┘ │
│                                 │
│  Morning ○  Afternoon ●  Eve ○  │
│                                 │
│  [ Confirm Wed, Mar 5 @ 2 PM ] │
└─────────────────────────────────┘
```
- Calendar is swipeable with gesture handler
- Available dates glow subtly
- Time selection with haptic on each tap
- Confirm button: success haptic + card collapses into a confirmed badge

#### Payment Card
```
┌─────────────────────────────────┐
│  💳 Confirm Payment              │
│                                 │
│  Gutter Cleaning        $150.00 │
│  Platform fee             $7.50 │
│  Founding credit         -$25.00│  ← Only if founding member
│  Founding 10% off        -$13.25│  ← Only if jobs 1-10
│  ─────────────────────────────  │
│  Total                  $119.25 │
│                                 │
│  Visa ····4242         [Change] │
│                                 │
│  ████████████████ Pay $119.25   │  ← Full-width button
│                                 │
│  🔒 Guaranteed Price Ceiling     │
│  🏅 Founding Member Savings!     │  ← Gold accent, only if discount applied
└─────────────────────────────────┘
```
- Payment button with gradient animation (shimmering highlight sweeps across)
- Success: confetti particle effect (react-native-skia) + heavy haptic + sound
- Card transforms into a receipt badge in chat
- **Founding member discounts**: `POST /api/payments/create-intent` returns `foundingDiscount` object with `creditApplied`, `discountPercent`, `discountAmount`, `totalSavings`, `jobNumber`, `originalAmount`, `finalAmount`. Show line items when present. Discount is pre-calculated server-side.

#### Photo Analysis Card
When user sends a photo:
```
┌─────────────────────────────────┐
│  ┌─────────────────────────┐    │
│  │                         │    │
│  │    [User's photo]       │    │
│  │     with AI overlay     │    │
│  │     highlighting issue  │    │
│  │                         │    │
│  └─────────────────────────┘    │
│                                 │
│  George sees: Clogged gutters   │
│  with leaf buildup, ~40ft of    │
│  gutter affected. Recommend     │
│  deep clean.                    │
│                                 │
│  Estimated: $225                │
│  [ Book This ]  [ Get More Info ] │
└─────────────────────────────────┘
```

#### Rating Card (after job completion)
```
┌─────────────────────────────────┐
│  How'd Mike do?                 │
│                                 │
│  ★ ★ ★ ★ ★                     │  ← Stars animate on tap, haptic each
│                                 │
│  Quick tags:                    │
│  [On Time] [Professional]       │
│  [Great Work] [Friendly]        │
│                                 │
│  [ Add a comment... ]           │
│                                 │
│  [ Submit Review ]              │
└─────────────────────────────────┘
```
- Stars fill with amber color + scale animation + haptic per star
- Tags toggle with spring bounce

---

## Screen 2: Live Job Map (THE UBER MOMENT)

This is the screen that makes people say "holy shit."

### Trigger
The MOMENT a job is booked and a pro accepts, the map AUTOMATICALLY rises from the bottom of the George chat as a full-screen takeover with a smooth shared-element transition. No button press needed. It just happens.

### Layout
```
┌─────────────────────────────────┐
│         [Full Map View]         │
│                                 │
│    🔵 ← Pro (moving)           │
│     \                          │
│      \  Route line             │
│       \  (animated dots        │
│        \  flowing toward       │
│         \ destination)         │
│          \                     │
│           📍 ← Your home       │
│                                 │
│─────────────────────────────────│
│  ┌─────────────────────────┐   │
│  │ 👤 Mike R.    ★ 4.9     │   │  ← Pro card (bottom sheet)
│  │ White Ford F-150        │   │
│  │ 📍 8 min away           │   │
│  │                         │   │
│  │ [💬 Message] [📞 Call]  │   │
│  └─────────────────────────┘   │
│                                 │
│  ─── Swipe up for details ───  │
└─────────────────────────────────┘
```

### Map Specs
- **Custom map style**: Dark mode map (matches app navy theme) — use custom MapView style JSON
- **Pro marker**: Custom animated marker (pro's photo in a circle with pulsing ring)
- **Home marker**: House icon with subtle glow
- **Route line**: Animated — dots or dashes that flow along the route toward destination
- **Camera**: Auto-frames to show both pro and home with padding
- **Real-time**: Pro location updates via WebSocket, marker moves smoothly (animateToCoordinate)

### Pro Card (Bottom Sheet)
- **@gorhom/bottom-sheet** — three snap points: peek (pro name + ETA), half (full details), full (job details + breakdown)
- Pro photo, name, rating, vehicle description
- Live ETA updates ("8 min → 5 min → Arriving")
- Message and Call buttons with haptics
- **When pro arrives**: Map zooms to home, pro marker pulses, heavy haptic, banner: "Mike has arrived!"

### Pro's View (Same Map, Different Perspective)
When a pro gets assigned a job, their app does the same automatic map takeover:
```
┌─────────────────────────────────┐
│         [Full Map View]         │
│                                 │
│    📍 ← Job location           │
│                                 │
│  Turn-by-turn style navigation  │
│  overlay at top                 │
│                                 │
│─────────────────────────────────│
│  ┌─────────────────────────┐   │
│  │ Gutter Cleaning         │   │
│  │ 1423 Oak Ln, Orlando    │   │
│  │ $150 (you earn $127.50) │   │
│  │                         │   │
│  │ [Navigate] [📞 Customer]│   │
│  │ [ Start Job ]           │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```
- "Navigate" opens Apple/Google Maps with destination pre-filled
- "Start Job" triggers customer notification + starts job timer
- Earnings shown prominently (what pro actually takes home)

### Job Progress States (map transitions)
1. **Booked** → Map appears, shows "Finding your pro..." with expanding radar animation
2. **Pro Accepted** → Pro appears on map, route draws itself, ETA starts
3. **Pro En Route** → Live tracking, flowing route animation
4. **Pro Arrived** → Zoom in, arrival celebration, "Mark as Started" prompt to pro
5. **In Progress** → Map minimizes to a floating pill ("Job in progress — 45min"), tappable to expand
6. **Completed** → Before/after photo card + rating card slide in George chat

---

## Screen 3: My Home Tab

Your home's brain. Everything George knows about your property.

### Layout
```
┌─────────────────────────────────┐
│  🏠 1423 Oak Lane               │
│  Orlando, FL 32827              │
│  2,400 sq ft · Built 2015      │
│─────────────────────────────────│
│                                 │
│  Home Health Score    [87/100]  │  ← Animated ring chart
│  ████████████░░  "Great"       │
│                                 │
│  ┌── Upcoming Maintenance ──┐  │
│  │ 🍂 Gutter Clean  Mar 15  │  │
│  │ 🌿 Landscaping   Apr 1   │  │
│  │ 🎨 Exterior Paint Jun     │  │
│  └──────────────────────────┘  │
│                                 │
│  ┌── Service History ───────┐  │
│  │ ✅ Pressure Wash  Jan 20 │  │
│  │ ✅ Gutter Clean   Oct 15 │  │
│  │ ✅ Handyman       Sep 3  │  │
│  └──────────────────────────┘  │
│                                 │
│  [ 📸 Scan My Home ]           │  ← Launches Home DNA Scan
│                                 │
└─────────────────────────────────┘
```

- Home Health Score: animated circle that fills on load (reanimated)
- Maintenance items: swipeable, tap to book via George
- Service history: expandable, shows receipt + photos + rating
- "Scan My Home" button: launches camera for AI home scan (FREE + $25 credit)

---

## Screen 4: Jobs Tab

### Active Jobs
```
┌─────────────────────────────────┐
│  Active Jobs                    │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 🟢 Gutter Cleaning      │   │
│  │ Mike R. · In Progress    │   │
│  │ Started 25 min ago       │   │
│  │ ████████████░░░  75%     │   │  ← Progress bar
│  │ [ View Live ]            │   │  ← Opens map
│  └─────────────────────────┘   │
│                                 │
│  Past Jobs                     │
│  ┌─────────────────────────┐   │
│  │ ✅ Pressure Wash        │   │
│  │ Jan 20 · $180 · ★★★★★  │   │
│  │ Before → After [photos] │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

- Active job cards pulse with subtle glow
- "View Live" opens the Uber-style map
- Past jobs: expandable, show before/after photos side-by-side with slider
- Pull to refresh with custom animation
- Haptic on status changes (push notification + in-app)

---

## Screen 5: Account Tab

Clean, minimal. Apple Settings energy.

```
┌─────────────────────────────────┐
│  👤 Alan Oney                   │
│  alan@uptendapp.com             │
│  Founding Member #003           │  ← Badge with gold shimmer
│─────────────────────────────────│
│                                 │
│  💳 Payment Methods       [>]  │
│  🏠 My Addresses          [>]  │
│  🔔 Notifications         [>]  │
│  🎁 Refer a Friend        [>]  │
│  📊 Savings Dashboard     [>]  │
│  🌿 Impact Report         [>]  │
│  ⚙️  Preferences           [>]  │
│  📞 Support               [>]  │
│                                 │
│  ──────────────────────────────│
│  Saved this year: $342         │
│  Jobs completed: 8             │
│  Carbon offset: 12 lbs         │
│                                 │
└─────────────────────────────────┘
```

- Founding Member badge: gold gradient with subtle shimmer animation
- Founding Member perks display (if applicable):
  - "$25 credit remaining" or "Credit used" 
  - "X of 10 discounted jobs remaining" (10% off first 10 jobs)
  - Stacking rule: Job 1 = $25 off + 10% off remainder. Jobs 2-10 = 10% off. Job 11+ = full price.
  - API: `GET /api/founding-status` returns `{ isFoundingMember, creditRemaining, discountJobsRemaining, discountJobsUsed }`
- "Refer a Friend" → share sheet with unique link + George's pitch
- Savings Dashboard shows money saved vs calling random contractors

---

## Camera Experience (Photo-First UX)

When the camera button is tapped in George chat:

```
┌─────────────────────────────────┐
│                                 │
│        [Camera Viewfinder]      │
│                                 │
│   ┌─────────────────────────┐   │
│   │  Center the problem     │   │  ← Floating guide text
│   │  in the frame           │   │
│   └─────────────────────────┘   │
│                                 │
│                                 │
│         [ ◉ Capture ]          │
│                                 │
│  [Gallery]          [Flash]    │
└─────────────────────────────────┘
```

- Custom camera overlay (not system picker)
- After capture: photo appears in chat, George immediately analyzes
- AI overlay highlights detected issues (bounding boxes with labels)
- Multiple photos: "Add more" option before sending to George
- Haptic on capture (ImpactFeedbackStyle.Heavy)

---

## Voice Input

Hold the mic button in chat:

```
┌─────────────────────────────────┐
│                                 │
│                                 │
│         ◉                      │
│     Expanding ring             │
│     animation while            │
│     recording                  │
│                                 │
│   "Listening..."               │
│                                 │
│   Live waveform visualization  │
│                                 │
│   Release to send              │
└─────────────────────────────────┘
```

- Ring expands/contracts with audio amplitude (reanimated)
- Waveform shows live audio levels
- Haptic pulse every 500ms while recording
- Release → voice sent to server → transcribed → George responds
- George can also SPEAK responses (toggle in settings)

---

## Push Notifications

Every notification routes back to George chat with context:

- **"Mike is 5 minutes away"** → Opens map
- **"Your job is complete!"** → Opens George chat with before/after + rating card
- **"George: Your gutters are due for cleaning"** → Opens George chat with booking card
- **"New: $10 credit when a pro is already in your neighborhood"** → Opens George chat with deal details

Rich notifications with:
- Pro's photo on en-route notifications
- Before/after preview on completion
- Action buttons ("View Map", "Rate Now")

---

## Design System

### Colors
- **Primary**: #F47C20 (amber/orange)
- **Background**: #0A0E1A (deeper than navy — almost black, like Tesla app)
- **Surface**: #111827 (cards, bubbles)
- **Surface Elevated**: #1F2937 (raised elements)
- **Text Primary**: #FFFFFF
- **Text Secondary**: #9CA3AF
- **Success**: #10B981
- **Error**: #EF4444
- **Border**: rgba(255,255,255,0.06)

### Typography (SF Pro / System)
- **Hero**: 34px, Bold, -0.4 tracking
- **Title**: 28px, Bold, -0.3 tracking
- **Headline**: 22px, Semibold
- **Body**: 17px, Regular, 24px line height
- **Caption**: 13px, Regular, #9CA3AF
- **All text**: Dynamic Type support for accessibility

### Haptic Map
| Action | Haptic Type |
|--------|-------------|
| Tab switch | ImpactFeedbackStyle.Light |
| Message received | ImpactFeedbackStyle.Light |
| Send message | ImpactFeedbackStyle.Medium |
| Button tap | ImpactFeedbackStyle.Medium |
| Book Now / Pay | ImpactFeedbackStyle.Heavy |
| Star rating tap | ImpactFeedbackStyle.Light |
| Job status change | NotificationFeedbackType.Success |
| Error / declined | NotificationFeedbackType.Error |
| Pull to refresh | ImpactFeedbackStyle.Light |
| Card expand | ImpactFeedbackStyle.Light |
| Long press menu | ImpactFeedbackStyle.Medium |
| Pro arrived | NotificationFeedbackType.Warning (3x pulse) |
| Payment success | NotificationFeedbackType.Success + confetti |
| Voice recording pulse | ImpactFeedbackStyle.Light (every 500ms) |

### Animation Specs (react-native-reanimated)
- **Spring default**: damping 15, stiffness 150, mass 1
- **Quick spring**: damping 20, stiffness 200 (button responses)
- **Slow spring**: damping 12, stiffness 100 (page transitions)
- **Fade in**: 200ms ease-out
- **Card expand**: 300ms spring with slight overshoot
- **Map takeover**: 500ms shared element transition, map scales from card to fullscreen

### Corner Radii
- **Cards**: 20px
- **Buttons**: 14px (small), 20px (large/full-width)
- **Chat bubbles**: 20px (with 4px on the "tail" corner)
- **Input fields**: 14px
- **Bottom sheets**: 24px top corners
- **Tab bar**: 30px (pill shape)

### Shadows & Depth
No traditional shadows on dark theme. Instead:
- Subtle border (rgba white 6%)
- Background elevation through color steps
- Glow effects for active/focused elements (amber glow on primary actions)

### Dynamic Atmosphere System (George IS the Environment)

The entire app shifts its mood based on weather, time of day, season, and George's relationship stage with the user. The app should feel ALIVE — like George's personality is baked into the pixels.

#### Weather-Driven Atmosphere
Fetch weather from user's location. The app's visual tone shifts:

| Weather | Background Tint | George's Glow | Accent Shift | Vibe |
|---------|----------------|---------------|-------------|------|
| Sunny / Clear | Warm undertone (#0A0E1A → slight warm wash) | Bright amber glow, expanded | Primary stays #F47C20 | Bright, energetic, George is upbeat |
| Cloudy | Neutral, slightly muted | Softer glow, tighter | Slightly desaturated amber | Calm, steady, George is focused |
| Rainy | Cool blue-grey undertone | Cooler glow, subtle | Shift toward #E8731C (deeper) | Direct, efficient, "let's get things done" |
| Stormy / Hurricane | Dark, high contrast | Pulsing amber (alert mode) | Warning amber + red accents | Protective, urgent, George is on it |
| Hot (95F+) | Warm gradient, slight heat shimmer | Intense warm glow | Brighter, more saturated orange | George is glowing, "stay hydrated" energy |
| Cold front (<60F for FL) | Crisp, slightly cooler tones | Tighter, sharper glow | Shift toward warm gold | Cozy, protective, "check your pipes" |

Implementation:
```typescript
// src/theme/atmosphere.ts
interface Atmosphere {
  backgroundTint: string;      // overlay color on base background
  glowIntensity: number;       // 0-1, George's ambient glow
  glowColor: string;           // glow color
  accentColor: string;         // shifted primary color
  particleEffect?: "none" | "rain-drops" | "heat-shimmer" | "leaves" | "snowflakes";
  georgeGreetingMood: "bright" | "calm" | "focused" | "protective" | "cozy";
}

function getAtmosphere(weather: WeatherData, time: Date, season: string): Atmosphere {
  // Weather is primary driver
  // Time of day is secondary (warmer at golden hour, cooler at night)
  // Season adds subtle long-term shifts
}
```

#### Time-of-Day Shifts
The app breathes with the day:

| Time | Shift | George's Energy |
|------|-------|----------------|
| Morning (6-10 AM) | Warmer, sunrise amber tones | Fresh, energetic. "New day. What needs handling?" |
| Midday (10-2 PM) | Brightest, most neutral | Peak George. Confident, direct. |
| Afternoon (2-6 PM) | Slightly warmer, golden hour creep | Settled, productive. |
| Evening (6-10 PM) | Cooler, deeper tones | Winding down. More reflective. "Got everything squared away?" |
| Night (10 PM-6 AM) | Darkest, minimal glow | Quiet. "I'm here if you need me." Shorter responses. |

These are SUBTLE shifts. Not jarring theme changes. Think how sunlight changes the feel of a room without you noticing.

#### Seasonal Themes
Background accents shift slowly over the calendar year:

| Season | Accent | Particle Effect | George Context |
|--------|--------|----------------|----------------|
| Spring (Mar-May) | Fresh green undertones | Occasional subtle pollen/leaf | "Great time to get the yard in shape" |
| Summer (Jun-Aug) | Warm, humid feel, heat shimmer | Very subtle heat wave overlay | Hurricane prep mode, AC focus |
| Fall (Sep-Nov) | Warm amber/copper tones | Occasional falling leaf | Gutter season, roof checks |
| Winter (Dec-Feb) | Crisp, cooler undertones | None (FL doesn't get snow) | Pipe protection, holiday hosting |

#### Implementation Notes
- Weather fetched on app open + every 30 min (use device location)
- Atmosphere transitions use 2-second animated interpolation (never jarring)
- All shifts are applied as OVERLAYS on the base dark theme — the core colors don't change, just the tint/mood
- Particle effects are extremely subtle — think 5% opacity, slow drift. If a user notices the particles consciously, they're too strong.
- George's greeting and tone in the system prompt already adapts (server-side). The app atmosphere is the visual companion to that.
- Store weather data in app state, pass to theme provider
- Accessibility: all atmosphere shifts must maintain WCAG contrast ratios. Tints are decorative only.

#### George's Ambient Glow (The Heartbeat)
The floating George avatar on every screen has a subtle ambient glow/pulse:
- **Sunny day**: Wide, warm glow. Slow pulse (3s cycle). George is relaxed and present.
- **Rainy day**: Tighter glow, slightly faster pulse (2s). George is alert.
- **Storm approaching**: Pulsing amber warning glow. George is protective.
- **Night**: Minimal glow, very slow (5s). George is resting but available.
- **Active job in progress**: Bright, steady glow. No pulse. George is focused.
- **Customer stressed (from relationship memory)**: Calm, steady blue-amber. Reassuring presence.

This is the single most important visual element. George's glow IS his mood. Users will subconsciously associate the glow with George's state of mind.

#### API
- `GET /api/atmosphere?lat={lat}&lng={lng}` — returns current atmosphere config (weather + time + season)
- Response: `{ weather, temp, condition, timeOfDay, season, atmosphere: { backgroundTint, glowIntensity, glowColor, accentColor, particleEffect, georgeGreetingMood } }`
- App calls on launch, caches for 30 min

### George's Relationship Memory (Server-Side)

George remembers everything about each customer across conversations. This data is injected into George's system prompt each conversation.

**What George Tracks:**
- Communication style (verbose vs terse, humor, detail preference)
- Price orientation (budget/mid/premium based on choices)
- DIY vs pro preference
- Family, pets, work, life events mentioned in conversation
- Emotional patterns (money stress, repair anxiety, contractor frustration)
- History callbacks ("your gutters are due", "how's that AC noise?")
- George's own mistakes ("I recommended too weak a pressure washer last time")
- Relationship stage (new → familiar → established)
- Total savings George has delivered

**Rules for Using Memory:**
- GENTLE. One callback per conversation max. Never dump everything at once.
- Reference things the way a friend would, never "according to my records"
- Never be creepy. "How's your daughter?" is fine. "I noticed you mentioned your daughter Sarah who attends UF on February 14th" is not.
- Admitting mistakes BUILDS trust. "I steered you wrong on that last one. Here's a better option."
- Memory gets richer over time. Month 1 is generic. Month 12 is deeply personal.

**API:**
- Relationship context auto-injected into `POST /api/ai/chat` system prompt (server-side, no app work needed)
- `GET /api/relationship/stats` — returns user-facing stats: "George has saved you $840", "14 conversations", "3 jobs completed"
- Display stats in Account tab as "Your History with George" section
- Blur for overlays (expo-blur)

---

## Splash Screen (App Launch)

Every time the app opens. Like Uber's splash. 1.5-2 seconds max.

```
┌─────────────────────────────────┐
│                                 │
│                                 │
│                                 │
│                                 │
│         [House-Circuit Logo]    │  ← logo-icon.png, centered, ~120px
│                                 │
│          U p T e n d            │  ← Fades in letter by letter, amber+white
│                                 │
│       HOME INTELLIGENCE         │  ← Fades in below, muted gray, tracking wide
│                                 │
│                                 │
│                                 │
│                                 │
└─────────────────────────────────┘
```

### Animation Sequence
1. **0ms**: Black screen (#0A0E1A)
2. **200ms**: Logo fades in + scales from 0.8→1.0 (spring)
3. **500ms**: "UpTend" text shimmers in — each letter appears left-to-right with a glowing sweep (like a light passing across), "Up" in amber (#F47C20), "Tend" in white
4. **900ms**: "HOME INTELLIGENCE" fades in below, subtle, wide letter-spacing, #9CA3AF
5. **1200ms**: Entire logo pulses once with a soft amber glow
6. **1500ms**: Everything fades up and out as George chat slides in from below
- Haptic: ImpactFeedbackStyle.Medium on the pulse at 1200ms
- Background: solid #0A0E1A, no gradients — let the logo breathe

### Implementation
- Use `expo-splash-screen` to hide native splash, then custom animated splash in React Native
- Reanimated for all animations (withSequence, withDelay, withSpring)
- Show on every cold start, skip on background→foreground resume

---

## Onboarding Flow (First Launch)

Not a tutorial carousel. George introduces himself.

```
Screen 1: George's face fades in (Lottie animation — he smiles)
          "Hey. I'm George."
          (pause 1.5s)
          "I take care of homes."
          [Continue]

Screen 2: "What's your address?"
          [Address autocomplete input]
          (Google Places API)
          George: "Got it. Let me learn about your home."
          (Loading animation — house being "scanned")

Screen 3: "Here's what I know so far:"
          [Home profile card with data from property API]
          George: "I'll learn more over time. For now, what do you need?"
          [Take me to George →]
```

- 3 screens max. Under 60 seconds.
- Address entry is critical — powers everything (pricing, nearby pros, property data)
- Skip option always available
- Auth comes later (when they want to book)

---

## Pro App Experience

Same app, different mode. Pro logs in and gets:

### Pro Home (George Chat)
George for pros is a business partner, not a customer service bot:
- "You have 3 new jobs in your area. Two are back-to-back in Lake Nona - easy route day."
- "Your earnings this week: $1,240. You're 60% to your $2K goal with 3 days left."
- "Tip: customers in Lake Nona tip 22% higher on Fridays"
- George talks to pros about tools, bulk supply sourcing, equipment upgrades
- George has real conversations about the grind, building wealth, financial responsibility
- George can recommend tools and materials with real prices and links (search_products)
- Sponsored product placements work in pro chat too (same rules - natural, relevant)

### Pro Home DNA Scan (Free Perk)
Every pro gets a FREE Home DNA Scan + home dashboard for their own home:
- Accessible from the Pro Account tab: "My Home" section
- Same full scan experience customers get
- George proactively offers it: "As an UpTend pro, you get a free Home DNA Scan for your own home."
- Completing the scan earns a "Home DNA Certified" badge on their pro profile
- Pros who experience it firsthand become better advocates for the service
- API: `GET /api/pro/home-scan` (same as customer scan but linked to pro's account)

### Pro Job Feed
```
┌─────────────────────────────────┐
│  New Jobs Near You              │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Gutter Cleaning         │   │
│  │ 📍 2.3 mi · Lake Nona  │   │
│  │ 💰 $127.50 (your take) │   │
│  │ 📅 Mar 5, 2-4 PM       │   │
│  │                         │   │
│  │ [Accept] [Pass]         │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Pressure Washing        │   │
│  │ 📍 4.1 mi · Dr Phillips│   │
│  │ 💰 $153.00 (your take) │   │
│  │ 📅 Mar 6, 9-11 AM      │   │
│  │                         │   │
│  │ [Accept] [Pass]         │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

- Jobs sorted by distance + earnings
- Accept triggers map with navigation to job site
- Swipe right to accept, left to pass (Tinder energy)
- Heavy haptic on accept

### Pro Active Job Flow
1. **Navigate** → Apple/Google Maps
2. **Arrive** → "I'm here" button, customer notified
3. **Before Photos** → Camera captures before state
4. **Work** → Timer running, can message customer via George
5. **After Photos** → Camera captures completed work
6. **Complete** → Job done, earnings added, customer prompted to review

---

## B2B Experience (HOA, PM, Construction)

B2B accounts access a management dashboard through the web (`uptendapp.com/business`), but residents/tenants interact through the George app. This is how B2B drives consumer adoption.

### Free Home DNA Scan for Every Property
Every unit/door/home under a B2B account gets a free Home DNA Scan. This is the primary onboarding hook.

**Flow:**
1. B2B account signs up (HOA board, PM company, construction firm)
2. George reaches out to each resident/tenant via email or SMS invite
3. Resident opens invite → lands in George chat → completes scan conversationally
4. Scan data feeds into BOTH the resident's personal home profile AND the B2B portfolio dashboard
5. George begins proactive relationship with each resident (maintenance reminders, seasonal alerts, service bookings)

**B2B Dashboard Features (web, not app):**
- Portfolio-wide Home Health Scores (average + per-unit breakdown)
- Maintenance calendar across all properties
- Vendor/pro performance scorecards
- Compliance tracking and board reporting
- Spending analytics and budget vs. actual
- Resident engagement metrics (scan completion rate, George conversations, bookings)

**Resident App Experience:**
- Same George app as any consumer - they don't know they're "B2B"
- George greets them referencing their community: "Hey! Your HOA at [Community Name] set you up with UpTend. You've got a free Home DNA Scan ready. Want to do it now? Takes about 10 minutes."
- After scan: George becomes their ongoing home expert, same as any customer
- They can book services, get DIY help, shop products - full George experience
- Their bookings flow through the B2B account's dashboard for the manager/board to see

**Why This Matters for Growth:**
- 1 HOA deal = 200-500 new George users
- Each resident becomes an individual UpTend customer organically
- When they move out of the HOA, they take George with them
- B2B is the acquisition channel, consumer is the retention model

---

## API Integration

The app talks to the existing UpTend backend at `https://uptendapp.com/api/`:

### Core Endpoints
- `POST /api/ai/chat` — George conversation (send message, get response)
- `POST /api/customers/login` — Customer auth
- `POST /api/haulers/login` — Pro auth
- `GET /api/service-requests` — Job list
- `POST /api/service-requests` — Create booking
- `POST /api/service-requests/:id/review` — Submit rating
- `POST /api/push/register` — Register push token

### WebSocket
- Connect to `wss://uptendapp.com/ws`
- Events: `job_update`, `pro_location`, `george_typing`, `message`
- Auto-reconnect with exponential backoff

### George Chat Protocol
```json
// Send
{
  "message": "My gutters are clogged",
  "images": ["base64..."],  // optional photo
  "audio": "base64...",     // optional voice
  "context": {
    "screen": "chat",
    "homeId": "uuid",
    "activeJobId": "uuid"   // if viewing a job
  }
}

// Receive
{
  "message": "I can see the buildup...",
  "cards": [                // optional action cards
    {
      "type": "service_quote",
      "service": "Gutter Cleaning",
      "options": [...],
      "price": 150
    }
  ],
  "haptic": "medium"        // optional haptic hint
}
```

---

## File Structure

```
src/
├── components/
│   ├── chat/
│   │   ├── ChatBubble.tsx          # Message bubble with animations
│   │   ├── GeorgeAvatar.tsx        # Animated Lottie avatar
│   │   ├── TypingIndicator.tsx     # George thinking animation
│   │   ├── InputBar.tsx            # Text + camera + voice input
│   │   ├── VoiceRecorder.tsx       # Hold-to-talk with waveform
│   │   └── cards/
│   │       ├── ServiceQuoteCard.tsx
│   │       ├── SchedulingCard.tsx
│   │       ├── PaymentCard.tsx
│   │       ├── PhotoAnalysisCard.tsx
│   │       ├── RatingCard.tsx
│   │       ├── JobStatusCard.tsx
│   │       └── MapPreviewCard.tsx
│   ├── map/
│   │   ├── LiveTrackingMap.tsx      # Full Uber-style map
│   │   ├── ProMarker.tsx           # Animated pro location pin
│   │   ├── HomeMarker.tsx          # Home location pin
│   │   ├── RouteOverlay.tsx        # Animated route line
│   │   └── ProInfoSheet.tsx        # Bottom sheet with pro details
│   ├── home/
│   │   ├── HomeHealthScore.tsx     # Animated ring chart
│   │   ├── MaintenanceTimeline.tsx
│   │   ├── ServiceHistory.tsx
│   │   └── HomeScanCTA.tsx
│   ├── jobs/
│   │   ├── ActiveJobCard.tsx
│   │   ├── PastJobCard.tsx
│   │   ├── BeforeAfterSlider.tsx
│   │   └── JobProgressBar.tsx
│   ├── pro/
│   │   ├── JobFeedCard.tsx         # Swipeable job cards
│   │   ├── EarningsSummary.tsx
│   │   ├── ActiveJobControls.tsx   # Start/complete/photo buttons
│   │   └── NavigateButton.tsx
│   ├── ui/
│   │   ├── HapticButton.tsx        # Button with built-in haptic
│   │   ├── AnimatedCard.tsx        # Card with spring mount animation
│   │   ├── BlurOverlay.tsx         # Frosted glass background
│   │   ├── GlowBorder.tsx         # Ambient glow effect
│   │   ├── ConfettiEffect.tsx     # Celebration particles (skia)
│   │   └── PulsingDot.tsx         # Status indicator
│   └── common/
│       ├── FloatingTabBar.tsx      # Custom blur tab bar
│       ├── Header.tsx
│       └── SafeArea.tsx
├── screens/
│   ├── GeorgeChatScreen.tsx        # Main chat screen
│   ├── LiveMapScreen.tsx           # Full-screen job tracking
│   ├── MyHomeScreen.tsx            # Home profile
│   ├── JobsScreen.tsx              # Active + past jobs
│   ├── AccountScreen.tsx           # Settings + profile
│   ├── CameraScreen.tsx            # Custom photo capture
│   ├── OnboardingScreen.tsx        # George intro + address
│   ├── PaymentMethodsScreen.tsx
│   ├── NotificationSettingsScreen.tsx
│   └── pro/
│       ├── ProGeorgeChatScreen.tsx  # George for pros
│       ├── ProJobFeedScreen.tsx     # Available jobs
│       ├── ProActiveJobScreen.tsx   # In-progress job controls
│       └── ProEarningsScreen.tsx
├── services/
│   ├── api.ts                      # API client (axios/fetch)
│   ├── websocket.ts                # WebSocket connection manager
│   ├── haptics.ts                  # Centralized haptic triggers
│   ├── notifications.ts            # Push notification handler
│   ├── location.ts                 # GPS tracking (for pros)
│   └── storage.ts                  # AsyncStorage wrapper
├── context/
│   ├── AuthContext.tsx
│   ├── GeorgeContext.tsx            # Chat state + WebSocket
│   ├── JobContext.tsx               # Active job tracking
│   └── HomeContext.tsx              # Home profile data
├── hooks/
│   ├── useHaptic.ts
│   ├── useGeorgeChat.ts
│   ├── useJobTracking.ts
│   ├── useLiveLocation.ts
│   └── useSpringAnimation.ts
├── theme/
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   └── animations.ts               # Shared spring configs
├── assets/
│   ├── lottie/
│   │   ├── george-idle.json         # George breathing/blinking
│   │   ├── george-thinking.json     # George processing
│   │   ├── george-happy.json        # Celebration
│   │   ├── radar-scan.json          # Finding a pro
│   │   └── confetti.json
│   └── images/
│       ├── logo-icon.png
│       └── george-avatar.png
└── navigation/
    ├── AppNavigator.tsx             # Main tab + stack navigation
    ├── AuthNavigator.tsx
    └── OnboardingNavigator.tsx
```

---

## Build Priority (What to Build First)

### Phase 1: The Core Loop (Week 1)
1. George Chat Screen — messages, input bar, basic cards
2. API integration — talk to existing backend
3. Auth flow — login/signup
4. Haptics + animations on everything above

### Phase 2: The "Holy Shit" Moment (Week 2)
5. Live Job Map — Uber-style tracking
6. WebSocket integration — real-time updates
7. Photo capture + AI analysis
8. Push notifications

### Phase 3: Complete Experience (Week 3)
9. My Home tab — profile, health score, history
10. Jobs tab — active/past with before/after
11. Pro experience — job feed, active job flow
12. Voice input
13. Onboarding flow

### Phase 4: Polish (Week 4)
14. Lottie animations for George avatar
15. Confetti/celebration effects
16. Sound design
17. Dark mode map styling
18. Performance optimization
19. App Store submission prep

---

## Radical Innovations (Build These)

### 1. AR Home Scanner
Point camera at any room, George overlays what needs attention in real-time. Red highlights on water stains, yellow on aging grout, green checkmarks on healthy areas. Every scan saved as a time-lapse — "here's your bathroom in January vs now." Data feeds maintenance scheduling and insurance claims. Nobody in home services has this.

### 2. Neighborhood Live Feed
Real-time anonymized map of active jobs nearby. "A pressure washing job is happening 0.3 miles from you." Tap to see before/after when done, book the same pro at a group discount while they're in the area. Proximity = savings. Creates FOMO — you see neighbors getting houses done, you want in.

### 3. George's Real Voice (Not TTS)
George has a warm, specific voice (David Castlemore, ElevenLabs). Push notifications are spoken. Full duplex voice conversation — you're driving home, George calls: "Mike just finished your gutters. Before/after looks great. He found a fascia issue — want a quote while he's still there?" That's not an app. That's an employee.

### 4. Split Screen Live Job View
Pro's camera can one-way stream to customer during active jobs. Not a video call — a passive view. Customer opens app, watches their gutters being cleaned in real-time. Solves the #1 home services anxiety: "What are they doing at my house right now?" Trust through transparency.

### 5. Home Value Ticker
Persistent ticker on My Home tab showing estimated home value (property API). Every completed service shows impact: "Pressure wash completed: +$1,200 estimated curb appeal value." Reframes $180 spend as $1,200 investment. Changes the psychology of home maintenance from expense to asset protection.

### 6. George Proactive Interrupts
George watches weather, seasons, maintenance history, neighborhood patterns. Hurricane season approaching? George reaches out: "Storm system in 4 days. Gutters haven't been cleaned since October. Want someone out tomorrow?" Not a notification — someone who actually cares about your house.

### 7. The Receipt Killer
Every service, product recommendation, payment — George remembers everything. Tax time? "George, what did I spend on home maintenance this year?" Instant categorized breakdown, exportable to accountant. Homeowners lose track of this. George never forgets.

### 8. Pro Reputation Layers
Not just stars. Specialty heat map per pro — what they're best at by service type, neighborhood, time of day. "Mike has 4.97 on gutters in Lake Nona but 4.3 on handyman." Visual radar chart on profile. Algorithm matches right pro to right job.

### 9. Predictive Booking
George learns patterns. You got lawn done biweekly last summer. March hits: "Want me to set up biweekly landscaping again? Same pro, Mike. Available starting March 8." One tap. Done. Recurring revenue for platform, zero friction for customer.

### 10. The "Just Fix It" Button
One button. No details. No description. Just "Something's wrong." George asks one question, maybe two, handles everything. For the person who doesn't know what's broken and doesn't want to figure it out. That's the entire point of George.

### George's Ambient Presence (Ties Everything Together)
At the top of every screen, George's avatar sits in a small floating circle. It subtly reacts — looks at the map when tracking is active, looks at photos when you're in camera, closes his eyes late at night. Always there. Always aware. Not in your way, but present. Like a real person who lives in your phone. This single detail makes the app feel alive.

---

## Feature Implementations

All 18 feature components with full code, styling, and integration instructions are in **`GEORGE-APP-FEATURES.md`** in this same repo root. After the base build is complete, wire in those components. They include:

- Reorder Bar, 60-Second Quote Timer, "Just Fix It" Button
- Home Health Score + Streak + Trend Graph, Seasonal Care Calendar
- Before/After Gallery, Savings Counter, Home Value Ticker
- "Do This Again" Card, Predictive Booking Card, Proactive Alert Cards
- George's Ambient Presence (floating avatar on every screen)
- Home Product Tracker with Amazon Affiliate purchases
- Native Sponsored Product Placement (see below)
- Home Timeline, Neighborhood Leaderboard, Neighborhood Activity Feed
- Spending Dashboard (Receipt Killer), George's Daily Tips

---

## Native Sponsored Product Placement

George recommends products naturally in conversation. Some of these are sponsored placements from brand partners. The app needs to support this seamlessly.

### How It Works
- Backend flags certain products as `sponsored: true` in the product search/recommendation API response
- George's AI prompt already handles recommending sponsored products naturally (never says "this is sponsored")
- The app renders sponsored product cards identically to organic recommendations - NO visual "sponsored" badge, NO different styling
- Tracking: when a user taps a sponsored product link, log `{ userId, productId, sponsorId, context, timestamp }` to `sponsored_impressions` table
- Revenue model: brands pay per recommendation (CPR) or monthly category-exclusive placement fee

### Product Card in Chat (same component for organic + sponsored)
```
+-------------------------------------------+
|  [Product Image]                          |
|  Filtrete 1500 MPR Air Filter (3-Pack)    |
|  $24.99 on Amazon                         |
|                                           |
|  [Buy Now]              [Save for Later]  |
+-------------------------------------------+
```
- Tappable card opens in-app browser or deep links to retailer
- "Save for Later" adds to a shopping list in My Home tab
- All product links include affiliate tag (`uptend20-20` for Amazon)
- Sponsored products use the SAME card component - the only difference is backend tracking

### API Integration
- `GET /api/products/recommended?context=ac-filter&homeProfile=true` - returns products ranked by relevance, sponsored products weighted higher when contextually appropriate
- Response includes `sponsored: boolean` and `sponsorId: string` per product (for tracking only, not display)
- `POST /api/sponsored/impression` - log when a sponsored product is shown in chat
- `POST /api/sponsored/click` - log when a user taps a sponsored product

### Categories Available for Sponsorship
Air filters, paint, security cameras, smart home devices, cleaning supplies, tools, water filters, pest control products, lawn care products, pool chemicals, appliance parts, HVAC filters, light bulbs, plumbing supplies

---

## George Mood System (The App IS George)

This is the single biggest differentiator. George's emotional state doesn't just change his avatar -- it changes the ENTIRE app. Background colors, text energy, haptic patterns, sounds, animation speed, chat bubble styling. The user should feel like they're inside George's mind. When George is excited, the app feels electric. When George is calm, the app feels zen. When George is urgent, the app feels tense. No other app does this.

### Mood States

George has 8 core mood states. Each one transforms the app holistically:

| Mood | Trigger | Avatar | BG Tint | Glow | Haptics | Text Style | Animation Speed | Sound |
|------|---------|--------|---------|------|---------|------------|----------------|-------|
| **Neutral** | Default state | Idle breathing, occasional blink | Base #0A0E1A | Soft amber, 3s pulse | Standard map | Normal 17px, regular | Default spring | Soft chime on messages |
| **Excited** | Found a deal, pro accepted fast, savings calculated | Eyes wider, slight lean forward, faster breathing | Warm amber wash (+2% saturation) | Bright, expanded, faster 1.5s pulse | Slightly stronger taps | Slightly larger (18px), medium weight | 20% faster springs (stiffness +30) | Brighter, quicker chime |
| **Focused** | Analyzing photo, running numbers, processing complex request | Eyes narrowed slightly, steady gaze | Cooler, sharper contrast | Tight, concentrated, no pulse (steady) | Precise single taps | Clean, 16px, slightly tighter line height | Tighter springs (more damping) | Minimal -- subtle processing hum |
| **Protective** | Storm warning, overdue maintenance, safety issue found | Alert posture, direct eye contact | Deeper navy with amber warning undertone | Pulsing amber-red, 1s cycle | Stronger, more deliberate | Bold weight on key phrases | Sharper animations, quicker settle | Low alert tone |
| **Proud** | Job completed well, customer saved money, milestone hit | Slight smile, relaxed posture | Warm, golden undertone | Wide warm glow, slow satisfied pulse | Celebration pattern (success + light + light) | Confident, regular weight, generous spacing | Slightly slower, more relaxed springs | Warm success tone |
| **Concerned** | Maintenance way overdue, quote seems high, potential issue | Slight furrow, thoughtful tilt | Slightly desaturated, cooler | Tighter, slightly cooler amber | Soft warning pattern | Normal but George uses more direct language | Normal speed | Soft double-tap tone |
| **Urgent** | Emergency repair, storm imminent, time-sensitive booking | Full alert, leaning in | High contrast, dark with amber accents | Fast pulse, bright, tight | Strong repeated pulses | Larger (19px), bold, shorter sentences | Fast, snappy animations | Sharp attention tone |
| **Chill** | Late night, weekend morning, nothing pending, all maintenance current | Relaxed, half-smile, slow blinks | Warmer, slightly lighter base | Minimal glow, very slow 5s pulse | Lightest touch | Relaxed 17px, generous line height | Slowest springs, lazy feel | Quietest, ambient |

### How Mood Is Determined

Mood is computed SERVER-SIDE and returned with every George response. The AI already has context -- this just formalizes it as a data point the app can consume.

```typescript
// Added to POST /api/ai/chat response
{
  "message": "Storm system moving in Thursday...",
  "mood": "protective",           // Current mood state
  "moodIntensity": 0.8,          // 0-1, how strong the mood is
  "moodReason": "hurricane_alert", // For debugging/analytics
  "cards": [...],
  "haptic": "medium"
}
```

The app interpolates between moods smoothly. Mood changes are NEVER instant -- always a 1.5-2 second animated transition (color interpolation, glow shift, spring config update). If George goes from "chill" to "urgent," the user feels the shift like a gear change.

### App-Wide Mood Manifestation

#### 1. Background & Color System
Every screen wraps in an `<AtmosphereProvider>` that layers a mood tint:

```typescript
// src/theme/mood.ts
interface MoodTheme {
  backgroundTint: string;       // Overlay color on base background
  surfaceTint: string;          // Overlay on cards/surfaces
  glowColor: string;            // George's ambient glow
  glowIntensity: number;        // 0-1
  glowPulseSpeed: number;       // ms per cycle (0 = no pulse, steady)
  accentShift: string;          // Shifted primary color
  textEmphasisWeight: string;   // "400" | "500" | "600" | "700"
  borderGlow: string;           // Card border color (subtle mood hint)
}

const MOOD_THEMES: Record<string, MoodTheme> = {
  neutral: {
    backgroundTint: "rgba(244, 124, 32, 0.02)",
    surfaceTint: "rgba(0, 0, 0, 0)",
    glowColor: "#F47C20",
    glowIntensity: 0.3,
    glowPulseSpeed: 3000,
    accentShift: "#F47C20",
    textEmphasisWeight: "400",
    borderGlow: "rgba(244, 124, 32, 0.06)",
  },
  excited: {
    backgroundTint: "rgba(244, 124, 32, 0.05)",
    surfaceTint: "rgba(244, 124, 32, 0.02)",
    glowColor: "#FF8C34",
    glowIntensity: 0.6,
    glowPulseSpeed: 1500,
    accentShift: "#FF8C34",
    textEmphasisWeight: "500",
    borderGlow: "rgba(244, 124, 32, 0.12)",
  },
  focused: {
    backgroundTint: "rgba(100, 140, 200, 0.03)",
    surfaceTint: "rgba(0, 0, 0, 0.02)",
    glowColor: "#D4882A",
    glowIntensity: 0.5,
    glowPulseSpeed: 0, // steady, no pulse
    accentShift: "#E8862A",
    textEmphasisWeight: "500",
    borderGlow: "rgba(200, 200, 255, 0.06)",
  },
  protective: {
    backgroundTint: "rgba(220, 100, 30, 0.04)",
    surfaceTint: "rgba(220, 100, 30, 0.02)",
    glowColor: "#E8731C",
    glowIntensity: 0.7,
    glowPulseSpeed: 1000,
    accentShift: "#E8731C",
    textEmphasisWeight: "600",
    borderGlow: "rgba(220, 100, 30, 0.10)",
  },
  proud: {
    backgroundTint: "rgba(255, 200, 50, 0.03)",
    surfaceTint: "rgba(255, 200, 50, 0.01)",
    glowColor: "#FFB830",
    glowIntensity: 0.5,
    glowPulseSpeed: 4000,
    accentShift: "#FFB830",
    textEmphasisWeight: "500",
    borderGlow: "rgba(255, 200, 50, 0.08)",
  },
  concerned: {
    backgroundTint: "rgba(150, 120, 80, 0.03)",
    surfaceTint: "rgba(0, 0, 0, 0.01)",
    glowColor: "#C4862A",
    glowIntensity: 0.4,
    glowPulseSpeed: 2500,
    accentShift: "#D49030",
    textEmphasisWeight: "500",
    borderGlow: "rgba(200, 160, 80, 0.08)",
  },
  urgent: {
    backgroundTint: "rgba(239, 68, 68, 0.04)",
    surfaceTint: "rgba(239, 68, 68, 0.02)",
    glowColor: "#F4501C",
    glowIntensity: 0.9,
    glowPulseSpeed: 600,
    accentShift: "#F4501C",
    textEmphasisWeight: "700",
    borderGlow: "rgba(239, 68, 68, 0.12)",
  },
  chill: {
    backgroundTint: "rgba(100, 150, 200, 0.02)",
    surfaceTint: "rgba(0, 0, 0, 0)",
    glowColor: "#D4A040",
    glowIntensity: 0.15,
    glowPulseSpeed: 5000,
    accentShift: "#D4A040",
    textEmphasisWeight: "400",
    borderGlow: "rgba(200, 200, 255, 0.04)",
  },
};
```

#### 2. Chat Bubble Styling Shifts
George's message bubbles reflect his mood:

- **Excited**: Bubbles have a barely visible warm border glow. Text is 1px larger. Slightly more padding.
- **Urgent**: Bubbles get a sharper border. Key sentences auto-bold. Less padding (tighter, more direct).
- **Chill**: Bubbles are softer, rounded more. Generous padding. Text breathes.
- **Focused**: Clean sharp edges. Minimal decoration. Information-dense layout.
- **Proud**: Golden shimmer on the bubble border when George is celebrating savings or job completion.

```typescript
// In ChatBubble.tsx
function getMoodBubbleStyle(mood: string, intensity: number) {
  const theme = MOOD_THEMES[mood];
  return {
    borderColor: theme.borderGlow,
    borderWidth: intensity > 0.5 ? 1 : 0,
    paddingHorizontal: mood === "chill" ? 20 : mood === "urgent" ? 14 : 16,
    paddingVertical: mood === "chill" ? 14 : mood === "urgent" ? 10 : 12,
    // Shimmer overlay for "proud" mood
    shimmer: mood === "proud" && intensity > 0.6,
  };
}
```

#### 3. Animation Speed Scaling
The entire app's animation timing shifts with mood:

```typescript
// src/theme/animations.ts
function getMoodSpringConfig(mood: string) {
  switch (mood) {
    case "excited":
      return { damping: 12, stiffness: 195, mass: 0.9 };  // Snappier
    case "urgent":
      return { damping: 18, stiffness: 220, mass: 0.8 };  // Quick, decisive
    case "chill":
      return { damping: 12, stiffness: 100, mass: 1.2 };  // Lazy, floaty
    case "focused":
      return { damping: 20, stiffness: 180, mass: 1.0 };  // Precise, no overshoot
    case "proud":
      return { damping: 10, stiffness: 130, mass: 1.0 };  // Bouncy, celebratory
    default:
      return { damping: 15, stiffness: 150, mass: 1.0 };  // Standard
  }
}
```

Cards, bubbles, tab transitions, bottom sheets -- everything uses this config. The whole app feels different.

#### 4. Haptic Patterns Per Mood

```typescript
// src/services/haptics.ts
async function moodHaptic(mood: string, action: "tap" | "message" | "alert" | "success") {
  switch (mood) {
    case "excited":
      if (action === "message") {
        await Haptics.impactAsync(ImpactFeedbackStyle.Medium);
        await delay(80);
        await Haptics.impactAsync(ImpactFeedbackStyle.Light); // Double tap feel
      }
      break;
    case "urgent":
      if (action === "alert") {
        for (let i = 0; i < 3; i++) {
          await Haptics.impactAsync(ImpactFeedbackStyle.Heavy);
          await delay(100);
        }
      }
      break;
    case "proud":
      if (action === "success") {
        await Haptics.notificationAsync(NotificationFeedbackType.Success);
        await delay(200);
        await Haptics.impactAsync(ImpactFeedbackStyle.Light);
        await delay(100);
        await Haptics.impactAsync(ImpactFeedbackStyle.Light); // Celebratory triple
      }
      break;
    case "chill":
      if (action === "message") {
        await Haptics.impactAsync(ImpactFeedbackStyle.Light); // Barely there
      }
      break;
    // ... other moods
  }
}
```

#### 5. Typing Indicator Changes
George's thinking animation shifts with mood:

- **Neutral/Chill**: Slow, relaxed eye movement. Soft pulsing dots.
- **Excited**: Faster movement, brighter dots, quicker pulse.
- **Focused**: Eyes look down (reading/analyzing), steady dots, no bounce.
- **Urgent**: Fast pulsing, dots are sharper, slight vibration feel.
- **Proud**: Small smile during thinking, warm glow on dots.

If using Lottie, ship 3-4 variants of the thinking animation and swap based on mood. If procedural, drive animation speed/style from mood config.

#### 6. Notification Tones
Different sounds for different moods (requires custom sound files):

| Mood | Sound Character | File |
|------|----------------|------|
| Neutral | Clean, warm chime | `neutral-chime.mp3` |
| Excited | Bright, upbeat ding | `excited-ding.mp3` |
| Focused | Minimal, precise tap | `focused-tap.mp3` |
| Protective | Low, attention-getting tone | `protective-alert.mp3` |
| Proud | Warm, satisfying resolution chord | `proud-success.mp3` |
| Concerned | Soft, questioning double-tone | `concerned-double.mp3` |
| Urgent | Sharp, can't-miss alert | `urgent-alert.mp3` |
| Chill | Whisper-quiet, ambient | `chill-ambient.mp3` |

Play via `expo-av` on each new George message. Volume scales with `moodIntensity`.

#### 7. Home Screen Widget (iOS)
The iOS home screen widget shows George's face + a contextual one-liner. The widget appearance shifts with mood:

- Background tint matches current mood
- George's avatar matches mood state
- One-liner reflects mood + home context:
  - Chill: "All good at 1423 Oak Lane."
  - Protective: "Storm Thursday. Gutters need attention."
  - Excited: "Just saved you $340 on that pressure wash."
  - Concerned: "AC filter is 3 months overdue."

Widget updates via background fetch (every 30 min or on mood change push).

#### 8. Ambient Particle Effects (Per Mood)
Extremely subtle fullscreen particle overlay (react-native-skia):

| Mood | Particles | Details |
|------|-----------|---------|
| Excited | Tiny warm sparks | 3-5 floating amber dots, slow drift upward, 8% opacity |
| Focused | None | Clean screen, no distractions |
| Protective | Subtle pulse waves | Concentric rings from George's position, very slow, 5% opacity |
| Proud | Micro confetti | 5-8 tiny golden pieces, single burst on mood trigger, fade in 2s |
| Urgent | None (clean is more urgent) | High contrast does the work |
| Chill | Barely visible float | 2-3 soft circles, very slow drift, 3% opacity |

Rule: if a user consciously notices the particles, they're too much. These are felt, not seen.

#### 9. Input Bar Mood Response
The message input area subtly shifts:

- **Chill**: Placeholder text is casual -- "What's up?" or "Need anything?"
- **Focused**: "Describe the issue..." (more functional)
- **Urgent**: "Tell me what happened" (direct, ready to act)
- **Excited**: "What else can I help with?" (eager)
- **Protective**: "What do you need?" (ready, direct)

The send button glow intensity matches George's mood glow.

#### 10. Tab Bar Mood Tint
The floating tab bar's blur tint shifts with mood:
- The active tab indicator color interpolates toward the mood's accent color
- The blur intensity increases slightly during urgent moods (more contrast)
- During "proud" mood, the George tab icon gets a momentary golden ring

### Mood + Weather + Time Layering
Mood, weather, and time-of-day all compose together. Mood is the PRIMARY driver, weather is secondary, time is tertiary:

```typescript
function computeAtmosphere(
  mood: MoodState,
  weather: WeatherData,
  timeOfDay: TimeSegment
): FinalAtmosphere {
  // Start with mood as base (70% weight)
  const base = MOOD_THEMES[mood.state];
  // Layer weather tint (20% weight)
  const weatherTint = getWeatherTint(weather);
  // Layer time shift (10% weight)
  const timeShift = getTimeShift(timeOfDay);
  
  return blendAtmospheres(base, weatherTint, timeShift, {
    moodWeight: 0.7,
    weatherWeight: 0.2,
    timeWeight: 0.1,
  });
}
```

This means on a rainy evening when George is excited about a deal, you get: excitement as the dominant feel (warm, snappy), but with a cooler undertone from rain and slightly deeper tones from evening. The combination is unique and alive.

### Implementation Priority
1. **Phase 1** (with base build): Add `mood` field to chat API response. Implement background tint + glow changes. These alone make it feel alive.
2. **Phase 2**: Chat bubble styling, animation speed scaling, haptic patterns. This makes it feel intelligent.
3. **Phase 3**: Sound design, particles, widget, input bar changes. This makes it feel magical.
4. **Phase 4**: Weather + time + mood composition. Seasonal shifts. This makes it feel like it's breathing.

### Context Provider

```typescript
// src/context/MoodContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import Animated, { useSharedValue, withTiming } from "react-native-reanimated";

interface MoodState {
  current: string;          // "neutral" | "excited" | etc.
  intensity: number;        // 0-1
  reason: string;           // why George feels this way
  springConfig: SpringConfig;
  theme: MoodTheme;
}

const MoodContext = createContext<MoodState>(defaultMood);

export function MoodProvider({ children }: { children: React.ReactNode }) {
  const [mood, setMood] = useState<MoodState>(defaultMood);
  
  // Animated values for smooth transitions
  const bgTintOpacity = useSharedValue(0);
  const glowIntensity = useSharedValue(0.3);
  const glowPulseSpeed = useSharedValue(3000);
  
  // Called when chat API returns a mood
  function updateMood(newMood: string, intensity: number, reason: string) {
    const theme = MOOD_THEMES[newMood];
    // Smooth transition -- never jarring
    bgTintOpacity.value = withTiming(intensity * 0.1, { duration: 1500 });
    glowIntensity.value = withTiming(theme.glowIntensity, { duration: 2000 });
    glowPulseSpeed.value = withTiming(theme.glowPulseSpeed, { duration: 1500 });
    
    setMood({
      current: newMood,
      intensity,
      reason,
      springConfig: getMoodSpringConfig(newMood),
      theme,
    });
  }
  
  return (
    <MoodContext.Provider value={{ ...mood, updateMood }}>
      <MoodBackgroundLayer tintOpacity={bgTintOpacity} tintColor={mood.theme.backgroundTint}>
        {children}
      </MoodBackgroundLayer>
    </MoodContext.Provider>
  );
}

export const useMood = () => useContext(MoodContext);
```

Every component in the app can call `useMood()` to get the current mood state and adapt. The `MoodBackgroundLayer` wraps the entire app with an animated tint overlay.

### The Big Picture

When a new user opens the app for the first time, George is neutral -- warm, welcoming, standard. As they have their first conversation and George gets excited about helping them, the whole app subtly shifts. The user doesn't know WHY the app feels different -- they just know it feels alive. By month 3, they've seen George protective during hurricane season, chill on Sunday mornings, excited when he finds them a deal, proud when a job goes perfectly. The app has MOODS. It has a PERSONALITY that you can FEEL. No home services app, no AI app, no app period does this. This is what makes George real.

---

## Critical Rules
- **NO web views.** Everything is native React Native components.
- **Haptics on EVERY interaction.** If the user touches something, they feel it.
- **Spring animations everywhere.** Nothing linear. Everything has bounce.
- **George is always accessible.** From any screen, one tap back to George.
- **Dark theme ONLY for v1.** No light mode yet. Nail the dark aesthetic.
- **Offline graceful degradation.** Show cached data, queue messages for when online.
- **60fps or bust.** No dropped frames. Use reanimated worklets, not JS-driven animations.
