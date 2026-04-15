-- Sprint SCHED-1: Post scheduler columns

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_posts_scheduled
  ON public.posts (scheduled_at, status)
  WHERE status = 'scheduled';
