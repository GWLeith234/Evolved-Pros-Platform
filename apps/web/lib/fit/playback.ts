/**
 * Which HLS engine Fit should ask Mux Player to use.
 *
 * iOS and iPadOS only play HLS through the native video element, which needs
 * playsinline on that element. Android Chrome's native HLS (Chrome 141+) fails
 * closed on otherwise valid playlists, so those browsers must use hls.js via
 * Media Source Extensions. Mux Player does that when preferPlayback is "mse".
 * Forcing mse on iOS would skip the only engine that phone has.
 */
export function fitPreferPlayback(userAgent: string | null | undefined): 'mse' | undefined {
  const ua = userAgent ?? ''
  if (/iPhone|iPad|iPod/i.test(ua)) return undefined
  // iPadOS 13+ reports a desktop Macintosh UA and still uses WebKit.
  if (/Macintosh/i.test(ua) && /Mobile/i.test(ua)) return undefined
  if (/Safari/i.test(ua) && !/Chrome|Chromium|Android|Edg|OPR|Firefox|CriOS/i.test(ua)) {
    return undefined
  }
  return 'mse'
}
