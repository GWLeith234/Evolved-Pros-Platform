import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  USER_ME_STRING_LIMITS,
  profilePatchUpdate,
  userMePatchUpdate,
} from '@/lib/onboarding/profilePatch'

const writes: unknown[] = []
const filters: { column: string; value: unknown }[] = []

const state = vi.hoisted(() => ({
  user: null as { id: string; email: string | null } | null,
  row: { id: 'row-1', email: 'member@example.com', display_name: 'Ada' },
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
          eq: (column: string, value: unknown) => {
            filters.push({ column, value })
            return {
              select: () => ({
                single: async () => ({ data: state.row, error: null }),
              }),
            }
          },
        }
      },
    }),
  },
}))

import { PATCH } from '@/app/api/user/me/route'

const STRING_FIELDS = Object.keys(USER_ME_STRING_LIMITS) as (keyof typeof USER_ME_STRING_LIMITS)[]

function patch(body: string) {
  return PATCH(
    new Request('http://localhost/api/user/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body,
    }),
  )
}

describe('userMePatchUpdate', () => {
  it('shares the http(s) check with onboarding profile writes', () => {
    expect(profilePatchUpdate({ avatar_url: 'https://cdn.example.com/a.png' })).toEqual({
      ok: true,
      update: { avatar_url: 'https://cdn.example.com/a.png' },
    })
    expect(profilePatchUpdate({ avatar_url: 'https://user:pass@cdn.example.com/a.png' })).toEqual({
      ok: false,
      error: 'avatar_url must be http(s)',
    })
    expect(userMePatchUpdate({ banner_url: 'https://cdn.example.com/a.png)' })).toEqual({
      ok: false,
      error: 'banner_url must be http(s)',
    })
  })
})

