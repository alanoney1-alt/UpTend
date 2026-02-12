-- ESG Service Details table
-- Stores granular per-service ESG/environmental data for all service types

CREATE TABLE IF NOT EXISTS esg_service_details (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id VARCHAR NOT NULL,
  esg_impact_log_id VARCHAR,
  pro_id VARCHAR,
  service_type TEXT NOT NULL,

  -- PRESSURE WASHING
  water_usage_gallons REAL,
  water_source_type TEXT,
  chemical_product_name TEXT,
  chemical_type TEXT,
  chemical_volume_oz REAL,
  chemical_certification TEXT,
  chemical_concentration_pct REAL,
  wastewater_method TEXT,
  wastewater_containment_deployed BOOLEAN DEFAULT FALSE,
  wastewater_volume_gallons REAL,
  runoff_compliance_status BOOLEAN DEFAULT TRUE,
  surface_type TEXT,
  surface_area_sqft REAL,
  equipment_type TEXT,
  equipment_power_source TEXT,
  equipment_psi_rating INTEGER,
  equipment_runtime_minutes INTEGER,

  -- POOL CLEANING
  pool_chemicals JSONB,
  pool_chlorine_oz REAL,
  pool_acid_oz REAL,
  pool_stabilizer_oz REAL,
  pool_algaecide_oz REAL,
  pool_shock_treatment BOOLEAN DEFAULT FALSE,
  pool_filter_status TEXT,
  pool_filter_type TEXT,
  pool_filter_disposal_method TEXT,
  pool_water_drained_gallons REAL,
  pool_water_added_gallons REAL,
  pool_equipment_energy_kwh REAL,

  -- LAWN CARE
  fertilizer_product_name TEXT,
  fertilizer_npk_ratio TEXT,
  fertilizer_quantity_lbs REAL,
  fertilizer_epa_registration TEXT,
  fertilizer_application_method TEXT,
  fertilizer_organic BOOLEAN DEFAULT FALSE,
  pesticide_product_name TEXT,
  pesticide_quantity_oz REAL,
  pesticide_target_pest TEXT,
  pesticide_application_method TEXT,
  pesticide_epa_registration TEXT,
  green_waste_clippings_lbs REAL,
  green_waste_branches_lbs REAL,
  green_waste_disposal_method TEXT,
  green_waste_bags_filled INTEGER,
  lawn_water_usage_gallons REAL,
  lawn_equipment JSONB,
  lawn_primary_mower_type TEXT,
  lawn_total_equipment_runtime_min INTEGER,
  lawn_lot_size_sqft REAL,

  -- HOME CLEANING
  cleaning_products JSONB,
  cleaning_product_count INTEGER,
  cleaning_green_product_count INTEGER,
  cleaning_green_product_pct REAL,
  cleaning_trash_bags INTEGER,
  cleaning_waste_estimate_lbs REAL,
  cleaning_disposable_supplies JSONB,
  cleaning_vacuum_runtime_min INTEGER,
  cleaning_equipment_power TEXT,

  -- CARPET CLEANING
  carpet_chemical_name TEXT,
  carpet_chemical_type TEXT,
  carpet_chemical_volume_gallons REAL,
  carpet_chemical_certification TEXT,
  carpet_extraction_method TEXT,
  carpet_wastewater_gallons REAL,
  carpet_wastewater_disposal TEXT,
  carpet_equipment_energy_kwh REAL,
  carpet_rooms_cleaned INTEGER,
  carpet_total_sqft REAL,

  -- GUTTER CLEANING
  gutter_debris_weight_lbs REAL,
  gutter_debris_type TEXT,
  gutter_debris_disposal_method TEXT,
  gutter_replaced_material_type TEXT,
  gutter_replaced_material_weight_lbs REAL,
  gutter_linear_feet REAL,

  -- HANDYMAN
  handyman_material_waste JSONB,
  handyman_total_waste_lbs REAL,
  handyman_paint_used BOOLEAN DEFAULT FALSE,
  handyman_paint_type TEXT,
  handyman_paint_voc_level TEXT,
  handyman_paint_quantity_oz REAL,
  handyman_replaced_items_disposal TEXT,
  handyman_packaging_waste_lbs REAL,

  -- TRUCK UNLOADING
  unload_packaging_waste JSONB,
  unload_total_packaging_lbs REAL,
  unload_cardboard_lbs REAL,
  unload_plastic_lbs REAL,
  unload_foam_lbs REAL,
  unload_pallet_count INTEGER,
  unload_pallet_disposal TEXT,
  unload_damaged_items_count INTEGER,
  unload_damaged_items_disposal TEXT,

  -- MOVING LABOR
  moving_discarded_items JSONB,
  moving_discarded_total_lbs REAL,
  moving_packing_material_waste JSONB,
  moving_cardboard_lbs REAL,
  moving_plastic_wrap_lbs REAL,
  moving_foam_lbs REAL,
  moving_bubble_wrap_lbs REAL,
  moving_donated_furniture_lbs REAL,
  moving_donated_to_org TEXT,
  moving_total_distance_miles REAL,
  moving_scope3_emissions_lbs REAL,

  -- AI HOME SCAN
  scan_energy_efficiency_flags JSONB,
  scan_aging_appliance_count INTEGER,
  scan_insulation_gaps BOOLEAN DEFAULT FALSE,
  scan_hvac_efficiency_score REAL,
  scan_water_fixture_leaks INTEGER,
  scan_estimated_annual_waste_kwh REAL,
  scan_estimated_annual_water_waste_gal REAL,
  scan_property_health_impact REAL,
  scan_recommended_services JSONB,

  -- UNIVERSAL FIELDS
  pro_equipment_profile JSONB,
  pro_used_different_equipment BOOLEAN DEFAULT FALSE,
  esg_compliance_score REAL,
  green_product_usage_pct REAL,
  total_chemical_volume_oz REAL,
  total_water_usage_gallons REAL,
  total_waste_generated_lbs REAL,
  total_equipment_runtime_min INTEGER,
  estimated_equipment_co2_lbs REAL,
  data_completeness REAL,
  pro_submitted_at TEXT,
  ai_enriched_at TEXT,
  admin_reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT now(),
  updated_at TEXT DEFAULT now(),
  notes TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_esg_service_details_service_request_id
  ON esg_service_details(service_request_id);

CREATE INDEX IF NOT EXISTS idx_esg_service_details_pro_id
  ON esg_service_details(pro_id);

CREATE INDEX IF NOT EXISTS idx_esg_service_details_service_type
  ON esg_service_details(service_type);

CREATE INDEX IF NOT EXISTS idx_esg_service_details_esg_impact_log_id
  ON esg_service_details(esg_impact_log_id);
