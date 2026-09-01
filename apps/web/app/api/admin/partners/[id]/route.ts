export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { requireAdminApi } from '@/lib/admin/helpers'

const VALID_TYPES = ['sponsor', 'affiliate'] as const
const VALID_STATUS = ['active', 'paused', 'expired'] as const
const VALID_SURFACES = ['home', 'rail', 'events', 'podcast', 'academy'] as const

function pickString(v: unknown, max = 500): string | null | undefined {
  if (v === undefined) return undefined
  if (v === null) return null
  if (typeof v !== 'string') return undefined
  const s = v.trim()
  return s ? s.slice(0, max) : null
}
function pickNumber(v: unknown): number | null | undefined {
  if (v === undefined) return undefined
  if (v === null) return null
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim()) {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  return undefined
}
function pickEnum<T extends string>(v: unknown, allowed: readonly T[]): T | undefined {
  if (typeof v !== 'string') return undefined
  const s = v.trim().toLowerCase() as T
  return allowed.includes(s) ? s : undefined
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdminApi()
  if (guard instanceof Response) return guard

  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const update: Record<string, unknown> = {}
  const set = (k: string, v: unknown) => { if (v !== undefined) update[k] = v }

  set('name',           pickString(body.name, 200))
  set('url',            pickString(body.url, 1000))
  set('logo_url',       pickString(body.logo_url, 1000))
  set('brand_color',    pickString(body.brand_color, 32))
  set('type',           pickEnum(body.type, VALID_TYPES))
  set('tagline',        pickString(body.tagline, 200))
  set('body_copy',      pickString(body.body_copy, 1000))
  set('cta_text',       pickString(body.cta_text, 64))
  set('cta_url',        pickString(body.cta_url, 1000))
  set('status',         pickEnum(body.status, VALID_STATUS))
  set('contract_start', pickString(body.contract_start, 32))
  set('contract_end',   pickString(body.contract_end, 32))
  set('impression_cap', pickNumber(body.impression_cap))
  set('commission_pct', pickNumber(body.commission_pct))
  set('tracking_id',    pickString(body.tracking_id, 200))

  if (Object.keys(update).length > 0) {
    const { error } = await adminClient
      .from('sponsors')
      .update(update as never)
      .eq('id', params.id)
    if (error) {
      console.error('[partners] update failed:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  // Replace placements if `surfaces` was passed (treat absence as "leave alone").
  if (Array.isArray(body.surfaces)) {
    const surfaces = (body.surfaces as unknown[])
      .filter((s): s is string => typeof s === 'string')
      .map(s => s.trim().toLowerCase())
      .filter((s): s is typeof VALID_SURFACES[number] =>
        (VALID_SURFACES as readonly string[]).includes(s),
      )

    await adminClient.from('sponsor_placements').delete().eq('sponsor_id', params.id)
    if (surfaces.length > 0) {
      const rows = surfaces.map(surface => ({
        sponsor_id: params.id,
        surface,
        enabled: true,
        weight: 1,
      }))
      const { error: pErr } = await adminClient.from('sponsor_placements').insert(rows as never)
      if (pErr) console.error('[partners] placement replace failed:', pErr.message)
    }
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdminApi()
  if (guard instanceof Response) return guard

  // Soft-delete: status='expired'. Keeps impressions / clicks history intact.
  const { error } = await adminClient
    .from('sponsors')
    .update({ status: 'expired' } as never)
    .eq('id', params.id)

  if (error) {
    console.error('[partners] soft-delete failed:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
