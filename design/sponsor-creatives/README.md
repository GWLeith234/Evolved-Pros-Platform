# Sponsor creatives

Reproducible sources for the Evolved Pros sponsor-card creatives. Rendered PNGs
ship from `apps/web/public/ads/` and are wired into `platform_ads.image_url`.

## Render

```
NODE_PATH=/path/to/repo/node_modules node design/sponsor-creatives/render.js
```

Requires Chromium (Playwright). Fonts (Playfair Display, Barlow Condensed,
Barlow) load from Google Fonts at render time. Output PNGs are 2× (retina) at
the exact 300:250 and 728:90 aspect ratios.

## Pillar colors (source of truth)

`courses.color_hex` is NULL in the DB; the assigned per-pillar colors live in
the repo at `apps/web/lib/pillar-colors.ts` (`PILLAR_CONFIG`). The Academy
six-bar / spectrum motif uses them in order:

| # | Pillar | Hex |
|---|--------|-----|
| 1 | Foundation | `#FFA538` |
| 2 | Identity | `#A78BFA` |
| 3 | Mental Toughness | `#F87171` |
| 4 | Strategy | `#60A5FA` |
| 5 | Accountability | `#C9A84C` |
| 6 | Execution | `#0ABFA3` |

## Creative 1 — Evolved Pros Academy ✅

`academy-300x250.html` / `academy-728x90.html`. Navy→black gradient, gold top
rule, real EP logo (`logo_horizontal_dark.png` — white wordmark), Playfair
headline "Six Pillars. No Ceiling.", Barlow sub, the six pillar colors (ascending
bars on 300×250, a full-width bottom spectrum on 728×90), gold "LEARN MORE" CTA.

## Creative 2 — EVOLVED book launch ⛔ blocked

Not produced here. The current cover art lives only in Supabase Storage
(`Branding/events/1775189542095-Evolved_V2 - Kindle eBook Cover .jpg`), and this
environment's egress proxy denies (403) all connections to the Supabase host, so
the cover bytes can't be fetched to composite into a raster creative — and the
brief says do NOT approximate the cover. To unblock: attach the cover PNG in
chat (then these templates can composite it), or render/upload externally.
