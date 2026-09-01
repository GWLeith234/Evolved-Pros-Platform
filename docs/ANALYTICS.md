# Audience analytics (platform.evolvedpros.com)

Optional, env-gated instrumentation for the Evolved Pros **membership** app
(`apps/web`). No measurement IDs or verification tokens are committed.

Unset or blank variables mean that layer does not load. Safe to deploy
without any of these set.

This is **not** EvolveX360 analytics and is **not** the Vendasta marketing-site
GA4 property.

## Railway env vars

Set these on the web service after you create each property. Do not put real
values in git (`.env`, `.env.local`, or committed examples).

| Variable | What it unlocks | Where to get it |
| --- | --- | --- |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 page views, session duration, traffic location/geo, engaged sessions | [Google Analytics](https://analytics.google.com/) → Admin → Data collection and modification → Data streams → your web stream → **Measurement ID** (`G-XXXXXXXX`) |
| `NEXT_PUBLIC_GSC_VERIFICATION` | Google Search Console **site verification only** (HTML meta tag; GSC is not a JS tag) | [Search Console](https://search.google.com/search-console) → Settings → Ownership verification → **HTML tag** → the `content="…"` value only |
| `NEXT_PUBLIC_CLARITY_ID` | Microsoft Clarity heatmaps and session replay. Optional — leave unset to skip the snippet. Do not invent an ID. CSP already allows `clarity.ms` so the tag can load when this is set. | [Clarity](https://clarity.microsoft.com/) → the project → Settings → Setup → **project ID** |

After setting a var, redeploy (or restart) so Next.js inlines the `NEXT_PUBLIC_*` values.

## How it is wired

- **GA4** — App Router `next/script` + gtag.js in the root layout. Client-side navigations send a follow-up `gtag('config')` so App Router transitions count as page views.
- **Search Console** — Next.js Metadata `verification.google` emits `<meta name="google-site-verification">` when the env var is set.
- **Clarity** — official Clarity snippet, `afterInteractive`, only when `NEXT_PUBLIC_CLARITY_ID` is set.

CSP in `apps/web/next.config.mjs` allows `www.googletagmanager.com`,
`www.google-analytics.com`, `www.clarity.ms`, and the minimum related hosts
those products need (`*.google-analytics.com`, `scripts.clarity.ms`, etc.).

## House Academy ads (IAB 300×250 / 728×90 / 300×600)

House / Academy self-promo units fire on the **same** GA4 property already on
the site (`G-LLQZZBWWKS` / Evolved Pros Platform 549941959). Do not add a
second measurement ID.

Admin `/admin/ads` reads **first-party** `ad_events` (not the GA4 Data API).
A viewer service account exists; a JSON key was never minted. The dashboard
label is: “House ad results (also sent to GA4 G-LLQZZBWWKS)”.

| When | gtag event | Also written to `ad_events` |
| --- | --- | --- |
| Unit mounts in view (once) | `view_promotion` | `event_type=impression` |
| Click | `select_promotion` **and** `house_ad_click` | `event_type=click` |

Shared params (all three events):

| Param | Value |
| --- | --- |
| `creative_name` | Headline / sponsor name |
| `creative_slot` | `300x250` \| `728x90` \| `300x600` |
| `promotion_id` | `platform_ads.id` (or hardcoded Academy UUID) |
| `promotion_name` | `academy_house` |
| `location_id` | Surface that served the unit |

Click destination is always `/pricing?utm_source=house&utm_medium=display&utm_campaign=academy&utm_content=<size>`.
Never `/join`, `/academy`, or `/membership`. Partner units (AdCellerant,
EvolveX360, XPR) do **not** fire these events.
