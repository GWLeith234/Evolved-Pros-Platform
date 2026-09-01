-- CRM prospect enrichment (SPRINT CRM-1b)
-- Adds contact enrichment fields, CASL consent tracking, keynote interest,
-- and an email suppression timestamp to crm_prospects.
--
-- Idempotent: every statement is IF NOT EXISTS. The inline CHECK constraints on
-- the enum-ish columns cannot themselves be guarded, but that is safe here —
-- ADD COLUMN IF NOT EXISTS skips the entire clause (constraint included) when
-- the column is already present, so a re-run never tries to re-add them.
--
-- Migration 075 is intentionally skipped: it is reserved for open PR #43.

ALTER TABLE crm_prospects
  ADD COLUMN IF NOT EXISTS title             TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url      TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url        TEXT,
  ADD COLUMN IF NOT EXISTS location          TEXT,
  ADD COLUMN IF NOT EXISTS tags              TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS consent_basis     TEXT NOT NULL DEFAULT 'unknown'
                             CHECK (consent_basis IN ('express', 'implied', 'unknown')),
  ADD COLUMN IF NOT EXISTS keynote_interest  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS enrichment_status TEXT NOT NULL DEFAULT 'none'
                             CHECK (enrichment_status IN ('none', 'pending', 'enriched', 'failed')),
  ADD COLUMN IF NOT EXISTS enriched_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS unsubscribed_at   TIMESTAMPTZ;

-- One prospect per email address, case-insensitive. Safe to add today because
-- the table is empty in production; if it ever runs against rows with
-- duplicate emails it will fail loudly rather than silently drop data.
CREATE UNIQUE INDEX IF NOT EXISTS uq_crm_prospects_email
  ON crm_prospects (lower(email));

-- Partial index for the keynote pipeline view — only the true rows are indexed.
CREATE INDEX IF NOT EXISTS idx_crm_prospects_keynote
  ON crm_prospects (keynote_interest)
  WHERE keynote_interest = true;

COMMENT ON COLUMN crm_prospects.consent_basis IS
  'CASL consent record: express (opted in), implied (existing business relationship), unknown (not established).';
COMMENT ON COLUMN crm_prospects.unsubscribed_at IS
  'Suppression timestamp — when set, never email this prospect regardless of stage, status or consent_basis.';
COMMENT ON COLUMN crm_prospects.tags IS
  'Free-form segmentation labels, lowercase, deduped by the API layer.';
COMMENT ON COLUMN crm_prospects.enrichment_status IS
  'Lifecycle of the automated enrichment job for this row: none → pending → enriched | failed.';
