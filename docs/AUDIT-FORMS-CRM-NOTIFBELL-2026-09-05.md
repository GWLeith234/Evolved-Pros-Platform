# AUDIT: form-fill CRM + NotifBell gaps (Phase A)

**Date:** 2026-09-05
**Base:** `claude/init-evolved-pros-platform-Q2oUw` @ `b85c9b910b21e05cb625bd2ccf3b229f2c06d60d`
**Status:** inventory only. No product fix shipped in this PR.
**George YES via CoS:** every form fill must (1) upsert `crm_prospects` with appropriate tags, (2) notify George + other admins via existing NotifBell.
**Do not merge this audit.** Do not start Phase B build PRs from this agent.

---

## Constraints locked for Phase B

| Constraint | Meaning |
| --- | --- |
| Reuse LIVE Inquire writer | Pattern from merged `#115`: validate, honeypot, rate-limit, `adminClient` upsert on `lower(email)` unique (076), prepend notes, do not demote stage / status / consent on update |
| Reuse NotifBell | `#110` table + `createNotification` / `notifyAdmins`. Type `system_general`. Target `users.role = 'admin'`. Action URL `/admin/crm` |
| No new notification engine | Do not add a second bell, Slack, or HubSpot |
| No new CHECK types | `notifications.type` allows only `community_reply`, `community_mention`, `event_reminder`, `course_unlock`, `system_billing`, `system_general`. New types need George YES |
| No ADC HubSpot | Ads admin placeholder text is not a CRM |
| No revive `#80` | Vendasta product / HMAC SKU webhook / outbound contact PATCH stay deleted |
| Conversations AI webhook | Sibling `bc-34d83e41` / open `#120`. Inventory as when-live. Do not duplicate |
| No em dashes | Any Phase B user-facing copy |

---

## Canonical pattern (reuse this)

LIVE Inquire (`#115`, merged 2026-09-05) is the only complete public intake on Q2oUw today.

| Piece | Path |
| --- | --- |
| UI | `/live` via `BookingInquiryForm` / `LiveBookingInquiry` / `InquireBookingButton` |
| API | `POST /api/speaking/inquiry` |
| Writer | `apps/web/lib/speaking/inquiry.ts` (`upsertKeynoteProspect`, `notifyAdmins`) |
| DB port | `apps/web/lib/speaking/inquiryDb.ts` (`adminClient`, RLS bypass) |
| Bell | Insert `notifications` rows for every `users.role = 'admin'`, `type: system_general`, `action_url: /admin/crm` |
| Email | Fire-and-forget Resend (`sendKeynoteInquiryEmail`). Optional. Must not replace the bell |

Book preorder copied the CRM half of this writer into `lib/book/preorder.ts` and **omitted** `notifyAdmins`. Phase B should extract one shared helper rather than a third copy.

`normalizeTags` (`lib/admin/crm.ts`) lowercases and dedupes. Locked tag strings that are not already lowercase (sibling `#120` wants exact `AI George`) will become `ai george` if they go through that helper. Call that out before merging `#120`.

---

## Gap table (all intake paths)

Legend: **OK** meets the CoS bar. **GAP** does not. **WHEN-LIVE** owned by sibling. **N/A** not a lead form.

