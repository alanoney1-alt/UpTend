-- DIY Coaching Sessions & Diagnosis Patterns
-- Run against Supabase

CREATE TABLE IF NOT EXISTS diy_coaching_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL,
  issue_description TEXT NOT NULL,
  appliance_type TEXT,
  appliance_brand TEXT,
  appliance_model TEXT,
  diagnosis JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'diagnosing' CHECK (status IN ('diagnosing', 'coaching', 'paused', 'completed', 'escalated_to_pro')),
  steps JSONB DEFAULT '[]',
  current_step INTEGER DEFAULT 0,
  tutorial_videos JSONB DEFAULT '[]',
  products_needed JSONB DEFAULT '[]',
  safety_warnings JSONB DEFAULT '[]',
  escalation_reason TEXT,
  pro_dispatch_id UUID,
  total_time INTEGER,
  difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5),
  customer_rating INTEGER CHECK (customer_rating BETWEEN 1 AND 5),
  diagnostic_questions_asked JSONB DEFAULT '[]',
  diagnostic_answers JSONB DEFAULT '[]',
  photos JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_diy_sessions_customer ON diy_coaching_sessions(customer_id);
CREATE INDEX idx_diy_sessions_status ON diy_coaching_sessions(status);
CREATE INDEX idx_diy_sessions_created ON diy_coaching_sessions(created_at DESC);

CREATE TABLE IF NOT EXISTS diy_diagnosis_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symptom_description TEXT NOT NULL,
  appliance_type TEXT NOT NULL,
  possible_causes JSONB NOT NULL DEFAULT '[]',
  diagnostic_questions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_diy_patterns_appliance ON diy_diagnosis_patterns(appliance_type);
