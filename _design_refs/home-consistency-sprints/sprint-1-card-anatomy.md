# Sprint 1 — Card anatomy: one shell, one header grammar

- **Branch:** `fix/card-anatomy`
- **Wave:** 0 (parallel with Sprint 2; both must land before Waves 1–2)
- **Depends on:** none
- **Risk:** Low-medium (structural, cascades from one shell) · **Leverage:** Highest
- **Codebase:** `apps/web/`

Today the four top tiles (Community Pulse, Top Stories, Latest Drops, Daily Pulse) and the lower
cards each invented their own header, badge, row, and footer. Lock one anatomy.

## Files in scope
- `components/home/tiles/TileCard.tsx` (the `TileShell`) — header slot + footer slot
- `components/home/tiles/CommunityPulseTile.tsx`
- `components/home/tiles/TopStoriesTile.tsx`
- `components/home/tiles/PodcastReelTile.tsx` (Latest Drops)
- `components/home/DailyPulseCard.tsx`
- Extract shared `TileRow` (new) under `components/home/tiles/`

---

## A1.1 — Standardize the tile header (eyebrow · title · status slot)
**Problem:** The four-up tiles share a *visual* header but not a *grammar*. Eyebrows mix section
names with a time word: `COMMUNITY` / `TOP STORIES` / `PODCAST` / **`TODAY`**. The top-right status
badge means a different thing in every tile: `3 NEW` (count), `MEDIA` (source label), `EP 6`
(number), `0/5` (progress fraction). A user can't learn what the top-right corner means.
**Change:**
- Header is always: **eyebrow** (section name, Barlow Condensed, tracked, all-caps) · **title**
  (sentence case) · **status pill** (one consistent role).
- Eyebrow = the destination section name, always: `COMMUNITY` · `MEDIA` · `PODCAST` · `DISCIPLINE`
  (rename `TODAY` → the section it links to; "today" is a time concept, not a section).
- The status pill's role is **one new-since-last-visit count** across all tiles, rendered
  identically (`3 NEW`, `2 NEW`, or hidden at `0`). Move the *kind* labels (`MEDIA`, `EP 6`) out of
  the pill — `EP 6` belongs on the row, `MEDIA` is already the eyebrow. Daily Pulse's `0/5` progress
  is **not** a header badge — it lives in the body ring (see A1.3 / Sprint 2 A2.3).
**Acceptance:** All four tile headers use the same three-slot grammar; the top-right pill, when
present, is always a "N NEW" count and nothing else. No eyebrow is a time word.

## A1.2 — One list-row template, mapped per tile
**Problem:** Each tile's rows are bespoke — the leading element, metadata position, and trailing
element are all in different places, so the eye re-learns each column.
**Change:** Define one row: **[leading token] · [primary line] / [secondary meta line] ·
[trailing action]**, fixed positions. Extract a shared `TileRow` (leading / primary / meta /
trailing). Map each tile:
- Community: leading = avatar · primary = author · meta = relative time + body snippet ·
  trailing = reaction counts.
- Top Stories: leading = rank numeral · primary = headline · meta = category + read time ·
  trailing = none.
- Latest Drops: leading = episode number chip · primary = title · meta = guest + role ·
  trailing = play button.
- Daily Pulse habits: leading = checkbox · primary = habit · meta = none · trailing = streak pill.
- Same vertical rhythm, same meta type ramp, same trailing alignment in all four.
**Acceptance:** All tile rows share one component; leading tokens left-aligned in a single column,
trailing actions right-aligned in a single column, meta uses one type style.

## A1.3 — One footer per tile, same position
**Problem:** Three tiles have a bottom "ALL <X> →" link, but Daily Pulse ends with an inline
`+ ADD COMMITMENT` action instead — so the fourth column has no footer link and an extra in-body
CTA. Footer copy is also uneven ("ALL IN COMMUNITY" vs "ALL STORIES").
**Change:** Every tile gets the same footer: a single right-or-center aligned `ALL <SECTION> →` link
in the same row. Normalize copy to `ALL <NOUN> →` (`ALL POSTS` · `ALL STORIES` · `ALL EPISODES` ·
`ALL HABITS`). Keep `+ Add commitment` as an in-body action *above* the footer, not as a replacement.
**Acceptance:** All four tiles have an identically positioned `ALL … →` footer; Daily Pulse no
longer omits it.

**Sprint 1 done when:** the four top tiles are visually interchangeable in structure — swap their
contents and the chrome is identical. One `TileShell` (`TileCard`), one `TileRow`, one header
grammar, one footer.

---

## Tone / conventions
- Sentence case for body & titles; ALL CAPS only for ≤3-word labels via `text-transform`;
  em dashes over hyphens. (§1.3)
- No inline data formatting — route through `lib/format.ts` (Sprint 2). If Sprint 2 hasn't landed,
  leave a `// TODO(format)` and use the local value, but do not invent a new inline format.

## Regression checklist (run dark + light)
- [ ] `/home` renders with no console errors and no layout shift vs. baseline.
- [ ] The four top tiles share one header grammar (eyebrow · title · "N NEW" pill), one row
      template, one `ALL … →` footer.
- [ ] No eyebrow is a time word; the top-right pill is always a "N NEW" count or hidden.
