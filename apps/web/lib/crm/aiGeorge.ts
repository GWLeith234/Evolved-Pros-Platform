/**
 * Conversations AI (AI George) inbound lead pipeline.
 *
 * Maps a Vendasta Business App Automation flat JSON webhook onto the same
 * public.crm_prospects write + admin notifications insert that LIVE Inquire
 * (#115) uses. No second notification engine, no new CHECK type, no HubSpot,
 * no archived #80 Vendasta product integration.
 *
 * PII: callers must never log field values from here. Postgres embeds the
 * conflicting value in a unique-violation message, so error paths log codes.
 */

const NAME_MAX = 200
const FIELD_MAX = 200
const EMAIL_MAX = 320
const SMS_MAX = 40
const MESSAGE_MAX = 2000
const ID_MAX = 120

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const SMS_RE = /^[+\d][\d\s().-]{5,}$/

/** Exact CRM tag. Never lowercase, never "conversations-ai", never "external-api". */
export const AI_GEORGE_TAG = 'AI George' as const
export const AI_GEORGE_SOURCE = 'ai-george' as const
export const AI_GEORGE_FALLBACK_NAME = 'AI George lead' as const
export const AI_GEORGE_NOTIFY_TITLE = 'New AI George lead' as const

export type AiGeorgeFieldLabel = 'Name' | 'Email' | 'SMS' | 'Company'

export interface AiGeorgeFieldLine {
  label: AiGeorgeFieldLabel
  value: string
}

export interface CleanAiGeorgeLead {
  full_name: string
  email: string | null
  sms: string | null
  company: string | null
  message: string | null
  contact_id: string | null
}

export type MapResult =
  | { kind: 'ok'; value: CleanAiGeorgeLead }
  | { kind: 'invalid'; error: string }

function str(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : ''
}

function firstString(
  body: Record<string, unknown>,
  keys: readonly string[],
  max: number,
): string {
  for (const key of keys) {
    const value = str(body[key], max)
    if (value) return value
  }
  return ''
}

/**
 * Map a flat Automation webhook body to a lead.
 *
 * Field aliases are hypothesized: Vendasta's Send a webhook body is
 * partner-defined, and the official example uses marketplace ids, not
 * contact fields. See docs/fixtures/vendasta-conversations-ai-webhook.md.
 */
export function mapConversationsPayload(body: unknown): MapResult {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { kind: 'invalid', error: 'Expected a flat JSON object.' }
  }
  const rec = body as Record<string, unknown>

  const named = firstString(
    rec,
    ['name', 'full_name', 'fullName', 'display_name', 'displayName'],
    NAME_MAX,
  )
  const first = firstString(rec, ['first_name', 'firstName'], NAME_MAX)
  const last = firstString(rec, ['last_name', 'lastName'], NAME_MAX)
  const joined = [first, last].filter(Boolean).join(' ')
  const full_name = named || joined || AI_GEORGE_FALLBACK_NAME

  const emailRaw = firstString(
    rec,
    ['email', 'email_address', 'emailAddress', 'contact_email'],
    EMAIL_MAX,
  ).toLowerCase()
  const email = emailRaw && EMAIL_RE.test(emailRaw) ? emailRaw : null

  const smsRaw = firstString(
    rec,
    ['phone', 'sms', 'phone_number', 'phoneNumber', 'mobile', 'mobile_phone'],
    SMS_MAX,
  )
  const sms = smsRaw && SMS_RE.test(smsRaw) ? smsRaw : null

  if (!email && !sms) {
    if (emailRaw) return { kind: 'invalid', error: 'A valid email address or SMS is required.' }
    if (smsRaw) return { kind: 'invalid', error: 'SMS must be a phone number.' }
    return { kind: 'invalid', error: 'Email or SMS is required.' }
  }

  return {
    kind: 'ok',
    value: {
      full_name,
      email,
      sms,
      company:
        firstString(rec, ['company', 'company_name', 'companyName', 'account_name'], FIELD_MAX) ||
        null,
      message: firstString(
        rec,
        ['message', 'last_message', 'lastMessage', 'conversation', 'snippet', 'notes'],
        MESSAGE_MAX,
      ) || null,
      contact_id: firstString(
        rec,
        ['contact_id', 'contactId', 'entityId', 'entity_id'],
        ID_MAX,
      ) || null,
    },
  }
}

