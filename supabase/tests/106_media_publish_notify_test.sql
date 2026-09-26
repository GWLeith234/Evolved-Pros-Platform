-- Local proof for public.notify_media_published.
-- The runner has created the tables, inserted one already-published story,
-- and applied migration 106. Not production. Does not touch a hosted
-- database. Assertions use counts and slugs, never a dumped notification row.

-- Stories that were already published when the trigger was created stay quiet.
do $$
begin
  if (select count(*) from public.notifications) <> 0 then
    raise exception 'migration alerted a story that was already published';
  end if;
  if (select is_published from public.media_stories where slug = 'already-live') is not true then
    raise exception 'already-live row was rewritten by the migration';
  end if;
end $$;

insert into public.media_stories (title, slug, pillar, is_published) values
  ('Field note', 'flip-once', null, false),
  ('String null pillar', 'pillar-string-null', 'null', false),
  ('Empty pillar', 'pillar-empty', '', false),
  ('Strategy note', 'pillar-strategy', 'strategy', false),
  ('Still a draft', 'stays-draft', 'general', false),
  ('Guarded note', 'guarded', null, false),
  ('Role flip', 'role-flip', 'general', false);

-- Draft insert and a draft re-save do not alert.
update public.media_stories set title = 'Still a draft (saved)' where slug = 'stays-draft';

do $$
begin
  if (select count(*) from public.notifications) <> 0 then
    raise exception 'a draft insert or re-save created an alert';
  end if;
end $$;

-- false -> true alerts each active/trial non-admin once.
update public.media_stories set is_published = true where slug = 'flip-once';

create function pg_temp.media_alert_count(p_url text)
returns int
language sql
stable
as $$
  select count(*)::int
  from public.notifications
  where action_url = p_url
    and type = 'system_general'
    and title = 'New Media story';
$$;

do $$
declare
  n int;
begin
  n := pg_temp.media_alert_count('/media/general/flip-once');
  if n <> 2 then
    raise exception 'false to true inserted % alerts for flip-once, expected 2', n;
  end if;

  if exists (
    select 1
    from public.notifications nfn
    join public.users u on u.id = nfn.user_id
    where nfn.title = 'New Media story'
      and (
        u.role = 'admin'
        or u.tier_status is null
        or u.tier_status not in ('active', 'trial')
      )
  ) then
    raise exception 'a non-member or admin received a media alert';
  end if;

  if exists (
    select 1
    from public.notifications nfn
    join public.media_stories s
      on nfn.action_url = '/media/general/' || s.slug
    where s.slug = 'flip-once'
      and (
        nfn.type is distinct from 'system_general'
        or nfn.title is distinct from 'New Media story'
        or nfn.body is distinct from '**' || s.title || '** just dropped on Media.'
        or nfn.is_read is distinct from false
      )
  ) then
    raise exception 'flip-once alert copy did not match the media template';
  end if;
end $$;

-- Re-save of a published row, including writing is_published = true again, inserts 0.
update public.media_stories
set title = 'Field note (saved)', is_published = true
where slug = 'flip-once';

update public.media_stories
set pillar = 'general'
where slug = 'flip-once';

do $$
declare
  n int;
begin
  n := pg_temp.media_alert_count('/media/general/flip-once');
  if n <> 2 then
    raise exception 're-save of a published row changed the alert count to %', n;
  end if;
end $$;

-- Same-transaction follow-up used by an unattended publish script:
-- a 7-day NOT EXISTS insert sees the trigger rows and adds nothing.
insert into public.notifications (user_id, type, title, body, action_url, is_read)
select u.id,
       'system_general',
       'New Media story',
       '**Field note (saved)** just dropped on Media.',
       '/media/general/flip-once',
       false
from public.users u
where u.tier_status in ('active', 'trial')
  and u.role <> 'admin'
  and not exists (
    select 1
    from public.notifications nfn
    where nfn.user_id = u.id
      and nfn.type = 'system_general'
      and nfn.action_url = '/media/general/flip-once'
      and nfn.created_at >= now() - interval '7 days'
  );

