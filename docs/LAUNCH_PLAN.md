# Evolved Pros Platform — Launch Plan

**Target:** Platform live with test users within 72 hours (by April 14, 2026)
**Vendasta support available:** Monday April 14

---

## 1. Architecture Overview

### System Roles

| System | Owns |
|--------|------|
| **Vendasta** | Lead capture (forms), contact CRM, payment processing, credit card storage, billing/renewals/cancellations, email campaigns, SMS campaigns |
| **Platform** | Member experience — community, academy, events, discipline board, scoreboard, media portal. Access gated by tier. |

### Data Flow

```
Vendasta → Platform (inbound webhook):
  order.created    → create user, assign tier, send magic link
  order.renewed    → extend tier_expires_at
  order.upgraded   → change tier (community→vip, vip→pro)
  order.cancelled  → set tier_status='cancelled'

Platform → Vendasta (outbound contact API):
  Tags:           community-member, vip-member, professional-member,
                  renewal-reminder-due, cancelled, book-purchaser
  Custom fields:  tier, tier_expiry, platform_url, magic_link,
                  pillar_X_completed, lessons_completed, posts_count
```

### Tier Model

| Tier | Price | Vendasta SKU | Platform Access |
|------|-------|-------------|-----------------|
| Community | Free | EP-COMM-FREE | Community feed, podcast, event discovery (view only) |
| VIP | $79/month | EP-VIP-M | + Event registration, discipline board, Academy Pillars 1-3 |
| Professional | $249/month | EP-PRO-M | + Full 6-pillar Academy, scoreboard, mastermind events |
| Keynote | Inquire | EP-KEY | Add-on: keynote event access (stacks with any tier) |

### User Lifecycle

```
1. ACQUISITION
   Landing page (georgeleith.com / evolvedpros.com)
       ↓ "Join the Community" CTA
   Vendasta form: captures Name, Email, SMS
       ↓ creates contact with product = EP-COMM-FREE
   Vendasta webhook → platform creates account
       ↓ magic link email (Vendasta template)
   User clicks → /onboarding → /home (community tier)

2. ENGAGEMENT
   Community member uses platform:
   - Reads posts, listens to podcast, browses events
   - Sees upgrade prompts on locked features (academy, discipline, scoreboard)
   - Platform writes engagement signals to Vendasta contact fields

3. CONVERSION
   Vendasta email/SMS campaign targets engaged community members
       ↓ "Upgrade to VIP" CTA → Vendasta checkout
   User pays $79/month via Vendasta payment processing
       ↓ Vendasta webhook: order.created, SKU=EP-VIP-M
   Platform upgrades tier → VIP features unlock immediately

4. EXPANSION
   VIP member hits Pillar 4+ locked content
       ↓ platform writes pillar_3_completed to Vendasta
   Vendasta campaign: "Ready for the full system?"
       ↓ upgrade to Professional ($249/mo)
   Webhook → tier='pro' → all features unlocked

5. RETENTION
   Daily cron: expire-tiers flips lapsed memberships
   30-day cron: renewal-reminders tags contacts
   Vendasta sends renewal campaign → user renews
   Webhook: order.renewed → extends tier_expires_at
```

---

## 2. What's Built (as of April 11, 2026)

### Platform Features — Complete
- [x] Community feed with channels, posts, replies, reactions, bookmarks
- [x] Academy with 6-pillar courses, lessons, video (Mux), progress tracking
- [x] Events with registration, Zoom integration, recordings
- [x] Discipline board (habit tracker with streaks)
- [x] Podcast with episodes, transcripts
- [x] Direct messages
- [x] Notifications (in-app + email digest)
- [x] Admin dashboard (members, pipeline, revenue, broadcast)
- [x] Ask George AI assistant (Vendasta AI widget proxy)
- [x] Onboarding flow (4-step wizard)
- [x] Dark/light theme

### Vendasta Integration — Complete
- [x] Inbound webhook handler (HMAC-verified, all event types)
- [x] Outbound contact sync (tags + custom fields)
- [x] Magic link generation + delivery
- [x] Renewal reminder cron (30-day tag)
- [x] Tier expiry enforcement cron
- [x] Product SKU mapping
- [x] Webhook audit log (vendasta_webhooks table)

### New Features (this session) — Complete
- [x] Public pricing page (/pricing) with 4 tier cards + comparison table
- [x] Tier gate enforcement (community/vip/pro nav + page redirects)
- [x] Evolved Media admin CRUD (/admin/media)
- [x] Evolved Media public portal (/media)
- [x] Story pages with SEO, JSON-LD, markdown rendering
- [x] Admin audit log
- [x] Auth sanitization, habit timezone fix, MuxPlayer retry
- [x] CI pipeline, cron scheduling, ESLint setup

### Not Yet Built
- [ ] EP-COMM-FREE SKU in products.ts
- [ ] Engagement signal writes to Vendasta (pillar completion, post count, etc.)
- [ ] Vendasta checkout embed or redirect on pricing page
- [ ] Community tier welcome email template
- [ ] /live page (keynote booking)
- [ ] Scoreboard page (standalone, separate from academy)
- [ ] Sitemap.xml + robots.txt for SEO
- [ ] Social sharing (OG images, share buttons on media stories)
- [ ] Mobile app (Expo) — exists but not connected to new features

---

## 3. 72-Hour Sprint Plan

### Sprint L1 — Launch Blockers (Friday night / Saturday morning)
**Goal:** Platform is functional for test users

