import { describe, expect, it, vi } from 'vitest'
import {
  INQUIRY_MESSAGE_MAX,
  PG_UNIQUE_VIOLATION,
  buildNotesBlock,
  clientIpFrom,
  createRateLimiter,
  inquiryLabel,
  notifyAdmins,
  prependNotes,
  upsertKeynoteProspect,
  validateInquiry,
  type CleanInquiry,
  type InquiryDb,
  type ProspectRow,
} from './inquiry'

const NOW = new Date('2026-08-16T15:04:05.000Z')

const GOOD = {
  full_name: 'Dana Whitfield',
  email: 'Dana@Northgate.Example ',
  company: 'Northgate Media',
  event_name: 'Northgate Summit',
  event_timeframe: 'Q1 2027',
  message: 'We want a closing keynote for 400 sales leaders.',
}

function clean(overrides: Partial<CleanInquiry> = {}): CleanInquiry {
  return {
    full_name: 'Dana Whitfield',
    email: 'dana@northgate.example',
    company: 'Northgate Media',
    event_name: 'Northgate Summit',
    event_timeframe: 'Q1 2027',
    message: 'We want a closing keynote.',
    ...overrides,
  }
}

/** Mock DB port. Each method is a spy so call shapes can be asserted. */
function mockDb(overrides: Partial<InquiryDb> = {}): InquiryDb {
  return {
    insertProspect: vi.fn(async () => ({ error: null })),
    findProspectByEmail: vi.fn(async () => ({ data: null as ProspectRow | null, error: null })),
    updateProspect: vi.fn(async () => ({ error: null })),
    listAdminIds: vi.fn(async () => ({ data: [{ id: 'admin-1' }], error: null })),
    insertNotifications: vi.fn(async () => ({ error: null })),
    ...overrides,
  }
}

describe('validateInquiry', () => {
  it('accepts a complete inquiry and normalizes the email', () => {
    const res = validateInquiry(GOOD)
    expect(res.kind).toBe('ok')
    if (res.kind !== 'ok') return
    expect(res.value.email).toBe('dana@northgate.example')
    expect(res.value.full_name).toBe('Dana Whitfield')
    expect(res.value.event_timeframe).toBe('Q1 2027')
  })

  it('treats blank optional fields as null rather than empty strings', () => {
    const res = validateInquiry({ ...GOOD, company: '   ', event_name: '', event_timeframe: undefined })
    expect(res.kind).toBe('ok')
    if (res.kind !== 'ok') return
    expect(res.value.company).toBeNull()
    expect(res.value.event_name).toBeNull()
    expect(res.value.event_timeframe).toBeNull()
  })

  it.each([
    ['missing name', { ...GOOD, full_name: '  ' }, 'Your name is required.'],
    ['missing email', { ...GOOD, email: '' }, 'A valid email address is required.'],
    ['malformed email', { ...GOOD, email: 'nope' }, 'A valid email address is required.'],
    ['no domain dot', { ...GOOD, email: 'a@b' }, 'A valid email address is required.'],
    ['missing message', { ...GOOD, message: '   ' }, 'Tell us a little about the event.'],
  ])('rejects %s', (_label, body, error) => {
    const res = validateInquiry(body)
    expect(res.kind).toBe('invalid')
    if (res.kind !== 'invalid') return
    expect(res.error).toBe(error)
  })

  it('rejects an over-long message instead of silently truncating it', () => {
    const res = validateInquiry({ ...GOOD, message: 'x'.repeat(INQUIRY_MESSAGE_MAX + 1) })
    expect(res.kind).toBe('invalid')
    if (res.kind !== 'invalid') return
    expect(res.error).toContain('too long')
  })

  it('accepts a message exactly at the limit', () => {
    expect(validateInquiry({ ...GOOD, message: 'x'.repeat(INQUIRY_MESSAGE_MAX) }).kind).toBe('ok')
  })

  it('ignores non-string field types rather than throwing', () => {
    const res = validateInquiry({ full_name: 42, email: null, message: [] })
    expect(res.kind).toBe('invalid')
  })
})

