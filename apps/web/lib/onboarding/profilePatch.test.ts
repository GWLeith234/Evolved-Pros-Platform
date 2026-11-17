import { beforeEach, describe, expect, it, vi } from 'vitest'
import { profilePatchUpdate } from '@/lib/onboarding/profilePatch'

const writes: unknown[] = []
const filters: { column: string; value: unknown }[] = []

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
          eq: async (column: string, value: unknown) => {
            filters.push({ column, value })
            return { error: null }
          },
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

describe('profilePatchUpdate', () => {
  it('rejects data and protocol-relative avatar urls', () => {
    expect(profilePatchUpdate({ avatar_url: 'data:image/png;base64,aaaa' })).toEqual({
      ok: false,
      error: 'avatar_url must be http(s)',
    })
    expect(profilePatchUpdate({ avatar_url: '//host/pic.png' })).toEqual({
      ok: false,
      error: 'avatar_url must be http(s)',
    })
  })

  it('rejects focus_pillar 0 and 7 and clears a null pillar', () => {
    expect(profilePatchUpdate({ focus_pillar: 0 })).toEqual({
      ok: false,
      error: 'focus_pillar must be an integer from 1 to 6',
    })
    expect(profilePatchUpdate({ focus_pillar: 7 })).toEqual({
      ok: false,
      error: 'focus_pillar must be an integer from 1 to 6',
    })
    expect(profilePatchUpdate({ focus_pillar: null })).toEqual({
      ok: true,
      update: { focus_pillar: null },
    })
  })

  it('stores empty and whitespace-only strings as null', () => {
    expect(profilePatchUpdate({
      display_name: '',
      company: '   ',
      bio: '',
      location: ' ',
      role_title: '',
      avatar_url: '',
    })).toEqual({
      ok: true,
      update: {
        display_name: null,
        company: null,
        bio: null,
        location: null,
        role_title: null,
        avatar_url: null,
      },
    })
  })
})

describe('PATCH /api/onboarding/profile', () => {
  beforeEach(() => {
    writes.length = 0
    filters.length = 0
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

  it('returns 400 for a data url and a protocol-relative avatar and does not write', async () => {
    const dataUrl = await patch(JSON.stringify({ avatar_url: 'data:text/html,hello' }))
    expect(dataUrl.status).toBe(400)
    expect(await dataUrl.json()).toEqual({ error: 'avatar_url must be http(s)' })
    const protocolRelative = await patch(JSON.stringify({ avatar_url: '//host' }))
    expect(protocolRelative.status).toBe(400)
    expect(await protocolRelative.json()).toEqual({ error: 'avatar_url must be http(s)' })
    expect(writes).toEqual([])
  })

  it('returns 400 for focus_pillar 0 and 7 and writes null when the pillar is null', async () => {
    const zero = await patch(JSON.stringify({ focus_pillar: 0 }))
    expect(zero.status).toBe(400)
    expect(await zero.json()).toEqual({ error: 'focus_pillar must be an integer from 1 to 6' })
    const seven = await patch(JSON.stringify({ focus_pillar: 7 }))
    expect(seven.status).toBe(400)
    const cleared = await patch(JSON.stringify({ focus_pillar: null }))
    expect(cleared.status).toBe(200)
    expect(writes).toEqual([{ focus_pillar: null }])
  })

  it('writes null for empty and whitespace-only string fields', async () => {
    const res = await patch(JSON.stringify({
      display_name: '',
      company: '   ',
      bio: '',
      location: ' ',
      role_title: '',
      avatar_url: '',
    }))
    expect(res.status).toBe(200)
    expect(writes).toEqual([{
      display_name: null,
      company: null,
      bio: null,
      location: null,
      role_title: null,
      avatar_url: null,
    }])
  })

  it('scopes the write to the session user id and never an id from the body', async () => {
    const res = await patch(JSON.stringify({
      id: 'other-user',
      display_name: 'Ada',
    }))
    expect(res.status).toBe(200)
    expect(writes).toEqual([{ display_name: 'Ada' }])
    expect(filters).toEqual([{ column: 'id', value: 'auth-1' }])
  })
})
