/**
 * Shared CRM intake primitives (Phase B).
 *
 * Extracted from LIVE Inquire (#115) and book preorder so join, guest,
 * welcome, redeem, and Stripe can reuse the same insert-on-conflict-then-PATCH
 * dance and the same admin NotifBell fanout. Nothing here imports the
 * Supabase client — see ./intakeDb.
 *
 * PII: callers must never log field values from here. Postgres embeds the
 * conflicting value in a unique-violation message, so error paths log codes.
 */

import { normalizeTags } from '@/lib/admin/crm'
import { normalizeTierKey } from '@/lib/pricing'

export const PG_UNIQUE_VIOLATION = '23505'

export const CRM_INTAKE_ACTION_URL = '/admin/crm' as const
export const CRM_INTAKE_NOTIF_TYPE = 'system_general' as const

/** Locked Phase B tags (George YES via CoS). All lowercase; survive normalizeTags. */
export const LIVE_INQUIRE_TAG = 'live inquire' as const
export const JOIN_TAG = 'join' as const
export const BOOK_PREORDER_TAG = 'book preorder' as const
export const PODCAST_GUEST_TAG = 'podcast guest' as const
export const FRIEND_OF_GEORGE_TAG = 'friend of george' as const
export const COMP_TAG = 'comp' as const
export const PAID_TAG = 'paid' as const

export const LIVE_INQUIRE_SOURCE = 'keynote-inquiry' as const
export const JOIN_SOURCE = 'join' as const
export const GUEST_SOURCE = 'podcast-guest' as const
export const WELCOME_SOURCE = 'welcome-claim' as const
export const REDEEM_SOURCE = 'redeem' as const
export const PAID_SOURCE = 'stripe-checkout' as const

export type CrmIntakeStage = 'lead' | 'prospect' | 'community' | 'vip' | 'professional'

/** Map users.tier (`pro` or `professional`) onto a crm_prospects stage. */
export function crmStageForTier(tier: string | null | undefined): CrmIntakeStage {
  const key = normalizeTierKey(tier)
  if (key === 'professional') return 'professional'
  if (key === 'vip') return 'vip'
  if (key === 'community') return 'community'
  return 'lead'
}

const STAGE_RANK: Record<string, number> = {
  lead: 0,
  prospect: 1,
  community: 2,
  vip: 3,
  professional: 4,
}

export interface IntakeProspectRow {
  id: string
  notes: string | null
  tags?: string[] | null
  phone?: string | null
  company?: string | null
  stage?: string | null
}

export interface DbError {
  code?: string
}

export interface IntakeDb {
  insertProspect(row: Record<string, unknown>): Promise<{ error: DbError | null }>
  findProspectByEmail(email: string): Promise<{ data: IntakeProspectRow | null; error: DbError | null }>
  updateProspect(id: string, patch: Record<string, unknown>): Promise<{ error: DbError | null }>
  listAdminIds(): Promise<{ data: Array<{ id: string }> | null; error: DbError | null }>
  insertNotifications(rows: Array<Record<string, unknown>>): Promise<{ error: DbError | null }>
}

export type IntakeUpsertOutcome =
  | { kind: 'created'; addedTags: string[] }
  | { kind: 'updated'; addedTags: string[] }
  | { kind: 'error'; code?: string }

export type NotifyOutcome = { notified: number; code?: string }

export function mergeTags(existing: unknown, extra: string[]): string[] {
  const current = Array.isArray(existing) ? existing : []
  return normalizeTags([...current, ...extra])
}

export function tagsNewlyAdded(before: unknown, after: string[]): string[] {
  const prev = new Set(normalizeTags(Array.isArray(before) ? before : []))
  return after.filter(t => !prev.has(t))
}

export function prependNotes(existing: string | null | undefined, block: string): string {
  const prev = (existing ?? '').trim()
  return prev ? `${block}\n\n---\n\n${prev}` : block
}

export function isoDay(now: Date): string {
  return now.toISOString().slice(0, 10)
}

/** Promote only. Never demote vip / professional / a higher stage. */
export function shouldPromoteStage(
  current: string | null | undefined,
  target: string,
): boolean {
  const next = STAGE_RANK[target]
  if (next == null) return false
  const cur = STAGE_RANK[current ?? 'lead'] ?? 0
  return next > cur
}