| Path | Route / component / API | CRM today | Tags / source | Admin NotifBell today | Gap | Proposed Phase B |
| --- | --- | --- | --- | --- | --- | --- |
| LIVE Inquire / speaking / keynote | `/live` → `BookingInquiryForm` → `POST /api/speaking/inquiry` | Yes. `upsertKeynoteProspect`. New: stage `lead`, status `active`, consent `express`, `keynote_interest=true`. Update: merge phone/company/notes, set `keynote_interest`, leave stage/status/consent | **Tag miss.** Writes `tags: []`. Source `keynote-inquiry`. Update path never merges a tag | Yes. All `role=admin`. `system_general`. Title/body list filled Name / Email / Date of event / SMS / Company. Plus optional Resend to `ADMIN_NOTIFY_EMAIL` | Tag miss only (CRM + bell already ship) | Shared helper + merge a George-YES tag (suggested `live inquire`; CRM UI already examples `keynote`) |
| Book preorder | `/evolved` → `BookPreorderForm` → `POST /api/book/preorder` | Yes. `upsertBookPreorderProspect`. Same conflict/merge rules. Fields: first+last or full name, email, UTMs in notes | Tag **OK:** exact `book preorder`. Source `book-preorder`. `keynote_interest=false` on insert | **No.** Route comment: no email, no marketing mail. `PreorderDb` has no `listAdminIds` / notify | Admin notify miss | Per-form notify on existing writer, or after shared helper |
| Join / signup | `/join` and `/signup` 308 → `/login?mode=signup` → `LoginForm` → `supabase.auth.signUp` or magic OTP (`shouldCreateUser: true`) | **No.** Auth user only. `public.users` is created later at `/api/onboarding/complete` (or welcome-claim). No `crm_prospects` write | None | **No** | CRM miss, tag miss, admin notify miss | New thin server hook after signup (client auth cannot write CRM). Tag needs George YES (suggested `join`) |
| Contact | `/contact` (`app/(public)/contact/page.tsx`) | **No.** Deliberate SPRINT FOOTER-1: two mailto inboxes, no form, no API | None | **No** | Email-only. Support + speaking traffic never hits CRM or the bell | George YES required before adding a form. If yes: shared helper, tags `support` / `speaking`. If no: leave as documented exception |
| Conversations AI webhook | When-live: `POST /api/webhooks/vendasta-conversations`. Widget: member TopNav `AskGeorgeDrawer` (`#ask-george-webchat`, widget `96dd7dbb-2a14-11f1-93eb-72103b668f62`). Host `platform.evolvedpros.com/home?ask=george` | **Not on this tip.** Sibling `bc-34d83e41`, branch `cursor/ai-george-conversations-crm-04f7`, open `#120` | Locked exact tag `AI George`, source `ai-george` (per `#120`) | Planned on `#120` (`system_general`, title `New AI George lead`) | WHEN-LIVE. Do not duplicate this build | Review `#120` only. Watch `normalizeTags` lowercasing `AI George` |
| Guest intake | `/guest/[token]` → `GuestIntakeForm` → `POST /api/guest/submit` | **No.** Writes `guest_engagements` + `users` + optional `episodes.guest_*` | Email already known from admin invite (`/api/admin/guests`) | **No** | CRM miss, tag miss, admin notify miss | Shared helper on submit. Tag needs George YES (suggested `podcast guest`). Link `user_id` |
| Friends of George / welcome | `/welcome?token=` → `WelcomeClaim` → `POST /api/welcome/claim` | **No.** Creates auth + `public.users`, `redeemComp`, marks invite redeemed | None | **No** | CRM miss, tag miss, admin notify miss | Shared helper on claim. Tag needs George YES (suggested `friend of george`). Stage should not stay `lead` if they are now Pro |
| Redeem code | `/pricing` `RedeemCodeForm` → `POST /api/redeem` | **No.** Grants tier on existing member | None | **No** | CRM miss (conversion), admin notify miss | Merge/upsert by email, bump stage to granted tier, tag needs George YES (suggested `comp`) |
| Stripe checkout | `/pricing` `PricingCtaButton` → `POST /api/stripe/checkout` → `POST /api/stripe/webhook` | **No.** Updates `users.tier` / Stripe ids / `tier_change_log` only | None | **No** (past_due email is an explicit follow-up in the webhook) | CRM miss (paid conversion), admin notify miss | Webhook `checkout.session.completed`: upsert by email, stage `vip` / `professional`, tag needs George YES (suggested `paid`). Do not invent HubSpot |
| Onboarding profile | `/onboarding` → `OnboardingProfile` → `PATCH /api/onboarding/profile` + `/api/onboarding/complete` | **No.** Patches `users` only | Company / role / location / name exist here and never copy to CRM | **No** | Enrichment miss if signup created a prospect | After B4: PATCH matching `crm_prospects` (name, company, title, location, `user_id`). No second bell unless the row is new |
| Event RSVP | `/events/[id]` → `POST /api/events/[eventId]/register` | **No** (member table `event_rsvps`) | N/A | Notifies **the member** (`event_reminder`), not admins | N/A for lead intake. Optional later: tag existing prospect `event rsvp` | Out of Phase B unless George YES |
| Accountability invite | Academy → `POST /api/accountability/invite` | **No** | N/A | Member-to-member `createNotification` (`system_general`). Comment notes `accountability_invite` never landed in the CHECK | N/A for lead intake | Leave. Do not add a new CHECK type |
| Admin CRM import | `/admin/crm/import` → `POST /api/admin/crm/import` | Yes (admin CSV) | Importer tags | No (admin is the actor) | N/A | Leave |
| Admin member invite | `/admin` `InviteMemberButton` → `POST /api/admin/invite` | **No.** Auth invite + `users` row | None | **No** | Same class as join (admin-originated member) | Optional same hook as B4 |
| Careers | `/media/careers` | **No.** External `apply_url` | N/A | **No** | Off-platform apply | Out of scope unless George YES for an EP apply form |
| Unsubscribe / resubscribe | `/unsubscribe` → `/api/email/unsubscribe` + `/api/email/resubscribe` | Updates existing `crm_prospects.unsubscribed_at` only | N/A | **No** | Not intake | Leave |
| Ask George widget (client) | `AskGeorgeDrawer` embed | Does not POST leads. Ingress is the Vendasta automation webhook (`#120`) | N/A on this tip | N/A | WHEN-LIVE via `#120` | Do not add a platform `/api/ask-george` (archived `#80`) |
| HubSpot / Vendasta CRM | None in `apps/web` | None | Ads placeholder "e.g. HubSpot" only | N/A | None to migrate | Do not add |

