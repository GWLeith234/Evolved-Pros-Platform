import { describe, expect, it, vi } from 'vitest'
import { CANONICAL_ORIGIN } from '@/lib/seo/canonical'
import {
  BOOK_COVER_SRC,
  BOOK_IAB_SLOTS,
  BOOK_PREORDER_PATH,
  BOOK_PREORDER_SOURCE,
  BOOK_PREORDER_TAG,
  BOOK_PREORDER_UTM,
  PG_UNIQUE_VIOLATION,
  bookPreorderHref,
  bookPreorderPublicUrl,
  buildPreorderNotesBlock,
  isBookIabSlot,
  joinPreorderName,
  notifyPreorderAdmins,
  preorderNotificationCopy,
  prependNotes,
  upsertBookPreorderProspect,
  validatePreorder,
  withBookPreorderTag,
  type CleanPreorder,
  type PreorderDb,
  type ProspectRow,
} from './preorder'

const NOW = new Date('2026-09-01T15:04:05.000Z')

const GOOD = {
  first_name: 'Dana',
  last_name: 'Whitfield',
  email: 'Dana@Northgate.Example ',
  utm_source: 'house',
  utm_medium: 'display',
  utm_campaign: 'evolved-book',
  utm_content: '300x250',
}

function clean(overrides: Partial<CleanPreorder> = {}): CleanPreorder {
  return {
    full_name: 'Dana Whitfield',
    email: 'dana@northgate.example',
    utm_source: 'house',
    utm_medium: 'display',
    utm_campaign: 'evolved-book',
    utm_content: '300x250',
    ...overrides,
  }
}

function mockDb(overrides: Partial<PreorderDb> = {}): PreorderDb {
  return {
    insertProspect: vi.fn(async () => ({ error: null })),
    findProspectByEmail: vi.fn(async () => ({ data: null as ProspectRow | null, error: null })),
    updateProspect: vi.fn(async () => ({ error: null })),
    listAdminIds: vi.fn(async () => ({ data: [{ id: 'admin-1' }], error: null })),
    insertNotifications: vi.fn(async () => ({ error: null })),
    ...overrides,
  }
}

describe('public dest (CoS / IAB)', () => {
  it('locks the path to /evolved — not /book, not Amazon, not an ASIN', () => {
    expect(BOOK_PREORDER_PATH).toBe('/evolved')
    expect(BOOK_COVER_SRC).toBe('/ads/book-cover.png')
    for (const slot of BOOK_IAB_SLOTS) {
      const href = bookPreorderHref(slot)
      expect(href.startsWith('/evolved?')).toBe(true)
      expect(href).not.toContain('amazon')
      expect(href).not.toContain('B0GSL3VFY4')
      expect(href).not.toContain('/book')
      expect(href).not.toContain('/join')
      expect(href).not.toContain('/pricing')
    }
  })

  it('emits the exact house UTM contract George locked for the three IAB dests', () => {
    expect(BOOK_PREORDER_UTM).toEqual({
      utm_source: 'house',
      utm_medium: 'display',
      utm_campaign: 'evolved-book',
    })
    expect(bookPreorderHref('300x250')).toBe(
      '/evolved?utm_source=house&utm_medium=display&utm_campaign=evolved-book&utm_content=300x250',
    )
    expect(bookPreorderHref('728x90')).toBe(
      '/evolved?utm_source=house&utm_medium=display&utm_campaign=evolved-book&utm_content=728x90',
    )
    expect(bookPreorderHref('300x600')).toBe(
      '/evolved?utm_source=house&utm_medium=display&utm_campaign=evolved-book&utm_content=300x600',
    )
  })

  it('names www.evolvedpros.com — never platform', () => {
    for (const slot of BOOK_IAB_SLOTS) {
      const url = bookPreorderPublicUrl(slot)
      expect(url).toBe(`${CANONICAL_ORIGIN}${bookPreorderHref(slot)}`)
      expect(url.startsWith('https://www.evolvedpros.com/evolved?')).toBe(true)
      expect(url).not.toContain('platform.evolvedpros.com')
    }
  })

  it('accepts only the three IAB slots', () => {
    expect(isBookIabSlot('300x250')).toBe(true)
    expect(isBookIabSlot('728x90')).toBe(true)
    expect(isBookIabSlot('300x600')).toBe(true)
    expect(isBookIabSlot('300x50')).toBe(false)
    expect(isBookIabSlot('/evolved')).toBe(false)
  })
})

