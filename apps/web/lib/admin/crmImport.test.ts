import { describe, expect, it } from 'vitest'
import Papa from 'papaparse'
import {
  analyzeRows,
  autoMap,
  chunkRows,
  defaultSourceLabel,
  detectPreset,
  findHeaderRow,
  isValidEmail,
  mapRow,
  normalizeEmail,
  splitSheet,
} from './crmImport'

/** Parse a fixture the same way the wizard does — headerless, rows as arrays. */
function parse(csv: string): string[][] {
  return Papa.parse<string[]>(csv.trim(), { header: false, skipEmptyLines: false }).data
}

// Real LinkedIn Connections.csv shape: three preamble lines, then the header.
const LINKEDIN_CSV = `Notes:
"When exporting your connection data, you may notice that some of the email addresses are missing."
You can adjust your settings here: https://www.linkedin.com/psettings/
First Name,Last Name,URL,Email Address,Company,Position,Connected On
Ada,Lovelace,https://linkedin.com/in/ada,ADA@Example.com ,Analytical Engines,Chief Engineer,01 Jan 2026
Grace,Hopper,https://linkedin.com/in/grace,grace@example.com,US Navy,Rear Admiral,02 Jan 2026
Alan,Turing,https://linkedin.com/in/alan,,Bletchley,Cryptanalyst,03 Jan 2026
Ada,Lovelace,https://linkedin.com/in/ada2,ada@example.com,Analytical Engines,Chief Engineer,04 Jan 2026`

const GOOGLE_CSV = `Name,Given Name,Family Name,E-mail 1 - Value,Phone 1 - Value,Organization 1 - Name,Organization 1 - Title
,Katherine,Johnson,katherine@example.com,+1 555 0100,NASA,Mathematician
,Mary,Jackson,MARY@EXAMPLE.COM,,NASA,Engineer`

const GENERIC_CSV = `Full Name,Email,Company,Notes
Dorothy Vaughan,dorothy@example.com,NASA,Met at conference
Not An Email,nope,Acme,`

describe('findHeaderRow / splitSheet — LinkedIn preamble', () => {
  it('skips the 3-line preamble and finds the real header', () => {
    expect(findHeaderRow(parse(LINKEDIN_CSV))).toBe(3)
  })

  it('does not mistake preamble prose that mentions "email addresses" for a header', () => {
    // Regression: LinkedIn's own preamble contains the word email, so a naive
    // substring search picks line 1 instead of the real header on line 3.
    const rows = parse(LINKEDIN_CSV)
    expect(rows[1][0]).toContain('email addresses')
    expect(findHeaderRow(rows)).not.toBe(1)
  })

  it('returns header row 0 when there is no preamble', () => {
    expect(findHeaderRow(parse(GOOGLE_CSV))).toBe(0)
  })

  it('reports -1 when no email-ish header exists', () => {
    expect(findHeaderRow(parse('a,b,c\n1,2,3'))).toBe(-1)
  })

  it('will not treat a data row past the preamble window as a header', () => {
    const late = ['x', 'y', 'z', 'p', 'q'].map(v => [v]).concat([['Email Address']])
    expect(findHeaderRow(late, 3)).toBe(-1)
  })

  it('splits into header + data and drops blank trailing lines', () => {
    const sheet = splitSheet(parse(LINKEDIN_CSV + '\n\n'))
    expect(sheet).not.toBeNull()
    expect(sheet!.headers[0]).toBe('First Name')
    expect(sheet!.rows).toHaveLength(4)
  })

  it('strips a UTF-8 BOM from the first header', () => {
    const sheet = splitSheet(parse('﻿Email,Name\na@b.co,A'))
    expect(sheet!.headers[0]).toBe('Email')
  })
})

describe('detectPreset', () => {
  it('detects LinkedIn', () => {
    expect(detectPreset(splitSheet(parse(LINKEDIN_CSV))!.headers)).toBe('linkedin')
  })
  it('detects Google Contacts', () => {
    expect(detectPreset(splitSheet(parse(GOOGLE_CSV))!.headers)).toBe('google')
  })
  it('falls back to generic', () => {
    expect(detectPreset(splitSheet(parse(GENERIC_CSV))!.headers)).toBe('generic')
  })
})

