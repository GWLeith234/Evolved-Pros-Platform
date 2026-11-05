/**
 * POST /api/lessons/[lessonId]/progress writes through the service-role
 * client, which skips RLS. These calls prove a signed-in member cannot
 * complete a lesson their tier cannot open, and that an allowed completion
 * is recorded for the caller.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const USER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const LESSON_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const COURSE_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const OTHER_LESSON_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'

type Profile = {
  id: string
  tier: string
  tier_status: string | null
}

type LessonRow = {
  id: string
  course_id: string
  title: string
  is_published: boolean
  sort_order: number
  course: { slug: string; pillar_number: number; required_tier: string } | null
}

const state = vi.hoisted(() => ({
  profile: null as Profile | null,
  lesson: null as LessonRow | null,
  writes: [] as Array<Record<string, unknown>>,
  pointAwards: [] as Array<{ user_id: string; amount: number }>,
  pointUpdates: 0,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({}),
}))

vi.mock('@/lib/auth/resolveCurrentUser', () => ({
  resolveCurrentUser: async () => state.profile,
}))

vi.mock('@/lib/notifications/create', () => ({
  notifyCourseUnlock: vi.fn(),
}))

function builder(table: string) {
  let progressReads = 0
  const api: Record<string, unknown> = {}
  const chain = () => api
  api.select = chain
  api.eq = chain
  api.in = chain
  api.not = chain
  api.upsert = (row: Record<string, unknown>) => {
    state.writes.push({ table, ...row })
    return api
  }
  api.update = () => {
    if (table === 'users') state.pointUpdates += 1
    return api
  }
  api.single = async () => {
    if (table === 'lessons') return { data: state.lesson, error: null }
    if (table === 'lesson_progress') {
      progressReads += 1
      if (progressReads === 1) return { data: null, error: null }
      const written = state.writes.find(row => row.lesson_id === state.lesson?.id)
      return {
        data: written
          ? { completed_at: written.completed_at, watch_time_seconds: written.watch_time_seconds }
          : null,
        error: null,
      }
    }
    if (table === 'courses') {
      return { data: { slug: 'identity', pillar_number: 2 }, error: null }
    }
    if (table === 'users') return { data: { points: 0 }, error: null }
    return { data: null, error: null }
  }
  api.then = (
    onFulfilled: (value: { data: unknown; error: null }) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => {
    const data = table === 'lessons'
      ? [{ id: LESSON_ID }, { id: OTHER_LESSON_ID }]
      : []
    return Promise.resolve({ data, error: null }).then(onFulfilled, onRejected)
  }
  return api
}

vi.mock('@/lib/supabase/admin', () => ({
  adminClient: {
    from: (table: string) => builder(table),
    rpc: async (name: string, args: { user_id: string; amount: number }) => {
      if (name === 'increment_points') state.pointAwards.push(args)
      return { error: null }
    },
  },
}))

import { POST } from '@/app/api/lessons/[lessonId]/progress/route'

function lesson(over: Partial<LessonRow> = {}): LessonRow {
  return {
    id: LESSON_ID,
    course_id: COURSE_ID,
    title: 'Identity, lesson 1',
    is_published: true,
    sort_order: 1,
    course: { slug: 'identity', pillar_number: 2, required_tier: 'vip' },
    ...over,
  }
}

function call(body: unknown = { watchTimeSeconds: 30, completed: true }) {
  return POST(
    new Request('http://localhost/api/lessons/progress', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    { params: { lessonId: LESSON_ID } },
  )
}

describe('POST /api/lessons/[lessonId]/progress', () => {
  beforeEach(() => {
    state.profile = null
    state.lesson = null
    state.writes = []
    state.pointAwards = []
    state.pointUpdates = 0
  })

  it('refuses a free member completing a VIP lesson and does not pay points', async () => {
    state.profile = { id: USER_ID, tier: 'community', tier_status: 'active' }
    state.lesson = lesson()

    const res = await call()

    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'Upgrade required' })
    expect(state.writes).toEqual([])
    expect(state.pointAwards).toEqual([])
    expect(state.pointUpdates).toBe(0)
  })

  it('refuses a lapsed VIP the same way', async () => {
    state.profile = { id: USER_ID, tier: 'vip', tier_status: 'expired' }
    state.lesson = lesson()

    const res = await call()

    expect(res.status).toBe(403)
    expect(state.writes).toEqual([])
    expect(state.pointAwards).toEqual([])
  })

  it('refuses Foundation lesson 2 to the free tier', async () => {
    state.profile = { id: USER_ID, tier: 'community', tier_status: 'active' }
    state.lesson = lesson({
      title: 'Foundation, lesson 2',
      sort_order: 2,
      course: { slug: 'foundation', pillar_number: 1, required_tier: 'vip' },
    })

    const res = await call()

    expect(res.status).toBe(403)
    expect(state.writes).toEqual([])
  })

  it('records Foundation lesson 1 for a free member and pays that member', async () => {
    state.profile = { id: USER_ID, tier: 'community', tier_status: 'active' }
    state.lesson = lesson({
      title: 'Foundation, lesson 1',
      sort_order: 1,
      course: { slug: 'foundation', pillar_number: 1, required_tier: 'vip' },
    })

    const res = await call()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.pointsAwarded).toBe(50)
    expect(typeof body.completedAt).toBe('string')
    expect(state.writes).toEqual([
      expect.objectContaining({
        table: 'lesson_progress',
        user_id: USER_ID,
        lesson_id: LESSON_ID,
        watch_time_seconds: 30,
      }),
    ])
    expect(state.pointAwards).toEqual([{ user_id: USER_ID, amount: 50 }])
  })

  it('records a VIP lesson for an active VIP', async () => {
    state.profile = { id: USER_ID, tier: 'vip', tier_status: 'active' }
    state.lesson = lesson()

    const res = await call()

    expect(res.status).toBe(200)
    expect(state.writes).toHaveLength(1)
    expect(state.writes[0]).toMatchObject({ user_id: USER_ID, lesson_id: LESSON_ID })
    expect(state.pointAwards).toEqual([{ user_id: USER_ID, amount: 50 }])
  })

  it('does not record an unpublished lesson', async () => {
    state.profile = { id: USER_ID, tier: 'pro', tier_status: 'active' }
    state.lesson = lesson({ is_published: false })

    const res = await call()

    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Lesson not found' })
    expect(state.writes).toEqual([])
    expect(state.pointAwards).toEqual([])
  })

  it('returns 401 when nobody is signed in', async () => {
    state.lesson = lesson()

    const res = await call()

    expect(res.status).toBe(401)
    expect(state.writes).toEqual([])
    expect(state.pointAwards).toEqual([])
  })
})
