-- Sprint M3: AI content engine columns on media_stories

ALTER TABLE media_stories ADD COLUMN IF NOT EXISTS ai_research_brief TEXT;
ALTER TABLE media_stories ADD COLUMN IF NOT EXISTS ai_draft TEXT;
ALTER TABLE media_stories ADD COLUMN IF NOT EXISTS seo_meta_description TEXT;
ALTER TABLE media_stories ADD COLUMN IF NOT EXISTS unsplash_photo_id TEXT;
ALTER TABLE media_stories ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

-- Add CHECK constraint only if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'media_stories_status_check'
  ) THEN
    ALTER TABLE media_stories ADD CONSTRAINT media_stories_status_check
      CHECK (status IN ('draft', 'review', 'published'));
  END IF;
END $$;
