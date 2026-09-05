import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it, vi } from 'vitest'
import { AI_GEORGE_TAG as CRM_AI_GEORGE_TAG, normalizeTags, parseCrmProspect } from '@/lib/admin/crm'
import {
  AI_GEORGE_FALLBACK_NAME,
  AI_GEORGE_NOTIFY_TITLE,
  AI_GEORGE_SOURCE,
  AI_GEORGE_TAG,
  PG_UNIQUE_VIOLATION,
  aiGeorgeFieldLines,
  aiGeorgeNotificationCopy,
  buildAiGeorgeNotesBlock,
  mapConversationsPayload,
  notifyAdminsOfAiGeorgeLead,
  prependNotes,
  upsertAiGeorgeProspect,
  withAiGeorgeTag,
  type AiGeorgeDb,
  type CleanAiGeorgeLead,
  type ProspectRow,
} from './aiGeorge'

const NOW = new Date('2026-09-05T15:04:05.000Z')

const FIXTURE_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../../docs/fixtures/vendasta-conversations-ai-webhook.example.json',
)

function loadFixture(): Record<string, unknown> {
  return JSON.parse(readFileSync(FIXTURE_PATH, 'utf8')) as Record<string, unknown>
}

function clean(overrides: Partial<CleanAiGeorgeLead> = {}): CleanAiGeorgeLead {
  return {
    full_name: 'Alex Rivera',
    email: 'alex@example.com',
    sms: '+1 555 0100',
    company: 'Northgate Media',
    message: 'Asked about booking George for a sales kickoff in Q1.',
    contact_id: 'cnt_01EXAMPLE',
    ...overrides,
  }
}

function mockDb(overrides: Partial<AiGeorgeDb> = {}): AiGeorgeDb {
  return {
    insertProspect: vi.fn(async () => ({ data: { id: 'p-new' }, error: null })),
    findProspectByEmail: vi.fn(async () => ({ data: null as ProspectRow | null, error: null })),
    findProspectByPhone: vi.fn(async () => ({ data: null as ProspectRow | null, error: null })),
    updateProspect: vi.fn(async () => ({ error: null })),
    listAdminIds: vi.fn(async () => ({ data: [{ id: 'admin-1' }], error: null })),
    insertNotifications: vi.fn(async () => ({ error: null })),
    ...overrides,
  }
}

describe('mapConversationsPayload — fixture + aliases', () => {
  it('maps the sanitized fixture fields', () => {
    const res = mapConversationsPayload(loadFixture())
    expect(res.kind).toBe('ok')
    if (res.kind !== 'ok') return
    expect(res.value).toEqual(clean())
  })

  it('accepts camelCase / displayName aliases hypothesized from Vendasta docs', () => {
    const res = mapConversationsPayload({
      displayName: 'Pat Cole',
      emailAddress: 'Pat@Northgate.Example ',
      phoneNumber: '+1 555 0199',
      companyName: 'Cole Co',
      lastMessage: 'Ready to talk.',
      entityId: 'AG-1:CNT-9',
    })
    expect(res.kind).toBe('ok')
    if (res.kind !== 'ok') return
    expect(res.value.full_name).toBe('Pat Cole')
    expect(res.value.email).toBe('pat@northgate.example')
    expect(res.value.sms).toBe('+1 555 0199')
    expect(res.value.company).toBe('Cole Co')
    expect(res.value.message).toBe('Ready to talk.')
    expect(res.value.contact_id).toBe('AG-1:CNT-9')
  })

  it('joins first_name + last_name when name is absent', () => {
    const res = mapConversationsPayload({
      first_name: 'Ada',
      last_name: 'Lovelace',
      email: 'ada@example.com',
    })
    expect(res.kind).toBe('ok')
    if (res.kind !== 'ok') return
    expect(res.value.full_name).toBe('Ada Lovelace')
  })

  it('falls back to AI George lead when no name is present', () => {
    const res = mapConversationsPayload({ email: 'ada@example.com' })
    expect(res.kind).toBe('ok')
    if (res.kind !== 'ok') return
    expect(res.value.full_name).toBe(AI_GEORGE_FALLBACK_NAME)
  })

  it('accepts SMS-only payloads without inventing an email', () => {
    const res = mapConversationsPayload({ name: 'Sam', phone: '+1 555 0100' })
    expect(res.kind).toBe('ok')
    if (res.kind !== 'ok') return
    expect(res.value.email).toBeNull()
    expect(res.value.sms).toBe('+1 555 0100')
  })

  it('accepts email-only payloads', () => {
    const res = mapConversationsPayload({ name: 'Sam', email: 'sam@example.com' })
    expect(res.kind).toBe('ok')
    if (res.kind !== 'ok') return
    expect(res.value.sms).toBeNull()
  })

  it('ignores a bad email when a valid SMS is present', () => {
    const res = mapConversationsPayload({ email: 'not-an-email', phone: '+1 555 0100' })
    expect(res.kind).toBe('ok')
    if (res.kind !== 'ok') return
    expect(res.value.email).toBeNull()
    expect(res.value.sms).toBe('+1 555 0100')
  })

  it.each([
    ['neither identity', { name: 'Sam' }, 'Email or SMS is required.'],
    ['bad email only', { email: 'nope' }, 'A valid email address or SMS is required.'],
    ['bad sms only', { sms: 'call me' }, 'SMS must be a phone number.'],
    ['not an object', ['x'], 'Expected a flat JSON object.'],
  ])('rejects %s', (_label, body, error) => {
    const res = mapConversationsPayload(body)
    expect(res.kind).toBe('invalid')
    if (res.kind !== 'invalid') return
    expect(res.error).toBe(error)
    expect(res.error).not.toContain('—')
  })
})

