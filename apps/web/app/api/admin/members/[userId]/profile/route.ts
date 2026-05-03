export const dynamic = 'force-dynamic'

import { adminClient } from '@/lib/supabase/admin'
import { requireAdminApi } from '@/lib/admin/helpers'

export async function PATCH(
  request: Request,
  { params }: { params: { userId: string } },
) {
  const guard = await requireAdminApi()
  if (guard instanceof Response) return guard

  const body = await request.json() as {
    display_name?: string
    full_name?: string
    tier?: string
    tier_status?: string
    avatar_url?: string
    banner_url?: string
    company?: string
    linkedin_url?: string
    website_url?: string
    twitter_handle?: string
    phone?: string
    phone_visible?: boolean
    current_pillar?: string | null
    goal_90day?: string
    goal_visible?: boolean
  }

  const VALID_PILLARS = new Set(['p1', 'p2', 'p3', 'p4', 'p5', 'p6'])

  // Only update fields that were explicitly sent
  const update: Record<string, unknown> = {}
  if (body.display_name    !== undefined) update.display_name    = body.display_name
  if (body.full_name       !== undefined) update.full_name       = body.full_name
  if (body.tier            !== undefined) update.tier            = body.tier
  if (body.tier_status     !== undefined) update.tier_status     = body.tier_status
  if (body.avatar_url      !== undefined) update.avatar_url      = body.avatar_url
  if (body.banner_url      !== undefined) update.banner_url      = body.banner_url
  if (body.company         !== undefined) update.company         = body.company
  if (body.linkedin_url    !== undefined) update.linkedin_url    = body.linkedin_url
  if (body.website_url     !== undefined) update.website_url     = body.website_url
  if (body.twitter_handle  !== undefined) update.twitter_handle  = body.twitter_handle
  if (body.phone           !== undefined) update.phone           = body.phone
  if (body.phone_visible   !== undefined) update.phone_visible   = body.phone_visible
  if (body.current_pillar  !== undefined) {
    if (body.current_pillar !== null && !VALID_PILLARS.has(body.current_pillar)) {
      return Response.json({ error: 'Invalid current_pillar value' }, { status: 422 })
    }
    update.current_pillar = body.current_pillar
  }
  if (body.goal_90day      !== undefined) update.goal_90day      = body.goal_90day
  if (body.goal_visible    !== undefined) update.goal_visible     = body.goal_visible

  if (!Object.keys(update).length) {
    return Response.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { error } = await adminClient
    .from('users')
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq('id', params.userId)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ ok: true })
}
