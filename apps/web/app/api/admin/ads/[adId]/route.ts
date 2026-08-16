export const dynamic = 'force-dynamic'

import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/helpers'

export async function PATCH(
  request: Request,
  { params }: { params: { adId: string } }
) {
  const auth = await requireAdminApi()
  if (auth instanceof Response) return auth

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const allowed = ['zone', 'ad_type', 'sponsor_name', 'image_url', 'click_url', 'headline', 'body_copy', 'cta_text', 'start_date', 'end_date', 'is_active', 'sort_order', 'placements'] as const
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields' }, { status: 422 })
  }

  // RLS-FIX: adminClient — see ads/route.ts.
  const { data, error } = await adminClient
    .from('platform_ads')
    .update(update)
    .eq('id', params.adId)
    .select()
    .single()

  if (error || !data) return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  const { revalidateTag } = await import('next/cache')
  const { CACHE_TAGS } = await import('@/lib/cache/shared')
  revalidateTag(CACHE_TAGS.platformAds)
  return NextResponse.json(data)
}

export async function DELETE(
  _request: Request,
  { params }: { params: { adId: string } }
) {
  const auth = await requireAdminApi()
  if (auth instanceof Response) return auth

  const { error } = await adminClient.from('platform_ads').delete().eq('id', params.adId)
  if (error) return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  const { revalidateTag } = await import('next/cache')
  const { CACHE_TAGS } = await import('@/lib/cache/shared')
  revalidateTag(CACHE_TAGS.platformAds)
  return new NextResponse(null, { status: 204 })
}
