-- Lock poll votes so they can only be written by increment_poll_vote(),
-- which POST /api/polls/vote calls with the session. This file is not
-- applied by the app.
--
-- "Anyone can vote" was INSERT WITH CHECK (true) for public. Combined with
-- table INSERT for anon and authenticated, the anon key could insert a
-- poll_votes row for any user_id. The writer the app uses is
-- increment_poll_vote(p_option_id), SECURITY DEFINER, owned by postgres
-- (the table owner), so it bypasses RLS and does not need an INSERT grant
-- for the caller. It records auth.uid(), never a body field.
--
-- Grants below are only anon and authenticated. service_role already has
-- SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on all
-- three tables and is left as it is. Admin poll routes, POST /api/posts,
-- and GET /api/polls/active (poll, options, and vote counts) use that role.
--
-- What the session and anon clients still need, from the app queries:
--   polls, poll_options: SELECT for public reads (policies "Public read
--     polls" and "Public read poll options" stay).
--   polls, poll_options: INSERT for authenticated, because POST /api/polls
--     inserts with the session client. RLS "Admin manage polls" / "Admin
--     manage poll options" still limits those inserts to admins.
--   poll_votes: SELECT for authenticated, because POST /api/polls/vote
--     reads the caller's existing row with the session client. The
--     "Public read vote counts" policy stays. Anon has no poll_votes query.

DROP POLICY IF EXISTS "Anyone can vote" ON public.poll_votes;

-- ── polls ──────────────────────────────────────────────────────────────────
REVOKE ALL ON TABLE public.polls FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.polls TO anon;
GRANT SELECT ON TABLE public.polls TO authenticated;
GRANT INSERT ON TABLE public.polls TO authenticated;

-- ── poll_options ───────────────────────────────────────────────────────────
REVOKE ALL ON TABLE public.poll_options FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.poll_options TO anon;
GRANT SELECT ON TABLE public.poll_options TO authenticated;
GRANT INSERT ON TABLE public.poll_options TO authenticated;

-- ── poll_votes ─────────────────────────────────────────────────────────────
REVOKE ALL ON TABLE public.poll_votes FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.poll_votes TO authenticated;

-- The definer function is the only remaining writer. Refuse a missing
-- session, an unknown option, and a poll that is not active or whose
-- closes_at is already due. One vote per user stays the unique
-- (poll_id, user_id) upsert. Signature stays (p_option_id uuid) so a
-- caller cannot pass a user id.
CREATE OR REPLACE FUNCTION public.increment_poll_vote(p_option_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $function$
declare
  v_poll_id uuid;
  v_status text;
  v_closes_at timestamptz;
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select o.poll_id, p.status, p.closes_at
    into v_poll_id, v_status, v_closes_at
  from public.poll_options o
  join public.polls p on p.id = o.poll_id
  where o.id = p_option_id;

  if v_poll_id is null
     or v_status is distinct from 'active'
     or (v_closes_at is not null and v_closes_at <= now()) then
    raise exception 'poll is not open' using errcode = '42501';
  end if;

  insert into public.poll_votes (poll_id, option_id, user_id)
  values (v_poll_id, p_option_id, v_user_id)
  on conflict (poll_id, user_id)
  do update set option_id = excluded.option_id, created_at = now();
end;
$function$;

REVOKE ALL ON FUNCTION public.increment_poll_vote(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_poll_vote(uuid) TO authenticated, service_role;
ALTER FUNCTION public.increment_poll_vote(uuid) SET search_path TO public;
