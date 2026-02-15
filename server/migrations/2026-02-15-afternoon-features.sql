-- ===================================================
-- Migration: 2026-02-15-afternoon-features.sql
-- Description: B2B onboarding, academy, certifications, 
-- parts workflow, integrations, fee gamification, 
-- free tier, accounting, and AI expansion
-- ===================================================

-- Parts & Materials System
CREATE TABLE IF NOT EXISTS parts_requests (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    service_request_id VARCHAR NOT NULL,
    requested_by_pro_id VARCHAR NOT NULL,
    business_account_id VARCHAR,
    status TEXT NOT NULL DEFAULT 'pending',
    description TEXT NOT NULL,
    photo_url TEXT,
    estimated_cost REAL,
    actual_cost REAL,
    supplier_source TEXT,
    receipt_url TEXT,
    approved_by_id VARCHAR,
    approved_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS preferred_suppliers (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id VARCHAR NOT NULL,
    supplier_name TEXT NOT NULL,
    supplier_type TEXT NOT NULL,
    account_number TEXT,
    contact_info TEXT,
    notes TEXT,
    created_at TEXT NOT NULL
);

-- Pro Academy Certification System
CREATE TABLE IF NOT EXISTS certification_programs (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug VARCHAR NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR NOT NULL DEFAULT 'b2b',
    prerequisite_cert_id VARCHAR,
    required_score INTEGER NOT NULL DEFAULT 80,
    modules_count INTEGER NOT NULL DEFAULT 0,
    estimated_minutes INTEGER NOT NULL DEFAULT 60,
    expiration_days INTEGER NOT NULL DEFAULT 365,
    is_active BOOLEAN DEFAULT TRUE,
    badge_icon TEXT DEFAULT 'shield',
    badge_color TEXT DEFAULT '#f59e0b',
    created_at TEXT NOT NULL DEFAULT NOW(),
    updated_at TEXT NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS certification_modules (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    certification_id VARCHAR NOT NULL,
    module_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    video_url TEXT,
    estimated_minutes INTEGER NOT NULL DEFAULT 15,
    created_at TEXT NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS certification_questions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    certification_id VARCHAR NOT NULL,
    module_number INTEGER,
    question TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option VARCHAR NOT NULL,
    explanation TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pro_certifications (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    pro_id VARCHAR NOT NULL,
    certification_id VARCHAR NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'in_progress',
    score INTEGER,
    started_at TEXT NOT NULL DEFAULT NOW(),
    completed_at TEXT,
    expires_at TEXT,
    certificate_number VARCHAR,
    modules_completed JSONB DEFAULT '[]'::jsonb,
    quiz_attempts INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT NOW()
);

-- B2B Business Booking System
CREATE TABLE IF NOT EXISTS business_bookings (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id VARCHAR NOT NULL,
    property_id VARCHAR,
    service_request_id VARCHAR,
    service_type TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    scheduled_for TEXT NOT NULL,
    scheduled_time TEXT,
    recurring_frequency TEXT,
    recurring_end_date TEXT,
    preferred_pro_id VARCHAR,
    access_notes TEXT,
    gate_code TEXT,
    special_instructions TEXT,
    unit_notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    price_estimate REAL,
    final_price REAL,
    bulk_booking_group_id VARCHAR,
    billing_method TEXT DEFAULT 'business_account',
    created_by VARCHAR NOT NULL,
    created_at TEXT NOT NULL DEFAULT NOW(),
    updated_at TEXT
);

CREATE TABLE IF NOT EXISTS business_preferred_pros (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id VARCHAR NOT NULL,
    pro_id VARCHAR NOT NULL,
    pro_name TEXT,
    service_types TEXT[],
    rating REAL,
    total_jobs_together INTEGER DEFAULT 0,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT NOW()
);

-- CRM & Integration System
CREATE TABLE IF NOT EXISTS crm_contact_mappings (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id VARCHAR NOT NULL,
    crm_platform TEXT NOT NULL,
    external_contact_id TEXT NOT NULL,
    uptend_user_id VARCHAR,
    uptend_property_id VARCHAR,
    external_data JSONB,
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS integration_connections (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id VARCHAR NOT NULL,
    platform TEXT NOT NULL,
    credentials TEXT,
    status TEXT NOT NULL DEFAULT 'disconnected',
    last_sync_at TIMESTAMP,
    last_sync_result JSONB,
    sync_frequency TEXT NOT NULL DEFAULT 'manual',
    auto_sync BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS government_opportunities (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    agency TEXT,
    solicitation_number TEXT,
    naics_code TEXT,
    set_aside_type TEXT,
    estimated_value REAL,
    response_deadline TIMESTAMP,
    place_of_performance TEXT,
    url TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    synced_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS integration_sync_logs (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id VARCHAR NOT NULL,
    platform TEXT NOT NULL,
    action TEXT NOT NULL,
    status TEXT NOT NULL,
    records_processed INTEGER DEFAULT 0,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Accounting & Ledger System  
CREATE TABLE IF NOT EXISTS ledger_accounts (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    subtype TEXT,
    parent_id VARCHAR,
    balance REAL DEFAULT 0 NOT NULL,
    is_system BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS ledger_entries (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id VARCHAR NOT NULL,
    account_id VARCHAR NOT NULL,
    debit REAL DEFAULT 0 NOT NULL,
    credit REAL DEFAULT 0 NOT NULL,
    description TEXT,
    reference_type TEXT,
    reference_id TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by TEXT DEFAULT 'system' NOT NULL
);

CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id VARCHAR NOT NULL,
    invoice_number INTEGER NOT NULL,
    status TEXT DEFAULT 'draft' NOT NULL,
    subtotal REAL DEFAULT 0 NOT NULL,
    tax_amount REAL DEFAULT 0 NOT NULL,
    total REAL DEFAULT 0 NOT NULL,
    due_date TIMESTAMP,
    paid_at TIMESTAMP,
    paid_via TEXT,
    line_items JSONB DEFAULT '[]'::jsonb NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS invoice_line_items (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id VARCHAR NOT NULL,
    description TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price REAL NOT NULL,
    total REAL NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expenses (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    vendor TEXT,
    description TEXT,
    expense_date TIMESTAMP NOT NULL,
    receipt_url TEXT,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tax_documents (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    pro_id VARCHAR NOT NULL,
    year INTEGER NOT NULL,
    total_earnings REAL DEFAULT 0 NOT NULL,
    total_jobs INTEGER DEFAULT 0 NOT NULL,
    form_1099_filed BOOLEAN DEFAULT FALSE NOT NULL,
    filed_at TIMESTAMP,
    w9_on_file BOOLEAN DEFAULT FALSE NOT NULL,
    tin TEXT,
    legal_name TEXT,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- AI Expansion Features
CREATE TABLE IF NOT EXISTS ai_conversations (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL,
    property_id VARCHAR,
    title TEXT,
    channel TEXT NOT NULL DEFAULT 'in_app',
    status TEXT NOT NULL DEFAULT 'active',
    context_type TEXT,
    referenced_appliance_id VARCHAR,
    referenced_warranty_id VARCHAR,
    referenced_service_request_id VARCHAR,
    resulted_in_booking BOOLEAN DEFAULT FALSE,
    resulted_in_warranty_claim BOOLEAN DEFAULT FALSE,
    resulted_in_escalation BOOLEAN DEFAULT FALSE,
    booking_service_request_id VARCHAR,
    customer_rating INTEGER,
    message_count INTEGER DEFAULT 0,
    ai_model_used TEXT DEFAULT 'claude-sonnet',
    total_tokens_used INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TEXT
);

CREATE TABLE IF NOT EXISTS ai_conversation_messages (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id VARCHAR NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    media_urls TEXT[],
    media_content_types TEXT[],
    detected_intent TEXT,
    detected_service TEXT,
    detected_urgency TEXT,
    suggested_actions JSONB,
    property_context_snapshot JSONB,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS photo_quote_requests (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL,
    property_id VARCHAR,
    photo_urls TEXT[] NOT NULL,
    photo_content_types TEXT[],
    ai_classified_service TEXT,
    ai_classified_category TEXT,
    ai_confidence REAL,
    ai_description TEXT,
    estimated_price_min REAL,
    estimated_price_max REAL,
    estimated_scope TEXT,
    estimated_duration TEXT,
    additional_services JSONB,
    status TEXT NOT NULL DEFAULT 'pending',
    converted_to_service_request_id VARCHAR,
    converted_at TEXT,
    source TEXT DEFAULT 'in_app',
    ai_model_used TEXT,
    processing_time_ms INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- B2B Compliance & Government Features
CREATE TABLE IF NOT EXISTS insurance_certificates (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    policy_number TEXT NOT NULL,
    provider TEXT NOT NULL,
    coverage_amount REAL NOT NULL,
    expiry_date TEXT NOT NULL,
    document_url TEXT,
    verified BOOLEAN DEFAULT FALSE,
    verified_at TEXT,
    verified_by VARCHAR,
    auto_notify BOOLEAN DEFAULT TRUE,
    notify_days_before INTEGER DEFAULT 30,
    business_account_id VARCHAR,
    pro_id VARCHAR,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS compliance_documents (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    pro_id VARCHAR NOT NULL,
    doc_type TEXT NOT NULL,
    title TEXT,
    expiry TEXT,
    verified BOOLEAN DEFAULT FALSE,
    verified_at TEXT,
    verified_by VARCHAR,
    document_url TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS background_checks (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    pro_id VARCHAR NOT NULL,
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

CREATE TABLE IF NOT EXISTS prevailing_wages (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE TABLE IF NOT EXISTS certified_payrolls (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id VARCHAR NOT NULL,
    week_ending TEXT NOT NULL,
    pro_id VARCHAR NOT NULL,
    hours REAL NOT NULL,
    rate REAL NOT NULL,
    fringe REAL DEFAULT 0,
    deductions REAL DEFAULT 0,
    net_pay REAL,
    trade TEXT,
    certified BOOLEAN DEFAULT FALSE,
    certified_by VARCHAR,
    certified_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sam_registrations (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id VARCHAR NOT NULL,
    cage_code TEXT,
    uei TEXT,
    naics_codes TEXT[],
    status TEXT NOT NULL DEFAULT 'pending',
    expiry TEXT,
    registered_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dbe_utilization (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id VARCHAR NOT NULL,
    vendor_id VARCHAR NOT NULL,
    certification_type TEXT NOT NULL,
    amount REAL NOT NULL DEFAULT 0,
    percentage REAL DEFAULT 0,
    goal_percentage REAL,
    verified BOOLEAN DEFAULT FALSE,
    verification_doc_url TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS government_bids (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
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
    business_account_id VARCHAR,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fema_vendors (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    pro_id VARCHAR NOT NULL,
    certifications TEXT[],
    equipment TEXT[],
    availability_radius INTEGER DEFAULT 100,
    activated BOOLEAN DEFAULT FALSE,
    activated_at TEXT,
    deactivated_at TEXT,
    last_deployed_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Additional B2B Management Tables
CREATE TABLE IF NOT EXISTS communities (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    units_count INTEGER DEFAULT 0,
    board_contact TEXT,
    management_company_id VARCHAR,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS community_properties (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id VARCHAR NOT NULL,
    address TEXT NOT NULL,
    unit_number TEXT,
    owner_id VARCHAR,
    resident_id VARCHAR,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pm_portfolios (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_id VARCHAR NOT NULL,
    total_units INTEGER DEFAULT 0,
    total_properties INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pm_properties (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id VARCHAR NOT NULL,
    address TEXT NOT NULL,
    city TEXT,
    state TEXT,
    zip TEXT,
    units INTEGER DEFAULT 1,
    type TEXT,
    owner_id VARCHAR,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pm_units (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id VARCHAR NOT NULL,
    unit_number TEXT,
    tenant_id VARCHAR,
    status TEXT NOT NULL DEFAULT 'occupied',
    lease_end TEXT,
    monthly_rent REAL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS work_orders (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id VARCHAR NOT NULL,
    tenant_id VARCHAR,
    description TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'normal',
    status TEXT NOT NULL DEFAULT 'open',
    sla_deadline TEXT,
    photos TEXT[],
    assigned_pro_id VARCHAR,
    service_request_id VARCHAR,
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_parts_requests_business_account_id ON parts_requests(business_account_id);
CREATE INDEX IF NOT EXISTS idx_parts_requests_service_request_id ON parts_requests(service_request_id);
CREATE INDEX IF NOT EXISTS idx_preferred_suppliers_business_account_id ON preferred_suppliers(business_account_id);

CREATE INDEX IF NOT EXISTS idx_certification_programs_category ON certification_programs(category);
CREATE INDEX IF NOT EXISTS idx_certification_modules_certification_id ON certification_modules(certification_id);
CREATE INDEX IF NOT EXISTS idx_certification_questions_certification_id ON certification_questions(certification_id);
CREATE INDEX IF NOT EXISTS idx_pro_certifications_pro_id ON pro_certifications(pro_id);
CREATE INDEX IF NOT EXISTS idx_pro_certifications_certification_id ON pro_certifications(certification_id);

CREATE INDEX IF NOT EXISTS idx_business_bookings_business_account_id ON business_bookings(business_account_id);
CREATE INDEX IF NOT EXISTS idx_business_bookings_service_request_id ON business_bookings(service_request_id);
CREATE INDEX IF NOT EXISTS idx_business_preferred_pros_business_account_id ON business_preferred_pros(business_account_id);
CREATE INDEX IF NOT EXISTS idx_business_preferred_pros_pro_id ON business_preferred_pros(pro_id);

CREATE INDEX IF NOT EXISTS idx_integration_connections_business_account_id ON integration_connections(business_account_id);
CREATE INDEX IF NOT EXISTS idx_integration_sync_logs_connection_id ON integration_sync_logs(connection_id);
CREATE INDEX IF NOT EXISTS idx_crm_contact_mappings_business_account_id ON crm_contact_mappings(business_account_id);
CREATE INDEX IF NOT EXISTS idx_government_opportunities_status ON government_opportunities(status);

CREATE INDEX IF NOT EXISTS idx_ledger_entries_account_id ON ledger_entries(account_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_transaction_id ON ledger_entries(transaction_id);
CREATE INDEX IF NOT EXISTS idx_invoices_business_account_id ON invoices(business_account_id);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversation_messages_conversation_id ON ai_conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_photo_quote_requests_user_id ON photo_quote_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_insurance_certificates_business_account_id ON insurance_certificates(business_account_id);
CREATE INDEX IF NOT EXISTS idx_compliance_documents_pro_id ON compliance_documents(pro_id);
CREATE INDEX IF NOT EXISTS idx_background_checks_pro_id ON background_checks(pro_id);

CREATE INDEX IF NOT EXISTS idx_communities_management_company_id ON communities(management_company_id);
CREATE INDEX IF NOT EXISTS idx_community_properties_community_id ON community_properties(community_id);
CREATE INDEX IF NOT EXISTS idx_pm_properties_portfolio_id ON pm_properties(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_pm_units_property_id ON pm_units(property_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_unit_id ON work_orders(unit_id);

-- Set up any ALTER TABLE statements for new columns to existing tables
-- (Add here if any existing tables need new columns)