-- Point Vendasta Evolution Partner at the official brand logo (white wordmark SVG).
UPDATE public.platform_ads
SET
  image_url  = '/sponsors/vendasta/logo-white.svg',
  updated_at = now()
WHERE id = 'c3d4e5f6-a7b8-9012-cdef-123456789012'
   OR lower(coalesce(sponsor_name, '')) = 'vendasta'
   OR lower(coalesce(tool_name, '')) = 'vendasta';
