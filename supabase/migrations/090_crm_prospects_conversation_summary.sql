-- 090: Conversations AI conversation summary on CRM prospects.
-- Dedicated column so Ask George / Automation summaries are not only buried
-- in notes. Idempotent: ADD COLUMN IF NOT EXISTS.

ALTER TABLE public.crm_prospects
  ADD COLUMN IF NOT EXISTS conversation_summary TEXT;

COMMENT ON COLUMN public.crm_prospects.conversation_summary IS
  'Latest Conversations AI / Ask George conversation summary. Optional. AI George webhook also writes a labelled copy into notes.';
