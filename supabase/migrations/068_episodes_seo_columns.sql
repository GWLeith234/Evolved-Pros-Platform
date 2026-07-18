-- Public SEO podcast pages: extend the EXISTING episodes table with the
-- transcript / SEO columns the public /podcast/<slug> pages need. Additive
-- only — the member podcast, admin sync, and Transistor/Mux fields keep
-- working on the existing columns. (episodes already exists with a different
-- shape, so CREATE TABLE IF NOT EXISTS would no-op; this ALTERs instead.)
ALTER TABLE public.episodes ADD COLUMN IF NOT EXISTS guest_bio           text;
ALTER TABLE public.episodes ADD COLUMN IF NOT EXISTS youtube_id          text;
ALTER TABLE public.episodes ADD COLUMN IF NOT EXISTS spotify_url         text;
ALTER TABLE public.episodes ADD COLUMN IF NOT EXISTS apple_url           text;
ALTER TABLE public.episodes ADD COLUMN IF NOT EXISTS location            text;
ALTER TABLE public.episodes ADD COLUMN IF NOT EXISTS summary             text;
ALTER TABLE public.episodes ADD COLUMN IF NOT EXISTS tags                text[] DEFAULT '{}';
ALTER TABLE public.episodes ADD COLUMN IF NOT EXISTS chapters            jsonb  DEFAULT '[]'::jsonb;
ALTER TABLE public.episodes ADD COLUMN IF NOT EXISTS pull_quotes         jsonb  DEFAULT '[]'::jsonb;
ALTER TABLE public.episodes ADD COLUMN IF NOT EXISTS transcript_text     text;
ALTER TABLE public.episodes ADD COLUMN IF NOT EXISTS transcript_segments jsonb  DEFAULT '[]'::jsonb;

-- Public anon read of published rows already exists (policy
-- published_episodes_public: FOR SELECT TO public USING (is_published = true)).
-- Add the covering index for index/sitemap/RSS queries.
CREATE INDEX IF NOT EXISTS episodes_published_idx ON public.episodes (is_published, published_at DESC);
