import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface MuxWebhookPayload {
  type: string
  data: {
    id: string // asset_id
    playback_ids?: Array<{ id: string; policy: string }>
  }
}

export async function POST(req: Request) {
  let payload: MuxWebhookPayload
  try {
    payload = await req.json() as MuxWebhookPayload
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  // RLS-FIX: webhook has no user session, so auth.uid() is NULL and every
  // RLS policy rejects. Use adminClient for all queries.

  // Log webhook
  await adminClient.from('mux_webhooks').insert({
    event_type: payload.type,
    asset_id: payload.data.id,
    playback_id: payload.data.playback_ids?.[0]?.id ?? null,
    payload: payload as unknown as Record<string, unknown>,
  })

  if (payload.type === 'video.asset.ready') {
    const assetId = payload.data.id
    const playbackId = payload.data.playback_ids?.[0]?.id

    if (playbackId) {
      await adminClient
        .from('lessons')
        .update({ mux_playback_id: playbackId })
        .eq('mux_asset_id', assetId)
    }
  }

  return NextResponse.json({ received: true })
}
