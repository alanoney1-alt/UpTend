-- Drone Scan Booking + Smart Home OAuth Foundation
-- 2026-02-17

-- ─── Part A: Drone Scan Bookings ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS drone_scan_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','in_progress','completed','cancelled')),
  drone_operator_id TEXT REFERENCES hauler_profiles(id),
  flight_plan_notes TEXT,
  weather_check JSONB,
  faa_compliance_ack BOOLEAN NOT NULL DEFAULT false,
  property_size INTEGER,
  roof_type TEXT,
  stories INTEGER DEFAULT 1,
  interior_included BOOLEAN NOT NULL DEFAULT true,
  deliverables JSONB DEFAULT '{"roofPhotos":true,"thermalImaging":true,"3dModel":true,"interiorScan":true}'::jsonb,
  total_price DECIMAL(10,2) NOT NULL DEFAULT 249.00,
  payment_intent_id TEXT,
  completed_at TIMESTAMPTZ,
  report_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drone_scan_customer ON drone_scan_bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_drone_scan_status ON drone_scan_bookings(status);
CREATE INDEX IF NOT EXISTS idx_drone_scan_operator ON drone_scan_bookings(drone_operator_id);

-- ─── Part B: Smart Home OAuth ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS smart_home_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('nest','ring','august','flo','myq','simplisafe','ecobee')),
  access_token TEXT,
  refresh_token TEXT,
  token_expires TIMESTAMPTZ,
  device_count INTEGER DEFAULT 0,
  devices JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected','disconnected','expired')),
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ,
  UNIQUE(customer_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_smart_home_customer ON smart_home_connections(customer_id);

CREATE TABLE IF NOT EXISTS smart_home_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL,
  connection_id UUID REFERENCES smart_home_connections(id),
  alert_type TEXT NOT NULL CHECK (alert_type IN ('leak','motion','door','temperature','smoke','co')),
  device_name TEXT,
  message TEXT,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','critical')),
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_smart_home_alerts_customer ON smart_home_alerts(customer_id);
