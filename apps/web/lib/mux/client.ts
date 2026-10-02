import Mux from '@mux/mux-node'

if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
  console.warn('[Mux] MUX_TOKEN_ID or MUX_TOKEN_SECRET not set — video playback disabled')
}

export const mux = new Mux({
  tokenId:     process.env.MUX_TOKEN_ID     ?? '',
  tokenSecret: process.env.MUX_TOKEN_SECRET ?? '',
})

export async function generateMuxToken(playbackId: string): Promise<string | null> {
  if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) return null
  try {
    return await mux.jwt.signPlaybackId(playbackId, {
      type:       'video',
      expiration: '12h',
    })
  } catch (err) {
    console.error('[Mux] Failed to sign playback ID:', err)
    return null
  }
}

/** Fit playback JWTs. Lesson tokens stay on the 12h helper above. */
export const FIT_MUX_TOKEN_EXPIRY = '15m'

function fitSigningKeys(): { keyId: string; keySecret: string } | null {
  const keyId = process.env.MUX_SIGNING_KEY
  const keySecret = process.env.MUX_PRIVATE_KEY
  if (!keyId || !keySecret) return null
  return { keyId, keySecret }
}

/** Null, blank, and non-finite values omit the Mux time claim. Zero is kept. */
export function coerceFitThumbnailTime(value: unknown): number | null {
  if (value == null || value === '') return null
  if (typeof value !== 'number' && typeof value !== 'string') return null
  const time = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(time) || time < 0) return null
  return time
}

export async function generateFitMuxToken(playbackId: string): Promise<string | null> {
  const keys = fitSigningKeys()
  if (!keys) return null
  try {
    return await mux.jwt.signPlaybackId(playbackId, {
      type: 'video',
      expiration: FIT_MUX_TOKEN_EXPIRY,
      keyId: keys.keyId,
      keySecret: keys.keySecret,
    })
  } catch (err) {
    console.error('[Mux] Failed to sign Fit playback ID:', err)
    return null
  }
}

/**
 * Thumbnail JWT for a Fit poster. type thumbnail maps to aud t.
 * A null time omits params so Mux picks the default frame.
 * The SDK types params as strings, so a numeric time is sent as text.
 */
export async function generateFitMuxThumbnailToken(
  playbackId: string,
  time: number | null,
): Promise<string | null> {
  const keys = fitSigningKeys()
  if (!keys) return null
  const thumbnailTime = coerceFitThumbnailTime(time)
  const params = thumbnailTime == null ? undefined : { time: String(thumbnailTime) }
  try {
    return await mux.jwt.signPlaybackId(playbackId, {
      type: 'thumbnail',
      expiration: FIT_MUX_TOKEN_EXPIRY,
      keyId: keys.keyId,
      keySecret: keys.keySecret,
      ...(params ? { params } : {}),
    })
  } catch (err) {
    console.error('[Mux] Failed to sign Fit thumbnail:', err)
    return null
  }
}
