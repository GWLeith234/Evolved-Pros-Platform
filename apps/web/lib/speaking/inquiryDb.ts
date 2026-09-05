/**
 * Supabase adapter for the keynote inquiry DB port (SPRINT KN-1).
 *
 * Kept apart from ./inquiry so the pure logic there stays importable by tests
 * without pulling in the service-role client or its env requirements.
 *
 * Writes go through adminClient (service role) because the inquiry endpoint is
 * public — the submitter has no session and crm_prospects has RLS with no
 * public policies.
 */

import { adminClient } from '@/lib/supabase/admin'
import type { InquiryDb, ProspectRow } from './inquiry'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = adminClient as any

export const supabaseInquiryDb: InquiryDb = {
  async insertProspect(row) {
    const { error } = await db.from('crm_prospects').insert(row)
    return { error: error ? { code: error.code } : null }
  },

  async findProspectByEmail(email) {
    // Emails are stored lowercase by every write path and the 076 unique index
    // is on lower(email), so an exact match is equivalent to a case-insensitive
    // one for rows this app wrote.
    const { data, error } = await db
      .from('crm_prospects')
      .select('id, notes, phone, company')
      .eq('email', email)
      .maybeSingle()
    return {
      data: (data as ProspectRow | null) ?? null,
      error: error ? { code: error.code } : null,
    }
  },

  async updateProspect(id, patch) {
    const { error } = await db.from('crm_prospects').update(patch).eq('id', id)
    return { error: error ? { code: error.code } : null }
  },

  async listAdminIds() {
    const { data, error } = await db.from('users').select('id').eq('role', 'admin')
    return {
      data: (data as Array<{ id: string }> | null) ?? null,
      error: error ? { code: error.code } : null,
    }
  },

  async insertNotifications(rows) {
    const { error } = await db.from('notifications').insert(rows)
    return { error: error ? { code: error.code } : null }
  },
}
