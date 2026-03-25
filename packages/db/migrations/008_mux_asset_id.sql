-- Sprint 5 Addendum: Mux video integration
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS mux_asset_id TEXT;
CREATE INDEX IF NOT EXISTS idx_lessons_mux_asset ON lessons(mux_asset_id) WHERE mux_asset_id IS NOT NULL;
