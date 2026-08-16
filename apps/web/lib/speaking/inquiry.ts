/**
 * Keynote inquiry pipeline (SPRINT KN-1).
 *
 * Pure logic + a narrow DB port, so the route stays thin and the validation,
 * honeypot and upsert-on-conflict behaviour are unit-testable against a mock
 * client. Nothing here imports the Supabase client — see ./inquiryDb for the
 * adapter that binds this to adminClient.
 *
 * PII: callers must never log field values from here. Postgres embeds the
 * conflicting value in a unique-violation message, so error paths log codes.
 */

export const INQUIRY_MESSAGE_MAX = 2000
const NAME_MAX = 200
const FIELD_MAX = 200
const EMAIL_MAX = 320

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Raw shape posted by the public form, including the honeypot. */
export interface InquiryInput {
  full_name?: unknown
  email?: unknown
  company?: unknown
  event_name?: unknown
  event_timeframe?: unknown
  message?: unknown
  /** Honeypot — a real browser never fills this. */
  website?: unknown
}

export interface CleanInquiry {
  full_name: string
  email: string
  company: string | null
  event_name: string | null
  event_timeframe: string | null
  message: string
}

export type ValidationResult =
  | { kind: 'ok'; value: CleanInquiry }
  | { kind: 'invalid'; error: string }
  /** Honeypot tripped — the caller should 200 and do nothing. */
  | { kind: 'bot' }

function str(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : ''
}

export function validateInquiry(body: InquiryInput): ValidationResult {
  // Honeypot first — a bot's other fields are not worth validating.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return { kind: 'bot' }
  }

  const full_name = str(body.full_name, NAME_MAX)
  if (!full_name) return { kind: 'invalid', error: 'Your name is required.' }

  const email = str(body.email, EMAIL_MAX).toLowerCase()
  if (!email || !EMAIL_RE.test(email)) {
    return { kind: 'invalid', error: 'A valid email address is required.' }
  }

  // Length is checked before trimming to slice() so an over-long message is
  // rejected rather than silently truncated — the sender should know.
  if (typeof body.message === 'string' && body.message.trim().length > INQUIRY_MESSAGE_MAX) {
    return {
      kind: 'invalid',
      error: `Message is too long — ${INQUIRY_MESSAGE_MAX} characters maximum.`,
    }
  }
  const message = str(body.message, INQUIRY_MESSAGE_MAX)
  if (!message) return { kind: 'invalid', error: 'Tell us a little about the event.' }

  return {
    kind: 'ok',
    value: {
      full_name,
      email,
      company: str(body.company, FIELD_MAX) || null,
      event_name: str(body.event_name, FIELD_MAX) || null,
      event_timeframe: str(body.event_timeframe, FIELD_MAX) || null,
      message,
    },
  }
}

/** ISO date only (YYYY-MM-DD) for the notes block heading. */
function isoDay(now: Date): string {
  return now.toISOString().slice(0, 10)
}

/** A dated, human-readable block appended to the prospect's notes. */
export function buildNotesBlock(inq: CleanInquiry, now: Date): string {
  const meta = [
    inq.event_name ? `Event: ${inq.event_name}` : null,
    inq.event_timeframe ? `Timeframe: ${inq.event_timeframe}` : null,
    inq.company ? `Company: ${inq.company}` : null,
  ].filter(Boolean)

  const header = `[${isoDay(now)}] Keynote inquiry`
  return [meta.length ? `${header} — ${meta.join(' · ')}` : header, inq.message].join('\n')
}

/** Newest block first, so the latest inquiry is visible without scrolling. */
export function prependNotes(existing: string | null | undefined, block: string): string {
  const prev = (existing ?? '').trim()
  return prev ? `${block}\n\n---\n\n${prev}` : block
}

/** Subject line / notification title: the most specific label we have. */
export function inquiryLabel(inq: CleanInquiry): string {
  return inq.event_name || inq.company || inq.full_name
}

// ── DB port ────────────────────────────────────────────────────────────────

export interface ProspectRow {
  id: string
  notes: string | null
}

export interface DbError {
  code?: string
}

/**
 * The minimum surface the inquiry needs. Implemented against adminClient in
 * ./inquiryDb; mocked in tests.
 */
export interface InquiryDb {
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
 * Record the inquiry against crm_prospects.
 *
 * New contact  → insert as a keynote-interested lead with express consent
 *                (they initiated contact, which is what express means here).
 * Known contact→ the insert hits the 076 unique index on lower(email); we then
 *                fetch and PATCH. Stage, status and consent_basis are left
 *                exactly as they were — an inbound inquiry must not demote a
 *                Professional member back to 'lead', nor silently upgrade a
 *                consent record that was established some other way.
 */
export async function upsertKeynoteProspect(
  db: InquiryDb,
  inq: CleanInquiry,
  now: Date = new Date(),
): Promise<UpsertOutcome> {
  const block = buildNotesBlock(inq, now)
  const iso = now.toISOString()

  const { error: insertErr } = await db.insertProspect({
    full_name: inq.full_name,
    email: inq.email,
    company: inq.company,
    title: null,
    notes: block,
    stage: 'lead',
    status: 'active',
    source: 'keynote-inquiry',
    consent_basis: 'express',
    keynote_interest: true,
    enrichment_status: 'none',
    tags: [],
    last_contacted_at: iso,
    updated_at: iso,
  })

  if (!insertErr) return { kind: 'created' }
  if (insertErr.code !== PG_UNIQUE_VIOLATION) return { kind: 'error', code: insertErr.code }

  // Already a prospect — merge into the existing row.
  const { data: existing, error: findErr } = await db.findProspectByEmail(inq.email)
  if (findErr) return { kind: 'error', code: findErr.code }
  if (!existing) {
    // Raced with a delete between the insert and the lookup. Nothing sensible
    // left to update, and retrying could loop, so report it as handled.
    return { kind: 'error', code: 'not_found_after_conflict' }
  }

  const { error: updateErr } = await db.updateProspect(existing.id, {
    keynote_interest: true,
    notes: prependNotes(existing.notes, block),
    last_contacted_at: iso,
    updated_at: iso,
  })
  if (updateErr) return { kind: 'error', code: updateErr.code }

  return { kind: 'updated' }
}

/**
 * Fan an in-app notification out to every admin. Best-effort: a notification
 * failure must not fail the inquiry, so this reports rather than throws.
 */
export async function notifyAdmins(
  db: InquiryDb,
  inq: CleanInquiry,
): Promise<{ notified: number; code?: string }> {
  const { data, error } = await db.listAdminIds()
  if (error) return { notified: 0, code: error.code }
  const admins = data ?? []
  if (admins.length === 0) return { notified: 0 }

  const rows = admins.map(a => ({
    user_id: a.id,
    type: 'system_general',
    title: `Keynote inquiry: ${inquiryLabel(inq)}`,
    body: `${inq.full_name} asked about booking George to speak.`,
    action_url: '/admin/crm',
    is_read: false,
  }))

  const { error: insertErr } = await db.insertNotifications(rows)
  if (insertErr) return { notified: 0, code: insertErr.code }
  return { notified: rows.length }
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
