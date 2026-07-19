# Guest Persona

Introduces a **guest** persona for podcast / keynote guests. A guest receives
complimentary ("comped") Professional access to the platform, fills out a
personalized intake via a signed link, and is surfaced in the admin CRM — all
while being rigorously excluded from revenue (MRR/ARR) reporting.

## Data model (reuses `public.users`)

| Field | Value for a guest |
|---|---|
| `users.role` | `'guest'` (persona; was `member`\|`admin`) |
| `users.tier` | `'pro'` |
| `users.tier_status` | `'comp'` (comped; **no Stripe subscription**) |
| durable identity | written to existing `users` columns: `avatar_url, bio, company, linkedin_url, twitter_handle, role_title, first_name, last_name, full_name` |

### New table: `guest_engagements` (migration 070)

One row per guest booking. Columns: `user_id` (fk `users`, cascade),
`episode_id` (fk `episodes`, nullable), `status`
(`invited`\|`viewed`\|`submitted`\|`confirmed`\|`revoked`), `access_token`
(unique, signed), `token_expires_at`, submission payload (`one_liner`,
`short_bio`, `headshot_url`, `topics` jsonb, `links` jsonb, `av_notes`,
`tee_size`, `consent_release`), `submitted_at`, `invited_by`, timestamps.

- Indexes on `user_id`, `episode_id`, `status`, `token_expires_at`.
- **RLS**: admins full access (authenticated policy); a guest sees only its own
  row (`auth.uid() = user_id`); anonymous `/guest/[token]` reads go through the
  `SECURITY DEFINER` `lookup_guest_engagement(text)` RPC (granted to `anon`).
- Migration **070 is non-destructive**: it only *widens* the `users_role_check`
  and `users_tier_status_check` constraints and adds a new table. Validated
  end-to-end inside a rolled-back transaction against the live schema.

## Route: `/guest/[token]`

- Public server component (`/guest` added to `PUBLIC_ROUTES`; absent from the
  middleware matcher). The **signed token is the credential** (magic-link trust
  model) — validated signature → existence → expiry before anything renders.
- On view: idempotently ensures the persona/entitlement (`ensureGuestPersona`)
  and advances `invited → viewed`. Renders a personalized on-brand guide plus
  the intake form.
- `POST /api/guest/submit` writes the `guest_engagements` payload **and** the
  durable `users` profile fields, and (when the engagement is booked to an
  episode) optionally syncs `episodes.guest_*`.
- `POST /api/guest/upload` — token-gated headshot upload to the `Branding`
  bucket.
- `POST /api/admin/guests` — admin mints an invite: creates/reuses the guest
  user and a `guest_engagements` row with a fresh signed token, returns the
  `/guest/<token>` link.

Token signing lives in `lib/guest/token.ts` (HMAC-SHA256 over a random id,
keyed by `GUEST_TOKEN_SECRET`, falling back to `SUPABASE_SERVICE_ROLE_KEY` so no
new env var is required to ship).

## Authorization

`role='guest'` carries `tier='pro'`, so **existing tier gating** (`hasTierAccess`
in `lib/tier.ts`) already grants full Professional entitlements — no gating code
change was required. The guide page is unlocked via the token.

## Revenue hygiene (guests are never revenue)

A comped guest must never appear as MRR/ARR or as a paying-member count. The
guest slips past the old gates because it has `tier_status='comp'` (a value the
old code didn't exclude) and no `comp_promo_code_id`. Fixes:

- **`lib/pricing.ts`** — `tier_status='comp'` added to `NON_REVENUE_TIER_STATUSES`,
  so `tierMonthlyPrice` returns `$0` for guests. This single upstream change
  propagates to `computeMrr`, `getTierMrr`, and every admin revenue/stats
  surface built on them. `computeMrr` also short-circuits `role='guest'`, and a
  new `isRevenueMember()` predicate centralizes the "counts as paying" rule.
- **`admin/revenue/page.tsx`** — per-tier counts now use `isRevenueMember`
  (excludes `comp`/guest), so the cards sum to Total MRR.
- **`admin/page.tsx`** & **`api/admin/stats/route.ts`** — the last-month
  paying-Pro baseline queries now exclude `role='guest'` and `tier_status='comp'`.

**Direction of travel:** the canonical "is paying" signal is
`stripe_subscription_id IS NOT NULL`. Today no rows carry a subscription id yet
(Stripe is still Phase 1 / test mode), so keying MRR off it would zero out all
current revenue — hence MRR still prices off tier, with the comp/guest/lapsed
exclusions protecting the numbers. `isRevenueMember` is written to tighten to
`Boolean(stripe_subscription_id)` once every payer carries one.

## CRM

- **Guest badge** on the admin member profile header and in the members table
  (distinct from paid tier pills).
- **Guest filter** in the members table (`role='guest'`); the `Pro` filter now
  excludes guests.
- **Guest panel** — a `Guest` tab on the member detail page showing each
  engagement's status, episode, submission payload (one-liner, bio, topics,
  links, headshot, tee size, A/V notes, consent).

## Confirmed deploy config

There is **no `PLATFORM_DOMAIN` env var**. The deploy config
(`.env.example`, `railway.toml`) defines:

- `NEXT_PUBLIC_APP_URL` — the serving app URL (Railway); guest links are built
  from this (`${NEXT_PUBLIC_APP_URL}/guest/<token>`), falling back to
  `https://platform.evolvedpros.com` (matching the friend-invite precedent).
- `NEXT_PUBLIC_SITE_URL` — the canonical brand domain
  (`https://platform.evolvedpros.com`), used for SEO/canonical.

---

## Follow-up (separate PR): retire legacy guest artifacts

The following pre-existing Supabase artifacts are superseded by this feature and
should be retired in a **separate follow-up PR** (not touched here — no
Stripe/billing or destructive changes in this PR):

| Artifact | Type | Location | Status |
|---|---|---|---|
| `guest-welcome` | Edge Function | Supabase (v4, ACTIVE) — not in-repo | Superseded by `/guest/[token]` + `/api/guest/*` |
| `guest-welcome-studio` | Edge Function | Supabase (v2, ACTIVE) — not in-repo | Superseded by the in-app guest guide |
| `get_edge_asset` | RPC (`SECURITY DEFINER`) | `public.get_edge_asset` | Legacy asset delivery for the edge fns above |
| `edge_assets` | Table | `public.edge_assets` | Backing store for `get_edge_asset` |

Retirement checklist for the follow-up:

1. Confirm no external caller still hits the two edge functions (check invocation
   logs for a full billing cycle).
2. `supabase functions delete guest-welcome guest-welcome-studio`.
3. Migration to `DROP FUNCTION public.get_edge_asset(...)` and
   `DROP TABLE public.edge_assets` **after** confirming nothing reads them
   (export any rows first if the assets are still referenced anywhere).
4. Remove any DNS / routing that pointed guests at the edge functions.
