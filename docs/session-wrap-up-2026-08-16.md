# Evolved Pros Platform — Cloud Agent Session Wrap-Up

**Vault title:** Evolved Pros — Cloud Agent Session 2026-08-16  
**Date:** 2026-08-16 (UTC)  
**Agent:** Cursor Cloud Agent (Auto / Composer)  
**Deploy base:** `claude/init-evolved-pros-platform-Q2oUw`  
**Repo:** [GWLeith234/Evolved-Pros-Platform](https://github.com/GWLeith234/Evolved-Pros-Platform)  
**Purpose:** Full session record for Google Drive vault — arc, operating model, merged PRs, deep-dives, CI notes, file index, follow-ups.

This document captures the full working session from the start: briefs, decisions, PRs shipped, CI/hex-ratchet work, conflict resolution, and what remains open.

---

## 1. Session arc (high level)

Work moved through several product surfaces in one continuous pass:

1. **Performance** (Phases 1–3) — auth dedupe, home/fonts/podcast/community, reaction RPCs  
2. **Podcast** — episode thumbnails / YouTube facade  
3. **Sponsor ads** — dark-theme contrast + logos  
4. **LIVE / speaking calendar** — cleanup, admin dates, then holds/milestones/pins  
5. **Homepage QA** — navigation, Q-day math, labels  
6. **Academy ads redesign** — six-pillar conversion creatives (not Partner cards)  
7. **Podcast hero** — Save / Share / social wiring  
8. **Podcast archive grid QA** — clipped cards, ad fit, Academy in grid  
9. **Mobile nav IA** — Podcast on bottom bar; Media + LIVE in More  
10. **CI / hex ratchet** — repeated cleanup so merges could land  
11. **PR #48 merge conflicts** — resolved; last open PR of the session

---

## 2. Operating model (reminders for the vault)

- Agent branches → implement → commit/push → open/update PRs; human reviews/merges.  
- Railway deploys web; Supabase migrations applied separately when needed.  
- New branches: `cursor/<descriptive-name>-7bf6`.  
- Prefer one screen/flow per PR when possible.  
- **STYLEGUIDE:** navy `#112535`, red `#EF0E30` / `#C9302A`, gold `#C79A3B` / `#C9A84C`, ivory; avoid purple AI-default looks.  
- **Hex ratchet:** raw `#RRGGBB` in `apps/web/app` + `apps/web/components` `*.tsx` may only go **down**; CI fails if count &gt; `.hex-baseline`.

---

## 3. Merged in this session (2026-08-16)

| PR | Title | Notes |
|----|--------|--------|
| [#41](https://github.com/GWLeith234/Evolved-Pros-Platform/pull/41) | perf Phase 1 — auth dedupe, dead chrome, shared caches | |
| [#43](https://github.com/GWLeith234/Evolved-Pros-Platform/pull/43) | perf Phase 3 — reaction/reply RPCs, DM pagination, academy dedupe | Needs Supabase migration `075` if not applied |
| [#44](https://github.com/GWLeith234/Evolved-Pros-Platform/pull/44) | Podcast episode poster under YouTube play button | CSP + YouTubeFacade |
| [#45](https://github.com/GWLeith234/Evolved-Pros-Platform/pull/45) | Sponsor ads contrast + logo size | Dark-readable partners |
| [#46](https://github.com/GWLeith234/Evolved-Pros-Platform/pull/46) | LIVE speaking calendar cleanup | Past cities on map; clear upcoming |
| [#47](https://github.com/GWLeith234/Evolved-Pros-Platform/pull/47) | Admin Speaking dates editor | `platform_settings.live_upcoming_speaking` |
| [#49](https://github.com/GWLeith234/Evolved-Pros-Platform/pull/49) | Homepage QA | Podcast play → episode; Scoreboard; Q days = quarter end |
| [#50](https://github.com/GWLeith234/Evolved-Pros-Platform/pull/50) | Academy ads redesign | Architecture card; named six pillars; not Partner |
| [#52](https://github.com/GWLeith234/Evolved-Pros-Platform/pull/52) | Podcast archive QA | Cover text clip fix; 9:16 ads; Academy promo; includes Save/Share |
| [#53](https://github.com/GWLeith234/Evolved-Pros-Platform/pull/53) | Mobile nav: Podcast on bottom bar | Media + LIVE moved to More |

**Superseded / closed by merge of a larger PR:**

- [#51](https://github.com/GWLeith234/Evolved-Pros-Platform/pull/51) Save/Share buttons — folded into #52.

**Still open at end of session:**

- [#48](https://github.com/GWLeith234/Evolved-Pros-Platform/pull/48) — LIVE holds, product milestones, pin cleanup + map-pin admin. Conflicts resolved; rebased; CI green / **MERGEABLE**. Awaiting human merge.

---

## 4. Topic deep-dives

### 4.1 LIVE / speaking

**Problem:** `/live` “Upcoming speaking” showed stale product launches and past events; no solid admin path; pins messy (e.g. Norfolk NE vs VA).

**Shipped:**

- #46 — Date filter; empty state + booking CTA; past = cities on globe; page order upcoming → map → archive.  
- #47 — Admin → Content → Speaking for upcoming dates.  
- #48 (open) — Holds subsection; product milestones strip; pin cleanup; Map pins admin (`live_speaking_pins_extra`); `getSpeakingPins()` merges extras.

**Key paths:**  
`apps/web/lib/live/upcoming-dates*.ts`, `get-speaking-pins.ts`, `product-milestones.ts`, `components/live/*`, `app/(admin)/admin/speaking/`, `app/api/admin/speaking/`.

### 4.2 Homepage QA (#49)

**P0:** Podcast play → `/podcast/{slug}`; Scoreboard → `/leaderboard`; removed self-link Open hub.  
**P1:** Q days/% = quarter end (fixes “Q3 · 139d”); Stories → Comments; pillar 4 slug `strategic-approach`; Pulse + NextEventBanner → `/events/{id}`.  
**P2:** Afternoon greeting; sponsor CTA only with href; context-strip date local TZ.

### 4.3 Academy ads (#50)

**Problem:** Academy self-promo looked like an Evolution Partner card (PARTNER badge, duplicated “Evolved Pros Academy”, tiny unlabeled bars).

**Solution:**

- `AcademyArchitectureCard` — Academy badge, conversion headline (“Stop collecting tips. Build the system.”), **six named pillars**, CTA → `/academy`.  
- Upgrade variant on Academy hub for non-Pro → `/membership`.  
- Regenerated HTML → PNG creatives under `design/sponsor-creatives/` → `public/ads/academy-*.png`.  
- Pool logic: Academy first on Academy/LIVE strips; home/community stay partners-only.

**Pillars (source: `PILLAR_CONFIG`):**  
Foundation `#FFA538` · Identity `#A78BFA` · Mental Toughness `#F87171` · Strategy `#60A5FA` · Accountability `#C9A84C` · Execution `#0ABFA3`.

### 4.4 Podcast hero Save / Share (#51 → #52)

Buttons were decorative (no handlers).

- **Save** — local bookmark (`ep_podcast_saved`), toggles Saved state.  
- **Share** — Web Share API or copy episode link.  
- **X / LinkedIn / Facebook** — share-intent windows for `/podcast/{slug}` on current host.  
Helpers: `apps/web/lib/podcast/share.ts`.

### 4.5 Podcast archive grid QA (#52)

**Problems (from mobile screenshots):**

- Episode cover cards clipped navy-plate text (locked `9:16` + `overflow: hidden` vs content-sized type).  
- Ads were 1:1 with meta *below* the cell — height mismatch; Academy PNG cropped under PARTNER.  
- Sort/filter chrome awkward under Next Event banner; bottom tab clearance tight.

**Fixes:**

- Cover: art **flex-shrinks**; plate never clips; cover/thumbnail fallback; NEW chip; fluid `clamp` type.  
- Ads: **9:16** cover units matching episode cards; Academy = named-pillar art (Academy badge, not Partner).  
- Pool: Academy + flagships from `podcast`/`all` only (no dump of every `platform_ads` placement).  
- Filters: scrollable pills; Sort on its own row (`z-index: 60`); extra bottom padding.

### 4.6 Mobile navigation IA (#53)

**Decision:**

| Surface | Placement | Why |
|---------|-----------|-----|
| **Podcast** | Bottom tab | Flagship content / daily loop |
| **Media** | More sheet | Editorial; lower DAU |
| **LIVE** | More sheet | Keep thumb bar at 5 slots |

**Bottom bar:** Home · Community · Podcast · Academy · More  

Desktop TopNav unchanged (still has Podcast + Media).

---

## 5. CI / hex ratchet (recurring theme)

Almost every late PR hit:

```text
hex-ratchet: FAIL — N raw hex values … (baseline: M)
```

**Cause:** Merges (#46/#47/#49/#50) added `#RRGGBB` literals without lowering `.hex-baseline`. Later PRs failed even when they added little or no hex.

**Approach used repeatedly:**

1. Map brand colors to CSS tokens (`var(--brand-gold)`, `var(--brand-red-hot)`, `var(--navy-abyss)`, etc.).  
2. Drop redundant `var(--token, #fallback)` fallbacks (fallbacks still count).  
3. Prefer tokens inside gradients where possible.  
4. If count &lt; baseline, **ratchet `.hex-baseline` down** in the same commit.

**End-of-session baseline (on #48 branch after cleanup):** **1455** (was 1486 earlier in the day).

**Note:** Build step in CI is `continue-on-error: true` (placeholder Supabase keys / font fetch). Blocking gates are typecheck, lint, and hex ratchet.

---

## 6. Merge conflicts (#48 vs deploy base)

After #47 merged, #48 conflicted on:

| File | Classification | Resolution |
|------|----------------|------------|
| `admin/speaking/page.tsx` | Simple (add/add; #48 **superset** of dates-only #47) | Kept #48: Dates + Pins tabs |
| `LiveUpcomingDates.tsx` | Simple (base lacked holds split) | Kept #48: confirmed vs holds |

No conflicting-intent conflicts. Merged base in; later rebased onto #50–#53 for CI.

---

## 7. Key files touched (reference index)

| Area | Paths |
|------|--------|
| Academy ads | `components/academy/AcademyArchitectureCard.tsx`, `lib/sponsors/partners.ts`, `design/sponsor-creatives/academy-*.html`, `public/ads/academy-*.png` |
| Podcast grid | `components/podcast/PodcastCoverCard.tsx`, `PodcastSponsorCard.tsx`, `PodcastGrid.tsx`, `PodcastFilterPills.tsx`, `PodcastHero.tsx` |
| Podcast share | `lib/podcast/share.ts`, `lib/podcast/share.test.ts` |
| Mobile nav | `components/layout/BottomTabBar.tsx`, `MoreDrawer.tsx` |
| LIVE speaking | `components/live/LiveUpcomingDates.tsx`, `LiveProductMilestones.tsx`, `lib/live/*`, `app/(admin)/admin/speaking/` |
| Homepage | `app/(member)/home/page.tsx`, home tiles / pulse / context strip |
| Hex law | `scripts/check-hex-ratchet.sh`, `.hex-baseline`, `app/globals.css` tokens |

---

## 8. Follow-ups / still open

1. **Merge [#48](https://github.com/GWLeith234/Evolved-Pros-Platform/pull/48)** when ready (CI green at wrap-up).  
2. **Confirm Supabase migration `075`** applied in production if Phase 3 RPCs are live.  
3. **Hex hygiene on deploy base** — keep converting literals so new PRs don’t re-hit the ratchet.  
4. **Perf Phase 2 (#42)** — still listed earlier as open/stacked; confirm status if still needed.  
5. **Older draft PRs** (#8, #10, #25, #35–#40, etc.) — not part of this session’s delivery; triage separately.  
6. **Podcast Save** is localStorage-only — optional later: account-synced bookmarks.  
7. **Media** discoverability — now in More on mobile; watch whether users find it.

---

## 9. Suggested merge order (as of late session)

At wrap-up, most session PRs were already merged. Remaining:

1. Merge **#48** (holds / milestones / pins).  
2. Optionally close **#51** if still open (superseded by #52).

---

## 10. One-line verdict

In one session the platform got faster internals, a cleaner LIVE calendar + admin path, better sponsor/Academy conversion surfaces, a fixed podcast archive and share actions, and a clearer mobile IA with Podcast on the primary tab bar — with hex-ratchet discipline restored so the last speaking PR can land.

---

*Generated for Google Drive vault upload. Source: Cursor Cloud Agent session on Evolved Pros Platform, 2026-08-16.*
