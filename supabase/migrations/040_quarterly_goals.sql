CREATE TABLE public.quarterly_goals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  period text NOT NULL,
  progress_pct integer DEFAULT 0 CHECK (progress_pct >= 0 AND progress_pct <= 100),
  weekly_delta integer DEFAULT 0,
  pillar text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.quarterly_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own goals"
  ON public.quarterly_goals FOR ALL
  USING (user_id = (
    SELECT id FROM public.users
    WHERE email = (auth.jwt()->>'email')
  ));
