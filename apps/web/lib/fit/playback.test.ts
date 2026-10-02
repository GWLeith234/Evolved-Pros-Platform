import { describe, expect, it } from 'vitest'
import { fitPreferPlayback } from './playback'

const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
const IPHONE_CHROME =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1'
const PIXEL_CHROME =
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
const DESKTOP_SAFARI =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
const DESKTOP_CHROME =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

describe('Fit playback engine', () => {
  it('leaves iOS on native HLS and sends Android Chrome through hls.js', () => {
    expect(fitPreferPlayback(IPHONE_SAFARI)).toBeUndefined()
    expect(fitPreferPlayback(IPHONE_CHROME)).toBeUndefined()
    expect(fitPreferPlayback(PIXEL_CHROME)).toBe('mse')
  })

  it('keeps desktop Safari native and desktop Chrome on MSE', () => {
    expect(fitPreferPlayback(DESKTOP_SAFARI)).toBeUndefined()
    expect(fitPreferPlayback(DESKTOP_CHROME)).toBe('mse')
  })
})
