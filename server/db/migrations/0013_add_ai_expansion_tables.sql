-- Migration: Add AI Expansion Tables
-- Date: 2026-02-09
-- Features: AI Concierge, Photo-to-Quote, Seasonal Advisor, Smart Scheduling,
--           Move-In Wizard, Document Scanner, Route Optimizer, Quality Scoring,
--           Inventory Estimator, Portfolio Dashboard, Fraud Detection,
--           Marketing Content, Voice Booking, Neighborhood Intelligence

-- AI Concierge & Chat Assistant
CREATE TABLE ai_conversations (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  session_id VARCHAR NOT NULL,
  conversation_type TEXT NOT NULL DEFAULT 'general',
  context_data TEXT,
  started_at TEXT NOT NULL,
  last_message_at TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  rating INTEGER,
  feedback_text TEXT
);

CREATE TABLE ai_conversation_messages (
  id VARCHAR PRIMARY KEY,
  conversation_id VARCHAR NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  function_call TEXT,
  function_response TEXT,
  created_at TEXT NOT NULL
);

-- AI Photo-to-Quote
CREATE TABLE photo_quote_requests (
  id VARCHAR PRIMARY KEY,
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
  created_at TEXT NOT NULL,
  analyzed_at TEXT
);

-- AI Seasonal Home Advisor
CREATE TABLE seasonal_advisories (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR,
  zip_code TEXT NOT NULL,
  season TEXT NOT NULL,
  advisory_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  recommended_services TEXT,
  priority TEXT DEFAULT 'medium',
  weather_data TEXT,
  created_at TEXT NOT NULL,
  expires_at TEXT
);

