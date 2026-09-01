# Handoff: The Evolved Pros — Podcast Page

A high-fidelity design for the **Podcast** section of The Evolved Pros member platform. This document is the spec; the bundled HTML/JSX files are working prototypes that demonstrate look + behavior.

---

## About these files

The files in `source/` are **design references built in HTML + Babel-transpiled JSX in the browser**. They are *not* meant to ship as-is. Your task is to **recreate this design in the host codebase using its existing framework, component library, design tokens, and routing conventions** — or, if no app framework exists yet, to choose the most appropriate one (likely Next.js or Vite + React) and implement there.

If the host codebase already has a design system (e.g. shadcn/ui, MUI, Chakra, custom), prefer those primitives over hand-rolling buttons / chips / cards. The screenshots and source are the visual contract; the code style should be the host's.

## Fidelity

**High-fidelity.** All colors, spacing, type, borders, and interactions in this package are intentional and final. Match them precisely.

---

## What's in the box

```
design_handoff_podcast/
├── README.md                 ← this file
├── screenshots/              ← rendered states (navy + parchment, hero, grid, hover, filtered)
└── source/                   ← HTML / JSX prototype files
    ├── Podcast.html
    ├── podcast-app.jsx       ← root component, theme switching, latest-strip + masthead + hero + grid wiring
    ├── podcast-data.jsx      ← episode + guest fixture data; PILLARS map
    ├── podcast-hero.jsx      ← latest-episode strip, masthead, image banner, white intro card
    ├── podcast-grid.jsx      ← filter pills, sort, portrait poster grid, episode tile
    ├── topnav.jsx            ← top navigation (shared with rest of platform)
    └── tweaks-panel.jsx      ← in-design tweak controls (dev tooling, not user-facing)
```

To run the prototype: serve the `source/` folder over any static server (e.g. `python3 -m http.server`) and open `Podcast.html`. Babel transpiles the JSX in-browser.

---

## Page anatomy (top → bottom)

The page is composed of five stacked sections inside a single column with `max-width: 1280px` and 24px horizontal gutters:

1. **TopNav** — global top navigation, shared component (see `topnav.jsx`). Theme prop flips between `light` and `dark` based on shell.
2. **Latest-episode strip** — full-width red+white bar, shows latest episode title/guest/date and a "Watch on YouTube" CTA.
3. **Masthead** — `THE EVOLVED PROS` eyebrow → `THE PODCAST` title → italic Playfair subtitle.
4. **Hero** — split into:
   - **Image-only banner** (460px tall) with floating Runtime chip top-right.
   - **White intro card** that overlaps the banner by -72px, holding episode meta and CTAs.
5. **Catalog** — All Episodes header, filter pills + sort dropdown, portrait 2:3 poster grid.

---

## Design tokens

The design supports **two themes** that the user toggles via the Tweaks panel: **navy** (default, platform-dark) and **parchment** (editorial light). All component styles use CSS custom properties so a single `data-theme="light"` attribute on `<body>` flips the entire page.

### Colors — semantic tokens

```css
:root {
  /* Brand */
  --brand-red:       #C9302A;
  --brand-red-hot:   #ef0e30;   /* hero CTA */
  --brand-gold:      #C9A84C;   /* eyebrows, episode # */
  --brand-teal:      #0ABFA3;
  --brand-blue:      #60A5FA;
  --brand-violet:    #A78BFA;

  /* Theme: navy (default) */
  --bg-page:         #0A0F18;
  --bg-surface:      #111926;   /* cards, latest strip */
  --bg-elevated:     #1A2332;   /* hover states */
  --border:          rgba(255,255,255,0.06);
  --border-soft:     rgba(255,255,255,0.05);
  --border-soft2:    rgba(255,255,255,0.08);
  --border-med:      rgba(255,255,255,0.10);
  --border-med2:     rgba(255,255,255,0.12);
  --border-strong:   rgba(255,255,255,0.15);
  --text-strong:     #fff;
  --text-1:          rgba(255,255,255,0.85);
  --text-2:          rgba(255,255,255,0.65);
  --text-3:          rgba(255,255,255,0.55);
  --text-4:          rgba(255,255,255,0.45);
  --text-5:          rgba(255,255,255,0.35);
  --text-6:          rgba(255,255,255,0.25);
}

body[data-theme="light"] {
  /* Theme: parchment */
  --bg-page:         #F5F1E8;
  --bg-surface:      #FFFFFF;
  --bg-elevated:     #FAF7EE;
  --border:          rgba(10,15,24,0.08);
  --border-soft:     rgba(10,15,24,0.06);
  --border-soft2:    rgba(10,15,24,0.10);
  --border-med:      rgba(10,15,24,0.12);
  --border-med2:     rgba(10,15,24,0.15);
  --border-strong:   rgba(10,15,24,0.20);
  --text-strong:     #0A0F18;
  --text-1:          rgba(10,15,24,0.85);
  --text-2:          rgba(10,15,24,0.68);
  --text-3:          rgba(10,15,24,0.58);
  --text-4:          rgba(10,15,24,0.48);
  --text-5:          rgba(10,15,24,0.38);
  --text-6:          rgba(10,15,24,0.25);
}
```

