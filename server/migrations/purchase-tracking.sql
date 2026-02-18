-- Purchase & Receipt Tracking + Appliance Profiles + Maintenance Log
-- Run against Supabase

-- Customer Purchases
CREATE TABLE IF NOT EXISTS customer_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  store TEXT NOT NULL CHECK (store IN ('lowes','home_depot','walmart','amazon','costco','ace','menards','other')),
  purchase_date TIMESTAMPTZ,
  receipt_url TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  total_amount DECIMAL(10,2),
  payment_method TEXT,
  source TEXT NOT NULL CHECK (source IN ('receipt_photo','email_scan','loyalty_link','manual','transaction')),
  raw_ocr_text TEXT,
  processed_by_ai BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customer_purchases_customer ON customer_purchases(customer_id);
CREATE INDEX idx_customer_purchases_store ON customer_purchases(store);

-- Retailer Connections
CREATE TABLE IF NOT EXISTS retailer_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  retailer TEXT NOT NULL CHECK (retailer IN ('lowes','home_depot','walmart','amazon')),
  connection_type TEXT NOT NULL CHECK (connection_type IN ('loyalty_account','email_scan','oauth')),
  account_email TEXT,
  access_token TEXT,
  refresh_token TEXT,
  status TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected','disconnected','expired')),
  last_sync_at TIMESTAMPTZ,
  purchase_count INTEGER DEFAULT 0,
  connected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_retailer_connections_customer ON retailer_connections(customer_id);
CREATE UNIQUE INDEX idx_retailer_connections_unique ON retailer_connections(customer_id, retailer);

-- Warranty Registrations
CREATE TABLE IF NOT EXISTS warranty_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  purchase_id UUID REFERENCES customer_purchases(id),
  scanned_item_id UUID,
  product_name TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  purchase_date TIMESTAMPTZ,
  warranty_type TEXT CHECK (warranty_type IN ('manufacturer','extended','store')),
  warranty_duration INTEGER,
  warranty_expires TIMESTAMPTZ,
  receipt_url TEXT,
  registration_confirmed BOOLEAN DEFAULT false,
  alert_sent_30day BOOLEAN DEFAULT false,
  alert_sent_7day BOOLEAN DEFAULT false,
  alert_sent_expired BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_warranty_registrations_customer ON warranty_registrations(customer_id);
CREATE INDEX idx_warranty_registrations_expires ON warranty_registrations(warranty_expires);

-- Home Maintenance Log
CREATE TABLE IF NOT EXISTS home_maintenance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  maintenance_type TEXT NOT NULL CHECK (maintenance_type IN ('filter_change','cleaning','repair','replacement','inspection','treatment')),
  appliance_or_system TEXT NOT NULL,
  description TEXT,
  performed_by TEXT CHECK (performed_by IN ('self','pro','contractor')),
  cost DECIMAL(10,2),
  receipt_id UUID REFERENCES customer_purchases(id),
  photos JSONB DEFAULT '[]'::jsonb,
  next_due_date TIMESTAMPTZ,
  frequency TEXT,
  notes TEXT,
  performed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_home_maintenance_log_customer ON home_maintenance_log(customer_id);
CREATE INDEX idx_home_maintenance_log_due ON home_maintenance_log(next_due_date);

-- Garage Door Profiles
CREATE TABLE IF NOT EXISTS garage_door_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  brand TEXT CHECK (brand IN ('chamberlain','liftmaster','genie','craftsman','amarr','clopay','wayne_dalton','other')),
  model TEXT,
  year_installed INTEGER,
  opener_type TEXT CHECK (opener_type IN ('chain','belt','screw','direct_drive','jackshaft')),
  smart_enabled BOOLEAN DEFAULT false,
  controller_brand TEXT CHECK (controller_brand IN ('myq','aladdin','tailwind','linear','other')),
  springs TEXT CHECK (springs IN ('torsion','extension')),
  last_serviced TIMESTAMPTZ,
  warranty_expires TIMESTAMPTZ,
  safety_features JSONB DEFAULT '{"auto_reverse": false, "photo_eye": false, "manual_release": false}'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_garage_door_profiles_customer ON garage_door_profiles(customer_id);

-- Water Heater Profiles
CREATE TABLE IF NOT EXISTS water_heater_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  type TEXT CHECK (type IN ('tank','tankless','hybrid','solar')),
  brand TEXT CHECK (brand IN ('rheem','ao_smith','bradford_white','rinnai','navien','noritz','other')),
  model TEXT,
  serial_number TEXT,
  capacity INTEGER,
  fuel_type TEXT CHECK (fuel_type IN ('electric','gas','propane','solar')),
  year_installed INTEGER,
  warranty_expires TIMESTAMPTZ,
  last_flushed TIMESTAMPTZ,
  flush_frequency INTEGER DEFAULT 12,
  anode_rod_replaced TIMESTAMPTZ,
  temp_setting INTEGER,
  energy_efficiency TEXT,
  location TEXT CHECK (location IN ('garage','closet','attic','basement','utility_room','outdoor')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_water_heater_profiles_customer ON water_heater_profiles(customer_id);
