-- greeting_quotes table
CREATE TABLE IF NOT EXISTS public.greeting_quotes (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  quote        text        NOT NULL,
  pillar       text        CHECK (pillar IN ('p1','p2','p3','p4','p5','p6')),
  time_of_day  text        NOT NULL CHECK (time_of_day IN ('morning','midday','evening','any')),
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.greeting_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read quotes"
  ON public.greeting_quotes FOR SELECT
  TO authenticated
  USING (true);

-- Seed: 15 quotes in George's voice
INSERT INTO public.greeting_quotes (quote, pillar, time_of_day) VALUES

  -- Morning (3)
  ('The foundation you build in private determines the performance you deliver in public.', 'p1', 'morning'),
  ('How you start your morning is a vote for the identity you are choosing to build.', 'p2', 'morning'),
  ('Champions do not rise to the occasion. They fall to the level of their preparation.', 'p3', 'morning'),

  -- Midday (3)
  ('Strategy without execution is a daydream. Execution without strategy is a nightmare.', 'p4', 'midday'),
  ('The person who holds you accountable is not your enemy. They are your greatest ally.', 'p5', 'midday'),
  ('Midday is not the time for comfort. It is the time to ask whether your actions match your ambitions.', 'p6', 'midday'),

  -- Evening (3)
  ('Accountability is not punishment. It is the promise you make to who you are still becoming.', 'p5', 'evening'),
  ('Review your day not with shame but with strategy. What will tomorrow''s version of you do differently?', 'p6', 'evening'),
  ('The quiet hours are when champions are built. Guard them with intention.', 'p1', 'evening'),

  -- Any (6)
  ('Mental toughness is not the absence of fear. It is deciding your standard matters more than your comfort.', 'p3', 'any'),
  ('Your identity is the only competitive advantage no one can copy. Build it deliberately.', 'p2', 'any'),
  ('Every top performer has a system. The difference between them and everyone else is they actually follow it.', 'p4', 'any'),
  ('Accountability closes the gap between who you are and who you said you would be.', 'p5', 'any'),
  ('Spiritual strength is the root. Everything else is fruit. Feed the root.', 'p1', 'any'),
  ('Discipline is not deprivation. It is devotion to the future version of yourself.', 'p6', 'any');
