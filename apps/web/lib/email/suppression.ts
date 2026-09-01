/**
 * Suppression writes for the unsubscribe flow (SPRINT EM-1).
 *
 * Shared by the human-facing page and the RFC 8058 One-Click POST route so the
 * two can never drift on what "unsubscribed" means.
 *
 * Every write here is by prospect id from a verified token — never by an email
 * address supplied in a request — so a valid signature is the only way to
 * suppress a contact. Nothing logs an address; failures log codes.
 */

import { adminClient } from '@/lib/supabase/admin'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = adminClient as any

export type SuppressionResult = 'ok' | 'not_found' | 'error'

/**
 * Mark a prospect unsubscribed. Idempotent by design: an existing
 * unsubscribed_at is left untouched, so re-clicking a link in an old email
 * never rewrites the original suppression date — that timestamp is the
 * compliance record of when they actually asked.
 */
export async function suppressProspect(prospectId: string): Promise<SuppressionResult> {
  const { data, error } = await db
    .from('crm_prospects')
    .select('id, unsubscribed_at')
    .eq('id', prospectId)
    .maybeSingle()

  if (error) {
    console.error('[suppression] lookup failed', error.code ?? 'unknown')
    return 'error'
  }
  if (!data) return 'not_found'
  if (data.unsubscribed_at) return 'ok'

  const now = new Date().toISOString()
  const { error: updateErr } = await db
    .from('crm_prospects')
    .update({ unsubscribed_at: now, updated_at: now })
    .eq('id', prospectId)

  if (updateErr) {
    console.error('[suppression] update failed', updateErr.code ?? 'unknown')
    return 'error'
  }
  return 'ok'
}

/** Clear suppression — the "changed your mind?" path on the confirmation page. */
export async function resubscribeProspect(prospectId: string): Promise<SuppressionResult> {
  const now = new Date().toISOString()
  const { data, error } = await db
    .from('crm_prospects')
    .update({ unsubscribed_at: null, updated_at: now })
    .eq('id', prospectId)
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('[suppression] resubscribe failed', error.code ?? 'unknown')
    return 'error'
  }
  return data ? 'ok' : 'not_found'
}
