/**
 * Supabase auth cookie scope.
 *
 * Host-only cookies set on platform.evolvedpros.com are not sent to
 * www.evolvedpros.com, so a magic-link session that landed on platform
 * disappeared on the public host (and on a reload there).
 *
 * Production brand hosts share one parent domain. Localhost and preview
 * hosts must omit Domain: a parent of .evolvedpros.com is rejected by the
 * browser on those hosts, and a Domain on localhost breaks `next dev`.
 */

export const AUTH_COOKIE_DOMAIN = '.evolvedpros.com'

export type AuthCookieOptions = {
  path: '/'
  sameSite: 'lax'
  secure: boolean
  domain?: string
}

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])

export function hostnameFromHostHeader(raw: string | null | undefined): string | null {
  const token = raw?.split(',')[0]?.trim()
  if (!token) return null
  if (token.startsWith('[')) {
    const end = token.indexOf(']')
    if (end <= 1) return null
    return token.slice(1, end).toLowerCase()
  }
  const hostname = token.split(':')[0]?.trim().toLowerCase()
  return hostname || null
}

export function isLoopbackHost(hostname: string): boolean {
  return LOOPBACK_HOSTS.has(hostname.toLowerCase())
}

/** Railway and Vercel preview hosts. The production public Railway host is one of these. */
export function isPreviewHost(hostname: string): boolean {
  const host = hostname.toLowerCase()
  return host.endsWith('.up.railway.app') || host.endsWith('.vercel.app') || host === 'vercel.app'
}

export function isEvolvedProsHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, '')
  return host === 'evolvedpros.com' || host.endsWith('.evolvedpros.com')
}

/**
 * Parent domain for a production brand host. Undefined on localhost, preview,
 * and any host that is not evolvedpros.com (browsers would reject it).
 */
export function authCookieDomain(host: string | null | undefined): string | undefined {
  const hostname = hostnameFromHostHeader(host)
  if (!hostname) return undefined
  if (isLoopbackHost(hostname) || isPreviewHost(hostname)) return undefined
  if (!isEvolvedProsHost(hostname)) return undefined
  return AUTH_COOKIE_DOMAIN
}

export function authCookieOptions(host: string | null | undefined): AuthCookieOptions {
  const hostname = hostnameFromHostHeader(host)
  const domain = authCookieDomain(host)
  const secure = hostname ? !isLoopbackHost(hostname) : false
  const options: AuthCookieOptions = {
    path: '/',
    sameSite: 'lax',
    secure,
  }
  if (domain) options.domain = domain
  return options
}
