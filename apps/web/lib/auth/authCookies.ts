/**
 * Auth cookies are host-only. www.evolvedpros.com is the only sign-in host.
 *
 * A Domain=.evolvedpros.com cookie is sent to the Bluehost apex and to the
 * mail WordPress and cPanel hosts. Live session cookies must not set Domain.
 *
 * The only Domain attribute we emit is Max-Age=0 on sign-out (and when a
 * fresh www session replaces a stray parent-domain cookie), so a leftover
 * .evolvedpros.com cookie can actually be deleted.
 */

export const STRAY_AUTH_COOKIE_DOMAIN = '.evolvedpros.com'
export const WWW_ORIGIN = 'https://www.evolvedpros.com'
const PLATFORM_HOST = 'platform.evolvedpros.com'
const WWW_HOST = 'www.evolvedpros.com'

export type AuthCookieOptions = {
  path: '/'
  sameSite: 'lax'
  secure: boolean
}

export type ClearedAuthCookie = {
  name: string
  path: '/'
  maxAge: 0
  sameSite: 'lax'
  domain?: typeof STRAY_AUTH_COOKIE_DOMAIN
}

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])

/** sb-<ref>-auth-token, chunk suffixes, and the PKCE code verifier. */
const AUTH_COOKIE_NAME = /^sb-[a-z0-9]+-auth-token(?:-code-verifier)?(?:\.\d+)?$/i

const AUTH_PATHS = new Set(['/login', '/auth/callback'])

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

export function isPreviewHost(hostname: string): boolean {
  const host = hostname.toLowerCase()
  return host.endsWith('.up.railway.app') || host.endsWith('.vercel.app') || host === 'vercel.app'
}

export function isAuthCookieName(name: string): boolean {
  return AUTH_COOKIE_NAME.test(name)
}

/**
 * Live cookie options. Never includes Domain, on any host.
 * Localhost stays insecure so `next dev` can store the cookie.
 */
export function authCookieOptions(host: string | null | undefined): AuthCookieOptions {
  const hostname = hostnameFromHostHeader(host)
  return {
    path: '/',
    sameSite: 'lax',
    secure: hostname ? !isLoopbackHost(hostname) : false,
  }
}

/** Drop Domain if a caller or the Supabase client attached one. */
export function omitCookieDomain<T extends { domain?: unknown }>(
  options: T,
): Omit<T, 'domain'> {
  const { domain: _domain, ...rest } = options
  return rest
}

function hostOnlyClear(name: string): ClearedAuthCookie {
  return { name, path: '/', maxAge: 0, sameSite: 'lax' }
}

function domainClear(name: string): ClearedAuthCookie {
  return { name, path: '/', maxAge: 0, sameSite: 'lax', domain: STRAY_AUTH_COOKIE_DOMAIN }
}

export function serializeClearedAuthCookie(cookie: ClearedAuthCookie, secure = false): string {
  const parts = [`${cookie.name}=`, 'Path=/', 'Max-Age=0', 'SameSite=Lax']
  if (secure) parts.push('Secure')
  if (cookie.domain) parts.push(`Domain=${cookie.domain}`)
  return parts.join('; ')
}

/** Base name plus every chunk index we saw, and .0 through .5 so a missing sibling still expires. */
export function expandAuthCookieNames(names: string[]): string[] {
  const out = new Set<string>()
  for (const name of names) {
    if (!isAuthCookieName(name)) continue
    const base = name.replace(/\.\d+$/, '')
    out.add(base)
    let max = 5
    const index = name.match(/\.(\d+)$/)
    if (index) max = Math.max(max, Number(index[1]))
    for (let i = 0; i <= max; i++) out.add(`${base}.${i}`)
  }
  return [...out]
}

export function readAuthCookieNames(cookieHeader: string): string[] {
  const names: string[] = []
  for (const part of cookieHeader.split(';')) {
    const name = part.trim().split('=')[0]?.trim()
    if (name && isAuthCookieName(name)) names.push(name)
  }
  return names
}

/**
 * Legacy host-only cookie, stray parent-domain cookie, and the fresh
 * host-only cookie can arrive together. Expire the stale host-only names
 * and every stray Domain variant. Leave the fresh host-only names in place.
 */
export function expireStaleAuthCookies(input: {
  presentNames: string[]
  freshNames: string[]
}): { hostOnly: ClearedAuthCookie[]; domain: ClearedAuthCookie[] } {
  const present = input.presentNames.filter(isAuthCookieName)
  const fresh = new Set(input.freshNames.filter(isAuthCookieName))
  const hostOnly = present.filter((name) => !fresh.has(name)).map(hostOnlyClear)
  const domainNames = new Set<string>([...present, ...fresh])
  return { hostOnly, domain: [...domainNames].map(domainClear) }
}

export function signOutCookiePlan(names: string[]): ClearedAuthCookie[] {
  const all = expandAuthCookieNames(names)
  const plan: ClearedAuthCookie[] = []
  for (const name of all) {
    plan.push(hostOnlyClear(name))
    plan.push(domainClear(name))
  }
  return plan
}

export function signOutCookieHeaders(names: string[], secure = false): string[] {
  return signOutCookiePlan(names).map((cookie) => serializeClearedAuthCookie(cookie, secure))
}

/**
 * Host the browser actually used when it is one of our two app hosts.
 * A spoofed X-Forwarded-Host must not turn a www request into a platform hop.
 */
export function publicAppHost(
  hostHeader: string | null | undefined,
  forwardedHost: string | null | undefined,
): string | null {
  const host = hostnameFromHostHeader(hostHeader)
  const forwarded = hostnameFromHostHeader(forwardedHost)
  if (host === WWW_HOST || host === PLATFORM_HOST) return host
  if (forwarded === WWW_HOST || forwarded === PLATFORM_HOST) return forwarded
  return null
}

function authPath(pathname: string): '/login' | '/auth/callback' | null {
  const bare = pathname.replace(/\/+$/, '') || '/'
  if (AUTH_PATHS.has(bare)) return bare as '/login' | '/auth/callback'
  return null
}

function safeQuery(search: string): string {
  if (!search || search === '?') return ''
  const withQ = search.startsWith('?') ? search : `?${search}`
  if (/[\u0000\r\n]/.test(withQ)) return ''
  return withQ
}

export type PlatformSignInHop = {
  status: 308
  location: string
  clear: ClearedAuthCookie[]
}

/**
 * platform /login and /auth/callback go to the same path on www.
 * The query string is kept. Location is never any host but www.
 * Legacy host-only auth cookies, including chunks, expire on this response.
 */
export function planPlatformSignInHop(input: {
  hostHeader: string | null | undefined
  forwardedHost: string | null | undefined
  pathname: string
  search: string
  cookieNames: string[]
}): PlatformSignInHop | null {
  if (publicAppHost(input.hostHeader, input.forwardedHost) !== PLATFORM_HOST) return null
  const path = authPath(input.pathname)
  if (!path) return null
  const location = `${WWW_ORIGIN}${path}${safeQuery(input.search)}`
  const host = new URL(location).hostname
  if (host !== WWW_HOST) return null
  return {
    status: 308,
    location,
    clear: expandAuthCookieNames(input.cookieNames).map(hostOnlyClear),
  }
}
