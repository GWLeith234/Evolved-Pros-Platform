# AI George leads (Conversations AI → CRM)

George YES via CoS 2026-09-04. Sprint S3.

Ingress only. This is not the archived Vendasta product integration
(`docs/VENDASTA_INTEGRATION.md` / deleted #80). Do not point this URL at
order/SKU webhooks.

## Widget surface (CoS sync)

The Conversations AI widget is **not a standalone page**. There is no
`/ask-george` route and no `/api/ask-george` proxy.

| | |
| --- | --- |
| Product name | Ask George (TopNav drawer) |
| Host | `https://platform.evolvedpros.com` (app), not www |
| Representative URL | `https://platform.evolvedpros.com/home?ask=george` |
| Path | `/home` plus query `ask=george` (opens the drawer) |
| Chrome | Member TopNav on signed-in `(member)` routes. Also on session-optional routes (`/pricing`, `/membership`, `/podcast`) when the visitor is signed in. |
| Anonymous public chrome | No widget (`PublicChromeHeader` has no Ask George) |
| Vendasta widget id | `96dd7dbb-2a14-11f1-93eb-72103b668f62` |
| Embed | `AskGeorgeDrawer` → `#ask-george-webchat` |

Ingress stays the Automation webhook below. The widget does not POST leads
itself.

## Railway env (name only)

| Variable | Set by |
| --- | --- |
| `VENDASTA_CONVERSATIONS_WEBHOOK_SECRET` | CoS / Railway dashboard. This PR does not set it. |

Do **not** reuse `VENDASTA_WEBHOOK_SECRET` (HMAC from #80).

## Automation (CoS)

| | |
| --- | --- |
| Method | `POST` |
| URL | `https://platform.evolvedpros.com/api/webhooks/vendasta-conversations` |
| Header | `x-webhook-secret: <VENDASTA_CONVERSATIONS_WEBHOOK_SECRET>` |
| Body | Flat JSON. Nested objects are not supported by Vendasta Send a webhook. |

Map these keys in the Automations UI (aliases in
`docs/fixtures/vendasta-conversations-ai-webhook.md`):

`name`, `first_name`, `last_name`, `email`, `phone`, `company`, `message`,
`summary` (or `conversation_summary` / `conversationSummary`), `contact_id`

**Summary mapping (CoS):** map the conversation summary token to `summary`
or `conversation_summary`. If that token is unavailable, map the last
message / transcript snippet to `message`, `conversation`, or `snippet`.
Those aliases still land in `crm_prospects.conversation_summary`.

SMS-only (phone, no email) is accepted. Neither identity is `422`.
Empty or whitespace-only identity fields are `422`. The display fallback
`AI George lead` cannot create a CRM row by itself.

CRM: `public.crm_prospects` with `source = ai-george` and exact tag `AI George`.
Column `conversation_summary` (migration `090_crm_prospects_conversation_summary.sql`).
CoS must apply that SQL in the Supabase SQL Editor. If the column is not
there yet, the webhook still writes a labelled `Conversation summary:`
block into notes and retries the row write without the column.
Admin CRM shows the summary on the card and in the prospect modal.
Admin bell title: `New AI George lead`. Type: `system_general`. Action:
`/admin/crm?prospect=<id>` when the upsert returns an id.

## Widget / Automation prompt (locked)

Collect in this order: **name → phone → email**. Do not pitch a business
email. This repo does not change the live widget system prompt.

## Synthetic lead (after the env secret is set)

```bash
curl -sS -X POST "$APP_URL/api/webhooks/vendasta-conversations" \
  -H "content-type: application/json" \
  -H "x-webhook-secret: $VENDASTA_CONVERSATIONS_WEBHOOK_SECRET" \
  -d @docs/fixtures/vendasta-conversations-ai-webhook.example.json
```

Expect `{ "ok": true }`. Then confirm the Prospects CRM row tagged
`AI George` and the admin bell.

Auth failure (missing or wrong secret) is `401`. Unset env is `503`.
