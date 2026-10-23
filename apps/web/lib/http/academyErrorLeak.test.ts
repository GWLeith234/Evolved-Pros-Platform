/**
 * Academy practice routes used to return PostgREST `error.message` and log
 * the raw error object (details can include the failing row). These calls
 * assert status 500, a stable `{ error }` string, and a server log that
 * keeps the constraint name while redacting the email and phone.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const LEAK = {
  code: '23505',
  message: 'duplicate key value violates unique constraint "users_email_key"',
  details: 'Key (email)=(secret@example.com) already exists. Caller 555-010-0199.',
  hint: 'See public.users',
}

const state = vi.hoisted(() => ({
  profile: null as { id: string } | null,
  authUser: null as { id: string; email: string } | null,
  result: { data: null as unknown, error: null as typeof LEAK | null },
  tables: {} as Record<string, { data: unknown; error: typeof LEAK | null }>,
}))

function queryResult(value: { data: unknown; error: unknown }) {
  const node: Record<string, unknown> = {
    then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(value).then(resolve, reject),
    single: () => Promise.resolve(value),
    maybeSingle: () => Promise.resolve(value),
  }
  for (const method of [
    'select', 'eq', 'neq', 'order', 'limit', 'in', 'or', 'update', 'upsert', 'insert', 'delete', 'match',
  ]) {
    node[method] = () => node
  }
  return node
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: state.authUser } }),
    },
    from: (table: string) => queryResult(state.tables[table] ?? state.result),
  }),
}))

vi.mock('@/lib/supabase/admin', () => ({
  adminClient: {
    from: (table: string) => queryResult(state.tables[table] ?? state.result),
  },
}))

vi.mock('@/lib/auth/resolveCurrentUser', () => ({
  resolveCurrentUser: async () => state.profile,
}))

import { GET as getLedger, POST as postLedger } from '@/app/api/ledger/route'
import { DELETE as deleteLedger } from '@/app/api/ledger/[id]/route'
import { GET as getReflections, POST as postReflection } from '@/app/api/reflections/route'
import { GET as getCommitments, POST as postCommitments } from '@/app/api/commitments/route'
import { PATCH as patchCommitment } from '@/app/api/commitments/[id]/route'
import { GET as getPlans, POST as postPlan } from '@/app/api/strategic-plans/route'
import { PATCH as patchPlan } from '@/app/api/strategic-plans/[id]/route'
import { GET as getCheckin, POST as postCheckin } from '@/app/api/checkin-results/route'
import { GET as getAssessment, POST as postAssessment } from '@/app/api/assessments/pioneer-driver/route'
import { GET as getCheckins, POST as postCheckinPair } from '@/app/api/partner-checkins/route'

const SECRET = 'secret@example.com'
const PHONE = '555-010-0199'

function jsonRequest(url: string, method: string, body: unknown): Request {
  return new Request(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function jsonBody(res: Response): Promise<Record<string, unknown>> {
  return (await res.json()) as Record<string, unknown>
}

function assertHidden(body: Record<string, unknown>, logged: string) {
  const serialized = JSON.stringify(body)
  expect(serialized).not.toContain(SECRET)
  expect(serialized).not.toContain(PHONE)
  expect(serialized).not.toContain('users_email_key')
  expect(serialized).not.toContain('23505')
  expect(serialized).not.toContain('public.users')
  expect(logged).not.toContain(SECRET)
  expect(logged).not.toContain(PHONE)
  expect(logged).toContain('[redacted-email]')
  expect(logged).toContain('[redacted-phone]')
  expect(logged).toContain('users_email_key')
  expect(logged).toContain('23505')
}

const cases: Array<{
  name: string
  message: string
  run: () => Promise<Response>
  prepare?: () => void
}> = [
  {
    name: 'GET /api/ledger',
    message: 'Could not load ledger entries.',
    run: () => getLedger(new Request('http://localhost/api/ledger')),
  },
  {
    name: 'POST /api/ledger',
    message: 'Failed to add entry',
    run: () => postLedger(jsonRequest('http://localhost/api/ledger', 'POST', {
      course_id: 'course-1',
      column_type: 'built',
      content: 'shipped the demo',
    })),
  },
  {
    name: 'DELETE /api/ledger/[id]',
    message: 'Could not delete that entry.',
    run: () => deleteLedger(
      new Request('http://localhost/api/ledger/entry-1', { method: 'DELETE' }),
      { params: { id: 'entry-1' } },
    ),
  },
  {
    name: 'GET /api/reflections',
    message: 'Could not load reflections.',
    run: () => getReflections(new Request('http://localhost/api/reflections')),
  },
  {
    name: 'POST /api/reflections',
    message: 'Failed to save reflection',
    run: () => postReflection(jsonRequest('http://localhost/api/reflections', 'POST', {
      course_id: 'course-1',
      body: 'A reflection long enough to save.',
    })),
  },
  {
    name: 'GET /api/commitments',
    message: 'Could not load commitments.',
    run: () => getCommitments(new Request('http://localhost/api/commitments')),
  },
  {
    name: 'POST /api/commitments',
    message: 'Failed to save commitments',
    run: () => postCommitments(jsonRequest('http://localhost/api/commitments', 'POST', {
      week_start: '2026-10-19',
      commitments: ['Call five prospects'],
    })),
  },
  {
    name: 'PATCH /api/commitments/[id]',
    message: 'Could not update that commitment.',
    run: () => patchCommitment(
      jsonRequest('http://localhost/api/commitments/c1', 'PATCH', { is_completed: true }),
      { params: { id: 'c1' } },
    ),
  },
  {
    name: 'GET /api/strategic-plans',
    message: 'Could not load plans.',
    run: () => getPlans(new Request('http://localhost/api/strategic-plans')),
  },
  {
    name: 'POST /api/strategic-plans',
    message: 'Failed to save plan',
    run: () => postPlan(jsonRequest('http://localhost/api/strategic-plans', 'POST', {
      course_id: 'course-1',
      domain: 'wig',
      content: { title: 'Close the quarter' },
    })),
  },
  {
    name: 'PATCH /api/strategic-plans/[id]',
    message: 'Not found or not authorised',
    run: () => patchPlan(
      jsonRequest('http://localhost/api/strategic-plans/plan-1', 'PATCH', { content: { title: 'Next' } }),
      { params: { id: 'plan-1' } },
    ),
  },
  {
    name: 'GET /api/checkin-results',
    message: 'Could not load your check-in.',
    run: () => getCheckin(new Request('http://localhost/api/checkin-results')),
  },
  {
    name: 'POST /api/checkin-results',
    message: 'Failed to save check-in result',
    run: () => postCheckin(jsonRequest('http://localhost/api/checkin-results', 'POST', {
      course_id: 'course-1',
      checkin_type: 'diagnostic',
      score: 3,
      max_score: 5,
      result_json: { ok: true },
    })),
  },
  {
    name: 'GET /api/assessments/pioneer-driver',
    message: 'Could not load your assessment.',
    run: () => getAssessment(),
  },
  {
    name: 'POST /api/assessments/pioneer-driver',
    message: 'Failed to save assessment',
    run: () => postAssessment(jsonRequest('http://localhost/api/assessments/pioneer-driver', 'POST', {
      type_result: 'PIONEER',
      scores_json: { pioneer: 4 },
    })),
  },
  {
    name: 'GET /api/partner-checkins',
    message: 'Could not load check-ins.',
    prepare: () => {
      state.tables.accountability_pairs = {
        data: { id: 'pair-1', user_id: 'user-1', partner_id: 'user-2' },
        error: null,
      }
    },
    run: () => getCheckins(new Request('http://localhost/api/partner-checkins?pair_id=pair-1')),
  },
  {
    name: 'POST /api/partner-checkins',
    message: 'Failed to save check-in',
    prepare: () => {
      state.tables.accountability_pairs = {
        data: { id: 'pair-1', user_id: 'user-1', partner_id: 'user-2' },
        error: null,
      }
    },
    run: () => postCheckinPair(jsonRequest('http://localhost/api/partner-checkins', 'POST', {
      pair_id: 'pair-1',
      commitment: 'Call five prospects',
      outcome: 'kept',
    })),
  },
]

describe('academy routes hide provider error text', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    state.profile = { id: 'user-1' }
    state.authUser = { id: 'auth-1', email: 'member@example.com' }
    state.result = { data: null, error: LEAK }
    state.tables = {}
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    errorSpy.mockRestore()
  })

  function logged(): string {
    return errorSpy.mock.calls.map(call => JSON.stringify(call)).join('\n')
  }

  for (const item of cases) {
    it(`${item.name} returns a stable 500 and redacts the log`, async () => {
      item.prepare?.()
      const res = await item.run()
      const body = await jsonBody(res)

      expect(res.status).toBe(500)
      expect(body).toEqual({ error: item.message })
      assertHidden(body, logged())
    })
  }

  it('GET /api/ledger still returns entries when the query succeeds', async () => {
    const entries = [{
      id: 'e1',
      column_type: 'built',
      content: 'shipped',
      created_at: '2026-10-23T00:00:00.000Z',
      course_id: 'course-1',
    }]
    state.result = { data: entries, error: null }

    const res = await getLedger(new Request('http://localhost/api/ledger'))

    expect(res.status).toBe(200)
    expect(await jsonBody(res)).toEqual({ entries })
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('POST /api/reflections still returns the saved row', async () => {
    const row = {
      id: 'r1',
      course_id: 'course-1',
      body: 'A reflection long enough to save.',
      created_at: '2026-10-23T00:00:00.000Z',
    }
    state.result = { data: row, error: null }

    const res = await postReflection(jsonRequest('http://localhost/api/reflections', 'POST', {
      course_id: 'course-1',
      body: row.body,
    }))

    expect(res.status).toBe(201)
    expect(await jsonBody(res)).toEqual(row)
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('POST /api/reflections keeps validation errors and does not log a provider failure', async () => {
    const res = await postReflection(jsonRequest('http://localhost/api/reflections', 'POST', {}))
    const body = await jsonBody(res)

    expect(res.status).toBe(422)
    expect(body).toEqual({ error: 'course_id is required' })
    expect(JSON.stringify(body)).not.toContain(SECRET)
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('GET /api/ledger stays 401 without a session and does not log provider text', async () => {
    state.profile = null
    const res = await getLedger(new Request('http://localhost/api/ledger'))
    const body = await jsonBody(res)

    expect(res.status).toBe(401)
    expect(body).toEqual({ error: 'Unauthorized' })
    expect(JSON.stringify(body)).not.toContain(SECRET)
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('POST /api/assessments/pioneer-driver still returns the assessment when the profile update fails', async () => {
    const assessment = {
      id: 'a1',
      user_id: 'auth-1',
      assessment_type: 'pioneer-driver',
      type_result: 'PIONEER',
      scores_json: { pioneer: 4 },
      created_at: '2026-10-23T00:00:00.000Z',
    }
    state.tables.assessments = { data: assessment, error: null }
    state.tables.users = { data: null, error: LEAK }

    const res = await postAssessment(jsonRequest('http://localhost/api/assessments/pioneer-driver', 'POST', {
      type_result: 'PIONEER',
      scores_json: { pioneer: 4 },
    }))
    const body = await jsonBody(res)

    expect(res.status).toBe(201)
    expect(body).toEqual({ assessment })
    assertHidden(body, logged())
  })
})
