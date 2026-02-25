# UpTend App — Design Spec for Cursor

## DROP THIS INTO CURSOR ALONGSIDE CURSOR-APP-SPEC.md

---

## Design Philosophy

**"Trust at first tap."**

This app should feel like Uber meets Spotify — dark, confident, and impossibly smooth. Every screen should feel like Apple designed it. The user should feel like they're using something premium, something that has their back. George is warm and approachable but the app around him is bold, clean, and authoritative.

Think: dark mode Uber's map screen meets Spotify's home feed meets Apple's attention to micro-interactions.

---

## Color Palette

### Primary Colors
```
Background:        #0A0A0A  (near-black — NOT pure black, easier on eyes)
Surface:           #161616  (cards, modals, bottom sheets)
Surface Elevated:  #1E1E1E  (raised cards, active states)
Surface Hover:     #252525  (pressed/hover states)
```

### Accent — Warm Amber
```
Accent Primary:    #F5A623  (warm gold — George's color, CTAs, highlights)
Accent Light:      #FFCC66  (hover/glow states)
Accent Muted:      #F5A623/15%  (subtle backgrounds, chip fills)
Accent Dark:       #CC8400  (pressed states)
```

### Text
```
Text Primary:      #FFFFFF  (headlines, primary content)
Text Secondary:    #A0A0A0  (descriptions, timestamps, labels)
Text Tertiary:     #666666  (disabled, placeholders)
Text On Accent:    #0A0A0A  (text on amber buttons — dark on gold)
```

### Semantic
```
Success:           #34C759  (Apple green — bookings confirmed, verified badges)
Error:             #FF3B30  (Apple red — errors, emergency, SOS)
Warning:           #FF9500  (alerts, pending states)
Info:              #5AC8FA  (tips, informational)
```

### Chat Bubbles
```
George Bubble BG:  #1E1E1E  (dark surface — George's messages)
George Bubble Border: #2A2A2A  (subtle 1px border)
User Bubble BG:    #F5A623  (amber — user's messages pop)
User Bubble Text:  #0A0A0A  (dark text on amber)
```

### Gradients (use sparingly — hero moments only)
```
Hero Gradient:     linear-gradient(180deg, #F5A623 0%, #CC8400 100%)
Card Glow:         radial-gradient(#F5A623/8% center, transparent 70%)
```

---

## Typography

Use **SF Pro** (iOS) / **Inter** (Android fallback). Clean, modern, no serif fonts.

```
Hero Title:        32px / bold / -0.5px tracking / #FFFFFF
Section Title:     24px / semibold / -0.3px tracking / #FFFFFF
Card Title:        18px / semibold / #FFFFFF
Body:              16px / regular / #FFFFFF
Body Secondary:    14px / regular / #A0A0A0
Caption:           12px / medium / #666666
Chat Text:         16px / regular (both bubbles)
Button Text:       16px / semibold / uppercase tracking +1px
Tab Label:         10px / medium
Badge:             11px / bold
```

---

## Spacing & Layout

```
Screen Padding:    20px horizontal
Card Padding:      16px
Card Gap:          12px
Card Radius:       16px
Button Radius:     12px (standard) / 999px (pill)
Input Radius:      12px
Chat Bubble Radius: 20px (with 4px on the sender's corner)
Bottom Tab Height: 84px (with safe area)
Status Bar:        Light content (white text on dark)
```

---

## Component Styles

### Buttons
```
Primary:     bg: #F5A623 / text: #0A0A0A / radius: 12px / height: 52px / shadow: 0 4px 12px #F5A623/25%
Secondary:   bg: #1E1E1E / text: #FFFFFF / border: 1px #2A2A2A / radius: 12px / height: 48px
Ghost:       bg: transparent / text: #F5A623 / radius: 12px / height: 44px
Destructive: bg: #FF3B30/15% / text: #FF3B30 / radius: 12px
Disabled:    bg: #1E1E1E / text: #666666
```

