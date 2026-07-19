# Evolved Pros — Exec Status (1-page)

**Product:** membership platform + public podcast/media for George Leith.
**Stack:** Next.js 14 · Supabase · Railway. **Deploy branch:** `claude/init-evolved-pros-platform-Q2oUw`.
**Health:** type-check / lint / build all green; changes auto-deploy on push.

## Shipped this cycle
- **Public, SEO-indexable podcast** — `/podcast` + episode pages are now public and server-rendered with full transcript, chapters, pull-quotes, structured data, sitemap, and an RSS feed. Members still get the in-app experience.
- **Pricing truth** — public & in-app pricing now read from one source (the products/prices catalogue) with a monthly/annual toggle; home post-count now matches the profile.
- **Home cleanup** — cut redundant/duplicate sections and stat tiles.
- **Sponsor ad creatives** — Academy + EVOLVED book cards (300×250, 728×90, and portrait for podcast), wired into the ad rotation; sponsor slots added to episode pages.
- **Social-image generator** — one endpoint auto-produces on-brand LinkedIn/X cards (3 layouts × 2 sizes) from any quote/episode, using the real logo/faces. Human-in-the-loop; nothing auto-posts.

## Needs a decision or an asset (blocking full "done")
1. **Set the brand domain** (`NEXT_PUBLIC_SITE_URL`) in Railway — required for SEO/OG/RSS to point at the real site.
2. **Real podcast transcripts** — episodes currently show chapters + quotes + player with a "transcript coming soon" note until the finished exports are dropped in.
3. **Real EVOLVED book cover** — the ad uses a faithful *reconstruction* (the real file couldn't be reached from the build environment); provide the real cover to swap in.
4. **Verify social cards on the live site** — they can't be visually verified in the build sandbox (it can't reach image storage); confirm on Railway, minor tuning likely.

## Why some items say "verify on Railway"
The build/agent environment **can't reach Supabase image storage** (network policy). So anything using the real logo/faces/cover renders correctly **on the live server**, not in the sandbox — this is by design, not a bug.

## Next up
Seed remaining episodes (`gib-olander`, `jamie-cohen`, `carson-heady`) when their content lands; decide on clean podcast URLs; reconcile two older open PRs (#35, #36) against the direct-to-deploy commits.

*Full detail: `docs/STATUS.md`.*
