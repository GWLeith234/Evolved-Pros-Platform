/* Goals target_date + snapshot history.
   Prereq for HOME-2 home page redesign. Renumbered 043 -> 044
   because 043 was claimed by SPN-1 (sponsor_system) before this
   sprint landed. */

ALTER TABLE public.quarterly_goals
ADD COLUMN IF NOT EXISTS target_date DATE;

/* Backfill: derive target_date from period column.
   Live data uses two formats: 'Q1'..'Q4' (current-year quarter end)
   or 3-letter month abbreviations like 'MAY'/'JUN' (current-year
   last-of-month). The spec assumed 'Q1-YYYY' but the actual rows
   are bare quarters / months. Fall through to NULL on anything
   we don't recognise. */
UPDATE public.quarterly_goals SET target_date =
  CASE
    WHEN period = 'Q1' THEN make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 3,  31)
    WHEN period = 'Q2' THEN make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 6,  30)
    WHEN period = 'Q3' THEN make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 9,  30)
    WHEN period = 'Q4' THEN make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 12, 31)
    WHEN period LIKE 'Q1-%' THEN make_date(SUBSTRING(period FROM 4)::int, 3,  31)
    WHEN period LIKE 'Q2-%' THEN make_date(SUBSTRING(period FROM 4)::int, 6,  30)
    WHEN period LIKE 'Q3-%' THEN make_date(SUBSTRING(period FROM 4)::int, 9,  30)
    WHEN period LIKE 'Q4-%' THEN make_date(SUBSTRING(period FROM 4)::int, 12, 31)
    WHEN period IN ('JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC') THEN
      (DATE_TRUNC('month', make_date(
        EXTRACT(YEAR FROM CURRENT_DATE)::int,
        CASE period
          WHEN 'JAN' THEN 1  WHEN 'FEB' THEN 2  WHEN 'MAR' THEN 3
          WHEN 'APR' THEN 4  WHEN 'MAY' THEN 5  WHEN 'JUN' THEN 6
          WHEN 'JUL' THEN 7  WHEN 'AUG' THEN 8  WHEN 'SEP' THEN 9
          WHEN 'OCT' THEN 10 WHEN 'NOV' THEN 11 WHEN 'DEC' THEN 12
        END,
        1
      )) + INTERVAL '1 month - 1 day')::date
    ELSE NULL
  END
WHERE target_date IS NULL;

/* Snapshot history. One row per goal per snapshot_date so weekly
   captures stay idempotent under the unique key. */
CREATE TABLE IF NOT EXISTS public.goal_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.quarterly_goals(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  progress_pct NUMERIC(5,2) NOT NULL,
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (goal_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_goal_snapshots_goal_date
  ON public.goal_snapshots (goal_id, snapshot_date DESC);

ALTER TABLE public.goal_snapshots ENABLE ROW LEVEL SECURITY;

/* SELECT policy: user reads snapshots tied to their own goals.
   Uses the email-based join the existing quarterly_goals policy
   uses, so accounts with auth.uid() <> public.users.id (the
   documented platform drift) read correctly. */
DROP POLICY IF EXISTS goal_snapshots_select_own ON public.goal_snapshots;
CREATE POLICY goal_snapshots_select_own ON public.goal_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quarterly_goals g
      WHERE g.id = goal_snapshots.goal_id
        AND g.user_id = (
          SELECT u.id FROM public.users u
          WHERE u.email = (auth.jwt() ->> 'email')
        )
    )
  );

/* ALL (admin override). Cron writes via service role and bypasses
   RLS entirely; this policy is the in-app admin escape hatch. */
DROP POLICY IF EXISTS goal_snapshots_admin_all ON public.goal_snapshots;
CREATE POLICY goal_snapshots_admin_all ON public.goal_snapshots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
