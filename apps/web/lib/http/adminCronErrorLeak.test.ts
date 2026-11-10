/**
 * Admin and cron handlers used to put PostgREST or Storage `error.message`
 * on the JSON body, and a few cron catches returned a thrown Error that
 * embedded the same text. These calls keep the status and `{ error }`
 * shape, swap in a stable message, and leave the constraint name in a
 * redacted server log.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const LEAK = {
  code: '42501',
  message: 'duplicate key value violates unique constraint "users_email_key"',
  details: 'Key (email)=(secret@example.com) already exists. Caller 555-010-0199.',
  hint: 'See public.users',
}

type Row = { data: unknown; error: typeof LEAK | null; count?: number | null }

const state = vi.hoisted(() => ({
  queues: {} as Record<string, Row[]>,
  fallback: { data: null as unknown, error: null as typeof LEAK | null, count: null as number | null },
  storageError: null as typeof LEAK | null,
  storageThrow: null as string | null,
  rpc: { data: null as unknown, error: null as typeof LEAK | null },
  nudgeThrow: null as Error | null,
  thanksThrow: null as Error | null,
  linkError: null as typeof LEAK | null,
  linkData: null as unknown,
  pgError: null as Error | null,
}))

function queryResult(value: Row) {
  const node: Record<string, unknown> = {
    then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(value).then(resolve, reject),
    single: () => Promise.resolve(value),
    maybeSingle: () => Promise.resolve(value),
  }
  for (const method of [
    'select', 'eq', 'neq', 'order', 'limit', 'in', 'update', 'upsert', 'insert', 'delete',
    'match', 'lt', 'lte', 'gte', 'gt', 'is', 'or', 'filter',
  ]) {
    node[method] = () => node
  }
  return node
}

vi.mock('next/cache', () => ({
  revalidateTag: () => undefined,
  unstable_cache: (fn: unknown) => fn,
}))

vi.mock('@/lib/admin/helpers', () => ({
  requireAdminApi: async () => ({ userId: 'admin-1' }),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: null } }) },
    from: () => queryResult(state.fallback),
  }),
}))

vi.mock('@/lib/supabase/admin', () => ({
  adminClient: {
    from: (table: string) => {
      const queue = state.queues[table]
      const next = queue && queue.length > 0 ? queue.shift()! : state.fallback
      return queryResult(next)
    },
    storage: {
      from: () => {
        if (state.storageThrow) throw new Error(state.storageThrow)
        return {
          upload: async () => ({ error: state.storageError }),
          getPublicUrl: () => ({ data: { publicUrl: 'https://cdn.example/file.jpg' } }),
          download: async () => ({ data: null, error: state.storageError }),
        }
      },
    },
    rpc: async () => state.rpc,
    auth: {
      admin: {
        generateLink: async () => ({ data: state.linkData, error: state.linkError }),
      },
    },
  },
}))

vi.mock('@/lib/notifications/nudges', () => ({
  enqueueWeeklyWigNudges: async () => 0,
  enqueueWigNudges: async () => {
    if (state.nudgeThrow) throw state.nudgeThrow
    return 0
  },
  enqueueDailyProgressNudges: async () => 0,
  listActiveMemberIds: async () => [],
}))

vi.mock('@/lib/thanks/enqueue', () => ({
  enqueueDueThanksNudges: async () => {
    if (state.thanksThrow) throw state.thanksThrow
    return { queued: 0 }
  },
}))

vi.mock('@/lib/seo/indexnow', () => ({
  mediaStoryPublicUrl: () => 'https://example.test/story',
  podcastEpisodePublicUrl: (slug: string) => `https://example.test/podcast/${slug}`,
  queueIndexNowPing: () => undefined,
}))

vi.mock('pg', () => ({
  Client: class {
    connect() {
      if (state.pgError) return Promise.reject(state.pgError)
      return Promise.resolve()
    }
    query() { return Promise.resolve() }
    end() { return Promise.resolve() }
  },
}))

import { POST as postAd } from '@/app/api/admin/ads/route'
import { GET as countAudience } from '@/app/api/admin/broadcast/count/route'
import { GET as crmStatus, POST as crmBootstrap } from '@/app/api/admin/crm/bootstrap/route'
import { DELETE as deleteProspect, PATCH as patchProspect } from '@/app/api/admin/crm/prospects/[id]/route'
import { GET as listProspects, POST as createProspect } from '@/app/api/admin/crm/prospects/route'
import { POST as createEpisode } from '@/app/api/admin/episodes/route'
import { DELETE as deleteEvent, PATCH as patchEvent } from '@/app/api/admin/events/[id]/route'
import { GET as listEvents, POST as createEvent } from '@/app/api/admin/events/route'
import { POST as uploadImage } from '@/app/api/admin/images/upload/route'
import { POST as inviteMember } from '@/app/api/admin/invite/route'
import { DELETE as deleteLesson, PATCH as patchLesson } from '@/app/api/admin/lessons/[lessonId]/route'
import { PATCH as publishLesson } from '@/app/api/admin/lessons/[lessonId]/publish/route'
import { POST as createLesson } from '@/app/api/admin/lessons/route'
import { GET as getStory, DELETE as deleteStory } from '@/app/api/admin/media/[id]/route'
import { GET as listStories } from '@/app/api/admin/media/route'
import { PATCH as patchMember } from '@/app/api/admin/members/[userId]/profile/route'
import { DELETE as deletePartner, PATCH as patchPartner } from '@/app/api/admin/partners/[id]/route'
import { POST as createPartner } from '@/app/api/admin/partners/route'
import { PUT as savePins } from '@/app/api/admin/speaking/pins/route'
import { PUT as saveSpeaking } from '@/app/api/admin/speaking/route'
import { POST as uploadStoryImage } from '@/app/api/admin/upload-story-image/route'
import { GET as expireTiers } from '@/app/api/cron/expire-tiers/route'
import { GET as goalSnapshots } from '@/app/api/cron/goal-snapshots/route'
import { GET as memberNudges } from '@/app/api/cron/member-nudges/route'
import { GET as publishPosts } from '@/app/api/cron/publish-posts/route'
import { GET as thanksNudges } from '@/app/api/cron/thanks-nudges/route'

const SECRET = 'secret@example.com'
const PHONE = '555-010-0199'
const CRON_SECRET = 'cron-test-secret'

function jsonRequest(url: string, method: string, body?: unknown): Request {
  return new Request(url, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

function cronRequest(url: string): Request {
  return new Request(url, { headers: { authorization: `Bearer ${CRON_SECRET}` } })
}

function jpeg(): File {
  return new File([new Uint8Array([0xff, 0xd8, 0xff])], 'shot.jpg', { type: 'image/jpeg' })
}

async function jsonBody(res: Response): Promise<Record<string, unknown>> {
  return (await res.json()) as Record<string, unknown>
}

describe('admin and cron routes hide provider error text', () => {
  const savedCron = process.env.CRON_SECRET
  const savedDb = process.env.DATABASE_URL
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    process.env.CRON_SECRET = CRON_SECRET
    state.queues = {}
    state.fallback = { data: null, error: LEAK, count: null }
    state.storageError = null
    state.storageThrow = null
    state.rpc = { data: null, error: LEAK }
    state.nudgeThrow = null
    state.thanksThrow = null
    state.linkError = null
    state.linkData = null
    state.pgError = null
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    if (savedCron === undefined) delete process.env.CRON_SECRET
    else process.env.CRON_SECRET = savedCron
    if (savedDb === undefined) delete process.env.DATABASE_URL
    else process.env.DATABASE_URL = savedDb
    errorSpy.mockRestore()
  })

  function logged(): string {
    return errorSpy.mock.calls.map(call => JSON.stringify(call)).join('\n')
  }

  function assertHidden(body: Record<string, unknown>) {
    const serialized = JSON.stringify(body)
    expect(serialized).not.toContain(SECRET)
    expect(serialized).not.toContain(PHONE)
    expect(serialized).not.toContain('users_email_key')
    expect(serialized).not.toContain('42501')
    expect(serialized).not.toContain('public.users')
    const lines = logged()
    expect(lines).not.toContain(SECRET)
    expect(lines).not.toContain(PHONE)
    expect(lines).toContain('[redacted-email]')
    expect(lines).toContain('[redacted-phone]')
    expect(lines).toContain('users_email_key')
    expect(lines).toContain('42501')
  }

  it('GET /api/admin/broadcast/count hides the count error and still returns a count', async () => {
    const failed = await countAudience(new NextRequest('http://localhost/api/admin/broadcast/count'))
    const failedBody = await jsonBody(failed)
    expect(failed.status).toBe(500)
    expect(failedBody).toEqual({ error: 'Could not count that audience.' })
    assertHidden(failedBody)

    errorSpy.mockClear()
    state.fallback = { data: null, error: null, count: 4 }
    const ok = await countAudience(new NextRequest('http://localhost/api/admin/broadcast/count?audience=vip'))
    expect(ok.status).toBe(200)
    expect(await jsonBody(ok)).toEqual({ count: 4 })
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('admin writes hide provider errors and keep their status', async () => {
    const cases: Array<{ run: () => Promise<Response>; status: number; error: string }> = [
      {
        run: () => postAd(jsonRequest('http://localhost/api/admin/ads', 'POST', {})),
        status: 500,
        error: 'Failed to create ad',
      },
      {
        run: () => createEpisode(jsonRequest('http://localhost/api/admin/episodes', 'POST', { title: 'Show' })),
        status: 500,
        error: 'Failed to create episode',
      },
      {
        run: () => createEvent(jsonRequest('http://localhost/api/admin/events', 'POST', {
          title: 'Live',
          event_type: 'virtual',
          starts_at: '2026-12-01T00:00:00.000Z',
        })),
        status: 500,
        error: 'Failed to create event',
      },
      {
        run: () => patchEvent(
          jsonRequest('http://localhost/api/admin/events/event-1', 'PATCH', { title: 'Later' }),
          { params: { id: 'event-1' } },
        ),
        status: 500,
        error: 'Update failed',
      },
      {
        run: () => deleteEvent(
          new Request('http://localhost/api/admin/events/event-1', { method: 'DELETE' }),
          { params: { id: 'event-1' } },
        ),
        status: 500,
        error: 'Delete failed',
      },
      {
        run: () => createLesson(jsonRequest('http://localhost/api/admin/lessons', 'POST', {
          course_id: 'course-1',
          title: 'Open',
          slug: 'open',
        })),
        status: 500,
        error: 'Could not create that lesson.',
      },
      {
        run: () => patchLesson(
          jsonRequest('http://localhost/api/admin/lessons/lesson-1', 'PATCH', { title: 'Open' }),
          { params: { lessonId: 'lesson-1' } },
        ),
        status: 500,
        error: 'Could not update that lesson.',
      },
      {
        run: () => deleteLesson(
          new Request('http://localhost/api/admin/lessons/lesson-1', { method: 'DELETE' }),
          { params: { lessonId: 'lesson-1' } },
        ),
        status: 500,
        error: 'Could not delete that lesson.',
      },
      {
        run: () => listStories(),
        status: 500,
        error: 'Could not load stories.',
      },
      {
        run: () => getStory(
          new Request('http://localhost/api/admin/media/story-1'),
          { params: { id: 'story-1' } },
        ),
        status: 404,
        error: 'Not found',
      },
      {
        run: () => deleteStory(
          new Request('http://localhost/api/admin/media/story-1', { method: 'DELETE' }),
          { params: { id: 'story-1' } },
        ),
        status: 500,
        error: 'Could not delete that story.',
      },
      {
        run: () => patchMember(
          jsonRequest('http://localhost/api/admin/members/user-1/profile', 'PATCH', { display_name: 'Ada' }),
          { params: { userId: 'user-1' } },
        ),
        status: 500,
        error: 'Could not update that member.',
      },
      {
        run: () => createPartner(jsonRequest('http://localhost/api/admin/partners', 'POST', { name: 'Acme' })),
        status: 500,
        error: 'Insert failed',
      },
      {
        run: () => patchPartner(
          jsonRequest('http://localhost/api/admin/partners/partner-1', 'PATCH', { name: 'Acme' }),
          { params: { id: 'partner-1' } },
        ),
        status: 500,
        error: 'Could not update that partner.',
      },
      {
        run: () => deletePartner(
          new Request('http://localhost/api/admin/partners/partner-1', { method: 'DELETE' }),
          { params: { id: 'partner-1' } },
        ),
        status: 500,
        error: 'Could not update that partner.',
      },
    ]

    for (const item of cases) {
      errorSpy.mockClear()
      state.fallback = { data: null, error: LEAK, count: null }
      const res = await item.run()
      const body = await jsonBody(res)
      expect(res.status, item.error).toBe(item.status)
      expect(body).toEqual({ error: item.error })
      assertHidden(body)
    }
  })

  it('PATCH lesson publish hides the update error after the current row loads', async () => {
    state.queues.lessons = [
      { data: { is_published: false }, error: null },
      { data: null, error: LEAK },
    ]
    const res = await publishLesson(
      new Request('http://localhost/api/admin/lessons/lesson-1/publish', { method: 'PATCH' }),
      { params: { lessonId: 'lesson-1' } },
    )
    const body = await jsonBody(res)
    expect(res.status).toBe(500)
    expect(body).toEqual({ error: 'Could not update publish status.' })
    assertHidden(body)
  })

  it('CRM list, create, update, and delete hide provider text', async () => {
    const listed = await listProspects(new Request('http://localhost/api/admin/crm/prospects'))
    const listedBody = await jsonBody(listed)
    expect(listed.status).toBe(500)
    expect(listedBody).toEqual({ error: 'Could not load prospects.' })
    assertHidden(listedBody)

    errorSpy.mockClear()
    const created = await createProspect(jsonRequest('http://localhost/api/admin/crm/prospects', 'POST', {
      full_name: 'Ada Lovelace',
      email: 'ada@example.com',
    }))
    const createdBody = await jsonBody(created)
    expect(created.status).toBe(500)
    expect(createdBody).toEqual({ error: 'Could not save that prospect.' })
    assertHidden(createdBody)
    expect(JSON.stringify(createdBody)).not.toContain('ada@example.com')

    errorSpy.mockClear()
    state.fallback = {
      data: null,
      error: { ...LEAK, code: '23505' },
      count: null,
    }
    const duplicate = await createProspect(jsonRequest('http://localhost/api/admin/crm/prospects', 'POST', {
      full_name: 'Ada Lovelace',
      email: 'ada@example.com',
    }))
    const duplicateBody = await jsonBody(duplicate)
    expect(duplicate.status).toBe(409)
    expect(duplicateBody).toEqual({ error: 'A prospect with the email ada@example.com already exists.' })
    expect(JSON.stringify(duplicateBody)).not.toContain('users_email_key')
    expect(JSON.stringify(duplicateBody)).not.toContain(SECRET)
    expect(logged()).not.toContain(SECRET)
    expect(logged()).toContain('[redacted-email]')

    errorSpy.mockClear()
    state.fallback = {
      data: null,
      error: {
        ...LEAK,
        message: 'column value_monthly does not exist',
      },
      count: null,
    }
    const migrated = await patchProspect(
      jsonRequest('http://localhost/api/admin/crm/prospects/prospect-1', 'PATCH', { notes: 'hello' }),
      { params: { id: 'prospect-1' } },
    )
    const migratedBody = await jsonBody(migrated)
    expect(migrated.status).toBe(500)
    expect(migratedBody).toEqual({ error: 'Run migration 061_crm_prospects_value_followup.sql then retry.' })
    expect(JSON.stringify(migratedBody)).not.toContain(SECRET)
    expect(logged()).not.toContain(SECRET)

    errorSpy.mockClear()
    state.fallback = { data: null, error: LEAK, count: null }
    const removed = await deleteProspect(
      new Request('http://localhost/api/admin/crm/prospects/prospect-1', { method: 'DELETE' }),
      { params: { id: 'prospect-1' } },
    )
    const removedBody = await jsonBody(removed)
    expect(removed.status).toBe(500)
    expect(removedBody).toEqual({ error: 'Could not delete that prospect.' })
    assertHidden(removedBody)
  })

  it('CRM bootstrap reports schema state without the provider message', async () => {
    const missing = await crmStatus()
    const missingBody = await jsonBody(missing)
    expect(missing.status).toBe(200)
    expect(missingBody.status).toBe('missing')
    expect(missingBody.error).toBe('CRM prospects table is missing.')
    assertHidden(missingBody)

    errorSpy.mockClear()
    state.fallback = {
      data: null,
      error: { ...LEAK, message: 'column next_follow_up_at does not exist' },
      count: null,
    }
    const partial = await crmStatus()
    const partialBody = await jsonBody(partial)
    expect(partial.status).toBe(200)
    expect(partialBody).toMatchObject({
      status: 'partial',
      columns061: false,
      error: 'CRM follow-up columns are missing.',
    })
    expect(JSON.stringify(partialBody)).not.toContain(SECRET)
    expect(logged()).not.toContain(SECRET)

    errorSpy.mockClear()
    process.env.DATABASE_URL = 'postgresql://postgres:super-secret-pass@db.internal:5432/postgres'
    state.pgError = new Error(
      'connect failed postgresql://postgres:super-secret-pass@db.internal:5432/postgres for secret@example.com',
    )
    const applied = await crmBootstrap()
    const appliedBody = await jsonBody(applied)
    expect(applied.status).toBe(500)
    expect(appliedBody.applied).toBe(false)
    expect(appliedBody.error).toBe('Could not apply CRM migrations.')
    const serialized = JSON.stringify(appliedBody)
    expect(serialized).not.toContain(SECRET)
    expect(serialized).not.toContain('super-secret-pass')
    expect(logged()).not.toContain(SECRET)
    expect(logged()).not.toContain('super-secret-pass')
    expect(logged()).toContain('[redacted-email]')
    expect(logged()).toContain('[redacted-secret]')
  })

  it('storage uploads and invite generation hide provider text', async () => {
    state.storageError = LEAK
    const fd = new FormData()
    fd.set('file', jpeg())
    const uploaded = await uploadImage(new Request('http://localhost/api/admin/images/upload', { method: 'POST', body: fd }))
    const uploadedBody = await jsonBody(uploaded)
    expect(uploaded.status).toBe(500)
    expect(uploadedBody).toEqual({ error: 'Upload failed.' })
    assertHidden(uploadedBody)

    errorSpy.mockClear()
    state.storageError = null
    state.storageThrow = 'connect ECONNREFUSED 10.0.0.8:5432 secret@example.com'
    const fd2 = new FormData()
    fd2.set('file', jpeg())
    const thrown = await uploadStoryImage(new Request('http://localhost/api/admin/upload-story-image', { method: 'POST', body: fd2 }))
    const thrownBody = await jsonBody(thrown)
    expect(thrown.status).toBe(500)
    expect(thrownBody).toEqual({ error: 'Upload failed.' })
    expect(JSON.stringify(thrownBody)).not.toContain('ECONNREFUSED')
    expect(JSON.stringify(thrownBody)).not.toContain(SECRET)
    expect(logged()).toContain('ECONNREFUSED')
    expect(logged()).not.toContain(SECRET)

    errorSpy.mockClear()
    state.storageThrow = null
    state.linkError = LEAK
    const invited = await inviteMember(jsonRequest('http://localhost/api/admin/invite', 'POST', {
      email: 'ada@example.com',
      fullName: 'Ada',
      tier: 'vip',
    }))
    const invitedBody = await jsonBody(invited)
    expect(invited.status).toBe(500)
    expect(invitedBody).toEqual({ error: 'Failed to generate invite link' })
    assertHidden(invitedBody)
  })

  it('speaking saves hide the settings error', async () => {
    const dates = await saveSpeaking(jsonRequest('http://localhost/api/admin/speaking', 'PUT', { dates: [] }))
    const datesBody = await jsonBody(dates)
    expect(dates.status).toBe(500)
    expect(datesBody).toEqual({ error: 'Failed to save speaking dates' })
    assertHidden(datesBody)

    errorSpy.mockClear()
    const pins = await savePins(jsonRequest('http://localhost/api/admin/speaking/pins', 'PUT', { pins: [] }))
    const pinsBody = await jsonBody(pins)
    expect(pins.status).toBe(500)
    expect(pinsBody).toEqual({ error: 'Failed to save pins' })
    assertHidden(pinsBody)
  })

  it('cron routes hide provider text and still publish when the write succeeds', async () => {
    const expired = await expireTiers(cronRequest('http://localhost/api/cron/expire-tiers'))
    const expiredBody = await jsonBody(expired)
    expect(expired.status).toBe(500)
    expect(expiredBody).toEqual({ error: 'Could not expire tiers.' })
    assertHidden(expiredBody)

    errorSpy.mockClear()
    const posts = await publishPosts(cronRequest('http://localhost/api/cron/publish-posts'))
    const postsBody = await jsonBody(posts)
    expect(posts.status).toBe(500)
    expect(postsBody).toEqual({ error: 'Could not publish scheduled posts.' })
    assertHidden(postsBody)

    errorSpy.mockClear()
    state.fallback = { data: [{ id: 'post-1' }, { id: 'post-2' }], error: null, count: null }
    const published = await publishPosts(cronRequest('http://localhost/api/cron/publish-posts'))
    expect(published.status).toBe(200)
    expect(await jsonBody(published)).toEqual({ published: 2 })
    expect(errorSpy).not.toHaveBeenCalled()

    errorSpy.mockClear()
    state.fallback = { data: null, error: LEAK, count: null }
    const snapshots = await goalSnapshots(cronRequest('http://localhost/api/cron/goal-snapshots'))
    const snapshotsBody = await jsonBody(snapshots)
    expect(snapshots.status).toBe(500)
    expect(snapshotsBody).toEqual({ ok: false, error: 'Snapshot run failed' })
    assertHidden(snapshotsBody)
    expect(JSON.stringify(snapshotsBody)).not.toContain('select goals failed')

    errorSpy.mockClear()
    state.nudgeThrow = new Error(`${LEAK.code} ${LEAK.message} ${LEAK.details}`)
    const nudges = await memberNudges(cronRequest('http://localhost/api/cron/member-nudges'))
    const nudgesBody = await jsonBody(nudges)
    expect(nudges.status).toBe(500)
    expect(nudgesBody).toEqual({ ok: false, error: 'Nudge run failed' })
    assertHidden(nudgesBody)

    errorSpy.mockClear()
    state.thanksThrow = new Error(`${LEAK.code} ${LEAK.message} ${LEAK.details}`)
    const thanks = await thanksNudges(cronRequest('http://localhost/api/cron/thanks-nudges'))
    const thanksBody = await jsonBody(thanks)
    expect(thanks.status).toBe(500)
    expect(thanksBody).toEqual({ ok: false, error: 'Thanks nudge sweep failed', sent: 0 })
    assertHidden(thanksBody)
  })

  it('GET /api/admin/events hides a list error', async () => {
    const res = await listEvents()
    const body = await jsonBody(res)
    expect(res.status).toBe(500)
    expect(body).toEqual({ error: 'Failed to fetch events' })
    assertHidden(body)
  })

  it('route sources no longer return a provider message', () => {
    const files = [
      'app/api/admin/ads/route.ts',
      'app/api/admin/broadcast/count/route.ts',
      'app/api/admin/crm/bootstrap/route.ts',
      'app/api/admin/crm/prospects/route.ts',
      'app/api/admin/crm/prospects/[id]/route.ts',
      'app/api/admin/episodes/route.ts',
      'app/api/admin/episodes/[episodeId]/guest-portrait/publish/route.ts',
      'app/api/admin/events/route.ts',
      'app/api/admin/events/[id]/route.ts',
      'app/api/admin/images/upload/route.ts',
      'app/api/admin/invite/route.ts',
      'app/api/admin/lessons/route.ts',
      'app/api/admin/lessons/[lessonId]/route.ts',
      'app/api/admin/lessons/[lessonId]/publish/route.ts',
      'app/api/admin/media/route.ts',
      'app/api/admin/media/[id]/route.ts',
      'app/api/admin/members/[userId]/profile/route.ts',
      'app/api/admin/partners/route.ts',
      'app/api/admin/partners/[id]/route.ts',
      'app/api/admin/speaking/route.ts',
      'app/api/admin/speaking/pins/route.ts',
      'app/api/admin/upload-guest-photo/route.ts',
      'app/api/admin/upload-story-image/route.ts',
      'app/api/cron/expire-tiers/route.ts',
      'app/api/cron/goal-snapshots/route.ts',
      'app/api/cron/member-nudges/route.ts',
      'app/api/cron/publish-posts/route.ts',
      'app/api/cron/thanks-nudges/route.ts',
      'lib/goals/snapshot.ts',
      'lib/media/mediaStoryWrite.ts',
    ]
    for (const file of files) {
      const source = readFileSync(resolve(__dirname, '../..', file), 'utf8')
      expect(source, file).not.toMatch(/error:\s*error\??\.message/)
      expect(source, file).not.toMatch(/\$\{[^}]*\.message\}/)
    }
  })
})
