import { describe, expect, it, vi } from 'vitest'
import {
  PG_UNIQUE_VIOLATION,
  buildNotesBlock,
  clientIpFrom,
  createRateLimiter,
  formatEventDate,
  inquiryFieldLines,
  inquiryFieldSummary,
  inquiryNotificationCopy,
  LIVE_INQUIRE_TAG,
  notifyAdmins,
  prependNotes,
  upsertKeynoteProspect,
  validateInquiry,
  withLiveInquireTag,
  type CleanInquiry,
  type InquiryDb,
  type ProspectRow,
} from './inquiry'

const NOW = new Date('2026-08-16T15:04:05.000Z')

const GOOD = {
  name: 'Dana Whitfield',
  email: 'Dana@Northgate.Example ',
  event_date: '2027-03-12',
  sms: '+1 555 0100',
  company: 'Northgate Media',
}

function clean(overrides: Partial<CleanInquiry> = {}): CleanInquiry {
  return {
    full_name: 'Dana Whitfield',
    email: 'dana@northgate.example',
    event_date: '2027-03-12',
    sms: '+1 555 0100',
    company: 'Northgate Media',
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
    expect(res.value.event_date).toBe('2027-03-12')
    expect(res.value.sms).toBe('+1 555 0100')
    expect(res.value.company).toBe('Northgate Media')
  })

  it('accepts full_name as an alias for name', () => {
    const res = validateInquiry({ ...GOOD, name: undefined, full_name: 'Pat Cole' })
    expect(res.kind).toBe('ok')
    if (res.kind !== 'ok') return
    expect(res.value.full_name).toBe('Pat Cole')
  })

  it('treats blank optional fields as null rather than empty strings', () => {
    const res = validateInquiry({ ...GOOD, company: '   ', event_date: '', sms: undefined })
    expect(res.kind).toBe('ok')
    if (res.kind !== 'ok') return
    expect(res.value.company).toBeNull()
    expect(res.value.event_date).toBeNull()
    expect(res.value.sms).toBeNull()
  })

  it('does not require a message or event name', () => {
    expect(validateInquiry({ name: 'Ada', email: 'ada@example.com' }).kind).toBe('ok')
  })

  it.each([
    ['missing name', { ...GOOD, name: '  ' }, 'Name is required.'],
    ['missing email', { ...GOOD, email: '' }, 'A valid email address is required.'],
    ['malformed email', { ...GOOD, email: 'nope' }, 'A valid email address is required.'],
    ['no domain dot', { ...GOOD, email: 'a@b' }, 'A valid email address is required.'],
    ['bad date', { ...GOOD, event_date: '2027-13-40' }, 'Date of event must be a real calendar date.'],
    ['not a date', { ...GOOD, event_date: 'Q1 2027' }, 'Date of event must be a real calendar date.'],
    ['bad sms', { ...GOOD, sms: 'call me' }, 'SMS must be a phone number.'],
  ])('rejects %s', (_label, body, error) => {
    const res = validateInquiry(body)
    expect(res.kind).toBe('invalid')
    if (res.kind !== 'invalid') return
    expect(res.error).toBe(error)
  })

  it('ignores non-string field types rather than throwing', () => {
    const res = validateInquiry({ name: 42, email: null, sms: [] })
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

describe('inquiryFieldLines / notification copy', () => {
  it('includes Name, Email, Date of event, SMS, and Company when present', () => {
    const lines = inquiryFieldLines(clean())
    expect(lines.map(l => l.label)).toEqual(['Name', 'Email', 'Date of event', 'SMS', 'Company'])
    expect(inquiryFieldSummary(clean())).toContain('Name: Dana Whitfield')
    expect(inquiryFieldSummary(clean())).toContain('Email: dana@northgate.example')
    expect(inquiryFieldSummary(clean())).toContain('Date of event: Mar 12, 2027')
    expect(inquiryFieldSummary(clean())).toContain('SMS: +1 555 0100')
    expect(inquiryFieldSummary(clean())).toContain('Company: Northgate Media')
  })

  it('omits blank optionals without leaving empty labels', () => {
    const summary = inquiryFieldSummary(clean({ event_date: null, sms: null, company: null }))
    expect(summary).toBe('Name: Dana Whitfield · Email: dana@northgate.example')
    expect(summary).not.toContain('Date of event')
    expect(summary).not.toContain('SMS')
    expect(summary).not.toContain('Company')
  })

  it('puts the same field summary on title and body so the bell shows all five', () => {
    const copy = inquiryNotificationCopy(clean())
    expect(copy.title.startsWith('Booking inquiry: ')).toBe(true)
    expect(copy.title).toContain('Name: Dana Whitfield')
    expect(copy.title).toContain('Email: dana@northgate.example')
    expect(copy.body).toBe(inquiryFieldSummary(clean()))
    expect(copy.title).not.toContain('—')
    expect(copy.body).not.toContain('—')
  })

  it('formats a date-only value without timezone shift', () => {
    expect(formatEventDate('2027-03-12')).toBe('Mar 12, 2027')
  })
})

describe('buildNotesBlock / prependNotes', () => {
  it('dates the block and includes the five filled fields', () => {
    const block = buildNotesBlock(clean(), NOW)
    expect(block).toContain('[2026-08-16] Booking inquiry')
    expect(block).toContain('Name: Dana Whitfield')
    expect(block).toContain('Date of event: Mar 12, 2027')
    expect(block).toContain('SMS: +1 555 0100')
    expect(block).toContain('Company: Northgate Media')
    expect(block).not.toContain('—')
  })

  it('omits absent metadata without leaving a dangling separator', () => {
    const block = buildNotesBlock(clean({ event_date: null, sms: null, company: null }), NOW)
    expect(block.split('\n')[1]).toBe('Name: Dana Whitfield · Email: dana@northgate.example')
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

describe('upsertKeynoteProspect — new contact', () => {
  it('inserts a keynote-interested lead with express consent and SMS as phone', async () => {
    const db = mockDb()
    const out = await upsertKeynoteProspect(db, clean(), NOW)

    expect(out).toEqual({ kind: 'created' })
    expect(db.findProspectByEmail).not.toHaveBeenCalled()
    const row = vi.mocked(db.insertProspect).mock.calls[0][0]
    expect(row).toMatchObject({
      email: 'dana@northgate.example',
      phone: '+1 555 0100',
      company: 'Northgate Media',
      stage: 'lead',
      status: 'active',
      keynote_interest: true,
      consent_basis: 'express',
      source: 'keynote-inquiry',
      enrichment_status: 'none',
    })
    expect(row.tags).toEqual([LIVE_INQUIRE_TAG])
    expect(LIVE_INQUIRE_TAG).toBe('live inquire')
    expect(withLiveInquireTag([])).toEqual(['live inquire'])
    expect(String(row.notes)).toContain('[2026-08-16] Booking inquiry')
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
    const db = conflictDb({
      id: 'p-1',
      notes: 'Met at the Regina keynote.',
      phone: null,
      company: null,
      tags: ['keynote'],
    })
    const out = await upsertKeynoteProspect(db, clean(), NOW)

    expect(out).toEqual({ kind: 'updated' })
    expect(db.findProspectByEmail).toHaveBeenCalledWith('dana@northgate.example')
    const [id, patch] = vi.mocked(db.updateProspect).mock.calls[0]
    expect(id).toBe('p-1')
    expect(patch.keynote_interest).toBe(true)
    expect(patch.phone).toBe('+1 555 0100')
    expect(patch.company).toBe('Northgate Media')
    expect(patch.tags).toEqual(['keynote', 'live inquire'])
    expect(patch.last_contacted_at).toBe(NOW.toISOString())
    expect(String(patch.notes)).toContain('Met at the Regina keynote.')
    expect(String(patch.notes).indexOf('Booking inquiry')).toBeLessThan(
      String(patch.notes).indexOf('Met at the Regina keynote.'),
    )
  })

  it('writes the live inquire tag on update when the existing row had none', async () => {
    const db = conflictDb({ id: 'p-1', notes: null, phone: null, company: null, tags: [] })
    await upsertKeynoteProspect(db, clean(), NOW)
    expect(vi.mocked(db.updateProspect).mock.calls[0][1].tags).toEqual(['live inquire'])
  })

  it('does not blank phone or company when those fields were omitted', async () => {
    const db = conflictDb({
      id: 'p-1',
      notes: null,
      phone: '204-555-0100',
      company: 'Existing Co',
    })
    await upsertKeynoteProspect(db, clean({ sms: null, company: null }), NOW)
    const patch = vi.mocked(db.updateProspect).mock.calls[0][1]
    expect(patch).not.toHaveProperty('phone')
    expect(patch).not.toHaveProperty('company')
  })

  it('NEVER overwrites stage, status or consent_basis on an existing prospect', async () => {
    const db = conflictDb({ id: 'p-1', notes: null, phone: null, company: null })
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
    const db = conflictDb({ id: 'p-1', notes: null, phone: null, company: null }, {
      updateProspect: vi.fn(async () => ({ error: { code: '23514' } })),
    })
    expect(await upsertKeynoteProspect(db, clean(), NOW)).toEqual({ kind: 'error', code: '23514' })
  })
})

describe('notifyAdmins', () => {
  it('inserts one notification per admin pointing at the CRM with all five fields', async () => {
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
      action_url: '/admin/crm',
      is_read: false,
    })
    expect(String(rows[0].title)).toContain('Name: Dana Whitfield')
    expect(String(rows[0].title)).toContain('Email: dana@northgate.example')
    expect(String(rows[0].body)).toContain('Date of event: Mar 12, 2027')
    expect(String(rows[0].body)).toContain('SMS: +1 555 0100')
    expect(String(rows[0].body)).toContain('Company: Northgate Media')
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
