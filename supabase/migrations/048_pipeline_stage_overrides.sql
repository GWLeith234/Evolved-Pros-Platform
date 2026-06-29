-- 048_pipeline_stage_overrides.sql — CRM pipeline manual stage overrides.
--
-- The admin pipeline view (app/api/admin/pipeline + app/(admin)/admin/pipeline)
-- lets an admin pin a member to a specific pipeline stage with a note,
-- overriding the auto-derived stage. The code (read + upsert onConflict
-- user_id) was shipped but the backing table was never created, so overrides
-- silently no-op. Create it idempotently. One override row per member.

CREATE TABLE IF NOT EXISTS public.pipeline_stage_overrides (
  user_id    UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  stage      TEXT NOT NULL CHECK (stage IN ('awareness', 'engaged', 'upgrade_ready', 'closed')),
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admin-only data. Writes/reads run through the service-role adminClient
-- (which bypasses RLS); the policy covers any non-service admin access and
-- denies everyone else. Keyed on public.users.role = 'admin'.
ALTER TABLE public.pipeline_stage_overrides ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pipeline_stage_overrides'
      AND policyname = 'admins_manage_pipeline_overrides'
  ) THEN
    CREATE POLICY admins_manage_pipeline_overrides ON public.pipeline_stage_overrides
      FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
      );
  END IF;
END $$;

GRANT ALL ON public.pipeline_stage_overrides TO authenticated;