-- ON CONFLICT DO NOTHING is the other safe shape if that script inserts
-- the same rows without the pre-filter.
insert into public.notifications (user_id, type, title, body, action_url, is_read)
select u.id,
       'system_general',
       'New Media story',
       '**Field note (saved)** just dropped on Media.',
       '/media/general/flip-once',
       false
from public.users u
where u.id in (
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002'
)
on conflict do nothing;

do $$
declare
  caught text := 'no-error';
  n int;
begin
  begin
    insert into public.notifications (user_id, type, title, body, action_url, is_read)
    values (
      '00000000-0000-4000-8000-000000000001',
      'system_general',
      'New Media story',
      '**Field note (saved)** just dropped on Media.',
      '/media/general/flip-once',
      false
    );
  exception
    when unique_violation then
      caught := sqlstate;
  end;
  if caught is distinct from '23505' then
    raise exception 'blind duplicate media alert returned %', caught;
  end if;
  n := pg_temp.media_alert_count('/media/general/flip-once');
  if n <> 2 then
    raise exception 'coexistence inserts changed the alert count to %', n;
  end if;
end $$;

-- A different title on the same user/type/action_url is not this index.
insert into public.notifications (user_id, type, title, body, action_url, is_read)
values (
  '00000000-0000-4000-8000-000000000001',
  'system_general',
  'Weekly WIG check-in',
  'not a media alert',
  '/media/general/flip-once',
  false
);

do $$
declare
  n int;
begin
  n := pg_temp.media_alert_count('/media/general/flip-once');
  if n <> 2 then
    raise exception 'a non-media title was counted as a media alert (% )', n;
  end if;
end $$;

-- Unpublish, then republish inside the 7-day window: still one alert each.
-- The partial unique index makes this permanent, stricter than the app's
-- 7-day pre-filter. Aging the original rows past 7 days must not open
-- a second alert either.
update public.media_stories set is_published = false where slug = 'flip-once';
update public.media_stories set is_published = true where slug = 'flip-once';

update public.notifications
set created_at = now() - interval '8 days'
where title = 'New Media story'
  and action_url = '/media/general/flip-once';

update public.media_stories set is_published = false where slug = 'flip-once';
update public.media_stories set is_published = true where slug = 'flip-once';

do $$
declare
  n int;
begin
  n := pg_temp.media_alert_count('/media/general/flip-once');
  if n <> 2 then
    raise exception 'republish after unpublish inserted a duplicate (% alerts)', n;
  end if;
end $$;

-- After the 7-day window the NOT EXISTS check would try again. ON CONFLICT
-- still makes that insert a no-op, which is how a later re-run stays safe.
insert into public.notifications (user_id, type, title, body, action_url, is_read)
select u.id,
       'system_general',
       'New Media story',
       '**Field note (saved)** just dropped on Media.',
       '/media/general/flip-once',
       false
from public.users u
where u.tier_status in ('active', 'trial')
  and u.role <> 'admin'
  and not exists (
    select 1
    from public.notifications nfn
    where nfn.user_id = u.id
      and nfn.type = 'system_general'
      and nfn.action_url = '/media/general/flip-once'
      and nfn.created_at >= now() - interval '7 days'
  )
on conflict do nothing;

do $$
declare
  n int;
begin
  n := pg_temp.media_alert_count('/media/general/flip-once');
  if n <> 2 then
    raise exception 'post-window on conflict insert changed the alert count to %', n;
  end if;
end $$;

-- Guarded update (is_published is not true) alerts once, and a second pass
-- changes zero rows.
update public.media_stories
set is_published = true
where slug = 'guarded' and is_published is not true;

update public.media_stories
set is_published = true
where slug = 'guarded' and is_published is not true;

do $$
declare
  n int;
begin
  n := pg_temp.media_alert_count('/media/general/guarded');
  if n <> 2 then
    raise exception 'guarded publish inserted % alerts, expected 2', n;
  end if;
