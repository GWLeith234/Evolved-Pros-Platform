# Follow-up tickets — HeyGen Transcripts sprint (2026-07-04)

Logged during the transcript-import sprint. None of these were fixed in the
sprint — they are intentionally deferred.

## FT-1 — Public Academy hub says "4 lessons" for Foundation (3 published)
`apps/web/app/(public)/media/academy/page.tsx` (lesson-count query around
line 88) counts ALL `lessons` rows per course with no `is_published = true`
filter, so Foundation's intentional draft lesson inflates the label to
"4 lessons". Same class of bug as the Academy-grid % fixed in `938ebae` —
one-line filter on the count query. (Member-side grid/pillar/rollup are
already published-only.)

## FT-2 — Precise timestamp seek requires Mux playback (HeyGen embeds have no seek API)
All 18 lesson videos play through `https://app.heygen.com/embeds/{id}`
iframes (`lessons.embed_url`); `mux_playback_id` is null everywhere and
`mux_asset_id` actually stores HeyGen video ids (see
`scripts/backfill-lesson-thumbnails.ts`). HeyGen publishes no postMessage/
URL seek API for these embeds, so transcript clicks on the iframe path
reload the embed with best-effort start-time hints (`?t=&start=` + `#t=`,
autoplay) — verify in QA whether HeyGen honors them; if not, the video
restarts from 0. The durable fix: migrate the 18 videos to Mux (upload
pipeline + admin UI + `MuxPlayer` with working `academy:seek` currentTime
seeking already exist) — then seeking is sample-accurate with zero further
frontend work.

## FT-3 — Lesson-specific Discussion prompts
Lesson pages show a generic discussion prompt; product wants per-lesson
prompts. Needs a CMS field + render wiring.

## FT-4 — Key Takeaways as a real CMS field
`LessonLayer.deriveTakeaways()` fabricates takeaways from the description
text (first sentences) with generic fallbacks. Should be an editable
`lessons` column managed in the admin form, like transcript now is.

## FT-5 — Housekeeping from the dead-code purge (5a7a117)
`components/academy/LessonNotes.tsx` (orphaned when LessonTabs was deleted)
and the now-unconsumed `EpisodeSummary` type in `lib/community/types.ts`
are safe one-line deletions.
