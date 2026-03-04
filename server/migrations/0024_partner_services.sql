-- Partner Services Database Migration
-- Creates tables for membership, call tracking, competitors, financing, campaigns, winback, and inventory

-- 1. MEMBERSHIP PROGRAM TABLES
CREATE TABLE IF NOT EXISTS membership_plans (
    id SERIAL PRIMARY KEY,
    partner_slug TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    monthly_price NUMERIC NOT NULL DEFAULT 0,
    benefits JSONB DEFAULT '[]',
    tune_ups_per_year INTEGER DEFAULT 0,
    discount_percent NUMERIC DEFAULT 0,
    priority_scheduling BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS membership_subscribers (
    id SERIAL PRIMARY KEY,
    plan_id INTEGER REFERENCES membership_plans(id) ON DELETE CASCADE,
    customer_id TEXT NOT NULL,
    partner_slug TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'paused')),
    stripe_subscription_id TEXT,
    started_at TIMESTAMP DEFAULT NOW(),
    next_tune_up_date TIMESTAMP,
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS membership_tune_ups (
    id SERIAL PRIMARY KEY,
    subscriber_id INTEGER REFERENCES membership_subscribers(id) ON DELETE CASCADE,
    scheduled_date TIMESTAMP,
    completed_date TIMESTAMP,
    pro_id TEXT,
    job_id TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. CALL TRACKING TABLES
CREATE TABLE IF NOT EXISTS call_tracking_numbers (
    id SERIAL PRIMARY KEY,
    partner_slug TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    source TEXT DEFAULT 'direct' CHECK (source IN ('google_seo', 'facebook', 'instagram', 'direct', 'referral', 'hoa')),
    forwarding_number TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS call_logs (
    id SERIAL PRIMARY KEY,
    tracking_number_id INTEGER REFERENCES call_tracking_numbers(id) ON DELETE CASCADE,
    caller_phone TEXT,
    duration_seconds INTEGER DEFAULT 0,
    recording_url TEXT,
    source TEXT,
    converted_to_lead BOOLEAN DEFAULT false,
    lead_id INTEGER,
    timestamp TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. COMPETITOR MONITORING TABLES
CREATE TABLE IF NOT EXISTS competitor_profiles (
    id SERIAL PRIMARY KEY,
    partner_slug TEXT NOT NULL,
    competitor_name TEXT NOT NULL,
    website TEXT,
    google_rating NUMERIC,
    review_count INTEGER DEFAULT 0,
    services TEXT[],
    price_range TEXT,
    last_checked TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS competitor_snapshots (
    id SERIAL PRIMARY KEY,
    competitor_id INTEGER REFERENCES competitor_profiles(id) ON DELETE CASCADE,
    snapshot_date TIMESTAMP DEFAULT NOW(),
    google_rating NUMERIC,
    review_count INTEGER DEFAULT 0,
    ad_detected BOOLEAN DEFAULT false,
    ranking_position INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. FINANCING INTEGRATION TABLES
CREATE TABLE IF NOT EXISTS financing_applications (
    id SERIAL PRIMARY KEY,
    partner_slug TEXT NOT NULL,
    customer_id TEXT NOT NULL,
    job_id TEXT,
    amount NUMERIC NOT NULL,
    provider TEXT CHECK (provider IN ('greenskywisetack', 'synchrony')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'funded')),
    application_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS financing_providers (
    id SERIAL PRIMARY KEY,
    partner_slug TEXT NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('greenskywisetack', 'synchrony')),
    api_key_encrypted TEXT,
    enabled BOOLEAN DEFAULT false,
    min_amount NUMERIC DEFAULT 0,
    max_amount NUMERIC DEFAULT 50000,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. SEASONAL CAMPAIGN TABLES
CREATE TABLE IF NOT EXISTS seasonal_campaigns (
    id SERIAL PRIMARY KEY,
    partner_slug TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'custom' CHECK (type IN ('pre_summer', 'pre_winter', 'spring_tuneup', 'fall_tuneup', 'custom')),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'completed')),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    target_audience JSONB DEFAULT '{}',
    email_template TEXT,
    sms_template TEXT,
    offer_details JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_sends (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES seasonal_campaigns(id) ON DELETE CASCADE,
    customer_id TEXT NOT NULL,
    channel TEXT CHECK (channel IN ('email', 'sms')),
    sent_at TIMESTAMP DEFAULT NOW(),
    opened BOOLEAN DEFAULT false,
    clicked BOOLEAN DEFAULT false,
    converted BOOLEAN DEFAULT false,
    job_id TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. CUSTOMER WIN-BACK TABLES
CREATE TABLE IF NOT EXISTS winback_sequences (
    id SERIAL PRIMARY KEY,
    partner_slug TEXT NOT NULL,
    name TEXT NOT NULL,
    days_inactive_trigger INTEGER DEFAULT 180 CHECK (days_inactive_trigger IN (180, 270, 365)),
    email_template TEXT,
    sms_template TEXT,
    offer JSONB DEFAULT '{}',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS winback_sends (
    id SERIAL PRIMARY KEY,
    sequence_id INTEGER REFERENCES winback_sequences(id) ON DELETE CASCADE,
    customer_id TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT NOW(),
    channel TEXT CHECK (channel IN ('email', 'sms')),
    opened BOOLEAN DEFAULT false,
    clicked BOOLEAN DEFAULT false,
    converted BOOLEAN DEFAULT false,
    job_id TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 7. INVENTORY/PARTS PROCUREMENT TABLES (enhance existing)
CREATE TABLE IF NOT EXISTS partner_inventory (
    id SERIAL PRIMARY KEY,
    partner_slug TEXT NOT NULL,
    part_name TEXT NOT NULL,
    part_number TEXT,
    supplier TEXT,
    quantity_on_hand INTEGER DEFAULT 0,
    reorder_threshold INTEGER DEFAULT 5,
    unit_cost NUMERIC DEFAULT 0,
    last_ordered TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS partner_purchase_orders (
    id SERIAL PRIMARY KEY,
    partner_slug TEXT NOT NULL,
    supplier TEXT NOT NULL,
    items JSONB DEFAULT '[]',
    total_cost NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'ordered', 'received')),
    ordered_at TIMESTAMP,
    received_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_membership_plans_partner ON membership_plans(partner_slug);
CREATE INDEX IF NOT EXISTS idx_membership_subscribers_partner ON membership_subscribers(partner_slug);
CREATE INDEX IF NOT EXISTS idx_membership_subscribers_status ON membership_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_call_tracking_partner ON call_tracking_numbers(partner_slug);
CREATE INDEX IF NOT EXISTS idx_call_logs_timestamp ON call_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_competitor_profiles_partner ON competitor_profiles(partner_slug);
CREATE INDEX IF NOT EXISTS idx_competitor_snapshots_date ON competitor_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_financing_applications_partner ON financing_applications(partner_slug);
CREATE INDEX IF NOT EXISTS idx_financing_applications_status ON financing_applications(status);
CREATE INDEX IF NOT EXISTS idx_seasonal_campaigns_partner ON seasonal_campaigns(partner_slug);
CREATE INDEX IF NOT EXISTS idx_seasonal_campaigns_status ON seasonal_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_sends_campaign ON campaign_sends(campaign_id);
CREATE INDEX IF NOT EXISTS idx_winback_sequences_partner ON winback_sequences(partner_slug);
CREATE INDEX IF NOT EXISTS idx_winback_sends_sequence ON winback_sends(sequence_id);
CREATE INDEX IF NOT EXISTS idx_partner_inventory_partner ON partner_inventory(partner_slug);
CREATE INDEX IF NOT EXISTS idx_partner_purchase_orders_partner ON partner_purchase_orders(partner_slug);

-- Enable Row Level Security (RLS)
ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_tune_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_tracking_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE financing_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE financing_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasonal_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE winback_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE winback_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_purchase_orders ENABLE ROW LEVEL SECURITY;

-- Create service_role_all policies for all tables
CREATE POLICY service_role_all ON membership_plans FOR ALL USING (true);
CREATE POLICY service_role_all ON membership_subscribers FOR ALL USING (true);
CREATE POLICY service_role_all ON membership_tune_ups FOR ALL USING (true);
CREATE POLICY service_role_all ON call_tracking_numbers FOR ALL USING (true);
CREATE POLICY service_role_all ON call_logs FOR ALL USING (true);
CREATE POLICY service_role_all ON competitor_profiles FOR ALL USING (true);
CREATE POLICY service_role_all ON competitor_snapshots FOR ALL USING (true);
CREATE POLICY service_role_all ON financing_applications FOR ALL USING (true);
CREATE POLICY service_role_all ON financing_providers FOR ALL USING (true);
CREATE POLICY service_role_all ON seasonal_campaigns FOR ALL USING (true);
CREATE POLICY service_role_all ON campaign_sends FOR ALL USING (true);
CREATE POLICY service_role_all ON winback_sequences FOR ALL USING (true);
CREATE POLICY service_role_all ON winback_sends FOR ALL USING (true);
CREATE POLICY service_role_all ON partner_inventory FOR ALL USING (true);
CREATE POLICY service_role_all ON partner_purchase_orders FOR ALL USING (true);

-- Add trigger for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_membership_plans_updated_at BEFORE UPDATE ON membership_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_membership_subscribers_updated_at BEFORE UPDATE ON membership_subscribers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_membership_tune_ups_updated_at BEFORE UPDATE ON membership_tune_ups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_call_tracking_numbers_updated_at BEFORE UPDATE ON call_tracking_numbers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_competitor_profiles_updated_at BEFORE UPDATE ON competitor_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financing_applications_updated_at BEFORE UPDATE ON financing_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financing_providers_updated_at BEFORE UPDATE ON financing_providers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_seasonal_campaigns_updated_at BEFORE UPDATE ON seasonal_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_winback_sequences_updated_at BEFORE UPDATE ON winback_sequences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_partner_inventory_updated_at BEFORE UPDATE ON partner_inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_partner_purchase_orders_updated_at BEFORE UPDATE ON partner_purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing
INSERT INTO membership_plans (partner_slug, plan_name, monthly_price, benefits, tune_ups_per_year, discount_percent, priority_scheduling) VALUES
('sample-partner', 'Basic Maintenance', 29.99, '["Monthly air filter reminder", "Seasonal tune-up discount"]', 1, 10, false),
('sample-partner', 'Premium Care', 49.99, '["Priority scheduling", "Monthly air filter reminder", "Bi-annual tune-ups", "15% discount on repairs"]', 2, 15, true),
('sample-partner', 'Elite Protection', 79.99, '["Priority scheduling", "Monthly air filter reminder", "Quarterly tune-ups", "20% discount on repairs", "Emergency service included"]', 4, 20, true);

INSERT INTO call_tracking_numbers (partner_slug, phone_number, source, forwarding_number) VALUES
('sample-partner', '+1-555-GOOGLE', 'google_seo', '+1-555-MAIN'),
('sample-partner', '+1-555-FACEBOOK', 'facebook', '+1-555-MAIN'),
('sample-partner', '+1-555-DIRECT', 'direct', '+1-555-MAIN');

INSERT INTO competitor_profiles (partner_slug, competitor_name, website, google_rating, review_count, services, price_range) VALUES
('sample-partner', 'HVAC Competitor A', 'https://competitor-a.com', 4.2, 156, ARRAY['HVAC Repair', 'Installation', 'Maintenance'], '$100-300'),
('sample-partner', 'HVAC Competitor B', 'https://competitor-b.com', 3.8, 89, ARRAY['HVAC Repair', 'Duct Cleaning'], '$80-250');

INSERT INTO winback_sequences (partner_slug, name, days_inactive_trigger, email_template, sms_template, offer) VALUES
('sample-partner', '6-Month Winback', 180, 'We miss you! Come back for 25% off your next service.', 'Hey! 25% off your next HVAC service - book now!', '{"discount": 25, "type": "percentage"}'),
('sample-partner', '9-Month Winback', 270, 'It''s been a while! Special offer just for you.', 'Special offer: $50 off your next service!', '{"discount": 50, "type": "fixed"}');