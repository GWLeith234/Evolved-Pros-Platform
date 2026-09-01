-- 045_daily_habits.sql — Daily Pulse card support.
-- The habits and habit_completions tables already exist with FKs to auth.users
-- and a legacy column shape (title / pillar_ids / habit_stack_id). Bring them
-- in line with the DailyPulseCard contract idempotently and seed George's
-- defaults. Owner-of-row RLS keys on auth.uid() (FK target).

-- 1. habits: add name + pillar columns; backfill name from title.
ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS pillar TEXT;

UPDATE public.habits SET name = title WHERE name IS NULL AND title IS NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.habits WHERE name IS NULL) THEN
    BEGIN
      ALTER TABLE public.habits ALTER COLUMN name SET NOT NULL;
    EXCEPTION WHEN others THEN NULL;
    END;
  END IF;
END $$;

-- 2. habit_completions: relax legacy habit_stack_id, add habit_id FK.
ALTER TABLE public.habit_completions
  ALTER COLUMN habit_stack_id DROP NOT NULL;

ALTER TABLE public.habit_completions
  ADD COLUMN IF NOT EXISTS habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS habit_completions_habit_date_key
  ON public.habit_completions(habit_id, completed_date)
  WHERE habit_id IS NOT NULL;

-- 3. RLS — owner-of-row via auth.uid() (matches the FK target auth.users).
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='habits' AND policyname='users_own_habits'
  ) THEN
    CREATE POLICY users_own_habits ON public.habits
      FOR ALL USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='habit_completions' AND policyname='users_own_habit_completions'
  ) THEN
    CREATE POLICY users_own_habit_completions ON public.habit_completions
      FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;

GRANT ALL ON public.habits TO authenticated;
GRANT ALL ON public.habit_completions TO authenticated;

-- 4. Seed George's 3 default habits — keyed off auth.users.id (FK target).
INSERT INTO public.habits (user_id, title, name, pillar, sort_order, is_active)
SELECT u.id, h.name, h.name, h.pillar, h.sort_order, true
FROM auth.users u
CROSS JOIN (VALUES
  ('Morning audit',     'foundation',         1),
  ('90-min deep work',  'mental_toughness',   2),
  ('Pipeline review',   'strategy',           3)
) AS h(name, pillar, sort_order)
WHERE u.email = 'geoleith@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.habits hh
    WHERE hh.user_id = u.id AND hh.name = h.name
  );
