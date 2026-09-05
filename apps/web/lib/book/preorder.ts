/**
 * EVOLVED book preorder (public /evolved).
 *
 * House IAB book ads click here. The form upserts public.crm_prospects with
 * the exact tag `book preorder` through the same adminClient / RLS-bypass
 * write path as the keynote inquiry — no second CRM, no HubSpot, no email.
 *
 * Public dest for CoS (three IAB slots):
 *   https://www.evolvedpros.com/evolved?utm_source=house&utm_medium=display&utm_campaign=evolved-book&utm_content=<slot>
 *
 * slot = 300x250 | 728x90 | 300x600
 *
 * Pure logic + a narrow DB port so the route stays thin and the tag write
 * is unit-testable against a mock. Nothing here imports the Supabase client.
 *
 * PII: callers must never log field values from here. Postgres embeds the
 * conflicting value in a unique-violation message, so error paths log codes.
 */

import { normalizeTags } from '@/lib/admin/crm'
import { notifyIntakeAdmins } from '@/lib/crm/intake'
import { CANONICAL_ORIGIN } from '@/lib/seo/canonical'

export const BOOK_PREORDER_PATH = '/evolved' as const
export const BOOK_PREORDER_TAG = 'book preorder' as const
export const BOOK_PREORDER_SOURCE = 'book-preorder' as const
export const BOOK_COVER_SRC = '/ads/book-cover.png' as const

export const BOOK_PREORDER_UTM = {
  utm_source: 'house',
  utm_medium: 'display',
  utm_campaign: 'evolved-book',
} as const

export const BOOK_IAB_SLOTS = ['300x250', '728x90', '300x600'] as const
export type BookIabSlot = (typeof BOOK_IAB_SLOTS)[number]

const NAME_MAX = 200
const EMAIL_MAX = 320
const UTM_MAX = 120
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function isBookIabSlot(value: unknown): value is BookIabSlot {
  return typeof value === 'string' && (BOOK_IAB_SLOTS as readonly string[]).includes(value)
}

/** Relative dest the three house book ads should use. */
export function bookPreorderHref(slot: BookIabSlot): string {
  const params = new URLSearchParams({
    utm_source: BOOK_PREORDER_UTM.utm_source,
    utm_medium: BOOK_PREORDER_UTM.utm_medium,
    utm_campaign: BOOK_PREORDER_UTM.utm_campaign,
    utm_content: slot,
  })
  return `${BOOK_PREORDER_PATH}?${params.toString()}`
}

/** Absolute www dest for CoS / ad-ops paste. Never the platform host. */
export function bookPreorderPublicUrl(slot: BookIabSlot): string {
  return `${CANONICAL_ORIGIN}${bookPreorderHref(slot)}`
}

/** Raw shape posted by the public form, including the honeypot and UTMs. */
export interface PreorderInput {
  first_name?: unknown
  last_name?: unknown
  full_name?: unknown
  email?: unknown
  /** Honeypot — a real browser never fills this. */
  website?: unknown
  utm_source?: unknown
  utm_medium?: unknown
  utm_campaign?: unknown
  utm_content?: unknown
}

export interface CleanPreorder {
  full_name: string
  email: string
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
}

export type ValidationResult =
  | { kind: 'ok'; value: CleanPreorder }
  | { kind: 'invalid'; error: string }
  /** Honeypot tripped — the caller should 200 and do nothing. */
  | { kind: 'bot' }

function str(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : ''
}

export function joinPreorderName(input: PreorderInput): string {
  const full = str(input.full_name, NAME_MAX)
  if (full) return full
  const first = str(input.first_name, NAME_MAX)
  const last = str(input.last_name, NAME_MAX)
  return [first, last].filter(Boolean).join(' ')
}

export function validatePreorder(body: PreorderInput): ValidationResult {
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return { kind: 'bot' }
  }

  const full_name = joinPreorderName(body)
  if (!full_name) return { kind: 'invalid', error: 'Your name is required.' }

  const email = str(body.email, EMAIL_MAX).toLowerCase()
  if (!email || !EMAIL_RE.test(email)) {
    return { kind: 'invalid', error: 'A valid email address is required.' }
  }

  return {
    kind: 'ok',
    value: {
      full_name,
      email,
      utm_source: str(body.utm_source, UTM_MAX) || null,
      utm_medium: str(body.utm_medium, UTM_MAX) || null,
      utm_campaign: str(body.utm_campaign, UTM_MAX) || null,
      utm_content: str(body.utm_content, UTM_MAX) || null,
    },
  }
}

