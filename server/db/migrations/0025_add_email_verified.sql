-- Add email_verified and email_verification_token to users table
-- These columns were in the Drizzle schema but missing from production DB
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_verification_token TEXT;
