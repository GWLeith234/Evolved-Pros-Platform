# Sprint 4 — Metric & trend display (stat strip + The Long Game)

- **Branch:** `fix/metric-display`
- **Wave:** 1 (parallel with Sprints 3 and 6)
- **Depends on:** Sprint 2 (`formatPct`, `formatTrend`)
- **Risk:** Low
- **Codebase:** `apps/web/`

## Files in scope
- `components/home/QuarterlyGoals.tsx`, `components/home/GoalCard.tsx` (Long Game / goal cards)
- `components/home/InProgressPillarHero.tsx` (Foundation card big number)
- `components/home/DailyPulseCard.tsx` (ring)
- `components/home/WelcomeBanner.tsx` (hero stat strip)

---

## A4.1 — Consistent trend chips
**Problem:** Goal cards show trend as `↑ +12% wk`, `↑ +8% wk`, and `· 0% wk` — the zero case swaps
the arrow for a `·` and drops the sign, so it reads as a different kind of value.
**Change:** One chip via `formatTrend(deltaPct)`: `↑ +12% wk` (up), `↓ −3% wk` (down),
`— 0% wk` (flat, em dash not `·`, still with "wk"). Arrow + signed value + period, always all three.
**Acceptance:** Every trend chip has arrow + signed % + period; flat state uses `—`, not `·`.

## A4.2 — One big-number style
**Problem:** The large percentages in the goal cards (`64%`, `35%`, `57%`) and the Foundation card
`67%` render in a serif/Playfair-ish face, but the platform body/UI is Barlow and the reference
reserves serifs for editorial/parchment moments (§3).
**Change:** Pick one numeral face for platform metrics — Bebas Neue (display) or Barlow Condensed
per the reference — and use it for every big number on the dark surface. Playfair stays for
editorial/parchment only.
**Acceptance:** All large metric numerals on `/home` use one face; no Playfair numerals on the dark
surface.

## A4.3 — Hero stat strip: same anatomy per stat, real empty state
**Problem:** The four hero stats are uneven: `POSTS 0 / Share an update`, `EVENTS 1`,
`PODCAST 0 / Listen to an episode`, `STORIES 0 / —`. Stories shows a bare `—` where the others have
a CTA sub-line; the active (Events) stat's emphasis treatment isn't applied consistently.
**Change:** Every stat = number + label + one sub-line (a CTA or a status), same type ramp. Replace
the `—` with a real sub-line (`No stories yet`). Apply the active-state treatment by a single rule
(e.g. "the stat with the soonest action"), not ad hoc.
**Acceptance:** All four stats have number + label + sub-line in the same style; no `—` placeholder;
one active-state rule.

**Sprint 4 done when:** trend chips, big numerals, and the stat strip are uniform; zero/empty states
are real copy, not punctuation.

---

## Tone / conventions
- `formatTrend` / `formatPct` from `lib/format.ts` (Sprint 2) — no inline `'%'` or sign logic.
- Sentence case for body; ALL CAPS only for ≤3-word labels; em dashes over hyphens.
- **Coordination note:** Sprints 3 and 5 also touch `InProgressPillarHero.tsx`. Limit your edits
  there to the numeral *face* (A4.2); leave metrics (Sprint 3) and surface color (Sprint 5) alone.

## Regression checklist (run dark + light)
- [ ] Trend chips all show arrow + signed % + period; flat = `—`.
- [ ] All big metric numerals use one face; no Playfair on the dark surface.
- [ ] All four hero stats have number + label + sub-line in the same style; no `—` placeholder.
- [ ] No console errors; no layout shift vs. baseline.
