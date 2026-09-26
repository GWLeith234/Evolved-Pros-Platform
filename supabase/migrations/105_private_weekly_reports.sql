-- 105_private_weekly_reports.sql
-- Private weekly report PWAs. Allowlist and payloads live here, not in git.
--
-- Numbered 105 because 101 is on this branch and 100, 102, 103, 104 are
-- claimed by open PRs. Do not apply this to a hosted database from CI.
-- George applies it when he says YES.
--
-- anon and authenticated get no table privileges and no execute on the
-- RPCs. The Next server and the operator upsert script call the RPCs with
-- the service role. RLS is on with no policies, so a later grant still
-- returns zero rows for roles that do not bypass RLS.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to postgres, service_role;

create table if not exists private.report_viewers (
  user_id uuid primary key
);

create table if not exists private.weekly_reports (
  slug text primary key check (slug in ('adcellerant', 'evolved-pros', 'evolvex360', 'gwleith-money')),
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table private.report_viewers enable row level security;
alter table private.weekly_reports enable row level security;

revoke all on table private.report_viewers from public, anon, authenticated;
revoke all on table private.weekly_reports from public, anon, authenticated;
grant select, insert, update, delete on table private.report_viewers to service_role;
grant select, insert, update, delete on table private.weekly_reports to service_role;

-- Platform user ids for George Leith. User ids are not secrets.
insert into private.report_viewers (user_id) values
  ('930ce556-0b67-422e-a9fa-ca581db45a18'),
  ('09c059f1-241b-4a3d-9a43-b793ab3dc9ae'),
  ('c91b6edf-a655-4737-b6a8-4dcb746089ba')
on conflict (user_id) do nothing;

create or replace function public.report_viewer_allows(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = private, pg_temp
as $$
  select exists (
    select 1 from private.report_viewers where user_id = p_user_id
  );
$$;

create or replace function public.weekly_report_read(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = private, pg_temp
as $$
  select payload from private.weekly_reports where slug = p_slug;
$$;

create or replace function public.weekly_report_upsert(p_slug text, p_payload jsonb)
returns void
language plpgsql
security definer
set search_path = private, pg_temp
as $$
begin
  if p_slug not in ('adcellerant', 'evolved-pros', 'evolvex360', 'gwleith-money') then
    raise exception 'weekly_report_upsert: unknown slug' using errcode = 'check_violation';
  end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'weekly_report_upsert: payload must be a json object' using errcode = 'check_violation';
  end if;
  insert into private.weekly_reports (slug, payload, updated_at)
  values (p_slug, p_payload, now())
  on conflict (slug) do update
    set payload = excluded.payload,
        updated_at = now();
end;
$$;

revoke all on function public.report_viewer_allows(uuid) from public, anon, authenticated;
revoke all on function public.weekly_report_read(text) from public, anon, authenticated;
revoke all on function public.weekly_report_upsert(text, jsonb) from public, anon, authenticated;
grant execute on function public.report_viewer_allows(uuid) to service_role;
grant execute on function public.weekly_report_read(text) to service_role;
grant execute on function public.weekly_report_upsert(text, jsonb) to service_role;
