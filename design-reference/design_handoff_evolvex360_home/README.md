# Handoff: EvolveX360 Academy — Home Page

## Overview

This package contains the design for the **EvolveX360 Academy Home Page** — the primary logged-in landing surface for members of George Leith's coaching academy. The page combines:

1. A persistent **TopNav** (search, primary nav, AI George shortcut, notifications, profile)
2. A cinematic **Welcome Banner** with time-of-day backdrop, personalized greeting, scoreboard, and 6-pillar progress column
3. A 4-up **interactive tile row** below the fold (Community Pulse · Top Stories · Podcast · Daily Pulse)
4. A **sponsor rail** (1, 2 or 3-up partner placements)
5. **Recent Activity** + **Upcoming Events** rows
6. **Your Academy** (3 module cards: Done / In Progress / Locked) + **Quarterly Goals**

The design centers a daily ritual: identity reinforcement → community → media → personal accountability.

---

## About the Design Files

The files in this bundle are **design references created in HTML/JSX** — Babel-transpiled-in-browser React prototypes built to communicate intended look, behavior, layout, copy, and interaction patterns. **They are not production code to copy directly.**

Your task is to **recreate these designs in the EvolveX360 codebase's existing environment**, using its established framework (React, Next.js, etc.), component library, design tokens, and conventions. If no environment exists yet, choose the most appropriate framework for the project (we recommend Next.js + Tailwind given the editorial dark aesthetic and SSR needs) and implement there.

The HTML files use inline-Babel React + inline styles to keep prototypes self-contained. In your codebase, translate to:
- Proper component files (`.tsx`)
- Your design token system (CSS variables, Tailwind config, or theme provider)
- Your icon system (lucide-react, custom SVG sprite, etc.)
- Your data layer (real API calls instead of `useState` mock data)

---

## Fidelity

**High-fidelity (hifi).** Final colors, typography, spacing, copy, and interactions are all locked. Pixel-perfect recreation expected. Where the prototype uses placeholder data (avatar URLs from pravatar, mock post bodies), substitute real data sources.

---

## Screenshots

The `screenshots/` folder contains:

- `01-home-full.png` — full Home page (evening time-of-day, default state)
- `02-welcome-banner-all-states.png` — Welcome banner showing all 6 time-of-day scenes + 6 tier-badge variants stacked
- `03-topnav.png` — TopNav variants page

These are reference renders, not assets to ship.

---

## Files in this Bundle

| File | Role |
|------|------|
| `Home.html` | The composite home page — the primary deliverable |
| `home-app.jsx` | Home page composition (page-level layout, tweaks) |
| `home-tiles.jsx` | The 4 below-fold tile components |
| `home-sponsors.jsx` | Sponsor rail (3 layouts) |
| `home-sections.jsx` | Recent Activity, Upcoming Events, Your Academy, Goals |
| `welcome-banner.jsx` | Welcome banner component |
| `marvel-scenes.jsx` | The 6 time-of-day SVG backdrops for the banner |
| `welcome-app.jsx` | Standalone banner sandbox (showcases all 6 time-of-day scenes + tier badge variants + pillar states) |
| `WelcomeBanner.html` | Standalone banner page |
| `topnav.jsx` | Top navigation component |
| `topnav-app.jsx` | Standalone topnav sandbox |
| `TopNav.html` | Standalone topnav page |
| `tweaks-panel.jsx` | Dev-only tweaks UI — **do not port; remove from production** |
| `colors_and_type.css` | Brand color + type tokens |

To preview, open `Home.html` directly in a browser. Tweaks panel (bottom right) lets you flip time-of-day, active tab, and sponsor layout.

---

## Design Tokens

### Colors

```css
/* Background */
--bg-page:      #0A0F18;  /* page */
--bg-surface:   #111926;  /* cards */
--bg-elevated:  #1A2332;  /* hover / elevated cards */
--bg-topnav:    #0D1B2A;  /* top nav background */

/* Text */
--text-primary: #ffffff;
--text-dim:     rgba(255, 255, 255, 0.6);
--text-muted:   rgba(255, 255, 255, 0.45);

/* Borders */
--border-subtle: rgba(255, 255, 255, 0.06);

/* Brand */
--brand-red:     #C9302A;  /* primary red */
--brand-red-hot: #ef0e30;  /* live / urgent accent */
--brand-gold:    #C9A84C;  /* editorial gold */
--brand-teal:    #0ABFA3;  /* success / secondary */
--brand-blue:    #60A5FA;  /* info */
--brand-violet:  #A78BFA;  /* AI George / community */
```

