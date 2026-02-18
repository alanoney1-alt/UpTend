-- Pro Field Assistant: part ID from photos, supply store finder, technical reference, knowledge base
-- Pros are 1099 independent contractors

CREATE TABLE IF NOT EXISTS pro_field_assists (
  id SERIAL PRIMARY KEY,
  pro_id TEXT NOT NULL,
  job_id TEXT,
  assist_type TEXT NOT NULL CHECK (assist_type IN ('part_lookup', 'model_identification', 'tutorial', 'troubleshoot', 'tool_find', 'wiring_diagram', 'spec_sheet')),
  query TEXT NOT NULL,
  photos JSONB DEFAULT '[]',
  ai_response JSONB,
  products_found JSONB DEFAULT '[]',
  tutorials_found JSONB DEFAULT '[]',
  resolved BOOLEAN DEFAULT FALSE,
  resolved_how TEXT CHECK (resolved_how IN ('self', 'tutorial', 'found_part', 'called_support', 'escalated')),
  time_spent INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pro_parts_orders (
  id SERIAL PRIMARY KEY,
  pro_id TEXT NOT NULL,
  job_id TEXT,
  part_name TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  specifications TEXT,
  retailer TEXT,
  price DECIMAL(10,2),
  order_url TEXT,
  status TEXT NOT NULL DEFAULT 'needed' CHECK (status IN ('needed', 'ordered', 'picked_up', 'installed')),
  customer_billed BOOLEAN DEFAULT FALSE,
  billed_amount DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pro_knowledge_base (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('plumbing', 'electrical', 'hvac', 'appliance', 'roofing', 'general')),
  subcategory TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  brand TEXT,
  model_pattern TEXT,
  specs JSONB,
  common_issues JSONB,
  tools_needed JSONB,
  tips TEXT,
  contributed_by TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pro_field_assists_pro_id ON pro_field_assists(pro_id);
CREATE INDEX IF NOT EXISTS idx_pro_field_assists_type ON pro_field_assists(assist_type);
CREATE INDEX IF NOT EXISTS idx_pro_parts_orders_pro_id ON pro_parts_orders(pro_id);
CREATE INDEX IF NOT EXISTS idx_pro_parts_orders_job_id ON pro_parts_orders(job_id);
CREATE INDEX IF NOT EXISTS idx_pro_knowledge_base_category ON pro_knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_pro_knowledge_base_brand ON pro_knowledge_base(brand);
