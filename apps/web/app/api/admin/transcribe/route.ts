export const dynamic = 'force-dynamic'
// Allow up to 5 minutes for long audio files
export const maxDuration = 300

import OpenAI from 'openai'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const adminClient = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  // Auth — admin only
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let episodeId: string
  let audioUrl: string
  try {
    const body = await request.json()
    episodeId = body.episodeId
    audioUrl = body.audioUrl
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!episodeId || typeof episodeId !== 'string') {
    return NextResponse.json({ error: 'episodeId is required' }, { status: 422 })
  }
  if (!audioUrl || typeof audioUrl !== 'string') {
    return NextResponse.json({ error: 'audioUrl is required' }, { status: 422 })
  }

  // Fetch the audio file
  let audioResponse: Response
  try {
    audioResponse = await fetch(audioUrl)
    if (!audioResponse.ok) {
      return NextResponse.json(
        { error: `Failed to fetch audio: HTTP ${audioResponse.status}` },
        { status: 422 }
      )
    }
  } catch (e) {
    return NextResponse.json(
      { error: `Could not reach audio URL: ${e instanceof Error ? e.message : 'fetch failed'}` },
      { status: 422 }
    )
  }

  const audioBlob = await audioResponse.blob()
  const audioFile = new File([audioBlob], 'episode.mp3', { type: 'audio/mpeg' })

  // Send to Whisper
  let transcription: string
  try {
    const result = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: 'text',
    })
    transcription = result as unknown as string
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Whisper transcription failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  // Persist to episodes table
  const { error: updateError } = await adminClient
    .from('episodes')
    .update({ transcript: transcription })
    .eq('id', episodeId)

  if (updateError) {
    return NextResponse.json(
      { error: 'Transcript generated but failed to save: ' + updateError.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, transcript: transcription })
}
