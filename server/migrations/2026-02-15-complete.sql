-- ===================================================
-- Migration: 2026-02-15-complete.sql
-- Description: Complete migration for ALL new tables added 2026-02-15
-- Includes: everything from afternoon-features.sql PLUS
-- billing, payouts, government contracts, work orders, float ledger,
-- and all B2B management tables not yet created.
-- ===================================================

-- ============================================
-- SECTION 1: Tables from afternoon-features.sql (idempotent re-run)
-- ============================================

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
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS preferred_suppliers (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id VARCHAR NOT NULL,
    supplier_name TEXT NOT NULL,
    supplier_type TEXT NOT NULL,
    account_number TEXT,
    contact_info TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
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
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS certification_modules (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    certification_id VARCHAR NOT NULL,
    module_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    video_url TEXT,
    estimated_minutes INTEGER NOT NULL DEFAULT 15,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
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
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pro_certifications (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    pro_id VARCHAR NOT NULL,
    certification_id VARCHAR NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'in_progress',
    score INTEGER,
    started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TEXT,
    expires_at TEXT,
    certificate_number VARCHAR,
    modules_completed JSONB DEFAULT '[]'::jsonb,
    quiz_attempts INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
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
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
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

-- AI Features
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
    photo_urls TEXT[] NOT NULL,
    photo_content_types TEXT[],
    property_id VARCHAR,
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

-- Compliance & Government
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

-- Communities & PM
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

-- ============================================
-- SECTION 2: NEW tables not in afternoon-features.sql
-- ============================================

-- Retainage Tracking
CREATE TABLE IF NOT EXISTS retainage_tracking (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id VARCHAR NOT NULL,
    milestone TEXT NOT NULL,
    amount REAL NOT NULL,
    retainage_pct REAL NOT NULL DEFAULT 10,
    retainage_held REAL NOT NULL DEFAULT 0,
    released BOOLEAN DEFAULT FALSE,
    released_at TEXT,
    released_by VARCHAR,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Environmental Compliance
CREATE TABLE IF NOT EXISTS environmental_compliance (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id VARCHAR NOT NULL,
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

-- Board Approvals
CREATE TABLE IF NOT EXISTS board_approvals (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id VARCHAR NOT NULL,
    request_id VARCHAR,
    requested_by VARCHAR NOT NULL,
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

-- Maintenance Calendars
CREATE TABLE IF NOT EXISTS maintenance_calendars (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id VARCHAR NOT NULL,
    service_type TEXT NOT NULL,
    frequency TEXT NOT NULL,
    next_date TEXT,
    last_completed_date TEXT,
    assigned_pro_id VARCHAR,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Reserve Studies
CREATE TABLE IF NOT EXISTS reserve_studies (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id VARCHAR NOT NULL,
    fiscal_year INTEGER NOT NULL,
    total_reserves REAL NOT NULL DEFAULT 0,
    allocated REAL DEFAULT 0,
    spent REAL DEFAULT 0,
    remaining REAL DEFAULT 0,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Turnover Checklists
CREATE TABLE IF NOT EXISTS turnover_checklists (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id VARCHAR NOT NULL,
    created_by VARCHAR NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    move_out_date TEXT,
    move_in_date TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    photos JSONB DEFAULT '[]'::jsonb,
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- SLA Configs
CREATE TABLE IF NOT EXISTS sla_configs (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id VARCHAR NOT NULL,
    priority TEXT NOT NULL,
    response_hours INTEGER NOT NULL,
    resolution_hours INTEGER NOT NULL,
    escalation_contact TEXT,
    penalty_amount REAL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- SLA Tracking
CREATE TABLE IF NOT EXISTS sla_tracking (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id VARCHAR NOT NULL,
    sla_config_id VARCHAR NOT NULL,
    response_at TEXT,
    resolved_at TEXT,
    breached BOOLEAN DEFAULT FALSE,
    breach_type TEXT,
    breached_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Punch Lists
CREATE TABLE IF NOT EXISTS punch_lists (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id VARCHAR NOT NULL,
    created_by VARCHAR NOT NULL,
    title TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    due_date TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS punch_list_items (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    punch_list_id VARCHAR NOT NULL,
    description TEXT NOT NULL,
    trade TEXT,
    assigned_pro_id VARCHAR,
    status TEXT NOT NULL DEFAULT 'open',
    photo_before TEXT,
    photo_after TEXT,
    completed_at TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Lien Waivers
CREATE TABLE IF NOT EXISTS lien_waivers (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id VARCHAR NOT NULL,
    pro_id VARCHAR NOT NULL,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    signed BOOLEAN DEFAULT FALSE,
    signed_at TEXT,
    document_url TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Permits
CREATE TABLE IF NOT EXISTS permits (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id VARCHAR NOT NULL,
    permit_type TEXT NOT NULL,
    permit_number TEXT,
    application_date TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    inspection_date TEXT,
    approved BOOLEAN DEFAULT FALSE,
    approved_at TEXT,
    document_url TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Digital Signatures
CREATE TABLE IF NOT EXISTS digital_signatures (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type TEXT NOT NULL,
    document_id VARCHAR NOT NULL,
    signer_id VARCHAR NOT NULL,
    signed_at TEXT NOT NULL,
    signature_data TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Veteran Profiles
CREATE TABLE IF NOT EXISTS veteran_profiles (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    pro_id VARCHAR NOT NULL,
    branch TEXT NOT NULL,
    mos_code TEXT,
    mos_title TEXT,
    service_start TEXT,
    service_end TEXT,
    disability_rating INTEGER,
    dd214_verified BOOLEAN DEFAULT FALSE,
    dd214_document_url TEXT,
    verified_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Veteran Certifications
CREATE TABLE IF NOT EXISTS veteran_certifications (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id VARCHAR NOT NULL,
    cert_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    application_date TEXT,
    expiry TEXT,
    va_verification_id TEXT,
    document_url TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Veteran Mentorships
CREATE TABLE IF NOT EXISTS veteran_mentorships (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_pro_id VARCHAR NOT NULL,
    mentee_pro_id VARCHAR NOT NULL,
    started_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    ended_at TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Military Spouse Profiles
CREATE TABLE IF NOT EXISTS military_spouse_profiles (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL,
    sponsor_branch TEXT,
    current_base TEXT,
    skills TEXT[],
    available_for TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Contract Pricing
CREATE TABLE IF NOT EXISTS contract_pricing (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id VARCHAR NOT NULL,
    client_type TEXT NOT NULL,
    service_type TEXT NOT NULL,
    rate REAL NOT NULL,
    discount_pct REAL DEFAULT 0,
    effective_date TEXT NOT NULL,
    end_date TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Vendor Scorecards
CREATE TABLE IF NOT EXISTS vendor_scorecards (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    pro_id VARCHAR NOT NULL,
    client_id VARCHAR NOT NULL,
    period TEXT NOT NULL,
    on_time_pct REAL,
    quality_avg REAL,
    jobs_completed INTEGER DEFAULT 0,
    complaints INTEGER DEFAULT 0,
    overall_score REAL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Asset Registry
CREATE TABLE IF NOT EXISTS asset_registry (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id VARCHAR,
    unit_id VARCHAR,
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

-- B2B Audit Logs
CREATE TABLE IF NOT EXISTS b2b_audit_logs (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id VARCHAR NOT NULL,
    action TEXT NOT NULL,
    actor_id VARCHAR NOT NULL,
    details JSONB,
    ip_address TEXT,
    timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Custom Reports
CREATE TABLE IF NOT EXISTS custom_reports (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id VARCHAR NOT NULL,
    name TEXT NOT NULL,
    filters JSONB,
    columns JSONB,
    schedule TEXT,
    last_run_at TEXT,
    recipient_emails TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- B2B Invoices
CREATE TABLE IF NOT EXISTS b2b_invoices (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id VARCHAR NOT NULL,
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

-- White Label Configs
CREATE TABLE IF NOT EXISTS white_label_configs (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id VARCHAR NOT NULL,
    logo_url TEXT,
    primary_color TEXT,
    secondary_color TEXT,
    custom_domain TEXT,
    company_name TEXT,
    favicon_url TEXT,
    support_email TEXT,
    support_phone TEXT,
    custom_css TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- B2B Subscription Plans
CREATE TABLE IF NOT EXISTS b2b_subscription_plans (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    segment TEXT NOT NULL,
    tier TEXT NOT NULL,
    price_per_unit REAL NOT NULL,
    unit_type TEXT NOT NULL,
    max_units INTEGER,
    features JSONB NOT NULL DEFAULT '[]',
    transaction_fee_pct REAL NOT NULL DEFAULT 5.0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- B2B Subscriptions
CREATE TABLE IF NOT EXISTS b2b_subscriptions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id VARCHAR NOT NULL,
    plan_id VARCHAR NOT NULL,
    units_count INTEGER NOT NULL DEFAULT 0,
    monthly_price REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    billing_cycle TEXT NOT NULL DEFAULT 'monthly',
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,
    current_period_start TEXT,
    current_period_end TEXT,
    canceled_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Chargeback Disputes
CREATE TABLE IF NOT EXISTS chargeback_disputes (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    service_request_id VARCHAR NOT NULL,
    stripe_dispute_id TEXT,
    amount REAL NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'needs_response',
    evidence_submitted BOOLEAN DEFAULT FALSE,
    evidence_details JSONB,
    outcome TEXT,
    resolved_at TEXT,
    deadline TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tax Records (accounting)
CREATE TABLE IF NOT EXISTS tax_records (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    period TEXT NOT NULL,
    type TEXT NOT NULL,
    gross_revenue REAL DEFAULT 0 NOT NULL,
    net_revenue REAL DEFAULT 0 NOT NULL,
    expenses REAL DEFAULT 0 NOT NULL,
    taxes_owed REAL DEFAULT 0 NOT NULL,
    taxes_paid REAL DEFAULT 0 NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Monthly Reports (accounting)
CREATE TABLE IF NOT EXISTS monthly_reports (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    month TEXT NOT NULL,
    year INTEGER NOT NULL,
    total_revenue REAL DEFAULT 0 NOT NULL,
    total_expenses REAL DEFAULT 0 NOT NULL,
    net_income REAL DEFAULT 0 NOT NULL,
    jobs_completed INTEGER DEFAULT 0 NOT NULL,
    new_users INTEGER DEFAULT 0 NOT NULL,
    report_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Manual Expenses (accounting)
CREATE TABLE IF NOT EXISTS manual_expenses (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT,
    vendor TEXT,
    expense_date TIMESTAMP NOT NULL,
    receipt_url TEXT,
    approved_by TEXT,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================
-- SECTION 3: Weekly Billing & Payouts
-- ============================================

CREATE TABLE IF NOT EXISTS weekly_billing_runs (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id VARCHAR NOT NULL,
    week_start_date TEXT NOT NULL,
    week_end_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    invoice_id VARCHAR,
    total_amount REAL NOT NULL DEFAULT 0,
    job_count INTEGER NOT NULL DEFAULT 0,
    stripe_payment_intent_id TEXT,
    stripe_charge_id TEXT,
    error_message TEXT,
    dry_run BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TEXT
);

CREATE TABLE IF NOT EXISTS billing_line_items (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    billing_run_id VARCHAR NOT NULL,
    service_request_id VARCHAR NOT NULL,
    business_booking_id VARCHAR,
    property_address TEXT NOT NULL,
    service_type TEXT NOT NULL,
    completed_at TEXT NOT NULL,
    customer_signoff_at TEXT,
    pro_name TEXT,
    labor_cost REAL NOT NULL DEFAULT 0,
    parts_cost REAL NOT NULL DEFAULT 0,
    platform_fee REAL NOT NULL DEFAULT 0,
    total_charge REAL NOT NULL DEFAULT 0,
    notes TEXT
);

-- Stripe Connect Payout Tables
CREATE TABLE IF NOT EXISTS pro_payout_accounts (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    pro_id VARCHAR NOT NULL,
    stripe_connect_account_id TEXT,
    stripe_account_status TEXT DEFAULT 'pending',
    onboarding_complete BOOLEAN DEFAULT FALSE,
    payout_speed TEXT DEFAULT 'standard',
    instant_payout_eligible BOOLEAN DEFAULT FALSE,
    bank_last4 TEXT,
    bank_name TEXT,
    debit_card_last4 TEXT,
    total_paid_out INTEGER DEFAULT 0,
    last_payout_at TEXT,
    created_at TEXT NOT NULL DEFAULT now(),
    updated_at TEXT NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pro_payouts (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    pro_id VARCHAR NOT NULL,
    service_request_id VARCHAR,
    stripe_transfer_id TEXT,
    stripe_payout_id TEXT,
    amount INTEGER NOT NULL,
    platform_fee INTEGER NOT NULL,
    net_payout INTEGER NOT NULL,
    fee_rate REAL NOT NULL,
    instant_payout BOOLEAN DEFAULT FALSE,
    instant_fee INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    scheduled_for TEXT,
    paid_at TEXT,
    failure_reason TEXT,
    idempotency_key TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT now()
);

-- ============================================
-- SECTION 4: Government Contract Management
-- ============================================

CREATE TABLE IF NOT EXISTS government_contracts (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id VARCHAR,
    contract_number TEXT NOT NULL,
    award_date TEXT,
    start_date TEXT,
    end_date TEXT,
    contract_type TEXT NOT NULL DEFAULT 'firm_fixed_price',
    total_value INTEGER NOT NULL DEFAULT 0,
    funded_amount INTEGER NOT NULL DEFAULT 0,
    remaining_balance INTEGER NOT NULL DEFAULT 0,
    naics_code TEXT,
    status TEXT NOT NULL DEFAULT 'awarded',
    agency_name TEXT,
    agency_code TEXT,
    contracting_officer TEXT,
    contracting_officer_email TEXT,
    contracting_officer_phone TEXT,
    performance_location TEXT,
    sdvosb_set_aside BOOLEAN DEFAULT FALSE,
    small_business_set_aside BOOLEAN DEFAULT FALSE,
    prevailing_wage_determination TEXT,
    bond_required BOOLEAN DEFAULT FALSE,
    bond_amount INTEGER DEFAULT 0,
    insurance_minimum INTEGER DEFAULT 0,
    security_clearance_required BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_by VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS contract_milestones (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id VARCHAR NOT NULL,
    milestone_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    deliverables TEXT,
    due_date TEXT,
    completed_date TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    payment_amount INTEGER DEFAULT 0,
    payment_status TEXT NOT NULL DEFAULT 'unbilled',
    invoice_id VARCHAR,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS contract_labor_entries (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id VARCHAR NOT NULL,
    milestone_id VARCHAR,
    pro_id VARCHAR NOT NULL,
    work_date TEXT NOT NULL,
    hours_worked REAL NOT NULL,
    hourly_rate INTEGER NOT NULL,
    prevailing_wage_rate INTEGER,
    fringe_benefits INTEGER DEFAULT 0,
    overtime_hours REAL DEFAULT 0,
    overtime_rate INTEGER DEFAULT 0,
    job_classification TEXT NOT NULL,
    description TEXT,
    approved_by VARCHAR,
    approved_at TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS certified_payroll_reports (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id VARCHAR NOT NULL,
    week_ending_date TEXT NOT NULL,
    report_number INTEGER NOT NULL,
    prepared_by VARCHAR,
    prepared_at TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'draft',
    submitted_at TIMESTAMP,
    total_gross_wages INTEGER DEFAULT 0,
    total_fringe_benefits INTEGER DEFAULT 0,
    total_deductions INTEGER DEFAULT 0,
    total_net_pay INTEGER DEFAULT 0,
    wh347_form_data JSONB,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS certified_payroll_entries (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_report_id VARCHAR NOT NULL,
    pro_id VARCHAR NOT NULL,
    pro_name TEXT NOT NULL,
    pro_address TEXT,
    pro_ssn_last4 TEXT,
    job_classification TEXT NOT NULL,
    hours_monday REAL DEFAULT 0,
    hours_tuesday REAL DEFAULT 0,
    hours_wednesday REAL DEFAULT 0,
    hours_thursday REAL DEFAULT 0,
    hours_friday REAL DEFAULT 0,
    hours_saturday REAL DEFAULT 0,
    hours_sunday REAL DEFAULT 0,
    total_hours REAL NOT NULL DEFAULT 0,
    hourly_rate INTEGER NOT NULL,
    gross_pay INTEGER NOT NULL DEFAULT 0,
    fringe_benefits INTEGER DEFAULT 0,
    federal_tax INTEGER DEFAULT 0,
    state_tax INTEGER DEFAULT 0,
    social_security INTEGER DEFAULT 0,
    medicare INTEGER DEFAULT 0,
    other_deductions INTEGER DEFAULT 0,
    net_pay INTEGER NOT NULL DEFAULT 0,
    overtime_hours REAL DEFAULT 0,
    overtime_rate INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS contract_invoices (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id VARCHAR NOT NULL,
    milestone_id VARCHAR,
    invoice_number TEXT NOT NULL,
    invoice_period_start TEXT,
    invoice_period_end TEXT,
    submitted_date TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    labor_cost INTEGER DEFAULT 0,
    materials_cost INTEGER DEFAULT 0,
    equipment_cost INTEGER DEFAULT 0,
    subcontractor_cost INTEGER DEFAULT 0,
    overhead INTEGER DEFAULT 0,
    profit INTEGER DEFAULT 0,
    total_amount INTEGER NOT NULL DEFAULT 0,
    payment_received_date TEXT,
    payment_amount INTEGER DEFAULT 0,
    check_number TEXT,
    eft_number TEXT,
    prompt_payment_interest INTEGER DEFAULT 0,
    notes TEXT,
    due_date TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS contract_modifications (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id VARCHAR NOT NULL,
    mod_number TEXT NOT NULL,
    mod_type TEXT NOT NULL,
    description TEXT,
    previous_value INTEGER,
    new_value INTEGER,
    previous_end_date TEXT,
    new_end_date TEXT,
    effective_date TEXT,
    signed_date TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS contract_compliance_docs (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id VARCHAR NOT NULL,
    doc_type TEXT NOT NULL,
    file_name TEXT,
    file_url TEXT,
    expiration_date TEXT,
    status TEXT NOT NULL DEFAULT 'missing',
    uploaded_at TIMESTAMP,
    verified_by VARCHAR,
    verified_at TIMESTAMP,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS contract_daily_logs (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id VARCHAR NOT NULL,
    log_date TEXT NOT NULL,
    weather TEXT,
    temperature TEXT,
    work_performed TEXT,
    materials_used TEXT,
    equipment_used TEXT,
    personnel_on_site JSONB,
    visitors_on_site TEXT,
    safety_incidents TEXT,
    delay_reasons TEXT,
    photos JSONB,
    prepared_by VARCHAR,
    supervisor_signoff VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS prevailing_wage_rates (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    wage_decision_number TEXT NOT NULL,
    county TEXT,
    state TEXT,
    effective_date TEXT,
    expiration_date TEXT,
    classification TEXT NOT NULL,
    base_rate INTEGER NOT NULL,
    fringe_benefits INTEGER NOT NULL DEFAULT 0,
    total_rate INTEGER NOT NULL,
    overtime_rate INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS contract_audit_logs (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id VARCHAR NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id VARCHAR,
    user_id VARCHAR,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================
-- SECTION 5: Flat-Rate Work Order System
-- ============================================

CREATE TABLE IF NOT EXISTS contract_work_orders (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id VARCHAR NOT NULL,
    milestone_id VARCHAR,
    title TEXT NOT NULL,
    description TEXT,
    scope_of_work TEXT,
    service_type TEXT,
    deliverables TEXT,
    location TEXT,
    required_certifications JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'draft',
    budget_amount INTEGER DEFAULT 0,
    posted_at TIMESTAMP,
    deadline TEXT,
    assigned_pro_id VARCHAR,
    accepted_quote_amount INTEGER DEFAULT 0,
    completed_at TIMESTAMP,
    verified_at TIMESTAMP,
    verified_by VARCHAR,
    payment_status TEXT NOT NULL DEFAULT 'unpaid',
    upfront_payment_amount INTEGER DEFAULT 0,
    upfront_payment_status TEXT NOT NULL DEFAULT 'pending',
    upfront_payment_transfer_id TEXT,
    upfront_paid_at TIMESTAMP,
    completion_payment_amount INTEGER DEFAULT 0,
    completion_payment_status TEXT NOT NULL DEFAULT 'pending',
    completion_payment_transfer_id TEXT,
    completion_paid_at TIMESTAMP,
    payment_split TEXT NOT NULL DEFAULT '50_50',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS work_order_quotes (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id VARCHAR NOT NULL,
    pro_id VARCHAR NOT NULL,
    quote_amount INTEGER NOT NULL,
    estimated_days INTEGER,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'submitted',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    responded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS contract_work_logs (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id VARCHAR NOT NULL,
    work_order_id VARCHAR,
    milestone_id VARCHAR,
    pro_id VARCHAR NOT NULL,
    work_date TEXT NOT NULL,
    description TEXT,
    photos JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending',
    approved_by VARCHAR,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================
-- SECTION 6: Government Float Ledger
-- ============================================

CREATE TABLE IF NOT EXISTS government_float_ledger (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id VARCHAR NOT NULL,
    work_order_id VARCHAR,
    entry_type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    description TEXT,
    stripe_transfer_id TEXT,
    stripe_payment_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS government_float_settings (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    max_float_exposure INTEGER NOT NULL DEFAULT 50000000,
    alert_email TEXT,
    alert_sms TEXT,
    auto_hold_threshold INTEGER NOT NULL DEFAULT 100000000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================
-- SECTION 7: Indexes
-- ============================================

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

CREATE INDEX IF NOT EXISTS idx_weekly_billing_runs_business ON weekly_billing_runs(business_account_id);
CREATE INDEX IF NOT EXISTS idx_billing_line_items_run ON billing_line_items(billing_run_id);
CREATE INDEX IF NOT EXISTS idx_pro_payout_accounts_pro ON pro_payout_accounts(pro_id);
CREATE INDEX IF NOT EXISTS idx_pro_payouts_pro ON pro_payouts(pro_id);
CREATE INDEX IF NOT EXISTS idx_pro_payouts_status ON pro_payouts(status);

CREATE INDEX IF NOT EXISTS idx_government_contracts_status ON government_contracts(status);
CREATE INDEX IF NOT EXISTS idx_contract_milestones_contract ON contract_milestones(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_labor_entries_contract ON contract_labor_entries(contract_id);
CREATE INDEX IF NOT EXISTS idx_certified_payroll_reports_contract ON certified_payroll_reports(contract_id);
CREATE INDEX IF NOT EXISTS idx_certified_payroll_entries_report ON certified_payroll_entries(payroll_report_id);
CREATE INDEX IF NOT EXISTS idx_contract_invoices_contract ON contract_invoices(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_modifications_contract ON contract_modifications(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_compliance_docs_contract ON contract_compliance_docs(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_daily_logs_contract ON contract_daily_logs(contract_id);
CREATE INDEX IF NOT EXISTS idx_prevailing_wage_rates_classification ON prevailing_wage_rates(classification);
CREATE INDEX IF NOT EXISTS idx_contract_audit_logs_contract ON contract_audit_logs(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_work_orders_contract ON contract_work_orders(contract_id);
CREATE INDEX IF NOT EXISTS idx_work_order_quotes_work_order ON work_order_quotes(work_order_id);
CREATE INDEX IF NOT EXISTS idx_contract_work_logs_contract ON contract_work_logs(contract_id);
CREATE INDEX IF NOT EXISTS idx_government_float_ledger_contract ON government_float_ledger(contract_id);

CREATE INDEX IF NOT EXISTS idx_b2b_subscriptions_client ON b2b_subscriptions(client_id);
CREATE INDEX IF NOT EXISTS idx_b2b_invoices_client ON b2b_invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_chargeback_disputes_job ON chargeback_disputes(job_id);
CREATE INDEX IF NOT EXISTS idx_board_approvals_community ON board_approvals(community_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_calendars_community ON maintenance_calendars(community_id);
CREATE INDEX IF NOT EXISTS idx_reserve_studies_community ON reserve_studies(community_id);
CREATE INDEX IF NOT EXISTS idx_sla_configs_client ON sla_configs(client_id);
CREATE INDEX IF NOT EXISTS idx_sla_tracking_job ON sla_tracking(job_id);
CREATE INDEX IF NOT EXISTS idx_punch_lists_project ON punch_lists(project_id);
CREATE INDEX IF NOT EXISTS idx_punch_list_items_list ON punch_list_items(punch_list_id);
CREATE INDEX IF NOT EXISTS idx_lien_waivers_job ON lien_waivers(job_id);
CREATE INDEX IF NOT EXISTS idx_permits_job ON permits(job_id);
CREATE INDEX IF NOT EXISTS idx_veteran_profiles_pro ON veteran_profiles(pro_id);
CREATE INDEX IF NOT EXISTS idx_vendor_scorecards_pro ON vendor_scorecards(pro_id);
CREATE INDEX IF NOT EXISTS idx_contract_pricing_client ON contract_pricing(client_id);

-- ============================================
-- SECTION 8: Fix PM pricing ($4/$6/$10 → $3/$5/$8)
-- ============================================

UPDATE b2b_subscription_plans SET price_per_unit = 3 WHERE segment = 'pm' AND tier = 'starter';
UPDATE b2b_subscription_plans SET price_per_unit = 5 WHERE segment = 'pm' AND tier = 'professional';
UPDATE b2b_subscription_plans SET price_per_unit = 8 WHERE segment = 'pm' AND tier = 'enterprise';
