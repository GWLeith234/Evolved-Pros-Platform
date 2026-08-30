/**
 * What the crawler is allowed to be told about (SPRINT GATE-1).
 *
 * Extracted from app/robots.ts and app/sitemap.ts because vitest only collects
 * lib/**, so nothing under app/ can be covered. Advertising a URL that bounces
 * an anonymous request to /login is a false signal to Google, and that is a
 * regression worth a test rather than a comment.
 *
 * DEPENDENCY-FREE ON PURPOSE — this file imports NOTHING. No next, no
 * lib/podcast/public, and above all nothing reaching @/lib/supabase/admin,
 * which builds its Supabase client at module scope and throws
 * "supabaseUrl is required" the moment a test imports it.
 */

/**
 * Every path in the sitemap that an anonymous visitor can actually reach.
 *
 * DELIBERATELY ABSENT: /community, /events, /academy, /leaderboard. All four
 * require auth and redirect an anonymous request — Googlebot included — to
 * /login. Do not add them back without first making them anon-readable.
 *
 * /live and /pricing ARE here: both are in SESSION_OPTIONAL_ROUTES, so
 * middleware refreshes the session but never bounces an anonymous visitor.
 * /pricing is also the landing page's primary CTA — advertising the front door
 * but not the buy page is the same class of false signal, inverted.
 *
 * /membership stays out: it is a member surface, not a public one.
 *
 * SPRINT FOOTER-1 added /terms, /privacy and /contact. All three are static
 * pages under app/(public) and none of them appears in the middleware matcher,
 * so middleware never runs on them and an anonymous request renders the page —
 * the same bar the five above have to clear. They are also the only pages the
 * global footer links to that Google could not otherwise discover.
 */
export const PUBLIC_SITEMAP_PATHS = [
  '/',
  '/podcast',
  '/live',
  '/media',
  '/pricing',
  '/terms',
  '/privacy',
  '/contact',
] as const

export type PublicSitemapPath = (typeof PUBLIC_SITEMAP_PATHS)[number]

/**
 * Absolute sitemap URL for robots.txt, derived from the canonical site URL.
 *
 * Never hardcode the host. robots.ts used to name platform.evolvedpros.com
 * while SITE_URL pointed somewhere else, so robots.txt advertised a sitemap on
 * a different origin than every canonical tag on the site.
 *
 * A trailing slash on the input would otherwise produce '//sitemap.xml'.
 */
export function robotsSitemapUrl(siteUrl: string): string {
  return `${siteUrl.replace(/\/+$/, '')}/sitemap.xml`
}
