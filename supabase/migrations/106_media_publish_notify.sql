-- 106_media_publish_notify.sql
-- Every media_stories publish alerts active/trial non-admin members once.
--
-- Numbered 106. 102_fit_video_private.sql and 105_private_weekly_reports.sql
-- are already on this branch. 100, 103, and 104 belong to open PRs #178,
-- #192, and #193. Do not apply this file to a hosted database from the PR.
--
-- Why a trigger: admin Publish Now is not the only writer. Agents publish
-- with SQL, and a later scheduler would too. The alert has to be in the
-- same transaction as the flip of is_published, or those paths stay silent.
--
-- Fires on INSERT when the new row is already published, and on UPDATE when
-- is_published goes from false/null to true. A re-save of a live row, a
-- view bump, or an edit that leaves is_published true does not insert.
-- Already-published rows are not updated here, so this file does not alert
-- stories that went live before the trigger existed.
--
-- Audience (single rule, two copies): tier_status in ('active','trial')
-- and role <> 'admin'. The app copy is MEMBER_ALERT_TIER_STATUSES /
-- MEMBER_ALERT_EXCLUDED_ROLE in apps/web/lib/notifications/intents.ts,
-- read by listActiveMemberIds(). Change both together.
--
-- Copy matches contentCopy('media', title): title 'New Media story',
-- body '**<title>** just dropped on Media.', type system_general.
-- action_url matches mediaStoryHref(): null, '', and the string 'null'
-- all become /media/general/<slug>.
--
-- Dedupe is permanent for this title, not the app's 7-day window. One
-- story alerts a member once, including unpublish then republish. That is
-- what "new content" means. Academy and LIVE stay on the 7-day pre-filter.
-- The partial index ignores every other notification title, so WIG and
-- daily rows are untouched.
--
-- ON CONFLICT DO NOTHING has no conflict target, so it swallows a unique
-- violation on this partial index (and any other unique index). A same-day
-- script that publishes with guarded SQL and then inserts the same alerts
-- with a 7-day NOT EXISTS check sees these rows and inserts nothing. If
-- that follow-up insert uses ON CONFLICT DO NOTHING, it is also a no-op.
-- A blind second insert of the same (user, type, action_url) with this
-- title raises unique_violation and rolls the statement back.
--
-- If the notification insert fails for any other reason, the publish fails
-- with it. That is intentional.
--
-- Down:
--   drop trigger if exists media_stories_notify_published on public.media_stories;
--   drop function if exists public.notify_media_published();
--   drop index if exists public.notifications_content_drop_uniq;

create unique index if not exists notifications_content_drop_uniq
  on public.notifications (user_id, type, action_url)
  where title = 'New Media story';

comment on index public.notifications_content_drop_uniq is
  'One New Media story alert per user, type, and action_url. Partial so other notification titles are unaffected.';

drop trigger if exists media_stories_notify_published on public.media_stories;

create or replace function public.notify_media_published()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_published and not coalesce(old.is_published, false) then
    insert into public.notifications (user_id, type, title, body, action_url, is_read)
    select u.id,
           'system_general',
           'New Media story',
           '**'||new.title||'** just dropped on Media.',
           '/media/'||coalesce(nullif(nullif(new.pillar, ''), 'null'), 'general')||'/'||new.slug,
           false
    from public.users u
    where u.tier_status in ('active', 'trial')
      and u.role <> 'admin'
    on conflict do nothing;
  end if;
  return new;
end;
$$;

revoke all on function public.notify_media_published() from public;
revoke all on function public.notify_media_published() from anon, authenticated, service_role;

comment on function public.notify_media_published() is
  'Trigger-only. Inserts one New Media story alert per active/trial non-admin when media_stories.is_published becomes true. Not granted to anon, authenticated, or service_role.';

create trigger media_stories_notify_published
  after insert or update of is_published
  on public.media_stories
  for each row
  execute function public.notify_media_published();
