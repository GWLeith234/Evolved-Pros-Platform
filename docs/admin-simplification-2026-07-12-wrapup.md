# Admin Simplification — Session Wrap-Up

**Date:** July 12, 2026
**Surface:** `/admin/*` (admin shell, ad management, lesson CMS, media)
**Branch / target:** `claude/evolution-partner-cards-2rxi2a` → `claude/init-evolved-pros-platform-Q2oUw` (integration/deploy branch)
**Status:** ✅ All five sprints complete and merged

---

## Objective

Simplify and de-risk the admin section for launch. The admin had accumulated
dead routes, two parallel editors for the same data (ads, and Academy vs.
Courses), a write-only authoring surface, and AI content-generation flows we
want to defer. Each unit of work was scoped to a single sprint and landed as its
**own merge commit** so any one can be reverted independently without unwinding
the others.

Guiding constraints, held throughout:
- **No Supabase schema changes** — no `ALTER TABLE`, no dropped columns, no
  deleted rows. Everything stays reversible and member-facing reads keep working.
- **No change to member-facing rendering** (media / academy / home).
- **One sprint = one commit = one revert.** Merged as merge commits (not squash)
  to preserve the individual commit for `git revert`.
- `next build` must pass before each merge.

---

## What shipped

| Sprint | Outcome | PR | Merge commit (revert SHA) |
|--------|---------|----|---------------------------|
| **1 — Delete dead admin routes** | Removed unused admin surfaces (`/admin/content`, `/admin/content-pipeline`, `/admin/scheduler`, `/admin/partners/preview`) + their components and content-pipeline-exclusive API subroutes. Kept the live `/admin/pipeline` kanban and its base API (a pre-flight assumption that they were dead proved wrong). | [#26](https://github.com/GWLeith234/Evolved-Pros-Platform/pull/26) | `25bd1a5` |
| **2 — Collapse the two ad editors** | `/admin/ads` is now one screen with two tabs: **Banner Zones (A/B/C)** (zone model) and **Sidebar / Endorsement Placements** (placement model, extracted from Branding). Branding keeps only logos, colors, appearance, and profile banners. No data-model change — both ad models still live in `platform_ads` and both still render for members. | [#27](https://github.com/GWLeith234/Evolved-Pros-Platform/pull/27) | `b3aef35` |
| **3 — Merge Academy + Courses into one lesson CMS** | The Courses lesson editor (`LessonForm`) became the single editor, adding content-block editing alongside video/publish/metadata via one save. Removed the `/admin/academy` route tree, the orphaned `/content` API, and the "Academy" sidebar link. | [#28](https://github.com/GWLeith234/Evolved-Pros-Platform/pull/28) | `cfc1aac` |
| **3.5 — Cut the write-only content-blocks editor** | Confirmed no member page renders `lessons.content_blocks` — it was write-only. Removed the editor UI (and the deleted `ContentBlocksEditor` component). **Column and rows left intact**; the API still whitelists the field, so this is fully reversible. | [#29](https://github.com/GWLeith234/Evolved-Pros-Platform/pull/29) | `a10fd31` |
| **4 — Defer AI + nav/theming QA** | Removed the media AI surfaces: deleted `/admin/media/ai`, the "AI Engine" button, `StoryAIWriter`, and the orphaned AI endpoints (`media/research`, `media/draft`, `ai/write-story`). New Story is now manual-only. Fixed a dark-on-light contrast bug in the CRM board. Reviewed the sidebar — no orphans. | [#30](https://github.com/GWLeith234/Evolved-Pros-Platform/pull/30) | `16d1c3a` |

To revert any one sprint: `git revert <merge commit>` from the table above.

---

## User-facing impact (admin)

- **One place per job.** Ads: a single `/admin/ads` with two clearly labeled
  tabs instead of an ad editor hidden inside Branding. Lessons: a single Courses
  editor instead of Academy and Courses editing the same rows from two screens.
- **Less to get lost in.** Dead routes and AI flows removed; the sidebar's every
  link now resolves to a live page (16 admin routes, no orphans).
- **CRM board is legible.** Board headings/labels previously rendered near-white
  on the light `#faf9f7` admin background in the default dark theme; they now use
  the same light color literals as the rest of the admin.
- **Manual media authoring intact.** New Story still saves via
  `POST /api/admin/media` and appears in the list.

No member-facing surface changed in any sprint.

---

## Why the "no schema change" rule mattered

Two editors and one dropped feature all share tables that members still read:

- `platform_ads` carries **both** the zone model (A–D banner zones) and the
  placement model (sidebar/endorsement). Sprint 2 relocated UI only; both models
  still render on the member side (right rail, home row/sidebar, community,
  academy, media zones).
- `lessons.content_blocks` is now edited by **no** UI (Sprint 3.5), but the
  column and all rows are untouched and the API still accepts the field, so the
  editor can be restored by revert alone.

---

## Quality & verification

- **Build:** `next build` compiled successfully after every sprint (all routes
  type-check and compile).
- **Grep gates:** each sprint's definition-of-done grep passed (e.g. no
  `platform_ads` CRUD left in Branding; no `ContentBlocksEditor`/`content_blocks`
  editor UI remaining; `/admin/media/ai` and the AI media routes gone from the
  route table).
- **Independent revertibility:** confirmed via merge-commit strategy; SHAs in the
  table above.

---

## Risks & follow-ups

1. **⚠️ `ProgressBar` / `ProgressCircle` are imported but not exported from
   `@evolved-pros/ui`.** This is the one concrete latent runtime bug surfaced by
   the build (it appears as a barrel-optimize warning on every build). At runtime
   the missing exports resolve to `undefined`, risking a React "Element type is
   invalid" crash. **Member-side only** (out of scope for this admin work):
   `components/scoreboard/ScoreboardHero`, `components/home/InProgressPillarHero`,
   `AcademyProgressWidget`, `AccountabilityHub`, `GoalCard`, and
   `components/academy/CourseCard`. **Recommend a dedicated `packages/ui` export
   fix** — those progress widgets may be blank/broken in production today.
2. **Live smoke tests deferred to preview deploy.** These require real auth +
   Supabase (and Mux for lessons), which the build environment doesn't have:
   - Sprint 2: create one zone ad + one placement ad, confirm each shows in its
     member slot.
   - Sprint 3: edit a lesson with a content block + Mux video, reload the member
     academy page.
   - Sprint 4: full admin click-through for console/hydration errors.
3. **Railway logs not checked.** The "check Railway logs before any fix" step
   could not be run from this environment (no access). None of these sprints were
   bug-fixes, so it wasn't blocking — but flag it for anything driven by a
   production error.
4. **`content_blocks` column now fully unused by UI.** Left in place intentionally
   for reversibility. If the authoring feature is truly abandoned post-launch, a
   future migration could drop the column and the API whitelist entry — a separate,
   deliberate schema change, not part of this reversible set.
5. **Deferred AI is media-only.** `write-event` / `write-episode` endpoints and
   their editors in Events/Episodes admin were intentionally left untouched. If a
   full platform-wide AI freeze is wanted for launch, that's a follow-up.

---

## Links

- **PRs:** [#26](https://github.com/GWLeith234/Evolved-Pros-Platform/pull/26) ·
  [#27](https://github.com/GWLeith234/Evolved-Pros-Platform/pull/27) ·
  [#28](https://github.com/GWLeith234/Evolved-Pros-Platform/pull/28) ·
  [#29](https://github.com/GWLeith234/Evolved-Pros-Platform/pull/29) ·
  [#30](https://github.com/GWLeith234/Evolved-Pros-Platform/pull/30)
- **Integration branch:** `claude/init-evolved-pros-platform-Q2oUw`
