-- George Relationship Memory
-- Stores evolving relationship profiles per user

CREATE TABLE IF NOT EXISTS george_relationship_memory (
  user_id VARCHAR PRIMARY KEY,
  profile_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- B2B outreach log
CREATE TABLE IF NOT EXISTS b2b_outreach_log (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name VARCHAR NOT NULL,
  business_type VARCHAR NOT NULL,
  total_residents INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  emails_failed INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
