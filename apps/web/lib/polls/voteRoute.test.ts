/**
 * POST /api/polls/vote must only record a vote for the session user, on an
 * option that belongs to that open poll. The write is increment_poll_vote(),
 * which takes the user from auth.uid(), not from the body.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pollIsOpen } from './vote'

const SESSION_USER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const OTHER_USER = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const POLL_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const OTHER_POLL_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
const OPTION_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
const OTHER_OPTION_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff'
const NOW = Date.parse('2026-11-12T15:00:00.000Z')

type PollRow = { id: string; status: string | null; closes_at: string | null }
type OptionRow = { id: string; poll_id: string | null }
type VoteRow = { poll_id: string; option_id: string; user_id: string }

const state = vi.hoisted(() => ({
  profile: null as { id: string } | null,
  poll: null as PollRow | null,
  option: null as OptionRow | null,
  votes: [] as VoteRow[],
  filters: [] as Array<{ table: string; column: string; value: unknown }>,
  rpc: [] as Array<{ name: string; args: Record<string, unknown> }>,
}))

function builder(table: string) {
  const filters: Array<{ column: string; value: unknown }> = []
  const api: Record<string, unknown> = {}
  const chain = () => api
  api.select = chain
  api.eq = (column: string, value: unknown) => {
    filters.push({ column, value })
    state.filters.push({ table, column, value })
    return api
  }
  api.maybeSingle = async () => {
    if (table === 'polls') return { data: state.poll, error: null }
    if (table === 'poll_options') return { data: state.option, error: null }
    if (table === 'poll_votes') {
      const pollId = filters.find(filter => filter.column === 'poll_id')?.value
      const userId = filters.find(filter => filter.column === 'user_id')?.value
      const row = state.votes.find(vote => vote.poll_id === pollId && vote.user_id === userId)
      return { data: row ? { option_id: row.option_id } : null, error: null }
    }
    return { data: null, error: null }
  }
  return api
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    from: (table: string) => builder(table),
    rpc: async (name: string, args: Record<string, unknown>) => {
      state.rpc.push({ name, args })
      return { error: null }
    },
  }),
}))

vi.mock('@/lib/auth/resolveCurrentUser', () => ({
  resolveCurrentUser: async () => state.profile,
}))

import { POST } from '@/app/api/polls/vote/route'

const here = dirname(fileURLToPath(import.meta.url))
const routeSource = readFileSync(resolve(here, '../../app/api/polls/vote/route.ts'), 'utf8')

function openPoll(over: Partial<PollRow> = {}): PollRow {
  return { id: POLL_ID, status: 'active', closes_at: null, ...over }
}

function call(body: Record<string, unknown>) {
  return POST(new Request('http://localhost/api/polls/vote', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }))
}

describe('pollIsOpen', () => {
  it('stays open with a null close time and rejects anything that is not active or still in the future', () => {
    expect(pollIsOpen(null, NOW)).toBe(false)
    expect(pollIsOpen({ status: null, closes_at: null }, NOW)).toBe(false)
    expect(pollIsOpen({ status: 'closed', closes_at: null }, NOW)).toBe(false)
    expect(pollIsOpen({ status: 'active', closes_at: null }, NOW)).toBe(true)
    expect(pollIsOpen({ status: 'active', closes_at: '2026-11-12T14:59:59.000Z' }, NOW)).toBe(false)
    expect(pollIsOpen({ status: 'active', closes_at: '2026-11-12T15:00:00.000Z' }, NOW)).toBe(false)
    expect(pollIsOpen({ status: 'active', closes_at: '2026-11-12T15:00:01.000Z' }, NOW)).toBe(true)
    expect(pollIsOpen({ status: 'active', closes_at: 'not-a-date' }, NOW)).toBe(false)
  })
})

describe('POST /api/polls/vote', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    state.profile = { id: SESSION_USER }
    state.poll = openPoll()
    state.option = { id: OPTION_ID, poll_id: POLL_ID }
    state.votes = []
    state.filters = []
    state.rpc = []
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('records a first vote for the open poll and leaves a same-option resubmit unchanged', async () => {
    const first = await call({ poll_id: POLL_ID, option_id: OPTION_ID })
    expect(first.status).toBe(200)
    expect(await first.json()).toEqual({ ok: true, optionId: OPTION_ID, status: 'voted' })
    expect(state.rpc).toEqual([{ name: 'increment_poll_vote', args: { p_option_id: OPTION_ID } }])

    state.rpc = []
    state.filters = []
    state.votes = [{ poll_id: POLL_ID, option_id: OPTION_ID, user_id: SESSION_USER }]
    const again = await call({ poll_id: POLL_ID, option_id: OPTION_ID })
    expect(again.status).toBe(200)
    expect(await again.json()).toEqual({ ok: true, optionId: OPTION_ID, status: 'unchanged' })
    expect(state.rpc).toEqual([])
  })

  it('changes an existing vote to another option of the same poll', async () => {
    state.votes = [{ poll_id: POLL_ID, option_id: OTHER_OPTION_ID, user_id: SESSION_USER }]
    const res = await call({ poll_id: POLL_ID, option_id: OPTION_ID })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true, optionId: OPTION_ID, status: 'changed' })
    expect(state.rpc).toEqual([{ name: 'increment_poll_vote', args: { p_option_id: OPTION_ID } }])
  })

  it('rejects an option that belongs to a different poll', async () => {
    state.option = { id: OPTION_ID, poll_id: OTHER_POLL_ID }
    const res = await call({ poll_id: POLL_ID, option_id: OPTION_ID })
    expect(res.status).toBe(422)
    expect(await res.json()).toEqual({ error: 'option_id does not belong to this poll' })
    expect(state.rpc).toEqual([])
  })

  it('rejects a missing option', async () => {
    state.option = null
    const res = await call({ poll_id: POLL_ID, option_id: OPTION_ID })
    expect(res.status).toBe(422)
    expect(state.rpc).toEqual([])
  })

  it('rejects a closed poll, including a repeat of the caller’s existing vote', async () => {
    state.poll = openPoll({ status: 'closed' })
    state.votes = [{ poll_id: POLL_ID, option_id: OPTION_ID, user_id: SESSION_USER }]
    const res = await call({ poll_id: POLL_ID, option_id: OPTION_ID })
    expect(res.status).toBe(422)
    expect(await res.json()).toEqual({ error: 'Poll is closed' })
    expect(state.rpc).toEqual([])
  })

  it('rejects an expired poll and a poll whose close time is exactly now', async () => {
    state.poll = openPoll({ closes_at: '2026-11-12T14:00:00.000Z' })
    const expired = await call({ poll_id: POLL_ID, option_id: OPTION_ID })
    expect(expired.status).toBe(422)
    expect(await expired.json()).toEqual({ error: 'Poll is closed' })

    state.poll = openPoll({ closes_at: '2026-11-12T15:00:00.000Z' })
    const due = await call({ poll_id: POLL_ID, option_id: OPTION_ID })
    expect(due.status).toBe(422)
    expect(state.rpc).toEqual([])
  })

  it('accepts a poll that closes in the future', async () => {
    state.poll = openPoll({ closes_at: '2026-11-12T15:00:01.000Z' })
    const res = await call({ poll_id: POLL_ID, option_id: OPTION_ID })
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ status: 'voted' })
    expect(state.rpc).toHaveLength(1)
  })

  it('takes the voter from the session and ignores a user_id on the body', async () => {
    const res = await call({
      poll_id: POLL_ID,
      option_id: OPTION_ID,
      user_id: OTHER_USER,
    })
    expect(res.status).toBe(200)
    const voteFilters = state.filters.filter(filter => filter.table === 'poll_votes')
    expect(voteFilters).toContainEqual({ table: 'poll_votes', column: 'user_id', value: SESSION_USER })
    expect(voteFilters).toContainEqual({ table: 'poll_votes', column: 'poll_id', value: POLL_ID })
    expect(JSON.stringify(state.filters)).not.toContain(OTHER_USER)
    expect(state.rpc).toEqual([{ name: 'increment_poll_vote', args: { p_option_id: OPTION_ID } }])
    expect(JSON.stringify(state.rpc)).not.toContain(OTHER_USER)
    expect(routeSource).not.toMatch(/body\.user_id/)
    expect(routeSource).toContain('const userId = profile.id')
    expect(routeSource).not.toMatch(/\.insert\(/)
  })

  it('refuses a caller with no session', async () => {
    state.profile = null
    const res = await call({ poll_id: POLL_ID, option_id: OPTION_ID, user_id: OTHER_USER })
    expect(res.status).toBe(401)
    expect(state.rpc).toEqual([])
    expect(state.filters).toEqual([])
  })
})
