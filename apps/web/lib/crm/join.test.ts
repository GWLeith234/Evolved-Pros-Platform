import { describe, expect, it, vi } from 'vitest'
import {
  JOIN_SOURCE,
  JOIN_TAG,
  displayNameFromEmail,
  joinNotificationCopy,
  notifyJoinIfNew,
  requestJoinProvision,
  shouldNotifyJoinBackstop,
  shouldProvisionJoin,
  upsertJoinProspect,
  validateJoinEmail,
} from './join'
import { PG_UNIQUE_VIOLATION, type IntakeDb, type IntakeProspectRow } from './intake'

const NOW = new Date('2026-09-05T12:00:00.000Z')

function mockDb(overrides: Partial<IntakeDb> = {}): IntakeDb {
  return {
    insertProspect: vi.fn(async () => ({ error: null })),
    findProspectByEmail: vi.fn(async () => ({ data: null as IntakeProspectRow | null, error: null })),
    updateProspect: vi.fn(async () => ({ error: null })),
    listAdminIds: vi.fn(async () => ({ data: [{ id: 'admin-1' }], error: null })),
    insertNotifications: vi.fn(async () => ({ error: null })),
    ...overrides,
  }
}

describe('validateJoinEmail', () => {
  it('normalizes email and flags a honeypot', () => {
    const ok = validateJoinEmail({ email: 'Dana@Northgate.Example ' })
    expect(ok).toEqual({ kind: 'ok', email: 'dana@northgate.example' })
    expect(validateJoinEmail({ email: 'dana@x.co', website: 'http://spam' }).kind).toBe('bot')
    expect(validateJoinEmail({ email: 'nope' }).kind).toBe('invalid')
  })
})

describe('displayNameFromEmail / notification copy', () => {
  it('derives a name from the local part and never uses an em dash', () => {
    expect(displayNameFromEmail('dana.whitfield@northgate.example')).toBe('dana whitfield')
    const copy = joinNotificationCopy('dana@northgate.example')
    expect(copy.title).toBe('New join: Email: dana@northgate.example')
    expect(copy.body).toBe('Email: dana@northgate.example')
    expect(copy.title).not.toContain('—')
  })
})

describe('shouldProvisionJoin', () => {
  it('fires after a real signup, not after sign-in or an taken email', () => {
    expect(shouldProvisionJoin({ mode: 'signup', kind: 'password-signup', outcome: 'signedIn' })).toBe(true)
    expect(shouldProvisionJoin({ mode: 'signup', kind: 'password-signup', outcome: 'confirmEmail' })).toBe(true)
    expect(shouldProvisionJoin({ mode: 'signup', kind: 'password-signup', outcome: 'emailTaken' })).toBe(false)
    expect(shouldProvisionJoin({ mode: 'signup', kind: 'magic-otp' })).toBe(true)
    expect(shouldProvisionJoin({ mode: 'signin', kind: 'magic-otp' })).toBe(false)
    expect(shouldProvisionJoin({ mode: 'signin', kind: 'password-signup', outcome: 'signedIn' })).toBe(false)
  })
})

describe('upsertJoinProspect', () => {
  it('inserts a community row with the join tag', async () => {
    const db = mockDb()
    const out = await upsertJoinProspect(db, { email: 'dana@northgate.example' }, NOW)
    expect(out.kind).toBe('created')
    expect(out.kind === 'created' && out.addedTags).toEqual(['join'])
    const row = vi.mocked(db.insertProspect).mock.calls[0][0]
    expect(row).toMatchObject({
      email: 'dana@northgate.example',
      stage: 'community',
      source: JOIN_SOURCE,
      consent_basis: 'express',
    })
    expect(row.tags).toEqual([JOIN_TAG])
    expect(String(row.notes)).toContain('[2026-09-05] Join / signup')
    expect(row.full_name).toBe('dana')
  })

  it('does not notify the onboarding backstop when the join tag is already present', async () => {
    const db = mockDb({
      insertProspect: vi.fn(async () => ({ error: { code: PG_UNIQUE_VIOLATION } })),
      findProspectByEmail: vi.fn(async () => ({
        data: { id: 'p-1', notes: null, tags: ['join'], stage: 'community' },
        error: null,
      })),
    })
    const out = await upsertJoinProspect(db, { email: 'dana@northgate.example', user_id: 'u-1' }, NOW)
    expect(out.kind).toBe('updated')
    expect(shouldNotifyJoinBackstop(out)).toBe(false)
    expect(vi.mocked(db.updateProspect).mock.calls[0][1].user_id).toBe('u-1')
  })

  it('notifies the backstop when join is newly applied onto an existing lead', async () => {
    const db = mockDb({
      insertProspect: vi.fn(async () => ({ error: { code: PG_UNIQUE_VIOLATION } })),
      findProspectByEmail: vi.fn(async () => ({
        data: { id: 'p-1', notes: null, tags: ['book preorder'], stage: 'lead' },
        error: null,
      })),
    })
    const out = await upsertJoinProspect(db, { email: 'dana@northgate.example' }, NOW)
    expect(shouldNotifyJoinBackstop(out)).toBe(true)
    const patch = vi.mocked(db.updateProspect).mock.calls[0][1]
    expect(patch.tags).toEqual(['book preorder', 'join'])
    expect(patch.stage).toBe('community')
  })
})

describe('notifyJoinIfNew', () => {
  it('bells admins only when the join tag is new', async () => {
    const db = mockDb({
      listAdminIds: vi.fn(async () => ({ data: [{ id: 'a1' }], error: null })),
    })
    const fresh = await notifyJoinIfNew(
      db,
      { email: 'dana@northgate.example' },
      { kind: 'created', addedTags: ['join'] },
    )
    expect(fresh.notified).toBe(1)
    const row = vi.mocked(db.insertNotifications).mock.calls[0][0][0]
    expect(row).toMatchObject({
      user_id: 'a1',
      type: 'system_general',
      action_url: '/admin/crm',
      is_read: false,
    })
    expect(String(row.title)).toContain('Email: dana@northgate.example')
    expect(String(row.title)).not.toContain('—')
    expect(String(row.body)).not.toContain('—')

    vi.mocked(db.insertNotifications).mockClear()
    const again = await notifyJoinIfNew(
      db,
      { email: 'dana@northgate.example' },
      { kind: 'updated', addedTags: [] },
    )
    expect(again).toEqual({ notified: 0 })
    expect(db.insertNotifications).not.toHaveBeenCalled()
  })
})

describe('requestJoinProvision', () => {
  it('posts the email and keeps the request alive across navigation', async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response(null, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    try {
      await requestJoinProvision('dana@northgate.example')
      expect(fetchMock).toHaveBeenCalledTimes(1)
      const [url, init] = fetchMock.mock.calls[0]
      expect(url).toBe('/api/auth/provision')
      expect(init).toMatchObject({ method: 'POST', keepalive: true })
      expect(JSON.parse(String(init?.body))).toEqual({
        email: 'dana@northgate.example',
        website: '',
      })
      await requestJoinProvision('dana@northgate.example', 'http://spam.example')
      const honeypot = fetchMock.mock.calls[1]?.[1]
      expect(JSON.parse(String(honeypot?.body))).toEqual({
        email: 'dana@northgate.example',
        website: 'http://spam.example',
      })
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
