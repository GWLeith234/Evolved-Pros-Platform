/**
 * Next.js `redirects()` table (imported by next.config.mjs).
 *
 * LIVE host split (2026-09-29, George YES via CoS, sitemap hygiene sprint):
 *   www.evolvedpros.com and platform.evolvedpros.com both serve this Railway
 *   app. www is the public indexable origin. platform is the member app.
 *   Approved public paths on platform 308 to the same path on www.
 *   Auth, member routes, API (including Stripe, Mux, and Vendasta webhooks),
 *   /media/preview, and PLATFORM_PUBLIC_HELD stay on platform.
 *
 * Supabase cookies are host-scoped to platform. Do not add /pricing, /fit,
 * or /live here until CoS says so. Move a held path into
 * PLATFORM_TO_WWW_EXACT_PATHS to start redirecting it.
 *
 * Same-host aliases (/join, /signup) stay relative so they do not invent a
 * www Location. Do not use a `/:path*` pattern: it would catch /login,
 * /api, /_next, and robots.txt.
 */

export const PLATFORM_HOST = 'platform.evolvedpros.com'
export const PLATFORM_ORIGIN = 'https://platform.evolvedpros.com'
export const WWW_ORIGIN = 'https://www.evolvedpros.com'
export const RAILWAY_PUBLIC_HOST = 'web-production-db912.up.railway.app'

/**
 * Public paths that stay on platform.evolvedpros.com until a CoS decision.
 *
 * Supabase auth cookies are host-scoped to platform:
 *   /pricing: PricingCtaButton posts to a relative /api/stripe/checkout.
 *     A 401 sends the member to /login, and the session cookie does not
 *     follow a hop to www.
 *   /fit: reads the viewer tier from that same host-scoped session.
 *   /live: held with them for the same CoS decision.
 *
 * One-line change: move a path from this list into PLATFORM_TO_WWW_EXACT_PATHS.
 */
export const PLATFORM_PUBLIC_HELD = ['/pricing', '/fit', '/live']

/** Exact public paths that 308 from platform to the same path on www. */
export const PLATFORM_TO_WWW_EXACT_PATHS = [
  '/',
  '/media',
  '/podcast',
  '/about',
  '/evolved',
  '/terms',
  '/privacy',
  '/contact',
  '/sitemap.xml',
]

/**
 * Prefix rules. /media/preview and /media/preview/:path* must not match.
 * The negative lookahead is case-insensitive because Next compiles
 * redirect sources with the `i` flag.
 */
export const PLATFORM_TO_WWW_PATTERNS = [
  {
    source: '/media/:path((?!preview$|preview/).*)',
    destination: `${WWW_ORIGIN}/media/:path`,
  },
  {
    source: '/podcast/:path*',
    destination: `${WWW_ORIGIN}/podcast/:path*`,
  },
]

function wwwDestination(path) {
  return path === '/' ? WWW_ORIGIN : `${WWW_ORIGIN}${path}`
}

function platformToWww(source, destination) {
  return {
    source,
    has: [{ type: 'host', value: PLATFORM_HOST }],
    destination,
    permanent: true,
  }
}

export function appRedirects() {
  return [
    // Public Railway hostname still 200s the app and would mint cookies on
    // the wrong host. Send leftover *.up.railway.app page hits to platform.
    // Keep /api on the Railway host so healthchecks and leftover webhook
    // URLs keep working.
    {
      source: '/:path((?!api/).*)',
      has: [{ type: 'host', value: RAILWAY_PUBLIC_HOST }],
      destination: `${PLATFORM_ORIGIN}/:path`,
      permanent: true,
    },
    // /scoreboard was folded into /home (Goals → Home consolidation).
    { source: '/scoreboard', destination: '/home', permanent: true },

    // /join is the URL George says on stage; /signup is what people type.
    // Same-host 308 to the signup mode of /login. Do not prefix www.
    // A request on platform.evolvedpros.com must stay on platform.
    { source: '/join', destination: '/login?mode=signup', permanent: true },
    { source: '/signup', destination: '/login?mode=signup', permanent: true },

    // /membership was a route file that client-redirected to /pricing.
    // Config 308 keeps ?checkout= and ?tier= intact. /pricing itself is
    // held on platform (PLATFORM_PUBLIC_HELD).
    { source: '/membership', destination: '/pricing', permanent: true },

    { source: '/academy/strategy', destination: '/academy/strategic-approach', permanent: true },

    ...PLATFORM_TO_WWW_EXACT_PATHS.map((path) => platformToWww(path, wwwDestination(path))),
    ...PLATFORM_TO_WWW_PATTERNS.map((rule) => platformToWww(rule.source, rule.destination)),
  ]
}
