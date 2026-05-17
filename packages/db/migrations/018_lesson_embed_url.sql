-- Academy lessons: HeyGen (or other) iframe embed URL.
-- When set, the lesson player renders an <iframe src="embed_url"> instead of
-- the Mux player. Mux columns remain in place for legacy/Mux-hosted lessons.
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS embed_url TEXT;
