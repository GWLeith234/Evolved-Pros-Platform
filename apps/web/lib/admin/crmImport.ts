/**
 * CSV import helpers for the CRM import wizard (SPRINT CRM-2).
 *
 * Everything here is pure and operates on already-parsed rows (string[][]), so
 * the wizard, the API route and the unit tests all share one implementation and
 * the tests need no DOM, no network and no file I/O.
 */

import type { CrmConsentBasis } from './crm'

/** crm_prospects fields an imported column can land in. */
export const CRM_IMPORT_TARGETS = [
  'ignore',
  'full_name',
  'email',
  'phone',
  'company',
  'title',
  'location',
  'linkedin_url',
  'notes',
] as const

export type CrmImportTarget = (typeof CRM_IMPORT_TARGETS)[number]

export const CRM_IMPORT_TARGET_LABELS: Record<CrmImportTarget, string> = {
  ignore: '— Ignore —',
  full_name: 'Full name',
  email: 'Email',
  phone: 'Phone',
  company: 'Company',
  title: 'Title',
  location: 'Location',
  linkedin_url: 'LinkedIn URL',
  notes: 'Notes',
}

export type CrmImportPreset = 'linkedin' | 'google' | 'generic'

export const CRM_PRESET_LABELS: Record<CrmImportPreset, string> = {
  linkedin: 'LinkedIn Connections export',
  google: 'Google Contacts export',
  generic: 'Generic CSV',
}

/** A single row after mapping, in the shape the API expects. */
export interface MappedRow {
  full_name: string
  email: string
  phone?: string
  company?: string
  title?: string
  location?: string
  linkedin_url?: string
  notes?: string
}

/**
 * Header aliases per preset, lowercased. Several columns may target full_name
 * (LinkedIn's First/Last, Google's Given/Family) — mapRow concatenates them in
 * column order, which is why the mapping is per-column rather than per-field.
 */
const PRESET_HEADERS: Record<Exclude<CrmImportPreset, 'generic'>, Record<string, CrmImportTarget>> = {
  linkedin: {
    'first name': 'full_name',
    'last name': 'full_name',
    'email address': 'email',
    company: 'company',
    position: 'title',
    url: 'linkedin_url',
  },
  google: {
    name: 'full_name',
    'given name': 'full_name',
    'family name': 'full_name',
    'e-mail 1 - value': 'email',
    'organization 1 - name': 'company',
    'organization 1 - title': 'title',
    'phone 1 - value': 'phone',
  },
}

