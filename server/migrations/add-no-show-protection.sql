-- No-Show Protection: Add columns to hauler_profiles
ALTER TABLE hauler_profiles ADD COLUMN IF NOT EXISTS no_show_count INTEGER DEFAULT 0;
ALTER TABLE hauler_profiles ADD COLUMN IF NOT EXISTS last_no_show_at TEXT;

-- No-Show Protection: Add columns to service_requests
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS is_urgent_reassign BOOLEAN DEFAULT FALSE;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS original_pro_id TEXT;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS no_show_at TEXT;
