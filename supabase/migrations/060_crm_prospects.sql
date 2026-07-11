-- CRM Prospects / Leads — lifecycle pipeline for admin
-- Stages: lead → prospect → community (free) → vip → professional

CREATE TABLE IF NOT EXISTS crm_prospects (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name         TEXT NOT NULL,
  email             TEXT NOT NULL,
  phone             TEXT,
  company           TEXT,
  notes             TEXT,
  stage             TEXT NOT NULL DEFAULT 'lead'
                      CHECK (stage IN ('lead', 'prospect', 'community', 'vip', 'professional')),
  status            TEXT NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active', 'contacted', 'nurture', 'won', 'lost')),
  source            TEXT,
  last_contacted_at TIMESTAMPTZ,
  -- Optional link when the prospect converts to a platform member
  user_id           UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by        UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_prospects_stage
  ON crm_prospects(stage);

CREATE INDEX IF NOT EXISTS idx_crm_prospects_email
  ON crm_prospects(lower(email));

CREATE INDEX IF NOT EXISTS idx_crm_prospects_status
  ON crm_prospects(status);

CREATE INDEX IF NOT EXISTS idx_crm_prospects_updated
  ON crm_prospects(updated_at DESC);

-- Admin-only access via service role / adminClient in API routes.
-- Enable RLS; no public policies (service role bypasses RLS).
ALTER TABLE crm_prospects ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE crm_prospects IS
  'Admin CRM: prospects & leads lifecycle (lead → prospect → community → vip → professional).';
