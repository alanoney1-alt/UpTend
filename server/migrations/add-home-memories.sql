-- Home Memory: George's freeform memory about each customer's home
CREATE TABLE IF NOT EXISTS home_memories (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  customer_id VARCHAR NOT NULL,
  category TEXT NOT NULL, -- appliance, preference, issue, service_history, diy, home_detail, note
  fact TEXT NOT NULL,
  source TEXT DEFAULT 'conversation',
  confidence TEXT DEFAULT 'confirmed',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_home_memories_customer ON home_memories(customer_id);
CREATE INDEX IF NOT EXISTS idx_home_memories_category ON home_memories(customer_id, category);
