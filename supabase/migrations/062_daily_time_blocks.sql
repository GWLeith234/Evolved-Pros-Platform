-- 062_daily_time_blocks.sql
-- Time-blocking for the Home "Today's Evolution" daily dashboard.
-- One row per planned block of time on a given day. Keyed on auth.users(id)
-- so RLS can gate directly on auth.uid() (same pattern as habits).

CREATE TABLE IF NOT EXISTS public.daily_time_blocks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  block_date  date NOT NULL DEFAULT current_date,
  start_time  text NOT NULL,               -- 'HH:MM' (24h, local to the member)
  end_time    text,                         -- optional 'HH:MM'
  label       text NOT NULL,
  category    text,                         -- optional pillar / context tag
  completed   boolean NOT NULL DEFAULT false,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_time_blocks_user_date
  ON public.daily_time_blocks (user_id, block_date);

-- set_updated_at() is defined in 029_episodes.sql.
DROP TRIGGER IF EXISTS daily_time_blocks_updated_at ON public.daily_time_blocks;
CREATE TRIGGER daily_time_blocks_updated_at
  BEFORE UPDATE ON public.daily_time_blocks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.daily_time_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own time blocks" ON public.daily_time_blocks;
CREATE POLICY "own time blocks"
  ON public.daily_time_blocks FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
