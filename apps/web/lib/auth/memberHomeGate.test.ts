import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { NextRequest } from 'next/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LOGGED_OUT_MEMBER_HOME_STATUS, isMemberHomeIndex } from './memberHomeGate'
import { middleware } from '../../middleware'

const gate = vi.hoisted(() => ({
  user: null as null | { id: string; email: string },
  profile: {
    role: 'member',
    onboarding_completed: true,
    access_status: 'active' as string | null,
    comp_promo_code_id: null as string | null,
  },
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: gate.user } }),
    },
  }),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: gate.profile, error: null }),
        }),
      }),
    }),
  }),
}))

const WWW = 'https://www.evolvedpros.com'
const MEMBER_COOKIE = 'sb-project-auth-token=session'
const GOOGLEBOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
const BROWSER = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

function call(
  path: string,
  init?: { origin?: string; cookie?: string; userAgent?: string; rsc?: boolean },
) {
  const headers = new Headers()
  if (init?.cookie) headers.set('cookie', init.cookie)
  if (init?.userAgent) headers.set('user-agent', init.userAgent)
  if (init?.rsc) headers.set('RSC', '1')
  return middleware(new NextRequest(new URL(path, init?.origin ?? WWW), { headers }))
}

function locationOf(res: Response): URL {
  const location = res.headers.get('location')
  expect(location, 'Location').toBeTruthy()
  return new URL(location!, WWW)
}

afterEach(() => {
  gate.user = null
  gate.profile = {
    role: 'member',
    onboarding_completed: true,
    access_status: 'active',
    comp_promo_code_id: null,
  }
  vi.unstubAllEnvs()
})

describe('isMemberHomeIndex', () => {
  it('matches only the member home index', () => {
    expect(isMemberHomeIndex('/home')).toBe(true)
    expect(isMemberHomeIndex('/home/')).toBe(true)
    expect(isMemberHomeIndex('/home?from=email')).toBe(true)
    expect(isMemberHomeIndex('/home/goals')).toBe(false)
    expect(isMemberHomeIndex('/academy')).toBe(false)
    expect(isMemberHomeIndex('/')).toBe(false)
  })
})

describe('logged-out document GET /home', () => {
  it('permanently redirects to / for a browser and for Googlebot', async () => {
    for (const userAgent of [BROWSER, GOOGLEBOT]) {
      const res = await call('/home', { userAgent })
      expect(res.status, userAgent).toBe(LOGGED_OUT_MEMBER_HOME_STATUS)
      expect(res.status, userAgent).toBe(308)
      const location = locationOf(res)
      expect(location.origin, userAgent).toBe(WWW)
      expect(location.pathname, userAgent).toBe('/')
      expect(location.search, userAgent).toBe('')
    }
  })

  it('redirects /home/ straight to / and drops a query string', async () => {
    const slash = await call('/home/')
    expect(slash.status).toBe(308)
    expect(locationOf(slash).pathname).toBe('/')

    const query = await call('/home?from=email')
    expect(query.status).toBe(308)
    const location = locationOf(query)
    expect(location.pathname).toBe('/')
    expect(location.search).toBe('')
  })

  it('keeps the request host', async () => {
    const res = await call('/home', { origin: 'https://platform.evolvedpros.com' })
    expect(res.status).toBe(308)
    expect(locationOf(res).href).toBe('https://platform.evolvedpros.com/')
  })

  it('sends a stale session cookie to / as well', async () => {
    const res = await call('/home', { cookie: MEMBER_COOKIE, userAgent: GOOGLEBOT })
    expect(res.status).toBe(308)
    expect(locationOf(res).pathname).toBe('/')
  })
})

describe('other protected routes stay on the login redirect', () => {
  it.each(['/academy', '/events', '/community', '/settings', '/home/goals'])(
    '307s %s to /login?redirect=',
    async path => {
      const res = await call(path, { userAgent: GOOGLEBOT })
      expect(res.status).toBe(307)
      const location = locationOf(res)
      expect(location.pathname).toBe('/login')
      expect(location.searchParams.get('redirect')).toBe(path)
    },
  )
})

describe('logged-in /home still reaches the dashboard', () => {
  it('passes a resolved member through with 200', async () => {
    gate.user = { id: 'user-1', email: 'member@example.com' }
    const res = await call('/home', { cookie: MEMBER_COOKIE, userAgent: GOOGLEBOT })
    expect(res.status).toBe(200)
    expect(res.headers.get('location')).toBeNull()
  })

  it('does not send a signed-in /home/ to the public homepage', async () => {
    gate.user = { id: 'user-1', email: 'member@example.com' }
    const res = await call('/home/', { cookie: MEMBER_COOKIE })
    expect(res.status).toBe(308)
    const path = locationOf(res).pathname
    expect(path.startsWith('/home')).toBe(true)
    expect(path).not.toBe('/')
  })

  it('still sends an unfinished member to onboarding', async () => {
    gate.user = { id: 'user-1', email: 'member@example.com' }
    gate.profile.onboarding_completed = false
    const res = await call('/home', { cookie: MEMBER_COOKIE })
    expect(res.status).toBe(307)
    expect(locationOf(res).pathname).toBe('/onboarding')
  })

  it('honors the dev session bypass', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const res = await call('/home', { cookie: 'dev_session=1' })
    expect(res.status).toBe(200)
    expect(res.headers.get('location')).toBeNull()
  })
})

describe('no cloaking and no RSC document redirect', () => {
  it('does not read the crawler identity', () => {
    const src = readFileSync(resolve(__dirname, '../../middleware.ts'), 'utf8')
    expect(src).not.toMatch(/user-agent/i)
    expect(src).not.toMatch(/googlebot/i)
  })

  it('does not 308 an anonymous RSC request for /home', async () => {
    const res = await call('/home', { rsc: true, userAgent: GOOGLEBOT })
    expect(res.status).toBe(200)
    expect(res.headers.get('location')).toBeNull()
  })
})

describe('member home index wiring', () => {
  const root = resolve(__dirname, '../..')

  it('permanent-redirects a logged-out RSC render to / and noindexes the dashboard', () => {
    const layout = readFileSync(resolve(root, 'app/(member)/layout.tsx'), 'utf8')
    const page = readFileSync(resolve(root, 'app/(member)/home/page.tsx'), 'utf8')
    expect(layout).toContain('isMemberHomeIndex')
    expect(layout).toContain("permanentRedirect('/')")
    expect(layout).toContain('loginHrefFor')
    expect(page).toContain("permanentRedirect('/')")
    expect(page).not.toContain("redirect('/login')")
    expect(page).toMatch(/robots:\s*\{[^}]*index:\s*false/)
    expect(page).toMatch(/follow:\s*false/)
  })
})
