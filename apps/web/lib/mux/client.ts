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
