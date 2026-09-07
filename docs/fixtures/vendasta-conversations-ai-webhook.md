# Conversations AI webhook payload (sanitized fixture)

No live Conversations AI webhook sample exists in this repo or in
`docs/VENDASTA_INTEGRATION.md` (that file is the archived #80 product
integration and is **not** revived here).

Vendasta Business App Automation **Send a webhook** posts a partner-defined
**flat JSON object**. Nested JSON is not supported unless the operator
constructs it by hand. Official example keys from Vendasta's WebhookAction
guide are marketplace ids (`accountId`, `entityId`, `orderId`) rather than
contact fields. Contact keys below are therefore **hypothesized** from
typical CRM contact schemas plus Vendasta's own user-example attributes
(`email`, `displayName` in that same guide). CoS must map trigger tokens
to these flat keys in the Automations UI.

## Recommended flat fields (this fixture)

| Key | Required for upsert | Notes |
| --- | --- | --- |
| `name` | Prefer | Full name. Also accepted: `full_name`, `fullName`, `display_name`, `displayName`. |
| `first_name` / `last_name` | Optional | Joined when `name` is blank. CamelCase aliases accepted. |
| `email` | One of email or phone | Also accepted: `email_address`, `emailAddress`, `contact_email`. |
| `phone` | One of email or phone | Also accepted: `sms`, `phone_number`, `phoneNumber`, `mobile`. |
| `company` | Optional | Also accepted: `company_name`, `companyName`, `account_name`. |
| `message` | Optional | Stored in CRM notes. Also accepted: `last_message`, `lastMessage`, `conversation`, `snippet`, `notes`. |
| `summary` | Optional | Persisted on `crm_prospects.conversation_summary` (migration 090) and as a labelled notes section. Also accepted: `conversation_summary`, `conversationSummary`. If those are blank, `message` / `conversation` / `snippet` fill the column. |
| `contact_id` | Optional | Stored in CRM notes. Also accepted: `contactId`, `entityId`, `entity_id`. |

PII in the example JSON is fake (`alex@example.com`, `+1 555 0100`).

## Widget surface

Leads are expected from the Evolved Pros **Ask George** drawer (Conversations
AI webchat), not a dedicated path:

`https://platform.evolvedpros.com/home?ask=george`

Anonymous public chrome does not mount the widget. Ingress remains
`POST /api/webhooks/vendasta-conversations`.

## SMS-only rows

A payload with phone and no email is accepted. `crm_prospects.email` is
nullable (migration 087). Identity then matches on the stored phone
string. Multiple NULLs do not collide on `uq_crm_prospects_email`.

A payload with neither email nor phone is rejected (`422`). We do not
invent a placeholder email.

Empty or whitespace-only `name` / `email` / `phone` / `summary` fields are
treated as missing. The display fallback `AI George lead` is **not**
identity: a payload that only has that name (or a blank name) and no
usable email or phone is `422`. No CRM row is created.

## Widget / Automation prompt (locked)

Collect in this order: **name → phone → email**. Do not pitch a business
email. Personal email is accepted. This repo does not change the live
Conversations AI system prompt; CoS sets it in the widget / Automation.