describe('validateInquiry — honeypot', () => {
  it('flags a populated honeypot as a bot', () => {
    expect(validateInquiry({ ...GOOD, website: 'http://spam.example' }).kind).toBe('bot')
  })

  it('does not flag an empty or whitespace honeypot', () => {
    expect(validateInquiry({ ...GOOD, website: '' }).kind).toBe('ok')
    expect(validateInquiry({ ...GOOD, website: '   ' }).kind).toBe('ok')
    expect(validateInquiry(GOOD).kind).toBe('ok')
  })

  it('short-circuits before field validation — a bot with junk fields is still a bot', () => {
    expect(validateInquiry({ website: 'x' }).kind).toBe('bot')
  })
})

describe('buildNotesBlock / prependNotes', () => {
  it('dates the block and includes event, timeframe and company', () => {
    const block = buildNotesBlock(clean(), NOW)
    expect(block).toContain('[2026-08-16] Keynote inquiry')
    expect(block).toContain('Event: Northgate Summit')
    expect(block).toContain('Timeframe: Q1 2027')
    expect(block).toContain('Company: Northgate Media')
    expect(block).toContain('We want a closing keynote.')
  })

  it('omits absent metadata without leaving a dangling separator', () => {
    const block = buildNotesBlock(clean({ event_name: null, event_timeframe: null, company: null }), NOW)
    expect(block.split('\n')[0]).toBe('[2026-08-16] Keynote inquiry')
  })

  it('prepends the newest block above existing notes', () => {
    const merged = prependNotes('Older note from a past call.', 'NEW BLOCK')
    expect(merged.indexOf('NEW BLOCK')).toBeLessThan(merged.indexOf('Older note'))
  })

  it('returns just the block when there are no existing notes', () => {
    expect(prependNotes(null, 'BLOCK')).toBe('BLOCK')
    expect(prependNotes('   ', 'BLOCK')).toBe('BLOCK')
  })
})

describe('inquiryLabel', () => {
  it('prefers event, then company, then name', () => {
    expect(inquiryLabel(clean())).toBe('Northgate Summit')
    expect(inquiryLabel(clean({ event_name: null }))).toBe('Northgate Media')
    expect(inquiryLabel(clean({ event_name: null, company: null }))).toBe('Dana Whitfield')
  })
})

describe('upsertKeynoteProspect — new contact', () => {
  it('inserts a keynote-interested lead with express consent', async () => {
    const db = mockDb()
    const out = await upsertKeynoteProspect(db, clean(), NOW)

    expect(out).toEqual({ kind: 'created' })
    expect(db.findProspectByEmail).not.toHaveBeenCalled()
    const row = vi.mocked(db.insertProspect).mock.calls[0][0]
    expect(row).toMatchObject({
      email: 'dana@northgate.example',
      stage: 'lead',
      status: 'active',
      keynote_interest: true,
      consent_basis: 'express',
      source: 'keynote-inquiry',
      enrichment_status: 'none',
    })
    expect(String(row.notes)).toContain('[2026-08-16] Keynote inquiry')
  })

  it('reports a non-conflict insert error by code', async () => {
    const db = mockDb({ insertProspect: vi.fn(async () => ({ error: { code: '42501' } })) })
    expect(await upsertKeynoteProspect(db, clean(), NOW)).toEqual({ kind: 'error', code: '42501' })
  })
})

