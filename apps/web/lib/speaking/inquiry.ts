/**
 * Booking inquiry pipeline (LIVE "Inquire about booking").
 *
 * Pure logic + a narrow DB port, so the route stays thin and the validation,
 * honeypot and upsert-on-conflict behaviour are unit-testable against a mock
 * client. Nothing here imports the Supabase client — see ./inquiryDb for the
 * adapter that binds this to adminClient.
 *
 * PII: callers must never log field values from here. Postgres embeds the
 * conflicting value in a unique-violation message, so error paths log codes.
 */

import {
  LIVE_INQUIRE_SOURCE,
  LIVE_INQUIRE_TAG,
  mergeTags,
  notifyIntakeAdmins,
  prependNotes as prependIntakeNotes,
  upsertIntakeProspect,
  type IntakeDb,
  type IntakeProspectRow,
  type IntakeUpsertOutcome,
} from '@/lib/crm/intake'

export { LIVE_INQUIRE_SOURCE, LIVE_INQUIRE_TAG }

const NAME_MAX = 200
const FIELD_MAX = 200
const EMAIL_MAX = 320
const SMS_MAX = 40

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const SMS_RE = /^[+\d][\d\s().-]{5,}$/

/** Raw shape posted by the public form, including the honeypot. */
export interface InquiryInput {
  name?: unknown
  full_name?: unknown
  email?: unknown
  event_date?: unknown
  sms?: unknown
  company?: unknown
  /** Honeypot — a real browser never fills this. */
  website?: unknown
}

export interface CleanInquiry {
  full_name: string
  email: string
  event_date: string | null
  sms: string | null
  company: string | null
}

export type InquiryFieldLabel = 'Name' | 'Email' | 'Date of event' | 'SMS' | 'Company'

export interface InquiryFieldLine {
  label: InquiryFieldLabel
  value: string
}

export type ValidationResult =
  | { kind: 'ok'; value: CleanInquiry }
  | { kind: 'invalid'; error: string }
  /** Honeypot tripped — the caller should 200 and do nothing. */
  | { kind: 'bot' }

function str(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : ''
}

function isRealYmd(ymd: string): boolean {
  if (!DATE_RE.test(ymd)) return false
  const [ys, ms, ds] = ymd.split('-')
  const y = Number(ys)
  const m = Number(ms)
  const d = Number(ds)
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return false
  const dt = new Date(Date.UTC(y, m - 1, d))
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d &&
    y >= 2020 &&
    y <= 2040
  )
}

export function formatEventDate(ymd: string): string {
  if (!DATE_RE.test(ymd)) return ymd
  const [ys, ms, ds] = ymd.split('-')
  const dt = new Date(Date.UTC(Number(ys), Number(ms) - 1, Number(ds)))
  if (Number.isNaN(dt.getTime())) return ymd
  return dt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function validateInquiry(body: InquiryInput): ValidationResult {
  // Honeypot first — a bot's other fields are not worth validating.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return { kind: 'bot' }
  }

  const full_name = str(body.name ?? body.full_name, NAME_MAX)
  if (!full_name) return { kind: 'invalid', error: 'Name is required.' }

  const email = str(body.email, EMAIL_MAX).toLowerCase()
  if (!email || !EMAIL_RE.test(email)) {
    return { kind: 'invalid', error: 'A valid email address is required.' }
  }

  const eventRaw = str(body.event_date, 10)
  if (eventRaw && !isRealYmd(eventRaw)) {
    return { kind: 'invalid', error: 'Date of event must be a real calendar date.' }
  }

  const sms = str(body.sms, SMS_MAX)
  if (sms && !SMS_RE.test(sms)) {
    return { kind: 'invalid', error: 'SMS must be a phone number.' }
  }

  return {
    kind: 'ok',
    value: {
      full_name,
      email,
      event_date: eventRaw || null,
      sms: sms || null,
      company: str(body.company, FIELD_MAX) || null,
    },
  }
}

/** ISO date only (YYYY-MM-DD) for the notes block heading. */
function isoDay(now: Date): string {
  return now.toISOString().slice(0, 10)
}

/**
 * Filled inquiry fields in locked product order.
 * Blank optionals are omitted so copy never trails "SMS:" or "Company:".
 */
export function inquiryFieldLines(inq: CleanInquiry): InquiryFieldLine[] {
  const rows: InquiryFieldLine[] = [
    { label: 'Name', value: inq.full_name },
    { label: 'Email', value: inq.email },
  ]
  if (inq.event_date) {
    rows.push({ label: 'Date of event', value: formatEventDate(inq.event_date) })
  }
  if (inq.sms) rows.push({ label: 'SMS', value: inq.sms })
  if (inq.company) rows.push({ label: 'Company', value: inq.company })
  return rows
}

export function inquiryFieldSummary(inq: CleanInquiry): string {
  return inquiryFieldLines(inq)
    .map(row => `${row.label}: ${row.value}`)
    .join(' · ')
}

