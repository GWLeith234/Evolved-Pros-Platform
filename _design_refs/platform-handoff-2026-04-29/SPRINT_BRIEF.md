# Evolved Pros Platform — Sprint Brief for Backend Wiring

**Audience:** Engineering team (Claude Code or human devs) implementing the production build of the Evolved Pros Platform.

**Status:** Hi-fi design system + 6 page prototypes are complete. This payload contains everything needed to break the work into sprints and wire the UI to the existing backend.

---

## 1. What's in this payload

```
handoff_payload/
├── SPRINT_BRIEF.md           ← this file
├── pages/                    ← 6 page shells (HTML) + 2 partials (TopNav, WelcomeBanner)
├── components/               ← all React/JSX components, organized by page
│   ├── topnav.jsx            ← global nav (used on every page)
│   ├── tweaks-panel.jsx      ← in-design tweak controls (REMOVE in production)
│   ├── home/                 ← home-app, home-sections, home-sponsors, home-tiles
│   ├── media/                ← media-app, media-data, media-hero, media-masthead, media-sections
│   ├── community/            ← community-app, community-feed, community-header, community-rail
│   ├── events/               ← events-app, events-data, events-hero, events-shelves
│   ├── podcast/              ← podcast-app, podcast-data, podcast-grid, podcast-hero
│   └── live/                 ← live-app, live-data, live-globe, live-hero, live-sections
├── styles/
│   └── colors_and_type.css   ← brand tokens — single source of truth for colors, type, spacing
├── assets/                   ← logos, hero imagery, pillar imagery
└── screenshots/              ← reference screenshots of each page (full first-fold)
```

**Conventions used in the prototype:**
- Each page is a single HTML file that loads React 18 + Babel (standalone) and the JSX modules below.
- All editorial / event / podcast / live content sits in a `*-data.jsx` file as a placeholder for CMS output.
- Components share state through `window.*` because Babel-standalone scripts don't share scope. **Move to ES modules + a real bundler in production.**
- All styling is inline-style + `colors_and_type.css` tokens. **Migrate to CSS modules / Tailwind / styled-components per your house standard.**

---

## 2. Pages in scope

| Page | File | Purpose | Key data sources |
|---|---|---|---|
| **Home** | `Home.html` | Logged-in dashboard + welcome | User profile, recent activity, sponsor carousel |
| **Media** | `Media.html` | Editorial publication (TorontoToday-style) | Articles CMS, ticker feed, George's curated list, book excerpts |
| **Community** | `Community.html` | Member feed + spaces | Posts, reactions, comments, member directory |
| **Events** | `Events.html` | Event browser | Events CMS, RSVPs, ticketing |
| **Podcast** | `Podcast.html` | Podcast hub | Episodes CMS, audio CDN, transcripts |
| **Live** | `Live.html` | Live tour + globe view | Tour-stop calendar, ticket links, geocoded venues |

The **TopNav** is shared across all pages. Active route is set by passing `pathname="/media"` etc.

---

## 3. Design system — colors, type, spacing

See `styles/colors_and_type.css` for the canonical tokens. Highlights:

