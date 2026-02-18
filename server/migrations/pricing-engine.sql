-- Centralized Pricing Engine Tables
-- Run against Supabase

-- Price Matrix: all service tiers and rates
CREATE TABLE IF NOT EXISTS price_matrix (
  id SERIAL PRIMARY KEY,
  service_type TEXT NOT NULL,
  size_category TEXT NOT NULL DEFAULT 'medium',  -- small/medium/large/xl
  scope_level TEXT NOT NULL DEFAULT 'standard',   -- basic/standard/deep/premium
  base_rate NUMERIC(10,2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'flat',              -- flat/hourly/per_room/per_sqft/monthly
  zone_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  seasonal_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  rush_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.5,
  min_price NUMERIC(10,2),
  max_price NUMERIC(10,2),
  estimated_duration INTEGER,  -- minutes
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pricing Zones: zip-based multipliers
CREATE TABLE IF NOT EXISTS pricing_zones (
  id SERIAL PRIMARY KEY,
  zip_code TEXT NOT NULL UNIQUE,
  city TEXT,
  zone_name TEXT,
  multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.0
);

-- Seasonal Rates: month-based multipliers per service
CREATE TABLE IF NOT EXISTS seasonal_rates (
  id SERIAL PRIMARY KEY,
  service_type TEXT NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  reason TEXT,
  UNIQUE(service_type, month)
);

-- Bundle Discounts
CREATE TABLE IF NOT EXISTS bundle_discounts (
  id SERIAL PRIMARY KEY,
  bundle_name TEXT NOT NULL,
  service_types JSONB NOT NULL DEFAULT '[]',
  discount_percent NUMERIC(5,2) NOT NULL,
  min_services INTEGER NOT NULL DEFAULT 2
);

-- Price History: audit trail
CREATE TABLE IF NOT EXISTS price_history (
  id SERIAL PRIMARY KEY,
  service_type TEXT NOT NULL,
  old_rate NUMERIC(10,2),
  new_rate NUMERIC(10,2),
  changed_by TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_price_matrix_service ON price_matrix(service_type);
CREATE INDEX IF NOT EXISTS idx_price_matrix_service_size ON price_matrix(service_type, size_category);
CREATE INDEX IF NOT EXISTS idx_pricing_zones_zip ON pricing_zones(zip_code);
CREATE INDEX IF NOT EXISTS idx_seasonal_rates_service ON seasonal_rates(service_type);
CREATE INDEX IF NOT EXISTS idx_price_history_service ON price_history(service_type);