export function aiGeorgeFieldLines(lead: CleanAiGeorgeLead): AiGeorgeFieldLine[] {
  const rows: AiGeorgeFieldLine[] = [{ label: 'Name', value: lead.full_name }]
  if (lead.email) rows.push({ label: 'Email', value: lead.email })
  if (lead.sms) rows.push({ label: 'SMS', value: lead.sms })
  if (lead.company) rows.push({ label: 'Company', value: lead.company })
  return rows
}

export function aiGeorgeFieldSummary(lead: CleanAiGeorgeLead): string {
  return aiGeorgeFieldLines(lead)
    .map(row => `${row.label}: ${row.value}`)
    .join(' · ')
}

/** Bell copy. Title is locked; body is one line per present field. */
export function aiGeorgeNotificationCopy(
  lead: CleanAiGeorgeLead,
  prospectId?: string | null,
): { title: string; body: string; actionUrl: string } {
  const body = aiGeorgeFieldLines(lead)
    .map(row => `${row.label}: ${row.value}`)
    .join('\n')
  const actionUrl = prospectId ? `/admin/crm?prospect=${prospectId}` : '/admin/crm'
  return { title: AI_GEORGE_NOTIFY_TITLE, body, actionUrl }
}

function isoDay(now: Date): string {
  return now.toISOString().slice(0, 10)
}

export function buildAiGeorgeNotesBlock(lead: CleanAiGeorgeLead, now: Date): string {
  const lines = [`[${isoDay(now)}] AI George`, aiGeorgeFieldSummary(lead)]
  if (lead.contact_id) lines.push(`Contact id: ${lead.contact_id}`)
  if (lead.message) lines.push(lead.message)
  return lines.join('\n')
}

export function prependNotes(existing: string | null | undefined, block: string): string {
  const prev = (existing ?? '').trim()
  return prev ? `${block}\n\n---\n\n${prev}` : block
}

/**
 * Merge the exact tag `AI George` without running it through lowercase
 * normalizeTags. Other tags keep their existing values; the product tag is
 * added once, case-insensitively.
 */
export function withAiGeorgeTag(existing: unknown): string[] {
  const current = Array.isArray(existing) ? existing.filter((t): t is string => typeof t === 'string') : []
  const out: string[] = []
  let hasProduct = false
  for (const raw of current) {
    const trimmed = raw.trim()
    if (!trimmed) continue
    if (trimmed.toLowerCase() === AI_GEORGE_TAG.toLowerCase()) {
      if (!hasProduct) {
        out.push(AI_GEORGE_TAG)
        hasProduct = true
      }
      continue
    }
    out.push(trimmed)
  }
  if (!hasProduct) out.push(AI_GEORGE_TAG)
  return out
}

// ── DB port (same surface Inquire uses) ───────────────────────────────────

export interface ProspectRow {
  id: string
  notes: string | null
  phone: string | null
  company: string | null
  email: string | null
  tags: string[] | null
}

export interface DbError {
  code?: string
}

/**
 * Minimum surface the lead write needs. Implemented against adminClient in
 * ./aiGeorgeDb (same service-role path as speaking/inquiryDb).
 */
export interface AiGeorgeDb {
  insertProspect(
    row: Record<string, unknown>,
  ): Promise<{ data: { id: string } | null; error: DbError | null }>
  findProspectByEmail(email: string): Promise<{ data: ProspectRow | null; error: DbError | null }>
  findProspectByPhone(phone: string): Promise<{ data: ProspectRow | null; error: DbError | null }>
  updateProspect(id: string, patch: Record<string, unknown>): Promise<{ error: DbError | null }>
  listAdminIds(): Promise<{ data: Array<{ id: string }> | null; error: DbError | null }>
  insertNotifications(rows: Array<Record<string, unknown>>): Promise<{ error: DbError | null }>
}

export const PG_UNIQUE_VIOLATION = '23505'

