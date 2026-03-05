-- Partner Features Migration
-- Creates partner_seo_pages and partner_photo_quotes tables

-- ─── Partner SEO Pages ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS partner_seo_pages (
  id SERIAL PRIMARY KEY,
  partner_slug TEXT NOT NULL,
  neighborhood_slug TEXT NOT NULL,
  neighborhood_name TEXT NOT NULL,
  title TEXT NOT NULL,
  meta_description TEXT,
  hero_headline TEXT,
  body_content TEXT,
  faqs JSONB DEFAULT '[]',
  services_highlighted TEXT[] DEFAULT '{}',
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(partner_slug, neighborhood_slug)
);

CREATE INDEX IF NOT EXISTS idx_partner_seo_pages_slug ON partner_seo_pages(partner_slug, published);
CREATE INDEX IF NOT EXISTS idx_partner_seo_pages_neighborhood ON partner_seo_pages(partner_slug, neighborhood_slug);

-- ─── Partner Photo Quotes (public scoping tool) ───────────────────────────────
CREATE TABLE IF NOT EXISTS partner_photo_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_slug TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  photo_urls TEXT[] DEFAULT '{}',
  ai_analysis JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'analyzed', 'contacted', 'closed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_photo_quotes_slug ON partner_photo_quotes(partner_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partner_photo_quotes_status ON partner_photo_quotes(partner_slug, status);

-- Enable Row Level Security
ALTER TABLE partner_seo_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_photo_quotes ENABLE ROW LEVEL SECURITY;

-- Service role policies (allow all for service role / backend)
CREATE POLICY IF NOT EXISTS "service_role_all" ON partner_seo_pages FOR ALL TO service_role USING (true);
CREATE POLICY IF NOT EXISTS "service_role_all" ON partner_photo_quotes FOR ALL TO service_role USING (true);

-- ─── Partner ROI Metrics ──────────────────────────────────────────────────────
-- Stores computed monthly funnel + ROI data
CREATE TABLE IF NOT EXISTS partner_roi_metrics (
  id SERIAL PRIMARY KEY,
  partner_slug TEXT NOT NULL,
  month TEXT NOT NULL, -- e.g. '2026-03'
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  leads INTEGER DEFAULT 0,
  closed_jobs INTEGER DEFAULT 0,
  revenue NUMERIC(10,2) DEFAULT 0,
  uptend_cost NUMERIC(10,2) DEFAULT 499,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(partner_slug, month)
);

ALTER TABLE partner_roi_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "service_role_all" ON partner_roi_metrics FOR ALL TO service_role USING (true);
