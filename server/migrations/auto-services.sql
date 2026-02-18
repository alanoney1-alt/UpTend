-- Auto Services: vehicle profiles, maintenance tracking, diagnosis, parts search
-- Run against Supabase

-- Customer Vehicles
CREATE TABLE IF NOT EXISTS customer_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL,
  year INT,
  make TEXT,
  model TEXT,
  trim TEXT,
  vin TEXT,
  mileage INT,
  color TEXT,
  license_plate TEXT,
  purchase_date DATE,
  purchase_price DECIMAL(10,2),
  oil_type TEXT,
  tire_size TEXT,
  battery_size TEXT,
  engine_size TEXT,
  transmission TEXT CHECK (transmission IN ('auto','manual')),
  fuel_type TEXT CHECK (fuel_type IN ('gas','diesel','electric','hybrid')),
  photo TEXT,
  nickname TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customer_vehicles_customer ON customer_vehicles(customer_id);
CREATE INDEX idx_customer_vehicles_vin ON customer_vehicles(vin);

-- Vehicle Maintenance Log
CREATE TABLE IF NOT EXISTS vehicle_maintenance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL,
  vehicle_id UUID NOT NULL REFERENCES customer_vehicles(id) ON DELETE CASCADE,
  maintenance_type TEXT NOT NULL CHECK (maintenance_type IN (
    'oil_change','tire_rotation','brake_pads','brake_fluid','transmission_fluid',
    'coolant_flush','air_filter','cabin_filter','spark_plugs','battery','wipers',
    'alignment','timing_belt','serpentine_belt','fuel_filter','inspection'
  )),
  performed_by TEXT CHECK (performed_by IN ('self','shop','dealer')),
  shop_name TEXT,
  mileage_at_service INT,
  cost DECIMAL(10,2),
  parts JSONB DEFAULT '[]',
  next_due_mileage INT,
  next_due_date DATE,
  notes TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vml_customer ON vehicle_maintenance_log(customer_id);
CREATE INDEX idx_vml_vehicle ON vehicle_maintenance_log(vehicle_id);

-- Vehicle Maintenance Schedules
CREATE TABLE IF NOT EXISTS vehicle_maintenance_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES customer_vehicles(id) ON DELETE CASCADE,
  maintenance_type TEXT NOT NULL,
  interval_miles INT,
  interval_months INT,
  last_performed_mileage INT,
  last_performed_date DATE,
  next_due_mileage INT,
  next_due_date DATE,
  priority TEXT DEFAULT 'routine' CHECK (priority IN ('routine','soon','overdue','critical')),
  estimated_cost DECIMAL(10,2)
);

CREATE INDEX idx_vms_vehicle ON vehicle_maintenance_schedules(vehicle_id);

-- Auto Diagnosis Patterns
CREATE TABLE IF NOT EXISTS auto_diagnosis_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symptom_category TEXT NOT NULL CHECK (symptom_category IN (
    'engine','brakes','electrical','suspension','transmission','exhaust','cooling','steering','tires','body'
  )),
  symptom_description TEXT NOT NULL,
  possible_causes JSONB NOT NULL DEFAULT '[]',
  diagnostic_questions JSONB DEFAULT '[]',
  obd_codes JSONB DEFAULT '[]'
);

CREATE INDEX idx_adp_category ON auto_diagnosis_patterns(symptom_category);

-- Auto Parts Search
CREATE TABLE IF NOT EXISTS auto_parts_search (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL,
  vehicle_id UUID REFERENCES customer_vehicles(id) ON DELETE SET NULL,
  part_name TEXT NOT NULL,
  part_number TEXT,
  fitment JSONB DEFAULT '{}',
  results JSONB DEFAULT '[]',
  searched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_aps_customer ON auto_parts_search(customer_id);
