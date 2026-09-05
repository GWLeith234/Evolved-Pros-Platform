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
| `contact_id` | Optional | Stored in CRM notes. Also accepted: `contactId`, `entityId`, `entity_id`. |

PII in the example JSON is fake (`alex@example.com`, `+1 555 0100`).

## SMS-only rows

A payload with phone and no email is accepted. `crm_prospects.email` is
nullable (migration 087). Identity then matches on the stored phone
string. Multiple NULLs do not collide on `uq_crm_prospects_email`.

A payload with neither email nor phone is rejected (`422`). We do not
invent a placeholder email.
