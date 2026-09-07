# EP-HOME-SIZZLE-2026-09-06

Conversion `/` only. ASK-ALWAYS. No merge. No ads on `/`. No keynote card.

## 1) Book card chrome (body HOLD)

- Label: The book
- Title: EVOLVED
- Cover: `/brand/book-cover.png`
- Release: `On Amazon Oct 15.`
- CTA: `Pre-order now` → `/evolved`
- Body: HOLD. Writer options pending. Chrome only. Do not invent paragraphs.

Files: `apps/web/lib/home/conversion.ts`, `apps/web/components/home/ConversionHome.tsx`, `apps/web/lib/home/conversion.test.ts`

## 2) Remove Official site line

- Drop trailing `Official site: https://www.evolvedpros.com/` and its link from What Evolved Pros is.
- Keep the rest of the must-cite paragraph.
- Locked cite string still holds the official URL for SEO/cite tests.

Files: `apps/web/lib/home/conversion.ts` (`homeWhatEvolvedProsCopy`), `apps/web/components/home/ConversionHome.tsx`, `apps/web/lib/seo/mustCite.test.ts`

## 3) Architecture hero crop

- Asset stays `/brand/hero-evolved-architecture.png` (GOLD cauldrons, locked MD5).
- `object-position: center 20%` plus a modest mobile scale so pillars and named Architecture elements sit above the paper gradient.
- No new brand art. If this crop is still short, next option is another still from the GOLD v4 cauldrons pack (hero-v4-cauldrons-02 is the current lock).

Files: `apps/web/lib/home/conversion.ts` (`HERO_IMAGE_OBJECT_POSITION`), `apps/web/components/home/ConversionHome.tsx`

## 4) Guest photos on Home

- Juan: `/podcast/guests/juan-fernandez.jpg` (square headshot)
- Quang: Supabase Branding `guest-mentorship-generational-gap-quang-do.jpg`
- Both use `object-position: center top` in aspect-video cards so faces stay readable.
- Other guests stay `center`. No new face files.

Files: `apps/web/lib/podcast/stillUrl.ts`, `apps/web/components/home/ConversionHome.tsx`, `apps/web/lib/podcast/stillUrl.test.ts`

## 5) Evolved Media section

- Label: Evolved Media
- Three newest published Media desk stories (title + `/media/...` href)
- All stories → `/media`
- Source: `getPublishedMediaStoriesForHub` (published, denylist-clean, `published_at` desc)
- Not podcast-only. Ads stay off `/`.

Files: `apps/web/app/(public)/page.tsx`, `apps/web/components/home/ConversionHome.tsx`, `apps/web/lib/home/conversion.ts`
