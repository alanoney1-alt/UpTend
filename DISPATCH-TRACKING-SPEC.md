# Dispatch & Live Tracking System — Build Spec

## Overview
Build a complete dispatch, job tracking, and live GPS system for HVAC partner operations. This is the ServiceTitan killer feature set — tiered so partners unlock more as they pay more.

## Feature Tier System

### Database: `partner_subscription_tiers` table
```sql
CREATE TABLE IF NOT EXISTS partner_subscription_tiers (
  id SERIAL PRIMARY KEY,
  partner_slug TEXT NOT NULL UNIQUE,
  tier TEXT NOT NULL DEFAULT 'starter' CHECK (tier IN ('starter', 'growth', 'scale')),
  monthly_price INTEGER NOT NULL DEFAULT 499,
  setup_fee INTEGER NOT NULL DEFAULT 1500,
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tier Feature Gates
Create `server/services/tier-gates.ts`:
- `canAccessFeature(partnerSlug, featureName) => boolean`
- Features gated by tier:
  - starter: basic_scheduling, job_status, booking_notifications, george_intake, seo_4_pages, 1_landing_page
  - growth: live_dispatch_board, pro_gps_tracking, customer_eta_notifications, pro_mobile_view, lead_scoring, seo_12_pages, 3_landing_pages, monthly_reports
  - scale: uber_style_customer_tracking, pro_mobile_full (checklists, photos, parts), auto_dispatch, reviews_ratings, analytics_dashboard, unlimited_seo, white_label, api_access, dedicated_account_manager

## Core Tables

### `dispatch_jobs`
```sql
CREATE TABLE IF NOT EXISTS dispatch_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_slug TEXT NOT NULL,
  customer_id INTEGER REFERENCES users(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  customer_address TEXT NOT NULL,
  customer_lat NUMERIC(10,7),
  customer_lng NUMERIC(10,7),
  service_type TEXT NOT NULL,
  description TEXT,
  assigned_pro_id INTEGER REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','dispatched','en_route','arrived','in_progress','completed','cancelled')),
  scheduled_date DATE NOT NULL,
  scheduled_time_start TIME,
  scheduled_time_end TIME,
  actual_arrival TIMESTAMPTZ,
  actual_completion TIMESTAMPTZ,
  notes TEXT,
  invoice_amount NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `pro_locations` (GPS tracking)
```sql
CREATE TABLE IF NOT EXISTS pro_locations (
  id SERIAL PRIMARY KEY,
  pro_id INTEGER NOT NULL REFERENCES users(id),
  partner_slug TEXT NOT NULL,
  lat NUMERIC(10,7) NOT NULL,
  lng NUMERIC(10,7) NOT NULL,
  heading NUMERIC(5,2),
  speed NUMERIC(5,2),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_pro_locations_pro ON pro_locations(pro_id, recorded_at DESC);
```

### `job_status_updates` (timeline)
```sql
CREATE TABLE IF NOT EXISTS job_status_updates (
  id SERIAL PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES dispatch_jobs(id),
  status TEXT NOT NULL,
  updated_by INTEGER REFERENCES users(id),
  note TEXT,
  lat NUMERIC(10,7),
  lng NUMERIC(10,7),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## API Routes — `server/routes/dispatch.routes.ts`

### Partner/Office Endpoints (tier-gated)
- `GET /api/dispatch/:slug/jobs` — list jobs (all tiers)
- `POST /api/dispatch/:slug/jobs` — create job (all tiers)
- `PUT /api/dispatch/:slug/jobs/:jobId` — update job (all tiers)
- `DELETE /api/dispatch/:slug/jobs/:jobId` — cancel job (all tiers)
- `GET /api/dispatch/:slug/board` — dispatch board with pro locations (growth+)
- `POST /api/dispatch/:slug/jobs/:jobId/assign` — assign pro to job (all tiers)
- `POST /api/dispatch/:slug/auto-dispatch` — auto-assign by location/skill (scale only)
- `GET /api/dispatch/:slug/analytics` — performance dashboard (scale only)

### Pro Endpoints (mobile)
- `GET /api/dispatch/pro/my-jobs` — pro's assigned jobs for today
- `PUT /api/dispatch/pro/jobs/:jobId/status` — update job status (en_route, arrived, in_progress, completed)
- `POST /api/dispatch/pro/location` — send GPS location update
- `GET /api/dispatch/pro/jobs/:jobId/details` — full job details + customer history (growth+)
- `POST /api/dispatch/pro/jobs/:jobId/photos` — upload job photos (scale)
- `POST /api/dispatch/pro/jobs/:jobId/checklist` — complete job checklist (scale)

### Customer Endpoints
- `GET /api/dispatch/track/:jobId` — job status + pro ETA (growth+: includes live GPS)
- `GET /api/dispatch/track/:jobId/live` — SSE stream for real-time pro location (scale only)

### Notification Triggers
- When job status changes to 'dispatched': notify customer "Your tech has been assigned"
- When status changes to 'en_route': notify customer "Your tech is on the way" + ETA (growth+)
- When status changes to 'arrived': notify customer "Your tech has arrived"
- When status changes to 'completed': send invoice + review request

## Frontend Pages

### `/partners/:slug/dispatch` — Dispatch Board (growth+)
- Calendar/list view of today's jobs
- Map showing all pro locations in real time (Leaflet)
- Drag-and-drop job assignment
- Job status cards with color coding
- Click job to see details, reassign, add notes
- Real-time updates via SSE or polling

### `/partners/:slug/schedule` — Job Scheduler (all tiers)
- Calendar view (week/day)
- Create new jobs
- Assign to available pros
- View job details

### `/partners/:slug/analytics` — Analytics Dashboard (scale only)
- Jobs completed this week/month
- Average job duration
- Revenue per pro
- Customer satisfaction ratings
- Response time metrics

### `/track/:jobId` — Customer Tracking (update existing)
- Real-time map with pro location (Leaflet, already have this!)
- Status timeline (scheduled → dispatched → en route → arrived → in progress → complete)
- Pro info card (name, photo, rating)
- ETA countdown
- Chat with pro (future)

### Pro Mobile Views (responsive, not separate app)
- `/pro/dashboard` — today's jobs list
- `/pro/jobs/:jobId` — job details, customer info, navigation link
- Status update buttons (big, thumb-friendly)
- GPS auto-reporting when en route

## Existing Code to Build On
- `client/src/pages/job-live-tracker.tsx` — already has Leaflet map + status timeline (currently mock data)
- `client/src/pages/partners/partner-dashboard.tsx` — partner dashboard with stats, leads, jobs
- `server/routes/partner-dashboard.routes.ts` — partner API routes
- `client/src/pages/tracking.tsx` — customer tracking page

## Tech Stack (match existing)
- Frontend: React + TypeScript + Tailwind + shadcn/ui + Leaflet
- Backend: Express + TypeScript + PostgreSQL (Supabase via pool)
- Real-time: SSE (Server-Sent Events) — already used for George streaming
- Auth: existing req.user pattern (req.user.userId)

## Important
- Enable RLS on all new tables + add service_role_all policy
- All new routes must check tier gates before allowing access
- Dark theme compatible (existing dark theme system)
- Mobile responsive (pros will use phones)
- Don't break any existing functionality
