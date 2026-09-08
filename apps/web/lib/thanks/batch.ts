import Papa from 'papaparse'
import {
  classifyRecipient,
  isValidThanksEmail,
  normalizeThanksEmail,
  type FogInviteSnapshot,
  type MemberSnapshot,
  type PreviewDisposition,
} from './eligibility'

export type ThanksBatchRow = {
  email: string
  firstName: string
  disposition: PreviewDisposition
  reason: string
}

export type ThanksParseResult = {
  rows: Array<{ email: string; firstName: string }>
  invalidRaw: string[]
}

const FIRST_NAME_HEADERS = new Set(['first_name', 'first name', 'firstname', 'given name', 'givenname'])
const EMAIL_HEADERS = new Set(['email', 'email address', 'e-mail', 'e-mail 1 - value'])
const NAME_HEADERS = new Set(['name', 'full name', 'full_name'])

function headerKey(h: string): string {
  return h.replace(/^\uFEFF/, '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function firstNameFromFull(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return ''
  return trimmed.split(/\s+/)[0] ?? ''
}

function looksLikeCsv(raw: string): boolean {
  const first = raw.split(/\r?\n/, 1)[0] ?? ''
  return first.includes(',') && /email/i.test(first)
}

/**
 * Parse paste or CSV. Never invents addresses. Invalid tokens are reported,
 * not replaced with placeholders.
 */
export function parseThanksRecipients(raw: string): ThanksParseResult {
  const text = raw.replace(/^\uFEFF/, '').trim()
  if (!text) return { rows: [], invalidRaw: [] }

  if (looksLikeCsv(text)) {
    return parseCsv(text)
  }
  return parsePaste(text)
}

function parsePaste(text: string): ThanksParseResult {
  const tokens = text.split(/[\s,;]+/).map(t => t.trim()).filter(Boolean)
  const seen = new Set<string>()
  const rows: Array<{ email: string; firstName: string }> = []
  const invalidRaw: string[] = []
  for (const token of tokens) {
    const email = normalizeThanksEmail(token)
    if (!isValidThanksEmail(email)) {
      invalidRaw.push(token)
      continue
    }
    if (seen.has(email)) continue
    seen.add(email)
    rows.push({ email, firstName: '' })
  }
  return { rows, invalidRaw }
}

function parseCsv(text: string): ThanksParseResult {
  const parsed = Papa.parse<string[]>(text, { header: false, skipEmptyLines: true })
  const table = parsed.data
  if (table.length === 0) return { rows: [], invalidRaw: [] }

  const headers = (table[0] ?? []).map(headerKey)
  const emailIdx = headers.findIndex(h => EMAIL_HEADERS.has(h))
  const firstIdx = headers.findIndex(h => FIRST_NAME_HEADERS.has(h))
  const nameIdx = headers.findIndex(h => NAME_HEADERS.has(h))

  if (emailIdx < 0) {
    return parsePaste(text)
  }

  const seen = new Set<string>()
  const rows: Array<{ email: string; firstName: string }> = []
  const invalidRaw: string[] = []

  for (const line of table.slice(1)) {
    const email = normalizeThanksEmail(line[emailIdx])
    if (!email) continue
    if (!isValidThanksEmail(email)) {
      invalidRaw.push(line[emailIdx] ?? '')
      continue
    }
    if (seen.has(email)) continue
    seen.add(email)
    const firstFromCol = firstIdx >= 0 ? String(line[firstIdx] ?? '').trim() : ''
    const firstFromName = nameIdx >= 0 ? firstNameFromFull(String(line[nameIdx] ?? '')) : ''
    rows.push({ email, firstName: firstFromCol || firstFromName })
  }
  return { rows, invalidRaw }
}

export function previewThanksBatch(input: {
  raw: string
  membersByEmail: Map<string, MemberSnapshot>
  fogByEmail: Map<string, FogInviteSnapshot>
  existingThanksEmails: Set<string>
  fogOverride: boolean
  fogOverrideReason: string
}): { rows: ThanksBatchRow[]; inviteable: ThanksBatchRow[] } {
  const parsed = parseThanksRecipients(input.raw)
  const rows: ThanksBatchRow[] = []

  for (const bad of parsed.invalidRaw) {
    rows.push({
      email: bad,
      firstName: '',
      disposition: 'invalid',
      reason: 'Not a valid email. Nothing was invented.',
    })
  }

  for (const row of parsed.rows) {
    if (input.existingThanksEmails.has(row.email)) {
      rows.push({
        email: row.email,
        firstName: row.firstName,
        disposition: 'duplicate',
        reason: 'Already on the thank-you Community list.',
      })
      continue
    }
    const disposition = classifyRecipient({
      email: row.email,
      member: input.membersByEmail.get(row.email) ?? null,
      fog: input.fogByEmail.get(row.email) ?? null,
      fogOverride: input.fogOverride,
      fogOverrideReason: input.fogOverrideReason,
    })
    rows.push({
      email: row.email,
      firstName: row.firstName,
      disposition,
      reason: reasonFor(disposition),
    })
  }

  return { rows, inviteable: rows.filter(r => r.disposition === 'invite') }
}

function reasonFor(disposition: PreviewDisposition): string {
  switch (disposition) {
    case 'invite':
      return 'Ready for D0 after an explicit YES.'
    case 'invalid':
      return 'Not a valid email. Nothing was invented.'
    case 'already_paid':
      return 'Already paid. Leave alone.'
    case 'already_member':
      return 'Already a member. Leave alone.'
    case 'fog_excluded':
      return 'On a Friends of George invite (pending or redeemed). Needs admin override and a reason.'
    case 'duplicate':
      return 'Already on the thank-you Community list.'
  }
}
