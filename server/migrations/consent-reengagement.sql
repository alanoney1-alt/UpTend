-- Consent Framework + Re-engagement Sequences + Passive Data Collection
-- Run against Supabase

-- ============================================
-- Part A: Consent Framework (TCPA/CCPA/GDPR)
-- ============================================

CREATE TABLE IF NOT EXISTS user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('customer', 'hauler', 'business')),
  consent_type TEXT NOT NULL CHECK (consent_type IN (
    'transactional_sms', 'marketing_sms', 'marketing_email',
    'push_notifications', 'smart_home_data', 'calendar_access', 'location_tracking'
  )),
  granted BOOLEAN NOT NULL DEFAULT false,
  granted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  consent_method TEXT NOT NULL CHECK (consent_method IN ('booking_flow', 'conversational', 'settings', 'written')),
  ip_address TEXT,
  consent_text TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, consent_type)
);

CREATE TABLE IF NOT EXISTS consent_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  consent_id UUID REFERENCES user_consents(id),
  action TEXT NOT NULL CHECK (action IN ('granted', 'revoked', 'updated')),
  previous_state JSONB,
  new_state JSONB,
  triggered_by TEXT NOT NULL CHECK (triggered_by IN ('user', 'system', 'george')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS data_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed')),
  data_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  confirmation_sent BOOLEAN NOT NULL DEFAULT false
);

-- Indexes for consent tables
CREATE INDEX IF NOT EXISTS idx_user_consents_user ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_audit_user ON consent_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_data_deletion_user ON data_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_deletion_status ON data_deletion_requests(status);

-- ============================================
-- Part B: Re-engagement Sequences
-- ============================================

CREATE TABLE IF NOT EXISTS reengagement_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  sequence_day INTEGER NOT NULL CHECK (sequence_day IN (7, 21, 45, 90, 180)),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'responded', 'opted_out')),
  message_type TEXT NOT NULL CHECK (message_type IN (
    'weather_tip', 'seasonal_cta', 'social_proof', 'credit_winback', 'final_attempt'
  )),
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email', 'push')),
  message_content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer_activity_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL UNIQUE,
  last_booking_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  last_george_chat TIMESTAMPTZ,
  total_bookings INTEGER NOT NULL DEFAULT 0,
  lifetime_spend NUMERIC(10,2) NOT NULL DEFAULT 0,
  dormant_since TIMESTAMPTZ,
  reengagement_stage INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reengagement_customer ON reengagement_sequences(customer_id);
CREATE INDEX IF NOT EXISTS idx_reengagement_status ON reengagement_sequences(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_activity_dormant ON customer_activity_tracking(dormant_since) WHERE dormant_since IS NOT NULL;

-- ============================================
-- Part C: Passive Data Collection Pipeline
-- ============================================

CREATE TABLE IF NOT EXISTS passive_data_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  data_type TEXT NOT NULL CHECK (data_type IN ('appliance', 'room', 'preference', 'hoa_rule', 'condition')),
  source TEXT NOT NULL CHECK (source IN ('george_chat', 'pro_report', 'scan', 'booking_notes')),
  key TEXT NOT NULL,
  value TEXT,
  confidence TEXT NOT NULL DEFAULT 'medium' CHECK (confidence IN ('high', 'medium', 'low')),
  collected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_by TEXT CHECK (verified_by IN ('customer', 'pro', 'ai'))
);

CREATE TABLE IF NOT EXISTS pro_site_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id UUID NOT NULL,
  job_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN (
    'appliance_spotted', 'condition_noted', 'hoa_observation', 'safety_concern'
  )),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  photos JSONB NOT NULL DEFAULT '[]'::jsonb,
  george_processed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_passive_data_customer ON passive_data_points(customer_id);
CREATE INDEX IF NOT EXISTS idx_passive_data_type ON passive_data_points(customer_id, data_type);
CREATE INDEX IF NOT EXISTS idx_pro_reports_customer ON pro_site_reports(customer_id);
CREATE INDEX IF NOT EXISTS idx_pro_reports_unprocessed ON pro_site_reports(george_processed) WHERE george_processed = false;
