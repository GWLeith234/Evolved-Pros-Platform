-- 104_et_member_prefs.sql
-- Per-member categories and the disclosure acknowledgement.
--
-- Depends on 103 (public.et_viewer_is_pro). Number 104 is the next free
-- slot after 103. 100 is open PR #178, 101 is on this branch, 102 is open
-- PR #191.
--
-- Not applied to the hosted project by this change.
-- Does not create watch-list symbol tables, a lapse table, or a purge job.
-- Category keys only. No quantity, shares, cost, basis, value, amount,
-- account, broker, or price paid columns.

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.et_member_categories_ok(cats text[], ord text[])
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT
    cats IS NOT NULL
    AND ord IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM unnest(cats) AS t(x) WHERE x IS NULL)
    AND NOT EXISTS (SELECT 1 FROM unnest(ord) AS t(x) WHERE x IS NULL)
    AND cats <@ ARRAY['ai', 'markets', 'tech', 'crypto', 'saas', 'ads']::text[]
    AND ord <@ ARRAY['ai', 'markets', 'tech', 'crypto', 'saas', 'ads']::text[]
    AND cats <@ ord
    AND ord <@ cats
    AND cardinality(cats) = (SELECT count(DISTINCT x) FROM unnest(cats) AS t(x))
    AND cardinality(ord) = (SELECT count(DISTINCT x) FROM unnest(ord) AS t(x));
$$;

COMMENT ON FUNCTION private.et_member_categories_ok(text[], text[]) IS
  'Ready category keys only: ai, markets, tech, crypto, saas, ads. Both arrays are the same set, with no duplicates.';

CREATE TABLE public.et_member_prefs (
  user_id             uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  categories          text[] NOT NULL DEFAULT '{}',
  category_order      text[] NOT NULL DEFAULT '{}',
  onboarded_at        timestamptz,
  disclosure_version  text,
  disclosure_ack_at   timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT et_member_prefs_categories_ok
    CHECK (private.et_member_categories_ok(categories, category_order)),
  CONSTRAINT et_member_prefs_disclosure_pair CHECK (
    (disclosure_version IS NULL AND disclosure_ack_at IS NULL)
    OR (disclosure_version IS NOT NULL AND disclosure_ack_at IS NOT NULL)
  ),
  CONSTRAINT et_member_prefs_disclosure_version_ok CHECK (
    disclosure_version IS NULL
    OR (
      char_length(disclosure_version) BETWEEN 1 AND 64
      AND disclosure_version ~ '^[A-Za-z0-9._:-]+$'
    )
  )
);

COMMENT ON TABLE public.et_member_prefs IS
  'Caller categories and disclosure acknowledgement. One row per member. No holding quantities.';

COMMENT ON COLUMN public.et_member_prefs.categories IS
  'Taxonomy keys the member selected.';

COMMENT ON COLUMN public.et_member_prefs.category_order IS
  'Same keys as categories, in the member display order.';

COMMENT ON COLUMN public.et_member_prefs.disclosure_version IS
  'Version token the member acknowledged. Not the disclosure text.';

COMMENT ON COLUMN public.et_member_prefs.disclosure_ack_at IS
  'When the member acknowledged that version.';

