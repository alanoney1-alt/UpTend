-- ==========================================
-- UpTend Database Schema
-- Production-Ready Tables for Critical Features
-- Date: February 8, 2026
-- ==========================================

-- ==========================================
-- 1. PRICE VERIFICATIONS TABLE
-- On-site verification with 10% auto-approval threshold
-- ==========================================
CREATE TABLE IF NOT EXISTS price_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id VARCHAR(255) UNIQUE NOT NULL,
  job_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  pro_id UUID NOT NULL REFERENCES pros(id),

  -- Original quote details
  original_quote_id UUID,
  original_price NUMERIC(10,2) NOT NULL,
  original_inputs JSONB NOT NULL,

  -- Verified details
  verified_price NUMERIC(10,2) NOT NULL,
  verified_inputs JSONB NOT NULL,
  verification_photos JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Price difference
  price_difference NUMERIC(10,2) NOT NULL, -- Can be negative (price reduction)
  percentage_difference NUMERIC(5,4) NOT NULL, -- Absolute value as decimal (0.0702 = 7.02%)

  -- Approval status
  auto_approved BOOLEAN NOT NULL DEFAULT false,
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  customer_approved BOOLEAN DEFAULT NULL,
  customer_declined BOOLEAN DEFAULT NULL,
  approval_expired BOOLEAN DEFAULT NULL,

  -- Timestamps
  verified_at TIMESTAMP NOT NULL DEFAULT NOW(),
  customer_responded_at TIMESTAMP,
  expires_at TIMESTAMP NOT NULL, -- 30 minutes from verified_at

  -- Notes
  pro_notes TEXT,
  system_notes TEXT NOT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for price_verifications
CREATE INDEX idx_price_verifications_job_id ON price_verifications(job_id);
CREATE INDEX idx_price_verifications_pro_id ON price_verifications(pro_id);
CREATE INDEX idx_price_verifications_verification_id ON price_verifications(verification_id);
CREATE INDEX idx_price_verifications_requires_approval ON price_verifications(requires_approval) WHERE requires_approval = true;
CREATE INDEX idx_price_verifications_expires_at ON price_verifications(expires_at) WHERE requires_approval = true AND customer_approved IS NULL;

-- ==========================================
-- 2. DWELLSCAN CREDITS TABLE
-- $49 credit per DwellScan, expires after 90 days
-- ==========================================
CREATE TABLE IF NOT EXISTS dwellscan_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- Credit details
  amount NUMERIC(10,2) NOT NULL DEFAULT 49.00,
  used BOOLEAN NOT NULL DEFAULT false,

  -- Issuance
  issued_from_dwellscan_id UUID NOT NULL REFERENCES service_requests(id),
  issued_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL, -- NOW() + 90 days

  -- Usage
  used_at TIMESTAMP,
  used_on_booking_id UUID REFERENCES service_requests(id),

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for dwellscan_credits
CREATE INDEX idx_dwellscan_credits_customer_id ON dwellscan_credits(customer_id);
CREATE INDEX idx_dwellscan_credits_used ON dwellscan_credits(used);
CREATE INDEX idx_dwellscan_credits_expires_at ON dwellscan_credits(expires_at) WHERE used = false;
CREATE UNIQUE INDEX idx_dwellscan_credits_one_per_dwellscan ON dwellscan_credits(issued_from_dwellscan_id);

-- ==========================================
-- 3. AI ESTIMATES TABLE
-- Store AI-generated quotes (photo/video analysis)
-- ==========================================
CREATE TABLE IF NOT EXISTS ai_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES service_requests(id), -- NULL until user books

  -- Analysis inputs
  photo_urls TEXT[] NOT NULL DEFAULT '{}',
  video_frames TEXT[],
  service_type VARCHAR(100) NOT NULL,

  -- AI analysis results
  identified_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  estimated_volume_cu_ft NUMERIC(10,2),
  recommended_load_size VARCHAR(50),
  recommended_truck_size VARCHAR(50),
  confidence NUMERIC(3,2) NOT NULL, -- 0.00 to 1.00
  reasoning TEXT,

  -- Price quote
  suggested_price NUMERIC(10,2) NOT NULL,
  suggested_price_min NUMERIC(10,2),
  suggested_price_max NUMERIC(10,2),

  -- Item breakdown
  item_breakdown JSONB DEFAULT '[]'::jsonb,

  -- Safety & environmental
  safety_alerts JSONB,
  disposal_categorization JSONB,
  carbon_estimate JSONB,

  -- Pressure washing specific
  total_sqft NUMERIC(10,2),
  surfaces JSONB,

  -- Metadata
  raw_response TEXT,
  quote_path VARCHAR(50) NOT NULL, -- 'ai_scan', 'manual_form', 'chat_sms_phone'

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL DEFAULT NOW() + INTERVAL '7 days'
);

