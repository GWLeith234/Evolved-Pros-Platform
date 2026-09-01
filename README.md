# Evolved Pros Platform

Member community + learning platform for the Evolved Pros program.
Commerce and billing are handled by **Stripe**; this repository
owns the community, course, and event experience.

---

## Stack

- **Monorepo** — pnpm workspaces + Turborepo
- **Web** — Next.js 14 (App Router) on Railway — `apps/web`
- **Mobile** — Expo / React Native — `apps/mobile`
- **Database / Auth** — self-hosted Supabase (Postgres) on Railway
- **Shared packages** — `packages/db` (TS types + SQL migrations),
  `packages/ui` (shared components)
- **Video** — Mux
- **Email** — Resend
- **Commerce** — Stripe
- **AI** — OpenAI (platform features)

## Repository layout

```
apps/
  web/        Next.js 14 web app (primary surface)
  mobile/     Expo / React Native app
packages/
  db/         Database types + migrations (shared)
  ui/         Shared UI components + design tokens
supabase/
  migrations/ Supabase-specific SQL migrations (011+)
scripts/
docs/
railway.toml  Railway deployment config
turbo.json    Turborepo pipeline
```

## Getting started

```bash
pnpm install
cp .env.example apps/web/.env.local   # fill in secrets
pnpm dev                               # runs turbo run dev
```

The web app expects a Supabase instance and a minimum set of env vars.
See `.env.example`. Optional audience analytics (GA4, Search Console
verification, Microsoft Clarity) are documented in
[`docs/ANALYTICS.md`](docs/ANALYTICS.md).

## Scripts

| Command              | What it does                                           |
| -------------------- | ------------------------------------------------------ |
| `pnpm dev`           | Run every app in dev mode via Turborepo                |
| `pnpm build`         | Build every app                                        |
| `pnpm lint`          | Lint every app                                         |
| `pnpm type-check`    | Type-check every workspace                             |

## Product model (quick glossary)

- **Tiers** — `vip` and `pro`. `vip` was historically called `community`;
  the rename is codified in
  [`supabase/migrations/024_tier_rename_and_keynote.sql`](supabase/migrations/024_tier_rename_and_keynote.sql).
- **Keynote access** — add-on flag on the user row, orthogonal to tier.
  Grants access to keynote-flagged events.
- **Pillars** — the curriculum is organised into six pillars (p1…p6).
  Courses, lessons, and community channels are tagged by pillar.

## Deployment

- Web is deployed to Railway via Nixpacks (`railway.toml` + `nixpacks.toml`).
  Node 20. Standalone boot: `bash scripts/start-standalone.sh`
  (`node apps/web/.next/standalone/apps/web/server.js`).
  Health check: `GET /api/health`. Do not use `next start` — the app
  is `output: 'standalone'`.
- Mobile is built via Expo EAS (configured in `apps/mobile/app.json`).

## Integrations at a glance

| Integration | Inbound               | Outbound                       | Reference                       |
| ----------- | --------------------- | ------------------------------ | ------------------------------- |
| Stripe      | `POST /api/stripe/webhook`           | Stripe Checkout + webhooks                        | `apps/web/lib/stripe/`          |
| Mux         | `POST /api/webhooks/mux`             | Mux Node SDK for upload/asset management              | `apps/web/lib/mux/`             |
| Resend      | —                                    | Transactional email via `@react-email/components`     | `apps/web/lib/resend/`          |
| Supabase    | Row-level security policies          | Service-role admin client for server routes           | `apps/web/lib/supabase/`        |
| GA4 / GSC / Clarity | — (env-gated; no tag if unset) | Page views, Search Console verify, heatmaps     | [`docs/ANALYTICS.md`](docs/ANALYTICS.md) |
