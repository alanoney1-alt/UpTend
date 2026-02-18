-- Seed: All UpTend prices into price_matrix
-- Format: service_type, size_category, scope_level, base_rate, unit, min_price, max_price, estimated_duration

-- Junk Removal
INSERT INTO price_matrix (service_type, size_category, scope_level, base_rate, unit, min_price, max_price, estimated_duration) VALUES
  ('junk_removal', 'small',  'standard', 99.00,  'flat', 99.00,  113.85,  60),
  ('junk_removal', 'medium', 'standard', 199.00, 'flat', 199.00, 228.85,  90),
  ('junk_removal', 'large',  'standard', 349.00, 'flat', 349.00, 401.35,  120),
  ('junk_removal', 'xl',     'standard', 549.00, 'flat', 549.00, 631.35,  180);

-- Pressure Washing
INSERT INTO price_matrix (service_type, size_category, scope_level, base_rate, unit, min_price, max_price, estimated_duration) VALUES
  ('pressure_washing', 'small',  'standard', 149.00, 'flat', 149.00, 171.35, 90),
  ('pressure_washing', 'medium', 'standard', 299.00, 'flat', 299.00, 343.85, 150),
  ('pressure_washing', 'large',  'standard', 499.00, 'flat', 499.00, 573.85, 240);

-- Gutter Cleaning
INSERT INTO price_matrix (service_type, size_category, scope_level, base_rate, unit, min_price, max_price, estimated_duration) VALUES
  ('gutter_cleaning', 'small',  'standard', 150.00, 'flat', 150.00, 172.50, 60),
  ('gutter_cleaning', 'medium', 'standard', 225.00, 'flat', 225.00, 258.75, 90);

-- Moving Labor
INSERT INTO price_matrix (service_type, size_category, scope_level, base_rate, unit, min_price, max_price, estimated_duration) VALUES
  ('moving_labor', 'small',  'standard', 199.00, 'flat', 199.00, 228.85, 120),
  ('moving_labor', 'medium', 'standard', 379.00, 'flat', 379.00, 435.85, 240),
  ('moving_labor', 'large',  'standard', 699.00, 'flat', 699.00, 803.85, 480);

-- Handyman
INSERT INTO price_matrix (service_type, size_category, scope_level, base_rate, unit, min_price, max_price, estimated_duration) VALUES
  ('handyman', 'small', 'standard', 75.00, 'hourly', 75.00, 86.25, 60);

-- Demolition
INSERT INTO price_matrix (service_type, size_category, scope_level, base_rate, unit, min_price, max_price, estimated_duration) VALUES
  ('light_demolition', 'small',  'standard', 299.00, 'flat', 299.00, 343.85, 120),
  ('light_demolition', 'medium', 'standard', 599.00, 'flat', 599.00, 688.85, 240),
  ('light_demolition', 'large',  'standard', 999.00, 'flat', 999.00, 1148.85, 480);

-- Garage Cleanout
INSERT INTO price_matrix (service_type, size_category, scope_level, base_rate, unit, min_price, max_price, estimated_duration) VALUES
  ('garage_cleanout', 'small',  'standard', 199.00, 'flat', 199.00, 228.85, 120),
  ('garage_cleanout', 'medium', 'standard', 349.00, 'flat', 349.00, 401.35, 180),
  ('garage_cleanout', 'large',  'standard', 499.00, 'flat', 499.00, 573.85, 240);

-- Home Cleaning
INSERT INTO price_matrix (service_type, size_category, scope_level, base_rate, unit, min_price, max_price, estimated_duration) VALUES
  ('home_cleaning', 'medium', 'standard', 129.00, 'flat', 129.00, 148.35, 120),
  ('home_cleaning', 'medium', 'deep',     199.00, 'flat', 199.00, 228.85, 180),
  ('home_cleaning', 'medium', 'premium',  299.00, 'flat', 299.00, 343.85, 240);

-- Pool Cleaning
INSERT INTO price_matrix (service_type, size_category, scope_level, base_rate, unit, min_price, max_price, estimated_duration) VALUES
  ('pool_cleaning', 'medium', 'basic',    120.00, 'monthly', 120.00, 138.00, 45),
  ('pool_cleaning', 'medium', 'standard', 165.00, 'monthly', 165.00, 189.75, 60),
  ('pool_cleaning', 'medium', 'premium',  210.00, 'monthly', 210.00, 241.50, 75);

