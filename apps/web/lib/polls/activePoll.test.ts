/**
 * GET /api/polls/active is the public read. Logged-out visitors still receive
 * the poll, its options, and the vote counts. Counts are read with the
 * service role inside this route. "Your vote" uses the session auth id,
 * the same id increment_poll_vote() writes.
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it, vi } from 'vitest'

const POLL_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const OPTION_A = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
const OPTION_B = 'ffffffff-ffff-4fff-8fff-ffffffffffff'
const AUTH_USER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const PROFILE_USER = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const OTHER_VOTER = '11111111-1111-4111-8111-111111111111'

const poll = {
  id: POLL_ID,
  question: 'Which pillar is next?',
  status: 'active',
  closes_at: null,
  poll_options: [
    { id: OPTION_A, option_text: 'Foundation', display_order: 0 },
    { id: OPTION_B, option_text: 'Identity', display_order: 1 },
  ],
}

type VoteRow = { poll_id: string; option_id: string; user_id: string }

const state = vi.hoisted(() => ({
  authUser: null as { id: string } | null,
  profileId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  votes: [] as VoteRow[],
  voteFilters: [] as Array<{ column: string; value: unknown; single: boolean }>,
}))

function countVotes(): VoteRow[] {
  return [
    { poll_id: POLL_ID, option_id: OPTION_A, user_id: '11111111-1111-4111-8111-111111111111' },
    { poll_id: POLL_ID, option_id: OPTION_A, user_id: '22222222-2222-4222-8222-222222222222' },
    { poll_id: POLL_ID, option_id: OPTION_B, user_id: '33333333-3333-4333-8333-333333333333' },
  ]
}

function matchingVotes(filters: Array<{ column: string; value: unknown }>): VoteRow[] {
  return state.votes.filter(vote => filters.every(filter => {
    if (filter.column === 'poll_id') return vote.poll_id === filter.value
    if (filter.column === 'user_id') return vote.user_id === filter.value
    if (filter.column === 'option_id') return vote.option_id === filter.value
    return true
  }))
}

function voteChain() {
  const filters: Array<{ column: string; value: unknown }> = []
  const api: Record<string, unknown> = {}
  const self = () => api
  api.select = self
  api.eq = (column: string, value: unknown) => {
    filters.push({ column, value })
    return api
  }
  api.maybeSingle = async () => {
    for (const filter of filters) state.voteFilters.push({ ...filter, single: true })
    const row = matchingVotes(filters)[0]
    return { data: row ? { option_id: row.option_id } : null, error: null }
  }
  api.then = (
    onFulfilled: (value: { data: { option_id: string }[]; error: null }) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => {
    for (const filter of filters) state.voteFilters.push({ ...filter, single: false })
    const result = {
      data: matchingVotes(filters).map(vote => ({ option_id: vote.option_id })),
      error: null,
    }
    return Promise.resolve(result).then(onFulfilled, onRejected)
  }
  return api
}

function chain(result: { data: unknown; error: null }) {
  const api: Record<string, unknown> = {}
  const self = () => api
  api.select = self
  api.eq = self
  api.or = self
  api.order = self
  api.limit = self
  api.maybeSingle = async () => result
  api.then = (
    onFulfilled: (value: typeof result) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise.resolve(result).then(onFulfilled, onRejected)
  return api
}

vi.mock('@/lib/supabase/admin', () => ({
  adminClient: {
    from: (table: string) => {
      if (table === 'polls') return chain({ data: poll, error: null })
      if (table === 'poll_votes') return voteChain()
      return chain({ data: null, error: null })
    },
  },
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: state.authUser }, error: null }),
    },
  }),
}))

vi.mock('@/lib/auth/resolveCurrentUser', () => ({
  resolveCurrentUser: async () => {
    if (!state.authUser) throw new Error('public read must not resolve a session user')
    return { id: state.profileId }
  },
}))

import { GET } from '@/app/api/polls/active/route'

const here = dirname(fileURLToPath(import.meta.url))
const routeSource = readFileSync(resolve(here, '../../app/api/polls/active/route.ts'), 'utf8')

describe('GET /api/polls/active', () => {
  it('returns the poll, its options, and vote counts with no session', async () => {
    state.authUser = null
    state.votes = countVotes()
    state.voteFilters = []

    const res = await GET(new Request('http://localhost/api/polls/active?context=media'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      poll,
      voteCounts: { [OPTION_A]: 2, [OPTION_B]: 1 },
      totalVotes: 3,
      userVoteOptionId: null,
    })
    expect(state.voteFilters.some(filter => filter.single)).toBe(false)
  })

  it('reads your vote with the auth user id, and still counts every row', async () => {
    state.authUser = { id: AUTH_USER }
    state.profileId = PROFILE_USER
    state.votes = [
      { poll_id: POLL_ID, option_id: OPTION_A, user_id: AUTH_USER },
      { poll_id: POLL_ID, option_id: OPTION_A, user_id: OTHER_VOTER },
      { poll_id: POLL_ID, option_id: OPTION_B, user_id: PROFILE_USER },
    ]
    state.voteFilters = []

    const res = await GET(new Request('http://localhost/api/polls/active?context=media'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      poll,
      voteCounts: { [OPTION_A]: 2, [OPTION_B]: 1 },
      totalVotes: 3,
      userVoteOptionId: OPTION_A,
    })

    const ownUser = state.voteFilters.filter(filter => filter.single && filter.column === 'user_id')
    expect(ownUser).toEqual([{ column: 'user_id', value: AUTH_USER, single: true }])
    expect(state.voteFilters.filter(filter => filter.single === false).some(filter => filter.column === 'user_id')).toBe(false)

    expect(routeSource).toContain('supabase.auth.getUser()')
    expect(routeSource).toContain(".eq('user_id', user.id)")
    expect(routeSource).not.toContain('profile.id')
    expect(routeSource).not.toContain('resolveCurrentUser')
    expect(routeSource).toContain('adminClient')
  })
})