> **Important**: Hardcoded `#fff` / `rgba(255,255,255,*)` values are still used in places that always sit over a dark image (hero image banner, episode poster overlays, red CTA buttons). Those are *correct* — they're not bugs to convert.

### Pillar colors

Each episode belongs to one of six pillars; the pillar color drives accents (eyebrow text, focus ring on tile, intro-card top border, accent wash on hero image):

| Pillar key          | Label             | Hex       |
|---------------------|-------------------|-----------|
| `foundation`        | Foundation        | `#FFA538` |
| `identity`          | Identity          | `#A78BFA` |
| `mental-toughness`  | Mental Toughness  | `#F87171` |
| `strategy`          | Strategy          | `#60A5FA` |
| `accountability`    | Accountability    | `#C9A84C` |
| `execution`         | Execution         | `#0ABFA3` |

### Typography

Three families, loaded as Google Fonts in `Podcast.html`:

| Family                | Usage                                                           |
|-----------------------|-----------------------------------------------------------------|
| **Bebas Neue**        | Section titles (`THE PODCAST`, `ALL EPISODES`) — uppercase, `0.04em` letter-spacing |
| **Playfair Display**  | Episode titles, body emphasis, italic episode-number tags       |
| **Barlow**            | Body copy                                                       |
| **Barlow Condensed**  | Eyebrows, chips, buttons, tabs, all-caps labels                 |

Type scale used in this page:

| Role                          | Family             | Size           | Weight | Tracking | Transform |
|-------------------------------|--------------------|----------------|--------|----------|-----------|
| Masthead title                | Bebas Neue         | 56px           | 400    | 0.04em   | uppercase |
| Section title (e.g. ALL EPS)  | Bebas Neue         | 36px           | 400    | 0.04em   | uppercase |
| Hero / episode title          | Playfair Display   | clamp(32–48px) | 700    | -0.015em | none      |
| Card subtitle / poster title  | Playfair Display   | 16px           | 700    | normal   | none      |
| Body                          | Barlow             | 17px           | 400    | normal   | none      |
| Small body                    | Barlow             | 13–14px        | 600    | normal   | none      |
| Eyebrow (gold)                | Barlow Condensed   | 11px           | 700    | 0.42em   | uppercase |
| Section eyebrow / pillar tag  | Barlow Condensed   | 11px           | 700    | 0.32em   | uppercase |
| Chip / button label           | Barlow Condensed   | 11–13px        | 700–800| 0.20–0.28em | uppercase |
| Micro-label                   | Barlow Condensed   | 9–10px         | 700    | 0.22em   | uppercase |
| Episode # (italic)            | Playfair Display   | 18–22px italic | 400    | normal   | none      |

### Spacing + layout

- **Container max-width**: `1280px`, `0 auto` margin, `24px` horizontal gutters.
- **Page section spacing**: hero banner `460px` tall; intro card overlaps with `margin-top: -72px`; catalog has `40px 24px 96px` padding.
- **Grid gap**: `32px 22px` (row × column).
- **Poster aspect ratio**: `2 / 3` (portrait — Apple TV style).
- **Tile min-width**: `200px` via `repeat(auto-fill, minmax(200px, 1fr))`.
- **Card padding**: `36px 40px 32px`.
- **Border radius**: `0` everywhere — this is a hard-edge, editorial design. Do not introduce rounded corners.

### Shadows

- Intro card: `0 24px 60px -20px rgba(0,0,0,0.35)`
- Tile (hovered/focused): `0 24px 60px -12px rgba(0,0,0,0.7), 0 0 0 2px <pillar-color>, 0 0 0 4px rgba(255,255,255,0.12)`
- Hero CTA shadow on play button: `0 12px 36px rgba(239,14,48,0.5), 0 0 0 8px rgba(255,255,255,0.08)`

---

## Components — detailed spec