describe('autoMap + mapRow — name concat', () => {
  it('concatenates LinkedIn First + Last into full_name', () => {
    const sheet = splitSheet(parse(LINKEDIN_CSV))!
    const mapping = autoMap(sheet.headers, 'linkedin')
    const row = mapRow(sheet.rows[0], mapping)
    expect(row.full_name).toBe('Ada Lovelace')
    expect(row.email).toBe('ada@example.com') // trimmed + lowercased
    expect(row.company).toBe('Analytical Engines')
    expect(row.title).toBe('Chief Engineer')
    expect(row.linkedin_url).toBe('https://linkedin.com/in/ada')
  })

  it('ignores unmapped columns such as Connected On', () => {
    const sheet = splitSheet(parse(LINKEDIN_CSV))!
    const mapping = autoMap(sheet.headers, 'linkedin')
    expect(mapping[sheet.headers.indexOf('Connected On')]).toBe('ignore')
  })

  it('concatenates Google Given + Family, skipping the blank Name column', () => {
    const sheet = splitSheet(parse(GOOGLE_CSV))!
    const row = mapRow(sheet.rows[0], autoMap(sheet.headers, 'google'))
    expect(row.full_name).toBe('Katherine Johnson')
    expect(row.phone).toBe('+1 555 0100')
    expect(row.company).toBe('NASA')
    expect(row.title).toBe('Mathematician')
  })

  it('maps a plain generic CSV by header name', () => {
    const sheet = splitSheet(parse(GENERIC_CSV))!
    const row = mapRow(sheet.rows[0], autoMap(sheet.headers, 'generic'))
    expect(row).toMatchObject({
      full_name: 'Dorothy Vaughan',
      email: 'dorothy@example.com',
      company: 'NASA',
      notes: 'Met at conference',
    })
  })

  it('honours a manual override of the auto-detected mapping', () => {
    const sheet = splitSheet(parse(GENERIC_CSV))!
    const mapping = autoMap(sheet.headers, 'generic')
    mapping[sheet.headers.indexOf('Notes')] = 'location'
    expect(mapRow(sheet.rows[0], mapping).location).toBe('Met at conference')
  })
})

describe('normalizeEmail / isValidEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  Ada@Example.COM ')).toBe('ada@example.com')
  })
  it('tolerates non-strings', () => {
    expect(normalizeEmail(undefined)).toBe('')
    expect(normalizeEmail(42)).toBe('')
  })
  it.each([
    ['ada@example.com', true],
    ['ADA@EXAMPLE.COM', true],
    ['first.last+tag@sub.example.co.uk', true],
    ['', false],
    ['nope', false],
    ['no@domain', false],
    ['two@@at.com', false],
    ['spaces in@example.com', false],
    ['trailing@dot.', false],
  ])('isValidEmail(%s) === %s', (input, expected) => {
    expect(isValidEmail(input)).toBe(expected)
  })
})

describe('analyzeRows — in-file dedupe + validity', () => {
  it('counts invalid emails and case-insensitive in-file duplicates', () => {
    const sheet = splitSheet(parse(LINKEDIN_CSV))!
    const mapping = autoMap(sheet.headers, 'linkedin')
    const result = analyzeRows(sheet.rows.map(r => mapRow(r, mapping)))

    expect(result.total).toBe(4)
    // Turing has no email address in the export.
    expect(result.invalid).toBe(1)
    // 'ADA@Example.com ' and 'ada@example.com' are the same person.
    expect(result.duplicatesInFile).toBe(1)
    expect(result.valid.map(r => r.email)).toEqual(['ada@example.com', 'grace@example.com'])
  })

  it('keeps the FIRST occurrence of a duplicate, not the last', () => {
    const sheet = splitSheet(parse(LINKEDIN_CSV))!
    const result = analyzeRows(sheet.rows.map(r => mapRow(r, autoMap(sheet.headers, 'linkedin'))))
    expect(result.valid[0].linkedin_url).toBe('https://linkedin.com/in/ada')
  })

  it('normalizes Google emails to lowercase before deduping', () => {
    const sheet = splitSheet(parse(GOOGLE_CSV))!
    const result = analyzeRows(sheet.rows.map(r => mapRow(r, autoMap(sheet.headers, 'google'))))
    expect(result.valid.map(r => r.email)).toEqual(['katherine@example.com', 'mary@example.com'])
  })

  it('drops a row whose email is malformed', () => {
    const sheet = splitSheet(parse(GENERIC_CSV))!
    const result = analyzeRows(sheet.rows.map(r => mapRow(r, autoMap(sheet.headers, 'generic'))))
    expect(result.invalid).toBe(1)
    expect(result.valid).toHaveLength(1)
  })

  it('falls back to the email as full_name when the name is blank', () => {
    const result = analyzeRows([{ full_name: '', email: 'noname@example.com' }])
    expect(result.valid[0].full_name).toBe('noname@example.com')
  })
})

describe('defaultSourceLabel / chunkRows', () => {
  it('builds a dated preset label', () => {
    expect(defaultSourceLabel('linkedin', new Date('2026-08-16T12:00:00Z'))).toBe('linkedin-2026-08')
    expect(defaultSourceLabel('generic', new Date('2026-01-05T12:00:00Z'))).toBe('csv-import-2026-01')
  })

  it('chunks to the batch size with a partial final batch', () => {
    const chunks = chunkRows(Array.from({ length: 1001 }, (_, i) => i), 500)
    expect(chunks.map(c => c.length)).toEqual([500, 500, 1])
  })

  it('returns no chunks for an empty list', () => {
    expect(chunkRows([], 500)).toEqual([])
  })
})
