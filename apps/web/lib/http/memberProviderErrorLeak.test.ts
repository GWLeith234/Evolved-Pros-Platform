/**
 * Accountability, discussion, and pillar-audit still returned PostgREST
 * `error.message` after the academy sweep. These calls assert status 500,
 * a stable `{ error }` string, and a server log that keeps the constraint
 * name while redacting the email and phone.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const LEAK = {
  code: '23505',
  message: 'duplicate key value violates unique constraint "users_email_key"',
  details: 'Key (email)=(secret@example.com) already exists. Caller 555-010-0199.',
  hint: 'See public.users',
}

type Row = { data: unknown; error: typeof LEAK | null }

const state = vi.hoisted(() => ({
  user: null as { id: string; email?: string } | null,
  profile: null as { id: string; display_name?: string | null; avatar_url?: string | null } | null,
  queues: {} as Record<string, Row[]>,
}))

function queryResult(value: { data: unknown; error: unknown }) {
  const node: Record<string, unknown> = {
    then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(value).then(resolve, reject),
    single: () => Promise.resolve(value),
    maybeSingle: () => Promise.resolve(value),
  }
  for (const method of [
    'select', 'eq', 'neq', 'ilike', 'order', 'limit', 'in', 'or', 'update', 'insert',
  ]) {
    node[method] = () => node
  }
  return node
}

function fromTable(table: string) {
  const queue = state.queues[table]
  const next = queue && queue.length > 0 ? queue.shift()! : { data: null, error: null }
  return queryResult(next)
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: state.user } }),
    },
    from: (table: string) => fromTable(table),
  }),
}))

vi.mock('@/lib/supabase/admin', () => ({
  adminClient: {
    from: (table: string) => fromTable(table),
  },
}))

vi.mock('@/lib/auth/resolveCurrentUser', () => ({
  resolveCurrentUser: async () => state.profile,
}))

vi.mock('@/lib/notifications/create', () => ({
  createNotification: async () => undefined,
}))

import { POST as postInvite } from '@/app/api/accountability/invite/route'
import { PATCH as patchPair } from '@/app/api/accountability/[pairId]/route'
import { PATCH as acceptPair } from '@/app/api/accountability/[pairId]/accept/route'
import { GET as getStatus } from '@/app/api/accountability/status/route'
import { GET as getDiscussion, POST as postDiscussion } from '@/app/api/discussion/route'
import { POST as postAudit } from '@/app/api/pillar-audit/route'

const SECRET = 'secret@example.com'
const PHONE = '555-010-0199'

function jsonRequest(url: string, method: string, body?: unknown): Request {
  return new Request(url, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

async function jsonBody(res: Response): Promise<Record<string, unknown>> {
  return (await res.json()) as Record<string, unknown>
}

function queue(table: string, ...rows: Row[]) {
  state.queues[table] = rows.slice()
}

describe('member routes hide leftover provider error text', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    state.user = { id: 'auth-1', email: 'member@example.com' }
    state.profile = { id: 'user-1', display_name: 'Member', avatar_url: null }
    state.queues = {}
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    errorSpy.mockRestore()
  })

  function logged(): string {
    return errorSpy.mock.calls.map(call => JSON.stringify(call)).join('\n')
  }

  function assertHidden(body: Record<string, unknown>) {
    const serialized = JSON.stringify(body)
    const log = logged()
    expect(serialized).not.toContain(SECRET)
    expect(serialized).not.toContain(PHONE)
    expect(serialized).not.toContain('users_email_key')
    expect(serialized).not.toContain('23505')
    expect(serialized).not.toContain('public.users')
    expect(log).not.toContain(SECRET)
    expect(log).not.toContain(PHONE)
    expect(log).toContain('[redacted-email]')
    expect(log).toContain('[redacted-phone]')
    expect(log).toContain('users_email_key')
    expect(log).toContain('23505')
  }

  it('POST /api/accountability/invite hides a lookup error', async () => {
    queue('users', { data: null, error: LEAK })
    const res = await postInvite(jsonRequest('http://localhost/api/accountability/invite', 'POST', {
      partner_email: 'pat@example.com',
      course_id: 'course-1',
    }))
    const body = await jsonBody(res)
    expect(res.status).toBe(500)
    expect(body).toEqual({ error: 'Could not look up that member.' })
    assertHidden(body)
  })

  it('POST /api/accountability/invite hides an insert error', async () => {
    queue('users', {
      data: { id: 'auth-2', display_name: 'Pat', full_name: 'Pat Example', email: 'pat@example.com' },
      error: null,
    })
    queue(
      'accountability_pairs',
      { data: null, error: null },
      { data: null, error: LEAK },
    )
    const res = await postInvite(jsonRequest('http://localhost/api/accountability/invite', 'POST', {
      partner_email: 'pat@example.com',
      course_id: 'course-1',
    }))
    const body = await jsonBody(res)
    expect(res.status).toBe(500)
    expect(body).toEqual({ error: 'Failed to create invite' })
    assertHidden(body)
  })

  it('PATCH /api/accountability/[pairId] hides an update error', async () => {
    queue(
      'accountability_pairs',
      { data: { id: 'pair-1', user_id: 'auth-1', partner_id: 'auth-2', status: 'pending' }, error: null },
      { data: null, error: LEAK },
    )
    const res = await patchPair(
      new Request('http://localhost/api/accountability/pair-1', { method: 'PATCH' }),
      { params: { pairId: 'pair-1' } },
    )
    const body = await jsonBody(res)
    expect(res.status).toBe(500)
    expect(body).toEqual({ error: 'Failed to update' })
    assertHidden(body)
  })

  it('PATCH /api/accountability/[pairId]/accept hides an update error', async () => {
    queue(
      'accountability_pairs',
      { data: { id: 'pair-1', user_id: 'auth-2', partner_id: 'auth-1', status: 'pending' }, error: null },
      { data: null, error: LEAK },
    )
    const res = await acceptPair(
      new Request('http://localhost/api/accountability/pair-1/accept', { method: 'PATCH' }),
      { params: { pairId: 'pair-1' } },
    )
    const body = await jsonBody(res)
    expect(res.status).toBe(500)
    expect(body).toEqual({ error: 'Failed to accept' })
    assertHidden(body)
  })

  it('GET /api/accountability/status hides a list error', async () => {
    queue('accountability_pairs', { data: null, error: LEAK })
    const res = await getStatus(new Request('http://localhost/api/accountability/status'))
    const body = await jsonBody(res)
    expect(res.status).toBe(500)
    expect(body).toEqual({ error: 'Could not load your partner.' })
    assertHidden(body)
  })

  it('GET /api/discussion hides a list error', async () => {
    queue('discussion_posts', { data: null, error: LEAK })
    const res = await getDiscussion(new Request('http://localhost/api/discussion?course_id=course-1'))
    const body = await jsonBody(res)
    expect(res.status).toBe(500)
    expect(body).toEqual({ error: 'Could not load discussion posts.' })
    assertHidden(body)
  })

  it('POST /api/discussion hides an insert error', async () => {
    queue('discussion_posts', { data: null, error: LEAK })
    const res = await postDiscussion(jsonRequest('http://localhost/api/discussion', 'POST', {
      course_id: 'course-1',
      body: 'A note for the room.',
    }))
    const body = await jsonBody(res)
    expect(res.status).toBe(500)
    expect(body).toEqual({ error: 'Failed to post' })
    assertHidden(body)
  })

  it('POST /api/pillar-audit hides an insert error', async () => {
    queue('pillar_audits', { data: null, error: LEAK })
    const res = await postAudit(jsonRequest('http://localhost/api/pillar-audit', 'POST', {
      course_id: 'course-1',
      scores: { foundation: 3 },
      total_score: 3,
    }))
    const body = await jsonBody(res)
    expect(res.status).toBe(500)
    expect(body).toEqual({ error: 'Failed to save audit' })
    assertHidden(body)
  })

  it('GET /api/accountability/status still returns no-partner when the query succeeds', async () => {
    queue('accountability_pairs', { data: null, error: null })
    const res = await getStatus(new Request('http://localhost/api/accountability/status'))
    expect(res.status).toBe(200)
    expect(await jsonBody(res)).toEqual({
      state: 'no-partner',
      pair: null,
      partner: null,
      myCheckins: [],
      partnerCheckins: [],
    })
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('POST /api/accountability/invite keeps validation errors and does not log a provider failure', async () => {
    const res = await postInvite(jsonRequest('http://localhost/api/accountability/invite', 'POST', {}))
    const body = await jsonBody(res)
    expect(res.status).toBe(422)
    expect(body).toEqual({ error: 'partner_email is required' })
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('POST /api/accountability/invite stays 401 without a session', async () => {
    state.user = null
    const res = await postInvite(jsonRequest('http://localhost/api/accountability/invite', 'POST', {
      partner_email: 'pat@example.com',
      course_id: 'course-1',
    }))
    expect(res.status).toBe(401)
    expect(await jsonBody(res)).toEqual({ error: 'Unauthorized' })
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('route sources no longer return a provider message', () => {
    const files = [
      'app/api/accountability/invite/route.ts',
      'app/api/accountability/[pairId]/route.ts',
      'app/api/accountability/[pairId]/accept/route.ts',
      'app/api/accountability/status/route.ts',
      'app/api/discussion/route.ts',
      'app/api/pillar-audit/route.ts',
    ]
    for (const file of files) {
      const source = readFileSync(resolve(__dirname, '../..', file), 'utf8')
      expect(source, file).not.toMatch(/error:\s*[A-Za-z0-9_?]+\.message/)
      expect(source, file).not.toMatch(/\$\{[^}]*\.message\}/)
    }
  })
})
