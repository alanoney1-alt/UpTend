-- Guaranteed Price Ceiling fields on service_requests
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS guaranteed_ceiling REAL;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS final_customer_price REAL;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS ceiling_outcome TEXT;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS customer_savings REAL;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS ceiling_locked_at TEXT;

-- Scope Change Requests table
CREATE TABLE IF NOT EXISTS scope_change_requests (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  service_request_id VARCHAR NOT NULL,
  pro_id VARCHAR NOT NULL,
  customer_id VARCHAR NOT NULL,
  original_ceiling REAL NOT NULL,
  proposed_ceiling REAL NOT NULL,
  additional_amount REAL NOT NULL,
  reason TEXT NOT NULL,
  change_type TEXT NOT NULL,
  evidence_photos TEXT[] NOT NULL,
  evidence_description TEXT,
  ai_validated BOOLEAN DEFAULT false,
  ai_confidence_score REAL,
  ai_analysis TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  customer_notified_at TEXT,
  customer_responded_at TEXT,
  customer_notes TEXT,
  expires_at TEXT,
  flagged_for_review BOOLEAN DEFAULT false,
  admin_reviewed_at TEXT,
  admin_reviewed_by VARCHAR,
  admin_notes TEXT,
  created_at TEXT NOT NULL
);

-- Ceiling Analytics table
CREATE TABLE IF NOT EXISTS ceiling_analytics (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  period_type TEXT NOT NULL,
  total_jobs_completed INTEGER NOT NULL DEFAULT 0,
  total_jobs_with_ceiling INTEGER NOT NULL DEFAULT 0,
  jobs_under_ceiling INTEGER NOT NULL DEFAULT 0,
  jobs_at_ceiling INTEGER NOT NULL DEFAULT 0,
  jobs_scope_changed INTEGER NOT NULL DEFAULT 0,
  pct_under_ceiling REAL,
  pct_at_ceiling REAL,
  pct_scope_changed REAL,
  total_customer_savings REAL DEFAULT 0,
  avg_customer_savings REAL DEFAULT 0,
  avg_savings_pct REAL DEFAULT 0,
  scope_change_requests_count INTEGER DEFAULT 0,
  scope_changes_approved INTEGER DEFAULT 0,
  scope_changes_declined INTEGER DEFAULT 0,
  scope_changes_expired INTEGER DEFAULT 0,
  scope_change_approval_rate REAL,
  avg_scope_change_amount REAL,
  avg_ai_confidence REAL,
  avg_ceiling_accuracy REAL,
  by_service_type TEXT,
  created_at TEXT NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scope_changes_service ON scope_change_requests(service_request_id);
CREATE INDEX IF NOT EXISTS idx_scope_changes_pro ON scope_change_requests(pro_id);
CREATE INDEX IF NOT EXISTS idx_scope_changes_customer ON scope_change_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_scope_changes_status ON scope_change_requests(status);
CREATE INDEX IF NOT EXISTS idx_ceiling_analytics_period ON ceiling_analytics(period_type, period_start);
