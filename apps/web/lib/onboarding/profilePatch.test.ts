import { beforeEach, describe, expect, it, vi } from 'vitest'

const writes: unknown[] = []

const state = vi.hoisted(() => ({
  user: null as { id: string; email: string } | null,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: state.user } }),
    },
  }),
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

import { PATCH } from '@/app/api/onboarding/profile/route'

function patch(body: string, contentType = 'application/json') {
  return PATCH(
    new Request('http://localhost/api/onboarding/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': contentType },
      body,
    }),
  )
}

describe('PATCH /api/onboarding/profile', () => {
  beforeEach(() => {
    writes.length = 0
    state.user = { id: 'auth-1', email: 'member@example.com' }
  })

  it('returns 401 when there is no session', async () => {
    state.user = null
    const res = await patch(JSON.stringify({ display_name: 'Ada' }))
    expect(res.status).toBe(401)
    expect(writes).toEqual([])
  })

  it('returns 400 for unparsed JSON and does not write', async () => {
    const res = await patch('{')
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid JSON' })
    expect(writes).toEqual([])
  })

  it('returns 400 when a string field is not a string', async () => {
    const res = await patch(JSON.stringify({ display_name: { $gt: '' }, bio: ['x'] }))
    expect(res.status).toBe(400)
    expect(writes).toEqual([])
  })

  it('returns 400 when a string exceeds its limit', async () => {
    const res = await patch(JSON.stringify({ display_name: 'A'.repeat(51) }))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'display_name exceeds maximum length of 50' })
    expect(writes).toEqual([])
  })

  it('returns 400 for a non-http avatar and an out-of-range pillar', async () => {
    const avatar = await patch(JSON.stringify({ avatar_url: 'javascript:alert(1)' }))
    expect(avatar.status).toBe(400)
    const pillar = await patch(JSON.stringify({ focus_pillar: 9 }))
    expect(pillar.status).toBe(400)
    expect(await pillar.json()).toEqual({ error: 'focus_pillar must be an integer from 1 to 6' })
    const fractional = await patch(JSON.stringify({ focus_pillar: 1.5 }))
    expect(fractional.status).toBe(400)
    const asString = await patch(JSON.stringify({ focus_pillar: '1' }))
    expect(asString.status).toBe(400)
    expect(writes).toEqual([])
  })

  it('writes only allowlisted fields for a valid profile', async () => {
    const res = await patch(JSON.stringify({
      display_name: '  Ada  ',
      company: 'Analytical Engines',
      focus_pillar: 2,
      role: 'admin',
      tier: 'pro',
    }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(writes).toEqual([{
      display_name: 'Ada',
      company: 'Analytical Engines',
      focus_pillar: 2,
    }])
  })

  it('does not write when the body has no profile fields', async () => {
    const res = await patch(JSON.stringify({ role: 'admin', tier: 'pro' }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(writes).toEqual([])
  })
})
