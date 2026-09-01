import { createClient } from '@/lib/supabase/server'
import { generateMuxToken } from '@/lib/mux/client'
import { hasTierAccess } from '@/lib/tier'
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

  const { data: lesson } = await supabase
    .from('lessons')
    .select('mux_playback_id, course:courses(required_tier)')
    .eq('id', params.lessonId)
    .single()

  if (!lesson?.mux_playback_id) {
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
  const courseRel = (lesson as { course?: { required_tier?: string } | { required_tier?: string }[] | null }).course
  const requiredTier = Array.isArray(courseRel)
    ? courseRel[0]?.required_tier
    : courseRel?.required_tier

  // Fail CLOSED when the course can't be resolved: hasTierAccess treats a null
  // requirement as "open to everyone", which is right for events (most have no
  // tier) and wrong for a lesson video. Fall back to 'pro' — the same
  // fail-closed posture as the courses.required_tier column default in 078.
  if (!hasTierAccess(profile.tier, requiredTier ?? 'pro')) {
    return NextResponse.json({ error: 'Upgrade required' }, { status: 403 })
  }

  const token = await generateMuxToken(lesson.mux_playback_id)
  return NextResponse.json({ token, playbackId: lesson.mux_playback_id })
}