describe('BOOK_PREORDER_TAG', () => {
  it('is exactly the locked CRM tag, space and all', () => {
    expect(BOOK_PREORDER_TAG).toBe('book preorder')
    expect(BOOK_PREORDER_TAG).not.toBe('book-preorder')
    expect(BOOK_PREORDER_TAG).not.toBe('book_preorder')
    expect(BOOK_PREORDER_TAG).not.toBe('Book Preorder')
  })

  it('survives normalizeTags without losing the space or changing case', () => {
    expect(withBookPreorderTag([])).toEqual(['book preorder'])
    expect(withBookPreorderTag(['book preorder'])).toEqual(['book preorder'])
    expect(withBookPreorderTag(['Book Preorder', 'keynote'])).toEqual(['book preorder', 'keynote'])
  })

  it('merges onto existing tags without wiping or reordering them', () => {
    expect(withBookPreorderTag(['keynote', 'vip'])).toEqual(['keynote', 'vip', 'book preorder'])
    expect(withBookPreorderTag(['vip', 'book preorder', 'keynote'])).toEqual([
      'vip',
      'book preorder',
      'keynote',
    ])
  })

  it('treats a missing or junk tag list as empty rather than throwing', () => {
    expect(withBookPreorderTag(null)).toEqual(['book preorder'])
    expect(withBookPreorderTag(undefined)).toEqual(['book preorder'])
    expect(withBookPreorderTag('book preorder')).toEqual(['book preorder'])
    expect(withBookPreorderTag([1, '  ', 'Keynote'])).toEqual(['keynote', 'book preorder'])
  })
})

describe('joinPreorderName / validatePreorder', () => {
  it('joins first + last and normalizes the email', () => {
    const res = validatePreorder(GOOD)
    expect(res.kind).toBe('ok')
    if (res.kind !== 'ok') return
    expect(res.value.full_name).toBe('Dana Whitfield')
    expect(res.value.email).toBe('dana@northgate.example')
    expect(res.value.utm_content).toBe('300x250')
  })

  it('accepts a single full_name instead of first/last', () => {
    const res = validatePreorder({ full_name: 'Dana Whitfield', email: 'dana@northgate.example' })
    expect(res.kind).toBe('ok')
    if (res.kind !== 'ok') return
    expect(res.value.full_name).toBe('Dana Whitfield')
    expect(res.value.utm_source).toBeNull()
  })

  it('prefers full_name when both shapes are sent', () => {
    expect(joinPreorderName({ first_name: 'A', last_name: 'B', full_name: 'C D' })).toBe('C D')
  })

  it('accepts first name only', () => {
    const res = validatePreorder({ first_name: 'Dana', email: 'dana@northgate.example' })
    expect(res.kind).toBe('ok')
    if (res.kind !== 'ok') return
    expect(res.value.full_name).toBe('Dana')
  })

  it.each([
    ['missing name', { ...GOOD, first_name: '  ', last_name: '' }, 'Your name is required.'],
    ['missing email', { ...GOOD, email: '' }, 'A valid email address is required.'],
    ['malformed email', { ...GOOD, email: 'nope' }, 'A valid email address is required.'],
    ['no domain dot', { ...GOOD, email: 'a@b' }, 'A valid email address is required.'],
  ])('rejects %s', (_label, body, error) => {
    const res = validatePreorder(body)
    expect(res.kind).toBe('invalid')
    if (res.kind !== 'invalid') return
    expect(res.error).toBe(error)
  })

  it('does not require a phone', () => {
    const res = validatePreorder(GOOD)
    expect(res.kind).toBe('ok')
    if (res.kind !== 'ok') return
    expect(res.value).not.toHaveProperty('phone')
  })
})

