import { describe, expect, it } from 'vitest'
import { fitMediaObjectKey, fitSignedStoragePosterUrl, isAbsoluteHttpsUrl } from './posterUrl'

describe('Fit storage poster URLs', () => {
  it('turns the stored fit-media path into an object key and never a site-relative src', () => {
    expect(fitMediaObjectKey('fit-media/FO55-035/poster-1920x1080.png')).toBe(
      'FO55-035/poster-1920x1080.png',
    )
    expect(fitMediaObjectKey('/fit-media/FO55-041/poster-1920x1080.jpg')).toBe(
      'FO55-041/poster-1920x1080.jpg',
    )
    expect(fitMediaObjectKey('fit-media/FO55-057/poster-1920x1080.webp')).toBe(
      'FO55-057/poster-1920x1080.webp',
    )
    expect(isAbsoluteHttpsUrl('fit-media/FO55-035/poster-1920x1080.png')).toBe(false)
  })

  it('rejects traversal, video objects, and paths outside the poster bucket', () => {
    expect(fitMediaObjectKey('fit-media/../secrets.png')).toBeNull()
    expect(fitMediaObjectKey('fit-media/FO55-035/guide.mp4')).toBeNull()
    expect(fitMediaObjectKey('fit-media/FO55-035/guide.m3u8')).toBeNull()
    expect(fitMediaObjectKey('other-bucket/poster.png')).toBeNull()
    expect(fitMediaObjectKey('https://image.mux.com/play/thumbnail.jpg?token=t')).toBeNull()
  })

  it('accepts only an https Supabase storage URL as a renderable poster', () => {
    const signed =
      'https://abc.supabase.co/storage/v1/object/sign/fit-media/FO55-035/poster-1920x1080.png?token=abc'
    expect(fitSignedStoragePosterUrl(signed)).toBe(signed)
    expect(fitSignedStoragePosterUrl('fit-media/FO55-035/poster-1920x1080.png')).toBeNull()
    expect(fitSignedStoragePosterUrl('http://abc.supabase.co/storage/v1/object/sign/fit-media/a.png')).toBeNull()
    expect(
      fitSignedStoragePosterUrl('https://evil.example/storage/v1/object/sign/fit-media/a.png'),
    ).toBeNull()
    expect(
      fitSignedStoragePosterUrl(
        'https://abc.supabase.co/storage/v1/object/sign/fit-media/FO55-035/guide.mp4?token=abc',
      ),
    ).toBeNull()
  })
})
