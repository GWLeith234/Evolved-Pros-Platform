-- 101_media_stories_publish_requires_hero.sql
-- Hard gate: a media story cannot become published without a featured image on this
-- project's public Branding storage. Fires on INSERT, and on UPDATE only when the row is
-- being published or its image is being changed while published, so view-count updates
-- on legacy rows never fail. Redirect stories are exempt (they render no page).
--
-- Numbered 101 because 100_tier_change_log_revoke_writes.sql is already on open PR #178.
-- Do not apply to production until George says YES.
create or replace function public.media_stories_require_hero()
returns trigger
language plpgsql
as $$
declare
  owned_prefix constant text :=
    'https://udbwrapkshfjkctylbmm.supabase.co/storage/v1/object/public/Branding/';
  img text := nullif(btrim(coalesce(new.featured_image_url, '')), '');
begin
  if new.is_published is not true or new.story_type = 'redirect' then
    return new;
  end if;
  if tg_op = 'UPDATE'
     and old.is_published is true
     and new.featured_image_url is not distinct from old.featured_image_url then
    return new;  -- already live, image untouched (views, copy edits)
  end if;
  if img is null then
    raise exception 'media_stories %: cannot publish without featured_image_url', new.slug
      using errcode = 'check_violation';
  end if;
  if left(img, length(owned_prefix)) <> owned_prefix or img ~ '\.\./' then
    raise exception 'media_stories %: featured_image_url must be an owned Branding storage URL', new.slug
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists media_stories_require_hero on public.media_stories;
create trigger media_stories_require_hero
  before insert or update of is_published, featured_image_url, story_type
  on public.media_stories
  for each row execute function public.media_stories_require_hero();
