/**
 * DELETE /api/events/[eventId]/register uses the service role, which skips
 * RLS. The shared registration_count used to drop whenever the call returned,
 * including when the member had no RSVP. These calls prove the counter moves
 * only after this member's row is actually deleted.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

type Filter = { column: string; value: unknown }

const state = vi.hoisted(() => ({
  user: null as { id: string; email: string | null } | null,
  profile: null as { id: string } | null,
  registrationCount: 4,
  removed: [] as { event_id: string }[],
  eventUpdates: [] as number[],
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
    from: (table: string) => {
      if (table === 'users') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: state.profile, error: null }),
            }),
          }),
        }
      }
      if (table === 'events') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { registration_count: state.registrationCount, starts_at: '2099-01-01T00:00:00.000Z' },
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
        const filters: Filter[] = []
        const chain = {
          eq: (column: string, value: unknown) => {
            filters.push({ column, value })
            return chain
          },
          select: async () => {
            state.rsvpFilters.push(...filters)
            return { data: state.removed, error: null }
          },
        }
        return { delete: () => chain }
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
        return { delete: () => chain }
      }
      throw new Error(`unexpected table ${table}`)
    },
  },
}))

vi.mock('@/lib/resend/emails/event-confirmation', () => ({
  sendEventConfirmationEmail: vi.fn(),
}))

import { DELETE } from '@/app/api/events/[eventId]/register/route'

const EVENT_ID = 'event-1'

function unregister() {
  return DELETE(
    new Request(`http://localhost/api/events/${EVENT_ID}/register`, { method: 'DELETE' }),
    { params: { eventId: EVENT_ID } },
  )
}

describe('DELETE /api/events/[eventId]/register', () => {
  beforeEach(() => {
    state.user = { id: 'auth-1', email: 'member@example.com' }
    state.profile = { id: 'public-user-1' }
    state.registrationCount = 4
    state.removed = []
    state.eventUpdates = []
    state.rsvpFilters = []
    state.notificationFilters = []
  })

  it('returns 401 without a session and does not write', async () => {
    state.user = null
    const res = await unregister()
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
    expect(state.eventUpdates).toEqual([])
    expect(state.rsvpFilters).toEqual([])
  })

  it('leaves registration_count alone when this member has no RSVP', async () => {
    const res = await unregister()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ registered: false, registrationCount: 4 })
    expect(state.eventUpdates).toEqual([])
    expect(state.notificationFilters).toEqual([])
    expect(state.rsvpFilters).toEqual([
      { column: 'event_id', value: EVENT_ID },
      { column: 'user_id', value: 'public-user-1' },
    ])
  })

  it('decrements once for this member and does not decrement a second time', async () => {
    state.removed = [{ event_id: EVENT_ID }]
    const first = await unregister()
    expect(first.status).toBe(200)
    expect(await first.json()).toEqual({ registered: false, registrationCount: 3 })
    expect(state.eventUpdates).toEqual([3])
    expect(state.notificationFilters).toEqual([
      { column: 'user_id', value: 'public-user-1' },
      { column: 'type', value: 'event_reminder' },
      { column: 'action_url', value: `/events/${EVENT_ID}` },
      { column: 'is_read', value: false },
    ])

    state.removed = []
    state.registrationCount = 3
    state.notificationFilters = []
    const second = await unregister()
    expect(second.status).toBe(200)
    expect(await second.json()).toEqual({ registered: false, registrationCount: 3 })
    expect(state.eventUpdates).toEqual([3])
  })
})