describe('validatePreorder — honeypot', () => {
  it('flags a populated honeypot as a bot', () => {
    expect(validatePreorder({ ...GOOD, website: 'http://spam.example' }).kind).toBe('bot')
  })

  it('does not flag an empty or whitespace honeypot', () => {
    expect(validatePreorder({ ...GOOD, website: '' }).kind).toBe('ok')
    expect(validatePreorder({ ...GOOD, website: '   ' }).kind).toBe('ok')
    expect(validatePreorder(GOOD).kind).toBe('ok')
  })

  it('short-circuits before field validation', () => {
    expect(validatePreorder({ website: 'x' }).kind).toBe('bot')
  })
})

describe('buildPreorderNotesBlock / prependNotes', () => {
  it('dates the block and records UTM without inventing an Amazon URL', () => {
    const block = buildPreorderNotesBlock(clean(), NOW)
    expect(block).toBe(
      '[2026-09-01] Book preorder — utm_source=house · utm_medium=display · utm_campaign=evolved-book · utm_content=300x250',
    )
    expect(block).not.toContain('amazon')
    expect(block).not.toContain('B0GSL3VFY4')
  })

  it('omits the UTM suffix when none were sent', () => {
    const block = buildPreorderNotesBlock(
      clean({ utm_source: null, utm_medium: null, utm_campaign: null, utm_content: null }),
      NOW,
    )
    expect(block).toBe('[2026-09-01] Book preorder')
  })

  it('prepends the newest block above existing notes', () => {
    const merged = prependNotes('Older note from a past call.', 'NEW BLOCK')
    expect(merged.indexOf('NEW BLOCK')).toBeLessThan(merged.indexOf('Older note'))
  })
})

describe('upsertBookPreorderProspect — new contact', () => {
  it('inserts a lead with express consent and the exact book preorder tag', async () => {
    const db = mockDb()
    const out = await upsertBookPreorderProspect(db, clean(), NOW)

    expect(out).toEqual({ kind: 'created' })
    expect(db.findProspectByEmail).not.toHaveBeenCalled()
    const row = vi.mocked(db.insertProspect).mock.calls[0][0]
    expect(row).toMatchObject({
      email: 'dana@northgate.example',
      full_name: 'Dana Whitfield',
      stage: 'lead',
      status: 'active',
      source: BOOK_PREORDER_SOURCE,
      consent_basis: 'express',
      keynote_interest: false,
      enrichment_status: 'none',
    })
    expect(row.tags).toEqual(['book preorder'])
    expect(row.phone).toBeUndefined()
    expect(String(row.notes)).toContain('[2026-09-01] Book preorder')
  })

  it('reports a non-conflict insert error by code', async () => {
    const db = mockDb({ insertProspect: vi.fn(async () => ({ error: { code: '42501' } })) })
    expect(await upsertBookPreorderProspect(db, clean(), NOW)).toEqual({
      kind: 'error',
      code: '42501',
    })
  })
})