describe('upsertKeynoteProspect — existing contact (23505 conflict)', () => {
  function conflictDb(existing: ProspectRow | null, extra: Partial<InquiryDb> = {}) {
    return mockDb({
      insertProspect: vi.fn(async () => ({ error: { code: PG_UNIQUE_VIOLATION } })),
      findProspectByEmail: vi.fn(async () => ({ data: existing, error: null })),
      ...extra,
    })
  }

  it('patches the existing row instead of failing', async () => {
    const db = conflictDb({ id: 'p-1', notes: 'Met at the Regina keynote.' })
    const out = await upsertKeynoteProspect(db, clean(), NOW)

    expect(out).toEqual({ kind: 'updated' })
    expect(db.findProspectByEmail).toHaveBeenCalledWith('dana@northgate.example')
    const [id, patch] = vi.mocked(db.updateProspect).mock.calls[0]
    expect(id).toBe('p-1')
    expect(patch.keynote_interest).toBe(true)
    expect(patch.last_contacted_at).toBe(NOW.toISOString())
    expect(String(patch.notes)).toContain('Met at the Regina keynote.')
    expect(String(patch.notes).indexOf('Keynote inquiry')).toBeLessThan(
      String(patch.notes).indexOf('Met at the Regina keynote.'),
    )
  })

  it('NEVER overwrites stage, status or consent_basis on an existing prospect', async () => {
    const db = conflictDb({ id: 'p-1', notes: null })
    await upsertKeynoteProspect(db, clean(), NOW)
    const patch = vi.mocked(db.updateProspect).mock.calls[0][1]
    expect(patch).not.toHaveProperty('stage')
    expect(patch).not.toHaveProperty('status')
    expect(patch).not.toHaveProperty('consent_basis')
    expect(patch).not.toHaveProperty('email')
  })

  it('handles a row deleted between the conflict and the lookup', async () => {
    const db = conflictDb(null)
    const out = await upsertKeynoteProspect(db, clean(), NOW)
    expect(out).toEqual({ kind: 'error', code: 'not_found_after_conflict' })
    expect(db.updateProspect).not.toHaveBeenCalled()
  })

  it('reports a lookup failure by code', async () => {
    const db = mockDb({
      insertProspect: vi.fn(async () => ({ error: { code: PG_UNIQUE_VIOLATION } })),
      findProspectByEmail: vi.fn(async () => ({ data: null, error: { code: '08006' } })),
    })
    expect(await upsertKeynoteProspect(db, clean(), NOW)).toEqual({ kind: 'error', code: '08006' })
  })

  it('reports an update failure by code', async () => {
    const db = conflictDb({ id: 'p-1', notes: null }, {
      updateProspect: vi.fn(async () => ({ error: { code: '23514' } })),
    })
    expect(await upsertKeynoteProspect(db, clean(), NOW)).toEqual({ kind: 'error', code: '23514' })
  })
})

describe('notifyAdmins', () => {
  it('inserts one notification per admin pointing at the CRM', async () => {
    const db = mockDb({
      listAdminIds: vi.fn(async () => ({ data: [{ id: 'a1' }, { id: 'a2' }], error: null })),
    })
    const out = await notifyAdmins(db, clean())

    expect(out.notified).toBe(2)
    const rows = vi.mocked(db.insertNotifications).mock.calls[0][0]
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      user_id: 'a1',
      type: 'system_general',
      title: 'Keynote inquiry: Northgate Summit',
      action_url: '/admin/crm',
      is_read: false,
    })
  })

  it('no-ops cleanly when there are no admins', async () => {
    const db = mockDb({ listAdminIds: vi.fn(async () => ({ data: [], error: null })) })
    expect(await notifyAdmins(db, clean())).toEqual({ notified: 0 })
    expect(db.insertNotifications).not.toHaveBeenCalled()
  })

  it('reports failures by code rather than throwing', async () => {
    const db = mockDb({ listAdminIds: vi.fn(async () => ({ data: null, error: { code: '42P01' } })) })
    expect(await notifyAdmins(db, clean())).toEqual({ notified: 0, code: '42P01' })
  })
})

describe('createRateLimiter', () => {
  it('allows up to max within the window and blocks the next', () => {
    const rl = createRateLimiter(5, 600_000)
    const t = 1_000_000
    for (let i = 0; i < 5; i++) expect(rl.check('1.2.3.4', t + i)).toBe(true)
    expect(rl.check('1.2.3.4', t + 5)).toBe(false)
  })

  it('tracks each key independently', () => {
    const rl = createRateLimiter(1, 600_000)
    expect(rl.check('a', 1000)).toBe(true)
    expect(rl.check('a', 1001)).toBe(false)
    expect(rl.check('b', 1002)).toBe(true)
  })

  it('lets the caller through again once the window rolls off', () => {
    const rl = createRateLimiter(2, 10_000)
    expect(rl.check('ip', 0)).toBe(true)
    expect(rl.check('ip', 1)).toBe(true)
    expect(rl.check('ip', 2)).toBe(false)
    expect(rl.check('ip', 10_002)).toBe(true)
  })
})

describe('clientIpFrom', () => {
  it('takes the first hop of x-forwarded-for', () => {
    expect(clientIpFrom(new Headers({ 'x-forwarded-for': '203.0.113.9, 10.0.0.1' }))).toBe('203.0.113.9')
  })
  it('falls back to x-real-ip, then unknown', () => {
    expect(clientIpFrom(new Headers({ 'x-real-ip': '198.51.100.7' }))).toBe('198.51.100.7')
    expect(clientIpFrom(new Headers())).toBe('unknown')
  })
})
