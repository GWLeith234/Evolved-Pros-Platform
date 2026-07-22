# Evolved Pros — Style Guide (LAW)

Every UI change must comply. CI enforces the hex ratchet; reviewers enforce the rest.

## 1. Colors — tokens only

- NEVER write raw hex/rgb in components or pages. All color goes through Tailwind theme tokens.

- Semantic tokens (theme-aware, preferred): `bg-page`, `bg-surface`, `bg-elevated`, `text-primary`, `text-secondary`, `text-tertiary`, `border-color`. These resolve via CSS variables in globals.css and invert correctly between themes.

- Brand tokens (fixed): `navy` (#1B2A4A) / `navy-dark` (#112535) / `navy-deep` / `navy-nav`, `red` (#C9302A, CTA) / `red-hot` (#ef0e30), `teal` (#0ABFA3), `gold` (#C9A84C, VIP), `blue` (#60A5FA, Strategy), `violet` (#A78BFA), `paper` (#F5F0E8).

- Pillar colors: P1 amber #FFA538, P2 violet #A78BFA, P3 crimson #F87171, P4 blue #60A5FA, P5 gold #C9A84C, P6 teal #0ABFA3 — expose as tokens if not already; never inline.

- New color needed? Add it to tailwind.config.ts / globals.css FIRST, then use the token. No exceptions.

## 2. Themes — both, always

- App is DARK BY DEFAULT; light mode = `.light-mode` on `<html>`. Tailwind `dark:` is bound to this class (see tailwind.config.ts) — it does NOT track OS setting.

- Prefer semantic tokens over `dark:` overrides; use `dark:` only for one-offs a token can't express.

- Every new or edited surface MUST be eyeballed in BOTH themes before commit. No stuck-dark cards in light mode, no invisible text.

- Nav logo swaps per theme: logo_nav_light on light, logo_nav_dark on dark (Supabase bucket `Branding`, capital B).

## 3. Typography — fixed roles

- `font-bebas` (Bebas Neue): hero headlines, nav wordmarks, display numerals.

- `font-display` (Playfair Display): editorial display serif.

- `font-condensed` (Barlow Condensed): eyebrows, labels, buttons, uppercase micro-type.

- `font-body` (Barlow): body copy. Default.

- `font-serif` (Merriweather): long-form article body.

- Abril Fatface: EVOLVED MEDIA masthead ONLY. Nowhere else.

- Use the `ep-*` type scale (ep-display, ep-h1..h3, ep-body, ep-eyebrow, ep-label). Do not invent ad-hoc font sizes.

## 4. Enforcement

- CI runs scripts/check-hex-ratchet.sh: raw hex count in apps/web/app + apps/web/components must be <= the baseline in .hex-baseline. Adding hex fails the build. Converting hex to tokens? Lower the baseline in the same commit.

- Allowed hex locations: tailwind.config.ts, globals.css, email templates under lib/resend (email clients need inline hex).

- Every PR/commit touching UI states in its message: "themes: verified light+dark".
