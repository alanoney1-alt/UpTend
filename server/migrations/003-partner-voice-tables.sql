-- Partner Voice System Tables
-- Migration: 003-partner-voice-tables.sql

-- Enable RLS on all tables
ALTER DEFAULT PRIVILEGES GRANT ALL ON TABLES TO service_role;

-- Partner phone numbers - each partner gets dedicated Twilio numbers
CREATE TABLE IF NOT EXISTS partner_phone_numbers (
  id SERIAL PRIMARY KEY,
  partner_slug TEXT NOT NULL,
  twilio_phone_number TEXT NOT NULL UNIQUE,
  twilio_phone_sid TEXT UNIQUE,
  greeting TEXT DEFAULT 'Hey, thanks for calling [Partner Name]. This is George, how can I help you today?',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Voice call logs - track every call with George
CREATE TABLE IF NOT EXISTS voice_call_logs (
  id SERIAL PRIMARY KEY,
  partner_slug TEXT,
  call_sid TEXT NOT NULL UNIQUE,
  caller_number TEXT,
  called_number TEXT,
  status TEXT DEFAULT 'in_progress',
  duration_seconds INTEGER,
  transcript TEXT,
  lead_created BOOLEAN DEFAULT false,
  lead_id INTEGER,
  job_created BOOLEAN DEFAULT false,
  job_id UUID,
  recording_url TEXT,
  total_cost NUMERIC(10,4) DEFAULT 0.0000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Voice conversation turns - conversation flow with George
CREATE TABLE IF NOT EXISTS voice_conversation_turns (
  id SERIAL PRIMARY KEY,
  call_sid TEXT NOT NULL,
  turn_number INTEGER NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('caller', 'george')),
  content TEXT NOT NULL,
  audio_url TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE partner_phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_conversation_turns ENABLE ROW LEVEL SECURITY;

-- RLS Policies - service_role can access all
CREATE POLICY "service_role_all_partner_phone_numbers" ON partner_phone_numbers 
  FOR ALL TO service_role USING (true);
  
CREATE POLICY "service_role_all_voice_call_logs" ON voice_call_logs 
  FOR ALL TO service_role USING (true);
  
CREATE POLICY "service_role_all_voice_conversation_turns" ON voice_conversation_turns 
  FOR ALL TO service_role USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_partner_phone_numbers_slug ON partner_phone_numbers(partner_slug);
CREATE INDEX IF NOT EXISTS idx_partner_phone_numbers_number ON partner_phone_numbers(twilio_phone_number);
CREATE INDEX IF NOT EXISTS idx_voice_call_logs_partner ON voice_call_logs(partner_slug);
CREATE INDEX IF NOT EXISTS idx_voice_call_logs_call_sid ON voice_call_logs(call_sid);
CREATE INDEX IF NOT EXISTS idx_voice_conversation_turns_call_sid ON voice_conversation_turns(call_sid);
CREATE INDEX IF NOT EXISTS idx_voice_conversation_turns_turn ON voice_conversation_turns(call_sid, turn_number);

-- Comments
COMMENT ON TABLE partner_phone_numbers IS 'Dedicated Twilio phone numbers for each HVAC partner';
COMMENT ON TABLE voice_call_logs IS 'Complete log of all voice calls handled by George';
COMMENT ON TABLE voice_conversation_turns IS 'Turn-by-turn conversation flow for each call';