# Cursor pre-flight review — Sprint 0: Foundation & schema

Review only. No application code, migrations, or deploy config were changed.

Read: `docs/sprints/sprint-00-foundation.md`. `docs/sprints/SPRINT-MASTER-INDEX.md` does not exist.
Sprints already completed: none for Eye Today. This checkout is not that product.

## Verdict: BLOCKED

This workspace is [Evolved-Pros-Platform](https://github.com/GWLeith234/Evolved-Pros-Platform) (`claude/init-evolved-pros-platform-Q2oUw`), a production pnpm + Turborepo monorepo. It is not an empty `eye-today` repository. Scaffolding Next.js at the root, adding `supabase/migrations/0001_core.sql`, replacing `.github/workflows/ci.yml`, or pointing Railway at a new shell would hit the live Evolved Pros app, its migration history (through `106_media_publish_notify.sql`), and the existing `/api/health` contract.

No Eye Today repository exists under `GWLeith234`. Stop until the sprint runs in a new, empty repo (or a human explicitly chooses a separate Supabase project and Railway service).

## 1. Dependencies

Nothing this sprint assumes from earlier Eye Today sprints exists, because those sprints were never done. What does exist is a different product, and several names collide:

| Sprint assumes | In this repo |
| --- | --- |
| Empty repo, `npm`, `src/app` | pnpm workspaces, Next.js app at `apps/web` (no `src/`), package name `web` |
| `docs/sprints/SPRINT-MASTER-INDEX.md` | Missing. No `docs/sprints/` before this review |
| Migration `0001_core.sql` on a fresh database | `supabase/migrations/` already has `011`–`106`. A `0001_*` file sorts first and would run against a schema that already has `public.users`, `media_stories`, ads, and episodes |
| New `/api/health` returning `{db:"ok"}` | `apps/web/app/api/health/route.ts` already serves Railway. It returns `status`, `ready`, `supabase`, and uses 503 only when env is missing. `railway.toml` sets `healthcheckPath = "/api/health"` |
| `.env.example` listing only Supabase URL, anon key, service role | `.env.example` already documents Stripe, Resend, Mux, Vendasta, app origins, and preview tokens for Evolved Pros |
| CI: `npm ci`, lint, `tsc --noEmit`, build | `.github/workflows/ci.yml` uses pnpm, `pnpm type-check`, `pnpm lint`, a hex ratchet, and a non-blocking `pnpm build` |
| Tables `sites`, `articles`, `profiles.role` | No `sites` / `articles` / `sections` news model. Membership lives on `public.users`. Publishing lives on `media_stories`. `et_*` in migrations `103` and `104` is the member pro gate and category prefs, not this portal |

## 2. Schema and RLS

Do not add this migration next to the Evolved Pros history. Even in a fresh database, the prompt as written has design bugs:

- **`site_id` on `sites`.** The tenant root cannot require `site_id` before a site row exists. `sites` gets `id`. Every other table gets `site_id` referencing `sites(id)`.
- **RLS timing contradicts itself.** "Policies come in Sprint 1" plus "anon can read published articles/sections" cannot both be true. With RLS on and no policies, anon reads nothing and `/api/health` fails if it uses the anon key. A later `USING (true)` policy would publish drafts. Public `SELECT` policies belong in `0001`.
- **Draft leak.** A policy on `status = 'published'` still leaks a row whose `published_at` is in the future. Require `status = 'published' AND published_at IS NOT NULL AND published_at <= now()`.
- **Grants.** RLS does not replace `GRANT`. Anon needs `SELECT` only on `articles` and `sections`. Newsletter, membership, audit, ad, disclosure, and profile tables stay revoked from `anon` and `authenticated`.
- **Owner bypass.** The migration role owns the tables and skips RLS unless `FORCE ROW LEVEL SECURITY` is set. Supabase `service_role` still bypasses; that key stays server-only.
- **`profiles.id → auth.users` plus `site_id`.** One auth user can have one profile. Say so. Do not invent a composite key in this sprint.
- **Author seed.** `article_authors` needs a `profiles` row, which needs `auth.users`. The sample article does not need an author row. Leave the join empty rather than inserting into `auth.users` from SQL.
- **Missing constraints the prompt never names:** unique `(site_id, slug)` on `articles`, `sections`, and `tags`; `updated_at` trigger; GIN index on `articles.search`; index on `(site_id, status, published_at)`.
- **`search tsvector`.** A bare `NOT NULL` column with no generator fails inserts. Use a trigger (title, dek, body text) and a GIN index, and allow the column to be filled by that trigger.
- **Join tables.** `article_authors`, `article_tags`, and `article_revisions` still get `site_id`, `created_at`, and `updated_at`, matching the sprint rule. Primary keys are the natural pairs, not a second surrogate, except `article_revisions` which needs its own `id`.

No existing Eye Today migration can conflict, because none exist. The conflict is with Evolved Pros.

## 3. Next.js 14

The prompt's App Router shape is valid on Next.js 14.2. Pitfalls:

- `create-next-app@latest` (September 2026) will not install Next.js 14. Pin `create-next-app@14.2.35`. Next 15 makes `cookies()` async; `@supabase/ssr` examples written for 15 will not typecheck on 14.
- The placeholder page is a Server Component. Do not add `"use client"`.
- Put the only `page.tsx` in `src/app/(public)/page.tsx`. A second `src/app/page.tsx` conflicts. Route groups do not appear in the URL.
- Create the Supabase client inside the handler. A module-scope service client throws at import when the key is missing and turns the health route into a build or boot failure.
- Set `export const dynamic = 'force-dynamic'` and `Cache-Control: no-store` on `/api/health`. Otherwise the App Router can cache a build-time failure or a stale `{db:"ok"}`.
- `NEXT_PUBLIC_*` is inlined into the client bundle. The service-role key must not use that prefix and must not be read from a Client Component.

No middleware, server actions, or auth are in this sprint. Do not add them.

## 4. Library accuracy

In scope for this sprint:

| Package | Status |
| --- | --- |
| `next@14.2.35` | Correct if pinned. `latest` is wrong |
| `@supabase/ssr` | Correct. Do not use `@supabase/auth-helpers-nextjs` (deprecated) |
| `@supabase/supabase-js` | Pulled in by `@supabase/ssr`. Server client: `createServerClient`. Browser: `createBrowserClient`. Service role: `createClient` from `supabase-js` in a `server-only` module |
| `zod` | Pin `zod@3`. Zod 4 is a breaking upgrade and this sprint does not need it |
| `date-fns` | Pin `date-fns@3`. v4 is ESM-only and unused until a later sprint formats dates |

Named in the review checklist but not in this sprint's build: TipTap, Resend, Stripe, Anthropic. Do not install them. This repo already depends on `@supabase/ssr`, `resend`, `stripe`, and `@anthropic-ai/sdk` for Evolved Pros; that is not a reason to reuse this app.

## 5. Security

- No server actions and no auth flows in this sprint. Do not stub an admin action that trusts the client.
- Service-role key: `src/lib/supabase/admin.ts` only, first line `import "server-only"`. The health route should use the **anon** key and `select` one `sections` row so a missing public policy fails the probe instead of being hidden by a bypass.
- Anon `SELECT` policies only on `articles` (published and already live) and `sections`. No `INSERT` / `UPDATE` / `DELETE` policies. Writes go through the service role until Sprint 1.
- `body_html` is stored, not rendered. Do not `dangerouslySetInnerHTML` on the placeholder.
- Seed and health responses must not echo keys, emails, or row payloads. Health body is `{db:"ok"}` or `{db:"error"}`.
- No rate limit is required on a read-only health probe. Do not add a public write endpoint for ad events in this sprint.

## 6. Scope

The DDL plus a placeholder page fits one session **in an empty repo**. These parts of the written definition of done are not satisfiable here:

- "Supabase project linked" needs a new project ref. Linking the Evolved Pros database is a production incident.
- "Railway URL" needs a new service. `railway.toml` in this repo builds `pnpm --filter web` and boots the Evolved Pros standalone server.
- Replacing CI would drop the Evolved Pros typecheck, lint, hex ratchet, and entitlement tests.
- `SPRINT-MASTER-INDEX.md` is referenced and absent. This sprint file is the only Eye Today spec that was provided.

Human decision required before any build: new GitHub repo `eye-today`, new Supabase project, new Railway service. Not a folder inside this monorepo.

## 7. Likely bugs

1. **`create-next-app@latest` installs Next 15** while the rest of the prompt is written for 14. Pin `14.2.35`, React 18, and the Next 14 cookie API.
2. **RLS on with no `SELECT` policy, or `USING (true)`.** The first makes the health check fail; the second exposes drafts. Ship the published-only policy and column grants in `0001`.
3. **`sites.site_id NOT NULL`.** The seed insert cannot satisfy the foreign key. `sites` has `id` only.
4. **Health route prerendered or constructed at import.** Build fails closed without secrets, or production caches a dead probe. Dynamic route, client created inside `GET`, anon query, no service role.
5. **`supabase link` aimed at the existing project**, then `db push` applies `0001_core.sql` to Evolved Pros. Init locally. Link only when `SUPABASE_PROJECT_REF` is a new, empty project. Refuse to link if `public.users` or `media_stories` already exists.

## Issues

| # | Severity | Area | Issue | Recommended fix |
| --- | --- | --- | --- | --- |
| 1 | blocker | repo | Checkout is Evolved-Pros-Platform, not an empty `eye-today` repo | Build only in a new repository. Do not touch `apps/web`, `supabase/migrations`, CI, or `railway.toml` here |
| 2 | blocker | schema | `0001_core.sql` would run ahead of migrations `011`–`106` on the Evolved Pros database | New Supabase project. Never `supabase link` this database |
| 3 | blocker | deploy | Railway healthcheck already uses `/api/health` with a different JSON contract | New Railway service. Leave the Evolved Pros probe unchanged |
| 4 | blocker | schema | `site_id` required on `sites`, and public read deferred to Sprint 1 | `sites.id` is the tenant key. Add anon `SELECT` policies for live articles and sections in `0001` |
| 5 | high | schema | Published policy can leak scheduled rows; other tables inherit broad grants | `published_at <= now()`. Grant `SELECT` only on `articles` and `sections` |
| 6 | high | Next.js | Unpinned `create-next-app` and a module-scope Supabase client | Pin Next 14.2.35. Build the client inside the handler. `force-dynamic` |
| 7 | high | security | Health check via service role hides RLS mistakes; key can land in a client bundle | Anon read of `sections`. `server-only` admin module. No `NEXT_PUBLIC_` service key |
| 8 | high | seed | Author row requires `auth.users`, which a SQL seed will get wrong | Seed site, six sections, and one article. No `article_authors` row |
| 9 | low | docs | Master index is missing, so later sprints have nothing to diff against | Add the index when the Eye Today repo is created, before Sprint 1 |
| 10 | low | libraries | Zod 4 / date-fns 4 are unnecessary breaks; TipTap, Resend, Stripe, Anthropic are out of scope | Pin `zod@3` and `date-fns@3`. Do not install the others |

## Corrected Claude Code build prompt

Do not run this prompt in Evolved-Pros-Platform. Run it only in a new, empty Git repository named `eye-today`, with a new empty Supabase project and a new Railway service. If `public.users` or `media_stories` exists, stop.

```
SPRINT 0 — Foundation & schema
SESSION HEADER — Eye Today
You are working on Eye Today — a Next.js 14 (App Router, TypeScript, Tailwind) news portal
on Supabase (Postgres/Auth/Storage), deployed on Railway. Repo: eye-today.
Sprint docs live in docs/sprints/. Read docs/sprints/sprint-00-foundation.md before starting.
There is no master index yet; do not invent later sprints.
Rules:
- Work only within this sprint's scope. Create the branch sprint-0-foundation before changing anything.
- This repo must be empty of application code. If it already contains apps/web, Evolved Pros migrations, or a Railway health contract, stop.
- All DB changes go in supabase/migrations as NEW files. This sprint's only migration is 0001_core.sql.
- Never commit secrets. Every variable goes in .env.example.
- Never prefix the service-role key with NEXT_PUBLIC_.
- Do not install TipTap, Resend, Stripe, or the Anthropic SDK.
- Run npm run lint, npx tsc --noEmit, and npm run build before committing.
- Link or deploy only to a new Supabase project and a new Railway service.
- End by summarising what changed, files touched, and how to verify.

Scaffold the Eye Today platform and create the full MVP data model.

1. Scaffold with this exact command from the empty repo root:
   npx create-next-app@14.2.35 . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-turbopack
   Install: @supabase/ssr @supabase/supabase-js zod@3 date-fns@3 server-only
   Folders: src/app/(public), src/app/(admin), src/lib/supabase, src/components.
   The only page is src/app/(public)/page.tsx: a server component whose text masthead reads "Eye Today".
   No client components, no middleware, no auth, no editor.

2. Supabase: supabase init. Do not link unless SUPABASE_PROJECT_REF refers to a new empty project.
   Add supabase/migrations/0001_core.sql:
   - sites (id, name, slug unique, created_at, updated_at). No site_id column.
   - Every other table has site_id → sites(id), created_at, updated_at, and a shared set_updated_at trigger.
   - profiles (id → auth.users on delete cascade, display_name, bio, avatar_url, role app_role not null default 'reader').
     app_role: reader, supporter, contributor, editor, admin. One profile per auth user.
   - sections (slug, name, sort, parent_id self-FK on delete set null). Unique (site_id, slug).
   - tags (slug, name). Unique (site_id, slug).
   - media (storage_path, alt, credit, caption, width, height).
   - articles (section_id, slug, title, dek, body_json jsonb, body_html, hero_media_id → media,
     status article_status not null default 'draft', is_sponsored boolean not null default false,
     sponsor_name, published_at, scheduled_for, seo_title, seo_description, search tsvector).
     article_status: draft, submitted, in_review, scheduled, published, archived.
     Unique (site_id, slug). Index (site_id, status, published_at desc).
     Trigger maintains search from title, dek, and body_html. GIN index on search.
   - article_authors (article_id, profile_id, sort int, primary key (article_id, profile_id)).
   - article_tags (article_id, tag_id, primary key (article_id, tag_id)).
   - article_revisions (id, article_id, body_json, body_html, created_at).
   - disclosures (profile_id, text).
   - newsletter_lists, newsletter_subscribers, newsletter_issues.
   - ad_slots, ad_campaigns, ad_creatives, ad_events.
   - membership_tiers, memberships, audit_log.
   RLS: ENABLE and FORCE on every table including sites.
   Policies in this file, not deferred:
   - anon and authenticated may SELECT sections.
   - anon and authenticated may SELECT articles only when status = 'published'
     AND published_at IS NOT NULL AND published_at <= now().
   - No insert, update, or delete policies. service_role bypasses RLS and is the only writer.
   Grants: REVOKE ALL from anon and authenticated on all of these tables, then GRANT SELECT
   on sections and articles only.
   src/lib/supabase/admin.ts starts with import "server-only" and is not imported by the health route.

3. Seed in supabase/seed.sql (so supabase db reset applies it): one site slug eyetoday named "Eye Today";
   sections News, Research & Science, Policy & Law, Treatment & Clinics, Stories, Opinion;
   one published article in News. No auth.users row and no article_authors row.
   Use fixed UUIDs. ON CONFLICT DO NOTHING so a second reset is safe.

4. src/app/api/health/route.ts: export const dynamic = "force-dynamic".
   Build an anon server client inside GET. select id from sections limit 1.
   200 {db:"ok"} when the query returns no error. 503 {db:"error"} when env is missing or the query errors.
   Cache-Control: no-store. Do not include the Supabase error text in the body.
   Do not use the service role.

5. CI: .github/workflows/ci.yml on pull_request. Node 20. npm ci, npm run lint, npx tsc --noEmit, npm run build.
   Build env: NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co and a placeholder anon key.
   The health route must not throw while those placeholders are set and no database is reachable at build time.

6. railway.toml: Nixpacks, healthcheckPath = "/api/health", healthcheckTimeout = 30.
   .env.example documents NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
   SUPABASE_SERVICE_ROLE_KEY (server only), and optional SUPABASE_PROJECT_REF (link only, not NEXT_PUBLIC_).
   Deploy only if a new Railway service is already available. Do not point an existing Evolved Pros service at this app.

Verify: / renders "Eye Today". /api/health returns {"db":"ok"} against the seeded database.
supabase db reset completes on a fresh local database. npm run lint, npx tsc --noEmit, and npm run build pass.
Branch: sprint-0-foundation
```

## Ready to build in this repo

NO.