### 6 Pillar Colors (locked — these tie to the Marvel-scene crater artwork)

| # | Pillar | Hex | Usage |
|---|--------|-----|-------|
| 1 | Foundation | `#D4862B` | amber/earthen |
| 2 | Identity | `#A86CFF` | violet plasma |
| 3 | Mental Toughness | `#ef0e30` | molten red |
| 4 | Strategy | `#3FB8E8` | cyan beam |
| 5 | Accountability | `#E8B547` | warm gold |
| 6 | Execution | `#19C9A6` | teal energy |

### Typography

| Token | Family | Usage |
|-------|--------|-------|
| `--font-logo` | `'Bebas Neue', sans-serif` | logo, big numerals, card titles, section H2s |
| `--font-condensed` | `'Barlow Condensed', sans-serif` | eyebrows, labels, microcopy, buttons (uppercase + letter-spacing) |
| `--font-body` | `'Barlow', sans-serif` | UI body, post titles, card body |
| `--font-serif` | `'Playfair Display', Georgia, serif` | editorial headlines (Top Stories, sponsor taglines) |
| `--font-display` | `'Abril Fatface'` | (loaded but optional) decorative display |

Load via Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;500;600;700;800;900&family=Barlow:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&display=swap" rel="stylesheet">
```

**Type scale:** 9 / 10 / 11 / 12 / 12.5 / 13 / 13.5 / 14 / 16 / 18 / 22 / 28 / 48 px. Letter-spacing for uppercase Barlow Condensed: `0.18em` (small) / `0.22em` (default eyebrow) / `0.32em` (subdued) / `0.42em` (rail label).

### Spacing & Layout

- Page max-width: `1280px`, horizontal padding `24px`
- Card padding: `16px` (small tiles) / `20px` (sponsor) / `12-14px` (compact rows)
- Card gap (4-up tile row): `16px`
- Section gap (Activity ↔ Events, Academy ↔ Goals): `32px` horizontal, `48px` vertical between section blocks
- Border radius: **0px** everywhere — sharp corners are part of the editorial aesthetic
- Border width: `1px` solid `rgba(255,255,255,0.06)` for default, color-tinted at `0x55` opacity on hover

### Iconography

Lucide-style line icons at 11–14px stroke 2. SVG inlined. In production use `lucide-react` or equivalent.

---

## Page Structure (Home.html)

```
┌─────────────────────────────────────────────────────────┐
│  TOP NAV (sticky)                                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  WELCOME BANNER                                          │
│  • time-of-day SVG backdrop                              │
│  • greeting + name + tier badge                          │
│  • daily quote                                           │
│  • scoreboard pills (posts / events / podcasts / stories)│
│  • pillar column (right): 6 chevron rows w/ progress     │
│                                                          │
├──────────┬──────────┬──────────┬────────────────────────┤
│ COMMUNITY│ TOP      │ PODCAST  │ DAILY PULSE            │
│ PULSE    │ STORIES  │ REEL     │ (habits + commits)     │
└──────────┴──────────┴──────────┴────────────────────────┘
                                                            
┌─────────────────────────────────────────────────────────┐
│ SPONSORED  ──────────────────────────  Hand-picked       │
│ ┌─────────────────┐ ┌─────────────────┐                  │
│ │ Sponsor card    │ │ Sponsor card    │                  │
│ └─────────────────┘ └─────────────────┘                  │
└─────────────────────────────────────────────────────────┘
                                                            
─── THE DAILY PRACTICE ──────────────────────────
┌──────────────────────────────┬─────────────────┐
│ RECENT ACTIVITY (timeline)   │ UPCOMING EVENTS │
└──────────────────────────────┴─────────────────┘