-- AI Smart Scheduling
CREATE TABLE smart_schedule_suggestions (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  service_type TEXT NOT NULL,
  suggested_date TEXT NOT NULL,
  suggested_time_slot TEXT NOT NULL,
  reasoning TEXT,
  confidence_score REAL,
  factors_considered TEXT,
  available_pros INTEGER,
  estimated_price REAL,
  weather_optimal BOOLEAN,
  accepted BOOLEAN DEFAULT false,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

-- AI Move-In Wizard
CREATE TABLE move_in_plans (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  property_address TEXT NOT NULL,
  move_in_date TEXT NOT NULL,
  property_type TEXT,
  bedrooms INTEGER,
  has_pets BOOLEAN,
  ai_checklist TEXT NOT NULL,
  recommended_services TEXT NOT NULL,
  estimated_total_cost REAL,
  priority_order TEXT,
  weather_considerations TEXT,
  completed_tasks TEXT,
  status TEXT DEFAULT 'planning',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- AI Receipt & Document Scanner
CREATE TABLE document_scans (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  service_request_id VARCHAR,
  document_type TEXT NOT NULL,
  image_url TEXT NOT NULL,
  extracted_text TEXT,
  structured_data TEXT,
  vendor_name TEXT,
  total_amount REAL,
  service_date TEXT,
  line_items TEXT,
  confidence_score REAL,
  verification_status TEXT DEFAULT 'pending',
  created_at TEXT NOT NULL,
  verified_at TEXT
);

-- AI Route Optimizer
CREATE TABLE pro_route_optimizations (
  id VARCHAR PRIMARY KEY,
  hauler_id VARCHAR NOT NULL,
  optimization_date TEXT NOT NULL,
  job_ids TEXT NOT NULL,
  original_route TEXT,
  optimized_route TEXT NOT NULL,
  original_distance_miles REAL,
  optimized_distance_miles REAL,
  distance_saved_miles REAL,
  time_saved_minutes REAL,
  fuel_saved_gallons REAL,
  co2_saved_lbs REAL,
  optimization_algorithm TEXT DEFAULT 'tsp_genetic',
  traffic_data_used BOOLEAN DEFAULT false,
  weather_considered BOOLEAN DEFAULT false,
  accepted BOOLEAN DEFAULT false,
  created_at TEXT NOT NULL,
  applied_at TEXT
);

-- AI Training & Quality Scoring
CREATE TABLE pro_quality_scores (
  id VARCHAR PRIMARY KEY,
  hauler_id VARCHAR NOT NULL,
  score_date TEXT NOT NULL,
  overall_score REAL NOT NULL,
  completion_rate REAL,
  on_time_rate REAL,
  customer_rating_avg REAL,
  esg_score_avg REAL,
  proper_disposal_rate REAL,
  photo_documentation_rate REAL,
  repeat_customer_rate REAL,
  recommendation_score REAL,
  tier TEXT,
  strengths TEXT,
  improvement_areas TEXT,
  training_recommendations TEXT,
  jobs_analyzed INTEGER,
  created_at TEXT NOT NULL
);

CREATE TABLE job_quality_assessments (
  id VARCHAR PRIMARY KEY,
  service_request_id VARCHAR NOT NULL,
  hauler_id VARCHAR NOT NULL,
  assessment_date TEXT NOT NULL,
  photo_quality_score REAL,
  documentation_score REAL,
  esg_compliance_score REAL,
  customer_communication_score REAL,
  timeliness_score REAL,
  overall_score REAL,
  positive_highlights TEXT,
  improvement_suggestions TEXT,
  training_triggered BOOLEAN DEFAULT false,
  created_at TEXT NOT NULL
);

-- AI Inventory Estimator
CREATE TABLE inventory_estimates (
  id VARCHAR PRIMARY KEY,
  service_request_id VARCHAR NOT NULL,
  user_id VARCHAR NOT NULL,
  property_type TEXT,
  bedrooms INTEGER,
  sqft INTEGER,
  photo_urls TEXT,
  ai_detected_items TEXT,
  estimated_volume_cuft REAL,
  estimated_weight_lbs REAL,
  estimated_truck_size TEXT,
  estimated_labor_hours REAL,
  estimated_price REAL,
  confidence_score REAL,
  comparable_jobs_data TEXT,
  created_at TEXT NOT NULL,
  accepted_by_pro BOOLEAN DEFAULT false,
  actual_volume_cuft REAL,
  actual_weight_lbs REAL
);

-- AI Property Manager Portfolio Dashboard
CREATE TABLE portfolio_health_reports (
  id VARCHAR PRIMARY KEY,
  business_account_id VARCHAR NOT NULL,
  report_date TEXT NOT NULL,
  properties_analyzed INTEGER,
  total_service_requests INTEGER,
  avg_response_time_hours REAL,
  avg_completion_time_hours REAL,
  tenant_satisfaction_score REAL,
  cost_per_unit_avg REAL,
  preventive_maintenance_rate REAL,
  emergency_request_rate REAL,
  vendor_performance_scores TEXT,
  budget_utilization_pct REAL,
  upcoming_seasonal_needs TEXT,
  risk_properties TEXT,
  cost_saving_opportunities TEXT,
  recommended_actions TEXT,
  created_at TEXT NOT NULL
);

-- AI Fraud & Quality Detection
CREATE TABLE fraud_alerts (
  id VARCHAR PRIMARY KEY,
  service_request_id VARCHAR,
  hauler_id VARCHAR,
  user_id VARCHAR,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  description TEXT NOT NULL,
  detected_patterns TEXT,
  confidence_score REAL,
  evidence_data TEXT,
  review_status TEXT DEFAULT 'pending',
  reviewed_by VARCHAR,
  resolution TEXT,
  action_taken TEXT,
  created_at TEXT NOT NULL,
  reviewed_at TEXT,
  resolved_at TEXT
);

-- AI-Generated Marketing Content
CREATE TABLE ai_marketing_content (
  id VARCHAR PRIMARY KEY,
  content_type TEXT NOT NULL,
  target_audience TEXT,
  service_type TEXT,
  season TEXT,
  zip_code TEXT,
  generated_content TEXT NOT NULL,
  content_format TEXT NOT NULL,
  tone TEXT DEFAULT 'professional',
  keywords TEXT,
  call_to_action TEXT,
  performance_metrics TEXT,
  a_b_test_variant TEXT,
  status TEXT DEFAULT 'draft',
  created_by VARCHAR,
  approved_by VARCHAR,
  created_at TEXT NOT NULL,
  published_at TEXT
);

-- AI Voice Assistant for Booking
CREATE TABLE voice_booking_sessions (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR,
  phone_number TEXT,
  session_start TEXT NOT NULL,
  session_end TEXT,
  transcript TEXT,
  detected_intent TEXT,
  extracted_service_type TEXT,
  extracted_address TEXT,
  extracted_date TEXT,
  extracted_details TEXT,
  confidence_score REAL,
  booking_created BOOLEAN DEFAULT false,
  service_request_id VARCHAR,
  fallback_to_human BOOLEAN DEFAULT false,
  customer_satisfaction INTEGER,
  created_at TEXT NOT NULL
);

-- AI Neighborhood Intelligence
CREATE TABLE neighborhood_intelligence_reports (
  id VARCHAR PRIMARY KEY,
  zip_code TEXT NOT NULL,
  neighborhood_name TEXT,
  report_date TEXT NOT NULL,
  population_density TEXT,
  median_home_value REAL,
  avg_property_age INTEGER,
  hoa_prevalence_pct REAL,
  seasonal_demand_patterns TEXT,
  top_service_types TEXT,
  avg_service_frequency_days INTEGER,
  price_sensitivity TEXT,
  eco_consciousness_score REAL,
  competition_level TEXT,
  market_opportunity_score REAL,
  recommended_services TEXT,
  recommended_pricing TEXT,
  marketing_insights TEXT,
  data_sources TEXT,
  created_at TEXT NOT NULL,
  expires_at TEXT
);

-- Indexes for Performance
CREATE INDEX idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_session ON ai_conversations(session_id);
CREATE INDEX idx_ai_conversation_messages_conversation ON ai_conversation_messages(conversation_id);
CREATE INDEX idx_photo_quote_requests_user ON photo_quote_requests(user_id);
CREATE INDEX idx_photo_quote_requests_status ON photo_quote_requests(status);
CREATE INDEX idx_seasonal_advisories_user ON seasonal_advisories(user_id);
CREATE INDEX idx_seasonal_advisories_zip ON seasonal_advisories(zip_code);
CREATE INDEX idx_smart_schedule_suggestions_user ON smart_schedule_suggestions(user_id);
CREATE INDEX idx_move_in_plans_user ON move_in_plans(user_id);
CREATE INDEX idx_document_scans_user ON document_scans(user_id);
CREATE INDEX idx_document_scans_service_request ON document_scans(service_request_id);
CREATE INDEX idx_pro_route_optimizations_hauler ON pro_route_optimizations(hauler_id);
CREATE INDEX idx_pro_quality_scores_hauler ON pro_quality_scores(hauler_id);
CREATE INDEX idx_job_quality_assessments_service_request ON job_quality_assessments(service_request_id);
CREATE INDEX idx_job_quality_assessments_hauler ON job_quality_assessments(hauler_id);
CREATE INDEX idx_inventory_estimates_service_request ON inventory_estimates(service_request_id);
CREATE INDEX idx_portfolio_health_reports_business ON portfolio_health_reports(business_account_id);
CREATE INDEX idx_fraud_alerts_service_request ON fraud_alerts(service_request_id);
CREATE INDEX idx_fraud_alerts_hauler ON fraud_alerts(hauler_id);
CREATE INDEX idx_fraud_alerts_status ON fraud_alerts(review_status);
CREATE INDEX idx_ai_marketing_content_type ON ai_marketing_content(content_type);
CREATE INDEX idx_ai_marketing_content_status ON ai_marketing_content(status);
CREATE INDEX idx_voice_booking_sessions_user ON voice_booking_sessions(user_id);
CREATE INDEX idx_voice_booking_sessions_phone ON voice_booking_sessions(phone_number);
CREATE INDEX idx_neighborhood_intelligence_zip ON neighborhood_intelligence_reports(zip_code);
