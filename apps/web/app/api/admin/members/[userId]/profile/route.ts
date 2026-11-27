export const dynamic = 'force-dynamic'

import { adminClient } from '@/lib/supabase/admin'
import { requireAdminApi } from '@/lib/admin/helpers'
import { clientSafeError } from '@/lib/http/clientError'
import {
  FOG_PROMO_CODE,
  friendsOfGeorgeToCompPromoCodeId,
  shouldApplyFriendsOfGeorge,
} from '@/lib/admin/fog'
import { PROFILE_STRING_LIMITS, readJsonObject, readProfileImageUrl } from '@/lib/onboarding/profilePatch'

type ProfileImageField = 'avatar_url' | 'banner_url'

// null and blank clear, same as PATCH /api/user/me. Any other value must pass
// the member avatar/banner reader (http(s), 2048, no CSS/src breakout).
function readAdminProfileImage(
  field: ProfileImageField,
  value: unknown,
): { ok: true; value: string | null } | { ok: false; error: string } {
  if (value === null) return { ok: true, value: null }
  if (typeof value !== 'string') return { ok: false, error: `${field} must be a string` }
  if (value.trim() === '') return { ok: true, value: null }
  const read = readProfileImageUrl(value)
  if (!read.ok) {
    if (read.error === 'url too long') {
      return { ok: false, error: `${field} exceeds maximum length of ${PROFILE_STRING_LIMITS.avatar_url}` }
    }
    return { ok: false, error: `${field} must be http(s)` }
  }
  return { ok: true, value: read.url }
}

export async function PATCH(
  request: Request,
  { params }: { params: { userId: string } },
) {
  const guard = await requireAdminApi()
  if (guard instanceof Response) return guard

  const parsed = await readJsonObject(request)
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 })

  const body = parsed.body as {
    display_name?: string
    full_name?: string
    tier?: string
    tier_status?: string
    avatar_url?: unknown
    banner_url?: unknown
    company?: string
    linkedin_url?: string
    website_url?: string
    twitter_handle?: string
    phone?: string
    phone_visible?: boolean
    current_pillar?: string | null
    goal_90day?: string
    goal_visible?: boolean
    friends_of_george?: boolean
  }

  const VALID_PILLARS = new Set(['p1', 'p2', 'p3', 'p4', 'p5', 'p6'])

  // Only update fields that were explicitly sent
  const update: Record<string, unknown> = {}
  if (body.display_name    !== undefined) update.display_name    = body.display_name
  if (body.full_name       !== undefined) update.full_name       = body.full_name
  if (body.tier            !== undefined) update.tier            = body.tier
  if (body.tier_status     !== undefined) update.tier_status     = body.tier_status
  if (body.avatar_url !== undefined) {
    const read = readAdminProfileImage('avatar_url', body.avatar_url)
    if (!read.ok) return Response.json({ error: read.error }, { status: 422 })
    update.avatar_url = read.value
  }
  if (body.banner_url !== undefined) {
    const read = readAdminProfileImage('banner_url', body.banner_url)
    if (!read.ok) return Response.json({ error: read.error }, { status: 422 })
    update.banner_url = read.value
  }
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

  // FOG flag writes users.comp_promo_code_id via the seeded FRIENDSOFGEORGE
  // code. No roster backfill — only the member being edited is touched.
  if (shouldApplyFriendsOfGeorge(body)) {
    let fogPromoCodeId: string | null = null
    if (body.friends_of_george) {
      const { data: fogCode } = await (adminClient as any)
        .from('promo_codes')
        .select('id')
        .eq('code', FOG_PROMO_CODE)
        .maybeSingle()
      fogPromoCodeId = fogCode?.id ?? null
    }
    const mapped = friendsOfGeorgeToCompPromoCodeId(body.friends_of_george === true, fogPromoCodeId)
    if ('error' in mapped) {
      return Response.json({ error: mapped.error }, { status: 500 })
    }
    update.comp_promo_code_id = mapped.value
  }

  if (!Object.keys(update).length) {
    return Response.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { error } = await adminClient
    .from('users')
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq('id', params.userId)

  if (error) {
    return Response.json(
      { error: clientSafeError('[PATCH /api/admin/members/[userId]/profile]', error, 'Could not update that member.') },
      { status: 500 },
    )
  }

  return Response.json({ ok: true })
}