─── THE PATH FORWARD ────────────────────────────
┌──────────────────────────────┬─────────────────┐
│ THE ACADEMY (3 module cards) │ QUARTERLY GOALS │
└──────────────────────────────┴─────────────────┘
```

---

## Components — Detailed Specs

### 1. TopNav (`topnav.jsx`)

**Layout:** sticky top, full-width, height 64px, background `--bg-topnav`, border-bottom `1px solid rgba(255,255,255,0.06)`.

**Slots (left → right):**
- **Logo** — wordmark "EVOLVEX360" in Bebas Neue, with red accent dot. White on dark, navy on light.
- **Primary nav links** — uppercase Barlow Condensed at 11px / 0.22em tracking. Active link gets a 2px underline in red. Hover: white opacity 1.
- **Spacer (flex)**
- **Search input** — pill, 240px wide, magnifier icon left, placeholder "Search the academy"
- **AI George shortcut** — three variants (`pill` / `ring` / `wide`). Default `pill`: rounded-full button with a violet-ringed avatar and "Ask George" label. Violet `--brand-violet`.
- **Notifications bell** — count badge in `--brand-red`. Badge hides when count = 0, shows "9+" when count ≥ 10.
- **Profile avatar** — 32px circle. Pro tier = gold ring, VIP = red ring, Community = no ring. Initials fallback when no `avatar_url`.

**Renewal banner:** optional thin bar above nav showing "Your Pro tier renews in {N} days — Manage" when `showRenewalBanner` is true.

**Light theme:** swap bg to `#F5F0E8`, text to `#1B2A4A`. Logo wordmark switches to navy.

---

### 2. Welcome Banner (`welcome-banner.jsx` + `marvel-scenes.jsx`)

**Container:** full-width within page padding, height ≈ 320px, position relative, overflow hidden, background `--bg-elevated`.

**Backdrop layer (z=0):** one of 6 SVG scenes from `marvel-scenes.jsx`, picked by the `period` prop (`early-morning` | `mid-morning` | `midday` | `early-evening` | `evening` | `night`). Each scene is a stylized cinematic vector composition (mountains, sun positions, color gradients).

**Content layer (z=1):** flex row, padded `32px`.

- **Left column (flex 1):**
  - Eyebrow: time-of-day label in Barlow Condensed 11px gold
  - Greeting: "Good evening," in Playfair Display italic 28px white 70%
  - Name: "George" in Bebas Neue 64px white, with a tier badge inline (chevron / vbar / ribbon / bracket / outline / flag — 6 variants in `welcome-banner.jsx`)
  - Daily quote: serif italic 16px white 80%, attributed in Barlow Condensed
  - Scoreboard pills row: 4 chips (12 unread posts, 3 events, 2 podcasts, 5 stories), each chip: dark surface, colored dot, count + label

- **Right column (260px fixed):** Pillar progress
  - Title: "YOUR PILLARS" eyebrow + "3 / 6" count
  - 6 stacked rows, one per pillar:
    - Number badge (Bebas Neue, pillar color)
    - Pillar name (Barlow Condensed uppercase)
    - State indicator: ✓ earned (filled chevron in pillar color) / partial progress bar / locked (subdued)
    - For in-progress: a thin progress bar at pillar color

**Light/dark mode:** banner is always dark — its time-of-day SVG provides the chrome.

---

### 3. Tile Row — 4 cards (`home-tiles.jsx`)

All four share the `Card` shell:
- 2px top accent stripe in card-specific color
- Header: eyebrow + title + count badge
- Body: list / content
- Footer: "All in X →" link

**3a. Community Pulse (`#A78BFA`)** — top 3 community posts (avatar, name, pillar dot, age, body, react/comment counts) + inline event with RSVP button. Reactions toggle with a heart icon. RSVP toggles "Going" state and increments/decrements going count.

**3b. Top Stories (`#C9A84C`)** — 3 numbered editorial stories (01/02/03) in Playfair Display. Each story: category eyebrow (in pillar color) + optional "HOT" red chip + read time + serif title + Save bookmark toggle.

**3c. Podcast Reel (`#3FB8E8`)** — 3 episodes. Each row: square cover (gradient + accent border + Bebas episode number + optional "NEW" red flag), title + guest/role/duration in Barlow Condensed, circular play/pause button on the right (toggles to filled in accent on play).

**3d. Daily Pulse (`#19C9A6`)** — circular progress ring (SVG, 64px, stroke teal) showing % of habits + commitments done. Then 2 sub-sections: Habits list (3 items each with pillar-colored checkbox + label + 🔥 streak badge) and Commitments list (2 items, simple checkbox + text). All checkboxes toggle live and update the ring.

---

