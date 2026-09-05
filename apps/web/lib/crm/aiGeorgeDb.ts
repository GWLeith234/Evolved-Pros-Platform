/**
 * Supabase adapter for the AI George lead DB port.
 *
 * Same adminClient / RLS-bypass write path as speaking/inquiryDb: the webhook
 * has no user session and crm_prospects has RLS with no public policies.
 */

import { adminClient } from '@/lib/supabase/admin'
import type { AiGeorgeDb, ProspectRow } from './aiGeorge'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = adminClient as any

const PROSPECT_COLS = 'id, notes, phone, company, email, tags'

export const supabaseAiGeorgeDb: AiGeorgeDb = {
  async insertProspect(row) {
    const { data, error } = await db.from('crm_prospects').insert(row).select('id').single()
    return {
      data: data?.id ? { id: String(data.id) } : null,
      error: error ? { code: error.code } : null,
    }
  },

  async findProspectByEmail(email) {
    const { data, error } = await db
      .from('crm_prospects')
      .select(PROSPECT_COLS)
      .eq('email', email)
      .maybeSingle()
    return {
      data: (data as ProspectRow | null) ?? null,
      error: error ? { code: error.code } : null,
    }
  },

  async findProspectByPhone(phone) {
    const { data, error } = await db
      .from('crm_prospects')
      .select(PROSPECT_COLS)
      .eq('phone', phone)
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
