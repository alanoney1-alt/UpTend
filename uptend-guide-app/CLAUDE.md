# CLAUDE.md — UpTend React Native App

## What This Is
UpTend is a home services app for Orlando Metro. The AI assistant "Mr. George" is the primary interface. Think of it as a home intelligence app — clean, polished, smooth like Spotify or Arc.

## Stack
- React Native (Expo)
- TypeScript
- Expo Router / React Navigation
- Backend API at https://uptendapp.com/api (or localhost:5001 for dev)

## Design Direction
- **Clean and polished** — Spotify-level quality. No clutter, no noise.
- **Dark theme**: background #121212, surfaces #1A1A1A to #282828
- **Amber accent**: #F59E0B primary, #D97706 secondary
- **Typography**: tight, minimal — bold white headers, gray subtitles, nothing extra
- **No visible card borders** — use background color elevation only
- **No emojis anywhere** — clean, typographic, professional
- **Smooth 60fps** — use react-native-reanimated, gesture-handler
- **George is the UI** — not a chatbot in a drawer. He's the primary interface.

## Our 12 Services (ONLY these — nothing else)
- Junk Removal: from $99
- Pressure Washing: from $120
- Gutter Cleaning: 1-story $150, 2-story $225
- Handyman: $75/hr
- Moving Labor: $65/hr
- Light Demolition: from $199
- Home Cleaning: from $99
- Pool Cleaning: $120/$165/$210 per month
- Landscaping: from $49
- Carpet Cleaning: $50/room standard, $75 deep, $89 pet
- Garage Cleanout: from $150
- AI Home Scan: $99 standard, $249 aerial

## Key Files
- `src/screens/` — all app screens
- `src/components/` — reusable UI components
- `src/navigation/AppNavigator.tsx` — main navigation
- `src/services/api.ts` — API client
- `src/theme/tokens.ts` — design tokens
- `src/config.ts` — API base URL config

## Rules
- NO fake data, NO mock responses, NO placeholder content
- NO emojis
- Only our 12 real services listed above
- Pricing language: always "from" / "starting at" / "/hr"
- George can only offer our 12 services — say "coming soon" for anything else
- TypeScript strict — zero errors
- Don't delete files
- Don't push to git

## API Endpoints
- POST /api/customers/login — customer auth
- POST /api/haulers/login — pro auth
- POST /api/ai/guide/chat — George AI chat (140 tools)
- GET /api/haulers/nearby — find pros
- POST /api/service-requests — create booking
- POST /api/service-requests/:id/review — submit review

## Auth Pattern
- Tokens stored in expo-secure-store
- `Authorization: Bearer <token>` header on all authenticated requests
- 401 response = auto-logout
