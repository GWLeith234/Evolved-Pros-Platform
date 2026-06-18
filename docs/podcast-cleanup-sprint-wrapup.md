# Podcast Page Cleanup — Sprint Wrap-Up

**Date:** June 18, 2026
**Surface:** `/podcast` (member podcast index + episode detail player)
**Branch / PR:** `claude/magical-gates-fanstc` → [PR #11](https://github.com/GWLeith234/Evolved-Pros-Platform/pull/11)
**Status:** ✅ Complete — ready for design + product review

---

## Objective

Bring the podcast page into compliance with the Evolved Pros design system and
match the approved "After" archive card. The page had drifted from the system:
hardcoded colors, an editorial (Playfair) typeface borrowed from `/media`, 3D
hover effects and drop shadows, an off-palette green, two competing reds, and a
non-deterministic episode order with inconsistent numbering.

The guiding rule throughout: **no hand-typed color values for brand elements —
everything references a design-system token.**

---

## What shipped

Work was organized into seven sprints. All are complete.

| # | Sprint | Outcome |
|---|--------|---------|
| 1 | **Token foundation** | Page now consumes canonical design-system tokens (background, text, border) from one source instead of page-local color copies. Future palette changes propagate automatically. |
| 2 | **Pillar color mapping** | Each of the six content categories binds to its correct brand pillar color through a single shared map that drives the badge, dot, filter pill, and card hover-border. The off-palette green was removed. |
| 3 | **Flat visual language** | Sharp corners, removed all drop shadows and colored glows, and replaced the 3D "tilt" hover with a clean lift + colored border. Matches the system's flat aesthetic. |
| 4 | **Typography** | Restored Bebas Neue for display headings/numbers and Barlow for titles and guest names; removed the editorial Playfair face (now reserved for `/media`); converted headings to sentence case. |
| 5 | **Unified brand red** | One brand red now drives the banner, primary CTA, play control, and "New" flags — replacing two inconsistent reds. |
| 6 | **Episode data contract** | Deterministic newest-first ordering, zero-padded episode numbers everywhere, a dedicated "Pilot" treatment, accurate episode count, and hidden empty runtimes. |
| 7 | **Accessibility & spacing polish** | Brand-colored keyboard focus ring on episode cards; spacing snapped to the 4px grid; tap targets confirmed at the 44px minimum. |

---

## User-facing impact

- **Consistent, on-brand look.** The podcast page now reads as part of the same
  product as the rest of the platform — same colors, type, and flat surfaces —
  rather than an editorial one-off.
- **Correct category colors.** Each pillar (Foundation, Identity, Mental
  Toughness, Strategy, Accountability, Execution) shows its real brand color
  across the badge, dot, and filter, so members can scan by category reliably.
- **Predictable episode list.** "Newest first" no longer reshuffles on reload,
  and same-day episodes hold a stable order.
- **Clearer numbering.** Episodes display as `#01…#06`; the pilot shows a
  **PILOT** label instead of `#00` and is excluded from the episode count
  ("6 episodes + pilot").
- **Accessibility.** Keyboard users get a visible, on-brand focus indicator on
  episode cards; touch targets meet the 44px minimum.

---

## Data change (requires PO awareness)

The pilot episode was previously dated May 11 but numbered `#00`, which placed it
*after* episode `#01` (April 30) — breaking the "numbers follow chronology" rule.

Per George's direction, the **pilot's publish date was set to April 20, 2026** in
the production database so the catalog is now chronologically monotonic:

> Pilot (Apr 20) → #01 (Apr 30) → #02 (May 11) → #03 (May 20) → #04 (May 27) → #05 (Jun 16) → #06 (Jun 18)

This was a content/data update (not code) and is already live.

---

## Quality & verification

- **Type-check:** passes on all changed files.
- **Lint:** passes with no warnings or errors.
- **Design-system audit:** no Playfair, no 3D transforms, no drop shadows, and no
  hardcoded brand color values remain in the podcast index components. Remaining
  literals are limited to fixed white text on colored chips and legibility
  overlays (intentional, non-brand utility values).
- **Build guard added:** a lightweight development-mode check warns if episode
  numbering ever drifts out of chronological order again, so this regression is
  caught early rather than shipping silently.

---

## Risks & follow-ups

1. **No automated CI gate on this branch.** The repo's CI workflow only runs on
   pull requests into `main`; this PR targets the active integration branch, so
   no automated lint/type-check ran in GitHub. Local checks passed. *Recommend:*
   extend CI triggers to cover the integration branches if we want enforced
   gating on stacked work.
2. **Episode titles remain in their authored casing.** Title-case vs. sentence-
   case for episode titles is content-driven (entered in the admin), not code.
   If we want a consistent casing convention, that's an editorial decision +
   content pass.
3. **Pilot publish time** was set to 12:00 UTC on April 20. Dates render in UTC,
   so it displays as "Apr 20" — flag if a specific time is preferred.

---

## Links

- **Pull Request:** https://github.com/GWLeith234/Evolved-Pros-Platform/pull/11
- **Design source of truth:** `colors_and_type.css`, `design_system_reference.md`,
  and the approved "After" archive card.
