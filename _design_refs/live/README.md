# Evolved Pros — LIVE page handoff

This package contains everything needed to recreate the LIVE page exactly as designed.

## What's in here

```
Live.html                  Entry point. Open in any browser.
colors_and_type.css        Global theme tokens (colors, fonts, spacing). DO NOT INLINE.
topnav.jsx                 Shared top navigation component.
tweaks-panel.jsx           In-page design tweaks panel (toggles + controls).

live-app.jsx               Root React app. Composes all sections. Owns tweak state.
live-hero.jsx              Masthead + split hero (photo + stats + CTA).
live-globe.jsx             Animated SVG globe with pulsing pins.
live-data.jsx              All page data — pin list, upcoming dates, topics, testimonials.
live-sections.jsx          Upcoming dates, Topics (Six Pillars), Testimonials, Photo rotator, Final CTA.

assets/                    All imagery used on the page.
screenshots/               Reference renders captured top-to-bottom (01 → 08).
```

## Stack

- React 18.3.1 (UMD via unpkg, pinned)
- Babel standalone 7.29.0 for inline JSX
- No bundler. Pure HTML + JSX scripts.
- Google Fonts: Bebas Neue, Playfair Display, Barlow, Barlow Condensed

## Recreating in production

1. **Colors** live in `colors_and_type.css` and the `<style>` block at the top of `Live.html`. Use these CSS custom properties verbatim — they map to the brand system.
2. **Type ramp:**
   - Display / numerics → Bebas Neue
   - Headings → Playfair Display
   - Body → Barlow
   - Eyebrows / labels → Barlow Condensed (700 weight, 0.28–0.42em letter-spacing, uppercase)
3. **Brand accent** is `#C9A84C` (gold). Highlight / featured pins are `#ef0e30` (red).
4. **The globe** is a hand-rolled SVG orthographic projection — see `live-globe.jsx`. Pins with `featured: true` render in red and pulse continuously. Auto-rotation is 12°/sec.
5. **The Six Pillars** are the page's content backbone. Each has a color, image, and label defined in `live-data.jsx → TOPICS`. These match the Podcast page taxonomy.

## Open / preview

Just open `Live.html` in a browser. Everything is wired with relative paths.
