-- Snap & Book Pro Enhancements Migration
-- Adds snap quote reference, arrival verification, and scope tracking to service_requests

ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS snap_quote_id VARCHAR;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS pro_arrival_photo_url TEXT;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS scope_verified BOOLEAN DEFAULT FALSE;