/** Headers that, taken together, identify a source export. */
const PRESET_SIGNATURES: Record<Exclude<CrmImportPreset, 'generic'>, string[]> = {
  linkedin: ['first name', 'last name', 'email address'],
  google: ['e-mail 1 - value'],
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function normalizeHeader(h: string): string {
  // Strip a UTF-8 BOM and collapse internal whitespace — LinkedIn ships both.
  return h.replace(/^﻿/, '').trim().toLowerCase().replace(/\s+/g, ' ')
}

export function normalizeEmail(v: unknown): string {
  return typeof v === 'string' ? v.trim().toLowerCase() : ''
}

export function isValidEmail(v: unknown): boolean {
  const e = normalizeEmail(v)
  return e.length > 0 && e.length <= 320 && EMAIL_RE.test(e)
}

/**
 * Is this cell the NAME of an email column, rather than prose that happens to
 * mention email?
 *
 * This distinction is load-bearing. LinkedIn's preamble literally reads "…you
 * may notice that some of the email addresses are missing", so a bare
 * /e-?mail/ search matches the preamble and picks the wrong header row. A real
 * header cell is a short label ('Email Address', 'E-mail 1 - Value'), never a
 * sentence — hence the length cap and the word boundaries.
 */
function looksLikeEmailHeader(cell: string): boolean {
  if (!cell || cell.length > 40) return false
  return /\be-?mail\b/.test(cell)
}

/**
 * LinkedIn's Connections.csv opens with up to three lines of prose ("Notes:",
 * a blank, a sentence about member settings) before the real header row.
 * Find the first row that looks like a header, scanning only the first
 * `maxPreamble + 1` rows so we can't mistake a data row deep in the file for a
 * header.
 *
 * A header must both name an email column AND have at least two non-empty
 * cells — the preamble lines are single-cell rows, so the column count rules
 * them out even when the prose mentions email.
 *
 * Returns -1 when no header is found.
 */
export function findHeaderRow(rows: string[][], maxPreamble = 3): number {
  const limit = Math.min(rows.length, maxPreamble + 1)
  for (let i = 0; i < limit; i++) {
    const cells = (rows[i] ?? []).map(normalizeHeader)
    const populated = cells.filter(c => c !== '').length
    if (populated >= 2 && cells.some(looksLikeEmailHeader)) return i
  }
  return -1
}

export interface ParsedSheet {
  headerIndex: number
  headers: string[]
  rows: string[][]
}

/** Split raw parsed rows into header + data, skipping any preamble. */
export function splitSheet(rows: string[][], maxPreamble = 3): ParsedSheet | null {
  const headerIndex = findHeaderRow(rows, maxPreamble)
  if (headerIndex < 0) return null
  const headers = (rows[headerIndex] ?? []).map(h => h.replace(/^﻿/, '').trim())
  const data = rows
    .slice(headerIndex + 1)
    // Drop blank trailing lines that CSV exports habitually leave behind.
    .filter(r => r.some(cell => (cell ?? '').trim() !== ''))
  return { headerIndex, headers, rows: data }
}

export function detectPreset(headers: string[]): CrmImportPreset {
  const norm = headers.map(normalizeHeader)
  for (const preset of ['linkedin', 'google'] as const) {
    if (PRESET_SIGNATURES[preset].every(sig => norm.includes(sig))) return preset
  }
  return 'generic'
}

/**
 * Best-guess column → field mapping. Preset aliases win; otherwise fall back to
 * matching the header against the target names themselves so a hand-rolled CSV
 * with an "email"/"company" header maps without manual work.
 */
export function autoMap(headers: string[], preset: CrmImportPreset): CrmImportTarget[] {
  const aliases = preset === 'generic' ? {} : PRESET_HEADERS[preset]
  const seenEmail = { taken: false }
  return headers.map(raw => {
    const h = normalizeHeader(raw)
    const fromPreset = (aliases as Record<string, CrmImportTarget>)[h]
    if (fromPreset) {
      // Only the first email-ish column wins; later ones stay ignored.
      if (fromPreset === 'email') {
        if (seenEmail.taken) return 'ignore'
        seenEmail.taken = true
      }
      return fromPreset
    }
    if (h === 'email' || h === 'email address' || h === 'e-mail') {
      if (seenEmail.taken) return 'ignore'
      seenEmail.taken = true
      return 'email'
    }
    if (h === 'full name' || h === 'name') return 'full_name'
    if (h === 'company' || h === 'organization') return 'company'
    if (h === 'title' || h === 'position' || h === 'job title') return 'title'
    if (h === 'phone' || h === 'phone number') return 'phone'
    if (h === 'location' || h === 'city') return 'location'
    if (h === 'linkedin' || h === 'linkedin url' || h === 'profile url') return 'linkedin_url'
    if (h === 'notes' || h === 'note') return 'notes'
    return 'ignore'
  })
}

function collapse(v: string): string {
  return v.trim().replace(/\s+/g, ' ')
}

/**
 * Apply a column mapping to one row. Columns mapped to full_name are joined in
 * column order — that is how "First Name","Last Name" becomes "Ada Lovelace".
 */
export function mapRow(row: string[], mapping: CrmImportTarget[]): MappedRow {
  const nameParts: string[] = []
  const out: Record<string, string> = {}

  mapping.forEach((target, i) => {
    if (target === 'ignore') return
    const raw = collapse(row[i] ?? '')
    if (!raw) return
    if (target === 'full_name') {
      nameParts.push(raw)
      return
    }
    // First non-empty value wins for single-value fields.
    if (!out[target]) out[target] = raw
  })

  return {
    full_name: collapse(nameParts.join(' ')),
    email: normalizeEmail(out.email ?? ''),
    ...(out.phone ? { phone: out.phone } : {}),
    ...(out.company ? { company: out.company } : {}),
    ...(out.title ? { title: out.title } : {}),
    ...(out.location ? { location: out.location } : {}),
    ...(out.linkedin_url ? { linkedin_url: out.linkedin_url } : {}),
    ...(out.notes ? { notes: out.notes } : {}),
  }
}

export interface RowAnalysis {
  /** Rows with a valid email, first occurrence only. Safe to send to the API. */
  valid: MappedRow[]
  total: number
  /** Rows dropped for a missing or malformed email. */
  invalid: number
  /** Rows dropped because an earlier row in THIS file had the same email. */
  duplicatesInFile: number
}

/**
 * Validate + dedupe a mapped file. Deduplication is case-insensitive on email
 * and keeps the first occurrence, matching what the DB's unique index on
 * lower(email) would do — better to resolve it here than to send the server
 * rows we already know collide.
 */
export function analyzeRows(rows: MappedRow[]): RowAnalysis {
  const seen = new Set<string>()
  const valid: MappedRow[] = []
  let invalid = 0
  let duplicatesInFile = 0

  for (const r of rows) {
    const email = normalizeEmail(r.email)
    if (!isValidEmail(email)) {
      invalid++
      continue
    }
    if (seen.has(email)) {
      duplicatesInFile++
      continue
    }
    seen.add(email)
    valid.push({
      ...r,
      email,
      // A contact with no name still imports — the email is the identity.
      full_name: r.full_name || email,
    })
  }

  return { valid, total: rows.length, invalid, duplicatesInFile }
}

/** e.g. 'linkedin-2026-08' — the default source label for a preset. */
export function defaultSourceLabel(preset: CrmImportPreset, now: Date = new Date()): string {
  const stem = preset === 'generic' ? 'csv-import' : preset
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  return `${stem}-${yyyy}-${mm}`
}

/** Split rows into API-sized batches. */
export function chunkRows<T>(rows: T[], size: number): T[][] {
  if (size <= 0) return [rows]
  const out: T[][] = []
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size))
  return out
}

/** Max rows the API accepts per POST — the client chunks to this. */
export const CRM_IMPORT_BATCH_SIZE = 500

export interface ImportBatchResult {
  imported: number
  dupPros: number
  dupMembers: number
  invalid: number
}

export function emptyBatchResult(): ImportBatchResult {
  return { imported: 0, dupPros: 0, dupMembers: 0, invalid: 0 }
}

export function addBatchResult(a: ImportBatchResult, b: ImportBatchResult): ImportBatchResult {
  return {
    imported: a.imported + b.imported,
    dupPros: a.dupPros + b.dupPros,
    dupMembers: a.dupMembers + b.dupMembers,
    invalid: a.invalid + b.invalid,
  }
}

export interface ImportRequestBody {
  rows: MappedRow[]
  source: string
  consent_basis: CrmConsentBasis
  tags: string[]
}
