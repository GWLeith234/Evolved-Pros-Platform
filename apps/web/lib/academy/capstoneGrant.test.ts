/**
 * POST /api/capstones used to update the shared courses row (is_locked) and
 * to stamp alumni off pillar 6 alone. Course ids ship on the academy
 * storefront, including to the free tier. These calls prove a free account
 * cannot write, a single pillar cannot grant the credential, and the
 * catalog row is never updated.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { capstoneCoversProgram } from './capstoneGrant'

const USER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const PILLAR = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'] as const

type Course = { id: string; pillar_number: number; slug: string; is_published: boolean }
type Capstone = { user_id: string; course_id: string }
type Write = { table: string; op: 'insert' | 'update' | 'upsert'; row: unknown }

const state = vi.hoisted(() => ({
  profile: null as {
    id: string
    role: string
    tier: string
    tier_status: string | null
    program_completed_at: string | null
    email: string | null
    display_name: string | null
    full_name: string | null
  } | null,
  courses: [] as Course[],
  capstones: [] as Capstone[],
  writes: [] as Write[],
  emails: [] as string[],
}))

function matches(course: Course, eqs: Array<{ column: string; value: unknown }>): boolean {
  return eqs.every(eq => {
    if (eq.column === 'id') return course.id === eq.value
    if (eq.column === 'pillar_number') return course.pillar_number === eq.value
    if (eq.column === 'is_published') return course.is_published === eq.value
    return true
  })
}

function chain(table: string) {
  const eqs: Array<{ column: string; value: unknown }> = []
  let inIds: string[] | null = null
  let op: Write['op'] | null = null
  let row: Record<string, unknown> | null = null

  const node: Record<string, unknown> = {}
  const self = () => node
  node.select = self
  node.eq = (column: string, value: unknown) => {
    eqs.push({ column, value })
    return node
  }
  node.in = (_column: string, values: string[]) => {
    inIds = values
    return node
  }
  node.insert = (payload: Record<string, unknown>) => {
    op = 'insert'
    row = payload
    state.writes.push({ table, op, row: payload })
    if (table === 'capstones' && typeof payload.course_id === 'string') {
      state.capstones.push({ user_id: String(payload.user_id), course_id: payload.course_id })
    }
    return node
  }
  node.update = (payload: Record<string, unknown>) => {
    op = 'update'
    row = payload
    state.writes.push({ table, op, row: payload })
    return node
  }
  node.upsert = (payload: Record<string, unknown>) => {
    op = 'upsert'
    row = payload
    state.writes.push({ table, op, row: payload })
    return node
  }

  function oneCourse(): Course | null {
    return state.courses.find(course => matches(course, eqs)) ?? null
  }

  function many(): unknown {
    if (table === 'capstones') {
      const userId = eqs.find(eq => eq.column === 'user_id')?.value
      return state.capstones.filter(capstone => capstone.user_id === userId)
    }
    if (table === 'courses' && inIds) {
      return state.courses
        .filter(course => inIds!.includes(course.id))
        .map(course => ({ pillar_number: course.pillar_number }))
    }
    return []
  }

  node.maybeSingle = async () => ({ data: table === 'courses' ? oneCourse() : null, error: null })
  node.single = async () => {
    if (table === 'capstones' && op === 'insert' && row) {
      return {
        data: {
          id: 'cap-new',
          course_id: row.course_id,
          status: 'submitted',
          submitted_at: row.submitted_at,
        },
        error: null,
      }
    }
    const data = table === 'courses' ? oneCourse() : null
    return { data, error: data ? null : { message: 'not found', code: 'PGRST116' } }
  }
  node.then = (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
    Promise.resolve({ data: many(), error: null }).then(resolve, reject)

  return node
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'auth-1', email: 'member@example.com' } } }) },
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

vi.mock('@/lib/resend/emails/program-completion', () => ({
  sendProgramCompletionEmail: vi.fn(async ({ email }: { email: string }) => {
    state.emails.push(email)
  }),
}))

import { POST } from '@/app/api/capstones/route'

function essay(): string {
  return 'x'.repeat(200)
}

function post(body: unknown) {
  return POST(new Request('http://localhost/api/capstones', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }))
}

function seedCourses() {
  state.courses = PILLAR.map((id, index) => ({
    id,
    pillar_number: index + 1,
    slug: `pillar-${index + 1}`,
    is_published: true,
  }))
}

describe('capstoneCoversProgram', () => {
  it('requires every pillar, not just Execution', () => {
    expect(capstoneCoversProgram([6])).toBe(false)
    expect(capstoneCoversProgram([1, 2, 3, 4, 5])).toBe(false)
    expect(capstoneCoversProgram([1, 2, 3, 4, 5, 6])).toBe(true)
  })
})

describe('POST /api/capstones', () => {
  beforeEach(() => {
    state.profile = {
      id: USER,
      role: 'member',
      tier: 'vip',
      tier_status: 'active',
      program_completed_at: null,
      email: 'member@example.com',
      display_name: 'Ada',
      full_name: 'Ada Lovelace',
    }
    state.capstones = []
    state.writes = []
    state.emails = []
    seedCourses()
  })

  it('refuses a free account before writing a capstone or the catalog', async () => {
    state.profile = { ...state.profile!, tier: 'community' }
    const res = await post({ course_id: 'c6', content: essay() })

    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'Capstones are part of the Academy.' })
    expect(state.writes).toEqual([])
    expect(state.capstones).toEqual([])
  })

  it('rejects an unknown course before insert', async () => {
    const res = await post({ course_id: 'missing', content: essay() })

    expect(res.status).toBe(404)
    expect(state.writes).toEqual([])
  })

  it('rejects an unpublished course before insert', async () => {
    state.courses[5] = { ...state.courses[5], is_published: false }
    const res = await post({ course_id: 'c6', content: essay() })

    expect(res.status).toBe(404)
    expect(state.writes).toEqual([])
  })

  it('lets an admin submit without an Academy tier', async () => {
    state.profile = { ...state.profile!, role: 'admin', tier: 'community' }
    const res = await post({ course_id: 'c1', content: essay() })

    expect(res.status).toBe(201)
    expect(state.capstones).toEqual([{ user_id: USER, course_id: 'c1' }])
    expect(state.writes.some(write => write.table === 'courses' && write.op === 'update')).toBe(false)
  })

  it('saves a pillar capstone without unlocking the next course', async () => {
    const res = await post({ course_id: 'c1', content: essay() })
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.nextCourseSlug).toBe('pillar-2')
    expect(state.capstones).toEqual([{ user_id: USER, course_id: 'c1' }])
    expect(state.writes).toEqual([
      expect.objectContaining({ table: 'capstones', op: 'insert' }),
    ])
    expect(state.writes.some(write => write.op === 'update' || write.table === 'courses')).toBe(false)
    expect(JSON.stringify(state.writes)).not.toContain('is_locked')
    expect(state.emails).toEqual([])
  })

  it('does not grant alumni for pillar 6 alone', async () => {
    const res = await post({ course_id: 'c6', content: essay() })
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.nextCourseSlug).toBe('completion')
    expect(state.writes.map(write => `${write.op}:${write.table}`)).not.toContain('update:users')
    expect(state.writes.map(write => write.table)).not.toContain('member_badges')
    expect(state.emails).toEqual([])
  })

  it('grants alumni only once every pillar has a capstone', async () => {
    state.capstones = [1, 2, 3, 4, 5].map(n => ({ user_id: USER, course_id: `c${n}` }))

    const res = await post({ course_id: 'c6', content: essay() })

    expect(res.status).toBe(201)
    expect(state.writes.some(write => write.table === 'courses')).toBe(false)
    expect(state.writes).toEqual(expect.arrayContaining([
      expect.objectContaining({
        table: 'users',
        op: 'update',
        row: expect.objectContaining({ program_completed_at: expect.any(String) }),
      }),
      expect.objectContaining({
        table: 'member_badges',
        op: 'upsert',
        row: expect.objectContaining({ user_id: USER, pillar_number: 7, pillar_name: 'EVOLVED Alumni' }),
      }),
    ]))
    expect(state.emails).toEqual(['member@example.com'])
  })
})
