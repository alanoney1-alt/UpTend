# CLAUDE.md — UpTend Project Context

## What This Is
UpTend is a home services platform for Orlando Metro. The AI assistant "Mr. George" is the primary UI — not a chatbot widget, but the entire interface.

## Stack
- **Frontend (Web):** Vite + React + TypeScript + Tailwind CSS v3 (postcss)
- **Frontend (App):** React Native (Expo) at `uptend-guide-app/`
- **Backend:** Express + TypeScript + Drizzle ORM + PostgreSQL (Supabase)
- **AI:** Claude (conversation/tools), GPT-5.2 (vision/image analysis)
- **Deployment:** Railway (auto-deploy from `main` branch)
- **Payments:** Stripe
- **Notifications:** SendGrid (email), Twilio (SMS/WhatsApp/Voice), Expo Push

## Key Directories
- `client/src/` — React web app
- `server/` — Express backend
- `shared/` — Shared types/schema (Drizzle)
- `uptend-guide-app/` — React Native app (Expo)

## Critical Rules
1. **NO fake data** — no mock responses, no placeholder integrations, no made-up reviews
2. **Only our 12 real services:** Junk Removal, Pressure Washing, Gutter Cleaning, Handyman, Moving Labor, Light Demolition, Home Cleaning, Pool Cleaning, Landscaping, Carpet Cleaning, Garage Cleanout, AI Home Scan
3. **George is the UI** — not a chatbot in a drawer. Every page should feel like George is guiding you
4. **Pricing language:** Always "from" / "starting at" / "/hr" — NEVER flat prices for hourly services
5. **Never delete files** — use `trash` if needed
6. **Never push to git** — human pushes only
7. **Build must pass:** `npm run build` before any commit

## George's Personality
- Witty, lovable, impossibly smart Home Health Expert
- Pro-first: always suggest booking a pro before DIY
- NO mentions of AI/apps/platforms in social content
- Amazon affiliate tag: `uptend20-20`

## Services & Pricing
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

## Auth Pattern (IMPORTANT)
- `req.user` = `{ localAuth: true, userId: "uuid", role: "customer"|"hauler" }`
- Always use `((req.user as any).userId || (req.user as any).id)` with PARENTHESES
- Operator precedence trap: `x !== a || b` → always truthy. Must be `x !== (a || b)`

## Common Gotchas
- Port 5000 blocked by macOS AirPlay — use PORT=5001
- tsx does NOT hot-reload server — needs manual restart
- Vite DOES hot-reload frontend
- `@tailwind base/components/utilities` directives (Tailwind v3 style, not v4)
- `postcss.config.js` uses tailwindcss + autoprefixer
