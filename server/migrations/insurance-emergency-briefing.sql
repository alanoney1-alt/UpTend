-- Insurance Claims + Emergency Dispatch + Morning Briefing tables
-- Run against Supabase

CREATE TABLE IF NOT EXISTS insurance_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL,
  claim_type TEXT NOT NULL CHECK (claim_type IN ('storm','fire','flood','theft','vandalism','accident')),
  status TEXT NOT NULL DEFAULT 'documenting' CHECK (status IN ('documenting','submitted','in_review','approved','denied','paid')),
  insurance_company TEXT,
  policy_number TEXT,
  incident_date TIMESTAMPTZ,
  description TEXT,
  damage_estimate DECIMAL(12,2),
  photos JSONB DEFAULT '[]'::jsonb,
  before_photos JSONB DEFAULT '[]'::jsonb,
  timeline JSONB DEFAULT '[]'::jsonb,
  adjuster_name TEXT,
  adjuster_phone TEXT,
  claim_number TEXT,
  settlement_amount DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS storm_prep_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL,
  storm_type TEXT NOT NULL CHECK (storm_type IN ('hurricane','tornado','severe_storm','freeze')),
  checklist JSONB DEFAULT '[]'::jsonb,
  property_actions JSONB DEFAULT '{}'::jsonb,
  emergency_contacts JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emergency_dispatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL,
  emergency_type TEXT NOT NULL CHECK (emergency_type IN ('pipe_burst','roof_damage','flooding','tree_down','power_outage','gas_leak','fire_damage','lockout')),
  severity TEXT NOT NULL DEFAULT 'standard' CHECK (severity IN ('critical','urgent','standard')),
  address TEXT,
  description TEXT,
  photos JSONB DEFAULT '[]'::jsonb,
  dispatched_pro_id TEXT,
  dispatched_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  arrived_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','dispatched','en_route','on_site','resolved','cancelled')),
  estimated_arrival TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insurance_claims_customer ON insurance_claims(customer_id);
CREATE INDEX IF NOT EXISTS idx_emergency_dispatches_customer ON emergency_dispatches(customer_id);
CREATE INDEX IF NOT EXISTS idx_emergency_dispatches_status ON emergency_dispatches(status);
CREATE INDEX IF NOT EXISTS idx_storm_prep_customer ON storm_prep_checklists(customer_id);