### 4. Sponsor Rail (`home-sponsors.jsx`)

**Eyebrow row:** "SPONSORED" tag (boxed, 0.42em tracking) + horizontal divider + "Partners hand-picked by George" microcopy.

**Card grid:** 1 / 2 / 3 columns based on `layout` prop.

**Sponsor card:**
- 2px left accent stripe (sponsor's accent color)
- Logo lockup: mini square logo + wordmark in Bebas Neue
- Tagline in Playfair Display 16-18px
- Body in Barlow 12.5px, 2-line clamp
- CTA button: outlined in accent → fills with accent on hover, with arrow that translates 2px right
- Hover: border tints to accent at 0x55, top sparkle line draws in from right

Three sample sponsors: Outreach (cyan), Notion (gold), Calendly (violet).

---

### 5. Recent Activity (`home-sections.jsx`)

**Header:** "LIVE FEED" eyebrow + "Recent Activity" h2 + "All →" action link.

**Timeline:** 5 events. Each row:
- 34px square icon tile in pillar color (1a opacity bg + 55 border)
- Vertical timeline rail connecting consecutive items (1px, 6% white)
- Body: actor (bold) · target (dim) · timestamp (right-aligned, condensed) + body text

Event kinds: unlock (trophy), comment, mention (@), live (radio dot), streak (flame).

---

### 6. Upcoming Events (`home-sections.jsx`)

**Header:** "WHAT'S NEXT" + "Upcoming" + "Calendar →".

**3 stacked event cards:** each with:
- 2px left accent stripe in event color (red live / violet AMA / gold VIP)
- Top row: kind chip (e.g. "● LIVE") + countdown (e.g. "18h") in Bebas
- Title + when/going microcopy
- Full-width RSVP button (outlined → filled when going)

---

### 7. Your Academy (`home-sections.jsx`)

**Header:** "YOUR PATH" + "The Academy" + "Curriculum →".

**3 module cards in a row:**
- Pillar-numbered badge (38px) at top-left in pillar color
- Status chip top-right: "✓ DONE" (teal) / "IN PROGRESS" (pillar color) / "🔒 LOCKED" (gray, 55% opacity card-wide)
- Module name (Bebas 22px) + description (Barlow 12.5px)
- Lessons count (e.g. "3 / 8") + percentage (Bebas, pillar color)
- 3px progress bar at pillar color
- Action button: "Review" (done, outlined) / "Continue" (active, filled in pillar color) / "Locked" (disabled)

---

### 8. Quarterly Goals (`home-sections.jsx`)

**Header:** "THE LONG GAME" + "Quarterly Goals" + "Edit →".

**3 goal cards stacked:** each with:
- Goal label (Barlow 13 bold) + target chip (Q2 / May / Jun)
- Big % in Bebas in pillar color + delta indicator ("↑ +12% wk") in teal
- 2px progress bar at pillar color

---

## Interactions & Behavior

### State that needs to be local-or-server (replace mock with real API)

| Component | Mock data shape | Real source |
|-----------|-----------------|-------------|
| TopNav | `profile`, `unreadCount` | current user + notification count endpoint |
| WelcomeBanner | `displayName`, `quote`, `pillars[]`, scoreboard counts | profile + daily quote service + pillar progress endpoint + activity counts |
| CommunityPulseCard | `posts[]` (3) + `event` | feed API: top 3 posts (mixed: liked + recommended + recent activity) + next event |
| TopStoriesCard | `stories[]` (3) | media API: editor's pick + recency-ranked |
| PodcastReelCard | `episodes[]` (3) | podcast API: latest 3, with `new` flag for last 24h |
| DailyPulseCard | `habits[]`, `commitments[]` | habit tracker + commitments endpoint, streak computed server-side |
| SponsorRail | `SPONSORS[]` | sponsorship/CMS API |
| RecentActivity | `ACTIVITY[]` (5) | activity feed endpoint (5 most recent, mixed kinds) |
| UpcomingEvents | `events[]` (3) | events endpoint, future-dated, sorted by date asc |
| YourAcademy | `modules[]` (3) | course progress endpoint — surface current pillar in progress + 1 before + 1 after |
| GoalsCard | `goals[]` (3) | user goals endpoint |

### Optimistic interactions

All toggles update local state immediately:
- **React (heart)** — toggles + increments/decrements count
- **Save (bookmark)** — toggles
- **RSVP** — toggles "Going" + adjusts going count
- **Play/pause podcast** — single-instance (only one episode plays at a time per card)
- **Habit/commitment checkbox** — toggles done state, recomputes pulse % in real time
- **Sponsor hover** — pure CSS state, no API

All should debounce + persist via the relevant API.

### Animations & transitions

- All hover/focus transitions: `120-160ms ease`
- Progress ring stroke: `280ms ease` on `stroke-dasharray`
- Progress bars (Academy/Goals): `280ms ease` on `width`
- Sponsor sparkle line: `220ms ease` on `width` (0 → 80px on hover)
- Sponsor CTA arrow: `160ms ease` on `transform: translateX(2px)`

### Active states (Tweaks panel)

The `tweaks-panel.jsx` and the in-page tweak controls are **dev-only**. Do not port. Time-of-day in production should auto-derive from user's local time (`new Date().getHours()`) using these buckets:
- 5–8: `early-morning`
- 8–11: `mid-morning`
- 11–14: `midday`
- 14–17: `early-evening`
- 17–20: `evening`
- 20–5: `night`

---

## Responsive Behavior

The prototypes are designed for desktop (≥ 1280px content). Recommended breakpoints:

| Breakpoint | Behavior |
|------------|----------|
| ≥ 1280px | 4-up tile grid, 2:1 Activity/Events split, 3-up Academy modules |
| 960–1279px | 4-up tiles → 2×2; Activity/Events split stays 2:1; Academy 3-up stays |
| 720–959px | All grids → 2-up; Sponsor → 1-up; Academy → 2-up + 1 below |
| < 720px | Everything stacks single-column. Welcome banner pillar column moves below greeting. Tile row scrolls horizontally OR stacks. |

The Welcome banner pillar column at ≤ 960px should collapse to a horizontal 6-pip strip below the name.

---

## Asset Requirements

| Asset | Status | Action |
|-------|--------|--------|
| Avatar photos | placeholder (pravatar.cc) | replace with user's real avatar URL |
| Marvel-scene SVG backdrops | hand-built, included in `marvel-scenes.jsx` | port as React components or static SVG files |
| Pillar artwork (full-resolution) | not in this bundle — only the color tokens | request from EvolveX360 brand team if you need richer pillar visuals beyond the simple chevron rows |
| Sponsor logos | placeholder text wordmarks | replace with actual sponsor logos when partner deals are inked |
| Podcast cover art | placeholder (gradient + episode number) | replace with real episode artwork from podcast hosting |

---

## Accessibility Notes

- All interactive icons have aria-labels (Play/Pause, Save/Saved, Going/RSVP)
- Color is never the only signal — text labels accompany every status (Done / In Progress / Locked, ● LIVE, NEW, HOT)
- Focus rings: not yet styled in prototype — add a 2px accent-color outline offset 2px on all buttons in production
- Contrast: white-on-`#0A0F18` is 19:1 — passes AAA. Dim text at 60% opacity is 11.4:1 — passes AAA. The 45% muted text is 8.5:1 — passes AAA for large, AA for small. Avoid going below 45% for any meaningful text.
- Time-of-day backdrop is decorative — should not interfere with semantic structure.

---

## Suggested Sprint Breakdown

A sensible decomposition for sprint planning:

1. **Sprint 0 — Foundation:** design tokens (colors, type, spacing), font loading, base shell layout, dark theme infrastructure
2. **Sprint 1 — TopNav:** logo, primary nav, search, AI George variants, profile, notifications, renewal banner, light/dark themes
3. **Sprint 2 — Welcome Banner:** 6 time-of-day SVG scenes, greeting block, scoreboard, pillar column, tier badges, time-bucket logic
4. **Sprint 3 — Tile Row:** Card shell + Community Pulse + Top Stories + Podcast + Daily Pulse, all with optimistic state + API wiring
5. **Sprint 4 — Sponsor Rail:** sponsor card, 1/2/3-up layouts, hover states, CMS integration
6. **Sprint 5 — Daily Practice:** Recent Activity timeline + Upcoming Events list, RSVP API
7. **Sprint 6 — Path Forward:** Your Academy module cards + Quarterly Goals
8. **Sprint 7 — Polish:** responsive breakpoints, focus states, loading skeletons, error states, accessibility audit, performance pass