### Cards
```
bg: #161616
border: 1px solid #2A2A2A
radius: 16px
padding: 16px
shadow: none (borders define depth on dark backgrounds)
```

### Inputs
```
bg: #161616
border: 1px solid #2A2A2A
focus border: 1px solid #F5A623
radius: 12px
height: 48px
text: #FFFFFF
placeholder: #666666
padding: 0 16px
```

### Bottom Tabs
```
bg: #0A0A0A
border-top: 1px solid #1E1E1E
Active icon: #F5A623
Active label: #F5A623
Inactive icon: #666666
Inactive label: #666666
```

### Chat Bubbles
```
George:
  bg: #1E1E1E
  border: 1px solid #2A2A2A
  text: #FFFFFF
  radius: 20px 20px 20px 4px
  max-width: 85%
  padding: 12px 16px

User:
  bg: #F5A623
  text: #0A0A0A
  radius: 20px 20px 4px 20px
  max-width: 85%
  padding: 12px 16px
```

### Quick Action Chips (below chat)
```
bg: #F5A623/10%
border: 1px solid #F5A623/30%
text: #F5A623
radius: 999px
height: 36px
padding: 0 16px
font: 14px / medium
```

### Inline Cards (booking, pro match, video — rendered inside chat)
```
bg: #161616
border: 1px solid #2A2A2A
radius: 16px
padding: 16px
margin: 8px 0

Video Thumbnail:  16:9 ratio, radius: 12px, play button overlay
Product Card:     image left (60x60, radius 8px), title + price right, "Buy" pill button
Booking Card:     service name, date, price, full-width "Confirm" amber button
Pro Match Card:   avatar circle (48px), name, rating stars, price, "Book Now" amber button
```

### Status Badges
```
Confirmed:  bg: #34C759/15% / text: #34C759 / radius: 999px
Pending:    bg: #FF9500/15% / text: #FF9500
In Progress: bg: #5AC8FA/15% / text: #5AC8FA
Completed:  bg: #F5A623/15% / text: #F5A623
Cancelled:  bg: #FF3B30/15% / text: #FF3B30
Verified:   bg: #34C759/15% / text: #34C759 + checkmark icon
```

### Job Tracker Stepper
```
Track line:     2px, #2A2A2A (inactive) / #F5A623 (completed)
Step circle:    24px, border 2px
  Completed:    fill #F5A623, checkmark white
  Active:       border #F5A623, pulsing glow animation
  Upcoming:     border #2A2A2A, fill transparent
Step label:     14px, #FFFFFF (active) / #666666 (upcoming)
```

---

## George's Visual Identity

### Avatar
- **Shape:** 44px circle
- **Background:** #F5A623 (solid amber)
- **Content:** White "G" letter, 20px, bold, centered
- No cartoon face. No robot. Just a clean, confident mark.
- In chat, George's avatar appears next to his first message in a group, then hides for consecutive messages (like iMessage)

### Chat Input Bar
```
bg: #161616
border-top: 1px solid #1E1E1E
padding: 8px 16px (+ safe area bottom)

Input field:
  bg: #1E1E1E
  border: 1px solid #2A2A2A
  radius: 24px (pill shape)
  height: 44px
  placeholder: "Ask George anything..."
  text: #FFFFFF

Camera button: left of input, 36px circle, #1E1E1E bg, camera icon #A0A0A0
Send button: right of input, 36px circle, #F5A623 bg, arrow icon #0A0A0A (only visible when text entered)
```

### Loading / Thinking State
When George is processing:
- Three dots animation inside a George bubble (like iMessage typing indicator)
- Dots color: #A0A0A0, subtle fade animation
- Text below dots: "George is thinking..." in #666666, 12px

---

## Animations & Micro-interactions

### Page Transitions
- **Tab switches:** Cross-fade, 200ms ease
- **Push navigation:** Slide from right, 300ms spring (React Navigation default)
- **Bottom sheets:** Spring up from bottom, drag to dismiss

