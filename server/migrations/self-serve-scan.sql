-- Self-Serve AI Home Scan: tables for scan sessions, scanned items, rewards, and wallet
-- Run against Supabase

CREATE TABLE IF NOT EXISTS home_scan_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  total_credits_earned NUMERIC(10,2) NOT NULL DEFAULT 0,
  streak_days INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_home_scan_sessions_customer ON home_scan_sessions(customer_id);

CREATE TABLE IF NOT EXISTS scanned_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_session_id UUID NOT NULL REFERENCES home_scan_sessions(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL,
  room_name TEXT NOT NULL,
  appliance_name TEXT,
  photo_url TEXT,
  analysis_result JSONB,
  condition INTEGER CHECK (condition BETWEEN 1 AND 10),
  brand TEXT,
  model TEXT,
  estimated_age TEXT,
  credit_awarded NUMERIC(10,2) NOT NULL DEFAULT 1.00,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_scanned_items_session ON scanned_items(scan_session_id);
CREATE INDEX idx_scanned_items_customer ON scanned_items(customer_id);

CREATE TABLE IF NOT EXISTS scan_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('per_item', 'completion_bonus', 'streak_bonus')),
  amount NUMERIC(10,2) NOT NULL,
  description TEXT,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_scan_rewards_customer ON scan_rewards(customer_id);

CREATE TABLE IF NOT EXISTS customer_wallet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT UNIQUE NOT NULL,
  balance NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_earned NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_spent NUMERIC(10,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_customer_wallet_customer ON customer_wallet(customer_id);