-- Indexes for ai_estimates
CREATE INDEX idx_ai_estimates_request_id ON ai_estimates(request_id) WHERE request_id IS NOT NULL;
CREATE INDEX idx_ai_estimates_created_at ON ai_estimates(created_at);
CREATE INDEX idx_ai_estimates_expires_at ON ai_estimates(expires_at);

-- ==========================================
-- 4. DISPOSAL VERIFICATIONS TABLE
-- Green Guarantee: Verify Pros dispose items legally
-- ==========================================
CREATE TABLE IF NOT EXISTS disposal_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  pro_id UUID NOT NULL REFERENCES pros(id),

  -- Receipt image
  receipt_image_url TEXT NOT NULL,

  -- Extracted data
  facility_name VARCHAR(255),
  receipt_date DATE,
  amount_paid NUMERIC(10,2),

  -- Verification
  is_verified BOOLEAN NOT NULL DEFAULT false,
  confidence NUMERIC(3,2),
  verified_at TIMESTAMP,
  rejection_reason TEXT,

  -- Admin review
  requires_manual_review BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES admins(id),
  reviewed_at TIMESTAMP,
  review_notes TEXT,

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for disposal_verifications
CREATE INDEX idx_disposal_verifications_job_id ON disposal_verifications(job_id);
CREATE INDEX idx_disposal_verifications_pro_id ON disposal_verifications(pro_id);
CREATE INDEX idx_disposal_verifications_verified ON disposal_verifications(is_verified);
CREATE INDEX idx_disposal_verifications_manual_review ON disposal_verifications(requires_manual_review) WHERE requires_manual_review = true;

