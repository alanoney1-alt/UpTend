-- Dispatch & Tracking System Migration
-- Creates all tables for complete dispatch, live tracking, and analytics system

-- Partner subscription tiers table
CREATE TABLE IF NOT EXISTS partner_subscription_tiers (
  id SERIAL PRIMARY KEY,
  partner_slug TEXT NOT NULL UNIQUE,
  tier TEXT NOT NULL DEFAULT 'starter' CHECK (tier IN ('starter', 'growth', 'scale')),
  monthly_price INTEGER NOT NULL DEFAULT 499,
  setup_fee INTEGER NOT NULL DEFAULT 1500,
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dispatch jobs - main job lifecycle table
CREATE TABLE IF NOT EXISTS dispatch_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_slug TEXT NOT NULL,
  customer_id VARCHAR REFERENCES users(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  customer_address TEXT NOT NULL,
  customer_lat NUMERIC(10,7),
  customer_lng NUMERIC(10,7),
  service_type TEXT NOT NULL,
  description TEXT,
  assigned_pro_id VARCHAR REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','dispatched','en_route','arrived','in_progress','completed','cancelled')),
  scheduled_date DATE NOT NULL,
  scheduled_time_start TIME,
  scheduled_time_end TIME,
  actual_arrival TIMESTAMPTZ,
  actual_completion TIMESTAMPTZ,
  notes TEXT,
  invoice_amount NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pro GPS location tracking
CREATE TABLE IF NOT EXISTS pro_locations (
  id SERIAL PRIMARY KEY,
  pro_id VARCHAR NOT NULL REFERENCES users(id),
  partner_slug TEXT NOT NULL,
  lat NUMERIC(10,7) NOT NULL,
  lng NUMERIC(10,7) NOT NULL,
  heading NUMERIC(5,2), -- Compass direction 0-359.99
  speed NUMERIC(5,2), -- Speed in mph
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pro_locations_pro ON pro_locations(pro_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_pro_locations_partner ON pro_locations(partner_slug, recorded_at DESC);

-- Job status timeline
CREATE TABLE IF NOT EXISTS job_status_updates (
  id SERIAL PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES dispatch_jobs(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  updated_by VARCHAR REFERENCES users(id),
  note TEXT,
  lat NUMERIC(10,7), -- Pro's location when status was updated
  lng NUMERIC(10,7),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_job_status_updates_job ON job_status_updates(job_id, created_at);

-- Pro checklists (scale tier only)
CREATE TABLE IF NOT EXISTS pro_checklists (
  id SERIAL PRIMARY KEY,
  partner_slug TEXT NOT NULL,
  service_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pro_checklists_partner ON pro_checklists(partner_slug, service_type);

-- Individual checklist items completion
CREATE TABLE IF NOT EXISTS pro_checklist_items (
  id SERIAL PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES dispatch_jobs(id) ON DELETE CASCADE,
  checklist_id INTEGER NOT NULL REFERENCES pro_checklists(id) ON DELETE CASCADE,
  item_index INTEGER NOT NULL, -- Index in the checklist items array
  item_text TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  notes TEXT,
  completed_at TIMESTAMPTZ,
  completed_by VARCHAR REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_pro_checklist_items_job ON pro_checklist_items(job_id);

-- Job photos (scale tier only)
CREATE TABLE IF NOT EXISTS job_photos (
  id SERIAL PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES dispatch_jobs(id) ON DELETE CASCADE,
  uploaded_by VARCHAR NOT NULL REFERENCES users(id),
  photo_url TEXT NOT NULL,
  photo_type TEXT DEFAULT 'general' CHECK (photo_type IN ('before', 'during', 'after', 'general')),
  caption TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_job_photos_job ON job_photos(job_id, uploaded_at);

-- Customer reviews (scale tier only)
CREATE TABLE IF NOT EXISTS customer_reviews (
  id SERIAL PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES dispatch_jobs(id) ON DELETE CASCADE,
  pro_id VARCHAR NOT NULL REFERENCES users(id),
  customer_id VARCHAR REFERENCES users(id),
  partner_slug TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  review_source TEXT DEFAULT 'app',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_pro ON customer_reviews(pro_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_partner ON customer_reviews(partner_slug, created_at DESC);

-- Partner analytics cache (scale tier only)
CREATE TABLE IF NOT EXISTS partner_analytics_cache (
  id SERIAL PRIMARY KEY,
  partner_slug TEXT NOT NULL,
  period TEXT NOT NULL, -- '7d', '30d', '90d'
  data JSONB NOT NULL,
  computed_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_partner_analytics_cache_unique ON partner_analytics_cache(partner_slug, period);

-- Auto dispatch rules (scale tier only)
CREATE TABLE IF NOT EXISTS auto_dispatch_rules (
  id SERIAL PRIMARY KEY,
  partner_slug TEXT NOT NULL,
  max_radius_miles NUMERIC(4,1) DEFAULT 25.0,
  skill_matching BOOLEAN DEFAULT true,
  availability_check BOOLEAN DEFAULT true,
  preferred_pros VARCHAR[] DEFAULT '{}', -- Array of pro user IDs
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_auto_dispatch_rules_partner ON auto_dispatch_rules(partner_slug);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_dispatch_jobs_partner ON dispatch_jobs(partner_slug, status, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_dispatch_jobs_pro ON dispatch_jobs(assigned_pro_id, status, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_dispatch_jobs_status ON dispatch_jobs(status, updated_at);

-- Enable Row Level Security on all new tables
ALTER TABLE partner_subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatch_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pro_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_status_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE pro_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE pro_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_analytics_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_dispatch_rules ENABLE ROW LEVEL SECURITY;

-- Service role policies (allow all for service role)
CREATE POLICY "service_role_all" ON partner_subscription_tiers FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON dispatch_jobs FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON pro_locations FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON job_status_updates FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON pro_checklists FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON pro_checklist_items FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON job_photos FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON customer_reviews FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON partner_analytics_cache FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON auto_dispatch_rules FOR ALL TO service_role USING (true);

-- Insert default tier data for existing partners
INSERT INTO partner_subscription_tiers (partner_slug, tier) 
SELECT DISTINCT partner_slug, 'starter'
FROM partner_jobs 
WHERE partner_slug IS NOT NULL
ON CONFLICT (partner_slug) DO NOTHING;

-- Create default checklists for common service types
INSERT INTO pro_checklists (partner_slug, service_type, name, description, items) VALUES
('default', 'hvac', 'HVAC Service Checklist', 'Standard HVAC service and maintenance checklist', '[
  {"text": "Check air filter condition", "required": true},
  {"text": "Inspect thermostat operation", "required": true},
  {"text": "Test system airflow", "required": true},
  {"text": "Check refrigerant levels", "required": false},
  {"text": "Inspect electrical connections", "required": true},
  {"text": "Clean condenser coils if needed", "required": false},
  {"text": "Test safety controls", "required": true},
  {"text": "Customer walkthrough and recommendations", "required": true}
]'::jsonb),
('default', 'plumbing', 'Plumbing Service Checklist', 'Standard plumbing service checklist', '[
  {"text": "Identify root cause of issue", "required": true},
  {"text": "Shut off water supply if needed", "required": true},
  {"text": "Test water pressure", "required": false},
  {"text": "Check for leaks", "required": true},
  {"text": "Clean work area", "required": true},
  {"text": "Test repair functionality", "required": true},
  {"text": "Provide maintenance recommendations", "required": false}
]'::jsonb),
('default', 'electrical', 'Electrical Service Checklist', 'Standard electrical service checklist', '[
  {"text": "Turn off power at breaker", "required": true},
  {"text": "Test circuit with multimeter", "required": true},
  {"text": "Check wire connections", "required": true},
  {"text": "Inspect electrical panel", "required": false},
  {"text": "Test GFCI outlets", "required": false},
  {"text": "Verify repair with power on", "required": true},
  {"text": "Customer safety briefing", "required": true}
]'::jsonb);

-- Create auto dispatch rules for default partners
INSERT INTO auto_dispatch_rules (partner_slug) VALUES ('default') ON CONFLICT DO NOTHING;