describe('AI George tag lock', () => {
  it('is exactly AI George and never conversations-ai / external-api wording', () => {
    expect(AI_GEORGE_TAG).toBe('AI George')
    expect(AI_GEORGE_TAG).not.toBe('ai george')
    expect(AI_GEORGE_TAG).not.toContain('conversations-ai')
    expect(AI_GEORGE_TAG).not.toContain('external-api')
    expect(AI_GEORGE_SOURCE).toBe('ai-george')
    expect(withAiGeorgeTag([])).toEqual([AI_GEORGE_TAG])
    expect(withAiGeorgeTag(['vip', 'AI George'])).toEqual(['vip', 'AI George'])
    expect(withAiGeorgeTag(['ai george', 'vip'])).toEqual(['AI George', 'vip'])
  })

  it('survives CRM normalizeTags without losing the product casing', () => {
    expect(CRM_AI_GEORGE_TAG).toBe(AI_GEORGE_TAG)
    expect(normalizeTags(['AI George', 'vip'])).toEqual(['AI George', 'vip'])
    expect(normalizeTags(['ai george'])).toEqual(['AI George'])
  })

  it('keeps SMS-only prospects on the CRM board (null email still parses)', () => {
    const parsed = parseCrmProspect({
      id: 'p-sms',
      full_name: 'Sam',
      email: null,
      phone: '+1 555 0100',
      tags: ['AI George'],
      stage: 'lead',
      status: 'active',
      created_at: NOW.toISOString(),
      updated_at: NOW.toISOString(),
    })
    expect(parsed).not.toBeNull()
    expect(parsed?.email).toBe('')
    expect(parsed?.phone).toBe('+1 555 0100')
    expect(parsed?.tags).toEqual(['AI George'])
  })
})

