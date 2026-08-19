/* ============================================================================
   079 — Community media on posts and comments (SPRINT CM-1)

   Adds nullable media columns to the two community feed tables so a post or a
   comment can carry one attached asset.

   Scope note: CM-1 ships IMAGE only. The CHECK constraint already accepts
   'video' so CM-2 (video attach) needs no second migration.

   Safety:
     - Every column is nullable with no default and no backfill. Existing
       text-only rows keep rendering exactly as they do today.
     - ADD COLUMN IF NOT EXISTS + guarded constraint creation make this
       re-runnable.
     - public.discussion_posts (Academy lesson discussion) is deliberately
       untouched — it is not the community feed.
   ============================================================================ */

/* ---------- public.posts ---------- */

alter table public.posts add column if not exists media_url    text;
alter table public.posts add column if not exists media_kind   text;
alter table public.posts add column if not exists media_width   int;
alter table public.posts add column if not exists media_height  int;

/* ---------- public.replies (community comments) ---------- */

alter table public.replies add column if not exists media_url    text;
alter table public.replies add column if not exists media_kind   text;
alter table public.replies add column if not exists media_width   int;
alter table public.replies add column if not exists media_height  int;

/* ---------- media_kind domain: 'image' | 'video' | NULL ----------

   NULL means "no attachment", which is every row that exists today. Written as
   a guarded DO block because ADD CONSTRAINT has no IF NOT EXISTS form.
   ------------------------------------------------------------------ */

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'posts_media_kind_check'
  ) then
    alter table public.posts
      add constraint posts_media_kind_check
      check (media_kind is null or media_kind in ('image', 'video'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'replies_media_kind_check'
  ) then
    alter table public.replies
      add constraint replies_media_kind_check
      check (media_kind is null or media_kind in ('image', 'video'));
  end if;
end $$;

/* ---------- media_url / media_kind travel together ----------

   A row may have neither, or both. A url with no kind (or a kind with no url)
   would leave the feed unable to decide how to render it.
   ------------------------------------------------------------ */

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'posts_media_pair_check'
  ) then
    alter table public.posts
      add constraint posts_media_pair_check
      check ((media_url is null) = (media_kind is null));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'replies_media_pair_check'
  ) then
    alter table public.replies
      add constraint replies_media_pair_check
      check ((media_url is null) = (media_kind is null));
  end if;
end $$;

/* ---------- documentation ---------- */

comment on column public.posts.media_url    is 'Public URL of the single attached asset in the community-media bucket. NULL for text-only posts.';
comment on column public.posts.media_kind   is 'image | video. NULL when there is no attachment. CM-1 only writes image.';
comment on column public.posts.media_width  is 'Intrinsic pixel width, read server-side at upload. Lets the feed reserve space and avoid layout shift.';
comment on column public.posts.media_height is 'Intrinsic pixel height, read server-side at upload.';

comment on column public.replies.media_url    is 'Public URL of the single attached asset in the community-media bucket. NULL for text-only comments.';
comment on column public.replies.media_kind   is 'image | video. NULL when there is no attachment. CM-1 only writes image.';
comment on column public.replies.media_width  is 'Intrinsic pixel width, read server-side at upload.';
comment on column public.replies.media_height is 'Intrinsic pixel height, read server-side at upload.';
