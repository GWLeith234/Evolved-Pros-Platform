ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS host_name text,
  ADD COLUMN IF NOT EXISTS host_role text,
  ADD COLUMN IF NOT EXISTS host_avatar_url text,
  ADD COLUMN IF NOT EXISTS price_cents integer,
  ADD COLUMN IF NOT EXISTS watermark text;