### 1. Latest-episode strip (`PodcastLatestStrip`)

A full-width horizontal bar that sits directly under the TopNav.

- **Layout**: `display: flex; align-items: stretch;` — three regions left to right.
- **Region 1 (red chip)**: `background: #C9302A`, white text "LATEST EPISODE" (Barlow Condensed 11px / 800 / 0.22em / uppercase), `padding: 0 18px`, vertically centered.
- **Region 2 (title + meta)**: `flex: 1; padding: 12px 24px`. Episode title (Playfair Display 16px/700, color `var(--text-strong)`, ellipsis on overflow) → 4px gold dot → guest name (Barlow 13px, `var(--text-2)`) → 4px dot → release date (Barlow 13px, `var(--text-3)`).
- **Region 3 (CTA button)**: red `#C9302A`, white text "WATCH ON YOUTUBE" with a triangle play SVG (12×12). Hovers darker `#a8231f`.
- **Border-bottom**: `1px solid var(--border-soft2)`.

### 2. Masthead (`PodcastMasthead`)

- **Wrapper**: `max-width: 1280px; margin: 0 auto; padding: 32px 24px 24px;` with `border-bottom: 1px solid var(--border-soft2)`.
- **Eyebrow**: "THE EVOLVED PROS" — Barlow Condensed 11px / 700 / 0.42em / uppercase / `rgba(201,168,76,0.85)`.
- **Title**: "THE PODCAST" — Bebas Neue 56px / 0.04em / uppercase / `var(--text-strong)` / `line-height: 1`. Margin `6px 0 8px`.
- **Subtitle**: italic Playfair Display 16px / 1.5 / `var(--text-2)` / `max-width: 640px`.

### 3. Hero — image banner

- **Section**: `position: relative; height: 460px; overflow: hidden; background: #0A0F18;`
- **Layers (absolute, inset:0)**:
  1. Background image (`backgroundSize: cover; backgroundPosition: center 28%`).
  2. Vertical fade `linear-gradient(180deg, rgba(10,15,24,0) 60%, rgba(10,15,24,0.45) 100%)` — soft fade so the white card edge sits cleanly.
  3. Pillar accent wash `radial-gradient(ellipse at 18% 75%, <pillarColor>26 0%, transparent 55%)`.
- **Floating Runtime chip** (top-right, 28px from top): `padding: 8px 14px`, `background: rgba(10,15,24,0.55)`, `border: 1px solid rgba(255,255,255,0.18)`, `backdrop-filter: blur(10px)`. Label "Runtime" 60% white + duration tabular-nums white.

### 4. Hero — intro card

- **Wrapper**: `max-width: 1280px; margin: -72px auto 0; padding: 0 24px; position: relative; z-index: 2;` (overlaps the banner).
- **Card**: `background: var(--bg-surface); border: 1px solid var(--border-soft2); border-top: 3px solid <pillarColor>; padding: 36px 40px 32px;` with the deep card shadow.
- **Eyebrow row** (flex, gap 12px, wraps): contains in order:
  - "LATEST EPISODE" red chip (`background: rgba(201,48,42,0.12)`, `border: 1px solid rgba(201,48,42,0.5)`, `color: #C9302A`, glowing red dot).
  - Pillar label (Barlow Condensed 11px, `<pillarColor>`).
  - 4px gray dot.
  - "Episode #N" (Playfair italic 18px, gold `#C9A84C`).
  - 4px gray dot.
  - Release date (Barlow Condensed 11px, `var(--text-3)`).
- **Title**: Playfair Display, `clamp(32px, 4.2vw, 48px)`, weight 700, line-height 1.08, `var(--text-strong)`, `text-wrap: pretty`, `max-width: 880px`.
- **Blurb**: Barlow 17px / 1.55 / `var(--text-2)` / `max-width: 720px`.
- **Meta row**: separated by a `1px solid var(--border-soft)` top border. Three groups divided by 1×28px vertical rules:
  - **Guest**: 40×40 round avatar with `2px solid var(--border-med2)`, name (Barlow 14/600) + role (Barlow Condensed 10/0.18em uppercase, `var(--text-3)`).
  - **Released**: micro-label "RELEASED" + `<date>, 2026` value.
  - **Watch on**: micro-label + "YouTube · Spotify · Apple".