-- Append-only. Counts only, never category keys or names.
-- item_add, item_remove, item_stance, hidden_on_lapse, and purge are reserved
-- and have no writer in this migration.
CREATE TABLE public.et_member_audit (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action      text NOT NULL CHECK (action IN (
                'onboard',
                'prefs_update',
                'item_add',
                'item_remove',
                'item_stance',
                'export',
                'delete_all',
                'hidden_on_lapse',
                'purge'
              )),
  item_count  int,
  at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX et_member_audit_user_id_id_idx
  ON public.et_member_audit (user_id, id);

COMMENT ON TABLE public.et_member_audit IS
  'Append-only counts for the caller. No category keys and no holding names.';

CREATE OR REPLACE FUNCTION private.et_member_prefs_before()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'user_id is immutable' USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    NEW.created_at := OLD.created_at;
    NEW.updated_at := now();
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.et_member_prefs_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.et_member_audit (user_id, action, item_count)
    VALUES (NEW.user_id, 'onboard', cardinality(NEW.categories));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.et_member_audit (user_id, action, item_count)
    VALUES (NEW.user_id, 'prefs_update', cardinality(NEW.categories));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- A member delete writes delete_all. Account deletion cascades the user
    -- away first, so the audit insert has nowhere to land and is skipped.
    BEGIN
      INSERT INTO public.et_member_audit (user_id, action, item_count)
      VALUES (OLD.user_id, 'delete_all', cardinality(OLD.categories));
    EXCEPTION
      WHEN foreign_key_violation THEN
        NULL;
    END;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION private.et_member_prefs_audit() IS
  'Security definer so the member session can append audit without an INSERT grant.';

CREATE TRIGGER et_member_prefs_before
  BEFORE UPDATE ON public.et_member_prefs
  FOR EACH ROW
  EXECUTE FUNCTION private.et_member_prefs_before();

CREATE TRIGGER et_member_prefs_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.et_member_prefs
  FOR EACH ROW
  EXECUTE FUNCTION private.et_member_prefs_audit();

CREATE OR REPLACE FUNCTION private.et_member_audit_append(p_action text, p_item_count int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;

  IF p_action IS DISTINCT FROM 'export' THEN
    RAISE EXCEPTION 'audit_action_not_allowed' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.et_member_audit (user_id, action, item_count)
  VALUES (auth.uid(), p_action, p_item_count);
END;
$$;

REVOKE ALL ON FUNCTION private.et_member_audit_append(text, integer) FROM PUBLIC;
DO $$
DECLARE
  owner_name text;
BEGIN
  SELECT pg_get_userbyid(proowner)
    INTO owner_name
  FROM pg_proc
  WHERE pronamespace = 'private'::regnamespace
    AND proname = 'et_member_audit_append';

  EXECUTE format(
    'GRANT EXECUTE ON FUNCTION private.et_member_audit_append(text, integer) TO %I',
    owner_name
  );
END $$;

-- Definer so it can append the export audit row. Every read is filtered to
-- auth.uid(). Members have no INSERT grant on the audit table.
CREATE OR REPLACE FUNCTION public.et_member_export()
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n int := 0;
  payload jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;

  IF private.et_effective_tier() IS DISTINCT FROM 'pro' THEN
    RAISE EXCEPTION 'not_pro' USING ERRCODE = '42501';
  END IF;

  SELECT cardinality(p.categories)
    INTO n
  FROM public.et_member_prefs p
  WHERE p.user_id = auth.uid();

  IF NOT FOUND OR n IS NULL THEN
    n := 0;
  END IF;

  PERFORM private.et_member_audit_append('export', n);

  SELECT jsonb_build_object(
    'prefs', (
      SELECT jsonb_build_object(
        'user_id', p.user_id,
        'categories', to_jsonb(p.categories),
        'category_order', to_jsonb(p.category_order),
        'onboarded_at', p.onboarded_at,
        'disclosure_version', p.disclosure_version,
        'disclosure_ack_at', p.disclosure_ack_at,
        'created_at', p.created_at,
        'updated_at', p.updated_at
      )
      FROM public.et_member_prefs p
      WHERE p.user_id = auth.uid()
    ),
    'audit', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', a.id,
          'action', a.action,
          'item_count', a.item_count,
          'at', a.at
        )
        ORDER BY a.id
      )
      FROM public.et_member_audit a
      WHERE a.user_id = auth.uid()
    ), '[]'::jsonb)
  )
  INTO payload;

  RETURN payload;
END;
$$;

COMMENT ON FUNCTION public.et_member_export() IS
  'Caller only, and only while the caller is pro. jsonb keys prefs (object or null) and audit (array of id, action, item_count, at). Raises not_pro or not_authenticated.';

CREATE OR REPLACE FUNCTION public.et_member_delete_all()
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  n int;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.et_member_prefs
  WHERE user_id = auth.uid();

  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN jsonb_build_object('deleted_prefs', n);
END;
$$;

COMMENT ON FUNCTION public.et_member_delete_all() IS
  'Deletes the caller prefs row. Returns jsonb {deleted_prefs: integer}. Audit history stays, with a delete_all row. Allowed after the tier lapses.';

REVOKE ALL ON FUNCTION public.et_member_export() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.et_member_delete_all() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.et_member_export() TO authenticated;
GRANT EXECUTE ON FUNCTION public.et_member_delete_all() TO authenticated;

GRANT EXECUTE ON FUNCTION private.et_member_categories_ok(text[], text[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.et_member_prefs_before() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.et_member_prefs_audit() TO authenticated, service_role;

ALTER TABLE public.et_member_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.et_member_audit ENABLE ROW LEVEL SECURITY;

-- auth.uid() only. No admin policy and no private.viewer_user_ids().
CREATE POLICY et_member_prefs_select_own
  ON public.et_member_prefs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY et_member_prefs_insert_own
  ON public.et_member_prefs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.et_viewer_is_pro());

CREATE POLICY et_member_prefs_update_own
  ON public.et_member_prefs
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND public.et_viewer_is_pro());

CREATE POLICY et_member_prefs_delete_own
  ON public.et_member_prefs
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY et_member_audit_select_own
  ON public.et_member_audit
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

REVOKE ALL ON TABLE public.et_member_prefs FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.et_member_audit FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.et_member_prefs TO authenticated;
GRANT SELECT ON TABLE public.et_member_audit TO authenticated;
GRANT ALL ON TABLE public.et_member_prefs TO service_role;
GRANT ALL ON TABLE public.et_member_audit TO service_role;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name LIKE 'et_member\_%'
      AND column_name ~* '(quantity|shares|cost|basis|value|amount|account|broker|price_paid)'
  ) THEN
    RAISE EXCEPTION 'member tables must not store quantities';
  END IF;

  IF to_regclass('public.et_member_watch_items') IS NOT NULL
     OR to_regclass('private.et_member_lifecycle') IS NOT NULL
     OR to_regprocedure('private.et_member_purge_lapsed()') IS NOT NULL
     OR to_regprocedure('public.et_watch_universe(text)') IS NOT NULL THEN
    RAISE EXCEPTION 'watch list storage and the lapse purge are out of this migration';
  END IF;
END $$;
