/**
 * Next.js `redirects()` table (imported by next.config.mjs).
 *
 * LIVE host split (George / CoS, 2026-09):
 *   - platform.evolvedpros.com  → this Next app (conversion homepage, join, auth)
 *   - www / apex                → Bluehost WordPress until George YES on DNS
 *
 * Never 308 platform.evolvedpros.com to www.evolvedpros.com. That hop dumps
 * `/`, `/join`, and `/signup` onto WordPress. Path aliases (/join → /login)
 * stay same-origin so they do not invent a www Location.
 */

export const PLATFORM_HOST = 'platform.evolvedpros.com'
export const PLATFORM_ORIGIN = 'https://platform.evolvedpros.com'
export const RAILWAY_PUBLIC_HOST = 'web-production-db912.up.railway.app'

export function appRedirects() {
  return [
    // Public Railway hostname still 200s the app and would mint cookies on
    // the wrong host. Send leftover *.up.railway.app page hits to platform
    // (not www — www is WordPress). Keep /api on the Railway host so
    // healthchecks and leftover webhook URLs keep working.
    {
      source: '/:path((?!api/).*)',
      has: [{ type: 'host', value: RAILWAY_PUBLIC_HOST }],
      destination: `${PLATFORM_ORIGIN}/:path`,
      permanent: true,
    },
    // /scoreboard was folded into /home (Goals → Home consolidation).
    { source: '/scoreboard', destination: '/home', permanent: true },

    // /join is the URL George says on stage; /signup is what people type.
    // Same-host 308 to the signup mode of /login. Do not prefix www — a
    // request on platform.evolvedpros.com must stay on platform.
    { source: '/join', destination: '/login?mode=signup', permanent: true },
    { source: '/signup', destination: '/login?mode=signup', permanent: true },

    // /membership was a route file that client-redirected to /pricing.
    // Config 308 keeps ?checkout= and ?tier= intact.
    { source: '/membership', destination: '/pricing', permanent: true },

    { source: '/academy/strategy', destination: '/academy/strategic-approach', permanent: true },
  ]
}

/** True if any rule 308s the conversion host onto WordPress. Must stay false. */
export function redirectsPlatformHostToWww(redirects = appRedirects()) {
  return redirects.some(
    (r) =>
      (r.has ?? []).some((h) => h.type === 'host' && h.value === PLATFORM_HOST) &&
      String(r.destination).includes('www.evolvedpros.com'),
  )
}
