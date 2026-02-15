-- B2B Subscription Plans & Subscriptions
CREATE TABLE IF NOT EXISTS b2b_subscription_plans (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  segment TEXT NOT NULL, -- 'hoa', 'pm', 'construction', 'government'
  tier TEXT NOT NULL, -- 'starter', 'professional', 'enterprise', 'project', 'standard'
  price_per_unit REAL NOT NULL,
  unit_type TEXT NOT NULL, -- 'unit', 'door', 'flat_monthly', 'flat_yearly'
  max_units INTEGER, -- NULL = unlimited
  features JSONB NOT NULL DEFAULT '[]',
  transaction_fee_pct REAL NOT NULL DEFAULT 5.0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS b2b_subscriptions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id VARCHAR NOT NULL,
  plan_id VARCHAR NOT NULL REFERENCES b2b_subscription_plans(id),
  units_count INTEGER NOT NULL DEFAULT 0,
  monthly_price REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'trial', 'cancelled', 'past_due'
  billing_cycle TEXT NOT NULL DEFAULT 'monthly', -- 'monthly', 'yearly'
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  next_billing_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed all 12 plans
INSERT INTO b2b_subscription_plans (name, segment, tier, price_per_unit, unit_type, max_units, features, transaction_fee_pct) VALUES
-- HOA
('HOA Starter', 'hoa', 'starter', 3, 'unit', 100, '["Dashboard", "Maintenance calendar", "Vendor scorecards"]', 8),
('HOA Professional', 'hoa', 'professional', 5, 'unit', 500, '["Dashboard", "Maintenance calendar", "Vendor scorecards", "Compliance vault", "Board approvals", "Violation tracking", "Reserve studies"]', 6),
('HOA Enterprise', 'hoa', 'enterprise', 8, 'unit', NULL, '["Dashboard", "Maintenance calendar", "Vendor scorecards", "Compliance vault", "Board approvals", "Violation tracking", "Reserve studies", "White-label portal", "Custom reports", "API access", "Dedicated support"]', 5),
-- PM
('PM Starter', 'pm', 'starter', 4, 'door', 200, '["Work orders", "Vendor compliance", "Owner reporting"]', 8),
('PM Professional', 'pm', 'professional', 6, 'door', 1000, '["Work orders", "Vendor compliance", "Owner reporting", "Turnover workflow", "SLA management", "Preventive maintenance", "Emergency dispatch"]', 6),
('PM Enterprise', 'pm', 'enterprise', 10, 'door', NULL, '["Work orders", "Vendor compliance", "Owner reporting", "Turnover workflow", "SLA management", "Preventive maintenance", "Emergency dispatch", "White-label", "API", "Custom reports", "Multi-portfolio"]', 5),
-- Construction
('Construction Project', 'construction', 'project', 299, 'flat_monthly', 5, '["Punch lists", "Lien waivers", "Permits"]', 7),
('Construction Professional', 'construction', 'professional', 599, 'flat_monthly', 20, '["Punch lists", "Lien waivers", "Permits", "Sub compliance vault", "Schedule coordination", "Safety compliance"]', 6),
('Construction Enterprise', 'construction', 'enterprise', 999, 'flat_monthly', NULL, '["Punch lists", "Lien waivers", "Permits", "Sub compliance vault", "Schedule coordination", "Safety compliance", "White-label", "API", "Custom reports"]', 5),
-- Government
('Government Standard', 'government', 'standard', 15000, 'flat_yearly', NULL, '["Compliance suite", "Certified payroll", "Prevailing wages", "Audit trail"]', 7),
('Government Professional', 'government', 'professional', 35000, 'flat_yearly', NULL, '["Compliance suite", "Certified payroll", "Prevailing wages", "Audit trail", "FEMA module", "Bid management", "DBE tracking", "Section 3"]', 6),
('Government Enterprise', 'government', 'enterprise', 75000, 'flat_yearly', NULL, '["Compliance suite", "Certified payroll", "Prevailing wages", "Audit trail", "FEMA module", "Bid management", "DBE tracking", "Section 3", "Dedicated support", "Custom integrations", "White-label"]', 5)
ON CONFLICT DO NOTHING;
