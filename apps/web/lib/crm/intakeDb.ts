/**
 * Supabase adapter for the shared CRM intake DB port.
 *
 * Kept apart from ./intake so the pure logic there stays importable by tests
 * without pulling in the service-role client or its env requirements.
 *
 * Writes go through adminClient (service role) because public form endpoints
 * have no session and crm_prospects has RLS with no public policies.
 */

import { adminClient } from '@/lib/supabase/admin'
import type { IntakeDb, IntakeProspectRow } from './intake'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = adminClient as any

export const supabaseIntakeDb: IntakeDb = {
  async insertProspect(row) {
    const { error } = await db.from('crm_prospects').insert(row)
    return { error: error ? { code: error.code } : null }
  },

  async findProspectByEmail(email) {
    const { data, error } = await db
      .from('crm_prospects')
      .select('id, notes, tags, phone, company, stage')
      .eq('email', email)
      .maybeSingle()
    return {
      data: (data as IntakeProspectRow | null) ?? null,
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