export interface IntakeWrite {
  email: string
  full_name: string
  source: string
  tags: string[]
  notesBlock: string
  stage?: string
  consent_basis?: string
  keynote_interest?: boolean
  phone?: string | null
  company?: string | null
  title?: string | null
  user_id?: string | null
  /** Always merged onto the update patch (e.g. keynote_interest: true). */
  updateExtras?: Record<string, unknown>
  /** Promote on update only when the existing stage ranks lower. */
  promoteStage?: string | null
}

/**
 * Record a form-fill against crm_prospects.
 *
 * New contact  → insert as a lead (or the supplied stage) with express consent.
 * Known contact→ the insert hits the 076 unique index on lower(email); we then
 *                fetch and PATCH. Stage, status, consent_basis and source are
 *                left alone unless promoteStage is a genuine promotion.
 *                Tags are merged. Notes are prepended.
 */
export async function upsertIntakeProspect(
  db: IntakeDb,
  write: IntakeWrite,
  now: Date = new Date(),
): Promise<IntakeUpsertOutcome> {
  const iso = now.toISOString()
  const tags = mergeTags([], write.tags)

  const insertRow: Record<string, unknown> = {
    full_name: write.full_name,
    email: write.email,
    notes: write.notesBlock,
    stage: write.stage ?? 'lead',
    status: 'active',
    source: write.source,
    consent_basis: write.consent_basis ?? 'express',
    keynote_interest: write.keynote_interest ?? false,
    enrichment_status: 'none',
    tags,
    last_contacted_at: iso,
    updated_at: iso,
  }
  if (write.phone !== undefined) insertRow.phone = write.phone
  if (write.company !== undefined) insertRow.company = write.company
  if (write.title !== undefined) insertRow.title = write.title
  if (write.user_id !== undefined) insertRow.user_id = write.user_id

  const { error: insertErr } = await db.insertProspect(insertRow)
  if (!insertErr) return { kind: 'created', addedTags: tags }
  if (insertErr.code !== PG_UNIQUE_VIOLATION) return { kind: 'error', code: insertErr.code }

  const { data: existing, error: findErr } = await db.findProspectByEmail(write.email)
  if (findErr) return { kind: 'error', code: findErr.code }
  if (!existing) return { kind: 'error', code: 'not_found_after_conflict' }

  const mergedTags = mergeTags(existing.tags, write.tags)
  const addedTags = tagsNewlyAdded(existing.tags, mergedTags)

  const patch: Record<string, unknown> = {
    tags: mergedTags,
    notes: prependNotes(existing.notes, write.notesBlock),
    last_contacted_at: iso,
    updated_at: iso,
    ...write.updateExtras,
  }
  if (write.phone) patch.phone = write.phone
  if (write.company) patch.company = write.company
  if (write.user_id) patch.user_id = write.user_id
  if (write.title) patch.title = write.title
  if (write.promoteStage && shouldPromoteStage(existing.stage, write.promoteStage)) {
    patch.stage = write.promoteStage
  }

  const { error: updateErr } = await db.updateProspect(existing.id, patch)
  if (updateErr) return { kind: 'error', code: updateErr.code }

  return { kind: 'updated', addedTags }
}

/**
 * Fan an in-app notification out to every admin. Best-effort: a notification
 * failure must not fail the intake, so this reports rather than throws.
 *
 * Same table and type as #110 / #115: system_general to users.role = 'admin'.
 */
export async function notifyIntakeAdmins(
  db: Pick<IntakeDb, 'listAdminIds' | 'insertNotifications'>,
  copy: { title: string; body: string; actionUrl?: string },
): Promise<NotifyOutcome> {
  const { data, error } = await db.listAdminIds()
  if (error) return { notified: 0, code: error.code }
  const admins = data ?? []
  if (admins.length === 0) return { notified: 0 }

  const rows = admins.map(a => ({
    user_id: a.id,
    type: CRM_INTAKE_NOTIF_TYPE,
    title: copy.title,
    body: copy.body,
    action_url: copy.actionUrl ?? CRM_INTAKE_ACTION_URL,
    is_read: false,
  }))

  const { error: insertErr } = await db.insertNotifications(rows)
  if (insertErr) return { notified: 0, code: insertErr.code }
  return { notified: rows.length }
}
