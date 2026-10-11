/**
 * Public guest upload and a handful of member routes used to put PostgREST
 * or Storage `error.message` (and, for avatar, a thrown Error message) on
 * the JSON body. These calls assert the status stays 500, the body is a
 * stable message, and the provider text is only on the server log.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const LEAK = {
  code: '23505',
  message: 'duplicate key value violates unique constraint "users_email_key"',
  details: 'Key (email)=(secret@example.com) already exists.',
  hint: 'See public.users',
}

const state = vi.hoisted(() => ({
  user: null as { id: string; email: string } | null,
  profile: null as { id: string } | null,
  guestOk: true,
  storageError: null as typeof LEAK | null,
  storageThrow: null as string | null,
  usersResult: { data: null as unknown, error: null as typeof LEAK | null },
  commentsResult: { data: null as unknown, error: null as typeof LEAK | null },
  sessionResult: { data: null as unknown, error: null as typeof LEAK | null },
}))

function queryResult(value: { data: unknown; error: unknown }) {
  const node: Record<string, unknown> = {
    then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(value).then(resolve, reject),
    single: () => Promise.resolve(value),
  }
  for (const method of ['select', 'eq', 'order', 'limit', 'in', 'update', 'upsert', 'insert']) {
    node[method] = () => node
  }
  return node
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: state.user } }),
    },
    from: () => queryResult(state.sessionResult),
  }),
}))

vi.mock('@/lib/supabase/admin', () => ({
  adminClient: {
    from: (table: string) =>
      queryResult(table === 'story_comments' ? state.commentsResult : state.usersResult),
    storage: {
      from: () => {
        if (state.storageThrow) throw new Error(state.storageThrow)
        return {
          upload: async () => ({ error: state.storageError }),
          getPublicUrl: () => ({ data: { publicUrl: 'https://cdn.example/headshot.jpg' } }),
        }
      },
    },
  },
}))

vi.mock('@/lib/auth/resolveCurrentUser', () => ({
  resolveCurrentUser: async () => state.profile,
}))

vi.mock('@/lib/guest/engagement', () => ({
  resolveGuestEngagement: async () =>
    state.guestOk
      ? { ok: true as const, engagement: { engagement_id: 'eng-1' } }
      : { ok: false as const, reason: 'invalid' as const },
}))

import { POST as guestUpload } from '@/app/api/guest/upload/route'
import { POST as avatarUpload } from '@/app/api/user/avatar/route'
import { POST as postComment } from '@/app/api/media/comments/route'
import { PATCH as patchTheme } from '@/app/api/settings/theme/route'
import { PATCH as patchStep } from '@/app/api/onboarding/step/route'
import { PATCH as patchProfile } from '@/app/api/onboarding/profile/route'
import { NextRequest } from 'next/server'
import { GET as getCadences, POST as postCadence } from '@/app/api/review-cadences/route'

const SECRET = 'secret@example.com'

function jpeg(name = 'headshot.jpg'): File {
  return new File([new Uint8Array([0xff, 0xd8, 0xff])], name, { type: 'image/jpeg' })
}

function guestForm(): FormData {
  const fd = new FormData()
  fd.set('token', 'guest-token')
  fd.set('file', jpeg())
  return fd
}

async function jsonBody(res: Response): Promise<Record<string, unknown>> {
  return (await res.json()) as Record<string, unknown>
}

function assertHidden(body: Record<string, unknown>, logged: string) {
  const serialized = JSON.stringify(body)
  expect(serialized).not.toContain(SECRET)
  expect(serialized).not.toContain('users_email_key')
  expect(serialized).not.toContain('23505')
  expect(serialized).not.toContain('public.users')
  expect(logged).toContain(SECRET)
  expect(logged).toContain('users_email_key')
}

describe('routes hide provider error text', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    state.user = { id: 'auth-1', email: 'member@example.com' }
    state.profile = { id: 'user-1' }
    state.guestOk = true
    state.storageError = null
    state.storageThrow = null
    state.usersResult = { data: [{ id: 'user-1', theme: 'dark' }], error: null }
    state.commentsResult = {
      data: { id: 'c1', story_id: 'story-1', body: 'hello', created_at: '2026-10-08T00:00:00.000Z' },
      error: null,
    }
    state.sessionResult = { data: [], error: null }
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    errorSpy.mockRestore()
  })

  function logged(): string {
    return errorSpy.mock.calls.map(call => JSON.stringify(call)).join('\n')
  }

  it('POST /api/guest/upload returns a stable 500 and logs the storage error', async () => {
    state.storageError = LEAK
    const res = await guestUpload(
      new Request('http://localhost/api/guest/upload', { method: 'POST', body: guestForm() }),
    )
    const body = await jsonBody(res)

    expect(res.status).toBe(500)
    expect(body).toEqual({ error: 'Upload failed.' })
    assertHidden(body, logged())
  })

  it('POST /api/guest/upload still returns the public URL when storage accepts the file', async () => {
    const res = await guestUpload(
      new Request('http://localhost/api/guest/upload', { method: 'POST', body: guestForm() }),
    )
    expect(res.status).toBe(200)
    expect(await jsonBody(res)).toEqual({ url: 'https://cdn.example/headshot.jpg' })
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('POST /api/user/avatar hides a storage error', async () => {
    state.storageError = LEAK
    const fd = new FormData()
    fd.set('file', jpeg('avatar.jpg'))
    const res = await avatarUpload(
      new Request('http://localhost/api/user/avatar', { method: 'POST', body: fd }),
    )
    const body = await jsonBody(res)

    expect(res.status).toBe(500)
    expect(body).toEqual({ error: 'Upload failed.' })
    assertHidden(body, logged())
  })

  it('POST /api/user/avatar hides a thrown client error', async () => {
    state.storageThrow = 'connect ECONNREFUSED 10.0.0.8:5432'
    const fd = new FormData()
    fd.set('file', jpeg('avatar.jpg'))
    const res = await avatarUpload(
      new Request('http://localhost/api/user/avatar', { method: 'POST', body: fd }),
    )
    const body = await jsonBody(res)

    expect(res.status).toBe(500)
    expect(body).toEqual({ error: 'Upload failed.' })
    expect(JSON.stringify(body)).not.toContain('ECONNREFUSED')
    expect(JSON.stringify(body)).not.toContain('10.0.0.8')
    expect(logged()).toContain('ECONNREFUSED')
  })

  it('POST /api/media/comments hides an insert error', async () => {
    state.usersResult = {
      data: { id: 'user-1', display_name: 'Ada', full_name: 'Ada Lovelace', avatar_url: null },
      error: null,
    }
    state.commentsResult = { data: null, error: LEAK }
    const res = await postComment(
      new Request('http://localhost/api/media/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story_id: 'story-1', body: 'hello' }),
      }),
    )
    const body = await jsonBody(res)

    expect(res.status).toBe(500)
    expect(body).toEqual({ error: 'Failed to post comment' })
    assertHidden(body, logged())
  })

  it('PATCH /api/settings/theme hides a users update error and still saves on success', async () => {
    state.usersResult = { data: null, error: LEAK }
    const failed = await patchTheme(
      new Request('http://localhost/api/settings/theme', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: 'dark' }),
      }),
    )
    const failedBody = await jsonBody(failed)
    expect(failed.status).toBe(500)
    expect(failedBody).toEqual({ error: 'Could not save theme.' })
    assertHidden(failedBody, logged())

    errorSpy.mockClear()
    state.usersResult = { data: [{ theme: 'dark' }], error: null }
    const ok = await patchTheme(
      new Request('http://localhost/api/settings/theme', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: 'dark' }),
      }),
    )
    expect(ok.status).toBe(200)
    expect(await jsonBody(ok)).toEqual({ ok: true, theme: 'dark' })
  })

  it('PATCH /api/onboarding/step hides an upsert error', async () => {
    state.usersResult = { data: null, error: LEAK }
    const res = await patchStep(
      new Request('http://localhost/api/onboarding/step', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 2 }),
      }),
    )
    const body = await jsonBody(res)
    expect(res.status).toBe(500)
    expect(body).toEqual({ error: 'Could not save your progress.' })
    assertHidden(body, logged())
  })

  it('PATCH /api/onboarding/profile hides an update error', async () => {
    state.usersResult = { data: null, error: LEAK }
    const res = await patchProfile(
      new Request('http://localhost/api/onboarding/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: 'Ada' }),
      }),
    )
    const body = await jsonBody(res)
    expect(res.status).toBe(500)
    expect(body).toEqual({ error: 'Could not save your profile.' })
    assertHidden(body, logged())
  })

  it('GET and POST /api/review-cadences hide query errors', async () => {
    state.sessionResult = { data: null, error: LEAK }
    const listed = await getCadences(new NextRequest('http://localhost/api/review-cadences'))
    const listedBody = await jsonBody(listed)
    expect(listed.status).toBe(500)
    expect(listedBody).toEqual({ error: 'Could not load review cadences.' })
    assertHidden(listedBody, logged())

    const saved = await postCadence(
      new NextRequest('http://localhost/api/review-cadences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cadence_type: 'weekly' }),
      }),
    )
    const savedBody = await jsonBody(saved)
    expect(saved.status).toBe(500)
    expect(savedBody).toEqual({ error: 'Could not save your review cadence.' })
    assertHidden(savedBody, logged())
  })
})
