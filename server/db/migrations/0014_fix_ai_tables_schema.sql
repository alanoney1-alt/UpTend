-- Migration: Fix AI Tables Schema Mismatch
-- Date: 2026-02-09
-- Fixes schema mismatch between migration and code

-- Drop existing tables (they have no data yet)
DROP TABLE IF EXISTS neighborhood_intelligence_reports CASCADE;
DROP TABLE IF EXISTS voice_booking_sessions CASCADE;
DROP TABLE IF EXISTS ai_marketing_content CASCADE;
DROP TABLE IF EXISTS fraud_alerts CASCADE;
DROP TABLE IF EXISTS portfolio_health_reports CASCADE;
DROP TABLE IF EXISTS inventory_estimates CASCADE;
DROP TABLE IF EXISTS job_quality_assessments CASCADE;
DROP TABLE IF EXISTS pro_quality_scores CASCADE;
DROP TABLE IF EXISTS pro_route_optimizations CASCADE;
DROP TABLE IF EXISTS document_scans CASCADE;
DROP TABLE IF EXISTS move_in_plans CASCADE;
DROP TABLE IF EXISTS smart_schedule_suggestions CASCADE;
DROP TABLE IF EXISTS seasonal_advisories CASCADE;
DROP TABLE IF EXISTS photo_quote_requests CASCADE;
DROP TABLE IF EXISTS ai_conversation_messages CASCADE;
DROP TABLE IF EXISTS ai_conversations CASCADE;

-- Recreate with correct schema matching shared/schema.ts

-- AI Conversations & Messages
CREATE TABLE ai_conversations (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,
  session_id VARCHAR NOT NULL,
  conversation_type TEXT NOT NULL DEFAULT 'general',
  context_data TEXT,
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_message_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  rating INTEGER,
  feedback_text TEXT
);

CREATE TABLE ai_conversation_messages (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id VARCHAR NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  function_call TEXT,
  function_response TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Photo Quote Requests
CREATE TABLE photo_quote_requests (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,
  service_type TEXT NOT NULL,
  photo_urls TEXT NOT NULL,
  ai_analysis TEXT,
  detected_items TEXT,
  estimated_scope TEXT,
  estimated_price_min REAL,
  estimated_price_max REAL,
  confidence_score REAL,
  pro_quotes_sent INTEGER DEFAULT 0,
  status TEXT DEFAULT 'analyzing',
  converted_to_request_id VARCHAR,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  analyzed_at TEXT
);

-- Seasonal Advisories (FIXED SCHEMA)
CREATE TABLE seasonal_advisories (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id VARCHAR NOT NULL,
  user_id VARCHAR NOT NULL,
  trigger_type TEXT NOT NULL,
  trigger_data JSONB,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'medium',
  category TEXT,
  recommended_services JSONB,
  bundle_offer JSONB,
  estimated_savings REAL,
  property_health_score_at_time REAL,
  relevant_appliance_data JSONB,
  last_service_dates JSONB,
  delivery_channel TEXT DEFAULT 'push',
  delivered_at TEXT,
  opened_at TEXT,
  clicked_at TEXT,
  dismissed_at TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  resulted_in_booking BOOLEAN DEFAULT false,
  booking_service_request_ids TEXT[],
  booking_total_value REAL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT
);

-- Smart Schedule Suggestions
CREATE TABLE smart_schedule_suggestions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,
  service_type TEXT NOT NULL,
  property_id VARCHAR,
  suggested_date TEXT NOT NULL,
  suggested_time_slot TEXT NOT NULL,
  reasoning TEXT,
  confidence_score REAL,
  factors_considered JSONB,
  available_pros INTEGER,
  estimated_price REAL,
  weather_optimal BOOLEAN,
  accepted BOOLEAN DEFAULT false,
  converted_to_request_id VARCHAR,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL
);

