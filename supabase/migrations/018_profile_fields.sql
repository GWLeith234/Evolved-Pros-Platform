ALTER TABLE public.users ADD COLUMN IF NOT EXISTS company        text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS linkedin_url   text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS website_url    text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS twitter_handle text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone          text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone_visible  boolean NOT NULL DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS current_pillar text CHECK (current_pillar IN ('p1','p2','p3','p4','p5','p6') OR current_pillar IS NULL);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS goal_90day     text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS goal_visible   boolean NOT NULL DEFAULT true;
