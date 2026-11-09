/**
 * Member writes used to put PostgREST `error.message` on the JSON body, and
 * a few handlers logged the raw error object or the member email. These
 * calls assert status 500, a stable `{ error }` string, and a server log
 * that keeps the constraint name while redacting the email and phone.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const LEAK = {
  code: '23505',
  message: 'duplicate key value violates unique constraint "users_email_key"',
  details: 'Key (email)=(secret@example.com) already exists. Caller 555-010-0199.',
  hint: 'See public.users',
}

type Row = { data: unknown; error: typeof LEAK | null }

const state = vi.hoisted(() => ({
  user: null as { id: string; email: string } | null,
  profile: null as { id: string; role?: string } | null,
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
    'select', 'eq', 'neq', 'order', 'limit', 'in', 'update', 'upsert', 'insert', 'delete', 'match', 'lt',
  ]) {
    node[method] = () => node
  }
  return node
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: state.user } }),
    },
    from: () => queryResult({ data: null, error: null }),
  }),
}))

vi.mock('@/lib/supabase/admin', () => ({
  adminClient: {
    from: (table: string) => {
      const queue = state.queues[table]
      const next = queue && queue.length > 0 ? queue.shift()! : { data: null, error: null }
      return queryResult(next)
    },
    rpc: async () => ({ data: null, error: null }),
  },
}))

vi.mock('@/lib/auth/resolveCurrentUser', () => ({
  resolveCurrentUser: async () => state.profile,
}))

vi.mock('@/lib/notifications/create', () => ({
  notifyWigNudge: async () => undefined,
}))

import { POST as postReact, DELETE as deleteReact } from '@/app/api/posts/[postId]/react/route'
import { POST as postRsvp, DELETE as deleteRsvp } from '@/app/api/events/[eventId]/rsvp/route'
import { PATCH as patchGoal } from '@/app/api/goals/[id]/route'
import { POST as toggleHabit } from '@/app/api/member/habits/toggle/route'
import { PATCH as completeOnboarding } from '@/app/api/onboarding/complete/route'
import { PATCH as patchStep } from '@/app/api/onboarding/step/route'
import { POST as postNotification } from '@/app/api/notifications/route'
import { POST as createPost } from '@/app/api/posts/route'
import { PATCH as patchAvatar } from '@/app/api/profile/avatar/route'
import { PATCH as patchBanner } from '@/app/api/profile/banner/route'
import { GET as getComments } from '@/app/api/media/comments/route'

const SECRET = 'secret@example.com'
const MEMBER = 'member@example.com'
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

describe('member routes hide provider error text', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    state.user = { id: 'auth-1', email: MEMBER }
    state.profile = { id: 'user-1', role: 'member' }
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
    expect(serialized).not.toContain(SECRET)
    expect(serialized).not.toContain(MEMBER)
    expect(serialized).not.toContain(PHONE)
    expect(serialized).not.toContain('users_email_key')
    expect(serialized).not.toContain('23505')
    expect(serialized).not.toContain('public.users')
    const lines = logged()
    expect(lines).not.toContain(SECRET)
    expect(lines).not.toContain(PHONE)
    expect(lines).toContain('[redacted-email]')
    expect(lines).toContain('[redacted-phone]')
    expect(lines).toContain('users_email_key')
    expect(lines).toContain('23505')
  }

  it('POST and DELETE /api/posts/[postId]/react hide write errors and still return counts', async () => {
    queue('users', { data: { id: 'user-1' }, error: null })
    queue('post_reactions', { data: null, error: LEAK })
    const failed = await postReact(
      jsonRequest('http://localhost/api/posts/post-1/react', 'POST', { emoji: 'fire' }),
      { params: { postId: 'post-1' } },
    )
    const failedBody = await jsonBody(failed)
    expect(failed.status).toBe(500)
    expect(failedBody).toEqual({ error: 'Could not save reaction.' })
    assertHidden(failedBody)

    errorSpy.mockClear()
    queue('users', { data: { id: 'user-1' }, error: null })
    queue('post_reactions', { data: null, error: LEAK })
    const removed = await deleteReact(
      new Request('http://localhost/api/posts/post-1/react', { method: 'DELETE' }),
      { params: { postId: 'post-1' } },
    )
    const removedBody = await jsonBody(removed)
    expect(removed.status).toBe(500)
    expect(removedBody).toEqual({ error: 'Could not remove reaction.' })
    assertHidden(removedBody)

    errorSpy.mockClear()
    queue('users', { data: { id: 'user-1' }, error: null })
    queue(
      'post_reactions',
      { data: null, error: null },
      { data: [{ reaction_type: 'fire' }, { reaction_type: 'clap' }], error: null },
    )
    const ok = await postReact(
      jsonRequest('http://localhost/api/posts/post-1/react', 'POST', { emoji: 'fire' }),
      { params: { postId: 'post-1' } },
    )
    expect(ok.status).toBe(200)
    expect(await jsonBody(ok)).toEqual({
      ok: true,
      counts: { fire: 1, hundred: 0, hands: 1, heart: 0, mindblown: 0 },
    })
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('POST and DELETE /api/events/[eventId]/rsvp hide write errors and still return the count', async () => {
    queue('users', { data: { id: 'user-1' }, error: null })
    queue('event_rsvps', { data: null, error: LEAK })
    const failed = await postRsvp(
      new Request('http://localhost/api/events/event-1/rsvp', { method: 'POST' }),
      { params: { eventId: 'event-1' } },
    )
    const failedBody = await jsonBody(failed)
    expect(failed.status).toBe(500)
    expect(failedBody).toEqual({ error: 'Could not save your RSVP.' })
    assertHidden(failedBody)

    errorSpy.mockClear()
    queue('users', { data: { id: 'user-1' }, error: null })
    queue('event_rsvps', { data: null, error: LEAK })
    const removed = await deleteRsvp(
      new Request('http://localhost/api/events/event-1/rsvp', { method: 'DELETE' }),
      { params: { eventId: 'event-1' } },
    )
    const removedBody = await jsonBody(removed)
    expect(removed.status).toBe(500)
    expect(removedBody).toEqual({ error: 'Could not remove your RSVP.' })
    assertHidden(removedBody)

    errorSpy.mockClear()
    queue('users', { data: { id: 'user-1' }, error: null })
    queue('event_rsvps', { data: null, error: null })
    queue('events', { data: { attending_count: 4 }, error: null })
    const ok = await postRsvp(
      new Request('http://localhost/api/events/event-1/rsvp', { method: 'POST' }),
      { params: { eventId: 'event-1' } },
    )
    expect(ok.status).toBe(200)
    expect(await jsonBody(ok)).toEqual({ ok: true, attending_count: 4 })
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('PATCH /api/goals/[id] hides select and update errors', async () => {
    queue('quarterly_goals', { data: null, error: LEAK })
    const selected = await patchGoal(
      jsonRequest('http://localhost/api/goals/goal-1', 'PATCH', { progress_pct: 40 }),
      { params: { id: 'goal-1' } },
    )
    const selectedBody = await jsonBody(selected)
    expect(selected.status).toBe(500)
    expect(selectedBody).toEqual({ error: 'Could not load that goal.' })
    assertHidden(selectedBody)

    errorSpy.mockClear()
    queue(
      'quarterly_goals',
      { data: { id: 'goal-1', progress_pct: 10, weekly_delta: 0, user_id: 'user-1', title: 'Quota' }, error: null },
      { data: null, error: LEAK },
    )
    const updated = await patchGoal(
      jsonRequest('http://localhost/api/goals/goal-1', 'PATCH', { progress_pct: 40 }),
      { params: { id: 'goal-1' } },
    )
    const updatedBody = await jsonBody(updated)
    expect(updated.status).toBe(500)
    expect(updatedBody).toEqual({ error: 'Could not save goal progress.' })
    assertHidden(updatedBody)
  })

  it('POST /api/member/habits/toggle hides insert and delete errors', async () => {
    queue('habits', { data: { id: 'habit-1', user_id: 'user-1' }, error: null })
    queue(
      'habit_completions',
      { data: null, error: null },
      { data: null, error: LEAK },
    )
    const inserted = await toggleHabit(
      jsonRequest('http://localhost/api/member/habits/toggle', 'POST', {
        habit_id: 'habit-1',
        date: '2026-11-09',
      }),
    )
    const insertedBody = await jsonBody(inserted)
    expect(inserted.status).toBe(500)
    expect(insertedBody).toEqual({ error: 'Could not update that habit.' })
    expect(logged()).toContain('[POST /api/member/habits/toggle] insert')
    assertHidden(insertedBody)

    errorSpy.mockClear()
    queue('habits', { data: { id: 'habit-1', user_id: 'user-1' }, error: null })
    queue(
      'habit_completions',
      { data: { id: 'completion-1' }, error: null },
      { data: null, error: LEAK },
    )
    const removed = await toggleHabit(
      jsonRequest('http://localhost/api/member/habits/toggle', 'POST', {
        habit_id: 'habit-1',
        date: '2026-11-09',
      }),
    )
    const removedBody = await jsonBody(removed)
    expect(removed.status).toBe(500)
    expect(removedBody).toEqual({ error: 'Could not update that habit.' })
    expect(logged()).toContain('[POST /api/member/habits/toggle] delete')
    assertHidden(removedBody)
  })

  it('PATCH /api/onboarding/complete hides the upsert error and does not log the email', async () => {
    queue('users', { data: null, error: LEAK })
    const failed = await completeOnboarding()
    const failedBody = await jsonBody(failed)
    expect(failed.status).toBe(500)
    expect(failedBody).toEqual({ error: 'Could not finish onboarding.' })
    assertHidden(failedBody)
    expect(logged()).not.toContain(MEMBER)

    errorSpy.mockClear()
    queue('users', { data: [], error: null })
    const empty = await completeOnboarding()
    const emptyBody = await jsonBody(empty)
    expect(empty.status).toBe(404)
    expect(emptyBody).toEqual({ error: 'No user record was written' })
    expect(JSON.stringify(emptyBody)).not.toContain(MEMBER)
    expect(logged()).not.toContain(MEMBER)
    expect(logged()).toContain('wrote zero rows')
    expect(logged()).toContain('auth-1')
  })

  it('PATCH /api/onboarding/step does not log the email when zero rows are written', async () => {
    queue('users', { data: [], error: null })
    const res = await patchStep(
      jsonRequest('http://localhost/api/onboarding/step', 'PATCH', { step: 2 }),
    )
    const body = await jsonBody(res)
    expect(res.status).toBe(404)
    expect(body).toEqual({ error: 'No user record was written' })
    expect(JSON.stringify(body)).not.toContain(MEMBER)
    expect(logged()).not.toContain(MEMBER)
    expect(logged()).toContain('wrote zero rows')
  })

  it('POST /api/notifications hides the insert error', async () => {
    queue('users', { data: { id: 'admin-1', role: 'admin' }, error: null })
    queue('notifications', { data: null, error: LEAK })
    const res = await postNotification(
      jsonRequest('http://localhost/api/notifications', 'POST', {
        user_id: 'user-2',
        title: 'Hello',
        body: 'A note',
      }),
    )
    const body = await jsonBody(res)
    expect(res.status).toBe(500)
    expect(body).toEqual({ error: 'Could not send notification.' })
    assertHidden(body)
  })

  it('POST /api/posts keeps a stable message and redacts the insert error in the log', async () => {
    queue('posts', { data: null, error: LEAK })
    const res = await createPost(
      jsonRequest('http://localhost/api/posts', 'POST', {
        channelId: 'channel-1',
        body: 'Closed the quarter strong.',
        kind: 'update',
      }),
    )
    const body = await jsonBody(res)
    expect(res.status).toBe(500)
    expect(body).toEqual({ error: 'Failed to create post' })
    assertHidden(body)
    expect(logged()).not.toContain(MEMBER)
  })

  it('profile avatar and banner updates keep a stable message and redact the log', async () => {
    queue('users', { data: null, error: LEAK })
    const avatar = await patchAvatar(
      jsonRequest('http://localhost/api/profile/avatar', 'PATCH', { url: 'https://cdn.example/a.jpg' }),
    )
    const avatarBody = await jsonBody(avatar)
    expect(avatar.status).toBe(500)
    expect(avatarBody).toEqual({ error: 'Update failed' })
    assertHidden(avatarBody)

    errorSpy.mockClear()
    queue('users', { data: null, error: LEAK })
    const banner = await patchBanner(
      jsonRequest('http://localhost/api/profile/banner', 'PATCH', { url: 'https://cdn.example/b.jpg' }),
    )
    const bannerBody = await jsonBody(banner)
    expect(banner.status).toBe(500)
    expect(bannerBody).toEqual({ error: 'Update failed' })
    assertHidden(bannerBody)
  })

  it('GET /api/media/comments logs a redacted provider error and returns no comments', async () => {
    queue('story_comments', { data: null, error: LEAK })
    const res = await getComments(new Request('http://localhost/api/media/comments?story_id=story-1'))
    const body = await jsonBody(res)
    expect(res.status).toBe(200)
    expect(body).toEqual({ comments: [] })
    assertHidden(body)
  })
})
