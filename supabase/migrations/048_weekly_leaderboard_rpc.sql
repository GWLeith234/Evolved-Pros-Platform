-- 048_weekly_leaderboard_rpc.sql — push the weekly leaderboard aggregation
-- into Postgres. Previously the app fetched every post from the last 7 days
-- and counted per-author in JS (full scan + memory spike on busy weeks).
--
-- This SQL function does the COUNT/GROUP BY/ORDER BY/LIMIT in the database and
-- joins the ranked authors' display info in one round-trip. The result is NOT
-- user-specific — the caller derives isCurrentUser from user_id client-side —
-- so it stays safe to cache/share.
--
-- Ranking signal: post count over the trailing 7 days (the same proxy the app
-- used), tie-broken by lifetime points. author_id is matched to users.id, which
-- mirrors the existing fetcher's `.in('id', topIds)` lookup.

CREATE OR REPLACE FUNCTION public.weekly_leaderboard(p_limit integer DEFAULT 5)
RETURNS TABLE (
  user_id      uuid,
  display_name text,
  full_name    text,
  avatar_url   text,
  points       integer,
  weekly_posts bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.display_name, u.full_name, u.avatar_url, u.points,
         COUNT(p.id) AS weekly_posts
  FROM public.posts p
  JOIN public.users u ON u.id = p.author_id
  WHERE p.created_at >= now() - interval '7 days'
  GROUP BY u.id, u.display_name, u.full_name, u.avatar_url, u.points
  ORDER BY weekly_posts DESC, u.points DESC
  LIMIT GREATEST(p_limit, 0);
$$;

GRANT EXECUTE ON FUNCTION public.weekly_leaderboard(integer)
  TO authenticated, anon, service_role;

-- Supports the WHERE created_at >= ... GROUP BY author_id scan.
CREATE INDEX IF NOT EXISTS posts_author_created_idx
  ON public.posts (author_id, created_at);