### Chat
- **New message:** Slide up + fade in, 250ms spring
- **Quick action chips:** Stagger fade in, 50ms delay each
- **Photo upload:** Thumbnail scales up from camera button position
- **Video card:** Fade in with subtle scale (0.95 → 1.0)

### Buttons
- **Press:** Scale to 0.97, 100ms
- **Amber glow:** Subtle shadow pulse on primary CTAs (very subtle, not flashy)

### Pull to Refresh
- Amber spinner at top
- Haptic feedback on trigger

### Skeleton Loading
```
bg: #1E1E1E
shimmer: linear-gradient(90deg, #1E1E1E 0%, #252525 50%, #1E1E1E 100%)
animation: shimmer 1.5s infinite
border-radius: match the component it's replacing
```

---

## Key Screens — Visual Reference

### George Chat Screen (default view on app open)
```
┌─────────────────────────┐
│ ● Mr. George         ⚙️ │  ← dark top bar, amber dot = online
│─────────────────────────│
│                         │
│  [G] Hey — what's going │  ← George bubble, dark surface
│      on with your home? │
│      I'm ready.         │
│                         │
│         I need my       │  ← User bubble, amber
│      gutters cleaned ●  │
│                         │
│  [G] Got it. Gutter     │
│      cleaning starts    │
│      at $150 for a      │
│      single-story.      │
│                         │
│  ┌─────────────────────┐│
│  │ ★ 4.9  Carlos R.    ││  ← Pro match card
│  │ 47 jobs · Verified  ││
│  │ $165              ││
│  │ [    Book Now     ] ││  ← Amber button
│  └─────────────────────┘│
│                         │
│ [Book Service] [DIY] [📷]│  ← Quick action chips, amber tint
│                         │
│ 📷 [  Ask George...  ] ➤ │  ← Input bar
└─────────────────────────┘
│  Home    George   Profile │  ← Bottom tabs
└───────────────────────────┘
```

### Dashboard Screen
```
┌─────────────────────────┐
│  Good morning, Alan.    │  ← White text, large
│  Your home is healthy.  │  ← #A0A0A0 secondary
│─────────────────────────│
│ ┌─────────────────────┐ │
│ │  Home Health    87/100│ │  ← Score with amber ring
│ │  ████████████░░  Good │ │
│ └─────────────────────┘ │
│                         │
│ ▼ Active Jobs (1)       │  ← Collapsible
│ ┌─────────────────────┐ │
│ │ Gutter Cleaning      │ │
│ │ ●───●───○───○        │ │  ← Stepper, amber dots
│ │ Carlos is en route   │ │
│ │ ETA: 12 min   [Track]│ │
│ └─────────────────────┘ │
│                         │
│ ▼ Recent Bookings       │
│ ▼ Spending This Month   │
│ ▼ Loyalty: Gold (2,400) │
└─────────────────────────┘
```

---

## What to AVOID

- No gradients on every surface (Spotify uses them sparingly — hero only)
- No glow/neon effects
- No rounded-everything (keep some sharp edges for contrast)
- No emoji anywhere — ever
- No bright white screens — always dark
- No thin/light font weights for important text
- No cluttered cards — breathing room matters
- No generic stock photo vibes
- No "tech startup" blue — amber is the identity
- No skeleton screens that flash (smooth transitions only)

---

## The Feeling

When someone opens this app for the first time, they should think:

*"This feels expensive. This feels like it was built by people who care. I trust this."*

Not "oh cool, another home services app." Not "this looks like a startup MVP." 

It should feel like the Tesla app — dark, minimal, confident. But warmer. Because George is talking to you, and George gives a damn about your home.

---

## Summary for Cursor

Build a dark-mode React Native app with:
- Near-black backgrounds (#0A0A0A)
- Warm amber accent (#F5A623)
- Apple-quality animations and micro-interactions
- Chat-first UI where George's bubbles are dark surface, user's bubbles are amber
- Cards with subtle borders, no shadows
- SF Pro / Inter typography
- 3-tab bottom nav (Home, George, Profile)
- Skeleton loading with shimmer
- Everything feels like Uber + Spotify had a baby that manages your home
