import { createClient } from '@/lib/supabase/server'
import { generateMuxToken } from '@/lib/mux/client'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: { lessonId: string } },
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: lesson } = await supabase
    .from('lessons')
    .select('mux_playback_id, course:courses(required_tier)')
    .eq('id', params.lessonId)
    .single()

  if (!lesson?.mux_playback_id) {
    return NextResponse.json({ error: 'No video' }, { status: 404 })
  }

  const token = await generateMuxToken(lesson.mux_playback_id)
  return NextResponse.json({ token, playbackId: lesson.mux_playback_id })
}
