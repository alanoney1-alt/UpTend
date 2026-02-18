-- Shopping Assistant: product search, price comparison, YouTube tutorials, DIY projects, affiliate framework

CREATE TABLE IF NOT EXISTS product_recommendations (
  id SERIAL PRIMARY KEY,
  customer_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  category TEXT NOT NULL CHECK (category IN ('filter','tool','appliance','supply','hardware','plumbing','electrical','paint','outdoor','cleaning')),
  reason TEXT NOT NULL CHECK (reason IN ('maintenance_due','replacement','upgrade','diy_project','george_suggestion')),
  specifications JSONB DEFAULT '{}',
  estimated_price DECIMAL(10,2),
  priority TEXT NOT NULL DEFAULT 'optional' CHECK (priority IN ('urgent','soon','optional')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_search_results (
  id SERIAL PRIMARY KEY,
  customer_id TEXT,
  search_query TEXT NOT NULL,
  results JSONB NOT NULL DEFAULT '[]',
  searched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id SERIAL PRIMARY KEY,
  customer_id TEXT,
  product_recommendation_id INTEGER REFERENCES product_recommendations(id),
  retailer TEXT NOT NULL,
  product_url TEXT NOT NULL,
  affiliate_url TEXT NOT NULL,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  purchase_confirmed BOOLEAN DEFAULT FALSE,
  commission_estimate DECIMAL(10,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tutorial_recommendations (
  id SERIAL PRIMARY KEY,
  customer_id TEXT,
  task_type TEXT NOT NULL,
  youtube_video_id TEXT NOT NULL,
  youtube_title TEXT NOT NULL,
  youtube_channel TEXT,
  youtube_duration TEXT,
  youtube_thumbnail TEXT,
  relevance_score REAL DEFAULT 0,
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  viewed_by_customer BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS diy_projects (
  id SERIAL PRIMARY KEY,
  customer_id TEXT NOT NULL,
  project_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning','shopping','in_progress','completed')),
  items_needed JSONB NOT NULL DEFAULT '[]',
  tutorials_linked JSONB NOT NULL DEFAULT '[]',
  estimated_total_cost DECIMAL(10,2),
  estimated_time TEXT,
  notes TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_recommendations_customer ON product_recommendations(customer_id);
CREATE INDEX IF NOT EXISTS idx_product_search_results_customer ON product_search_results(customer_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_customer ON affiliate_clicks(customer_id);
CREATE INDEX IF NOT EXISTS idx_tutorial_recommendations_customer ON tutorial_recommendations(customer_id);
CREATE INDEX IF NOT EXISTS idx_diy_projects_customer ON diy_projects(customer_id);
