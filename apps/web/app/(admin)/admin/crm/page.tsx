import { headers } from 'next/headers'
import { adminClient } from '@/lib/supabase/admin'
import { CrmBoard } from '@/components/admin/crm/CrmBoard'
import { CRM_SELECT_COLS, parseCrmProspect, type CrmProspect } from '@/lib/admin/crm'

export const dynamic = 'force-dynamic'

export default async function AdminCrmPage() {
  const h = headers()
  if (h.get('Next-Router-Prefetch') === '1') {
    return null
  }

  // Prefer full column set; fall back if migration 061 not applied yet.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result = await (adminClient as any)
    .from('crm_prospects')
    .select(CRM_SELECT_COLS)
    .order('updated_at', { ascending: false })
    .limit(500)

  let migration061Missing = false
  if (result.error) {
    const msg = String(result.error.message ?? '')
    if (msg.includes('value_monthly') || msg.includes('next_follow_up') || msg.includes('schema cache')) {
      migration061Missing = true
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result = await (adminClient as any)
        .from('crm_prospects')
        .select(
          'id, full_name, email, phone, company, notes, stage, status, source, last_contacted_at, user_id, created_by, created_at, updated_at',
        )
        .order('updated_at', { ascending: false })
        .limit(500)
    } else {
      console.error('[admin/crm] load failed:', result.error.message)
    }
  }

  const tableMissing =
    result.error &&
    (String(result.error.message).includes('does not exist') ||
      String(result.error.message).includes('schema cache') ||
      result.error.code === '42P01')

  const raw = (result.data ?? []) as Array<Record<string, unknown>>
  const prospects: CrmProspect[] = raw
    .map(r => parseCrmProspect(r))
    .filter((p): p is CrmProspect => p != null)

  return (
    <div className="px-4 sm:px-8 py-6">
      {(tableMissing || migration061Missing) && (
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
            {tableMissing ? (
              <>
                Run <code>060_crm_prospects.sql</code> against Supabase.
              </>
            ) : (
              <>
                Run <code>061_crm_prospects_value_followup.sql</code> to enable Value and Next Follow-up columns.
              </>
            )}
          </p>
        </div>
      )}
      <CrmBoard initialProspects={prospects} />
    </div>
  )
}
