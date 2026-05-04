import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

interface MuxWebhookPayload {
  type: string
  data: {
    id: string // asset_id
    playback_ids?: Array<{ id: string; policy: string }>
  }
}

/** Tolerate up to 5 minutes of clock skew between Mux's signing time
 *  and our server clock. Beyond this we reject the request as a replay. */
const MAX_TIMESTAMP_SKEW_MS = 5 * 60 * 1000

/**
 * Verifies the Mux-Signature header against the raw body. Header format:
 *   Mux-Signature: t=<unix-seconds>,v1=<hex-hmac-sha256>
 * The signed payload is `${timestamp}.${rawBody}` with HMAC-SHA256 keyed
 * on MUX_WEBHOOK_SECRET. Returns null when the request passes; returns
 * a NextResponse to short-circuit the handler when it fails.
 *
 * Returns null (allow) when MUX_WEBHOOK_SECRET is not configured so the
 * existing prod setup keeps working until the env var lands on Railway —
 * a one-line warning is logged each time this happens so it's visible.
 */
function verifyMuxSignature(
  rawBody: string,
  muxSig: string | null,
): NextResponse | null {
  const secret = process.env.MUX_WEBHOOK_SECRET
  if (!secret) {
    console.warn('[mux/webhook] MUX_WEBHOOK_SECRET not set — accepting unsigned payload')
    return null
  }
  if (!muxSig) {
    return NextResponse.json({ error: 'Missing Mux-Signature header' }, { status: 401 })
  }

  // Format: "t=<timestamp>,v1=<sig>" — split tolerantly so order doesn't matter.
  const parts = Object.fromEntries(
    muxSig.split(',').map(p => {
      const idx = p.indexOf('=')
      return idx === -1 ? [p, ''] : [p.slice(0, idx).trim(), p.slice(idx + 1).trim()]
    }),
  ) as Record<string, string>

  const timestamp = parts.t
  const receivedSig = parts.v1
  if (!timestamp || !receivedSig) {
    return NextResponse.json({ error: 'Malformed Mux-Signature' }, { status: 401 })
  }

  // Replay protection — reject signatures older than the tolerance window.
  const tsMs = Number.parseInt(timestamp, 10) * 1000
  if (!Number.isFinite(tsMs) || Math.abs(Date.now() - tsMs) > MAX_TIMESTAMP_SKEW_MS) {
    return NextResponse.json({ error: 'Stale signature' }, { status: 401 })
  }

  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex')

  // Constant-time comparison — guard against length mismatch first since
  // timingSafeEqual throws on unequal-length buffers.
  const a = Buffer.from(receivedSig, 'hex')
  const b = Buffer.from(expectedSig, 'hex')
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  return null
}

export async function POST(req: Request) {
  // Read the raw body once — request.json() consumes the stream and we
  // need the exact bytes Mux signed for the HMAC check.
  const rawBody = await req.text()
  const muxSig = req.headers.get('mux-signature')

  const sigError = verifyMuxSignature(rawBody, muxSig)
  if (sigError) return sigError

  let payload: MuxWebhookPayload
  try {
    payload = JSON.parse(rawBody) as MuxWebhookPayload
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
