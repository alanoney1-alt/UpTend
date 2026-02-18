-- Loyalty Tiers + Referral Engine + Community Features
-- Run against Supabase

-- ═══════════════════════════════════════════════
-- PART A: Loyalty Tier System
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS loyalty_tiers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  customer_id TEXT NOT NULL,
  current_tier TEXT NOT NULL DEFAULT 'bronze' CHECK (current_tier IN ('bronze','silver','gold','platinum')),
  lifetime_spend NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_bookings INT NOT NULL DEFAULT 0,
  tier_updated_at TIMESTAMPTZ DEFAULT NOW(),
  benefits JSONB DEFAULT '{}',
  next_tier_threshold NUMERIC(12,2) DEFAULT 500,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id)
);

CREATE TABLE IF NOT EXISTS loyalty_rewards (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  customer_id TEXT NOT NULL,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('discount','free_service','priority_scheduling','dedicated_team','free_scan')),
  reward_value NUMERIC(12,2),
  description TEXT,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  redeemed BOOLEAN DEFAULT false,
  redeemed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS loyalty_milestones (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  customer_id TEXT NOT NULL,
  milestone_type TEXT NOT NULL CHECK (milestone_type IN ('first_booking','fifth_booking','tenth_booking','first_referral','full_scan','one_year_member','spent_500','spent_2000','spent_5000')),
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  reward_granted BOOLEAN DEFAULT false,
  reward_id TEXT REFERENCES loyalty_rewards(id)
);

CREATE INDEX IF NOT EXISTS idx_loyalty_tiers_customer ON loyalty_tiers(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_customer ON loyalty_rewards(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_milestones_customer ON loyalty_milestones(customer_id);

-- Seed tier definitions as a reference table
CREATE TABLE IF NOT EXISTS loyalty_tier_definitions (
  tier TEXT PRIMARY KEY,
  min_spend NUMERIC(12,2) NOT NULL,
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  benefits JSONB NOT NULL DEFAULT '[]'
);

INSERT INTO loyalty_tier_definitions (tier, min_spend, discount_percent, benefits) VALUES
  ('bronze', 0, 0, '["base_tier"]'),
  ('silver', 500, 2, '["priority_scheduling", "2_percent_discount"]'),
  ('gold', 2000, 5, '["5_percent_discount", "dedicated_pro_team", "free_annual_home_scan"]'),
  ('platinum', 5000, 10, '["10_percent_discount", "free_annual_home_scan", "priority_emergency_dispatch", "dedicated_account_manager", "early_access_new_services"]')
ON CONFLICT (tier) DO NOTHING;

-- ═══════════════════════════════════════════════
-- PART B: Referral Engine
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS referrals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  referrer_id TEXT NOT NULL,
  referred_email TEXT,
  referred_phone TEXT,
  referred_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','signed_up','first_booking','credited')),
  referral_code TEXT NOT NULL,
  credit_amount NUMERIC(12,2) DEFAULT 25,
  referrer_credited BOOLEAN DEFAULT false,
  referred_credited BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  converted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS referral_codes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  customer_id TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  uses INT DEFAULT 0,
  max_uses INT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_deals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  neighborhood_name TEXT NOT NULL,
  service_type TEXT NOT NULL,
  organized_by TEXT NOT NULL,
  participant_count INT DEFAULT 1,
  min_participants INT DEFAULT 3,
  discount_percent NUMERIC(5,2) DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'forming' CHECK (status IN ('forming','confirmed','scheduled','completed')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_deal_participants (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  group_deal_id TEXT NOT NULL REFERENCES group_deals(id),
  customer_id TEXT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_deal_id, customer_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_customer ON referral_codes(customer_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_group_deals_status ON group_deals(status);

-- ═══════════════════════════════════════════════
-- PART C: Community Features
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS neighborhood_activity (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  neighborhood_name TEXT,
  zip TEXT NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('booking','review','deal','tip','event')),
  summary TEXT,
  customer_id TEXT,
  service_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS local_events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  event_name TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('community','market','festival','workshop','cleanup')),
  location TEXT,
  address TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  description TEXT,
  source TEXT DEFAULT 'manual' CHECK (source IN ('scraped','manual','partner')),
  url TEXT,
  zip TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS neighborhood_tips (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  customer_id TEXT NOT NULL,
  zip TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('contractor_warning','pro_recommendation','hoa_tip','local_deal','weather_alert')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  upvotes INT DEFAULT 0,
  downvotes INT DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS neighborhood_tip_votes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tip_id TEXT NOT NULL REFERENCES neighborhood_tips(id),
  user_id TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('up','down')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tip_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_neighborhood_activity_zip ON neighborhood_activity(zip);
CREATE INDEX IF NOT EXISTS idx_local_events_zip ON local_events(zip);
CREATE INDEX IF NOT EXISTS idx_neighborhood_tips_zip ON neighborhood_tips(zip);
