-- Campaign send log + index cleanup (SPRINT EM-1)
--
-- campaign_sends is the audit trail for every campaign email attempt: what was
-- sent, to whom, under which campaign, and what happened. It is deliberately
-- append-only in practice — nothing in the app updates a row after insert — so
-- it can answer "did we email this person, and when" during a CASL complaint.
--
-- Idempotent throughout. Migration 075 is skipped: reserved for open PR #43.

CREATE TABLE IF NOT EXISTS campaign_sends (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- SET NULL rather than CASCADE: deleting a prospect must not erase the
  -- evidence that we emailed them. The email column keeps the record legible.
  prospect_id  UUID REFERENCES crm_prospects(id) ON DELETE SET NULL,
  email        TEXT NOT NULL,
  campaign_key TEXT NOT NULL,
  resend_id    TEXT,
  status       TEXT NOT NULL DEFAULT 'sent'
                 CHECK (status IN ('sent', 'failed', 'suppressed')),
  -- Code only. Provider/Postgres error MESSAGES can embed the recipient
  -- address; storing them here would defeat the PII discipline in the app.
  error_code   TEXT,
  sent_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_sends_campaign
  ON campaign_sends (campaign_key);

CREATE INDEX IF NOT EXISTS idx_campaign_sends_prospect
  ON campaign_sends (prospect_id);

-- Case-insensitive lookup: "have we ever emailed this address?" — the question
-- asked when someone complains, and they rarely type their address the same way.
CREATE INDEX IF NOT EXISTS idx_campaign_sends_email
  ON campaign_sends (lower(email));

-- Service-role only. Every write goes through adminClient in the app; there is
-- no member-facing read path, so RLS is on with no policies at all.
ALTER TABLE campaign_sends ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE campaign_sends IS
  'Audit trail of campaign email attempts (CASL evidence). Service-role only; no RLS policies. error_code holds codes only — never provider messages, which can embed the recipient address.';
COMMENT ON COLUMN campaign_sends.status IS
  'sent = handed to Resend; failed = provider rejected it; suppressed = we refused to send (unsubscribed, or consent_basis unknown).';

-- Drop 060's non-unique index on lower(email). Migration 076 added
-- uq_crm_prospects_email over the exact same expression, so this one has been
-- dead weight since: two identical btrees maintained on every write, and the
-- planner only ever needs the unique one. Dropping it is safe — the unique
-- index serves every lookup the old one did.
DROP INDEX IF EXISTS idx_crm_prospects_email;