-- Landscaping
INSERT INTO price_matrix (service_type, size_category, scope_level, base_rate, unit, min_price, max_price, estimated_duration) VALUES
  ('landscaping', 'small',  'basic',    89.00,  'flat', 89.00,  102.35, 60),
  ('landscaping', 'medium', 'standard', 149.00, 'flat', 149.00, 171.35, 120),
  ('landscaping', 'large',  'premium',  249.00, 'flat', 249.00, 286.35, 180);

-- Carpet Cleaning
INSERT INTO price_matrix (service_type, size_category, scope_level, base_rate, unit, min_price, max_price, estimated_duration) VALUES
  ('carpet_cleaning', 'small',  'standard', 50.00, 'per_room', 50.00, 57.50, 30),
  ('carpet_cleaning', 'small',  'deep',     75.00, 'per_room', 75.00, 86.25, 45),
  ('carpet_cleaning', 'small',  'premium',  89.00, 'per_room', 89.00, 102.35, 60);

-- AI Home Scan
INSERT INTO price_matrix (service_type, size_category, scope_level, base_rate, unit, min_price, max_price, estimated_duration) VALUES
  ('home_scan', 'small',  'basic',    0.00,   'flat', 0.00,   0.00,   30),
  ('home_scan', 'medium', 'standard', 99.00,  'flat', 99.00,  113.85, 60),
  ('home_scan', 'large',  'premium',  249.00, 'flat', 249.00, 286.35, 120);

-- Bundle Discounts
INSERT INTO bundle_discounts (bundle_name, service_types, discount_percent, min_services) VALUES
  ('Duo Saver',      '[]', 7.00,  2),
  ('Triple Play',    '[]', 12.00, 3),
  ('Ultimate Bundle', '[]', 18.00, 4);

-- Pricing Zones (Orlando area)
INSERT INTO pricing_zones (zip_code, city, zone_name, multiplier) VALUES
  ('32827', 'Orlando',     'Lake Nona',      1.05),
  ('32836', 'Orlando',     'Dr. Phillips',   1.08),
  ('32819', 'Orlando',     'Sand Lake',      1.00),
  ('32789', 'Winter Park', 'Winter Park',    1.10),
  ('32765', 'Oviedo',      'Oviedo',         1.00),
  ('32832', 'Orlando',     'Avalon Park',    1.03),
  ('32824', 'Orlando',     'Meadow Woods',   0.98),
  ('34747', 'Kissimmee',   'Celebration',    1.07),
  ('34786', 'Windermere',  'Windermere',     1.12),
  ('32801', 'Orlando',     'Downtown',       1.05)
ON CONFLICT (zip_code) DO NOTHING;

-- Seasonal Rates
INSERT INTO seasonal_rates (service_type, month, multiplier, reason) VALUES
  ('gutter_cleaning',   6,  1.20, 'hurricane season prep'),
  ('gutter_cleaning',   7,  1.15, 'hurricane season'),
  ('gutter_cleaning',   8,  1.15, 'hurricane season'),
  ('gutter_cleaning',   9,  1.20, 'peak hurricane season'),
  ('gutter_cleaning',   10, 1.10, 'hurricane season wind-down'),
  ('pressure_washing',  3,  1.15, 'spring pollen season'),
  ('pressure_washing',  4,  1.15, 'spring pollen season'),
  ('landscaping',       4,  1.10, 'spring growth peak'),
  ('landscaping',       5,  1.10, 'spring growth peak'),
  ('landscaping',       6,  1.15, 'summer peak'),
  ('landscaping',       7,  1.15, 'summer peak'),
  ('pool_cleaning',     5,  1.10, 'pool season start'),
  ('pool_cleaning',     6,  1.15, 'summer peak'),
  ('pool_cleaning',     7,  1.15, 'summer peak'),
  ('pool_cleaning',     8,  1.10, 'late summer'),
  ('home_cleaning',     11, 1.10, 'holiday demand'),
  ('home_cleaning',     12, 1.15, 'holiday demand')
ON CONFLICT (service_type, month) DO NOTHING;
