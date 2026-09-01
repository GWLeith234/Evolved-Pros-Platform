# Sprint 2 — Data formatting: time, dates, counts, numbers

- **Branch:** `fix/data-format`
- **Wave:** 0 (parallel with Sprint 1; **build the formatter module FIRST** — Waves 1–2 import it)
- **Depends on:** none
- **Risk:** Low (mechanical once formatters exist)
- **Codebase:** `apps/web/`

The same datum is rendered in different units in different cards. Route everything through shared
formatters. **First task: create `lib/format.ts` (see Appendix). Then convert call sites.**

## Files in scope
- `lib/format.ts` — **new**, the shared formatter module (Appendix)
- `components/home/tiles/CommunityPulseTile.tsx`
- `components/home/ActivityFeed.tsx`
- `components/home/WelcomeBanner.tsx`
- `components/home/QuarterlyGoals.tsx`, `components/home/GoalCard.tsx` (goal/long-game date tags)
- `components/academy/CommitmentTracker.tsx`
- `components/home/DailyPulseCard.tsx`
- `components/home/tiles/TopStoriesTile.tsx`, `components/home/tiles/PodcastReelTile.tsx`

---

## A2.1 — One relative-time format
**Problem:** The same posts appear with different age units — Community Pulse shows `6W`/`7W`; the
Recent Activity feed shows the same posts as `42d ago`/`46d ago`/`51d ago`. Weeks vs days for
identical data, and `6W` vs `42d ago` are two conventions.
**Change:** Single `formatRelative()`: `now`, `Nm` (<1h), `Nh` (<24h), `Nd` (<7d), `Nw` (<8w),
then `MMM D` beyond. One suffix policy — recommend the compact `6w`/`42d` form (no "ago") in tight
tile rows and the full `6w ago` only in the wider activity feed, but the *unit* must match:
42 days = `6w` in both places, never `6w` here and `42d` there.
**Acceptance:** A given post shows the same unit in every card. No mix of `W`/`d ago` for the same
age class.

## A2.2 — Canonical date display by context
**Problem:** Dates wear five costumes: hero `SUNDAY, JUNE 28` + `Q2 · 2026`; banner `Jun 18`;
event chips `JUL 15` and `Jul 15`; goal tags `Q2`/`MAY`/`JUN`; commitments range `Jun 29 — Jul 5`.
**Change:** Exactly three date styles via `formatDate(date, style)`:
- **Stamp** (calendar chips): `MMM D` two-line, always uppercase month — `JUL 15`. Kill title-case `Jul 15`.
- **Inline** (within sentences/meta): `Jun 18`.
- **Deadline** (goal tags): pick one granularity. Quarter-scoped → `Q2 2026` for all; month-scoped
  → `MMM` for all. Do not mix `Q2` with `MAY`/`JUN` in the same list.
**Acceptance:** Every date resolves through `formatDate`; no two styles for the same context; goal
tags are all one granularity.

## A2.3 — One representation per count/fraction
**Problem:** Daily Pulse states the same progress four ways at once: header `0/5`, ring `0%` +
`5 TO GO`, sub-line `0/3 HABITS · 0/2 COMMITS`.
**Change:** One primary: the ring shows `0%` with `0/5 done` beneath it. The
`0/3 habits · 0/2 commits` breakdown stays (a *different*, useful split), but drop the redundant
header `0/5` pill and the separate `5 TO GO`. Counts everywhere use `done/total` order, lowercase
noun: `0/5 done`, `0/3 habits`.
**Acceptance:** Daily Pulse shows the aggregate once (ring) + the habit/commit split once; no `0/5`
header pill alongside a `5 TO GO`.

## A2.4 — Episode numbering: zero-pad, single source
**Problem:** The same podcast is numbered three ways — banner/hero imply `PODCAST 0`/`EP 6`; Latest
Drops chips read `6`/`5`/`4` (un-padded); header badge says `EP 6`.
**Change:** Zero-pad to `#0N` everywhere (`#06`, `#05`, `#04`) via `formatEpisode`. The "latest"
surfaces (banner + hero "podcast" stat) reference the *same* episode object as Latest Drops row 1 —
derive, don't hardcode. Move `EP 6` off the header badge (per Sprint 1 A1.1) onto the row chip.
**Acceptance:** All episode numbers are `#0N`; the banner/hero/first-row point at one episode; no
bare `6`/`5`/`4`.

## A2.5 — Read-time + duration format
**Problem:** Read times render `2 MIN`/`3 MIN` (uppercased) in stories; podcast rows have no
duration; an empty duration renders a bare `—`.
**Change:** One token via `formatDuration`: `2 min` (lowercase via data, uppercased by CSS label
style only if it's a label). Empty duration → hide the slot, never render a bare `—`.
**Acceptance:** Durations use one format; no empty `—` slots.

**Sprint 2 done when:** grep the home tree for inline date/time/number formatting (`'d ago'`, `'W'`,
`' MIN'`, `'%'`, `padStart`, `toLocaleDateString`) → only `lib/format.ts` matches.

---

## Appendix — the shared formatter module (`lib/format.ts`)

```ts
// Relative time — one unit ladder, used everywhere.
formatRelative(date): "now" | "5m" | "3h" | "4d" | "6w" | "Mar 3"
//   <1m now · <1h Nm · <24h Nh · <7d Nd · <8w Nw · else "MMM D"
//   Wider surfaces may append " ago"; the UNIT must not change between surfaces.

// Dates — exactly three styles.
formatDate(date, "stamp")    // "JUL 15"  (calendar chips, uppercase month)
formatDate(date, "inline")   // "Jun 18"  (within meta/sentences)
formatDate(date, "deadline") // "Q2 2026" OR "MAY" — pick ONE granularity project-wide

// Counts — done/total, lowercase noun.
formatCount(2, 3, "lessons") // "2/3 lessons"

// Percent — integer, no space.
formatPct(0.67)              // "67%"

// Episode number — zero-padded.
formatEpisode(6)             // "#06"

// Duration / read time — lowercase, hide when empty.
formatDuration(2)            // "2 min"   (null/0 → render nothing, never "—")

// Trend — arrow + signed % + period; flat uses em dash.  (used by Sprint 4)
formatTrend(0.12)            // "↑ +12% wk"
formatTrend(-0.03)           // "↓ −3% wk"
formatTrend(0)               // "— 0% wk"
```

> Build `formatTrend` here too even though Sprint 4 consumes it, so the module ships complete in one place.

## Regression checklist (run dark + light)
- [ ] A given post shows the same relative-time unit in Community Pulse and the activity feed.
- [ ] Dates use only the three defined styles; goal tags are one granularity.
- [ ] Daily Pulse aggregate appears once (ring); no `0/5` header pill alongside a `5 TO GO`.
- [ ] All episode numbers are `#0N`; durations use one format; no empty `—` slots.
- [ ] Grep the home tree: no inline formatting (`'d ago'`, `' MIN'`, `'%'`, `padStart`,
      `toLocaleDateString`) outside `lib/format.ts`.