end $$;

-- null -> true counts as unpublished to published.
update public.media_stories set is_published = null where slug = 'stays-draft';
update public.media_stories set is_published = true where slug = 'stays-draft';

do $$
declare
  n int;
begin
  n := pg_temp.media_alert_count('/media/general/stays-draft');
  if n <> 2 then
    raise exception 'null to true inserted % alerts, expected 2', n;
  end if;
end $$;

-- Pillar null, '', and 'null' all use /media/general. A real pillar is kept.
update public.media_stories set is_published = true where slug = 'pillar-string-null';
update public.media_stories set is_published = true where slug = 'pillar-empty';
update public.media_stories set is_published = true where slug = 'pillar-strategy';

do $$
declare
  n int;
begin
  n := pg_temp.media_alert_count('/media/general/pillar-string-null');
  if n <> 2 then
    raise exception 'pillar string null url inserted % alerts', n;
  end if;
  n := pg_temp.media_alert_count('/media/general/pillar-empty');
  if n <> 2 then
    raise exception 'empty pillar url inserted % alerts', n;
  end if;
  n := pg_temp.media_alert_count('/media/strategy/pillar-strategy');
  if n <> 2 then
    raise exception 'strategy pillar url inserted % alerts', n;
  end if;
  if pg_temp.media_alert_count('/media/null/pillar-string-null') <> 0
     or pg_temp.media_alert_count('/media//pillar-empty') <> 0 then
    raise exception 'pillar fallback wrote a literal null or empty segment';
  end if;
end $$;

-- Inserting a row that is already published alerts once. A second story
-- does not collide with the first story's action_url.
insert into public.media_stories (title, slug, pillar, is_published)
values ('Inserted live', 'insert-published', 'strategy', true);

do $$
declare
  n int;
begin
  n := pg_temp.media_alert_count('/media/strategy/insert-published');
  if n <> 2 then
    raise exception 'published insert inserted % alerts, expected 2', n;
  end if;
  if pg_temp.media_alert_count('/media/general/already-live') <> 0
     or pg_temp.media_alert_count('/media/strategy/already-live') <> 0 then
    raise exception 'already-live was alerted after the trigger existed';
  end if;
end $$;

-- Direct calls are not granted. The trigger still fires for service_role,
-- which is how admin Publish Now writes the row.
do $$
begin
  if has_function_privilege('anon', 'public.notify_media_published()', 'execute') then
    raise exception 'anon can execute notify_media_published';
  end if;
  if has_function_privilege('authenticated', 'public.notify_media_published()', 'execute') then
    raise exception 'authenticated can execute notify_media_published';
  end if;
  if has_function_privilege('service_role', 'public.notify_media_published()', 'execute') then
    raise exception 'service_role can execute notify_media_published';
  end if;
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'notify_media_published'
      and p.prosecdef
      and exists (
        select 1 from unnest(coalesce(p.proconfig, array[]::text[])) cfg
        where cfg like 'search_path=%public%'
      )
  ) then
    raise exception 'notify_media_published is missing security definer or search_path';
  end if;
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'media_stories_notify_published'
      and tgrelid = 'public.media_stories'::regclass
      and not tgisinternal
  ) then
    raise exception 'media_stories_notify_published trigger is missing';
  end if;
end $$;

grant usage on schema public to service_role;
grant select, update on public.media_stories to service_role;

set role service_role;
update public.media_stories set is_published = true where slug = 'role-flip';
reset role;

do $$
declare
  n int;
begin
  n := pg_temp.media_alert_count('/media/general/role-flip');
  if n <> 2 then
    raise exception 'service_role publish inserted % alerts, expected 2', n;
  end if;
  if exists (
    select 1
    from public.notifications nfn
    join public.users u on u.id = nfn.user_id
    where nfn.title = 'New Media story'
      and u.role = 'admin'
  ) then
    raise exception 'an admin received a media alert';
  end if;
end $$;
