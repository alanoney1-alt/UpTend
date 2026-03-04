-- Migration 0023: Dispatch & Live Tracking System
-- partner_subscription_tiers, dispatch_jobs, pro_locations, job_status_updates

-- 1. Partner subscription tiers
CREATE TABLE IF NOT EXISTS partner_subscription_tiers (
  id SERIAL PRIMARY KEY,
  partner_slug TEXT NOT NULL UNIQUE,
  tier TEXT NOT NULL DEFAULT 'starter' CHECK (tier IN ('starter', 'growth', 'scale')),
  monthly_price INTEGER NOT NULL DEFAULT 499,
  setup_fee INTEGER NOT NULL DEFAULT 1500,
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Dispatch jobs
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

CREATE INDEX IF NOT EXISTS idx_dispatch_jobs_partner ON dispatch_jobs(partner_slug, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_dispatch_jobs_pro ON dispatch_jobs(assigned_pro_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_dispatch_jobs_status ON dispatch_jobs(partner_slug, status);

-- 3. Pro GPS locations
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

CREATE INDEX IF NOT EXISTS idx_pro_locations_pro ON pro_locations(pro_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_pro_locations_partner ON pro_locations(partner_slug, recorded_at DESC);

-- 4. Job status timeline
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

CREATE INDEX IF NOT EXISTS idx_job_status_updates_job ON job_status_updates(job_id, created_at DESC);

-- 5. Enable RLS on all new tables
ALTER TABLE public.partner_subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatch_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pro_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_status_updates ENABLE ROW LEVEL SECURITY;

-- 6. Add service_role_all policies
DO $$ BEGIN
  CREATE POLICY service_role_all ON public.partner_subscription_tiers FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY service_role_all ON public.dispatch_jobs FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY service_role_all ON public.pro_locations FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY service_role_all ON public.job_status_updates FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
