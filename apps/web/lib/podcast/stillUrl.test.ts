import { describe, expect, it } from 'vitest'
import {
  JUAN_EP010_SLUG,
  JUAN_EP010_STILL,
  allowedEpisodeStillUrl,
  isBlockedStillHost,
  isJuanEp010,
} from './stillUrl'

const CLOUDFRONT =
  'https://d3t3ozftmdmh3i.cloudfront.net/staging/podcast_uploaded_nologo/45855303/45855303-1777183532492-6861a3cc952d5.jpg'
const SUPABASE =
  'https://udbwrapkshfjkctylbmm.supabase.co/storage/v1/object/public/Branding/episodes/guest-mentorship-generational-gap-quang-do.jpg'

describe('allowedEpisodeStillUrl', () => {
  it('blocks the Transistor CloudFront host', () => {
    expect(isBlockedStillHost(CLOUDFRONT)).toBe(true)
    expect(isBlockedStillHost(SUPABASE)).toBe(false)
    expect(isBlockedStillHost('/podcast/guests/juan-fernandez.jpg')).toBe(false)
  })

  it('prefers an allowed guest still over a CloudFront thumbnail', () => {
    expect(
      allowedEpisodeStillUrl({
        slug: JUAN_EP010_SLUG,
        episode_number: 10,
        guest_name: 'Juan Fernandez',
        guest_image_url: JUAN_EP010_STILL,
        thumbnail_url: CLOUDFRONT,
      }),
    ).toBe(JUAN_EP010_STILL)
  })

  it('rewrites Juan EP010 to the local still when guest art is missing', () => {
    expect(isJuanEp010({ slug: JUAN_EP010_SLUG })).toBe(true)
    expect(
      allowedEpisodeStillUrl({
        slug: JUAN_EP010_SLUG,
        episode_number: 10,
        guest_name: 'Juan Fernandez',
        guest_image_url: null,
        thumbnail_url: CLOUDFRONT,
      }),
    ).toBe(JUAN_EP010_STILL)
  })

  it('keeps Quang on the allowed Supabase host', () => {
    expect(
      allowedEpisodeStillUrl({
        slug: 'mentorship-generational-gap-quang-do',
        episode_number: 9,
        guest_name: 'Quang Do',
        guest_image_url: SUPABASE,
        thumbnail_url: CLOUDFRONT,
      }),
    ).toBe(SUPABASE)
  })

  it('does not emit CloudFront for an unknown episode', () => {
    expect(
      allowedEpisodeStillUrl({
        slug: 'someone-else',
        episode_number: 11,
        guest_image_url: null,
        thumbnail_url: CLOUDFRONT,
        youtube_id: 'abcDEFghijk',
      }),
    ).toBe('https://i.ytimg.com/vi/abcDEFghijk/hqdefault.jpg')
  })
})