export type UpsertOutcome =
  | { kind: 'created'; id: string }
  | { kind: 'updated'; id: string }
  | { kind: 'error'; code?: string }

async function findExisting(
  db: AiGeorgeDb,
  lead: CleanAiGeorgeLead,
): Promise<{ data: ProspectRow | null; error: DbError | null }> {
  if (lead.email) return db.findProspectByEmail(lead.email)
  if (lead.sms) return db.findProspectByPhone(lead.sms)
  return { data: null, error: null }
}

/**
 * Record the AI George lead against crm_prospects.
 *
 * New contact  → insert as a lead with express consent, source `ai-george`,
 *                and exact tag `AI George`. Email may be null (SMS-only).
 * Known contact→ PATCH notes / phone / company / tag. Stage, status,
 *                consent_basis and source are left alone.
 */
export async function upsertAiGeorgeProspect(
  db: AiGeorgeDb,
  lead: CleanAiGeorgeLead,
  now: Date = new Date(),
): Promise<UpsertOutcome> {
  const block = buildAiGeorgeNotesBlock(lead, now)
  const iso = now.toISOString()

  const { data: existing, error: findErr } = await findExisting(db, lead)
  if (findErr) return { kind: 'error', code: findErr.code }

  if (existing) {
    const patch: Record<string, unknown> = {
      notes: prependNotes(existing.notes, block),
      tags: withAiGeorgeTag(existing.tags),
      last_contacted_at: iso,
      updated_at: iso,
    }
    if (lead.sms) patch.phone = lead.sms
    if (lead.company) patch.company = lead.company
    if (lead.email && !existing.email) patch.email = lead.email

    const { error: updateErr } = await db.updateProspect(existing.id, patch)
    if (updateErr) return { kind: 'error', code: updateErr.code }
    return { kind: 'updated', id: existing.id }
  }

  const { data, error: insertErr } = await db.insertProspect({
    full_name: lead.full_name,
    email: lead.email,
    phone: lead.sms,
    company: lead.company,
    title: null,
    notes: block,
    stage: 'lead',
    status: 'active',
    source: AI_GEORGE_SOURCE,
    consent_basis: 'express',
    keynote_interest: false,
    enrichment_status: 'none',
    tags: withAiGeorgeTag([]),
    last_contacted_at: iso,
    updated_at: iso,
  })

  if (!insertErr && data?.id) return { kind: 'created', id: data.id }
  if (!insertErr) return { kind: 'error', code: 'missing_insert_id' }
  if (insertErr.code !== PG_UNIQUE_VIOLATION) return { kind: 'error', code: insertErr.code }

  const { data: raced, error: raceErr } = await findExisting(db, lead)
  if (raceErr) return { kind: 'error', code: raceErr.code }
  if (!raced) return { kind: 'error', code: 'not_found_after_conflict' }

  const { error: updateErr } = await db.updateProspect(raced.id, {
    notes: prependNotes(raced.notes, block),
    tags: withAiGeorgeTag(raced.tags),
    last_contacted_at: iso,
    updated_at: iso,
  })
  if (updateErr) return { kind: 'error', code: updateErr.code }
  return { kind: 'updated', id: raced.id }
}

/**
 * Fan an in-app notification out to every admin. Same insert as Inquire
 * notifyAdmins: type `system_general`, table `notifications`. Best-effort.
 */
export async function notifyAdminsOfAiGeorgeLead(
  db: AiGeorgeDb,
  lead: CleanAiGeorgeLead,
  prospectId?: string | null,
): Promise<{ notified: number; code?: string }> {
  const { data, error } = await db.listAdminIds()
  if (error) return { notified: 0, code: error.code }
  const admins = data ?? []
  if (admins.length === 0) return { notified: 0 }

  const copy = aiGeorgeNotificationCopy(lead, prospectId)
  const rows = admins.map(a => ({
    user_id: a.id,
    type: 'system_general',
    title: copy.title,
    body: copy.body,
    action_url: copy.actionUrl,
    is_read: false,
  }))

  const { error: insertErr } = await db.insertNotifications(rows)
  if (insertErr) return { notified: 0, code: insertErr.code }
  return { notified: rows.length }
}