/** Merge `book preorder` onto an existing tag list without dupes or reordering. */
export function withBookPreorderTag(existing: unknown): string[] {
  const current = Array.isArray(existing) ? existing : []
  return normalizeTags([...current, BOOK_PREORDER_TAG])
}

function isoDay(now: Date): string {
  return now.toISOString().slice(0, 10)
}

function utmSummary(inq: CleanPreorder): string | null {
  const parts = [
    inq.utm_source ? `utm_source=${inq.utm_source}` : null,
    inq.utm_medium ? `utm_medium=${inq.utm_medium}` : null,
    inq.utm_campaign ? `utm_campaign=${inq.utm_campaign}` : null,
    inq.utm_content ? `utm_content=${inq.utm_content}` : null,
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : null
}

export function buildPreorderNotesBlock(inq: CleanPreorder, now: Date): string {
  const header = `[${isoDay(now)}] Book preorder`
  const utm = utmSummary(inq)
  return utm ? `${header} — ${utm}` : header
}

export function prependNotes(existing: string | null | undefined, block: string): string {
  const prev = (existing ?? '').trim()
  return prev ? `${block}\n\n---\n\n${prev}` : block
}

export interface ProspectRow {
  id: string
  notes: string | null
  tags: string[] | null
}

export interface DbError {
  code?: string
}

/**
 * Minimum surface the preorder write needs. Implemented against adminClient
 * in ./preorderDb; mocked in tests. Same table as admin Prospects CRM.
 */
export interface PreorderDb {
  insertProspect(row: Record<string, unknown>): Promise<{ error: DbError | null }>
  findProspectByEmail(email: string): Promise<{ data: ProspectRow | null; error: DbError | null }>
  updateProspect(id: string, patch: Record<string, unknown>): Promise<{ error: DbError | null }>
  listAdminIds(): Promise<{ data: Array<{ id: string }> | null; error: DbError | null }>
  insertNotifications(rows: Array<Record<string, unknown>>): Promise<{ error: DbError | null }>
}

export const PG_UNIQUE_VIOLATION = '23505'

export type UpsertOutcome =
  | { kind: 'created' }
  | { kind: 'updated' }
  | { kind: 'error'; code?: string }

/**
 * Record the preorder against crm_prospects.
 *
 * New contact  → insert as a lead with express consent and tag `book preorder`.
 * Known contact→ the insert hits the 076 unique index on lower(email); we then
 *                fetch and PATCH. Stage, status, consent_basis and source are
 *                left alone — a book preorder must not demote a Professional
 *                or wipe tags that were already on the row. The tag is merged.
 */
export async function upsertBookPreorderProspect(
  db: PreorderDb,
  inq: CleanPreorder,
  now: Date = new Date(),
): Promise<UpsertOutcome> {
  const block = buildPreorderNotesBlock(inq, now)
  const iso = now.toISOString()
  const tags = withBookPreorderTag([])

  const { error: insertErr } = await db.insertProspect({
    full_name: inq.full_name,
    email: inq.email,
    notes: block,
    stage: 'lead',
    status: 'active',
    source: BOOK_PREORDER_SOURCE,
    consent_basis: 'express',
    keynote_interest: false,
    enrichment_status: 'none',
    tags,
    last_contacted_at: iso,
    updated_at: iso,
  })

  if (!insertErr) return { kind: 'created' }
  if (insertErr.code !== PG_UNIQUE_VIOLATION) return { kind: 'error', code: insertErr.code }

  const { data: existing, error: findErr } = await db.findProspectByEmail(inq.email)
  if (findErr) return { kind: 'error', code: findErr.code }
  if (!existing) {
    return { kind: 'error', code: 'not_found_after_conflict' }
  }

  const { error: updateErr } = await db.updateProspect(existing.id, {
    tags: withBookPreorderTag(existing.tags),
    notes: prependNotes(existing.notes, block),
    last_contacted_at: iso,
    updated_at: iso,
  })
  if (updateErr) return { kind: 'error', code: updateErr.code }

  return { kind: 'updated' }
}

export function preorderFieldSummary(inq: CleanPreorder): string {
  const parts = [`Name: ${inq.full_name}`, `Email: ${inq.email}`]
  const utm = utmSummary(inq)
  if (utm) parts.push(utm)
  return parts.join(' · ')
}

export function preorderNotificationCopy(inq: CleanPreorder): { title: string; body: string } {
  const summary = preorderFieldSummary(inq)
  return {
    title: `Book preorder: ${summary}`,
    body: summary,
  }
}

export async function notifyPreorderAdmins(
  db: PreorderDb,
  inq: CleanPreorder,
): Promise<{ notified: number; code?: string }> {
  return notifyIntakeAdmins(db, preorderNotificationCopy(inq))
}
