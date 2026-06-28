# Sprint 6 — Copy & label hygiene

- **Branch:** `fix/copy-hygiene`
- **Wave:** 1 (parallel with Sprints 3 and 4)
- **Depends on:** Sprint 2 (light — only for any formatted values in scope)
- **Risk:** Low
- **Codebase:** `apps/web/`

## Files in scope
- `components/home/WelcomeBanner.tsx` (hero attribution)
- `components/home/HomeSponsorRow.tsx`, `components/home/HomeSponsorAd.tsx`
- `components/home/ActivityFeed.tsx`
- Anywhere the author/brand name renders

---

## A6.1 — One author/brand name
**Problem:** The same person/brand appears as `GEORGE LEI`, `George Leith`, `GEORGE LEITH`, and
truncated `EVOLVED — GEOR`. The hero attribution reads `EVOLVED · EVOLVED — GEORGE LEITH` (doubled
"EVOLVED").
**Change:** Canonical display name `George Leith`; brand `EVOLVED`. Fix the doubled `EVOLVED ·
EVOLVED`. Where space forces truncation, ellipsize on word boundary with `…`, never mid-word
(`EVOLVED — Geo…`, not `GEOR`).
**Acceptance:** One spelling of the name; no doubled brand token; no mid-word truncation.

## A6.2 — De-duplicate and de-bug the sponsor ad
**Problem:** The sponsor row shows the **same ad twice, side by side**, with a divergent CTA
(`LEARN MORE →` vs `LEARN MORE → →`, a double-arrow bug) and divergent accent (teal vs gold), plus
the truncated title from A6.1.
**Change:** One `HomeSponsorAd` component, one CTA (`LEARN MORE →`, single arrow), one accent rule.
If the row is meant to hold multiple ads, show *different* ads; if it's one placement, render it once.
Fix the `→ →` (likely a label that already contains an arrow plus an appended icon).
**Acceptance:** No duplicated identical ad; single-arrow CTA; one accent rule; title not mid-word
truncated.

## A6.3 — Activity-feed icon taxonomy
**Problem:** Recent Activity uses a teal edit-box, a red dot, and an amber dot with no consistent
mapping (the dots also tie into the color sprint). The type → icon relationship isn't legible.
**Change:** Map activity type → icon/color once: post = edit glyph, event = calendar/red dot,
lesson = pillar-colored dot. Same glyph for the same type every time; "Posted in #general" context
line present on all post rows or none.
**Acceptance:** Each activity type has one consistent icon + color; context line policy is uniform.

**Sprint 6 done when:** names, sponsor placement, CTA arrows, and activity icons are all
single-source and bug-free.

---

## Tone / conventions
- Sentence case for body; ALL CAPS only for ≤3-word labels; em dashes over hyphens.
- Pillar colors come from `lib/pillar-colors.ts` — don't hardcode the lesson-dot color.
- Grep for the `→ →` double-arrow bug specifically.

## Regression checklist (run dark + light)
- [ ] One spelling of "George Leith"; no doubled "EVOLVED"; no mid-word truncation.
- [ ] Sponsor ad shown once (or genuinely different ads) with single-arrow CTA and one accent rule.
- [ ] Each activity type has one consistent icon + color; context-line policy uniform.
- [ ] Grep the home tree: no `' → →'` outside (nowhere); no console errors; no layout shift.
