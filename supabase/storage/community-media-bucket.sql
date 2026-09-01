/* ============================================================================
   STORAGE BUCKET — community-media (SPRINT CM-1)

   NOT a migration. Apply this by hand (Supabase SQL editor or the connector)
   BEFORE 079 goes live, or the first attach will fail with "Bucket not found".

   Deliberately a separate bucket from "Branding" (capital B): Branding is
   admin/brand-asset territory with no mime allowlist and no size ceiling.
   Member-generated feed media needs both.

   Ceiling vs rule:
     file_size_limit here is 100 MB because CM-2 adds video to the same bucket.
     The 10 MB IMAGE cap is enforced in the API route
     (apps/web/lib/community/media.ts), not here. The bucket cap is the
     backstop, not the image rule.
   ============================================================================ */

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'community-media',
  'community-media',
  true,
  104857600,
  array['image/png', 'image/jpeg', 'image/webp', 'video/mp4', 'video/webm']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

/* ---------- RLS on storage.objects ----------

   Read is public: feed images are public content, and the feed renders them
   as plain <img> src with no signed-url round trip.

   Write is own-prefix only: a member may only create objects under
   community-media/{their auth.uid()}/..., which is exactly the path the API
   route builds. Mirrors the posts/replies INSERT policies
   (with_check: auth.uid() = author_id).

   No UPDATE policy and no DELETE policy for members — objects are never
   overwritten (each upload gets a fresh uuid filename) and cleanup is a
   service-role job.
   -------------------------------------------- */

drop policy if exists "community_media_public_read" on storage.objects;
create policy "community_media_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'community-media');

drop policy if exists "community_media_member_insert" on storage.objects;
create policy "community_media_member_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'community-media'
    and (storage.foldername(name))[1] = (auth.uid())::text
  );
