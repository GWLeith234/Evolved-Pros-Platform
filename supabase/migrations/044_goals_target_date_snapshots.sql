/*
  044_goals_target_date_snapshots.sql — GOALS-1

  Adds target_date to quarterly_goals and a goal_snapshots history table so the
  HOME-2 redesign can render real "X days remaining" plus week-over-week delta
  from captured progress (not just the live weekly_delta column on the goal row).

  Numbering: spec said "0XX (likely 044)". Highest existing migration on this
  branch is 043_sponsor_system.sql, so 044 is correct — no renumber.

  RLS note: spec literal SQL used auth.uid() against public.users, but spec
  rule #5 ("Always query public.users by email never auth UUID") and the
  existing 040_quarterly_goals.sql policy both lookup public.users by email
  out of auth.jwt(). Following rule #5 / the established codebase pattern
  here so snapshots match the parent goal's RLS path.
*/

/* ─── quarterly_goals.target_date ───────────────────────────────────────── */

ALTER TABLE public.quarterly_goals
  ADD COLUMN IF NOT EXISTS target_date DATE;

/* Backfill: derive target_date from period column.
   period format is 'Q1-YYYY' through 'Q4-YYYY'. Map to last day of quarter. */
UPDATE public.quarterly_goals SET target_date =
  CASE
    WHEN period LIKE 'Q1-%' THEN make_date(SUBSTRING(period FROM 4)::int, 3, 31)
    WHEN period LIKE 'Q2-%' THEN make_date(SUBSTRING(period FROM 4)::int, 6, 30)
    WHEN period LIKE 'Q3-%' THEN make_date(SUBSTRING(period FROM 4)::int, 9, 30)
    WHEN period LIKE 'Q4-%' THEN make_date(SUBSTRING(period FROM 4)::int, 12, 31)
    ELSE NULL
  END
WHERE target_date IS NULL;

/* ─── goal_snapshots ────────────────────────────────────────────────────── */

CREATE TABLE IF NOT EXISTS public.goal_snapshots (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id       UUID NOT NULL REFERENCES public.quarterly_goals(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  progress_pct  NUMERIC(5,2) NOT NULL,
  captured_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (goal_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_goal_snapshots_goal_date
  ON public.goal_snapshots (goal_id, snapshot_date DESC);

ALTER TABLE public.goal_snapshots ENABLE ROW LEVEL SECURITY;

/* SELECT: user reads snapshots for their own goals.
   Joins quarterly_goals -> public.users by email (codebase pattern). */
DROP POLICY IF EXISTS goal_snapshots_select_own ON public.goal_snapshots;
CREATE POLICY goal_snapshots_select_own ON public.goal_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.quarterly_goals g
      WHERE g.id = goal_snapshots.goal_id
        AND g.user_id = (
          SELECT id FROM public.users
          WHERE email = (auth.jwt()->>'email')
        )
    )
  );

/* ALL: admin role only — service_role bypasses RLS, so weekly cron writes
   never need a matching auth identity. This policy is for admin UI access. */
DROP POLICY IF EXISTS goal_snapshots_admin_all ON public.goal_snapshots;
CREATE POLICY goal_snapshots_admin_all ON public.goal_snapshots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE email = (auth.jwt()->>'email')
        AND role = 'admin'
    )
  );