describe('PATCH /api/user/me', () => {
  beforeEach(() => {
    writes.length = 0
    filters.length = 0
    state.user = { id: 'auth-1', email: 'member@example.com' }
  })

  it('returns 401 when there is no session', async () => {
    state.user = null
    const res = await patch(JSON.stringify({ display_name: 'Ada' }))
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
    expect(writes).toEqual([])
  })

  it('returns 401 when the session has no email and does not write', async () => {
    state.user = { id: 'auth-1', email: null }
    const res = await patch(JSON.stringify({ display_name: 'Ada', email: 'member@example.com' }))
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
    expect(writes).toEqual([])
    expect(filters).toEqual([])
  })

  it('returns 400 for unparsed JSON and does not write', async () => {
    const res = await patch('{')
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid JSON' })
    expect(writes).toEqual([])
  })

  it('returns 400 for a non-object JSON body and does not write', async () => {
    const arrayBody = await patch('[]')
    expect(arrayBody.status).toBe(400)
    expect(await arrayBody.json()).toEqual({ error: 'Invalid JSON' })
    const nullBody = await patch('null')
    expect(nullBody.status).toBe(400)
    expect(await nullBody.json()).toEqual({ error: 'Invalid JSON' })
    expect(writes).toEqual([])
  })

  it('returns 400 when a string field is not a string and does not write the rest', async () => {
    for (const field of STRING_FIELDS) {
      const body = field === 'bio'
        ? { [field]: ['x'], display_name: 'Ada' }
        : { [field]: { $gt: '' } }
      const res = await patch(JSON.stringify(body))
      expect(res.status, field).toBe(400)
      expect(await res.json()).toEqual({ error: `${field} must be a string` })
    }
    expect(writes).toEqual([])
  })

  it('returns 400 when a string exceeds its limit', async () => {
    for (const field of STRING_FIELDS) {
      const res = await patch(JSON.stringify({ [field]: 'A'.repeat(USER_ME_STRING_LIMITS[field] + 1) }))
      expect(res.status, field).toBe(400)
      expect(await res.json()).toEqual({
        error: `${field} exceeds maximum length of ${USER_ME_STRING_LIMITS[field]}`,
      })
    }
    expect(writes).toEqual([])
  })

  it('returns 400 for avatar and banner urls that are not http(s)', async () => {
    const rejected = [
      'javascript:alert(1)',
      'data:text/html,hello',
      '//cdn.example.com/a.png',
      'https://user:pass@cdn.example.com/a.png',
      'https://cdn.example.com/a.png)',
    ]
    for (const url of rejected) {
      const avatar = await patch(JSON.stringify({ avatar_url: url }))
      expect(avatar.status, url).toBe(400)
      expect(await avatar.json()).toEqual({ error: 'avatar_url must be http(s)' })
      const banner = await patch(JSON.stringify({ banner_url: url }))
      expect(banner.status, url).toBe(400)
      expect(await banner.json()).toEqual({ error: 'banner_url must be http(s)' })
    }
    expect(writes).toEqual([])
  })

  it('returns 400 for an invalid pillar, a non-boolean, and bad notification prefs', async () => {
    const pillar = await patch(JSON.stringify({ current_pillar: 'p7' }))
    expect(pillar.status).toBe(400)
    expect(await pillar.json()).toEqual({ error: 'Invalid current_pillar value' })

    const phone = await patch(JSON.stringify({ phone_visible: 'true' }))
    expect(phone.status).toBe(400)
    expect(await phone.json()).toEqual({ error: 'phone_visible must be a boolean' })

    const goal = await patch(JSON.stringify({ goal_visible: 1 }))
    expect(goal.status).toBe(400)
    expect(await goal.json()).toEqual({ error: 'goal_visible must be a boolean' })

    const prefsList = await patch(JSON.stringify({ notification_preferences: [] }))
    expect(prefsList.status).toBe(400)
    expect(await prefsList.json()).toEqual({ error: 'notification_preferences must be an object' })

    const prefsValue = await patch(JSON.stringify({
      notification_preferences: { community_reply: 'always' },
    }))
    expect(prefsValue.status).toBe(400)
    expect(await prefsValue.json()).toEqual({ error: 'notification_preferences.community_reply is invalid' })

    const prefsEmpty = await patch(JSON.stringify({ notification_preferences: { role: 'admin' } }))
    expect(prefsEmpty.status).toBe(400)
    expect(await prefsEmpty.json()).toEqual({ error: 'notification_preferences has no valid fields' })
    expect(writes).toEqual([])
  })

  it('returns 400 when the body has no writable fields and does not write privileged keys', async () => {
    const res = await patch(JSON.stringify({ role: 'admin', tier: 'vip', id: 'other', email: 'other@example.com', points: 9 }))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'No valid fields provided' })
    expect(writes).toEqual([])
    expect(filters).toEqual([])
  })

  it('writes only allowlisted fields for a valid profile and scopes by session email', async () => {
    const res = await patch(JSON.stringify({
      display_name: '  Ada  ',
      full_name: 'Ada Lovelace',
      bio: 'Math',
      role_title: 'Analyst',
      location: 'London',
      company: 'Analytical Engines',
      linkedin_url: 'https://linkedin.com/in/ada',
      website_url: 'https://ada.example',
      twitter_handle: 'ada',
      phone: '+1 555 0100',
      current_pillar: 'p2',
      goal_90day: 'Finish the notes',
      avatar_url: '  https://cdn.example.com/a.png  ',
      banner_url: 'http://cdn.example.com/b.png',
      phone_visible: true,
      goal_visible: false,
      notification_preferences: {
        community_reply: 'digest',
        community_mention: 'immediate',
        event_reminder: 'off',
        course_unlock: 'immediate',
        system_billing: 'immediate',
        not_a_pref: 'nope',
      },
      role: 'admin',
      tier: 'vip',
      id: 'other-user',
      email: 'other@example.com',
      points: 9999,
    }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(state.row)
    expect(writes).toEqual([{
      display_name: 'Ada',
      full_name: 'Ada Lovelace',
      bio: 'Math',
      role_title: 'Analyst',
      location: 'London',
      company: 'Analytical Engines',
      linkedin_url: 'https://linkedin.com/in/ada',
      website_url: 'https://ada.example',
      twitter_handle: 'ada',
      phone: '+1 555 0100',
      current_pillar: 'p2',
      goal_90day: 'Finish the notes',
      avatar_url: 'https://cdn.example.com/a.png',
      banner_url: 'http://cdn.example.com/b.png',
      phone_visible: true,
      goal_visible: false,
      notification_preferences: {
        community_reply: 'digest',
        community_mention: 'immediate',
        event_reminder: 'off',
        course_unlock: 'immediate',
        system_billing: 'immediate',
      },
    }])
    expect(filters).toEqual([{ column: 'email', value: 'member@example.com' }])
  })

  it('writes null when a string, avatar, banner, or pillar is cleared', async () => {
    const res = await patch(JSON.stringify({
      display_name: '   ',
      avatar_url: '',
      banner_url: null,
      current_pillar: null,
    }))
    expect(res.status).toBe(200)
    expect(writes).toEqual([{
      display_name: null,
      avatar_url: null,
      banner_url: null,
      current_pillar: null,
    }])
    expect(filters).toEqual([{ column: 'email', value: 'member@example.com' }])
  })
})