- **Action row** (flex, gap 12px, wraps):
  - **Watch episode** — primary `background: #ef0e30`, white text, hover `#ff1a40`. 14×28px padding. Triangle play icon.
  - **Save** — outline button using `var(--text-strong)` and `var(--border-strong)`, bookmark icon.
  - **Share group** — bordered cluster (height 46px) with a leading "SHARE" label + 5 icon-only buttons (44px wide each, separated by `var(--border-soft)`):
    1. **X** (twitter X mark glyph)
    2. **LinkedIn** (in glyph)
    3. **Facebook** (f glyph)
    4. **Email** (envelope outline)
    5. **Copy link** (chain-link outline)
    Hover state: background `var(--bg-elevated)`, color `var(--text-strong)`.

### 5. Catalog header (`PodcastGrid` header)

- **Wrapper**: `max-width: 1280px; padding: 40px 24px 96px`.
- **Header row**: flex, space-between, gap 16px, `border-bottom: 1px solid var(--border-soft2); padding-bottom: 22px`.
  - Left: gold eyebrow "THE ARCHIVE" (same style as masthead eyebrow) + Bebas Neue 36px "ALL EPISODES".
  - Right: episode count "N EPISODES" (Barlow Condensed 12 / 600 / 0.22em uppercase / `var(--text-3)`).

### 6. Filter pills + sort

- **Container**: flex, wrap, gap 10px, `margin-bottom: 32px`.
- **Pill**: `padding: 8px 14px; border: 1px solid <pillarColor>66`. Inactive: transparent bg, text in pillar color. Active: pillar-color bg, `#0A0F18` text, full-color border. Barlow Condensed 11/700/0.22em uppercase.
- **Sort label**: "SORT" (Barlow Condensed 10/700/0.32em uppercase, `var(--text-4)`).
- **Sort `<select>`**: `padding: 8px 32px 8px 12px; background: var(--bg-surface); color: var(--text-strong); border: 1px solid var(--border-strong);` Barlow Condensed 12/700/0.18em uppercase. `appearance: none`. (Implementation note: replace native `<select>` with the host's dropdown component for visual consistency on light and dark themes; the prototype uses native `<select>` which doesn't fully theme.)

### 7. Episode tile (`EpisodeTile`)

A poster-art card. Two parts: the poster button (`aspect-ratio: 2/3`) and the meta block below it.

**Poster button** (`<button>`):
- `width: 100%; aspect-ratio: 2/3; padding: 0; background: #0A0F18; border: none; overflow: hidden; cursor: pointer;`
- **Default**: `transform: perspective(1200px) rotateY(0) rotateX(0) translateY(0) scale(1)`, `box-shadow: 0 1px 0 rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.04)`.
- **Hover/focused**: tracks mouse for parallax tilt. `transform: perspective(1200px) rotateY(<x*0.4deg>) rotateX(<-y*0.4deg>) translateY(-6px) scale(1.04)`. Box-shadow gains the pillar-color focus ring (see Shadows above). Cover image inside scales to 1.08 with a counter-translate so it parallaxes against the frame.
- **Transition**: `transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 280ms ease`.
- **Cover**: absolute background image, `cover / center`.
- **Overlays**: gradient `linear-gradient(180deg, rgba(10,15,24,0) 30%, rgba(10,15,24,0.45) 60%, rgba(10,15,24,0.92) 100%)` + on-hover pillar wash (`linear-gradient(135deg, <pillarColor>1F 0%, transparent 55%)`).
- **Top-left**: episode number — italic Playfair `#` in gold + Bebas Neue tabular-num episode (zero-padded), text-shadow `0 1px 6px rgba(0,0,0,0.6)`.
- **Top-right (column, gap 6px)**: optional "NEW" red chip and/or "✓ WATCHED" teal chip with translucent background.
- **Center play button** (visible on hover): 64px circle, `background: #ef0e30`, white triangle, with the deep red+ring shadow. `transform: translate(-50%,-50%) scale(<0.7 → 1>); opacity: <0 → 1>;` — both transition `240ms`.
- **Bottom row** (left 16px, right 16px, bottom 16px): pillar tag (6px round dot in pillar color + label in pillar color, ellipsis on overflow) on the left; duration chip ("38M") on the right with translucent black blur background.
- **Progress bar** (only when `0 < watched < 1`): 3px tall absolute strip at bottom, dark track, pillar-color fill at `<watched*100>%`.

**Meta block**:
- `padding: 14px 2px 0`.
- **Title**: Playfair 16/700, `text-wrap: pretty`, `-webkit-line-clamp: 2`, `min-height: 2.5em`.
- **Sub line**: Barlow 12, `var(--text-3)`, single line ellipsis: `<guest name> · <date>` with the `·` in `var(--text-5)`.

