# Sprint 5 — Surface consistency (no rogue light cards on the dark page)

- **Branch:** `fix/surfaces`
- **Wave:** 2 (run **after** Sprints 3 & 4 — it edits the same two cards)
- **Depends on:** Sprints 3, 4 (shared files: Foundation / current-pillar card)
- **Risk:** Medium (visual prominence)
- **Codebase:** `apps/web/` · Relates to (but doesn't duplicate) the tokens/shape/color doc.

The dark home page has two full-light cards that break the surface system — and they don't even
match each other.

## Files in scope
- `components/home/InProgressPillarHero.tsx` (Foundation / current-pillar card — the **white** one)
- `components/home/ClimbingTowardCard.tsx` (the "Climbing toward Identity" — the **light gray** one)

---

## A5.1 — Resolve the white / gray spotlight cards
**Problem:** The Foundation card is a **white** surface and the "Climbing toward Identity" card is a
**light gray** surface, sitting in an otherwise dark page. Two different light treatments, neither a
defined platform surface (`--bg-surface` / `--bg-elevated`). They read as pasted in from another design.
**Change:** Pick one model and apply to both:
- **Preferred:** convert both to the standard dark surface (`--bg-surface`) with the pillar color as
  a left/top accent + numerals, matching the goal cards. Consistent with the rest of the page.
- **If a "spotlight" light card is intentional:** define it once as a real token-based surface (one
  light value, e.g. `--bg-elevated`), apply it identically to *both* the active and next-pillar
  cards, and document it in `design_system_reference.md` as the "current focus" treatment.
**Acceptance:** No undocumented white/gray surfaces; the active and next-pillar cards use the same
defined surface; both resolve to tokens.

**Sprint 5 done when:** every card on `/home` is either the standard dark surface or one documented
spotlight surface — no one-off whites/grays.

---

## Tone / conventions
- All surfaces resolve to tokens (`--bg-surface` / `--bg-elevated`) — no raw hex/`white`/`gray-*`.
- **Coordination note:** this is Wave 2 because Sprints 3 (metrics) and 4 (numeral face) both edit
  `InProgressPillarHero.tsx`. Rebase on their merged result before starting; confine your diff to the
  surface/background/accent layer.
- If you choose the "intentional spotlight" path, the reference-doc update is part of the deliverable.

## Regression checklist (run dark + light)
- [ ] No undocumented white/gray cards; spotlight surfaces (if kept) are tokenized and applied to both.
- [ ] The active and next-pillar cards use the same defined surface.
- [ ] No console errors; no layout shift vs. baseline.
