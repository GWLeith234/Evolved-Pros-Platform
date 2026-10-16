-- 108: member_directory was a security-definer view granted to every
-- authenticated caller. It projected full_name, bio, company, social URLs,
-- and goal_90day for every user, including goals the member marked private.
-- /api/members withholds those columns unless the session is The 99 (and
-- still hides a goal when goal_visible is false). PostgREST exposes this
-- view directly, so that check never ran.
--
-- Keep the column list so a client selecting * does not break. Null every
-- field the public directory payload withholds, and ship a first name only.
-- The entitled shape stays on /api/members (service role + directorySelect).

CREATE OR REPLACE VIEW public.member_directory
WITH (security_invoker = false, security_barrier = true) AS
SELECT
  id,
  CASE
    WHEN coalesce(nullif(btrim(display_name), ''), nullif(btrim(full_name), '')) IS NULL
      THEN NULL
    ELSE split_part(
      coalesce(nullif(btrim(display_name), ''), nullif(btrim(full_name), '')),
      ' ',
      1
    )
  END AS display_name,
  NULL::text AS full_name,
  avatar_url,
  banner_url,
  NULL::text AS bio,
  NULL::text AS company,
  role_title,
  location,
  tier,
  points,
  current_pillar,
  created_at,
  NULL::text AS linkedin_url,
  NULL::text AS twitter_handle,
  NULL::text AS website_url,
  NULL::text AS goal_90day,
  false AS goal_visible
FROM public.users;

COMMENT ON VIEW public.member_directory IS
  'Public roster only. Surname, bio, company, social URLs, and goals stay off this view. The 99 detail is served by /api/members after a tier and goal_visible check.';

REVOKE ALL ON public.member_directory FROM PUBLIC, anon;
GRANT SELECT ON public.member_directory TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
