# UpTend — Home Services Platform

AI-powered home services marketplace connecting homeowners with vetted local professionals in Central Florida. Features an AI concierge ("George"), instant booking, property intelligence, and fleet management.

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Express.js + TypeScript + Drizzle ORM
- **Database:** PostgreSQL (Neon/Railway)
- **AI:** Anthropic Claude + OpenAI + Together AI
- **Payments:** Stripe (subscriptions, Connect payouts)
- **Email:** SendGrid / Resend
- **SMS:** Twilio
- **Maps:** Leaflet + Google Places API
- **Deploy:** Railway (Docker) / Replit

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url> && cd uptend-openclaw
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL, SESSION_SECRET, API keys

# 3. Push database schema
npm run db:push

# 4. Start development server
npm run dev
# App runs at http://localhost:5000
```

## Environment Variables

See `.env.example` for the full list. Minimum required:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `SESSION_SECRET` | ✅ | Session encryption key |
| `STRIPE_SECRET_KEY` | ✅ | Stripe API secret key |
| `STRIPE_PUBLISHABLE_KEY` | ✅ | Stripe publishable key |
| `ANTHROPIC_API_KEY` | ⚠️ | AI concierge (George) |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | ⚠️ | Photo analysis, AI features |
| `GOOGLE_PLACES_API_KEY` | ⚠️ | Address autocomplete |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (port 5000) |
| `npm run build` | Build for production |
| `npm start` | Run production build |
| `npm run check` | TypeScript type checking |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Drizzle Studio |
| `npm test` | Run tests |

## Project Structure

```
client/src/          # React frontend
  pages/             # Route pages
  components/        # Reusable components
    ui/              # shadcn/ui primitives
    landing/         # Landing page sections
    booking/         # Booking flow components
  hooks/             # Custom React hooks
  lib/               # Utilities
server/              # Express backend
  routes.ts          # API routes
  storage.ts         # Database layer (Drizzle)
  george-agent.ts    # AI concierge logic
shared/              # Shared types/schemas
migrations/          # Database migrations
```

## Deployment (Railway)

```bash
npm run build
# Outputs: dist/index.cjs (server) + dist/public/ (static)
# Start: NODE_ENV=production node dist/index.cjs
```

Docker: see `Dockerfile` and `railway.toml`.

## Key Features

- **AI Concierge (George):** Conversational home assistant for quotes, booking, diagnostics
- **Smart Booking:** Multi-step booking with photo upload, AI estimation
- **Property Intelligence:** Property data, maintenance tracking, home health scores
- **Pro Dashboard:** Job management, earnings, fleet tracking for service providers
- **Business Portal:** HOA/property manager bulk booking, compliance, reporting
- **Government Contracts:** Davis-Bacon compliance, prevailing wage tracking
- **Hauler System:** Junk removal fleet with GPS tracking, load verification
