// Canonical public brand origin. Used ONLY for SEO surfaces:
//   • <link rel="canonical"> and OpenGraph / Twitter URLs
//   • metadataBase in the root layout
//   • the sitemap (/sitemap.xml)
//   • the RSS feed (/feed.xml, /podcast/rss.xml)
//
// It is DELIBERATELY its own variable (NEXT_PUBLIC_CANONICAL_URL), NOT
// NEXT_PUBLIC_SITE_URL. In this codebase NEXT_PUBLIC_SITE_URL is already
// load-bearing for AUTH + CRM — the Vendasta magic-link `redirectTo`
// (app/api/webhooks/vendasta), the password-reset origin fallback
// (app/api/auth/reset-password), and the internal /api/vendasta/signal
// self-fetch (app/api/lessons/[lessonId]/progress) — and NEXT_PUBLIC_APP_URL
// drives the auth host. Repointing either of those at the marketing domain
// would break sign-in and CRM signalling: the exact class of failure the
// sprint's CRITICAL CONSTRAINT warns about. Keeping the canonical brand URL on
// a separate variable lets the public domain differ from the app host with
// zero auth risk.
//
// NEVER use `siteUrl` for auth redirects, magic links, or internal fetches —
// those must stay on NEXT_PUBLIC_APP_URL / the request host.
export const siteUrl = (
  process.env.NEXT_PUBLIC_CANONICAL_URL ?? 'https://evolvedpros.com'
).replace(/\/+$/, '')
