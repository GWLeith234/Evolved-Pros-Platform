import { describe, expect, it, vi } from 'vitest'
import {
  COMP_TAG,
  FRIEND_OF_GEORGE_TAG,
  JOIN_TAG,
  LIVE_INQUIRE_TAG,
  PAID_TAG,
  PG_UNIQUE_VIOLATION,
  PODCAST_GUEST_TAG,
  crmStageForTier,
  mergeTags,
  notifyIntakeAdmins,
  shouldPromoteStage,
  tagsNewlyAdded,
  upsertIntakeProspect,
  type IntakeDb,
  type IntakeProspectRow,
} from './intake'

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

describe('locked Phase B tags', () => {
  it('keeps the exact George-YES strings (lowercase, spaces intact)', () => {
    expect(LIVE_INQUIRE_TAG).toBe('live inquire')
    expect(JOIN_TAG).toBe('join')
    expect(PODCAST_GUEST_TAG).toBe('podcast guest')
    expect(FRIEND_OF_GEORGE_TAG).toBe('friend of george')
    expect(COMP_TAG).toBe('comp')
    expect(PAID_TAG).toBe('paid')
    expect(mergeTags([], [LIVE_INQUIRE_TAG, JOIN_TAG, PODCAST_GUEST_TAG])).toEqual([
      'live inquire',
      'join',
      'podcast guest',
    ])
    expect(mergeTags([], [FRIEND_OF_GEORGE_TAG, COMP_TAG, PAID_TAG])).toEqual([
      'friend of george',
      'comp',
      'paid',
    ])
  })
})

describe('mergeTags / tagsNewlyAdded', () => {
  it('dedupes and lowercases without reordering existing tags', () => {
    expect(mergeTags(['keynote', 'VIP'], ['live inquire', 'Keynote'])).toEqual([
      'keynote',
      'vip',
      'live inquire',
    ])
  })

  it('reports only tags that were not already present', () => {
    expect(tagsNewlyAdded(['join'], ['join', 'comp'])).toEqual(['comp'])
    expect(tagsNewlyAdded([], ['join'])).toEqual(['join'])
    expect(tagsNewlyAdded(['join'], ['join'])).toEqual([])
  })
})

describe('shouldPromoteStage / crmStageForTier', () => {
  it('promotes lead to community but never demotes professional', () => {
    expect(shouldPromoteStage('lead', 'community')).toBe(true)
    expect(shouldPromoteStage('prospect', 'community')).toBe(true)
    expect(shouldPromoteStage('community', 'community')).toBe(false)
    expect(shouldPromoteStage('vip', 'community')).toBe(false)
    expect(shouldPromoteStage('professional', 'vip')).toBe(false)
    expect(shouldPromoteStage('community', 'professional')).toBe(true)
  })

  it('maps users.tier pro onto the CRM professional stage', () => {
    expect(crmStageForTier('pro')).toBe('professional')
    expect(crmStageForTier('professional')).toBe('professional')
    expect(crmStageForTier('vip')).toBe('vip')
    expect(crmStageForTier('community')).toBe('community')
    expect(crmStageForTier(null)).toBe('lead')
  })
})

describe('upsertIntakeProspect', () => {
  it('inserts tags and reports them as added', async () => {
    const db = mockDb()
    const out = await upsertIntakeProspect(
      db,
      {
        email: 'dana@northgate.example',
        full_name: 'Dana Whitfield',
        source: 'join',
        tags: [JOIN_TAG],
        notesBlock: '[2026-09-05] Join / signup',
        stage: 'community',
      },
      NOW,
    )
    expect(out).toEqual({ kind: 'created', addedTags: ['join'] })
    expect(vi.mocked(db.insertProspect).mock.calls[0][0].tags).toEqual(['join'])
  })

  it('merges tags on conflict and promotes stage only when higher', async () => {
    const db = mockDb({
      insertProspect: vi.fn(async () => ({ error: { code: PG_UNIQUE_VIOLATION } })),
      findProspectByEmail: vi.fn(async () => ({
        data: {
          id: 'p-1',
          notes: 'Older',
          tags: ['book preorder'],
          stage: 'lead',
        },
        error: null,
      })),
    })
    const out = await upsertIntakeProspect(
      db,
      {
        email: 'dana@northgate.example',
        full_name: 'Dana Whitfield',
        source: 'join',
        tags: [JOIN_TAG],
        notesBlock: 'NEW',
        promoteStage: 'community',
      },
      NOW,
    )
    expect(out).toEqual({ kind: 'updated', addedTags: ['join'] })
    const patch = vi.mocked(db.updateProspect).mock.calls[0][1]
    expect(patch.tags).toEqual(['book preorder', 'join'])
    expect(patch.stage).toBe('community')
    expect(patch).not.toHaveProperty('consent_basis')
    expect(patch).not.toHaveProperty('source')
  })

  it('does not demote a professional row on join', async () => {
    const db = mockDb({
      insertProspect: vi.fn(async () => ({ error: { code: PG_UNIQUE_VIOLATION } })),
      findProspectByEmail: vi.fn(async () => ({
        data: { id: 'p-1', notes: null, tags: [], stage: 'professional' },
        error: null,
      })),
    })
    await upsertIntakeProspect(
      db,
      {
        email: 'dana@northgate.example',
        full_name: 'Dana',
        source: 'join',
        tags: [JOIN_TAG],
        notesBlock: 'NEW',
        promoteStage: 'community',
      },
      NOW,
    )
    expect(vi.mocked(db.updateProspect).mock.calls[0][1]).not.toHaveProperty('stage')
  })
})

describe('notifyIntakeAdmins', () => {
  it('fans system_general to every admin pointing at /admin/crm', async () => {
    const db = mockDb({
      listAdminIds: vi.fn(async () => ({ data: [{ id: 'a1' }, { id: 'a2' }], error: null })),
    })
    const out = await notifyIntakeAdmins(db, { title: 'New join: Email: a@b.co', body: 'Email: a@b.co' })
    expect(out.notified).toBe(2)
    expect(vi.mocked(db.insertNotifications).mock.calls[0][0][0]).toMatchObject({
      type: 'system_general',
      action_url: '/admin/crm',
      title: 'New join: Email: a@b.co',
    })
    expect(String(vi.mocked(db.insertNotifications).mock.calls[0][0][0].title)).not.toContain('—')
  })
})
