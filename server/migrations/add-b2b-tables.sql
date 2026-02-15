-- B2B Tables Migration
-- Generated 2026-02-15
-- 39 new tables for B2B features

-- 1. Insurance Certificates
CREATE TABLE IF NOT EXISTS insurance_certificates (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  policy_number TEXT NOT NULL,
  provider TEXT NOT NULL,
  coverage_amount REAL NOT NULL,
  expiry_date TEXT NOT NULL,
  document_url TEXT,
  verified BOOLEAN DEFAULT false,
  verified_at TEXT,
  verified_by VARCHAR(255),
  auto_notify BOOLEAN DEFAULT true,
  notify_days_before INTEGER DEFAULT 30,
  business_account_id VARCHAR(255),
  pro_id VARCHAR(255),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Compliance Documents
CREATE TABLE IF NOT EXISTS compliance_documents (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id VARCHAR(255) NOT NULL,
  doc_type TEXT NOT NULL,
  title TEXT,
  expiry TEXT,
  verified BOOLEAN DEFAULT false,
  verified_at TEXT,
  verified_by VARCHAR(255),
  document_url TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Background Checks
CREATE TABLE IF NOT EXISTS background_checks (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id VARCHAR(255) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  provider TEXT DEFAULT 'checkr',
  provider_check_id TEXT,
  completed_at TEXT,
  result TEXT,
  expiry TEXT,
  report_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Prevailing Wages
CREATE TABLE IF NOT EXISTS prevailing_wages (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  county TEXT NOT NULL,
  state TEXT NOT NULL,
  trade TEXT NOT NULL,
  wage_rate REAL NOT NULL,
  fringe REAL NOT NULL DEFAULT 0,
  effective_date TEXT NOT NULL,
  expiration_date TEXT,
  source TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Certified Payrolls
CREATE TABLE IF NOT EXISTS certified_payrolls (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id VARCHAR(255) NOT NULL,
  week_ending TEXT NOT NULL,
  pro_id VARCHAR(255) NOT NULL,
  hours REAL NOT NULL,
  rate REAL NOT NULL,
  fringe REAL DEFAULT 0,
  deductions REAL DEFAULT 0,
  net_pay REAL,
  trade TEXT,
  certified BOOLEAN DEFAULT false,
  certified_by VARCHAR(255),
  certified_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. SAM Registrations
CREATE TABLE IF NOT EXISTS sam_registrations (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id VARCHAR(255) NOT NULL,
  cage_code TEXT,
  uei TEXT,
  naics_codes TEXT[],
  status TEXT NOT NULL DEFAULT 'pending',
  expiry TEXT,
  registered_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. DBE Utilization
CREATE TABLE IF NOT EXISTS dbe_utilization (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id VARCHAR(255) NOT NULL,
  vendor_id VARCHAR(255) NOT NULL,
  certification_type TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  percentage REAL DEFAULT 0,
  goal_percentage REAL,
  verified BOOLEAN DEFAULT false,
  verification_doc_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. Government Bids
CREATE TABLE IF NOT EXISTS government_bids (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  agency TEXT NOT NULL,
  due_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  estimated_value REAL,
  awarded_value REAL,
  solicitation_number TEXT,
  set_aside TEXT,
  documents JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  business_account_id VARCHAR(255),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. FEMA Vendors
CREATE TABLE IF NOT EXISTS fema_vendors (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id VARCHAR(255) NOT NULL,
  certifications TEXT[],
  equipment TEXT[],
  availability_radius INTEGER DEFAULT 100,
  activated BOOLEAN DEFAULT false,
  activated_at TEXT,
  deactivated_at TEXT,
  last_deployed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. Retainage Tracking
CREATE TABLE IF NOT EXISTS retainage_tracking (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id VARCHAR(255) NOT NULL,
  milestone TEXT NOT NULL,
  amount REAL NOT NULL,
  retainage_pct REAL NOT NULL DEFAULT 10,
  retainage_held REAL NOT NULL DEFAULT 0,
  released BOOLEAN DEFAULT false,
  released_at TEXT,
  released_by VARCHAR(255),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 11. Environmental Compliance
CREATE TABLE IF NOT EXISTS environmental_compliance (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id VARCHAR(255) NOT NULL,
  waste_type TEXT NOT NULL,
  disposal_method TEXT NOT NULL,
  manifest_number TEXT,
  epa_id TEXT,
  facility_name TEXT,
  weight_lbs REAL,
  document_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 12. Communities
CREATE TABLE IF NOT EXISTS communities (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  units_count INTEGER DEFAULT 0,
  board_contact TEXT,
  management_company_id VARCHAR(255),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 13. Community Properties
CREATE TABLE IF NOT EXISTS community_properties (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  unit_number TEXT,
  owner_id VARCHAR(255),
  resident_id VARCHAR(255),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 14. Board Approvals
CREATE TABLE IF NOT EXISTS board_approvals (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id VARCHAR(255) NOT NULL,
  request_id VARCHAR(255),
  requested_by VARCHAR(255) NOT NULL,
  title TEXT,
  description TEXT,
  amount REAL,
  status TEXT NOT NULL DEFAULT 'pending',
  votes_for INTEGER DEFAULT 0,
  votes_against INTEGER DEFAULT 0,
  deadline TEXT,
  resolved_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 15. Maintenance Calendars
CREATE TABLE IF NOT EXISTS maintenance_calendars (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id VARCHAR(255) NOT NULL,
  service_type TEXT NOT NULL,
  frequency TEXT NOT NULL,
  next_date TEXT,
  last_completed_date TEXT,
  assigned_pro_id VARCHAR(255),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 16. Reserve Studies
CREATE TABLE IF NOT EXISTS reserve_studies (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id VARCHAR(255) NOT NULL,
  fiscal_year INTEGER NOT NULL,
  total_reserves REAL NOT NULL DEFAULT 0,
  allocated REAL DEFAULT 0,
  spent REAL DEFAULT 0,
  remaining REAL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 17. PM Portfolios
CREATE TABLE IF NOT EXISTS pm_portfolios (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id VARCHAR(255) NOT NULL,
  total_units INTEGER DEFAULT 0,
  total_properties INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 18. PM Properties
CREATE TABLE IF NOT EXISTS pm_properties (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zip TEXT,
  units INTEGER DEFAULT 1,
  type TEXT,
  owner_id VARCHAR(255),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 19. PM Units
CREATE TABLE IF NOT EXISTS pm_units (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id VARCHAR(255) NOT NULL,
  unit_number TEXT,
  tenant_id VARCHAR(255),
  status TEXT NOT NULL DEFAULT 'occupied',
  lease_end TEXT,
  monthly_rent REAL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 20. Work Orders
CREATE TABLE IF NOT EXISTS work_orders (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id VARCHAR(255) NOT NULL,
  tenant_id VARCHAR(255),
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'open',
  sla_deadline TEXT,
  photos TEXT[],
  assigned_pro_id VARCHAR(255),
  service_request_id VARCHAR(255),
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 21. Turnover Checklists
CREATE TABLE IF NOT EXISTS turnover_checklists (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id VARCHAR(255) NOT NULL,
  task TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_pro_id VARCHAR(255),
  completed_at TEXT,
  photos TEXT[],
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 22. SLA Configs
CREATE TABLE IF NOT EXISTS sla_configs (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id VARCHAR(255) NOT NULL,
  priority TEXT NOT NULL,
  response_hours INTEGER NOT NULL,
  resolution_hours INTEGER NOT NULL,
  escalation_contact TEXT,
  penalty_amount REAL,
  is_active BOOLEAN DEFAULT true,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 23. SLA Tracking
CREATE TABLE IF NOT EXISTS sla_tracking (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id VARCHAR(255) NOT NULL,
  sla_config_id VARCHAR(255) NOT NULL,
  response_at TEXT,
  resolved_at TEXT,
  breached BOOLEAN DEFAULT false,
  breach_type TEXT,
  breached_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 24. Punch Lists
CREATE TABLE IF NOT EXISTS punch_lists (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR(255) NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  title TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  due_date TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 25. Punch List Items
CREATE TABLE IF NOT EXISTS punch_list_items (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  punch_list_id VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  trade TEXT,
  assigned_pro_id VARCHAR(255),
  status TEXT NOT NULL DEFAULT 'open',
  photo_before TEXT,
  photo_after TEXT,
  completed_at TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 26. Lien Waivers
CREATE TABLE IF NOT EXISTS lien_waivers (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id VARCHAR(255) NOT NULL,
  pro_id VARCHAR(255) NOT NULL,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  signed BOOLEAN DEFAULT false,
  signed_at TEXT,
  document_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 27. Permits
CREATE TABLE IF NOT EXISTS permits (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id VARCHAR(255) NOT NULL,
  permit_type TEXT NOT NULL,
  permit_number TEXT,
  application_date TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  inspection_date TEXT,
  approved BOOLEAN DEFAULT false,
  approved_at TEXT,
  document_url TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 28. Digital Signatures
CREATE TABLE IF NOT EXISTS digital_signatures (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type TEXT NOT NULL,
  document_id VARCHAR(255) NOT NULL,
  signer_id VARCHAR(255) NOT NULL,
  signed_at TEXT NOT NULL,
  signature_data TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 29. Veteran Profiles
CREATE TABLE IF NOT EXISTS veteran_profiles (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id VARCHAR(255) NOT NULL,
  branch TEXT NOT NULL,
  mos_code TEXT,
  mos_title TEXT,
  service_start TEXT,
  service_end TEXT,
  disability_rating INTEGER,
  dd214_verified BOOLEAN DEFAULT false,
  dd214_document_url TEXT,
  verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 30. Veteran Certifications
CREATE TABLE IF NOT EXISTS veteran_certifications (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id VARCHAR(255) NOT NULL,
  cert_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  application_date TEXT,
  expiry TEXT,
  va_verification_id TEXT,
  document_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 31. Veteran Mentorships
CREATE TABLE IF NOT EXISTS veteran_mentorships (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_pro_id VARCHAR(255) NOT NULL,
  mentee_pro_id VARCHAR(255) NOT NULL,
  started_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  ended_at TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 32. Military Spouse Profiles
CREATE TABLE IF NOT EXISTS military_spouse_profiles (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  sponsor_branch TEXT,
  current_base TEXT,
  skills TEXT[],
  available_for TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 33. Contract Pricing
CREATE TABLE IF NOT EXISTS contract_pricing (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id VARCHAR(255) NOT NULL,
  client_type TEXT NOT NULL,
  service_type TEXT NOT NULL,
  rate REAL NOT NULL,
  discount_pct REAL DEFAULT 0,
  effective_date TEXT NOT NULL,
  end_date TEXT,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 34. Vendor Scorecards
CREATE TABLE IF NOT EXISTS vendor_scorecards (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id VARCHAR(255) NOT NULL,
  client_id VARCHAR(255) NOT NULL,
  period TEXT NOT NULL,
  on_time_pct REAL,
  quality_avg REAL,
  jobs_completed INTEGER DEFAULT 0,
  complaints INTEGER DEFAULT 0,
  overall_score REAL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 35. Asset Registry
CREATE TABLE IF NOT EXISTS asset_registry (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id VARCHAR(255),
  unit_id VARCHAR(255),
  asset_type TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  install_date TEXT,
  warranty_end TEXT,
  last_service TEXT,
  next_service_due TEXT,
  condition TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 36. B2B Audit Logs
CREATE TABLE IF NOT EXISTS b2b_audit_logs (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  action TEXT NOT NULL,
  actor_id VARCHAR(255) NOT NULL,
  details JSONB,
  ip_address TEXT,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 37. Custom Reports
CREATE TABLE IF NOT EXISTS custom_reports (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id VARCHAR(255) NOT NULL,
  name TEXT NOT NULL,
  filters JSONB,
  columns JSONB,
  schedule TEXT,
  last_run_at TEXT,
  recipient_emails TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 38. B2B Invoices
CREATE TABLE IF NOT EXISTS b2b_invoices (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id VARCHAR(255) NOT NULL,
  invoice_number TEXT,
  amount REAL NOT NULL,
  due_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  payment_terms TEXT DEFAULT 'net_30',
  line_items JSONB,
  paid_at TEXT,
  paid_amount REAL,
  stripe_payment_intent_id TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 39. White Label Configs
CREATE TABLE IF NOT EXISTS white_label_configs (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id VARCHAR(255) NOT NULL,
  logo_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  custom_domain TEXT,
  company_name TEXT,
  favicon_url TEXT,
  support_email TEXT,
  support_phone TEXT,
  custom_css TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
