# Sprint 0 — Foundation & schema

**Tags:** `INFRA` `BLOCKER`
**Status:** Blocked by pre-flight review. Do not build this sprint in Evolved-Pros-Platform.
**Review:** [sprint-00-preflight-review.md](./sprint-00-preflight-review.md)
**Requested branch:** `sprint-0-foundation` (not created; this checkout is the Evolved Pros monorepo)

## Goal

A deployed Next.js shell on Railway talking to a Supabase database that holds the whole MVP data model.

## Will work when done

- Repo scaffolded; `/` renders a placeholder masthead on the Railway URL
- Supabase project linked; all MVP tables migrated with RLS enabled
- Seed script creates the site, sections and one sample article
- GitHub Actions runs lint + typecheck + build on every PR
- `.env.example` documents every variable

## Won't change

No UI design, no auth flows, no editor yet.

## Definition of done

Railway URL → loads placeholder → `/api/health` returns `{db:"ok"}`.

## Build scope (as specified)

1. Scaffold: `create-next-app` (TS, App Router, Tailwind, ESLint, `src/`). Add `@supabase/ssr`, `zod`, `date-fns`. Folders: `src/app/(public)`, `src/app/(admin)`, `src/lib/supabase`, `src/components`.
2. Supabase: `supabase init`; link project. Migration `0001_core.sql` creating the MVP tables. Every table: `site_id`, `created_at`, `updated_at`; RLS enabled. Policies for the public read path are required in this migration (see the pre-flight). Full role policies stay in Sprint 1.
3. Seed: one site "Eye Today", sections News, Research & Science, Policy & Law, Treatment & Clinics, Stories, Opinion; one published article.
4. `/api/health` checks a DB round trip.
5. CI: `.github/workflows/ci.yml` → `npm ci`, lint, `tsc --noEmit`, build.
6. Railway: Dockerfile or Nixpacks config, set env vars, deploy.

## Verify

Railway URL loads, `/api/health` → `{"db":"ok"}`, `supabase db reset` runs cleanly.

## Rollback

`git revert HEAD` · `supabase db reset` to last good migration