describe('notification + notes copy', () => {
  it('locks the bell title and lists present fields as body lines', () => {
    const copy = aiGeorgeNotificationCopy(clean(), 'p-1')
    expect(copy.title).toBe(AI_GEORGE_NOTIFY_TITLE)
    expect(copy.body).toBe(
      'Name: Alex Rivera\nEmail: alex@example.com\nSMS: +1 555 0100\nCompany: Northgate Media',
    )
    expect(copy.actionUrl).toBe('/admin/crm?prospect=p-1')
    expect(copy.title).not.toContain('—')
    expect(copy.body).not.toContain('—')
    expect(copy.body).not.toContain('conversations-ai')
  })

  it('omits blank Email/SMS/Company without leaving empty labels', () => {
    const lines = aiGeorgeFieldLines(clean({ email: null, sms: null, company: null }))
    expect(lines.map(l => l.label)).toEqual(['Name'])
    const copy = aiGeorgeNotificationCopy(clean({ email: null, sms: '+1 555 0100', company: null }))
    expect(copy.body).toBe('Name: Alex Rivera\nSMS: +1 555 0100')
    expect(copy.actionUrl).toBe('/admin/crm')
  })

  it('dates the notes block and keeps contact id + message off the bell', () => {
    const block = buildAiGeorgeNotesBlock(clean(), NOW)
    expect(block).toContain('[2026-09-05] AI George')
    expect(block).toContain('Name: Alex Rivera · Email: alex@example.com')
    expect(block).toContain('Contact id: cnt_01EXAMPLE')
    expect(block).toContain('Asked about booking George')
    expect(block).not.toContain('—')
    expect(aiGeorgeNotificationCopy(clean()).body).not.toContain('Contact id')
    expect(aiGeorgeNotificationCopy(clean()).body).not.toContain('Asked about booking')
  })

  it('prepends the newest block above existing notes', () => {
    expect(prependNotes('Older note.', 'NEW')).toContain('NEW')
    expect(prependNotes('Older note.', 'NEW').indexOf('NEW')).toBeLessThan(
      prependNotes('Older note.', 'NEW').indexOf('Older note'),
    )
    expect(prependNotes(null, 'BLOCK')).toBe('BLOCK')
  })
})

describe('upsertAiGeorgeProspect — new contact', () => {
  it('inserts a lead with source ai-george, exact AI George tag, and SMS as phone', async () => {
    const db = mockDb()
    const out = await upsertAiGeorgeProspect(db, clean(), NOW)

    expect(out).toEqual({ kind: 'created', id: 'p-new' })
    const row = vi.mocked(db.insertProspect).mock.calls[0][0]
    expect(row).toMatchObject({
      email: 'alex@example.com',
      phone: '+1 555 0100',
      company: 'Northgate Media',
      stage: 'lead',
      status: 'active',
      source: AI_GEORGE_SOURCE,
      consent_basis: 'express',
      keynote_interest: false,
      enrichment_status: 'none',
      tags: [AI_GEORGE_TAG],
    })
    expect(row.tags).toEqual(['AI George'])
    expect(String(row.notes)).toContain('[2026-09-05] AI George')
  })

  it('inserts SMS-only rows with a null email instead of a placeholder', async () => {
    const db = mockDb()
    const out = await upsertAiGeorgeProspect(
      db,
      clean({ email: null, sms: '+1 555 0100' }),
      NOW,
    )
    expect(out).toEqual({ kind: 'created', id: 'p-new' })
    expect(db.findProspectByEmail).not.toHaveBeenCalled()
    expect(db.findProspectByPhone).toHaveBeenCalledWith('+1 555 0100')
    const row = vi.mocked(db.insertProspect).mock.calls[0][0]
    expect(row.email).toBeNull()
    expect(row.phone).toBe('+1 555 0100')
  })

  it('reports a non-conflict insert error by code', async () => {
    const db = mockDb({
      insertProspect: vi.fn(async () => ({ data: null, error: { code: '42501' } })),
    })
    expect(await upsertAiGeorgeProspect(db, clean(), NOW)).toEqual({
      kind: 'error',
      code: '42501',
    })
  })
})

