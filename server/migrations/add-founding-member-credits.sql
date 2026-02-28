-- Founding Member Credits & Discount Tracking
-- $25 credit on first booking + 10% off first 10 jobs (stacking on job 1)

-- Add founding member perks columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_founding_member BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS founding_member_type TEXT; -- 'customer' or 'pro'
ALTER TABLE users ADD COLUMN IF NOT EXISTS founding_credit_remaining INTEGER DEFAULT 0; -- cents ($25 = 2500)
ALTER TABLE users ADD COLUMN IF NOT EXISTS founding_discount_jobs_used INTEGER DEFAULT 0; -- 0-10, 10% off until 10
ALTER TABLE users ADD COLUMN IF NOT EXISTS founding_joined_at TIMESTAMP;

-- Link founding_members signups to user accounts when they register
-- (founding_members table already exists from earlier migration)
ALTER TABLE founding_members ADD COLUMN IF NOT EXISTS linked_user_id VARCHAR;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_founding_member ON users (is_founding_member) WHERE is_founding_member = true;
CREATE INDEX IF NOT EXISTS idx_founding_members_email ON founding_members (email);
CREATE INDEX IF NOT EXISTS idx_founding_members_linked_user ON founding_members (linked_user_id) WHERE linked_user_id IS NOT NULL;

-- Track discount applications per job for audit trail
CREATE TABLE IF NOT EXISTS founding_discount_ledger (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,
  job_id VARCHAR NOT NULL,
  credit_applied INTEGER DEFAULT 0, -- cents
  discount_percent REAL DEFAULT 0, -- e.g. 10.0
  discount_amount INTEGER DEFAULT 0, -- cents
  total_savings INTEGER DEFAULT 0, -- cents (credit + discount)
  founding_jobs_count INTEGER NOT NULL, -- which job # this was (1-10)
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_founding_ledger_user ON founding_discount_ledger (user_id);
CREATE INDEX IF NOT EXISTS idx_founding_ledger_job ON founding_discount_ledger (job_id);
