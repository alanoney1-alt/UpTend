-- Pro Invite Code System
-- Founding pro discount: 10% off platform fees for 30 days

-- ── pro_invite_codes ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pro_invite_codes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code              VARCHAR(64) UNIQUE NOT NULL,     -- uppercase, e.g. "LAKENONA10"
  discount_percent  INTEGER NOT NULL DEFAULT 10,     -- e.g. 10 means subtract 10 pp from fee
  duration_days     INTEGER NOT NULL DEFAULT 30,     -- how long discount lasts after redemption
  max_uses          INTEGER,                          -- NULL = unlimited
  current_uses      INTEGER NOT NULL DEFAULT 0,
  expires_at        TIMESTAMPTZ,                     -- NULL = never expires
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── pro_code_redemptions ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pro_code_redemptions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id              VARCHAR(255) NOT NULL REFERENCES hauler_profiles(id) ON DELETE CASCADE,
  code_id             UUID NOT NULL REFERENCES pro_invite_codes(id) ON DELETE RESTRICT,
  redeemed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  discount_expires_at TIMESTAMPTZ NOT NULL,
  discount_percent    INTEGER NOT NULL,
  UNIQUE (pro_id)  -- one redemption per pro
);

-- Index for fast pro lookup
CREATE INDEX IF NOT EXISTS idx_pro_code_redemptions_pro_id
  ON pro_code_redemptions (pro_id);

CREATE INDEX IF NOT EXISTS idx_pro_code_redemptions_expires
  ON pro_code_redemptions (discount_expires_at);

CREATE INDEX IF NOT EXISTS idx_pro_invite_codes_code
  ON pro_invite_codes (code);

-- ── Seed founding codes ───────────────────────────────────────────────────────
INSERT INTO pro_invite_codes (code, discount_percent, duration_days, max_uses, is_active)
VALUES
  ('LAKENONA10', 10, 30, 10,  TRUE),
  ('FOUNDING5',  10, 30,  5,  TRUE),
  ('UPTENDPRO',  10, 30, 20,  TRUE)
ON CONFLICT (code) DO NOTHING;
