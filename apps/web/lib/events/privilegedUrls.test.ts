import { describe, expect, it } from 'vitest'
import { privilegedEventUrls } from './privilegedUrls'

const row = {
  zoom_url: 'https://zoom.example/j/1',
  recording_url: 'https://record.example/a',
  required_tier: 'pro' as const,
}

describe('privilegedEventUrls', () => {
  it('hides both URLs when the viewer is below the required tier', () => {
    expect(privilegedEventUrls(row, { userTier: 'community', isRegistered: true }))
      .toEqual({ zoomUrl: null, recordingUrl: null })
  })

  it('hides zoom until the entitled viewer is registered', () => {
    expect(privilegedEventUrls(row, { userTier: 'pro', isRegistered: false }))
      .toEqual({ zoomUrl: null, recordingUrl: 'https://record.example/a' })
  })

  it('returns both URLs for a registered entitled viewer', () => {
    expect(privilegedEventUrls(row, { userTier: 'pro', isRegistered: true }))
      .toEqual({
        zoomUrl: 'https://zoom.example/j/1',
        recordingUrl: 'https://record.example/a',
      })
  })
})
