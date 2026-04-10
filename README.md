# Evolved Pros Platform

Member community + learning platform for the Evolved Pros program.
Commerce, billing, and CRM are handled by **Vendasta**; this repository
owns the community, course, and event experience.

If you're here to understand the **Vendasta ↔ Evolved Pros integration**,
jump straight to [`docs/VENDASTA_INTEGRATION.md`](docs/VENDASTA_INTEGRATION.md).

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
- **Commerce + CRM** — Vendasta (external)
- **AI** — OpenAI (platform features) + Vendasta AI Assistant ("Ask George")

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
  test-vendasta-webhook.ts   End-to-end Vendasta webhook harness
docs/
  VENDASTA_INTEGRATION.md    Vendasta integration reference
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
See `.env.example` and [`docs/VENDASTA_INTEGRATION.md` §9](docs/VENDASTA_INTEGRATION.md#9-environment-variables)
for the full list.

## Scripts

| Command              | What it does                                           |
| -------------------- | ------------------------------------------------------ |
| `pnpm dev`           | Run every app in dev mode via Turborepo                |
| `pnpm build`         | Build every app                                        |
| `pnpm lint`          | Lint every app                                         |
| `pnpm type-check`    | Type-check every workspace                             |
| `pnpm test:webhook`  | End-to-end test for the Vendasta webhook (`scripts/`)  |

## Product model (quick glossary)

- **Tiers** — `vip` and `pro`. `vip` was historically called `community`;
  the rename is codified in
  [`supabase/migrations/024_tier_rename_and_keynote.sql`](supabase/migrations/024_tier_rename_and_keynote.sql).
- **Keynote access** — add-on flag on the user row, orthogonal to tier.
  Grants access to keynote-flagged events.
- **Pillars** — the curriculum is organised into six pillars (p1…p6).
  Courses, lessons, and community channels are tagged by pillar.
- **Vendasta contact ID** — stored on `users.vendasta_contact_id`, unique,
  the join key between the two systems.

## Deployment

- Web is deployed to Railway via Nixpacks (`railway.toml`).
  Health check: `GET /api/health` returns a status payload with
  Supabase / Resend / Mux / Vendasta env presence.
- Mobile is built via Expo EAS (configured in `apps/mobile/app.json`).

## Integrations at a glance

| Integration | Inbound               | Outbound                       | Reference                       |
| ----------- | --------------------- | ------------------------------ | ------------------------------- |
| Vendasta    | `POST /api/webhooks/vendasta` (HMAC) | `PATCH /v1/contacts/{id}` (Bearer), AI Assistant chat | [`docs/VENDASTA_INTEGRATION.md`](docs/VENDASTA_INTEGRATION.md) |
| Mux         | `POST /api/webhooks/mux`             | Mux Node SDK for upload/asset management              | `apps/web/lib/mux/`             |
| Resend      | —                                    | Transactional email via `@react-email/components`     | `apps/web/lib/resend/`          |
| Supabase    | Row-level security policies          | Service-role admin client for server routes           | `apps/web/lib/supabase/`        |
