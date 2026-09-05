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

`name`, `first_name`, `last_name`, `email`, `phone`, `company`, `message`, `contact_id`

SMS-only (phone, no email) is accepted. Neither identity is `422`.

CRM: `public.crm_prospects` with `source = ai-george` and exact tag `AI George`.
Admin bell title: `New AI George lead`. Type: `system_general`. Action:
`/admin/crm?prospect=<id>` when the upsert returns an id.

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
