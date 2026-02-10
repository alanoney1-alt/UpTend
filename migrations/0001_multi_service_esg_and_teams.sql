-- Migration: Multi-Service ESG Tracking & Multi-User B2B System
-- Created: 2026-02-09
-- Description: Adds service-specific ESG metrics tracking and business team member support

-- ==========================================
-- Business Team Members (Multi-User B2B)
-- ==========================================
CREATE TABLE IF NOT EXISTS business_team_members (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  business_account_id VARCHAR NOT NULL,
  user_id VARCHAR NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',

  -- Permissions
  can_view_financials BOOLEAN DEFAULT false,
  can_manage_team BOOLEAN DEFAULT false,
  can_create_jobs BOOLEAN DEFAULT true,
  can_approve_payments BOOLEAN DEFAULT false,
  can_access_esg_reports BOOLEAN DEFAULT true,
  can_manage_properties BOOLEAN DEFAULT false,

  -- Invitation
  invited_by VARCHAR,
  invitation_token TEXT,
  invitation_status TEXT DEFAULT 'pending',

  is_active BOOLEAN DEFAULT true,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_business_team_members_business_account ON business_team_members(business_account_id);
CREATE INDEX idx_business_team_members_user ON business_team_members(user_id);
CREATE INDEX idx_business_team_members_invitation_token ON business_team_members(invitation_token);

-- ==========================================
-- Service-Specific ESG Metrics
-- ==========================================
CREATE TABLE IF NOT EXISTS service_esg_metrics (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id VARCHAR NOT NULL,
  service_type TEXT NOT NULL,

  -- Universal metrics
  water_used_gallons REAL DEFAULT 0,
  water_saved_gallons REAL DEFAULT 0,
  water_efficiency_pct REAL DEFAULT 0,
  energy_used_kwh REAL DEFAULT 0,
  energy_saved_kwh REAL DEFAULT 0,

  -- Chemical metrics
  chemical_used_oz REAL DEFAULT 0,
  chemical_type TEXT,
  chemical_co2e_per_oz REAL DEFAULT 0,

  -- Material metrics
  materials_salvaged_lbs REAL DEFAULT 0,
  salvage_rate REAL DEFAULT 0,

  -- Service-specific
  prevention_value REAL DEFAULT 0,
  repair_vs_replace_savings REAL DEFAULT 0,
  route_optimization_savings REAL DEFAULT 0,
  carbon_sequestered REAL DEFAULT 0,

  -- Aggregated impact
  total_co2_saved_lbs REAL DEFAULT 0,
  total_co2_emitted_lbs REAL DEFAULT 0,
  net_co2_impact_lbs REAL DEFAULT 0,
  esg_score REAL DEFAULT 0,

  -- Metadata
  calculation_method TEXT NOT NULL,
  verification_status TEXT DEFAULT 'pending',
  calculation_details TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_service_esg_metrics_service_request ON service_esg_metrics(service_request_id);
CREATE INDEX idx_service_esg_metrics_service_type ON service_esg_metrics(service_type);
CREATE INDEX idx_service_esg_metrics_created_at ON service_esg_metrics(created_at);

-- ==========================================
-- Data Migration for Existing Business Accounts
-- ==========================================
-- This will be handled by a separate script: migrate-business-accounts-to-teams.ts
-- For each existing business account, create a team member with role="owner"

COMMENT ON TABLE business_team_members IS 'Multi-user access for B2B business accounts';
COMMENT ON TABLE service_esg_metrics IS 'Service-specific ESG metrics for all 11+ services (pressure washing, gutter cleaning, pool cleaning, etc.)';
