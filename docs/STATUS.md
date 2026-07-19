# Evolved Pros Platform — Engineering Status & Handoff

## Project
- **Product:** Evolved Pros — membership platform + public podcast/media presence for George Leith.
- **Stack:** Next.js 14.2 (App Router) · Supabase (`@supabase/ssr`) · Railway (deploy) · Turborepo (`apps/web`) · Tailwind.
- **Repo:** `GWLeith234/Evolved-Pros-Platform` · **working/deploy branch:** `claude/init-evolved-pros-platform-Q2oUw`
- **Supabase project:** `udbwrapkshfjkctylbmm` · public Storage bucket `Branding`.
- **Brand:** navy `#112535`, red `#EF0E30`, gold `#C79A3B`, ivory `#F5F0E8`; Playfair Display (serif) + Barlow Condensed (labels).

## ⚠️ Environment constraints the PM must know (they explain every "pending" item)
1. **The build/agent sandbox cannot reach the Supabase Storage host** (egress proxy returns 403). Consequences:
   - Real logo / guest faces / book cover / mic **can't be fetched or composited locally**, and **can't be uploaded to Storage** from the agent.
   - Anything that needs real Storage images is built to **render server-side on Railway** (where Storage *is* reachable) and can only be visually verified there.
2. **No Storage write access in-session** → new image creatives were committed to the **repo** (`apps/web/public/...`) and referenced by path, rather than uploaded to `Branding/`.
3. Standard CI gates run every change: **type-check, lint, `next build`** (all currently passing).

## Work completed this cycle (all on `…Q2oUw`)
| Area | What shipped | Status | Ref |
|---|---|---|---|
| Home cleanup | Removed EVENTS/PODCAST scoreboard tiles; removed "What's Next", "The Path Forward", "Today's Evolution" | Merged / done | PR #33, PR #35 |
| Podcast sponsor cards | Album-cover rotating "Evolution Partner" cards, 3:1 interleave, per-ad rotation; then 2:3 portrait aspect | Done | PR #34 (merged), PR #36 |
| Pricing truth | Public `/pricing` + membership now **catalogue-sourced** (products/prices), monthly/annual toggle; home post-count unified with profile via `countUserPosts` | Done | `08a53a2` |
| **Public SEO podcast** | `/podcast` + `/podcast/[slug]` moved out of the member auth guard → **public, server-rendered, indexable**: full transcript, chapters (YouTube deep-links), pull-quotes, JSON-LD (`PodcastEpisode`+`VideoObject`+`Breadcrumb`), dynamic sitemap, **RSS feed** `/podcast/rss.xml`. DB migration **068** (transcript/SEO columns). Seed script `pnpm episodes:seed`. | Done (data pending, see below) | `004dd0a`, `cdbf9a6` |
| Podcast "in-platform" | Public podcast renders **inside the member shell** when logged in, clean public header when logged out (never redirects) | Done | `3a4f8be` |
| Podcast index UI | Restored the rich editorial index (hero, album-cover grid, sponsor cards) on the now-public route | Done | `cf8f2ee` |
| Sponsor creatives | **Academy** (300×250, 728×90, 2:3 portrait) rendered with real logo + real pillar colors; **EVOLVED book** (300×250, 728×90, portrait); wired into `platform_ads`; migration **069** (adds `podcast` placement); **episode-page sponsor slots** | Done (book cover caveat below) | `6902bca`, `d764f1c`, `821b160` |
| Social-image generator | `/api/social/[template]` (Satori/`ImageResponse`): `text`/`guest`/`faceoff` × square + portrait, credibility badge, real logo/faces/mic server-side; `pnpm social:gen` batch script; `content/social-quotes.json` starter | Built, gates green; **visual verify pending on Railway** | `f4d965f` |

Episodes **1–4** (Dennis Yu, Carson Teagarden, Martin Scholz, Jim Thompson) enriched with real chapters, pull-quotes, tags, summaries.

## Open items / decisions needed (prioritized)
1. **Set `NEXT_PUBLIC_SITE_URL` in Railway** to the real brand domain. Canonical/OG/sitemap/RSS currently fall back to `https://evolvedpros.com`. *(Blocking clean SEO.)*
2. **Podcast transcripts are placeholders** — real two-speaker Descript exports aren't in yet, so episode pages show chapters + quotes + player with a "transcript coming soon" note. Drop finished payloads in `data/episodes/` and run `pnpm episodes:seed`.
3. **EVOLVED book cover on the ad creatives is a *reconstruction***, not the real file (couldn't fetch the real cover — Storage blocked). Provide the real cover *in the repo* and it re-renders exactly.
4. **Social generator needs live verification on Railway** (real logo/faces). Likely tuning after first real render: FaceOff mic-circle position, variable-Playfair weight, spacing.
5. **Podcast slug decision** — kept the existing long slugs (e.g. `dennis-yu-authority-content`) to avoid duplicate URLs; decide whether to rename to clean slugs (`dennis-yu`) + 301.
6. **Remaining episodes to seed:** `gib-olander`, `jamie-cohen`, `carson-heady` (payloads not yet supplied).
7. **Branch hygiene:** most recent work was committed **directly to the deploy branch** `…Q2oUw`; PRs **#35** and **#36** are older and open — confirm they're still needed / not superseded.
8. **Minor tech debt:** dead admin routes (`api/admin/revenue`, `api/admin/stats`) still hold stale `$79` MRR literals (unused; live admin already uses the catalogue). Recommend deletion.

## How to verify (post-deploy)
- **SEO podcast:** load `/podcast/<slug>` logged out → transcript/chapters in `view-source`; test JSON-LD in Google Rich Results; check `/sitemap.xml` + `/podcast/rss.xml`.
- **Ads:** confirm the Academy + book creatives render in the sidebar and the podcast rotation.
- **Social cards:** `SOCIAL_BASE_URL=https://platform.evolvedpros.com pnpm social:gen` (or hit `/api/social/text|guest|faceoff?...`).

## Migrations applied to Supabase this cycle
`068_episodes_seo_columns`, `069_platform_ads_placement_podcast` (both mirrored to `supabase/migrations/`).
