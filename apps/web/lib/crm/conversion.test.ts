import { describe, expect, it, vi } from 'vitest'
import {
  COMP_TAG,
  FRIEND_OF_GEORGE_TAG,
  PAID_TAG,
  paidNotificationCopy,
  redeemNotificationCopy,
  upsertPaidProspect,
  upsertRedeemProspect,
  upsertWelcomeProspect,
  welcomeNotificationCopy,
} from './conversion'
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

const PERSON = {
  email: 'friend@northgate.example',
  full_name: 'Dana Whitfield',
  user_id: 'user-9',
  tier: 'pro',
}

describe('conversion notification copy', () => {
  it('names each event without an em dash', () => {
    expect(welcomeNotificationCopy(PERSON).title).toBe(
      'Welcome claim: Email: friend@northgate.example · Tier: pro',
    )
    expect(redeemNotificationCopy(PERSON).title).toBe(
      'Comp redeemed: Email: friend@northgate.example · Tier: pro',
    )
    expect(paidNotificationCopy({ ...PERSON, tier: 'vip' }).title).toBe(
      'Paid checkout: Email: friend@northgate.example · Tier: vip',
    )
    expect(welcomeNotificationCopy(PERSON).title).not.toContain('—')
    expect(redeemNotificationCopy(PERSON).body).not.toContain('—')
    expect(paidNotificationCopy(PERSON).body).not.toContain('—')
  })
})

describe('upsertWelcomeProspect', () => {
  it('inserts friend of george + comp and promotes to professional', async () => {
    const db = mockDb()
    const out = await upsertWelcomeProspect(db, PERSON, NOW)
    expect(out.kind).toBe('created')
    const row = vi.mocked(db.insertProspect).mock.calls[0][0]
    expect(row.tags).toEqual([FRIEND_OF_GEORGE_TAG, COMP_TAG])
    expect(row.stage).toBe('professional')
    expect(row.source).toBe('welcome-claim')
    expect(row.user_id).toBe('user-9')
    expect(String(row.notes)).toContain('[2026-09-05] Welcome claim')
  })
})

describe('upsertRedeemProspect', () => {
  it('merges comp onto an existing row and does not demote professional', async () => {
    const db = mockDb({
      insertProspect: vi.fn(async () => ({ error: { code: PG_UNIQUE_VIOLATION } })),
      findProspectByEmail: vi.fn(async () => ({
        data: { id: 'p-1', notes: null, tags: ['join'], stage: 'professional' },
        error: null,
      })),
    })
    const out = await upsertRedeemProspect(db, { ...PERSON, tier: 'vip' }, NOW)
    expect(out).toMatchObject({ kind: 'updated', addedTags: ['comp'] })
    const patch = vi.mocked(db.updateProspect).mock.calls[0][1]
    expect(patch.tags).toEqual(['join', COMP_TAG])
    expect(patch).not.toHaveProperty('stage')
  })

  it('promotes a lead to the granted vip stage', async () => {
    const db = mockDb({
      insertProspect: vi.fn(async () => ({ error: { code: PG_UNIQUE_VIOLATION } })),
      findProspectByEmail: vi.fn(async () => ({
        data: { id: 'p-1', notes: null, tags: [], stage: 'lead' },
        error: null,
      })),
    })
    await upsertRedeemProspect(db, { ...PERSON, tier: 'vip' }, NOW)
    expect(vi.mocked(db.updateProspect).mock.calls[0][1].stage).toBe('vip')
  })
})

describe('upsertPaidProspect', () => {
  it('inserts the paid tag and maps pro to professional', async () => {
    const db = mockDb()
    const out = await upsertPaidProspect(db, PERSON, NOW)
    expect(out.kind).toBe('created')
    const row = vi.mocked(db.insertProspect).mock.calls[0][0]
    expect(row.tags).toEqual([PAID_TAG])
    expect(row.stage).toBe('professional')
    expect(row.source).toBe('stripe-checkout')
    expect(String(row.notes)).toContain('[2026-09-05] Paid checkout')
  })

  it('merges paid onto a join row without wiping tags', async () => {
    const db = mockDb({
      insertProspect: vi.fn(async () => ({ error: { code: PG_UNIQUE_VIOLATION } })),
      findProspectByEmail: vi.fn(async () => ({
        data: { id: 'p-1', notes: 'Joined last week.', tags: ['join'], stage: 'community' },
        error: null,
      })),
    })
    const out = await upsertPaidProspect(db, { ...PERSON, tier: 'vip' }, NOW)
    expect(out.kind).toBe('updated')
    if (out.kind !== 'updated') return
    expect(out.addedTags).toEqual(['paid'])
    const patch = vi.mocked(db.updateProspect).mock.calls[0][1]
    expect(patch.tags).toEqual(['join', 'paid'])
    expect(patch.stage).toBe('vip')
    expect(String(patch.notes).indexOf('Paid checkout')).toBeLessThan(
      String(patch.notes).indexOf('Joined last week.'),
    )
  })
})
