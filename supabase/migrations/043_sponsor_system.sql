/*
  043_sponsor_system.sql — SPN-1

  Creates the sponsor system: sponsors + sponsor_placements (junction to surfaces)
  + sponsor_impressions + sponsor_clicks tracking tables, with RLS so anon/auth
  can only read active sponsors and enabled placements, and admins have full
  CRUD. Service role bypasses RLS for server-side impression/click logging.

  Note on numbering: the original spec asked for 038_sponsor_system.sql, but
  038_episodes_dennis_yu_columns.sql is already applied on this branch and
  the latest migration is 042_events_tagline_cta.sql. Using 043 to stay
  monotonic and avoid clobbering an existing applied migration.

  Note on sponsor_placements: 032_community_foundation.sql created an unrelated
  flat-shape sponsor_placements table (sponsor_name / slogan / cta / accent_color
  ...) for an early ad concept. App code does not reference it (verified via
  grep across apps + packages). Drop and rebuild here under the new schema.
*/

/* ─── set_updated_at() helper (no-op if 029_episodes already created it) ─── */

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

/* ─── sponsors ──────────────────────────────────────────────────────────── */

CREATE TABLE IF NOT EXISTS public.sponsors (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  url             text,
  logo_url        text,
  brand_color     text,
  type            text NOT NULL DEFAULT 'sponsor'
                    CHECK (type IN ('sponsor', 'affiliate')),
  tagline         text,
  body_copy       text,
  cta_text        text,
  cta_url         text,
  status          text NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'paused', 'expired')),
  contract_start  date,
  contract_end    date,
  impression_cap  integer,
  commission_pct  numeric(5,2),
  tracking_id     text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS sponsors_updated_at ON public.sponsors;
CREATE TRIGGER sponsors_updated_at
  BEFORE UPDATE ON public.sponsors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

/* ─── sponsor_placements (rebuilt) ───────────────────────────────────────── */

DROP TABLE IF EXISTS public.sponsor_placements CASCADE;

CREATE TABLE public.sponsor_placements (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id  uuid NOT NULL REFERENCES public.sponsors(id) ON DELETE CASCADE,
  surface     text NOT NULL
                CHECK (surface IN ('home', 'rail', 'events', 'podcast', 'academy')),
  enabled     boolean NOT NULL DEFAULT true,
  weight      integer NOT NULL DEFAULT 1,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sponsor_placements_surface_enabled_idx
  ON public.sponsor_placements (surface, enabled);

DROP TRIGGER IF EXISTS sponsor_placements_updated_at ON public.sponsor_placements;
CREATE TRIGGER sponsor_placements_updated_at
  BEFORE UPDATE ON public.sponsor_placements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

/* ─── sponsor_impressions ────────────────────────────────────────────────── */

CREATE TABLE IF NOT EXISTS public.sponsor_impressions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placement_id  uuid NOT NULL REFERENCES public.sponsor_placements(id) ON DELETE CASCADE,
  user_id       uuid REFERENCES public.users(id) ON DELETE SET NULL,
  surface       text NOT NULL
                  CHECK (surface IN ('home', 'rail', 'events', 'podcast', 'academy')),
  rendered_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sponsor_impressions_placement_rendered_idx
  ON public.sponsor_impressions (placement_id, rendered_at);

/* ─── sponsor_clicks ─────────────────────────────────────────────────────── */

CREATE TABLE IF NOT EXISTS public.sponsor_clicks (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placement_id       uuid NOT NULL REFERENCES public.sponsor_placements(id) ON DELETE CASCADE,
  user_id            uuid REFERENCES public.users(id) ON DELETE SET NULL,
  surface            text NOT NULL
                       CHECK (surface IN ('home', 'rail', 'events', 'podcast', 'academy')),
  clicked_at         timestamptz NOT NULL DEFAULT now(),
  converted          boolean NOT NULL DEFAULT false,
  conversion_at      timestamptz,
  commission_amount  numeric(10,2)
);

CREATE INDEX IF NOT EXISTS sponsor_clicks_placement_clicked_idx
  ON public.sponsor_clicks (placement_id, clicked_at);

/* ─── RLS ────────────────────────────────────────────────────────────────── */

ALTER TABLE public.sponsors             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_placements   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_impressions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_clicks       ENABLE ROW LEVEL SECURITY;

/*
  Admin check pattern matches the rest of this repo (029_episodes.sql,
  026_onboarding_completed.sql): users.id = auth.uid() AND users.role = 'admin'.
  Also accepts auth.jwt() ->> 'role' = 'admin' so service-side flows that mint
  JWTs with the role claim work.
*/

/* sponsors — public can read active rows; admins full CRUD. */

DROP POLICY IF EXISTS "sponsors_select_active" ON public.sponsors;
CREATE POLICY "sponsors_select_active" ON public.sponsors
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

DROP POLICY IF EXISTS "sponsors_admin_all" ON public.sponsors;
CREATE POLICY "sponsors_admin_all" ON public.sponsors
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

/* sponsor_placements — public can read enabled rows; admins full CRUD. */

DROP POLICY IF EXISTS "sponsor_placements_select_enabled" ON public.sponsor_placements;
CREATE POLICY "sponsor_placements_select_enabled" ON public.sponsor_placements
  FOR SELECT
  TO anon, authenticated
  USING (enabled = true);

DROP POLICY IF EXISTS "sponsor_placements_admin_all" ON public.sponsor_placements;
CREATE POLICY "sponsor_placements_admin_all" ON public.sponsor_placements
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

/*
  sponsor_impressions / sponsor_clicks — anon + authenticated have NO read
  access. Service role bypasses RLS by design (server-side tracking), so no
  explicit INSERT policy is needed for the service-role client. Admins can
  read+write everything for analytics dashboards.
*/

DROP POLICY IF EXISTS "sponsor_impressions_admin_all" ON public.sponsor_impressions;
CREATE POLICY "sponsor_impressions_admin_all" ON public.sponsor_impressions
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "sponsor_clicks_admin_all" ON public.sponsor_clicks;
CREATE POLICY "sponsor_clicks_admin_all" ON public.sponsor_clicks
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );
