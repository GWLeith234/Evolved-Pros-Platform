export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { requireAdminApi } from '@/lib/admin/helpers'

const VALID_TYPES = ['sponsor', 'affiliate'] as const
const VALID_STATUS = ['active', 'paused', 'expired'] as const
const VALID_SURFACES = ['home', 'rail', 'events', 'podcast', 'academy'] as const

interface PartnerInsertBody {
  name?: unknown
  url?: unknown
  logo_url?: unknown
  brand_color?: unknown
  type?: unknown
  tagline?: unknown
  body_copy?: unknown
  cta_text?: unknown
  cta_url?: unknown
  status?: unknown
  contract_start?: unknown
  contract_end?: unknown
  impression_cap?: unknown
  commission_pct?: unknown
  tracking_id?: unknown
  surfaces?: unknown
}

function pickString(v: unknown, max = 500): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  return s ? s.slice(0, max) : null
}
function pickNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim()) {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  return null
}
function pickEnum<T extends string>(v: unknown, allowed: readonly T[]): T | null {
  if (typeof v !== 'string') return null
  const s = v.trim().toLowerCase() as T
  return allowed.includes(s) ? s : null
}

export async function POST(request: Request) {
  const guard = await requireAdminApi()
  if (guard instanceof Response) return guard

  let body: PartnerInsertBody
  try { body = (await request.json()) as PartnerInsertBody } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const name = pickString(body.name, 200)
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 422 })

  const type   = pickEnum(body.type,   VALID_TYPES)   ?? 'sponsor'
  const status = pickEnum(body.status, VALID_STATUS)  ?? 'active'

  const surfaces = Array.isArray(body.surfaces)
    ? (body.surfaces as unknown[])
        .filter((s): s is string => typeof s === 'string')
        .map(s => s.trim().toLowerCase())
        .filter((s): s is typeof VALID_SURFACES[number] =>
          (VALID_SURFACES as readonly string[]).includes(s),
        )
    : []

  const insert = {
    name,
    url:            pickString(body.url, 1000),
    logo_url:       pickString(body.logo_url, 1000),
    brand_color:    pickString(body.brand_color, 32),
    type,
    tagline:        pickString(body.tagline, 200),
    body_copy:      pickString(body.body_copy, 1000),
    cta_text:       pickString(body.cta_text, 64),
    cta_url:        pickString(body.cta_url, 1000),
    status,
    contract_start: pickString(body.contract_start, 32),
    contract_end:   pickString(body.contract_end, 32),
    impression_cap: pickNumber(body.impression_cap),
    commission_pct: pickNumber(body.commission_pct),
    tracking_id:    pickString(body.tracking_id, 200),
  }

  const { data: row, error } = await adminClient
    .from('sponsors')
    .insert(insert as never)
    .select('id')
    .single()

  if (error || !row) {
    console.error('[partners] insert failed:', error?.message)
    return NextResponse.json({ error: error?.message ?? 'Insert failed' }, { status: 500 })
  }

  if (surfaces.length > 0) {
    const placementRows = surfaces.map(surface => ({
      sponsor_id: (row as { id: string }).id,
      surface,
      enabled: true,
      weight: 1,
    }))
    const { error: pErr } = await adminClient.from('sponsor_placements').insert(placementRows as never)
    if (pErr) {
      console.error('[partners] placement insert failed:', pErr.message)
      // Don't fail the whole create — placements can be added later from the edit page.
    }
  }

  return NextResponse.json({ id: (row as { id: string }).id }, { status: 201 })
}
