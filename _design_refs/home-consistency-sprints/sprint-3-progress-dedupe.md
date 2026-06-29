# Sprint 3 — De-duplicate progress & pillar representations

- **Branch:** `fix/progress-dedupe`
- **Wave:** 1 (parallel with Sprints 4 and 6)
- **Depends on:** Sprint 2 (`formatPct`) and the existing `lib/pillars.ts`
- **Risk:** Medium (multiple components read one model)
- **Codebase:** `apps/web/`

The 6-pillar EVOLVED Architecture and the Foundation lesson progress are each rendered several
times, in different orders, labels, and metrics that don't agree.

## Files in scope
- `components/home/WelcomeBanner.tsx` (architecture strip + "Path Forward" stepper)
- `components/home/PillarJourneyStrip.tsx` and/or `components/home/AcademyProgressWidget.tsx`
  (the lower "Path Forward" progress bars)
- `components/home/InProgressPillarHero.tsx` (Foundation / current-pillar card)
- `lib/pillars.ts` — **reuse / extend** as the single `PILLARS` source `[{n, name, abbr, pct}]`

---

## A3.1 — One pillar model, one order, one label set
**Problem:** The pillars appear in ≥3 places with drifting presentation:
- Hero "THE ARCHITECTURE" mini-list: `FOUNDTN.` `IDENTITY` `MENTAL` `STRATEGY` `ACCOUNT.` `EXEC.`
  — mixes truncated with full labels.
- "THE PATH FORWARD" stepper: circles `1–6`, no labels.
- Lower "PATH FORWARD" bars: only `Foundation` / `Execution` / `Identity` (3 of 6) and in pillar
  order 1, 6, 2 — not 1–6.
**Change:** Source all three from one `PILLARS` array.
- One label policy: full names where space allows; if abbreviating, abbreviate **all six** with one
  scheme — don't truncate three and spell out three.
- One canonical order: `1 Foundation → 6 Execution`, always ascending. The lower bars must list
  pillars in the same order (or, if intentionally "top 3 by progress," label it that and show it
  consistently).
- Percentages come from the shared model, formatted by `formatPct`.
**Acceptance:** Pillar name, order, and abbreviation are identical across the hero strip, stepper,
and progress bars; all driven by one array.

## A3.2 — Reconcile the Foundation card's three metrics
**Problem:** The Foundation card simultaneously shows `DAY 21 OF 21`, `2 of 3 lessons`, and `67%`.
`21/21` reads as complete while `67%` and `2/3` read as in-progress — three metrics that contradict.
**Change:** Decide the headline metric (recommend lesson completion: `2 of 3 lessons · 67%` — they
agree). If `DAY 21 OF 21` is a separate cohort/day counter, label it as such (`Cohort day 21 of 21`)
so it's clearly a different axis, not progress. The `67%` here and the `Foundation 67%` in the lower
Path Forward card must be the same number from the same source.
**Acceptance:** The card's progress metrics are mutually consistent (or clearly labeled as different
axes); `67%` matches everywhere Foundation progress appears.

## A3.3 — Remove the duplicated section heading
**Problem:** "THE PATH FORWARD" appears twice — once as the section eyebrow above the band, and again
as the title inside the white card.
**Change:** Keep the section eyebrow; rename the inner card to its actual content (`YOUR ROADMAP` /
`THE ARCHITECTURE`) or drop the inner heading. No verbatim-duplicated heading stacked on itself.
**Acceptance:** "The path forward" appears once in that band.

**Sprint 3 done when:** there is one `PILLARS` source; every pillar surface agrees on
order/label/percent; Foundation's metrics reconcile; no duplicated band heading.

---

## Tone / conventions
- Percent via `formatPct` (Sprint 2). Sentence case for body; ALL CAPS only for ≤3-word labels;
  em dashes over hyphens.
- **Coordination note:** Sprint 5 also edits `InProgressPillarHero.tsx`. Sprint 5 runs *after* this
  (Wave 2); keep your changes here to data/labels/metrics, not surface color, to minimize conflict.

## Regression checklist (run dark + light)
- [ ] Pillar name/order/abbreviation identical across hero strip, stepper, and progress bars.
- [ ] Foundation metrics reconcile (or are labeled as different axes); `67%` matches everywhere.
- [ ] "The path forward" appears once in that band.
- [ ] No console errors; no layout shift vs. baseline.