| Task | Effort | Status |
|------|--------|--------|
| Add EP-COMM-FREE SKU to products.ts | 10 min | Ready |
| Update pricing page: $79 VIP, $249 Professional | 10 min | Ready |
| Add community tier to webhook handler (no expiry for free) | 10 min | Ready |
| Test webhook end-to-end with EP-COMM-FREE | 15 min | After above |
| Verify all public pages render (/pricing, /media, story pages) | 15 min | Manual test |
| Create 3 test media stories in /admin/media | 20 min | Manual |

### Sprint L2 — Polish & Edge Cases (Saturday)
**Goal:** No embarrassing bugs when real users arrive

| Task | Effort |
|------|--------|
| Test tier gates: log in as community → verify limited access | 30 min |
| Test tier gates: log in as VIP → verify academy P1-3, discipline | 30 min |
| Test upgrade flow: community → VIP via webhook | 15 min |
| Fix any 500 errors in Railway logs | varies |
| Add Vendasta checkout URLs to pricing page CTAs (once Alistair provides) | 10 min |
| Review mobile responsiveness on pricing, media, story pages | 30 min |

### Sprint L3 — Engagement Signals (Sunday)
**Goal:** Platform sends behavioral data back to Vendasta for campaign targeting

| Task | Effort |
|------|--------|
| Wire pillar completion → updateContact custom field | 30 min |
| Wire post count milestone → updateContact tag | 30 min |
| Wire login streak → updateContact custom field | 30 min |
| Document all custom fields + tags for Alistair | 30 min |

### Monday — Vendasta Configuration (with Alistair)
| Task | Owner |
|------|-------|
| Create EP-COMM-FREE product in Vendasta marketplace | Alistair |
| Build landing page forms (name, email, SMS) | Alistair |
| Configure webhook endpoint URL + shared secret | Alistair + Geo |
| Set up email templates (welcome, magic link, upgrade drip) | Alistair |
| Configure SMS campaigns | Alistair |
| Create VIP + Pro checkout pages | Alistair |
| Test full funnel: form → webhook → platform → magic link → login | Both |

---

## 4. Environment Variables Required

### Already configured (Railway):
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
VENDASTA_WEBHOOK_SECRET
VENDASTA_API_KEY
VENDASTA_API_BASE_URL
VENDASTA_MAGIC_LINK_METHOD
NEXT_PUBLIC_APP_URL
RESEND_API_KEY
RESEND_FROM_EMAIL
CRON_SECRET
```

### Need from Alistair:
```
NEXT_PUBLIC_VENDASTA_CHECKOUT_URL  — base checkout URL for upgrade CTAs
VENDASTA_CLIENT_ID                — for Ask George OAuth (if not using API key)
VENDASTA_CLIENT_SECRET            — for Ask George OAuth
```

---

## 5. Vendasta Configuration Checklist (for Alistair)

### Products to create:
- [ ] EP-COMM-FREE — Community, $0, one-time (no billing)
- [ ] EP-VIP-M — VIP, $79/month, recurring
- [ ] EP-VIP-Y — VIP, $790/year, recurring (optional)
- [ ] EP-PRO-M — Professional, $249/month, recurring
- [ ] EP-PRO-Y — Professional, $2,490/year, recurring (optional)

### Webhook configuration:
- [ ] Endpoint: `https://platform.evolvedpros.com/api/webhooks/vendasta`
- [ ] Shared secret: (generate and set as VENDASTA_WEBHOOK_SECRET in Railway)
- [ ] Events: order.created, order.renewed, order.upgraded, order.cancelled
- [ ] Signature header: `x-vendasta-signature` (HMAC-SHA256)

### Contact custom fields to create:
- [ ] tier (text)
- [ ] tier_expiry (date)
- [ ] platform_url (text)
- [ ] magic_link (text)
- [ ] pillar_1_completed through pillar_6_completed (date)
- [ ] lessons_completed (number)
- [ ] posts_count (number)
- [ ] last_platform_login (date)

### Tags the platform will write:
- community-member, vip-member, professional-member
- book-purchaser, keynote-purchaser
- upgraded-to-professional, cancelled
- renewal-reminder-due (auto-cleared on renewal)
- pillar-1-complete through pillar-6-complete

### Email templates needed:
- [ ] Welcome (community tier) — includes magic link
- [ ] Welcome (VIP tier) — includes magic link + feature overview
- [ ] Welcome (Professional tier) — includes magic link + mastermind info
- [ ] Upgrade nudge: Community → VIP (3-email drip)
- [ ] Upgrade nudge: VIP → Professional (3-email drip)
- [ ] Renewal reminder (30 days before expiry)
- [ ] Cancellation win-back

### Landing page forms:
- [ ] georgeleith.com — "Join the Community" form (name, email, SMS → EP-COMM-FREE)
- [ ] evolvedpros.com — same form or variation
- [ ] Campaign-specific landing pages as needed

---

## 6. Open Questions for Monday

1. **Contact API URL:** Is it `/v1/contacts/{id}` or `/v1/accounts/C5L0/contacts/{id}`?
2. **Custom field schema:** Do the field names above match what Vendasta supports?
3. **Webhook retry policy:** Does Vendasta retry on 5xx? We're idempotent.
4. **Free product webhook:** Does a $0 product still fire `order.created`?
5. **Checkout URL format:** What's the base URL for upgrade CTAs?
6. **Ask George API:** Is the response shape stable, or should we pin to a version?

---

## 7. Success Metrics (Week 1)

| Metric | Target |
|--------|--------|
| Platform uptime | 99.9% |
| Community signups (free) | 10+ test users |
| Magic link delivery rate | 100% |
| Onboarding completion rate | 70%+ |
| Pages without 500 errors | 100% |
| Webhook processing success rate | 100% |
| Cron jobs running on schedule | All 4 daily |
