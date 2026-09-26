-- Local fixture for migration 106. Not production.
-- Minimal users, notifications, and media_stories so the publish trigger
-- can be applied. The already-published row is inserted BEFORE the
-- migration, and must stay silent.

create table public.users (
  id uuid primary key,
  email text not null unique,
  role text not null default 'member',
  tier_status text
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  type text not null check (type in (
    'community_reply', 'community_mention',
    'event_reminder', 'course_unlock',
    'system_billing', 'system_general')),
  title text not null,
  body text not null,
  action_url text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.media_stories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  pillar text,
  is_published boolean
);

insert into public.users (id, email, role, tier_status) values
  ('00000000-0000-4000-8000-000000000001', 'active-member@example.test', 'member', 'active'),
  ('00000000-0000-4000-8000-000000000002', 'trial-member@example.test', 'member', 'trial'),
  ('00000000-0000-4000-8000-000000000003', 'active-admin@example.test', 'admin', 'active'),
  ('00000000-0000-4000-8000-000000000004', 'trial-admin@example.test', 'admin', 'trial'),
  ('00000000-0000-4000-8000-000000000005', 'cancelled-member@example.test', 'member', 'cancelled'),
  ('00000000-0000-4000-8000-000000000006', 'expired-member@example.test', 'member', 'expired'),
  ('00000000-0000-4000-8000-000000000007', 'past-due-member@example.test', 'member', 'past_due'),
  ('00000000-0000-4000-8000-000000000008', 'null-tier-member@example.test', 'member', null);

-- Already published before the trigger exists. Users are present so a
-- hidden rewrite of this row would insert alerts and fail the proof.
insert into public.media_stories (title, slug, pillar, is_published)
values ('Already on the desk', 'already-live', 'strategy', true);
