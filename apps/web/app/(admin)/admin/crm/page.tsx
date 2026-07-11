import { headers } from 'next/headers'
import { adminClient } from '@/lib/supabase/admin'
import { CrmBoard } from '@/components/admin/crm/CrmBoard'
import type { CrmProspect } from '@/lib/admin/crm'
import { isCrmStage, isCrmStatus } from '@/lib/admin/crm'

export const dynamic = 'force-dynamic'

export default async function AdminCrmPage() {
  const h = headers()
  // Prefetch-only short-circuit (same pattern as members/pipeline)
  if (h.get('Next-Router-Prefetch') === '1') {
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (adminClient as any)
    .from('crm_prospects')
    .select(
      'id, full_name, email, phone, company, notes, stage, status, source, last_contacted_at, user_id, created_by, created_at, updated_at',
    )
    .order('updated_at', { ascending: false })
    .limit(500)

  if (error) {
    console.error('[admin/crm] load failed:', error.message)
  }

  const raw = (data ?? []) as Array<Record<string, unknown>>
  const prospects: CrmProspect[] = raw
    .filter(r => typeof r.id === 'string' && typeof r.email === 'string')
    .map(r => ({
      id: r.id as string,
      full_name: String(r.full_name ?? ''),
      email: String(r.email ?? ''),
      phone: (r.phone as string | null) ?? null,
      company: (r.company as string | null) ?? null,
      notes: (r.notes as string | null) ?? null,
      stage: isCrmStage(r.stage) ? r.stage : 'lead',
      status: isCrmStatus(r.status) ? r.status : 'active',
      source: (r.source as string | null) ?? null,
      last_contacted_at: (r.last_contacted_at as string | null) ?? null,
      user_id: (r.user_id as string | null) ?? null,
      created_by: (r.created_by as string | null) ?? null,
      created_at: String(r.created_at ?? new Date().toISOString()),
      updated_at: String(r.updated_at ?? new Date().toISOString()),
    }))

  const tableMissing =
    error &&
    (error.message?.includes('does not exist') ||
      error.message?.includes('schema cache') ||
      error.code === '42P01')

  return (
    <div className="px-4 sm:px-8 py-6">
      {tableMissing && (
        <div
          className="mb-4 rounded-md px-4 py-3"
          style={{
            background: 'rgba(201,168,76,0.12)',
            border: '1px solid rgba(201,168,76,0.35)',
            color: '#8B6A00',
          }}
        >
          <p className="font-condensed font-bold uppercase text-[11px] tracking-wider m-0 mb-1">
            Migration required
          </p>
          <p className="font-body text-[13px] m-0">
            Run <code>060_crm_prospects.sql</code> against Supabase, then reload this page.
            The board will work empty until then.
          </p>
        </div>
      )}
      <CrmBoard initialProspects={prospects} />
    </div>
  )
}
