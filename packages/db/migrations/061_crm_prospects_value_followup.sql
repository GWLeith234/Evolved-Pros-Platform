-- CRM enhancements: deal value + next follow-up date
ALTER TABLE crm_prospects
  ADD COLUMN IF NOT EXISTS value_monthly NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS next_follow_up_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_crm_prospects_follow_up
  ON crm_prospects(next_follow_up_at)
  WHERE next_follow_up_at IS NOT NULL;