export function inquiryNotificationCopy(inq: CleanInquiry): { title: string; body: string } {
  const summary = inquiryFieldSummary(inq)
  return {
    title: `Booking inquiry: ${summary}`,
    body: summary,
  }
}

/** A dated, human-readable block appended to the prospect's notes. */
export function buildNotesBlock(inq: CleanInquiry, now: Date): string {
  const lines = [`[${isoDay(now)}] Booking inquiry`, inquiryFieldSummary(inq)]
  return lines.join('\n')
}

/** Newest block first, so the latest inquiry is visible without scrolling. */
export const prependNotes = prependIntakeNotes

/** Merge `live inquire` onto an existing tag list without dupes or reordering. */
export function withLiveInquireTag(existing: unknown): string[] {
  return mergeTags(existing, [LIVE_INQUIRE_TAG])
}

// ── DB port ────────────────────────────────────────────────────────────────

export type ProspectRow = IntakeProspectRow

export interface DbError {
  code?: string
}

/**
 * The minimum surface the inquiry needs. Implemented against adminClient in
 * ./inquiryDb; mocked in tests.
 */
export type InquiryDb = IntakeDb

export { PG_UNIQUE_VIOLATION } from '@/lib/crm/intake'

export type UpsertOutcome =
  | { kind: 'created' }
  | { kind: 'updated' }
  | { kind: 'error'; code?: string }

function toUpsertOutcome(out: IntakeUpsertOutcome): UpsertOutcome {
  if (out.kind === 'error') return out
  return { kind: out.kind }
}

/**
 * Record the inquiry against crm_prospects.
 *
 * New contact  → insert as a keynote-interested lead with express consent
 *                (they initiated contact, which is what express means here)
 *                and tag `live inquire`.
 * Known contact→ the insert hits the 076 unique index on lower(email); we then
 *                fetch and PATCH. Stage, status and consent_basis are left
 *                exactly as they were — an inbound inquiry must not demote a
 *                Professional member back to 'lead', nor silently upgrade a
 *                consent record that was established some other way. The tag
 *                is merged.
 */
export async function upsertKeynoteProspect(
  db: InquiryDb,
  inq: CleanInquiry,
  now: Date = new Date(),
): Promise<UpsertOutcome> {
  return toUpsertOutcome(
    await upsertIntakeProspect(
      db,
      {
        email: inq.email,
        full_name: inq.full_name,
        phone: inq.sms,
        company: inq.company,
        title: null,
        source: LIVE_INQUIRE_SOURCE,
        tags: [LIVE_INQUIRE_TAG],
        notesBlock: buildNotesBlock(inq, now),
        stage: 'lead',
        consent_basis: 'express',
        keynote_interest: true,
        updateExtras: { keynote_interest: true },
      },
      now,
    ),
  )
}

/**
 * Fan an in-app notification out to every admin. Best-effort: a notification
 * failure must not fail the inquiry, so this reports rather than throws.
 *
 * Title and body both carry the filled fields (Name, Email, Date of event,
 * SMS, Company) so George sees them in the bell without opening the CRM.
 */
export async function notifyAdmins(
  db: InquiryDb,
  inq: CleanInquiry,
): Promise<{ notified: number; code?: string }> {
  return notifyIntakeAdmins(db, inquiryNotificationCopy(inq))
}

// ── Rate limiting ──────────────────────────────────────────────────────────

export interface RateLimiter {
  /** True when the request is allowed; false when the caller is over quota. */
  check(key: string, now?: number): boolean
}

/**
 * Fixed-window in-memory limiter.
 *
 * Best-effort only: the window lives in the process, so it RESETS ON DEPLOY and
 * is NOT shared across Railway instances — a horizontally scaled deployment
 * effectively multiplies the quota by the instance count. It exists to blunt
 * casual abuse of a public endpoint, not as a security control. Move to a
 * shared store if this ever needs to be authoritative.
 */
export function createRateLimiter(max: number, windowMs: number): RateLimiter {
  const hits = new Map<string, number[]>()
  return {
    check(key: string, now: number = Date.now()): boolean {
      const cutoff = now - windowMs
      const recent = (hits.get(key) ?? []).filter(t => t > cutoff)
      if (recent.length >= max) {
        hits.set(key, recent)
        return false
      }
      recent.push(now)
      hits.set(key, recent)
      // Opportunistic sweep so a long-lived instance can't grow unbounded from
      // one-off IPs. Cheap because it only runs once the map is already large.
      if (hits.size > 5000) {
        for (const [k, v] of hits) if (v.every(t => t <= cutoff)) hits.delete(k)
      }
      return true
    },
  }
}

/** First hop in X-Forwarded-For is the client on Railway's proxy. */
export function clientIpFrom(headers: Headers): string {
  const fwd = headers.get('x-forwarded-for')
  if (fwd) {
    const first = fwd.split(',')[0]?.trim()
    if (first) return first
  }
  return headers.get('x-real-ip')?.trim() || 'unknown'
}
