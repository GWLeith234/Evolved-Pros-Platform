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

## Creative 2 — EVOLVED book launch

`book-300x250.html` / `book-728x90.html` (cover left + "EVOLVED / Launches
August 15" / George Leith / Pre-order, black+gold) and the portrait cover for
the podcast slot.

Real cover: `Branding/Evolved%20Book%20Cover.jpg` (Supabase Storage, public).
The banner HTML `<img class="cover">` now points at that URL — spaces MUST stay
percent-encoded (`%20`) or Storage 404s.

- **Podcast slot** renders the cover as a live `image_url` (platform_ads row
  `134800d3`), so it already uses the real cover on the server.
- **Baked banners** (`book-300x250.png`, `book-728x90.png`) still contain the
  earlier *reconstruction* — the build sandbox can't reach Storage, so re-run
  `render.js` from an env that can (a normal dev machine) to bake the real cover
  into the PNGs, then commit them.