describe('upsertAiGeorgeProspect — existing contact', () => {
  function existing(overrides: Partial<ProspectRow> = {}): ProspectRow {
    return {
      id: 'p-1',
      notes: 'Met at the Regina keynote.',
      phone: null,
      company: null,
      email: 'alex@example.com',
      tags: ['vip'],
      ...overrides,
    }
  }

  it('patches the existing email row and merges the product tag', async () => {
    const db = mockDb({
      findProspectByEmail: vi.fn(async () => ({ data: existing(), error: null })),
    })
    const out = await upsertAiGeorgeProspect(db, clean(), NOW)

    expect(out).toEqual({ kind: 'updated', id: 'p-1' })
    expect(db.insertProspect).not.toHaveBeenCalled()
    const [id, patch] = vi.mocked(db.updateProspect).mock.calls[0]
    expect(id).toBe('p-1')
    expect(patch.phone).toBe('+1 555 0100')
    expect(patch.company).toBe('Northgate Media')
    expect(patch.tags).toEqual(['vip', 'AI George'])
    expect(String(patch.notes).indexOf('AI George')).toBeLessThan(
      String(patch.notes).indexOf('Met at the Regina keynote.'),
    )
  })

  it('matches SMS-only repeats by phone', async () => {
    const db = mockDb({
      findProspectByPhone: vi.fn(async () => ({
        data: existing({ email: null, phone: '+1 555 0100', tags: [] }),
        error: null,
      })),
    })
    const out = await upsertAiGeorgeProspect(db, clean({ email: null }), NOW)
    expect(out).toEqual({ kind: 'updated', id: 'p-1' })
    expect(db.findProspectByEmail).not.toHaveBeenCalled()
    expect(db.insertProspect).not.toHaveBeenCalled()
  })

  it('fills a missing email on an SMS-only row when one arrives later', async () => {
    const db = mockDb({
      findProspectByEmail: vi.fn(async () => ({
        data: existing({ email: null, phone: '+1 555 0100' }),
        error: null,
      })),
    })
    await upsertAiGeorgeProspect(db, clean(), NOW)
    const patch = vi.mocked(db.updateProspect).mock.calls[0][1]
    expect(patch.email).toBe('alex@example.com')
  })

  it('NEVER overwrites stage, status, consent_basis or source on an existing prospect', async () => {
    const db = mockDb({
      findProspectByEmail: vi.fn(async () => ({ data: existing(), error: null })),
    })
    await upsertAiGeorgeProspect(db, clean(), NOW)
    const patch = vi.mocked(db.updateProspect).mock.calls[0][1]
    expect(patch).not.toHaveProperty('stage')
    expect(patch).not.toHaveProperty('status')
    expect(patch).not.toHaveProperty('consent_basis')
    expect(patch).not.toHaveProperty('source')
  })

  it('recovers from a 23505 race by updating the conflicting row', async () => {
    const db = mockDb({
      insertProspect: vi.fn(async () => ({ data: null, error: { code: PG_UNIQUE_VIOLATION } })),
      findProspectByEmail: vi
        .fn()
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: existing(), error: null }),
    })
    const out = await upsertAiGeorgeProspect(db, clean(), NOW)
    expect(out).toEqual({ kind: 'updated', id: 'p-1' })
    expect(db.updateProspect).toHaveBeenCalled()
  })
})

describe('notifyAdminsOfAiGeorgeLead', () => {
  it('inserts one system_general row per admin pointing at the CRM', async () => {
    const db = mockDb({
      listAdminIds: vi.fn(async () => ({ data: [{ id: 'a1' }, { id: 'a2' }], error: null })),
    })
    const out = await notifyAdminsOfAiGeorgeLead(db, clean(), 'p-1')

    expect(out.notified).toBe(2)
    const rows = vi.mocked(db.insertNotifications).mock.calls[0][0]
    expect(rows[0]).toMatchObject({
      user_id: 'a1',
      type: 'system_general',
      title: 'New AI George lead',
      action_url: '/admin/crm?prospect=p-1',
      is_read: false,
    })
    expect(String(rows[0].body)).toContain('Name: Alex Rivera')
    expect(String(rows[0].body)).toContain('Email: alex@example.com')
    expect(String(rows[0].body)).toContain('SMS: +1 555 0100')
    expect(String(rows[0].body)).toContain('Company: Northgate Media')
  })

  it('no-ops cleanly when there are no admins', async () => {
    const db = mockDb({ listAdminIds: vi.fn(async () => ({ data: [], error: null })) })
    expect(await notifyAdminsOfAiGeorgeLead(db, clean())).toEqual({ notified: 0 })
    expect(db.insertNotifications).not.toHaveBeenCalled()
  })

  it('reports failures by code rather than throwing', async () => {
    const db = mockDb({
      listAdminIds: vi.fn(async () => ({ data: null, error: { code: '42P01' } })),
    })
    expect(await notifyAdminsOfAiGeorgeLead(db, clean())).toEqual({
      notified: 0,
      code: '42P01',
    })
  })
})
