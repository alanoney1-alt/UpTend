-- HOA Auto-Scrape: neighborhood data + customer associations
-- Run against Supabase

CREATE TABLE IF NOT EXISTS neighborhood_hoa_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  hoa_name TEXT,
  management_company TEXT,
  monthly_fee NUMERIC(10,2),
  annual_fee NUMERIC(10,2),
  contact_phone TEXT,
  contact_email TEXT,
  website TEXT,
  rules JSONB DEFAULT '{}',
  amenities JSONB DEFAULT '{}',
  meeting_schedule TEXT,
  source TEXT NOT NULL DEFAULT 'api' CHECK (source IN ('api','scraped','manual','customer_reported')),
  confidence TEXT NOT NULL DEFAULT 'low' CHECK (confidence IN ('high','medium','low')),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_hoa_associations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL,
  hoa_data_id UUID NOT NULL REFERENCES neighborhood_hoa_data(id),
  unit_number TEXT,
  member_since TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hoa_data_address ON neighborhood_hoa_data(address, city, state, zip);
CREATE INDEX IF NOT EXISTS idx_hoa_assoc_customer ON customer_hoa_associations(customer_id);
CREATE INDEX IF NOT EXISTS idx_hoa_assoc_data ON customer_hoa_associations(hoa_data_id);
