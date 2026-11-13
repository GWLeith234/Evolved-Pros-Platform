/**
 * POST /api/posts writes polls through the service-role client, which skips
 * the admin RLS on polls. These calls prove a member cannot publish a poll,
 * an admin poll is stored as community with only the allowlisted columns, and
 * a pollId is accepted only when this caller owns that community poll.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST_POLL_INSERT_KEYS, POST_POLL_OPTION_KEYS } from './postPoll'

const MEMBER = '11111111-1111-4111-8111-111111111111'
const ADMIN = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const OTHER = '22222222-2222-4222-8222-222222222222'
const OWN_POLL = '33333333-3333-4333-8333-333333333333'
const NEW_POLL = '44444444-4444-4444-8444-444444444444'
const CHANNEL = '55555555-5555-4555-8555-555555555555'

type PollRow = { id: string; created_by: string | null; context: string | null }

const state = vi.hoisted(() => ({
  profile: null as { id: string; role: string } | null,
  polls: [] as PollRow[],
  inserts: [] as Array<{ table: string; row: unknown }>,
  rpcCalls: 0,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({}),
}))

vi.mock('@/lib/auth/resolveCurrentUser', () => ({
  resolveCurrentUser: async () => state.profile,
}))

function builder(table: string) {
  let lookedUpId: string | null = null
  const api: Record<string, unknown> = {}
  api.insert = (row: unknown) => {
    state.inserts.push({ table, row })
    return api
  }
  api.select = () => api
  api.eq = (_column: string, value: string) => {
    lookedUpId = value
    return api
  }
  api.maybeSingle = async () => ({
    data: state.polls.find(poll => poll.id === lookedUpId) ?? null,
    error: null,
  })
  api.single = async () => {
    if (table === 'polls') return { data: { id: NEW_POLL }, error: null }
    const row = state.inserts.find(entry => entry.table === 'posts')?.row as Record<string, unknown> | undefined
    return {
      data: {
        id: 'post-1',
        channel_id: row?.channel_id ?? CHANNEL,
        body: row?.body ?? '',
        pillar_tag: row?.pillar_tag ?? null,
        post_type: row?.post_type ?? 'update',
        is_pinned: false,
        like_count: 0,
        reply_count: 0,
        created_at: '2026-11-12T00:00:00.000Z',
        users: {
          id: state.profile?.id ?? '',
          display_name: 'Member',
          full_name: null,
          avatar_url: null,
          tier: null,
        },
      },
      error: null,
    }
  }
  api.then = (
    onFulfilled: (value: { data: null; error: null }) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise.resolve({ data: null, error: null }).then(onFulfilled, onRejected)
  return api
}

vi.mock('@/lib/supabase/admin', () => ({
  adminClient: {
    from: (table: string) => builder(table),
    rpc: async () => {
      state.rpcCalls += 1
      return { error: null }
    },
  },
}))

import { POST } from '@/app/api/posts/route'

function call(body: Record<string, unknown>) {
  return POST(new Request('http://localhost/api/posts', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }))
}

describe('POST /api/posts poll creation', () => {
  beforeEach(() => {
    state.profile = null
    state.polls = []
    state.inserts = []
    state.rpcCalls = 0
  })

  it('refuses a non-admin poll and writes nothing', async () => {
    state.profile = { id: MEMBER, role: 'member' }

    const res = await call({
      channelId: CHANNEL,
      body: 'Which session should we run next?',
      kind: 'poll',
      pollOptions: ['Morning', 'Evening'],
      context: 'media',
      status: 'active',
      created_by: OTHER,
      show_results_before_vote: true,
    })

    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'Forbidden' })
    expect(state.inserts).toEqual([])
    expect(state.rpcCalls).toBe(0)
  })

  it('stores an admin poll as community and copies only the allowlisted fields', async () => {
    state.profile = { id: ADMIN, role: 'admin' }

    const res = await call({
      channelId: CHANNEL,
      body: 'Which session should we run next?',
      kind: 'poll',
      pollOptions: ['Morning', 'Evening'],
      context: 'media',
      status: 'closed',
      created_by: OTHER,
      show_results_before_vote: true,
      closes_at: '1999-01-01T00:00:00.000Z',
      id: OTHER,
    })

    expect(res.status).toBe(201)
    const poll = state.inserts.find(entry => entry.table === 'polls')?.row
    expect(poll).toEqual({
      question: 'Which session should we run next?',
      context: 'community',
      created_by: ADMIN,
      status: 'active',
    })
    expect(Object.keys(poll as object)).toEqual([...POST_POLL_INSERT_KEYS])

    const options = state.inserts.find(entry => entry.table === 'poll_options')?.row
    expect(options).toEqual([
      { poll_id: NEW_POLL, option_text: 'Morning', display_order: 0 },
      { poll_id: NEW_POLL, option_text: 'Evening', display_order: 1 },
    ])
    expect(Object.keys((options as Array<Record<string, unknown>>)[0])).toEqual([...POST_POLL_OPTION_KEYS])

    const post = state.inserts.find(entry => entry.table === 'posts')?.row as { poll_id?: string; post_type?: string; kind?: string }
    expect(post.poll_id).toBe(NEW_POLL)
    expect(post.kind).toBe('poll')
    expect(post.post_type).toBe('poll')
  })
})

describe('POST /api/posts pollId', () => {
  beforeEach(() => {
    state.profile = { id: MEMBER, role: 'member' }
    state.polls = []
    state.inserts = []
    state.rpcCalls = 0
  })

  it('rejects another user\'s pollId', async () => {
    state.polls = [{ id: OWN_POLL, created_by: OTHER, context: 'community' }]

    const res = await call({
      channelId: CHANNEL,
      body: 'Attaching someone else\'s poll.',
      kind: 'update',
      pollId: OWN_POLL,
    })

    expect(res.status).toBe(422)
    expect(await res.json()).toEqual({ error: 'Invalid poll' })
    expect(state.inserts).toEqual([])
  })

  it('rejects a media-context pollId even when the caller created it', async () => {
    state.polls = [{ id: OWN_POLL, created_by: MEMBER, context: 'media' }]

    const res = await call({
      channelId: CHANNEL,
      body: 'Attaching the public media poll.',
      kind: 'update',
      pollId: OWN_POLL,
    })

    expect(res.status).toBe(422)
    expect(await res.json()).toEqual({ error: 'Invalid poll' })
    expect(state.inserts).toEqual([])
  })

  it('accepts the caller\'s own community pollId', async () => {
    state.polls = [{ id: OWN_POLL, created_by: MEMBER, context: 'community' }]

    const res = await call({
      channelId: CHANNEL,
      body: 'Attaching my community poll.',
      kind: 'update',
      pollId: OWN_POLL,
    })

    expect(res.status).toBe(201)
    const post = state.inserts.find(entry => entry.table === 'posts')?.row as { poll_id?: string }
    expect(post.poll_id).toBe(OWN_POLL)
    expect(state.inserts.some(entry => entry.table === 'polls')).toBe(false)
  })
})

describe('POST /api/posts member update', () => {
  beforeEach(() => {
    state.profile = { id: MEMBER, role: 'member' }
    state.polls = []
    state.inserts = []
    state.rpcCalls = 0
  })

  it('stores a normal update with a non-poll post_type', async () => {
    const res = await call({
      channelId: CHANNEL,
      body: 'Sharing a normal update with the community.',
      postType: 'update',
    })

    expect(res.status).toBe(201)
    const post = state.inserts.find(entry => entry.table === 'posts')?.row as {
      post_type?: string
      kind?: string
      author_id?: string
      poll_id?: string
    }
    expect(post).toMatchObject({
      author_id: MEMBER,
      post_type: 'update',
      kind: 'update',
    })
    expect(post.poll_id).toBeUndefined()
    expect(state.inserts.map(entry => entry.table)).toEqual(['posts'])
    expect(await res.json()).toMatchObject({ postType: 'update' })
  })

  it('keeps an update that also sends postType poll stored as update', async () => {
    const res = await call({
      channelId: CHANNEL,
      body: 'This update is not a poll.',
      kind: 'update',
      postType: 'poll',
    })

    expect(res.status).toBe(201)
    const post = state.inserts.find(entry => entry.table === 'posts')?.row as { post_type?: string; kind?: string }
    expect(post).toMatchObject({ post_type: 'update', kind: 'update' })
    expect(state.inserts.some(entry => entry.table === 'polls')).toBe(false)
    expect(await res.json()).toMatchObject({ postType: 'update' })
  })
})
