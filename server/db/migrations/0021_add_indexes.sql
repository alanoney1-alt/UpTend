-- 0021_add_indexes.sql
-- Add database indexes for production query performance

-- Service request lookups (most queried table)
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_customer_id ON service_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_assigned_hauler_id ON service_requests(assigned_hauler_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_created_at ON service_requests(created_at);

-- Pro matching queries
CREATE INDEX IF NOT EXISTS idx_hauler_profiles_user_id ON hauler_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_hauler_profiles_available ON hauler_profiles(is_available);

-- User lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Reviews
CREATE INDEX IF NOT EXISTS idx_hauler_reviews_hauler_id ON hauler_reviews(hauler_id);
CREATE INDEX IF NOT EXISTS idx_hauler_reviews_service_request_id ON hauler_reviews(service_request_id);

-- Location tracking
CREATE INDEX IF NOT EXISTS idx_location_history_user_id ON location_history(user_id);

-- Match attempts (for real-time matching)
CREATE INDEX IF NOT EXISTS idx_match_attempts_request_id ON match_attempts(request_id);
CREATE INDEX IF NOT EXISTS idx_match_attempts_hauler_id ON match_attempts(hauler_id);
CREATE INDEX IF NOT EXISTS idx_match_attempts_status ON match_attempts(status);

-- PYCKER online status (for proximity matching)
CREATE INDEX IF NOT EXISTS idx_pycker_online_status_user_id ON pycker_online_status(user_id);
CREATE INDEX IF NOT EXISTS idx_pycker_online_status_status ON pycker_online_status(status);

-- Business accounts
CREATE INDEX IF NOT EXISTS idx_business_accounts_user_id ON business_accounts(user_id);

-- Job crew assignments
CREATE INDEX IF NOT EXISTS idx_job_crew_assignments_service_request_id ON job_crew_assignments(service_request_id);
CREATE INDEX IF NOT EXISTS idx_job_crew_assignments_hauler_id ON job_crew_assignments(hauler_id);

-- Referrals
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON referrals(referral_code);

-- Loyalty
CREATE INDEX IF NOT EXISTS idx_loyalty_accounts_user_id ON loyalty_accounts(user_id);

-- PYCKER vehicles
CREATE INDEX IF NOT EXISTS idx_pycker_vehicles_hauler_profile_id ON pycker_vehicles(hauler_profile_id);

-- Hauler penalties
CREATE INDEX IF NOT EXISTS idx_hauler_penalties_hauler_id ON hauler_penalties(hauler_id);

-- AI estimates
CREATE INDEX IF NOT EXISTS idx_ai_estimates_request_id ON ai_estimates(request_id);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_service_requests_status_created ON service_requests(status, created_at);
CREATE INDEX IF NOT EXISTS idx_service_requests_customer_status ON service_requests(customer_id, status);
