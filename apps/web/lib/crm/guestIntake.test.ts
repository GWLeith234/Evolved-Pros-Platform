import { describe, expect, it, vi } from 'vitest'
import {
  GUEST_SOURCE,
  PODCAST_GUEST_TAG,
  guestNotificationCopy,
  guestWriteFromSubmit,
  upsertGuestProspect,
} from './guestIntake'
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

const WRITE = {
  email: 'guest@studio.example',
  full_name: 'Pat Cole',
  user_id: 'user-1',
  company: 'Studio North',
  title: 'Host',
}

describe('guestWriteFromSubmit', () => {
  it('requires an email and prefers the submitted name', () => {
    expect(guestWriteFromSubmit({ email: null, full_name: 'Pat', user_id: 'u' })).toBeNull()
    expect(guestWriteFromSubmit({ email: '  ', full_name: 'Pat', user_id: 'u' })).toBeNull()
    expect(
      guestWriteFromSubmit({
        email: 'Pat@Studio.Example',
        full_name: 'Pat Cole',
        user_id: 'u-1',
        company: 'Studio North',
        title: 'Host',
      }),
    ).toEqual({
      email: 'pat@studio.example',
      full_name: 'Pat Cole',
      user_id: 'u-1',
      company: 'Studio North',
      title: 'Host',
    })
  })
})

describe('guestNotificationCopy', () => {
  it('lists name, email, company, and title without an em dash', () => {
    const copy = guestNotificationCopy(WRITE)
    expect(copy.title).toContain('Name: Pat Cole')
    expect(copy.title).toContain('Email: guest@studio.example')
    expect(copy.body).toContain('Company: Studio North')
    expect(copy.body).toContain('Title: Host')
    expect(copy.title).not.toContain('—')
  })
})

describe('upsertGuestProspect', () => {
  it('inserts a professional row with the podcast guest tag and user_id', async () => {
    const db = mockDb()
    const out = await upsertGuestProspect(db, WRITE, NOW)
    expect(out.kind).toBe('created')
    const row = vi.mocked(db.insertProspect).mock.calls[0][0]
    expect(row).toMatchObject({
      email: 'guest@studio.example',
      full_name: 'Pat Cole',
      user_id: 'user-1',
      company: 'Studio North',
      title: 'Host',
      source: GUEST_SOURCE,
      stage: 'professional',
    })
    expect(row.tags).toEqual([PODCAST_GUEST_TAG])
    expect(String(row.notes)).toContain('[2026-09-05] Podcast guest intake')
  })

  it('merges the tag and sets user_id on an existing lead', async () => {
    const db = mockDb({
      insertProspect: vi.fn(async () => ({ error: { code: PG_UNIQUE_VIOLATION } })),
      findProspectByEmail: vi.fn(async () => ({
        data: { id: 'p-1', notes: 'Prior', tags: ['join'], stage: 'community' },
        error: null,
      })),
    })
    const out = await upsertGuestProspect(db, WRITE, NOW)
    expect(out).toMatchObject({ kind: 'updated', addedTags: ['podcast guest'] })
    const patch = vi.mocked(db.updateProspect).mock.calls[0][1]
    expect(patch.tags).toEqual(['join', 'podcast guest'])
    expect(patch.user_id).toBe('user-1')
    expect(patch.stage).toBe('professional')
    expect(patch).not.toHaveProperty('consent_basis')
  })
})