Speaking / keynote inquiry is **not a second form**. KN-1 (`fb71ffe`) and `#115` share `POST /api/speaking/inquiry`. `/contact` speaking mailbox is mailto only and points people at `/live`.

---

## Path notes

### 1. LIVE Inquire / speaking / keynote (partial pass)

- CTAs: hero, upcoming empty state, final Request a date, `#book-george`. Lock test: `lib/speaking/live-inquire.lock.test.ts` (no mailto, five fields, no `$49` / `$249`).
- Insert payload: `full_name`, `email`, `phone` (SMS), `company`, notes block `[YYYY-MM-DD] Booking inquiry`, `tags: []`.
- Update on `23505`: sets `keynote_interest`, prepends notes, fills phone/company if provided. Does **not** merge tags.
- Bell target: every admin row. If George is not `role=admin`, he will not see it. Email is a second channel, not the CoS bar.
- Phase B: add a tag; extract helper so book / join / guest can share notify.

### 2. Book preorder (CRM pass, bell fail)

- Code is **on Q2oUw** (`26cea28`). Open `#86` looks like a leftover PR listing, not a missing product.
- House IAB dest: `https://www.evolvedpros.com/evolved?utm_source=house&utm_medium=display&utm_campaign=evolved-book&utm_content=<slot>`.
- Explicitly skipped George email. CoS now requires NotifBell anyway.
- Rate limiter already imported from `lib/speaking/inquiry`.

### 3. Join / signup (full miss)

- Front door George says on stage. Homepage primary CTA is `/login?mode=signup` (`JOIN_FREE_HREF`), not `/join` (308).
- No server route sees the email at signup time. `/auth/callback` only exchanges the session.
- Comment on welcome-claim: "no `handle_new_user` trigger in-tree."
- Magic link also creates users (`shouldCreateUser: true`), so a bell on password `signUp` alone would miss OTP joins.
- Recommended hook: `POST /api/auth/provision` (or similar) called after both password signup and magic send, plus a backstop on `onboarding/complete` for anyone who skipped the client hook.

### 4. Contact (email-only)

- Published inboxes: `support@evolvedpros.com`, `speaking@evolvedpros.com` (`lib/layout/publicFooter.ts`).
- George's personal address is intentionally unpublished here. Inquiry 500 copy still says `george@evolvex360.com` (inconsistent, not a form).
- Adding a form is a product change. Do not invent one in Phase B without George YES.

### 5. Conversations AI (when-live, do not build)

- Sibling: https://cursor.com/agents/bc-34d83e41-27b3-4d86-b555-5f4c029904f7
- PR: https://github.com/GWLeith234/Evolved-Pros-Platform/pull/120
- This tip has **no** `app/api/webhooks/vendasta-conversations`. Only webhook in-tree is Mux.
- Widget does not write CRM. Automation "Send a webhook" is the ingress.
- `#120` already plans CRM + `system_general` bell + exact tag `AI George`. Phase B reviews that PR; it does not reimplement it.

### 6. Guest intake (full miss)

- Token-gated public form. Collects name, company, role, bio, links, headshot, consent.
- Admin already has the email before the guest opens the link. Submit is the moment they become a real contact with a profile.
- Natural CRM row: email from engagement, name/company/title from the form, `user_id` set, tag `podcast guest` (George YES).

### 7. Welcome claim / redeem / Stripe (conversion misses)

- These are not cold public lead forms. They are the moments a known email becomes a member or a paid/comped tier.
- CoS "every form fill" still applies: the welcome page and the pricing redeem box are forms; Stripe checkout is a paid submit.
- Shared helper should **merge**, not insert-as-lead over a Professional.

### 8. Not lead intake (listed so Phase B does not "fix" them)

Member community composer, profile/settings, academy diagnostics, event RSVP, accountability, admin broadcast, unsubscribe, careers external apply.

---

## Shared helper vs per-form patch

Two writers already exist with the same 23505 dance:

| | Inquire (`inquiry.ts`) | Preorder (`preorder.ts`) |
| --- | --- | --- |
| Validate + honeypot | Yes | Yes |
| Rate limit | Yes (exported; preorder imports it) | Reuses inquire limiter |
| Insert / conflict / PATCH | Yes | Yes |
| Notes prepend | Yes | Yes |
| Tag merge | **No** (`tags: []`) | Yes (`book preorder`) |
| `notifyAdmins` | Yes | **No** |
| Email | Resend optional | None (keep none) |

**Recommendation:** one extract PR first (`apps/web/lib/crm/intake.ts` + `intakeDb.ts`).

Port shape (sketch, not shipped):

- `upsertProspect(db, { email, full_name, phone?, company?, source, tags, keynote_interest?, notesBlock, consent })`
- `notifyAdmins(db, { title, body, actionUrl })` wrapping the `#115` fanout (or `createNotification` in a loop; same table)
- Keep PII-safe logging (codes only)
- Keep existing rate limiter

Then each form PR becomes: validate → `upsertProspect` → `notifyAdmins`. Do not grow a third copy for join or guest.

Per-form-only patches are acceptable for the LIVE tag (one line) if the extract slips. They are the wrong default for join / guest / welcome.

---

## Tag decisions that need George YES

Do not invent these in Phase B without a yes. Existing locked tags are listed first.

| Tag | Status | Path |
| --- | --- | --- |
| `book preorder` | Locked (lowercase, with space) | `/evolved` |
| `AI George` | Locked by `#120`. Conflicts with `normalizeTags` lowercasing | Conversations webhook when-live |
| `live inquire` or `keynote` | **Needs YES** | LIVE / speaking |
| `join` | **Needs YES** | `/join` `/signup` |
| `podcast guest` | **Needs YES** | Guest submit |
| `friend of george` | **Needs YES** | Welcome claim |
| `comp` | **Needs YES** | Redeem |
| `paid` (or `paid vip` / `paid professional`) | **Needs YES** | Stripe checkout completed |
| `support` / `speaking` | **Needs YES** and a form | Only if `/contact` grows a form |

`keynote_interest` boolean is **not** a substitute for a tag. CRM board already filters on the boolean; CoS asked for tags.

---

## Ordered Phase B PR plan

Do not open these from this agent. Order is dependency, not calendar.

| # | PR | Scope | Depends on | Size |
| --- | --- | --- | --- | --- |
| B1 | Shared CRM intake helper | Extract upsert + admin `system_general` fanout from `#115` / book writers. Unit tests move with the helper. No user-facing copy change | Q2oUw | M |
| B2 | LIVE Inquire tag | Merge George-YES tag on insert and update. Keep `keynote_interest`. Keep existing bell | B1 (or tiny solo if B1 slips) | S |
| B3 | Book preorder NotifBell | Call shared `notifyAdmins`. Copy lists name + email (+ UTM if present). `action_url: /admin/crm`. No new email | B1 | S |
| B4 | Join / signup CRM + bell | Server provision hook after password signup **and** magic OTP create. Tag `join` (or YES alternate). Backstop on `onboarding/complete`. Do not demote existing paid/comped rows | B1 | M |
| B5 | Guest submit CRM + bell | `POST /api/guest/submit` upsert + notify. Tag `podcast guest`. Set `user_id` | B1 | S |
| B6 | Conversion: welcome, redeem, Stripe | Merge by email; set stage to granted/paid tier; tags `friend of george` / `comp` / `paid`; one admin bell per event | B1 | M |
| B7 | Contact form (optional) | Only after George YES. Otherwise close as documented exception | B1 + YES | S–M |
| — | Conversations AI `#120` | When-live. Review only. Tag exact `AI George`. Do not rebuild | Sibling | — |

**Out of Phase B:** HubSpot, Vendasta product revive, new `notifications.type` values, event RSVP admin bells, careers apply form, ADC.

**Collision notes**

- `#120` will touch `crm_prospects` write + admin notify. B1 should land first or `#120` should import the helper once B1 merges. Do not let `#120` become a third writer.
- `#86` is still open while `/evolved` already lives on Q2oUw. Close or supersede `#86` rather than re-landing the page.
- Do not merge this audit PR.

---

## Verify (this audit)

- Grep: `crm_prospects` writers are inquire, preorder, admin CRM CRUD/import, email suppression. No join / guest / stripe / welcome / redeem.
- Grep: `createNotification` / `notifyAdmins` admin fanout exists only on inquire (plus member-to-member `#110` helpers).
- `app/api/webhooks/` on this tip: Mux only.
- Open `#120` confirmed for Conversations AI; this tree does not contain that route.

---

## Tip

Audit authored from Q2oUw `b85c9b910b21e05cb625bd2ccf3b229f2c06d60d`. This PR's own tip SHA is the commit that adds this file.