**Colors** (named `--ed-*` for "Evolved" namespace):
- `--ed-bg` (cream paper), `--ed-surface` (white card)
- `--ed-text` (deep ink), `--ed-text-muted`
- `--ed-red` (#C9302A — masthead, NEW tags)
- `--ed-navy` (#1B2A4A — secondary)
- `--ed-gold` (#C9A84C — accent + footer eyebrow)
- `--ed-cream`, `--ed-border`, `--ed-border-soft`

**Typography:**
- Display serif: **Playfair Display** (700) — headlines
- Editorial serif: **Merriweather** (400/700) — body and dek
- Wordmark: **Abril Fatface** — "Evolved Media" lockup only
- UI condensed: **Barlow Condensed** (500/700/800) — eyebrows, meta, buttons
- UI sans: **Barlow** (400/600) — labels, secondary copy

**Category color map** (article chips) is in `media-data.jsx` → `CATEGORY_COLORS`. Categories are: Revenue · AI · Leadership · Foundation · Identity · Mental Toughness · Strategy · Accountability · Execution.

**Don't introduce new fonts or colors without touching `colors_and_type.css`.**

---

## 4. Backend wiring — what each page needs

Below is the contract each page expects. Replace the `*-data.jsx` placeholders with real fetches against your existing API.

### 4.1 TopNav — `topnav.jsx`
- **Props it expects:** `profile` (`{id, display_name, full_name, avatar_url, tier}`), `unreadCount: number`, `pathname: string`, `theme: 'light' | 'dark'`.
- **Backend:**
  - `GET /api/me` → profile
  - `GET /api/notifications/unread-count` → unread badge
  - Tier-gated CTAs (e.g. Academy) check `profile.tier`.

### 4.2 Home — `home-app.jsx`, `home-sections.jsx`, `home-sponsors.jsx`, `home-tiles.jsx`
- **What it shows:** welcome banner, "continue where you left off" tiles, featured pillars, sponsors carousel.
- **Backend:**
  - `GET /api/me/feed` — personalized cards
  - `GET /api/sponsors?placement=home` — carousel
  - `GET /api/pillars` — the 6 pillar tiles (already imaged in `assets/pillar-*.jpg`)

### 4.3 Media — `media-*.jsx`  ← **biggest backend lift**
**`media-data.jsx` is the only file editors should touch today; in production it splits into:**

| Frontend constant | Endpoint | Notes |
|---|---|---|
| `LEAD_STORY` | `GET /api/articles?slot=lead&limit=1` | Editor-pinned, single article |
| `FEATURED` | `GET /api/articles?slot=featured&limit=4` | 2×2 grid |
| `LATEST` | `GET /api/articles?sort=published_desc&limit=8` | Paginated |
| `TRENDING` | `GET /api/articles/trending?limit=5` | Cached 5-min |
| `CURATED` (George's Desk) | `GET /api/articles/curated?curator=george` | CMS collection George reorders |
| `DOSSIERS` | `GET /api/dossiers` | Long-form report packages |
| `BOOK_EXCERPT` | `GET /api/book/excerpt/current` | Editor-controlled |
| `VIDEO_CLIPS` | `GET /api/clips?limit=3` | Mix of Live + Podcast |
| `TICKER` | `GET /api/ticker` (or websocket) | Real-time desk feed |
| `MEDIA_NAV` | Static — keep in code | Categories list |

**Article shape the UI expects:**
```json
{
  "id": "string",
  "slug": "string",
  "category": "Revenue | AI | Leadership | ...",
  "title": "string",
  "dek": "string",
  "byline": "string",
  "readTime": 12,
  "date": "Apr 25, 2026",
  "published": "2026-04-25T14:00:00Z",
  "imageUrl": "string | null",
  "imageTone": "navy | gold | red | cream",
  "imageLabel": "string",
  "featured": false,
  "tone": "string"
}
```

**Social sharing (already wired in UI, needs backend hooks):**
- `EdShare` component (in `media-masthead.jsx`) renders X / LinkedIn / Email / Copy-link buttons on the lead, featured tiles, and top latest cards.
- Today it shares `window.location.origin + pathname + #articleId`. **In production, share the canonical URL** — `https://evolvedpros.com/media/{slug}`. Update `EdShare` to accept a `url` prop derived server-side from the slug.
- **Open Graph / Twitter Card meta tags must be rendered server-side per article.** Required tags: `og:title`, `og:description`, `og:image` (1200×630), `og:url`, `twitter:card=summary_large_image`.
- Fire an analytics event on click: `article_shared` with `{article_id, channel: 'x' | 'linkedin' | 'email' | 'copy', user_id}`.
- Optional: append a referral param `?ref={user_id}` on copy-link for attribution.

### 4.4 Community — `community-*.jsx`
- **Backend:**
  - `GET /api/community/feed?cursor=` — paginated posts
  - `POST /api/community/posts`
  - `POST /api/community/posts/:id/reactions`
  - `GET /api/community/spaces` — left rail
  - `GET /api/community/members?online=true` — right rail

### 4.5 Events — `events-*.jsx`
- **Backend:**
  - `GET /api/events?upcoming=true` — hero + shelves
  - `GET /api/events/:id` — detail
  - `POST /api/events/:id/rsvp` — attendance
  - Ticketing handoff to existing provider (Stripe / Eventbrite — confirm).

### 4.6 Podcast — `podcast-*.jsx`
- **Backend:**
  - `GET /api/podcast/episodes?cursor=` — grid
  - `GET /api/podcast/episodes/:id` — detail with transcript
  - Audio served from existing CDN — pass `audio_url` through.

### 4.7 Live — `live-*.jsx`, `live-globe.jsx`
- **Backend:**
  - `GET /api/live/tour-stops` — globe markers (each needs `{lat, lng, city, country, date, ticket_url, status}`)
  - `GET /api/live/upcoming` — list/shelves
- The globe is a stylized SVG, not a real geo lib — markers render from lat/lng but are tweened in 2D. If you want real WebGL, swap `live-globe.jsx` for `react-globe.gl`.

---

## 5. What to remove before production

- **`tweaks-panel.jsx`** — design-only tooling. Strip from production builds.
- **The floating "Tweaks" button** in each `*-app.jsx` — same.
- **All `EDITMODE-BEGIN` / `EDITMODE-END` comments and the `TWEAK_DEFAULTS` object** — same.
- **Babel standalone CDN scripts in HTML files** — replace with a real build (Vite / Next.js).
- **`window.*` global registrations at the bottom of each component** — convert to ES module exports.

---

## 6. Suggested sprint breakdown

**Sprint 0 — Build setup (1 week)**
- Stand up Next.js (or your preferred framework) project
- Port `colors_and_type.css` to design tokens (CSS vars or Tailwind config)
- Wire shared `<TopNav>`, layout shell, auth gate

**Sprint 1 — Home + Media shell (2 weeks)**
- Build Home with real `/api/me` + `/api/me/feed`
- Media page chrome: masthead, ticker, hero
- Article list endpoints (`LEAD_STORY`, `FEATURED`, `LATEST`)

**Sprint 2 — Media depth (2 weeks)**
- George's Desk, Trending, Book Excerpt, Dossiers, Video Clips
- Article detail page (not in this payload — needs design)
- **Social share wiring + OG tags + analytics events** (see §4.3)

**Sprint 3 — Community (2 weeks)**
- Feed, posts, reactions, comments
- Spaces & member rails
- Realtime updates (websocket or polling)

**Sprint 4 — Events + Ticketing (2 weeks)**
- Events list + detail
- RSVP / ticket purchase flow

**Sprint 5 — Podcast + Live (2 weeks)**
- Podcast grid + player + transcript
- Live tour map + ticket-out flow

**Sprint 6 — Polish + launch (1 week)**
- Performance budget (LCP, CLS)
- A11y audit (we used semantic HTML and ARIA labels — keep them)
- Analytics, error tracking, OG image generator

---

## 7. Open questions for the team

1. **Auth provider** — what powers `GET /api/me` today? (NextAuth, Clerk, custom JWT?)
2. **CMS** — is Media on Sanity / Contentful / custom Postgres? Determines how `media-data.jsx` is replaced.
3. **Article URL strategy** — confirm `/media/{slug}` is the canonical pattern (vs `/articles/{id}`).
4. **Analytics** — Segment, PostHog, GA4? Need event names confirmed.
5. **OG image rendering** — on-the-fly via `@vercel/og` / Cloudinary, or pre-rendered at publish time?
6. **Ticker source** — websocket from CMS, or pull-based?
7. **Globe library** — keep stylized SVG (current) or upgrade to `react-globe.gl` / Mapbox?

Reply on these before Sprint 0 kicks off.

---

## 8. How to read the screenshots

Each screenshot in `screenshots/` is the **first viewport** of a page (1280px wide). Use them as visual targets when reviewing PRs:
- `page-home.png`
- `page-media.png` ← includes social share buttons next to bylines
- `page-community.png`
- `page-events.png`
- `page-podcast.png`
- `page-live.png`

Open the matching `pages/*.html` locally to interact with the prototype (toggle Tweaks, click around).

---

*Prepared by the Evolved Pros design team — April 27, 2026.*
