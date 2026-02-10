-- ============================================================
-- Migration: Add ESG Performance Indexes
-- Description: Optimizes queries for service ESG metrics and team lookups
-- Date: 2026-02-10
-- ============================================================

-- Service ESG Metrics Indexes
-- For service type filtering and aggregation
CREATE INDEX IF NOT EXISTS idx_service_esg_metrics_service_type
ON service_esg_metrics(service_type);

-- For date range filtering
CREATE INDEX IF NOT EXISTS idx_service_esg_metrics_created_at
ON service_esg_metrics(created_at);

-- For verification status filtering
CREATE INDEX IF NOT EXISTS idx_service_esg_metrics_verification_status
ON service_esg_metrics(verification_status);

-- Composite index for service type + verification status queries
CREATE INDEX IF NOT EXISTS idx_service_esg_metrics_service_verification
ON service_esg_metrics(service_type, verification_status);

-- For service request lookups (primary access pattern)
CREATE INDEX IF NOT EXISTS idx_service_esg_metrics_service_request
ON service_esg_metrics(service_request_id);

-- Business Team Members Indexes
-- For team lookups by business account
CREATE INDEX IF NOT EXISTS idx_business_team_members_business_account
ON business_team_members(business_account_id);

-- For user membership lookups
CREATE INDEX IF NOT EXISTS idx_business_team_members_user
ON business_team_members(user_id);

-- Composite index for active member queries
CREATE INDEX IF NOT EXISTS idx_business_team_members_active
ON business_team_members(business_account_id, is_active, invitation_status);

-- Composite index for user + business lookups (common in auth middleware)
CREATE INDEX IF NOT EXISTS idx_business_team_members_user_business
ON business_team_members(user_id, business_account_id);

-- ESG Impact Logs Indexes (for backward compatibility queries)
-- For customer impact tracking
CREATE INDEX IF NOT EXISTS idx_esg_impact_logs_customer
ON esg_impact_logs(customer_id);

-- For hauler/pro impact tracking
CREATE INDEX IF NOT EXISTS idx_esg_impact_logs_hauler
ON esg_impact_logs(hauler_id);

-- For service request lookups
CREATE INDEX IF NOT EXISTS idx_esg_impact_logs_service_request
ON esg_impact_logs(service_request_id);

-- For date range queries
CREATE INDEX IF NOT EXISTS idx_esg_impact_logs_created_at
ON esg_impact_logs(created_at);

-- HOA Properties Index (for team access checks)
CREATE INDEX IF NOT EXISTS idx_hoa_properties_business_account
ON hoa_properties(business_account_id);

-- HOA Violations Indexes (for team access checks)
CREATE INDEX IF NOT EXISTS idx_hoa_violations_business_account
ON hoa_violations(business_account_id);

CREATE INDEX IF NOT EXISTS idx_hoa_violations_property
ON hoa_violations(property_id);

-- Performance Analysis
-- These indexes should improve query times from ~500ms to <50ms for:
-- 1. Service type aggregation queries
-- 2. Team membership verification
-- 3. Date range filtering for reports
-- 4. Business account ESG metric lookups
