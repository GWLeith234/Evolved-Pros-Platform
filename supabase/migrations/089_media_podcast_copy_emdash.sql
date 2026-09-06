-- 089 Media / podcast copy: leftover em dashes.
-- 086 culled media title/excerpt/seo_title/body and missed seo_description.
-- Episode titles, deks, and chapter titles were never culled.
-- Runtime stripEmDashCopy still guards RSS/new rows. This persists current copy.

UPDATE public.media_stories
SET
  seo_description = nullif(replace(replace(coalesce(seo_description, ''), ' — ', ', '), '—', ', '), ''),
  updated_at = now()
WHERE position('—' in coalesce(seo_description, '')) > 0;

UPDATE public.episodes
SET
  title = replace(replace(title, ' — ', '. '), '—', ', '),
  description = nullif(replace(replace(coalesce(description, ''), ' — ', ', '), '—', ', '), ''),
  summary = nullif(replace(replace(coalesce(summary, ''), ' — ', ', '), '—', ', '), ''),
  chapters = CASE
    WHEN chapters IS NULL OR jsonb_typeof(chapters) <> 'array' THEN chapters
    ELSE (
      SELECT coalesce(jsonb_agg(
        CASE
          WHEN jsonb_typeof(elem) = 'object' AND elem ? 'title'
          THEN jsonb_set(
            elem,
            '{title}',
            to_jsonb(replace(replace(coalesce(elem->>'title', ''), ' — ', ', '), '—', ', '))
          )
          ELSE elem
        END
      ), '[]'::jsonb)
      FROM jsonb_array_elements(chapters) AS elem
    )
  END
WHERE position(
  '—' in coalesce(title, '')
    || coalesce(description, '')
    || coalesce(summary, '')
    || coalesce(chapters::text, '')
) > 0;
