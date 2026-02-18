-- Pro Intelligence: demand forecasts, customer retention, earnings goals, route plans, performance analytics

CREATE TABLE IF NOT EXISTS pro_demand_forecasts (
  id SERIAL PRIMARY KEY,
  pro_id TEXT NOT NULL,
  zip TEXT NOT NULL,
  service_type TEXT NOT NULL,
  forecast_date DATE NOT NULL,
  expected_jobs INTEGER NOT NULL DEFAULT 0,
  expected_revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
  confidence TEXT NOT NULL CHECK (confidence IN ('high', 'medium', 'low')),
  factors JSONB DEFAULT '{}',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pro_customer_retention (
  id SERIAL PRIMARY KEY,
  pro_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  total_jobs INTEGER NOT NULL DEFAULT 0,
  last_job_date DATE,
  avg_rating DECIMAL(3,2),
  retention_risk TEXT NOT NULL CHECK (retention_risk IN ('low', 'medium', 'high')),
  next_recommended_outreach DATE,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS pro_earnings_goals (
  id SERIAL PRIMARY KEY,
  pro_id TEXT NOT NULL,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  target_amount DECIMAL(10,2) NOT NULL,
  current_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'achieved', 'missed')),
  milestones JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pro_route_plans (
  id SERIAL PRIMARY KEY,
  pro_id TEXT NOT NULL,
  plan_date DATE NOT NULL,
  jobs JSONB NOT NULL DEFAULT '[]',
  optimized_order JSONB NOT NULL DEFAULT '[]',
  total_distance DECIMAL(10,2) DEFAULT 0,
  total_drive_time INTEGER DEFAULT 0,
  fuel_estimate DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pro_performance_analytics (
  id SERIAL PRIMARY KEY,
  pro_id TEXT NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('weekly', 'monthly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_jobs INTEGER NOT NULL DEFAULT 0,
  total_earnings DECIMAL(10,2) NOT NULL DEFAULT 0,
  avg_rating DECIMAL(3,2),
  on_time_percent DECIMAL(5,2),
  completion_rate DECIMAL(5,2),
  customer_return_rate DECIMAL(5,2),
  top_services JSONB DEFAULT '[]',
  improvement_areas JSONB DEFAULT '[]'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_demand_forecasts_pro ON pro_demand_forecasts(pro_id);
CREATE INDEX IF NOT EXISTS idx_demand_forecasts_zip ON pro_demand_forecasts(zip, forecast_date);
CREATE INDEX IF NOT EXISTS idx_customer_retention_pro ON pro_customer_retention(pro_id);
CREATE INDEX IF NOT EXISTS idx_earnings_goals_pro ON pro_earnings_goals(pro_id, status);
CREATE INDEX IF NOT EXISTS idx_route_plans_pro_date ON pro_route_plans(pro_id, plan_date);
CREATE INDEX IF NOT EXISTS idx_performance_analytics_pro ON pro_performance_analytics(pro_id, period);