describe('upsertBookPreorderProspect — existing contact (23505 conflict)', () => {
  function conflictDb(existing: ProspectRow | null, extra: Partial<PreorderDb> = {}) {
    return mockDb({
      insertProspect: vi.fn(async () => ({ error: { code: PG_UNIQUE_VIOLATION } })),
      findProspectByEmail: vi.fn(async () => ({ data: existing, error: null })),
      ...extra,
    })
  }

  it('merges the book preorder tag onto existing tags without wiping them', async () => {
    const db = conflictDb({
      id: 'p-1',
      notes: 'Met at the Regina keynote.',
      tags: ['keynote', 'vip'],
    })
    const out = await upsertBookPreorderProspect(db, clean(), NOW)

    expect(out).toEqual({ kind: 'updated' })
    expect(db.findProspectByEmail).toHaveBeenCalledWith('dana@northgate.example')
    const [id, patch] = vi.mocked(db.updateProspect).mock.calls[0]
    expect(id).toBe('p-1')
    expect(patch.tags).toEqual(['keynote', 'vip', 'book preorder'])
    expect(patch.last_contacted_at).toBe(NOW.toISOString())
    expect(String(patch.notes)).toContain('Met at the Regina keynote.')
    expect(String(patch.notes).indexOf('Book preorder')).toBeLessThan(
      String(patch.notes).indexOf('Met at the Regina keynote.'),
    )
  })

  it('does not duplicate the tag when it is already on the row', async () => {
    const db = conflictDb({
      id: 'p-1',
      notes: null,
      tags: ['book preorder', 'keynote'],
    })
    await upsertBookPreorderProspect(db, clean(), NOW)
    const patch = vi.mocked(db.updateProspect).mock.calls[0][1]
    expect(patch.tags).toEqual(['book preorder', 'keynote'])
  })

  it('treats a null tags column as empty and still writes the locked tag', async () => {
    const db = conflictDb({ id: 'p-1', notes: null, tags: null })
    await upsertBookPreorderProspect(db, clean(), NOW)
    expect(vi.mocked(db.updateProspect).mock.calls[0][1].tags).toEqual(['book preorder'])
  })

  it('NEVER overwrites stage, status, consent_basis or source on an existing prospect', async () => {
    const db = conflictDb({ id: 'p-1', notes: null, tags: [] })
    await upsertBookPreorderProspect(db, clean(), NOW)
    const patch = vi.mocked(db.updateProspect).mock.calls[0][1]
    expect(patch).not.toHaveProperty('stage')
    expect(patch).not.toHaveProperty('status')
    expect(patch).not.toHaveProperty('consent_basis')
    expect(patch).not.toHaveProperty('source')
    expect(patch).not.toHaveProperty('email')
    expect(patch).not.toHaveProperty('phone')
  })

  it('handles a row deleted between the conflict and the lookup', async () => {
    const db = conflictDb(null)
    const out = await upsertBookPreorderProspect(db, clean(), NOW)
    expect(out).toEqual({ kind: 'error', code: 'not_found_after_conflict' })
    expect(db.updateProspect).not.toHaveBeenCalled()
  })

  it('reports a lookup failure by code', async () => {
    const db = mockDb({
      insertProspect: vi.fn(async () => ({ error: { code: PG_UNIQUE_VIOLATION } })),
      findProspectByEmail: vi.fn(async () => ({ data: null, error: { code: '08006' } })),
    })
    expect(await upsertBookPreorderProspect(db, clean(), NOW)).toEqual({
      kind: 'error',
      code: '08006',
    })
  })

  it('reports an update failure by code', async () => {
    const db = conflictDb(
      { id: 'p-1', notes: null, tags: [] },
      { updateProspect: vi.fn(async () => ({ error: { code: '23514' } })) },
    )
    expect(await upsertBookPreorderProspect(db, clean(), NOW)).toEqual({
      kind: 'error',
      code: '23514',
    })
  })
})

describe('notifyPreorderAdmins', () => {
  it('inserts one system_general notification per admin with name and email', async () => {
    const db = mockDb({
      listAdminIds: vi.fn(async () => ({ data: [{ id: 'a1' }, { id: 'a2' }], error: null })),
    })
    const out = await notifyPreorderAdmins(db, clean())

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
    expect(String(rows[0].body)).toContain('utm_source=house')
    expect(String(rows[0].title)).not.toContain('—')
    expect(String(rows[0].body)).not.toContain('—')
  })

  it('omits UTM from copy when none were sent', async () => {
    const copy = preorderNotificationCopy(
      clean({ utm_source: null, utm_medium: null, utm_campaign: null, utm_content: null }),
    )
    expect(copy.title).toBe('Book preorder: Name: Dana Whitfield · Email: dana@northgate.example')
    expect(copy.body).toBe('Name: Dana Whitfield · Email: dana@northgate.example')
    expect(copy.title).not.toContain('utm_')
  })

  it('no-ops cleanly when there are no admins', async () => {
    const db = mockDb({ listAdminIds: vi.fn(async () => ({ data: [], error: null })) })
    expect(await notifyPreorderAdmins(db, clean())).toEqual({ notified: 0 })
    expect(db.insertNotifications).not.toHaveBeenCalled()
  })
})
