-- Own-row reads for poll_votes, plus the live poll RLS and grants.
--
-- NOT APPLIED. Nothing in the app or the test suite runs this file.
-- Do not apply it until George says yes. Do not db push.
--
-- Catalog this restates is the live database after migration 109
-- (read 2026-11-13): RLS on and not forced, the policies named below,
-- and the anon / authenticated / service_role grants. Those grants are
-- repeated so a re-run leaves them as they are. This file does not add
-- or remove a table privilege.
--
-- The one policy change is poll_votes SELECT. "Public read vote counts"
-- (SELECT to public, USING true) let any role that could query the table
-- read every vote. Aggregate counts in GET /api/polls/active already use
-- the service-role client, which bypasses RLS. POST /api/polls/vote reads
-- only the caller's row, and increment_poll_vote() writes auth.uid().

ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes NO FORCE ROW LEVEL SECURITY;

-- ── polls (live after 109; no WITH CHECK on the admin policy) ─────────────
DROP POLICY IF EXISTS "Public read polls" ON public.polls;
CREATE POLICY "Public read polls" ON public.polls
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Admin manage polls" ON public.polls;
CREATE POLICY "Admin manage polls" ON public.polls
  FOR ALL
  TO public
  USING ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = 'admin'::text)))));

-- ── poll_options (live after 109; no WITH CHECK on the admin policy) ──────
DROP POLICY IF EXISTS "Public read poll options" ON public.poll_options;
CREATE POLICY "Public read poll options" ON public.poll_options
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Admin manage poll options" ON public.poll_options;
CREATE POLICY "Admin manage poll options" ON public.poll_options
  FOR ALL
  TO public
  USING ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = 'admin'::text)))));

-- ── poll_votes ─────────────────────────────────────────────────────────────
-- Drop the live public read and the retired open insert, then create the
-- own-row policy. Drop-if-exists makes a second run a no-op.
DROP POLICY IF EXISTS "Public read vote counts" ON public.poll_votes;
DROP POLICY IF EXISTS "Anyone can vote" ON public.poll_votes;
DROP POLICY IF EXISTS "Read own poll vote" ON public.poll_votes;
CREATE POLICY "Read own poll vote" ON public.poll_votes
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ── grants (identical to the live catalog after 109) ──────────────────────
-- service_role already holds every table privilege. It is granted again
-- and is not revoked.
REVOKE ALL ON TABLE public.polls FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.polls TO anon;
GRANT SELECT, INSERT ON TABLE public.polls TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.polls TO service_role;

REVOKE ALL ON TABLE public.poll_options FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.poll_options TO anon;
GRANT SELECT, INSERT ON TABLE public.poll_options TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.poll_options TO service_role;

REVOKE ALL ON TABLE public.poll_votes FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.poll_votes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.poll_votes TO service_role;
