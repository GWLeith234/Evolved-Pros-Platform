import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { generateFitMuxToken } from '@/lib/mux/client'
import { canAccessFit } from '@/lib/entitlements'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: { moveId: string } },
) {
  const supabase = createClient()

  // resolveCurrentUser applies effectiveTier. canAccessFit applies it
  // again from tier + tier_status so a lapsed VIP cannot sign a token.
  const profile = await resolveCurrentUser(supabase)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!canAccessFit(profile.tier, profile.tier_status)) {
    return NextResponse.json({ error: 'Upgrade required' }, { status: 403 })
  }

  // mux_playback_id is revoked from anon and authenticated. Read it with
  // the service role only after the gate, and only for a published guide
  // whose video is ready.
  const { data: move } = await adminClient
    .from('fit_moves')
    .select('id, status, video_status, mux_playback_id')
    .eq('id', params.moveId)
    .maybeSingle()

  if (
    !move
    || move.status !== 'published'
    || move.video_status !== 'ready'
    || !move.mux_playback_id
  ) {
    return NextResponse.json({ error: 'No video' }, { status: 404 })
  }

  const token = await generateFitMuxToken(move.mux_playback_id)
  if (!token) {
    return NextResponse.json({ error: 'Playback unavailable' }, { status: 503 })
  }

  return NextResponse.json({ token, playbackId: move.mux_playback_id })
}