-- Move-In Plans
CREATE TABLE move_in_plans (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,
  property_address TEXT NOT NULL,
  move_in_date TEXT NOT NULL,
  property_type TEXT,
  bedrooms INTEGER,
  square_footage INTEGER,
  has_appliances BOOLEAN DEFAULT false,
  has_yard BOOLEAN DEFAULT false,
  has_pool BOOLEAN DEFAULT false,
  budget_range TEXT,
  timeline_urgency TEXT DEFAULT 'normal',
  recommended_services JSONB,
  service_timeline JSONB,
  estimated_total_cost REAL,
  priority_order TEXT[],
  checklist JSONB,
  completed_services TEXT[],
  status TEXT DEFAULT 'draft',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Document Scans
CREATE TABLE document_scans (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,
  document_type TEXT NOT NULL,
  image_url TEXT NOT NULL,
  extracted_text TEXT,
  structured_data JSONB,
  confidence_score REAL,
  ocr_provider TEXT DEFAULT 'anthropic',
  linked_service_request_id VARCHAR,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at TEXT
);

-- Pro Route Optimizations
CREATE TABLE pro_route_optimizations (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  hauler_id VARCHAR NOT NULL,
  optimization_date TEXT NOT NULL,
  original_route JSONB NOT NULL,
  optimized_route JSONB NOT NULL,
  savings_miles REAL,
  savings_minutes INTEGER,
  savings_co2_lbs REAL,
  savings_fuel_cost REAL,
  algorithm_used TEXT DEFAULT 'tsp_nearest_neighbor',
  accepted BOOLEAN DEFAULT false,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Pro Quality Scores
CREATE TABLE pro_quality_scores (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  hauler_id VARCHAR NOT NULL,
  score_date TEXT NOT NULL,
  overall_score REAL NOT NULL,
  completion_rate REAL,
  on_time_rate REAL,
  customer_satisfaction REAL,
  disposal_compliance REAL,
  response_time_avg INTEGER,
  esg_score REAL,
  tier TEXT NOT NULL DEFAULT 'bronze',
  jobs_completed INTEGER DEFAULT 0,
  jobs_cancelled INTEGER DEFAULT 0,
  total_jobs INTEGER DEFAULT 0,
  training_recommendations TEXT[],
  badges_earned TEXT[],
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Job Quality Assessments
CREATE TABLE job_quality_assessments (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id VARCHAR NOT NULL,
  hauler_id VARCHAR NOT NULL,
  assessment_type TEXT NOT NULL,
  passed BOOLEAN NOT NULL,
  score REAL,
  issues_found TEXT[],
  recommendations TEXT[],
  photo_evidence_urls TEXT[],
  assessed_by TEXT DEFAULT 'ai',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Estimates
CREATE TABLE inventory_estimates (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,
  hauler_id VARCHAR,
  property_type TEXT NOT NULL,
  room_inventory JSONB NOT NULL,
  total_items INTEGER,
  estimated_cubic_feet INTEGER,
  estimated_weight_lbs INTEGER,
  truck_size_needed TEXT,
  labor_hours_estimated REAL,
  estimated_cost REAL,
  confidence_score REAL,
  converted_to_booking BOOLEAN DEFAULT false,
  booking_service_request_id VARCHAR,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Portfolio Health Reports
CREATE TABLE portfolio_health_reports (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  business_account_id VARCHAR NOT NULL,
  report_date TEXT NOT NULL,
  properties_analyzed INTEGER NOT NULL,
  total_service_requests INTEGER,
  total_spend REAL,
  cost_per_unit_avg REAL,
  risk_properties JSONB,
  cost_saving_opportunities JSONB,
  seasonal_recommendations JSONB,
  health_score REAL,
  trend_direction TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Fraud Alerts
CREATE TABLE fraud_alerts (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  service_request_id VARCHAR,
  hauler_id VARCHAR,
  user_id VARCHAR,
  description TEXT NOT NULL,
  evidence_data JSONB,
  detection_method TEXT,
  confidence_score REAL,
  status TEXT DEFAULT 'pending',
  reviewed_by VARCHAR,
  reviewed_at TEXT,
  resolution TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- AI Marketing Content
CREATE TABLE ai_marketing_content (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  business_account_id VARCHAR,
  content_type TEXT NOT NULL,
  target_audience TEXT,
  tone TEXT DEFAULT 'professional',
  key_points TEXT[],
  generated_content TEXT NOT NULL,
  seo_keywords TEXT[],
  character_count INTEGER,
  platform TEXT,
  status TEXT DEFAULT 'draft',
  approved_by VARCHAR,
  approved_at TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Voice Booking Sessions
CREATE TABLE voice_booking_sessions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,
  phone_number TEXT,
  transcript TEXT,
  extracted_intent TEXT,
  extracted_service_type TEXT,
  extracted_details JSONB,
  confidence_score REAL,
  converted_to_request_id VARCHAR,
  status TEXT DEFAULT 'processing',
  call_duration_seconds INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT
);

-- Neighborhood Intelligence Reports
CREATE TABLE neighborhood_intelligence_reports (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  zip_code TEXT NOT NULL,
  report_date TEXT NOT NULL,
  total_jobs INTEGER,
  avg_job_value REAL,
  popular_services TEXT[],
  seasonal_trends JSONB,
  competitor_pricing JSONB,
  market_saturation_score REAL,
  growth_opportunity_score REAL,
  recommendations JSONB,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_session ON ai_conversations(session_id);
CREATE INDEX idx_ai_conversation_messages_conv ON ai_conversation_messages(conversation_id);
CREATE INDEX idx_photo_quote_user ON photo_quote_requests(user_id);
CREATE INDEX idx_photo_quote_status ON photo_quote_requests(status);
CREATE INDEX idx_seasonal_advisories_user ON seasonal_advisories(user_id);
CREATE INDEX idx_seasonal_advisories_property ON seasonal_advisories(property_id);
CREATE INDEX idx_seasonal_advisories_expires ON seasonal_advisories(expires_at);
CREATE INDEX idx_smart_schedule_user ON smart_schedule_suggestions(user_id);
CREATE INDEX idx_smart_schedule_expires ON smart_schedule_suggestions(expires_at);
CREATE INDEX idx_move_in_plans_user ON move_in_plans(user_id);
CREATE INDEX idx_document_scans_user ON document_scans(user_id);
CREATE INDEX idx_route_optimizations_hauler ON pro_route_optimizations(hauler_id);
CREATE INDEX idx_route_optimizations_date ON pro_route_optimizations(optimization_date);
CREATE INDEX idx_quality_scores_hauler ON pro_quality_scores(hauler_id);
CREATE INDEX idx_quality_scores_date ON pro_quality_scores(score_date);
CREATE INDEX idx_quality_scores_tier ON pro_quality_scores(tier);
CREATE INDEX idx_job_assessments_service ON job_quality_assessments(service_request_id);
CREATE INDEX idx_job_assessments_hauler ON job_quality_assessments(hauler_id);
CREATE INDEX idx_inventory_estimates_user ON inventory_estimates(user_id);
CREATE INDEX idx_portfolio_reports_business ON portfolio_health_reports(business_account_id);
CREATE INDEX idx_portfolio_reports_date ON portfolio_health_reports(report_date);
CREATE INDEX idx_fraud_alerts_status ON fraud_alerts(status);
CREATE INDEX idx_fraud_alerts_severity ON fraud_alerts(severity);
CREATE INDEX idx_fraud_alerts_hauler ON fraud_alerts(hauler_id);
CREATE INDEX idx_marketing_content_business ON ai_marketing_content(business_account_id);
CREATE INDEX idx_marketing_content_status ON ai_marketing_content(status);
CREATE INDEX idx_voice_booking_user ON voice_booking_sessions(user_id);
CREATE INDEX idx_voice_booking_status ON voice_booking_sessions(status);
CREATE INDEX idx_neighborhood_reports_zip ON neighborhood_intelligence_reports(zip_code);
CREATE INDEX idx_neighborhood_reports_date ON neighborhood_intelligence_reports(report_date);
