/**
 * POST /api/conversations used to interpolate recipientId into a service-role
 * .or() filter. A signed-in member of The 99 could close the and() early and
 * read a conversation they are not in. These calls prove that payload never
 * becomes a query, and that another pair's row is not returned.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const SENDER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const OTHER = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const VICTIM_A = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const VICTIM_B = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
const VICTIM_CONV = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'

type Eq = { table: string; column: string; value: unknown }
type Row = Record<string, unknown>

const state = vi.hoisted(() => ({
  profile: null as { id: string; tier: string; tier_status: string | null } | null,
  authUser: null as { id: string; email: string } | null,
  ors: [] as string[],
  eqs: [] as Eq[],
  inserts: [] as Row[],
  users: [] as Array<{ id: string; email: string }>,
  conversations: [] as Row[],
}))

function match(table: string, eqs: Eq[], inserted: Row | null): Row | null {
  if (table === 'users') {
    const email = eqs.find(eq => eq.column === 'email')?.value
    if (typeof email === 'string') return state.users.find(user => user.email === email) ?? null
    const id = eqs.find(eq => eq.column === 'id')?.value
    return state.users.find(user => user.id === id) ?? null
  }
  if (table === 'conversations') {
    if (inserted && eqs.length === 0) return inserted
    const one = eqs.find(eq => eq.column === 'participant_one_id')?.value
    const two = eqs.find(eq => eq.column === 'participant_two_id')?.value
    return (
      state.conversations.find(
        row => row.participant_one_id === one && row.participant_two_id === two,
      ) ?? null
    )
  }
  return null
}

function chain(table: string) {
  const eqs: Eq[] = []
  let inserted: Row | null = null
  const node: Record<string, unknown> = {}
  const self = () => node
  node.select = self
  node.order = self
  node.eq = (column: string, value: unknown) => {
    const eq = { table, column, value }
    eqs.push(eq)
    state.eqs.push(eq)
    return node
  }
  node.or = (filter: string) => {
    state.ors.push(filter)
    return node
  }
  node.insert = (row: Row) => {
    inserted = {
      id: '11111111-1111-4111-8111-111111111111',
      participant_one_id: row.participant_one_id,
      participant_two_id: row.participant_two_id,
      last_message_at: null,
      created_at: '2026-10-28T00:00:00.000Z',
    }
    state.inserts.push(row)
    state.conversations.push(inserted)
    return node
  }
  node.maybeSingle = async () => ({ data: match(table, eqs, inserted), error: null })
  node.single = async () => {
    const data = match(table, eqs, inserted)
    return { data, error: data ? null : { message: 'not found' } }
  }
  return node
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: state.authUser } }),
    },
    from: () => chain('unused'),
  }),
}))

vi.mock('@/lib/supabase/admin', () => ({
  adminClient: {
    from: (table: string) => chain(table),
  },
}))

vi.mock('@/lib/auth/resolveCurrentUser', () => ({
  resolveCurrentUser: async () => state.profile,
}))

import { POST } from '@/app/api/conversations/route'

function post(body: unknown) {
  return POST(new Request('http://localhost/api/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }))
}

describe('POST /api/conversations does not read another pair', () => {
  beforeEach(() => {
    state.profile = { id: SENDER, tier: 'pro', tier_status: 'active' }
    state.authUser = { id: 'auth-sender', email: 'sender@example.com' }
    state.ors = []
    state.eqs = []
    state.inserts = []
    state.users = [
      { id: SENDER, email: 'sender@example.com' },
      { id: OTHER, email: 'other@example.com' },
      { id: VICTIM_A, email: 'a@example.com' },
      { id: VICTIM_B, email: 'b@example.com' },
    ]
    state.conversations = [{
      id: VICTIM_CONV,
      participant_one_id: VICTIM_A,
      participant_two_id: VICTIM_B,
      last_message_at: '2026-10-27T00:00:00.000Z',
      created_at: '2026-10-27T00:00:00.000Z',
    }]
  })

  it('rejects a filter-breakout recipient before any conversation query', async () => {
    const payload = `${OTHER}),id.eq.${VICTIM_CONV},participant_one_id.eq.${OTHER}`
    const res = await post({ recipientId: payload })
    const body = await res.json()

    expect(res.status).toBe(422)
    expect(body).toEqual({ error: 'recipientId must be a member id' })
    expect(state.ors).toEqual([])
    expect(state.inserts).toEqual([])
    expect(state.eqs.filter(eq => eq.table === 'conversations')).toEqual([])
    expect(JSON.stringify(body)).not.toContain(VICTIM_CONV)
    expect(JSON.stringify(body)).not.toContain(VICTIM_A)
  })

  it('returns 404 for a well-formed id that is not a member, and not the other thread', async () => {
    const missing = 'ffffffff-ffff-4fff-8fff-ffffffffffff'
    const res = await post({ recipientId: missing })
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body).toEqual({ error: 'Member not found' })
    expect(state.ors).toEqual([])
    expect(state.inserts).toEqual([])
    expect(JSON.stringify(body)).not.toContain(VICTIM_CONV)
  })

  it('opens a thread only with the resolved member', async () => {
    const res = await post({ recipientId: OTHER })
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.participant_one_id).toBe(SENDER)
    expect(body.participant_two_id).toBe(OTHER)
    expect(body.id).not.toBe(VICTIM_CONV)
    expect(state.ors).toEqual([])
    expect(state.inserts).toEqual([
      { participant_one_id: SENDER, participant_two_id: OTHER },
    ])
  })

  it('returns the existing pair instead of someone else\'s when the two already have a thread', async () => {
    state.conversations.push({
      id: '99999999-9999-4999-8999-999999999999',
      participant_one_id: OTHER,
      participant_two_id: SENDER,
      last_message_at: null,
      created_at: '2026-10-01T00:00:00.000Z',
    })

    const res = await post({ recipientId: OTHER })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.id).toBe('99999999-9999-4999-8999-999999999999')
    expect(body.participant_one_id).toBe(OTHER)
    expect(body.participant_two_id).toBe(SENDER)
    expect(state.inserts).toEqual([])
  })

  it('refuses a community member before looking anyone up', async () => {
    state.profile = { id: SENDER, tier: 'community', tier_status: 'active' }
    const res = await post({ recipientId: OTHER })

    expect(res.status).toBe(403)
    expect(state.eqs).toEqual([])
    expect(state.inserts).toEqual([])
  })
})