---

## Data model

The prototype uses a single global object `window.PODCAST_DATA = { PILLARS, EPISODES, fmtDate }`.

### Episode shape

```ts
type Episode = {
  id: string;
  episode: number;            // display number, e.g. 1, 2, 3
  title: string;
  blurb: string;              // 1–2 sentence description for hero card
  pillar: keyof typeof PILLARS;
  guest: {
    name: string;
    role: string;             // short role/company line
    photo: string;            // URL or relative path
  };
  cover: string;              // URL or relative path — landscape image used for hero AND poster
  duration: number;           // minutes (integer)
  releasedAt: Date;
  isNew?: boolean;            // surfaces NEW chip on tile
  watched?: number;           // 0..1 progress; 1 = fully watched
};
```

The latest episode is whichever has the highest `releasedAt`; everything else flows into the catalog grid.

---

## State + interactions

| Surface              | State variable          | Behavior                                                                                  |
|----------------------|-------------------------|-------------------------------------------------------------------------------------------|
| Shell theme          | `shellTheme`            | `'navy' \| 'parchment'`. On change, set `body[data-theme="light"]` for parchment.         |
| Latest strip         | `showLatestStrip`       | Boolean, hides the red strip when off.                                                    |
| Tile density         | `tileDensity`           | `'comfortable' \| 'compact'` (currently affects only spacing — extension point).          |
| Filter               | `filter`                | One of pillar keys or `'all'`. Filters the catalog to that pillar.                        |
| Sort                 | `sort`                  | `'newest' \| 'oldest' \| 'longest'`.                                                       |
| Tile focus/hover     | `focused`               | The `id` of the tile being parallaxed. Mouse tracking writes `tilt: {x, y}` (-0.5..0.5).   |
| Toast                | `toast` (string \| null)| Brief bottom-center notification when "Watch episode" / link buttons are pressed.          |

### Click handlers

- Watch episode (hero CTA, latest strip CTA, tile click) → in production should open the episode detail / start playback.
- Save → bookmark the episode for the user.
- Share icons → open native share sheet or platform share dialog (X intent URL, LinkedIn share, Facebook share, `mailto:`, `navigator.clipboard.writeText` for Copy).

### Keyboard

The poster `<button>` is natively focusable; `onFocus` should also trigger the tile-focus state for the parallax/ring effect, mirroring hover.

---

## Theme switching contract

The recommended pattern: a single React effect on the page-shell component watches the user-selected theme and toggles `data-theme="light"` on `document.body`. Then **all** styling inside any child component should reference the CSS custom properties — no hardcoded colors in JSX `style={}` (except where text always sits over imagery: hero photo, poster overlays, and red CTAs).

```jsx
React.useEffect(() => {
  if (isParchment) document.body.setAttribute('data-theme', 'light');
  else document.body.removeAttribute('data-theme');
  return () => document.body.removeAttribute('data-theme');
}, [isParchment]);
```

This is what makes the page swap instantly between editorial parchment and platform-dark navy without restyling individual nodes.

---

## Assets

- **Episode cover images**: stock guest portraits at `assets/podcast-episode-{N}.jpg` (mock). Replace with real shoot assets in production.
- **Pillar imagery**: `assets/pillar-{N}-{slug}.jpg` (referenced by `PILLARS[*].img`, currently unused on this page but preserved for shared utility with other pillars-aware pages).
- **Avatars**: `assets/guest-{N}.jpg` and similar. The host has a single member-avatar service URL — substitute that.
- **Logo + brand**: shared with the rest of the platform via `topnav.jsx`. No new logo work needed for this page.

---

## Behavior the prototype omits (build these for production)

- Real audio/video player (the prototype just toasts on Watch).
- Pagination / infinite scroll for the catalog (prototype renders all episodes in one grid).
- Real share intents (prototype share buttons are visual only).
- Persistent watch history (`watched` value comes from fixture data).
- Subscribe / RSS / "Add to feed" affordance — discuss with PM whether to add a small subscribe row in the masthead.

---

## Files to study, in priority order

1. `source/podcast-app.jsx` — orchestration + theme effect + tweak schema.
2. `source/podcast-hero.jsx` — strip, masthead, image banner, intro card.
3. `source/podcast-grid.jsx` — filters, sort, tile interactions (parallax, focus ring).
4. `source/podcast-data.jsx` — fixture data and PILLARS map (your colors source of truth).
5. `source/Podcast.html` — root tokens, `<style>` block, font loading, script wiring.
