# Home consistency — sprint split (card & data consistency)

Source doc: *Home page — card & data consistency* (companion to *Home Consistency — tokens / shape / pillar color*).
This folder splits that doc into **six self-contained sprint briefs**, one per file, each runnable by an independent agent.

Each brief in this folder is standalone: it carries its own tone rules, the shared formatter
appendix, the file-path map, and the regression checklist, so an agent can work without the
original doc.

---

## Parallelization plan (read this first)

The sprints are **not** all independent. There is a hard dependency chain through two shared
primitives — the card shell (Sprint 1) and the formatter module (Sprint 2). Run them in waves:

```
WAVE 0  ──  Sprint 1 (card-anatomy)   +   Sprint 2 (data-format / lib/format.ts)
            └ these two build the shared primitives everything else imports.
            └ they touch different layers (shell/structure vs. formatters) and can run in parallel,
              but BOTH must land before Wave 1 starts.

WAVE 1  ──  Sprint 3 (progress-dedupe) │ Sprint 4 (metric-display) │ Sprint 6 (copy-hygiene)
            └ all three depend on Sprint 2's formatters; fully parallel with each other.

WAVE 2  ──  Sprint 5 (surfaces)
            └ touches the Foundation + "Climbing toward" cards, which Sprints 3/4 also edit.
              Run last to avoid merge churn on those two files.
```

**Why not all six at once:** Sprints 2–6 reference `formatRelative` / `formatPct` / `formatTrend`
etc. that don't exist until Sprint 2 ships `lib/format.ts`. And Sprints 3, 4, 5 all edit the
Foundation/current-pillar card and the goal cards — running them simultaneously guarantees conflicts.
The waves above keep each wave's agents on disjoint files.

| Sprint | Branch | Depends on | Safe to parallelize with |
|---|---|---|---|
| 1 — Card anatomy | `fix/card-anatomy` | — | Sprint 2 |
| 2 — Data formatting | `fix/data-format` | — (build `lib/format.ts` first) | Sprint 1 |
| 3 — Progress de-dupe | `fix/progress-dedupe` | Sprint 2 (`formatPct`) | Sprints 4, 6 |
| 4 — Metric display | `fix/metric-display` | Sprint 2 (formatters) | Sprints 3, 6 |
| 5 — Surfaces | `fix/surfaces` | Sprints 3, 4 (same cards) | run alone (Wave 2) |
| 6 — Copy hygiene | `fix/copy-hygiene` | Sprint 2 (light) | Sprints 3, 4 |

---

## Component name → actual file map

The source doc uses display names and webpack module ids. Real paths (under `apps/web/`):

| Doc name (module id) | Actual file |
|---|---|
| `TileShell` (9846) | `components/home/tiles/TileCard.tsx` |
| `CommunityPulseTile` | `components/home/tiles/CommunityPulseTile.tsx` |
| `TopStoriesTile` | `components/home/tiles/TopStoriesTile.tsx` |
| `PodcastReelTile` (Latest Drops) | `components/home/tiles/PodcastReelTile.tsx` |
| `DailyPulseCard` / `DailyPulse` (4867) | `components/home/DailyPulseCard.tsx` |
| `ActivityFeed` (4200) | `components/home/ActivityFeed.tsx` |
| `WelcomeBanner` (19) | `components/home/WelcomeBanner.tsx` |
| `LongGame` / goal cards | `components/home/QuarterlyGoals.tsx`, `components/home/GoalCard.tsx` |
| `CommitmentTracker` (2344) | `components/academy/CommitmentTracker.tsx` |
| Path Forward stepper / bars | `components/home/PillarJourneyStrip.tsx`, `components/home/AcademyProgressWidget.tsx` |
| Foundation / current-pillar card | `components/home/InProgressPillarHero.tsx` |
| "Climbing toward Identity" card | `components/home/ClimbingTowardCard.tsx` |
| `HomeSponsorRow` (9052) | `components/home/HomeSponsorRow.tsx` |
| `HomeSponsorAd` (4490) | `components/home/HomeSponsorAd.tsx` |
| Page | `app/(member)/home/page.tsx` |
| Formatter module (to create) | `lib/format.ts` |
| Existing pillar source | `lib/pillars.ts` (reuse for Sprint 3's `PILLARS`) |

> These are best-match resolutions. The first step of each sprint is to confirm the mapping by
> opening the file and checking it renders the surface the ticket describes.

## Conventions (apply in every sprint)

- **No literal-formatted data in components.** Every date, relative time, count, %, episode #,
  and duration routes through `lib/format.ts` (Sprint 2). Never `toLocaleString` / `+ 'd ago'` /
  `+ '%'` / `padStart` inline in a tile.
- **Casing/tone** per `design_system_reference.md` §1.3: sentence case for body & titles;
  ALL CAPS only for ≤3-word labels (eyebrows, badges) via `text-transform`; em dashes over hyphens.
- After each sprint, run the regression checklist (bottom of each brief) in **dark and light mode**.
- Land the companion tokens/shape/color doc's Sprint 1 (tokens) first so these can reference real tokens.
