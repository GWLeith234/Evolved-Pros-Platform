/**
 * Public origin helpers.
 *
 * These two env vars are NOT duplicates:
 *
 *   NEXT_PUBLIC_APP_URL  — canonical app origin (Railway MUST set this).
 *                          Auth callbacks, Stripe return URLs, emails, guest
 *                          links. Production value:
 *                          https://platform.evolvedpros.com
 *
 *   NEXT_PUBLIC_SITE_URL — brand / SEO origin for canonical, OG, sitemap, RSS.
 *                          Falls back to APP_URL when unset so a missing
 *                          SITE_URL cannot break callers. Production may be
 *                          https://evolvedpros.com (marketing) or the app
 *                          origin if podcast/media SEO should stay on-app.
 *
 * Each helper accepts the other as a fallback alias so existing callers that
 * only set one var keep working. Do not invent a third name.
 */

const DEFAULT_APP_URL = 'https://platform.evolvedpros.com'
const DEFAULT_SITE_URL = 'https://evolvedpros.com'

function trimOrigin(value: string | undefined): string | undefined {
  const trimmed = value?.trim().replace(/\/+$/, '')
  return trimmed ? trimmed : undefined
}

/** App origin — platform.evolvedpros.com. Prefer APP_URL, then SITE_URL. */
export function getAppUrl(
  appUrl: string | undefined = process.env.NEXT_PUBLIC_APP_URL,
  siteUrl: string | undefined = process.env.NEXT_PUBLIC_SITE_URL,
): string {
  return trimOrigin(appUrl) ?? trimOrigin(siteUrl) ?? DEFAULT_APP_URL
}

/** Brand / SEO origin. Prefer SITE_URL, then APP_URL. */
export function getSiteUrl(
  siteUrl: string | undefined = process.env.NEXT_PUBLIC_SITE_URL,
  appUrl: string | undefined = process.env.NEXT_PUBLIC_APP_URL,
): string {
  return trimOrigin(siteUrl) ?? trimOrigin(appUrl) ?? DEFAULT_SITE_URL
}
