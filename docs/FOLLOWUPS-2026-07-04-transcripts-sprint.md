# Follow-up tickets — HeyGen Transcripts sprint (2026-07-04)

Logged during the transcript-import sprint. None of these were fixed in the
sprint — they are intentionally deferred.

## FT-1 — RESOLVED (lesson-count cleanup sprint, 2026-07-04)
Original ticket claimed the public hub count lacked an `is_published`
filter — on inspection that was wrong: `(public)/media/academy/page.tsx`
filters published in both its featured-lesson and count queries, and every
member-facing count path has been published-only since `938ebae`. The "4
lessons / 75%" display was driven by a QA-debris draft row, now deleted:

- Deleted `lessons` row (full backup for recreation if ever needed):
  `{"id":"1191620a-1a92-4cb9-be86-52e2dbe474c2","course_id":"8e1f199f-077a-45eb-9c25-38c9b98d1adb","slug":"a5-qa-test-lesson","title":"A5 QA Test Lesson","description":null,"mux_asset_id":null,"mux_playback_id":null,"duration_seconds":null,"sort_order":1,"is_published":false,"created_at":"2026-03-31T00:21:30.449322+00:00","module_number":null,"lesson_type":"video","duration_minutes":null,"checkin_type":null,"event_id":null,"content_blocks":null,"embed_url":null,"thumbnail_url":null,"thumbnail_fetched_at":null,"transcript":null}`
- Evidence it was debris: QA-named, zero content fields, zero
  lesson_progress rows, created a month before the real Foundation
  lessons, duplicate sort_order 1.
- Hardening added in the same sprint: `fetchLessonBySlug` now filters
  `is_published = true`, closing the member deep-link path to drafts.

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
