-- Partner Page Views Tracking Table
-- Stores real analytics data for partner pages to replace estimated metrics

CREATE TABLE IF NOT EXISTS partner_page_views (
  id SERIAL PRIMARY KEY,
  partner_slug TEXT NOT NULL,
  page_path TEXT NOT NULL,
  page_type TEXT NOT NULL, -- 'partner_profile', 'photo_quote', 'seo_page', 'confirm', 'booking'
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  user_agent TEXT,
  ip_hash TEXT, -- hashed IP for unique visitor counting without storing PII
  session_id TEXT, -- client-generated session ID
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_ppv_slug_date ON partner_page_views (partner_slug, created_at);
CREATE INDEX IF NOT EXISTS idx_ppv_page_type ON partner_page_views (page_type, created_at);
CREATE INDEX IF NOT EXISTS idx_ppv_session ON partner_page_views (session_id);
CREATE INDEX IF NOT EXISTS idx_ppv_utm_source ON partner_page_views (utm_source) WHERE utm_source IS NOT NULL;

-- Add UTM tracking columns to partner_photo_quotes table
ALTER TABLE partner_photo_quotes ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE partner_photo_quotes ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE partner_photo_quotes ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
ALTER TABLE partner_photo_quotes ADD COLUMN IF NOT EXISTS referrer TEXT;