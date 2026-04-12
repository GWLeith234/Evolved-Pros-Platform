# Evolved Pros Platform — Vendasta Integration Guide

This document describes every touch point between the Evolved Pros Platform
and the Vendasta ecosystem. It is the canonical reference for a Vendasta
partner engineer (or anyone from Vendasta's side) who needs to understand
how the two systems fit together.

Last updated: April 2026.

---

## 1. High-level architecture

```
         ┌─────────────────┐      order.created        ┌──────────────────────┐
         │                 │ ────────────────────────► │                      │
         │    Vendasta     │                           │  Evolved Pros (web)  │
         │   (commerce +   │ ◄──────────────────────── │  Next.js 14 / Node   │
         │  CRM + email)   │  PATCH /v1/contacts/{id}  │  on Railway          │
         └─────────────────┘   (tags + custom fields)  └──────────┬───────────┘
                  ▲                                               │
                  │                                               ▼
                  │                                    ┌──────────────────────┐
                  │                                    │  Supabase (Postgres) │
                  │                                    │  self-hosted on      │
                  │ renewal-reminder-due tag           │  Railway             │
                  └─────────── cron (daily) ─────────  └──────────────────────┘
```

Responsibilities:

| System        | Owns                                                                            |
| ------------- | ------------------------------------------------------------------------------- |
| **Vendasta**  | Checkout, billing, order lifecycle, contact record, transactional email sending |
| **Evolved Pros** | User accounts, member community, courses, events, tier/entitlement state    |

Vendasta is the **source of truth for commerce**. Evolved Pros is the
**source of truth for platform state** (tier, tier expiry, keynote access).
The two are joined on `users.vendasta_contact_id = contacts.id`.

---

## 2. Inbound webhook — Vendasta → Evolved Pros

### 2.1 Endpoint

```
POST https://web-production-db912.up.railway.app/api/webhooks/vendasta
```

Production hostname above is the current Railway deployment; the canonical
domain will be provided before go-live. Source:
`apps/web/app/api/webhooks/vendasta/route.ts`.

### 2.2 Request format

| Header                  | Value                                                                 |
| ----------------------- | --------------------------------------------------------------------- |
| `Content-Type`          | `application/json`                                                    |
| `x-vendasta-signature`  | `hex(HMAC-SHA256(rawBody, VENDASTA_WEBHOOK_SECRET))`                  |

Body (JSON):

```json
{
  "event_type":    "order.created",
  "order_id":      "order_01HX…",
  "contact_id":    "contact_01HX…",
  "product_sku":   "EP-VIP-M",
  "contact_email": "jane@example.com",
  "contact_name":  "Jane Doe"
}
```

All six fields are required on the handled event types.

### 2.3 Signature verification

The handler recomputes the HMAC with the shared secret and compares using a
timing-safe equality check. Missing secret → `500 Server misconfiguration`.
Bad signature → `401 Invalid signature`. The secret is **never** bypassed,
even in non-production environments.

### 2.4 Supported event types

| `event_type`       | Behaviour                                                                                                                                |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `order.created`    | Create or update the user. Set `tier`, `tier_status='active'`, `tier_expires_at`. Send Resend welcome email. Tag contact in Vendasta.    |
| `order.renewed`    | Extend `tier_expires_at`. Refresh `tier_expiry` custom field on contact. Remove `renewal-reminder-due` tag.                              |
| `order.upgraded`   | Move user to the new tier (e.g. VIP → Professional). Tag contact `upgraded-to-professional`. Update `tier` custom field on contact.      |
| `order.cancelled`  | Set `tier_status='cancelled'` on the user. Tag contact `cancelled`. No immediate access revocation — expiry-based enforcement.           |
| *anything else*    | Logged and acknowledged with `200 { ok: true }`. Forward-compatible.                                                                     |

### 2.5 Response

```json
{ "ok": true }
```

For newly created users (see §4, magic link delivery Path A), the response
additionally contains:

```json
{ "ok": true, "magic_link": "https://…/auth/callback?token_hash=…&next=/onboard" }
```

Error responses follow `{ "error": "<message>" }` with status `4xx`/`5xx`.
Every invocation — success or failure — is persisted to the
`vendasta_webhooks` table along with the raw payload for audit/replay.

### 2.6 Idempotency

The handler keys everything off `vendasta_contact_id` (which has a UNIQUE
constraint in Postgres). Re-sending the same `order.created` payload will
update the existing row rather than duplicate it. Retries are safe.

---

## 3. Product SKU mapping

Defined in `apps/web/lib/vendasta/products.ts`. Keep Vendasta's product
catalog aligned with these SKUs.

| SKU         | Tier          | Billing    | Access window          | Notes                               |
| ----------- | ------------- | ---------- | ---------------------- | ----------------------------------- |
| `EP-VIP-M`  | `vip`         | monthly    | 1 month                | Primary VIP monthly                 |
| `EP-VIP-Y`  | `vip`         | annual     | 12 months              | Primary VIP annual                  |
| `EP-COMM-M` | `vip`         | monthly    | 1 month                | Legacy alias — kept for existing    |
| `EP-COMM-Y` | `vip`         | annual     | 12 months              | Legacy alias — kept for existing    |
| `EP-PRO-M`  | `pro`         | monthly    | 1 month                | Professional monthly                |
| `EP-PRO-Y`  | `pro`         | annual     | 12 months              | Professional annual                 |
| `EP-KEY`    | *(unchanged)* | one-time   | 12 months              | Keynote add-on — sets `keynote_access=true`, tier unchanged |
| `EP-KEY-Y`  | *(unchanged)* | annual     | 12 months              | Keynote annual                      |
| `EP-BOOK`   | `vip`         | one-time   | 6 months               | Book launch bundle                  |

Adding a new SKU is a one-file change in `products.ts`. If Vendasta mints
a SKU not in this map the webhook will return
`500 Unknown product SKU: XXX` and the payload will be logged with
`status='error'`.

---

## 4. Magic link delivery (new user onboarding)

When `order.created` (or a keynote purchase) creates a brand-new account,
the handler calls Supabase Auth to mint a magic link via
`supabase.auth.admin.generateLink({ type: 'magiclink', email })`. The link
points at `${NEXT_PUBLIC_APP_URL}/auth/callback?next=/onboard`.

Delivery of that link to the buyer can run in one of two modes, selected
by the `VENDASTA_MAGIC_LINK_METHOD` env var:

### Path A — response body (default, `VENDASTA_MAGIC_LINK_METHOD=response`)

The link is returned in the webhook response body as `magic_link`. The
Vendasta "order confirmation" email template reads the variable and
renders it as the call-to-action button (e.g. `{{magic_link}}`).

This keeps Vendasta in charge of email delivery and styling, and requires
no outbound call from the platform.

### Path B — Vendasta contact custom field (`VENDASTA_MAGIC_LINK_METHOD=contact_field`)

Immediately after minting the link, the handler PATCHes the contact:

```
PATCH https://marketplace-api.vendasta.com/v1/contacts/{contact_id}
Authorization: Bearer $VENDASTA_API_KEY
Content-Type:  application/json

{ "custom_fields": { "platform_magic_link": "https://…" } }
```

The Vendasta email template then references
`{{ contact.custom_fields.platform_magic_link }}`. Useful if the webhook
response is not wired to the email template in Vendasta's workflow.

Existing users never receive a magic link — only first-time buyers.

---

## 5. Outbound contact sync — Evolved Pros → Vendasta

Thin wrapper in `apps/web/lib/vendasta/contacts.ts`. Every call is
fire-and-forget (errors logged, never thrown) so that contact-sync
failures never break platform operations.

### 5.1 Endpoint

```
PATCH  ${VENDASTA_API_BASE_URL}/contacts/{contact_id}
  default base: https://marketplace-api.vendasta.com/v1

Authorization: Bearer $VENDASTA_API_KEY
Content-Type:  application/json
```

**Action for Alistair:** please confirm this is the correct URL shape for
our partner account (`C5L0`). The code also supports the alternative
`/v1/accounts/C5L0/contacts/{id}` form via the `VENDASTA_API_BASE_URL`
override.

### 5.2 Request body

Any combination of:

```json
{
  "add_tags":      ["vip-member"],
  "remove_tags":   ["renewal-reminder-due"],
  "custom_fields": {
    "tier":             "VIP",
    "tier_expiry":      "2026-05-10T12:00:00Z",
    "platform_url":     "https://app.evolvedpros.com",
    "magic_link":       "https://…",
    "vip_checkout_url": "https://checkout.vendasta.com/…?sku=EP-VIP-M",
    "book_checkout_url":"https://checkout.vendasta.com/…?sku=EP-BOOK"
  }
}
```

### 5.3 Tags written by the platform

| Tag                         | When                                                         |
| --------------------------- | ------------------------------------------------------------ |
| `vip-member`                | `order.created` for EP-VIP-* / EP-COMM-*                     |
| `professional-member`       | `order.created` for EP-PRO-*                                 |
| `book-purchaser`            | `order.created` for EP-BOOK                                  |
| `keynote-purchaser`         | `order.created` for EP-KEY / EP-KEY-Y                        |
| `upgraded-to-professional`  | `order.upgraded` → Professional tier                         |
| `cancelled`                 | `order.cancelled`                                            |
| `renewal-reminder-due`      | Daily cron — set ~30 days before expiry, cleared on renewal  |

Tag naming is additive; Vendasta workflows (email drips, Sales Center
tasks, etc.) can be attached to any of these without platform changes.

### 5.4 Custom fields written by the platform

| Field                | Description                                                   |
| -------------------- | ------------------------------------------------------------- |
| `tier`               | `VIP` or `Professional` — human-readable label                |
| `tier_expiry`        | ISO-8601 timestamp (UTC)                                      |
| `platform_url`       | Canonical web app URL (from `NEXT_PUBLIC_APP_URL`)            |
| `magic_link`         | One-time sign-in link (new users only)                        |
| `vip_checkout_url`   | Pre-filled checkout for upsell workflows                      |
| `book_checkout_url`  | Pre-filled checkout for book bundle                           |

---

## 6. Renewal reminder cron

Source: `apps/web/app/api/cron/renewal-reminders/route.ts`.

```
GET /api/cron/renewal-reminders
Authorization: Bearer $CRON_SECRET
```

Schedule: daily (e.g. `0 9 * * *`), invoked by an external scheduler
(Railway cron, Vercel Cron, or GitHub Actions).

Logic:

1. Select users where `tier_status='active'` and `tier_expires_at` falls
   between 29 and 31 days from now.
2. For each user, add the `renewal-reminder-due` tag to their Vendasta
   contact.
3. A Vendasta email template tied to that tag sends the renewal reminder.
4. When the user renews, the `order.renewed` webhook removes the tag.

This is the only push-style sync the platform does; everything else is
reactive to webhooks.

---

## 7. Ask George — Vendasta AI Assistant

Source: `apps/web/app/api/ask-george/route.ts`.

Evolved Pros embeds a "George" AI assistant backed by a Vendasta AI
Assistant widget. Requests are proxied through the platform so the
client never sees the Vendasta credentials.

| Field           | Value                                                                       |
| --------------- | --------------------------------------------------------------------------- |
| Organisation ID | `C5L0`                                                                      |
| Widget ID       | `96dd7dbb-2a14-11f1-93eb-72103b668f62`                                      |
| Chat URL        | `https://prod.apigateway.co/org/C5L0/aiAssistants/{widgetId}/chat`          |
| Token URL       | `https://sso-api.vendasta.com/openid/connect/token` (2-legged OAuth)        |

Authentication accepts either:

- `VENDASTA_API_KEY` used directly as a bearer token, or
- `VENDASTA_CLIENT_ID` + `VENDASTA_CLIENT_SECRET` exchanged for a
  client-credentials access token, cached until 30s before expiry.

The proxy normalises several response shapes (`reply`, `message`,
`content`, `response`, `choices[0].message.content`) — please flag if
Vendasta settles on a single canonical shape.

---

## 8. Checkout URLs (outbound links in the UI)

- `NEXT_PUBLIC_VENDASTA_CHECKOUT_URL` — base URL of the Vendasta checkout.
  The platform appends `?sku=EP-VIP-M`, `?sku=EP-PRO-Y`, etc.
- `NEXT_PUBLIC_VENDASTA_KEYNOTE_INQUIRY_URL` — used for the keynote card
  CTA on the membership page (defaults to a `mailto:` if unset).

---

## 9. Environment variables

Grouped by purpose.

### Vendasta (required)

| Variable                  | Purpose                                                                       |
| ------------------------- | ----------------------------------------------------------------------------- |
| `VENDASTA_WEBHOOK_SECRET` | HMAC-SHA256 shared secret for verifying inbound webhook signatures            |
| `VENDASTA_API_KEY`        | Bearer token for outbound Marketplace Contact API + fallback for Ask George   |

### Vendasta (optional)

| Variable                              | Default                                   | Purpose                                      |
| ------------------------------------- | ----------------------------------------- | -------------------------------------------- |
| `VENDASTA_API_BASE_URL`               | `https://marketplace-api.vendasta.com/v1` | Override contact API base                    |
| `VENDASTA_MAGIC_LINK_METHOD`          | `response`                                | `response` or `contact_field` (see §4)        |
| `VENDASTA_CLIENT_ID`                  | —                                         | Ask George 2-legged OAuth client id           |
| `VENDASTA_CLIENT_SECRET`              | —                                         | Ask George 2-legged OAuth client secret       |
| `NEXT_PUBLIC_VENDASTA_CHECKOUT_URL`   | —                                         | Public checkout base URL                      |
| `NEXT_PUBLIC_VENDASTA_KEYNOTE_INQUIRY_URL` | `mailto:…`                            | Keynote inquiry CTA on membership page        |

### Platform

| Variable                        | Purpose                                               |
| ------------------------------- | ----------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`           | Public URL — used in magic links + custom fields      |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase URL                                          |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key                              |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase service role key (server only)               |
| `RESEND_API_KEY`                | Resend API key for transactional email                |
| `RESEND_FROM_EMAIL`             | `From:` address for transactional email               |
| `CRON_SECRET`                   | Shared secret for `/api/cron/*` endpoints             |

---

## 10. Relevant database schema

Table `public.users` (excerpt from
`packages/db/migrations/001_initial_schema.sql` + migration 024):

```sql
CREATE TABLE users (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendasta_contact_id TEXT UNIQUE,
  email               TEXT UNIQUE NOT NULL,
  full_name           TEXT,
  role                TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member','admin')),
  tier                TEXT CHECK (tier IN ('vip','pro')),
  tier_status         TEXT DEFAULT 'active'
                        CHECK (tier_status IN ('active','trial','cancelled','expired')),
  tier_expires_at     TIMESTAMPTZ,
  keynote_access      BOOLEAN NOT NULL DEFAULT FALSE,
  -- …
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Audit log table `public.vendasta_webhooks`:

```sql
CREATE TABLE vendasta_webhooks (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type          TEXT NOT NULL,
  vendasta_order_id   TEXT,
  vendasta_contact_id TEXT,
  product_sku         TEXT,
  payload             JSONB NOT NULL,
  status              TEXT NOT NULL CHECK (status IN ('success','error')),
  error_message       TEXT,
  processed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Every inbound webhook — verified or not, successful or failed — results
in one row here. This is the first place to look when debugging a
delivery.

---

## 11. Testing the integration locally

A self-contained harness lives at `scripts/test-vendasta-webhook.ts`.
It builds a payload, signs it with `VENDASTA_WEBHOOK_SECRET`, POSTs it
to the webhook, and then queries Supabase to assert the user row was
created with the correct tier / keynote flag.

```bash
VENDASTA_WEBHOOK_SECRET=dev-secret \
SUPABASE_URL=https://… \
SUPABASE_SERVICE_ROLE_KEY=… \
pnpm test:webhook -- --sku EP-VIP-M --email qa@example.com --url http://localhost:3000
```

Flags:

- `--sku` — one of the SKUs in §3 (default `EP-VIP-M`)
- `--email` — buyer email (default `test+webhook@evolvedpros.com`)
- `--url` — base URL of the running platform (default `http://localhost:3000`)
- `--event` — event type (default `order.created`)
- `--dry-run` — print payload + signature without POSTing

---

## 12. Open questions for Vendasta

Flagged in code as `NOTE:` / `IMPORTANT` comments; collected here for
review:

1. **Contact API URL shape.** `apps/web/lib/vendasta/contacts.ts:8` — is
   `https://marketplace-api.vendasta.com/v1/contacts/{id}` the correct
   form, or should we use `/v1/accounts/C5L0/contacts/{id}`?
2. **Custom field names.** Please confirm the field names in §5.4 match
   what's configured on the Vendasta contact schema for account `C5L0`.
3. **Magic link delivery path.** Which of Path A (response body) or
   Path B (custom field) is better supported by the Vendasta email
   template engine for our order-confirmation workflow?
4. **Webhook retries.** Does Vendasta retry failed deliveries? If so,
   what is the retry policy? The platform is idempotent, so retries are
   safe to enable.
5. **Event type vocabulary.** Does `order.upgraded` fire as a distinct
   event, or do we need to detect an upgrade by comparing consecutive
   `order.created` payloads on the same contact?
6. **Ask George response shape.** Is the normalisation in
   `apps/web/app/api/ask-george/route.ts:113` covering the canonical
   shape, or should we lock to a specific field?

---

## 13. File reference

Everything Vendasta-related in the repo:

| Path                                                            | Purpose                              |
| --------------------------------------------------------------- | ------------------------------------ |
| `apps/web/app/api/webhooks/vendasta/route.ts`                   | Inbound webhook handler              |
| `apps/web/lib/vendasta/products.ts`                             | SKU → tier / expiry map              |
| `apps/web/lib/vendasta/contacts.ts`                             | Outbound contact PATCH helpers       |
| `apps/web/app/api/cron/renewal-reminders/route.ts`              | 30-day renewal tag cron              |
| `apps/web/app/api/ask-george/route.ts`                          | Ask George AI proxy                  |
| `apps/web/app/membership/MembershipPageClient.tsx`              | Checkout CTAs                        |
| `apps/web/app/(auth)/membership-expired/page.tsx`               | Lapsed-member checkout CTA           |
| `apps/web/app/(auth)/auth/callback/route.ts`                    | Magic-link landing / code exchange   |
| `scripts/test-vendasta-webhook.ts`                              | E2E test harness                     |
| `packages/db/migrations/001_initial_schema.sql`                 | `users` + `vendasta_webhooks` tables |
| `supabase/migrations/024_tier_rename_and_keynote.sql`           | Tier rename + `keynote_access` flag  |

---

## 14. Contact

- **Platform engineering:** Geo Leith — `geoleith@gmail.com`
- **Vendasta partner engineering:** Alistair (this document's audience)
- Previously coordinated with Brent Yates on Vendasta's side for
  endpoint/field confirmation — see `NOTE:` comments in
  `apps/web/app/api/webhooks/vendasta/route.ts:44` and
  `apps/web/lib/vendasta/contacts.ts:8`.
