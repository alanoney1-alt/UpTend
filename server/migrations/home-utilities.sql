-- Home Utilities & Municipal Data — Home Operating System
-- Tables for trash/recycling schedules, sprinkler settings, utility billing, home reminders

-- 1. Home Utility Profiles
CREATE TABLE IF NOT EXISTS home_utility_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Orlando',
  state TEXT NOT NULL DEFAULT 'FL',
  zip TEXT NOT NULL,
  county TEXT DEFAULT 'Orange',
  utility_provider JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_home_utility_profiles_customer ON home_utility_profiles(customer_id);

-- 2. Trash & Recycling Schedules
CREATE TABLE IF NOT EXISTS trash_recycling_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL,
  zip TEXT NOT NULL,
  trash_day TEXT,
  trash_frequency TEXT DEFAULT 'weekly' CHECK (trash_frequency IN ('weekly', 'biweekly')),
  recycling_day TEXT,
  recycling_frequency TEXT DEFAULT 'weekly' CHECK (recycling_frequency IN ('weekly', 'biweekly')),
  yard_waste_day TEXT,
  bulk_pickup_day TEXT,
  bulk_pickup_frequency TEXT DEFAULT 'monthly' CHECK (bulk_pickup_frequency IN ('monthly', 'quarterly', 'on_request')),
  holiday_exceptions JSONB DEFAULT '[]'::jsonb,
  provider TEXT,
  source TEXT DEFAULT 'customer_reported' CHECK (source IN ('municipal_api', 'scraped', 'customer_reported')),
  last_verified TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trash_schedules_customer ON trash_recycling_schedules(customer_id);
CREATE INDEX IF NOT EXISTS idx_trash_schedules_zip ON trash_recycling_schedules(zip);

-- 3. Sprinkler Settings
CREATE TABLE IF NOT EXISTS sprinkler_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL,
  system_type TEXT DEFAULT 'manual' CHECK (system_type IN ('manual', 'timer', 'smart')),
  zones JSONB DEFAULT '[]'::jsonb,
  water_restrictions JSONB DEFAULT '{}'::jsonb,
  rain_sensor_enabled BOOLEAN DEFAULT false,
  smart_controller_brand TEXT,
  connected_to_george BOOLEAN DEFAULT false,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sprinkler_customer ON sprinkler_settings(customer_id);

-- 4. Utility Billing
CREATE TABLE IF NOT EXISTS utility_billing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL,
  utility_type TEXT NOT NULL CHECK (utility_type IN ('electric', 'water', 'gas', 'sewer', 'trash')),
  provider TEXT,
  account_number TEXT,
  billing_cycle_day INTEGER,
  avg_monthly_amount DECIMAL(10,2),
  last_bill_amount DECIMAL(10,2),
  last_bill_date DATE,
  autopay_enabled BOOLEAN DEFAULT false,
  budget_billing BOOLEAN DEFAULT false,
  alerts JSONB DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_utility_billing_customer ON utility_billing(customer_id);

-- 5. Home Reminders
CREATE TABLE IF NOT EXISTS home_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN (
    'trash', 'recycling', 'yard_waste', 'sprinkler_adjust', 'filter_change',
    'bill_due', 'bulk_pickup', 'pest_control', 'lawn_treatment'
  )),
  title TEXT NOT NULL,
  description TEXT,
  frequency TEXT DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'seasonal', 'custom')),
  next_due_date DATE,
  time TEXT DEFAULT '7:00 PM',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_home_reminders_customer ON home_reminders(customer_id);
CREATE INDEX IF NOT EXISTS idx_home_reminders_due ON home_reminders(next_due_date) WHERE enabled = true;
