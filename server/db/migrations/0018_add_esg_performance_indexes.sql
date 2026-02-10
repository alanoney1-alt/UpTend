-- Migration: Add ESG Performance Indexes
-- Description: Add database indexes to optimize ESG metric queries and team member lookups
-- Created: 2024

-- ==========================================
-- Service ESG Metrics Indexes
-- ==========================================

-- Index for filtering by service type (used in service-specific queries)
CREATE INDEX IF NOT EXISTS idx_service_esg_metrics_service_type
ON service_esg_metrics(service_type);

-- Index for date range filtering (used in reports and dashboards)
CREATE INDEX IF NOT EXISTS idx_service_esg_metrics_created_at
ON service_esg_metrics(created_at);

-- Composite index for verification status + service type (used in verified metric queries)
CREATE INDEX IF NOT EXISTS idx_service_esg_metrics_service_verification
ON service_esg_metrics(service_type, verification_status, created_at);

-- Index for service request lookups (used in job detail views)
CREATE INDEX IF NOT EXISTS idx_service_esg_metrics_service_request
ON service_esg_metrics(service_request_id);

-- ==========================================
-- Business Team Members Indexes
-- ==========================================

-- Composite index for user + business lookups (used in team membership checks)
CREATE INDEX IF NOT EXISTS idx_business_team_members_user_business
ON business_team_members(user_id, business_account_id);

-- Index for business account queries (used in team roster views)
CREATE INDEX IF NOT EXISTS idx_business_team_members_business
ON business_team_members(business_account_id);

-- Index for active members only (used in permission checks)
CREATE INDEX IF NOT EXISTS idx_business_team_members_active
ON business_team_members(business_account_id, is_active)
WHERE is_active = true;

-- Index for invitation token lookups (used in accept invitation flow)
CREATE INDEX IF NOT EXISTS idx_business_team_members_invitation_token
ON business_team_members(invitation_token)
WHERE invitation_token IS NOT NULL;

-- ==========================================
-- ESG Impact Logs Indexes (Enhanced)
-- ==========================================

-- Index for material type filtering (used in material-specific aggregations)
CREATE INDEX IF NOT EXISTS idx_esg_impact_logs_material_type
ON esg_impact_logs(material_type);

-- Composite index for service request + verification (used in job ESG detail views)
CREATE INDEX IF NOT EXISTS idx_esg_impact_logs_service_verification
ON esg_impact_logs(service_request_id, verification_status);

-- Index for timestamp-based queries (used in trends and reports)
CREATE INDEX IF NOT EXISTS idx_esg_impact_logs_timestamp
ON esg_impact_logs(timestamp);

-- ==========================================
-- Performance Notes
-- ==========================================

-- Expected Performance Improvements:
-- - Service type aggregations: 10-50x faster (sequential scan -> index scan)
-- - Date range queries: 5-20x faster (filtering 1M+ rows)
-- - Team membership checks: 20-100x faster (O(n) -> O(log n))
-- - Verification status filtering: 3-10x faster (composite index)
--
-- Index Maintenance:
-- - PostgreSQL automatically maintains B-tree indexes
-- - VACUUM ANALYZE recommended after migration
-- - Monitor index usage with pg_stat_user_indexes
-- - Consider removing unused indexes after 6 months
--
-- Query Patterns Optimized:
-- 1. SELECT * FROM service_esg_metrics WHERE service_type = ? AND verification_status = 'verified'
-- 2. SELECT * FROM service_esg_metrics WHERE created_at >= ? AND created_at <= ?
-- 3. SELECT * FROM business_team_members WHERE user_id = ? AND business_account_id = ?
-- 4. SELECT * FROM business_team_members WHERE business_account_id = ? AND is_active = true
-- 5. SELECT * FROM esg_impact_logs WHERE service_request_id = ? AND verification_status = 'verified'
