import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PROFILE_STRING_LIMITS, USER_ME_STRING_LIMITS } from '@/lib/onboarding/profilePatch'

const writes: Record<string, unknown>[] = []
const filters: { column: string; value: unknown }[] = []

const state = vi.hoisted(() => ({
  admin: true,
}))

vi.mock('@/lib/admin/helpers', () => ({
  requireAdminApi: async () => {
    if (!state.admin) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return { userId: 'admin-1' }
  },
}))

vi.mock('@/lib/supabase/admin', () => ({
  adminClient: {
    from: () => ({
      update: (payload: Record<string, unknown>) => {
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

import { PATCH } from '@/app/api/admin/members/[userId]/profile/route'

const USER_ID = 'user-1'
const GOOD = 'https://cdn.example.com/a.png'

const FIELDS = ['avatar_url', 'banner_url'] as const

const REJECTED = [
  'javascript:alert(1)',
  'JaVaScRiPt:alert(1)',
  '  javascript:alert(1)  ',
  'vbscript:msgbox(1)',
  'VbScRiPt:msgbox(1)',
  'data:text/html,hello',
  'DaTa:text/html,hello',
  'ftp://cdn.example.com/a.png',
  'FtP://cdn.example.com/a.png',
  'file:///etc/passwd',
  'FiLe:///etc/passwd',
  'https://cdn.example.com/a\\b.png',
  'https://cdn.example.com/a".png',
  "https://cdn.example.com/a'.png",
  'https://cdn.example.com/a`.png',
  'https://cdn.example.com/a<.png',
  'https://cdn.example.com/a>.png',
]

function httpsUrl(length: number): string {
  const prefix = 'https://cdn.example.com/'
  return prefix + 'a'.repeat(length - prefix.length)
}

function patch(body: unknown) {
  return patchRaw(JSON.stringify(body))
}

function patchRaw(body: string) {
  return PATCH(
    new Request(`http://localhost/api/admin/members/${USER_ID}/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body,
    }),
    { params: { userId: USER_ID } },
  )
}

function writtenImages() {
  return writes.map((payload) => {
    const { updated_at, ...rest } = payload
    expect(updated_at).toEqual(expect.any(String))
    return rest
  })
}

describe('PATCH /api/admin/members/[userId]/profile image urls', () => {
  beforeEach(() => {
    writes.length = 0
    filters.length = 0
    state.admin = true
  })

  it('returns 400 for invalid JSON, null, and non-object bodies and does not write', async () => {
    const bodies = ['', '{', 'null', '[]', 'true', '"https://cdn.example.com/a.png"', '1']
    for (const body of bodies) {
      const res = await patchRaw(body)
      expect(res.status, body).toBe(400)
      const payload = await res.json()
      expect(payload, body).toEqual({ error: 'Invalid JSON' })
      expect(JSON.stringify(payload)).not.toMatch(/SyntaxError|Unexpected token|Cannot read properties/)
    }
    expect(writes).toEqual([])
  })

  it('returns 401 and does not write when the caller is not an admin', async () => {
    state.admin = false
    const res = await patch({ avatar_url: 'javascript:alert(1)' })
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
    expect(writes).toEqual([])
  })

  it('stores a trimmed http(s) url, including a mixed-case scheme', async () => {
    const https = await patch({ avatar_url: `  ${GOOD}\n`, display_name: 'Ada' })
    expect(https.status).toBe(200)
    expect(await https.json()).toEqual({ ok: true })

    const http = await patch({ banner_url: 'http://cdn.example.com/b.png' })
    expect(http.status).toBe(200)

    const mixed = await patch({
      avatar_url: 'HTTPS://cdn.example.com/a.png',
      banner_url: 'HtTp://cdn.example.com/b.png',
    })
    expect(mixed.status).toBe(200)

    expect(writtenImages()).toEqual([
      { avatar_url: GOOD, display_name: 'Ada' },
      { banner_url: 'http://cdn.example.com/b.png' },
      {
        avatar_url: 'HTTPS://cdn.example.com/a.png',
        banner_url: 'HtTp://cdn.example.com/b.png',
      },
    ])
    expect(filters).toEqual([
      { column: 'id', value: USER_ID },
      { column: 'id', value: USER_ID },
      { column: 'id', value: USER_ID },
    ])
  })

  it('clears an image when the value is null or blank', async () => {
    const res = await patch({ avatar_url: null, banner_url: '   ' })
    expect(res.status).toBe(200)
    expect(writtenImages()).toEqual([{ avatar_url: null, banner_url: null }])
  })

  it('returns 422 and does not write unsafe image urls', async () => {
    for (const field of FIELDS) {
      for (const url of REJECTED) {
        const res = await patch({ [field]: url, display_name: 'Ada' })
        expect(res.status, `${field} ${JSON.stringify(url)}`).toBe(422)
        expect(await res.json()).toEqual({ error: `${field} must be http(s)` })
      }
    }
    expect(writes).toEqual([])
  })

  it('accepts an http(s) url of 2048 characters and rejects 2049', async () => {
    expect(PROFILE_STRING_LIMITS.avatar_url).toBe(2048)
    const exact = httpsUrl(2048)
    const over = httpsUrl(2049)
    expect(exact).toHaveLength(2048)
    expect(over).toHaveLength(2049)

    for (const field of FIELDS) {
      const ok = await patch({ [field]: exact })
      expect(ok.status, field).toBe(200)
      const tooLong = await patch({ [field]: `  ${over}  ` })
      expect(tooLong.status, field).toBe(422)
      expect(await tooLong.json()).toEqual({
        error: `${field} exceeds maximum length of 2048`,
      })
    }

    expect(writtenImages()).toEqual([
      { avatar_url: exact },
      { banner_url: exact },
    ])
  })

  it('returns 422 when an image value is not a string and does not write', async () => {
    for (const field of FIELDS) {
      const res = await patch({ [field]: 1, display_name: 'Ada' })
      expect(res.status, field).toBe(422)
      expect(await res.json()).toEqual({ error: `${field} must be a string` })
    }
    expect(writes).toEqual([])
  })
})

const LINK_FIELDS = ['linkedin_url', 'website_url'] as const
const LINK_MAX = USER_ME_STRING_LIMITS.linkedin_url

const REJECTED_LINKS = [
  'javascript:alert(1)',
  'JAVASCRIPT:alert(1)',
  '  javascript:alert(1)  ',
  'vbscript:msgbox(1)',
  'data:text/html,hello',
  'ftp://files.example.com/a',
]

function linkUrl(length: number): string {
  const prefix = 'https://example.com/'
  return prefix + 'a'.repeat(length - prefix.length)
}

describe('PATCH /api/admin/members/[userId]/profile link urls', () => {
  beforeEach(() => {
    writes.length = 0
    filters.length = 0
    state.admin = true
  })

  it('stores a trimmed https url and clears null or blank', async () => {
    const saved = await patch({
      linkedin_url: '  https://linkedin.com/in/ada  ',
      website_url: 'https://ada.example',
      display_name: 'Ada',
    })
    expect(saved.status).toBe(200)
    expect(await saved.json()).toEqual({ ok: true })

    const cleared = await patch({ linkedin_url: null, website_url: '' })
    expect(cleared.status).toBe(200)
    const blank = await patch({ website_url: '   ' })
    expect(blank.status).toBe(200)

    expect(writtenImages()).toEqual([
      {
        linkedin_url: 'https://linkedin.com/in/ada',
        website_url: 'https://ada.example',
        display_name: 'Ada',
      },
      { linkedin_url: null, website_url: null },
      { website_url: null },
    ])
  })

  it('returns 422 and does not write a url that is not http(s)', async () => {
    for (const field of LINK_FIELDS) {
      for (const url of REJECTED_LINKS) {
        const res = await patch({ [field]: url, display_name: 'Ada' })
        expect(res.status, `${field} ${JSON.stringify(url)}`).toBe(422)
        expect(await res.json()).toEqual({ error: `${field} must be http(s)` })
      }
    }
    expect(writes).toEqual([])
  })

  it('accepts an http(s) url of 300 characters and rejects 301', async () => {
    expect(USER_ME_STRING_LIMITS.website_url).toBe(LINK_MAX)
    const exact = linkUrl(LINK_MAX)
    const over = linkUrl(LINK_MAX + 1)
    expect(exact).toHaveLength(LINK_MAX)
    expect(over).toHaveLength(LINK_MAX + 1)

    for (const field of LINK_FIELDS) {
      const ok = await patch({ [field]: exact })
      expect(ok.status, field).toBe(200)
      const tooLong = await patch({ [field]: `  ${over}  `, display_name: 'Ada' })
      expect(tooLong.status, field).toBe(422)
      expect(await tooLong.json()).toEqual({
        error: `${field} exceeds maximum length of ${LINK_MAX}`,
      })
    }

    expect(writtenImages()).toEqual([
      { linkedin_url: exact },
      { website_url: exact },
    ])
  })
})
