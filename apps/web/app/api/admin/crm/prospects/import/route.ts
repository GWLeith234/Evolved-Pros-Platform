export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { requireAdminApi } from '@/lib/admin/helpers'
import { CRM_SELECT_COLS, CRM_STAGE_META } from '@/lib/admin/crm'

interface ImportRow {
  full_name?: unknown
  email?: unknown
  phone?: unknown
  company?: unknown
  notes?: unknown
  source?: unknown
}

/**
 * POST /api/admin/crm/prospects/import — bulk-load prospects into the LEAD
 * stage from a parsed CSV. Body: { rows: ImportRow[] }. Rows without a name or
 * a valid email are skipped. Emails already present in the pipeline are skipped
 * (idempotent re-imports). Returns the created prospects so the board can
 * prepend them without a refetch.
 */
export async function POST(request: Request) {
  const auth = await requireAdminApi()
  if (auth instanceof Response) return auth

  let body: { rows?: ImportRow[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!Array.isArray(body.rows) || body.rows.length === 0) {
    return NextResponse.json({ error: 'No rows to import' }, { status: 422 })
  }
  if (body.rows.length > 5000) {
    return NextResponse.json({ error: 'Too many rows (max 5000 per import)' }, { status: 422 })
  }

  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
  const now = new Date().toISOString()
  const leadMrr = CRM_STAGE_META.lead.mrr

  // Validate + de-dupe within the file itself.
  const seen = new Set<string>()
  let skipped = 0
  const candidates = body.rows
    .map(r => {
      const full_name = str(r.full_name)
      const email = str(r.email).toLowerCase()
      if (!full_name || !email.includes('@') || seen.has(email)) { skipped++; return null }
      seen.add(email)
      return {
        full_name,
        email,
        phone: str(r.phone) || null,
        company: str(r.company) || null,
        notes: str(r.notes) || null,
        source: str(r.source) || 'csv-import',
        stage: 'lead' as const,
        status: 'active' as const,
        value_monthly: leadMrr,
        created_by: auth.userId,
        updated_at: now,
      }
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)

  if (candidates.length === 0) {
    return NextResponse.json({ inserted: 0, skipped, prospects: [] })
  }

  // Skip emails that already exist so re-imports don't create duplicates.
  const emails = candidates.map(c => c.email)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingRows } = await (adminClient as any)
    .from('crm_prospects')
    .select('email')
    .in('email', emails)
  const existing = new Set<string>((existingRows ?? []).map((r: { email: string }) => r.email.toLowerCase()))
  const toInsert = candidates.filter(c => !existing.has(c.email))
  skipped += candidates.length - toInsert.length

  if (toInsert.length === 0) {
    return NextResponse.json({ inserted: 0, skipped, prospects: [] })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (adminClient as any)
    .from('crm_prospects')
    .insert(toInsert)
    .select(CRM_SELECT_COLS)

  if (error) {
    console.error('[POST /api/admin/crm/prospects/import]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ inserted: data?.length ?? 0, skipped, prospects: data ?? [] }, { status: 201 })
}
