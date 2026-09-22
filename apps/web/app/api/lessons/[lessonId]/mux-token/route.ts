import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { generateMuxToken } from '@/lib/mux/client'
import { canOpenLesson } from '@/lib/entitlements'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: { lessonId: string } },
) {
  const supabase = createClient()

  // SPRINT TIER-1: resolveCurrentUser (not auth.getUser) so the tier we gate
  // on is the EFFECTIVE tier — a dead subscription drops the caller to
  // community here exactly as it does on the page.
  const profile = await resolveCurrentUser(supabase)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 084 revoked mux_playback_id from authenticated. Read via service_role
  // only AFTER auth, and still fail-closed on tier below.
  const { data: lesson } = await adminClient
    .from('lessons')
    .select('mux_playback_id, is_published, sort_order, course:courses(slug, pillar_number, required_tier)')
    .eq('id', params.lessonId)
    .maybeSingle()

  if (!lesson?.is_published || !lesson.mux_playback_id) {
    return NextResponse.json({ error: 'No video' }, { status: 404 })
  }

  // SPRINT TIER-1 — THE HOLE THIS CLOSES: this route already SELECTed
  // course.required_tier and then ignored it, so any signed-in member could
  // curl a signed Mux playback token for a locked pillar's lesson and stream
  // the video. Hiding the player client-side was the only thing standing
  // between the free tier and the entire curriculum.
  //
  // The embedded select returns an object for a to-one relation, but the
  // generated types widen it to an array shape; normalise before reading.
  const courseRel = (lesson as {
    course?:
      | { required_tier?: string; slug?: string; pillar_number?: number | null }
      | { required_tier?: string; slug?: string; pillar_number?: number | null }[]
      | null
  }).course
  const courseRow = Array.isArray(courseRel) ? courseRel[0] : courseRel
  const requiredTier = courseRow?.required_tier
  const courseSlug = courseRow?.slug ?? null

  // Fail CLOSED when the course can't be resolved: a null requirement would
  // otherwise read as open. Fall back to 'pro' — the same posture as the
  // courses.required_tier column default in 078. The teaser exception still
  // applies, so Foundation lesson 1 can sign a token for the free tier.
  if (!canOpenLesson({
    tier: profile.tier,
    tierStatus: profile.tier_status,
    requiredTier: requiredTier ?? 'pro',
    courseSlug,
    pillarNumber: courseRow?.pillar_number,
    sortOrder: (lesson as { sort_order?: number | null }).sort_order,
  })) {
    return NextResponse.json({ error: 'Upgrade required' }, { status: 403 })
  }

  const token = await generateMuxToken(lesson.mux_playback_id)
  return NextResponse.json({ token, playbackId: lesson.mux_playback_id })
}