-- ==========================================
-- 5. MULTI_PRO_COORDINATION TABLE
-- Track multi-Pro jobs with Lead Pro
-- ==========================================
CREATE TABLE IF NOT EXISTS multi_pro_coordination (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL UNIQUE REFERENCES service_requests(id) ON DELETE CASCADE,

  -- Team composition
  lead_pro_id UUID NOT NULL REFERENCES pros(id),
  crew_member_ids UUID[] NOT NULL DEFAULT '{}',
  total_pros INTEGER NOT NULL,

  -- Lead Pro bonus
  lead_bonus_amount NUMERIC(10,2) NOT NULL DEFAULT 15.00,

  -- Phase tracking
  phases JSONB NOT NULL DEFAULT '[]'::jsonb,
  current_phase VARCHAR(100),

  -- Status
  team_assembled BOOLEAN NOT NULL DEFAULT false,
  team_assembled_at TIMESTAMP,
  job_started_at TIMESTAMP,
  job_completed_at TIMESTAMP,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for multi_pro_coordination
CREATE INDEX idx_multi_pro_coordination_job_id ON multi_pro_coordination(job_id);
CREATE INDEX idx_multi_pro_coordination_lead_pro_id ON multi_pro_coordination(lead_pro_id);
CREATE INDEX idx_multi_pro_coordination_team_assembled ON multi_pro_coordination(team_assembled) WHERE team_assembled = false;

-- ==========================================
-- 6. CUSTOMER_APPROVAL_REQUESTS TABLE
-- Track customer approval requests for price changes
-- ==========================================
CREATE TABLE IF NOT EXISTS customer_approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id VARCHAR(255) UNIQUE NOT NULL REFERENCES price_verifications(verification_id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id),

  -- Price details
  original_price NUMERIC(10,2) NOT NULL,
  verified_price NUMERIC(10,2) NOT NULL,
  price_difference NUMERIC(10,2) NOT NULL,
  percentage_difference NUMERIC(5,4) NOT NULL,
  reason TEXT NOT NULL,

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'declined', 'expired'

  -- Notification
  customer_phone VARCHAR(20) NOT NULL,
  sms_sent_at TIMESTAMP,
  sms_delivered BOOLEAN DEFAULT false,

  -- Response
  responded_at TIMESTAMP,
  response_method VARCHAR(50), -- 'sms', 'app', 'phone'

  -- Deadline
  approval_deadline TIMESTAMP NOT NULL, -- 30 minutes from creation

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for customer_approval_requests
CREATE INDEX idx_customer_approval_requests_verification_id ON customer_approval_requests(verification_id);
CREATE INDEX idx_customer_approval_requests_job_id ON customer_approval_requests(job_id);
CREATE INDEX idx_customer_approval_requests_customer_id ON customer_approval_requests(customer_id);
CREATE INDEX idx_customer_approval_requests_status ON customer_approval_requests(status) WHERE status = 'pending';
CREATE INDEX idx_customer_approval_requests_deadline ON customer_approval_requests(approval_deadline) WHERE status = 'pending';

-- ==========================================
-- TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- ==========================================

-- price_verifications updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_price_verifications_updated_at
  BEFORE UPDATE ON price_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_multi_pro_coordination_updated_at
  BEFORE UPDATE ON multi_pro_coordination
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_approval_requests_updated_at
  BEFORE UPDATE ON customer_approval_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- CLEANUP JOBS (Run periodically via cron)
-- ==========================================

-- Clean up expired AI estimates (older than 7 days with no linked request)
-- DELETE FROM ai_estimates WHERE expires_at < NOW() AND request_id IS NULL;

-- Clean up expired approval requests
-- UPDATE customer_approval_requests SET status = 'expired' WHERE status = 'pending' AND approval_deadline < NOW();

-- Clean up expired DwellScan credits (optional: mark as expired rather than delete)
-- UPDATE dwellscan_credits SET used = true WHERE used = false AND expires_at < NOW();

-- ==========================================
-- SEED DATA FOR TESTING
-- ==========================================

-- Test customer (use in staging)
-- INSERT INTO customers (id, email, phone, name) VALUES
--   ('00000000-0000-0000-0000-000000000001', 'test.customer@uptend.com', '+15550000001', 'Test Customer')
-- ON CONFLICT (email) DO NOTHING;

-- Test Pro (use in staging)
-- INSERT INTO pros (id, email, phone, name) VALUES
--   ('00000000-0000-0000-0000-000000000002', 'test.pro@uptend.com', '+15550000002', 'Test Pro')
-- ON CONFLICT (email) DO NOTHING;

-- ==========================================
-- VIEWS FOR REPORTING
-- ==========================================

-- View: Active verification requests pending approval
CREATE OR REPLACE VIEW pending_verification_approvals AS
SELECT
  pv.verification_id,
  pv.job_id,
  pv.pro_id,
  pv.original_price,
  pv.verified_price,
  pv.price_difference,
  pv.percentage_difference,
  pv.expires_at,
  car.customer_id,
  car.customer_phone,
  car.status as approval_status,
  EXTRACT(EPOCH FROM (pv.expires_at - NOW())) / 60 as minutes_remaining
FROM price_verifications pv
JOIN customer_approval_requests car ON pv.verification_id = car.verification_id
WHERE pv.requires_approval = true
  AND car.status = 'pending'
  AND pv.expires_at > NOW()
ORDER BY pv.expires_at ASC;

-- View: DwellScan credits available by customer
CREATE OR REPLACE VIEW customer_available_credits AS
SELECT
  customer_id,
  COUNT(*) as total_credits,
  SUM(amount) as total_credit_amount,
  MIN(expires_at) as earliest_expiry,
  MAX(expires_at) as latest_expiry
FROM dwellscan_credits
WHERE used = false AND expires_at > NOW()
GROUP BY customer_id;

-- View: Multi-Pro job status
CREATE OR REPLACE VIEW multi_pro_job_status AS
SELECT
  mpc.job_id,
  mpc.lead_pro_id,
  mpc.total_pros,
  mpc.team_assembled,
  mpc.current_phase,
  sr.status as job_status,
  sr.scheduled_date,
  ARRAY_LENGTH(mpc.crew_member_ids, 1) as crew_count
FROM multi_pro_coordination mpc
JOIN service_requests sr ON mpc.job_id = sr.id
WHERE sr.status IN ('scheduled', 'in_progress');

-- ==========================================
-- SCHEMA VERSION
-- ==========================================
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  applied_at TIMESTAMP NOT NULL DEFAULT NOW(),
  description TEXT
);

INSERT INTO schema_version (version, description) VALUES
  (1, 'Initial schema: price_verifications, dwellscan_credits, ai_estimates, disposal_verifications, multi_pro_coordination, customer_approval_requests')
ON CONFLICT (version) DO NOTHING;
