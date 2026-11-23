/**
 * POST and DELETE /api/events/[eventId]/register use the service role.
 * registration_count used to be a read-modify-write of the number loaded at
 * the start of the request. These calls prove the route recomputes that
 * count from event_rsvps only after this member's row is inserted or deleted,
 * and that a repeat does not move it. The floor is 0.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

type Filter = { column: string; value: unknown }

const EVENT_ID = 'event-1'
const USER_ID = 'public-user-1'

const state = vi.hoisted(() => ({
  user: null as { id: string; email: string | null } | null,
  profile: null as {
    id: string
    tier: string
    points: number
    email: string
    display_name: string
    full_name: string
  } | null,
  registrationCount: 4,
  rsvpUserIds: [] as string[],
  hideExisting: false,
  insertConflict: false,
  rpcResult: null as number | null,
  eventUpdates: [] as number[],
  rpcCalls: [] as string[],
  rsvpInserts: 0,
  rsvpFilters: [] as Filter[],
  notificationFilters: [] as Filter[],
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
    rpc: async (fn: string) => {
      state.rpcCalls.push(fn)
      const counted = state.rpcResult ?? Math.max(0, state.rsvpUserIds.length)
      state.registrationCount = Math.max(0, counted)
      return { data: counted, error: null }
    },
    from: (table: string) => {
      if (table === 'users') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: state.profile, error: null }),
            }),
          }),
          update: (payload: { points: number }) => {
            if (state.profile) state.profile.points = payload.points
            return { eq: async () => ({ error: null }) }
          },
        }
      }
      if (table === 'events') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: {
                  id: 'event-1',
                  title: 'Live room',
                  description: 'A room',
                  event_type: 'virtual',
                  starts_at: '2099-01-01T00:00:00.000Z',
                  ends_at: '2099-01-01T01:00:00.000Z',
                  zoom_url: null,
                  required_tier: null,
                  registration_count: state.registrationCount,
                  is_published: true,
                },
                error: null,
              }),
            }),
          }),
          update: (payload: { registration_count: number }) => {
            state.eventUpdates.push(payload.registration_count)
            return { eq: async () => ({ error: null }) }
          },
        }
      }
      if (table === 'event_rsvps') {
        return {
          select: () => {
            const filters: Filter[] = []
            const chain = {
              eq: (column: string, value: unknown) => {
                filters.push({ column, value })
                return chain
              },
              maybeSingle: async () => {
                state.rsvpFilters.push(...filters)
                const userId = filters.find((filter) => filter.column === 'user_id')?.value
                if (
                  !state.hideExisting &&
                  typeof userId === 'string' &&
                  state.rsvpUserIds.includes(userId)
                ) {
                  return { data: { event_id: 'event-1' }, error: null }
                }
                return { data: null, error: null }
              },
            }
            return chain
          },
          insert: (row: { event_id: string; user_id: string }) => ({
            select: async () => {
              state.rsvpInserts += 1
              if (state.insertConflict || state.rsvpUserIds.includes(row.user_id)) {
                return { data: null, error: { code: '23505', message: 'duplicate key' } }
              }
              state.rsvpUserIds.push(row.user_id)
              return { data: [{ event_id: row.event_id }], error: null }
            },
          }),
          delete: () => {
            const filters: Filter[] = []
            const chain = {
              eq: (column: string, value: unknown) => {
                filters.push({ column, value })
                return chain
              },
              select: async () => {
                state.rsvpFilters.push(...filters)
                const userId = filters.find((filter) => filter.column === 'user_id')?.value
                if (typeof userId !== 'string' || !state.rsvpUserIds.includes(userId)) {
                  return { data: [], error: null }
                }
                state.rsvpUserIds = state.rsvpUserIds.filter((id) => id !== userId)
                return { data: [{ event_id: 'event-1' }], error: null }
              },
            }
            return chain
          },
        }
      }
      if (table === 'notifications') {
        const filters: Filter[] = []
        const chain: {
          eq: (column: string, value: unknown) => typeof chain
          then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => Promise<unknown>
        } = {
          eq: (column: string, value: unknown) => {
            filters.push({ column, value })
            return chain
          },
          then: (resolve, reject) => {
            state.notificationFilters.push(...filters)
            return Promise.resolve({ error: null }).then(resolve, reject)
          },
        }
        return {
          delete: () => chain,
          insert: async () => ({ error: null }),
        }
      }
      throw new Error(`unexpected table ${table}`)
    },
  },
}))

vi.mock('@/lib/resend/emails/event-confirmation', () => ({
  sendEventConfirmationEmail: vi.fn(() => Promise.resolve()),
}))

import { DELETE, POST } from '@/app/api/events/[eventId]/register/route'

function register() {
  return POST(
    new Request(`http://localhost/api/events/${EVENT_ID}/register`, { method: 'POST' }),
    { params: { eventId: EVENT_ID } },
  )
}

function unregister() {
  return DELETE(
    new Request(`http://localhost/api/events/${EVENT_ID}/register`, { method: 'DELETE' }),
    { params: { eventId: EVENT_ID } },
  )
}

describe('POST /api/events/[eventId]/register', () => {
  beforeEach(() => {
    state.user = { id: 'auth-1', email: 'member@example.com' }
    state.profile = {
      id: USER_ID,
      tier: 'community',
      points: 10,
      email: 'member@example.com',
      display_name: 'Member',
      full_name: 'Member Name',
    }
    state.registrationCount = 4
    state.rsvpUserIds = ['u2', 'u3', 'u4', 'u5']
    state.hideExisting = false
    state.insertConflict = false
    state.rpcResult = null
    state.eventUpdates = []
    state.rpcCalls = []
    state.rsvpInserts = 0
    state.rsvpFilters = []
    state.notificationFilters = []
  })

  it('returns 401 without a session and does not write', async () => {
    state.user = null
    const res = await register()
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
    expect(state.rpcCalls).toEqual([])
    expect(state.rsvpInserts).toBe(0)
    expect(state.eventUpdates).toEqual([])
  })

  it('increments once for the first register and not again for a repeat', async () => {
    const first = await register()
    expect(first.status).toBe(200)
    expect(await first.json()).toEqual({ registered: true, registrationCount: 5 })
    expect(state.rpcCalls).toEqual(['set_event_registration_count'])
    expect(state.rsvpInserts).toBe(1)
    expect(state.rsvpUserIds).toEqual(['u2', 'u3', 'u4', 'u5', USER_ID])
    expect(state.eventUpdates).toEqual([])

    const second = await register()
    expect(second.status).toBe(409)
    expect(await second.json()).toEqual({ error: 'Already registered' })
    expect(state.rpcCalls).toEqual(['set_event_registration_count'])
    expect(state.rsvpInserts).toBe(1)
    expect(state.registrationCount).toBe(5)
    expect(state.eventUpdates).toEqual([])
  })

  it('does not increment when the insert conflicts', async () => {
    state.hideExisting = true
    state.insertConflict = true
    const res = await register()
    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({ error: 'Already registered' })
    expect(state.rpcCalls).toEqual([])
    expect(state.rsvpInserts).toBe(1)
    expect(state.registrationCount).toBe(4)
    expect(state.eventUpdates).toEqual([])
  })

  it('unregister after register returns the recomputed count', async () => {
    const joined = await register()
    expect(joined.status).toBe(200)
    expect(await joined.json()).toEqual({ registered: true, registrationCount: 5 })

    const left = await unregister()
    expect(left.status).toBe(200)
    expect(await left.json()).toEqual({ registered: false, registrationCount: 4 })
    expect(state.rpcCalls).toEqual([
      'set_event_registration_count',
      'set_event_registration_count',
    ])
    expect(state.rsvpUserIds).toEqual(['u2', 'u3', 'u4', 'u5'])
    expect(state.eventUpdates).toEqual([])
    expect(state.notificationFilters).toEqual([
      { column: 'user_id', value: USER_ID },
      { column: 'type', value: 'event_reminder' },
      { column: 'action_url', value: `/events/${EVENT_ID}` },
      { column: 'is_read', value: false },
    ])
  })
})

describe('DELETE /api/events/[eventId]/register', () => {
  beforeEach(() => {
    state.user = { id: 'auth-1', email: 'member@example.com' }
    state.profile = {
      id: USER_ID,
      tier: 'community',
      points: 10,
      email: 'member@example.com',
      display_name: 'Member',
      full_name: 'Member Name',
    }
    state.registrationCount = 4
    state.rsvpUserIds = []
    state.hideExisting = false
    state.insertConflict = false
    state.rpcResult = null
    state.eventUpdates = []
    state.rpcCalls = []
    state.rsvpInserts = 0
    state.rsvpFilters = []
    state.notificationFilters = []
  })

  it('returns 401 without a session and does not write', async () => {
    state.user = null
    const res = await unregister()
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
    expect(state.eventUpdates).toEqual([])
    expect(state.rpcCalls).toEqual([])
    expect(state.rsvpFilters).toEqual([])
  })

  it('leaves registration_count alone when this member has no RSVP', async () => {
    const res = await unregister()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ registered: false, registrationCount: 4 })
    expect(state.eventUpdates).toEqual([])
    expect(state.rpcCalls).toEqual([])
    expect(state.notificationFilters).toEqual([])
    expect(state.rsvpFilters).toEqual([
      { column: 'event_id', value: EVENT_ID },
      { column: 'user_id', value: USER_ID },
    ])
  })

  it('decrements once for this member and does not decrement a second time', async () => {
    state.rsvpUserIds = [USER_ID, 'u2', 'u3', 'u4']
    const first = await unregister()
    expect(first.status).toBe(200)
    expect(await first.json()).toEqual({ registered: false, registrationCount: 3 })
    expect(state.rpcCalls).toEqual(['set_event_registration_count'])
    expect(state.eventUpdates).toEqual([])
    expect(state.notificationFilters).toEqual([
      { column: 'user_id', value: USER_ID },
      { column: 'type', value: 'event_reminder' },
      { column: 'action_url', value: `/events/${EVENT_ID}` },
      { column: 'is_read', value: false },
    ])

    state.notificationFilters = []
    const second = await unregister()
    expect(second.status).toBe(200)
    expect(await second.json()).toEqual({ registered: false, registrationCount: 3 })
    expect(state.rpcCalls).toEqual(['set_event_registration_count'])
    expect(state.eventUpdates).toEqual([])
  })

  it('does not take registration_count below 0', async () => {
    state.registrationCount = 0
    state.rsvpUserIds = [USER_ID]
    state.rpcResult = -1
    const res = await unregister()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ registered: false, registrationCount: 0 })
    expect(state.registrationCount).toBe(0)
    expect(state.eventUpdates).toEqual([])
  })
})
