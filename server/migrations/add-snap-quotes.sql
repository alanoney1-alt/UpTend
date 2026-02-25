-- Snap & Book: snap_quotes table
CREATE TABLE IF NOT EXISTS snap_quotes (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  customer_id VARCHAR,
  image_url TEXT,
  service_type TEXT,
  confidence TEXT,
  analysis TEXT,
  quoted_price REAL,
  adjustments TEXT,
  status TEXT DEFAULT 'quoted',
  booked_service_request_id VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_snap_quotes_customer ON snap_quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_snap_quotes_status ON snap_quotes(status);
