-- George Phase 1 Migration: New tables for live data queries
-- Existing tables (home_profiles, home_appliances, referrals) are unchanged.
-- This migration creates only the 5 new tables George needs.

-- ─────────────────────────────────────────────
-- Maintenance Reminders
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS maintenance_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  home_id UUID,
  reminder_type TEXT NOT NULL, -- air_filter, water_filter, hvac, gutter, pest, etc.
  description TEXT,
  interval_days INTEGER NOT NULL DEFAULT 90,
  last_completed DATE,
  next_due DATE,
  auto_book BOOLEAN DEFAULT false,
  service_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_reminders_user_id ON maintenance_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_reminders_next_due ON maintenance_reminders(next_due);

-- ─────────────────────────────────────────────
-- Pro Earnings Goals
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pro_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id TEXT NOT NULL,
  monthly_target INTEGER NOT NULL DEFAULT 500000, -- cents ($5,000)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pro_goals_pro_id ON pro_goals(pro_id);

-- ─────────────────────────────────────────────
-- Customer Loyalty
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customer_loyalty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  tier TEXT DEFAULT 'bronze', -- bronze, silver, gold, platinum
  lifetime_spend INTEGER DEFAULT 0, -- cents
  points INTEGER DEFAULT 0,
  streak_months INTEGER DEFAULT 0,
  joined_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_loyalty_user_id ON customer_loyalty(user_id);

-- ─────────────────────────────────────────────
-- Smart Home Device Connections
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS smart_home_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  device_type TEXT NOT NULL, -- nest, ring, august, flo, myq, simplisafe
  device_name TEXT,
  access_token TEXT, -- encrypted
  refresh_token TEXT, -- encrypted
  last_data_sync TIMESTAMP,
  status TEXT DEFAULT 'connected',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_smart_home_devices_user_id ON smart_home_devices(user_id);

-- ─────────────────────────────────────────────
-- Service History Notes (pro observations during jobs)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS service_history_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL,
  pro_id TEXT NOT NULL,
  home_id UUID,
  note_type TEXT DEFAULT 'observation', -- observation, photo, recommendation
  content TEXT NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_history_notes_job_id ON service_history_notes(job_id);
CREATE INDEX IF NOT EXISTS idx_service_history_notes_pro_id ON service_history_notes(pro_id);
