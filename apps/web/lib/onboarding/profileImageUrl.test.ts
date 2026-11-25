import { beforeEach, describe, expect, it, vi } from 'vitest'
import { isProfileHttpUrl, readProfileImageUrl } from '@/lib/onboarding/profilePatch'

const writes: unknown[] = []

const state = vi.hoisted(() => ({
  profile: { id: 'user-1' } as { id: string } | null,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({}),
}))

vi.mock('@/lib/supabase/admin', () => ({
  adminClient: {
    from: () => ({
      update: (payload: unknown) => {
        writes.push(payload)
        return {
          eq: async () => ({ error: null }),
        }
      },
    }),
  },
}))

vi.mock('@/lib/auth/resolveCurrentUser', () => ({
  resolveCurrentUser: async () => state.profile,
}))

import { PATCH as patchAvatar } from '@/app/api/profile/avatar/route'
import { PATCH as patchBanner } from '@/app/api/profile/banner/route'

const GOOD = 'https://cdn.example.com/a.png'

const REJECTED = [
  'javascript:alert(1)',
  'JaVaScRiPt:alert(1)',
  '  javascript:alert(1)  ',
  '\n\tjavascript:alert(1)\r\n',
  'vbscript:msgbox(1)',
  'VbScRiPt:msgbox(1)',
  'data:text/html,hello',
  'DaTa:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg">',
  ' \u0000javascript:alert(1)',
  `${GOOD}\u0000`,
  `\u0000${GOOD}`,
  'https://cdn.example.com/a\u0001.png',
  'https://cdn.example.com/a\tb.png',
  'https://cdn.example.com/a b.png',
  'https://user:pass@cdn.example.com/a.png',
  'https://cdn.example.com/a.png)',
  'https://cdn.example.com/a.png"',
  "https://cdn.example.com/a'.png",
  'https://cdn.example.com/a`.png',
  'https://cdn.example.com/a\\b.png',
  'https://cdn.example.com/<a.png',
  'https://cdn.example.com/a>.png',
  'http://',
  '//cdn.example.com/a.png',
]

function patch(handler: (request: Request) => Promise<Response>, url: string, body: string) {
  return handler(
    new Request(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body,
    }),
  )
}

describe('isProfileHttpUrl', () => {
  it('rejects script, data, and vbscript schemes in any case', () => {
    for (const url of [
      'javascript:alert(1)',
      'JaVaScRiPt:alert(1)',
      'vbscript:msgbox(1)',
      'VbScRiPt:msgbox(1)',
      'data:text/html,hello',
      'DaTa:text/html,hello',
    ]) {
      expect(isProfileHttpUrl(url), url).toBe(false)
    }
  })

  it('rejects surrounding whitespace, control characters, and CSS url breakouts', () => {
    expect(isProfileHttpUrl(`  ${GOOD}  `)).toBe(false)
    expect(isProfileHttpUrl(`\n${GOOD}\n`)).toBe(false)
    expect(isProfileHttpUrl(`${GOOD}\u0000`)).toBe(false)
    expect(isProfileHttpUrl(`\u0001${GOOD}`)).toBe(false)
    expect(isProfileHttpUrl('https://cdn.example.com/a.png)')).toBe(false)
    expect(isProfileHttpUrl('https://user:pass@cdn.example.com/a.png')).toBe(false)
  })

  it('accepts http and https, including a mixed-case scheme', () => {
    expect(isProfileHttpUrl(GOOD)).toBe(true)
    expect(isProfileHttpUrl('http://cdn.example.com/b.png')).toBe(true)
    expect(isProfileHttpUrl('HTTPS://cdn.example.com/a.png')).toBe(true)
  })
})

describe('readProfileImageUrl', () => {
  it('trims surrounding whitespace and still rejects schemes hiding in it', () => {
    expect(readProfileImageUrl(`  ${GOOD}\n`)).toEqual({ ok: true, url: GOOD })
    expect(readProfileImageUrl('  \tjavascript:alert(1)\r\n')).toEqual({
      ok: false,
      error: 'url must be http(s)',
    })
    expect(readProfileImageUrl(`${GOOD}\u0000`)).toEqual({
      ok: false,
      error: 'url must be http(s)',
    })
  })
})

describe('PATCH /api/profile/avatar and /api/profile/banner', () => {
  beforeEach(() => {
    writes.length = 0
    state.profile = { id: 'user-1' }
  })

  const routes = [
    { name: 'avatar', handler: patchAvatar, path: 'http://localhost/api/profile/avatar', field: 'avatar_url' },
    { name: 'banner', handler: patchBanner, path: 'http://localhost/api/profile/banner', field: 'banner_url' },
  ] as const

  it('returns 401 and does not write when there is no profile', async () => {
    state.profile = null
    for (const route of routes) {
      const res = await patch(route.handler, route.path, JSON.stringify({ url: GOOD }))
      expect(res.status, route.name).toBe(401)
      expect(await res.json()).toEqual({ error: 'Unauthorized' })
    }
    expect(writes).toEqual([])
  })

  it('returns 415 for a body that is not JSON', async () => {
    for (const route of routes) {
      const res = await patch(route.handler, route.path, '{')
      expect(res.status, route.name).toBe(415)
      expect(await res.json()).toEqual({ error: 'Content-Type must be application/json' })
    }
    expect(writes).toEqual([])
  })

  it('returns 422 when url is missing, blank, or not a string', async () => {
    for (const route of routes) {
      for (const body of [{}, { url: '' }, { url: '   ' }, { url: 1 }, { url: null }]) {
        const res = await patch(route.handler, route.path, JSON.stringify(body))
        expect(res.status, `${route.name} ${JSON.stringify(body)}`).toBe(422)
        expect(await res.json()).toEqual({ error: 'url is required' })
      }
    }
    expect(writes).toEqual([])
  })

  it('returns 422 when url is longer than 2048 characters', async () => {
    const url = `https://cdn.example.com/${'a'.repeat(2048)}`
    for (const route of routes) {
      const res = await patch(route.handler, route.path, JSON.stringify({ url }))
      expect(res.status, route.name).toBe(422)
      expect(await res.json()).toEqual({ error: 'url too long' })
    }
    expect(writes).toEqual([])
  })

  it('returns 422 and does not store script, data, vbscript, or breakout urls', async () => {
    for (const route of routes) {
      for (const url of REJECTED) {
        const res = await patch(route.handler, route.path, JSON.stringify({ url }))
        expect(res.status, `${route.name} ${JSON.stringify(url)}`).toBe(422)
        expect(await res.json()).toEqual({ error: 'url must be http(s)' })
      }
    }
    expect(writes).toEqual([])
  })

  it('stores a trimmed http(s) url', async () => {
    for (const route of routes) {
      const res = await patch(route.handler, route.path, JSON.stringify({ url: `  ${GOOD} \n` }))
      expect(res.status, route.name).toBe(200)
      expect(await res.json()).toEqual({ [route.field]: GOOD })
    }
    expect(writes).toEqual([{ avatar_url: GOOD }, { banner_url: GOOD }])
  })
})
