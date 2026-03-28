-- Add reaction_type to post_likes to support emoji reactions.
-- Existing rows (plain heart likes) default to 'thumbs_up' per sprint spec.
ALTER TABLE post_likes ADD COLUMN IF NOT EXISTS reaction_type varchar(20) DEFAULT 'thumbs_up';
