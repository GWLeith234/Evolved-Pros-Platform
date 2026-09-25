import { describe, expect, it } from 'vitest'
import {
  DEFAULT_STILL_OBJECT_POSITION,
  GUEST_FACE_OBJECT_POSITION,
  JUAN_EP010_SLUG,
  JUAN_EP010_STILL,
  QUANG_DO_OBJECT_POSITION,
  QUANG_DO_SLUG,
  QUANG_DO_STILL,
  allowedEpisodeStillUrl,
  guestStillObjectPosition,
  homeGuestStillObjectPosition,
  mediaRailStillObjectPosition,
  isBlockedStillHost,
  isJuanEp010,
  isQuangDo,
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

  it('pins Juan to the top and Quang to 50% 20% on aspect-video cards', () => {
    expect(isQuangDo({ slug: QUANG_DO_SLUG, guest_name: 'Quang Do' })).toBe(true)
    expect(QUANG_DO_STILL).toContain('guest-mentorship-generational-gap-quang-do.jpg')
    expect(QUANG_DO_OBJECT_POSITION).toBe('50% 20%')
    expect(
      homeGuestStillObjectPosition({
        slug: JUAN_EP010_SLUG,
        guestName: 'Juan Fernandez',
        episodeNumber: 10,
        stillUrl: JUAN_EP010_STILL,
      }),
    ).toBe(GUEST_FACE_OBJECT_POSITION)
    expect(
      homeGuestStillObjectPosition({
        slug: QUANG_DO_SLUG,
        guestName: 'Quang Do',
        episodeNumber: 9,
        stillUrl: QUANG_DO_STILL,
      }),
    ).toBe(QUANG_DO_OBJECT_POSITION)
    expect(
      homeGuestStillObjectPosition({
        slug: 'someone-else',
        guestName: 'Heather',
        stillUrl: 'https://cdn.example/heather.jpg',
      }),
    ).toBe(DEFAULT_STILL_OBJECT_POSITION)
  })

  it('resolves a per-guest focal point and leaves every other still on the caller fallback', () => {
    expect(guestStillObjectPosition({ slug: QUANG_DO_SLUG }, '50% 12%')).toBe('50% 20%')
    expect(guestStillObjectPosition({ stillUrl: QUANG_DO_STILL }, '50% 12%')).toBe('50% 20%')
    expect(
      guestStillObjectPosition(
        { slug: 'someone-else', stillUrl: 'https://cdn.example/heather.jpg' },
        '50% 12%',
      ),
    ).toBe('50% 12%')
    expect(
      guestStillObjectPosition(
        { slug: JUAN_EP010_SLUG, stillUrl: JUAN_EP010_STILL },
        '50% 12%',
      ),
    ).toBe(GUEST_FACE_OBJECT_POSITION)
  })

  it('keeps the media rail fallback for Juan and everyone except Quang', () => {
    expect(mediaRailStillObjectPosition({ slug: QUANG_DO_SLUG, stillUrl: QUANG_DO_STILL })).toBe('50% 20%')
    expect(mediaRailStillObjectPosition({ slug: JUAN_EP010_SLUG, stillUrl: JUAN_EP010_STILL })).toBe('50% 12%')
    expect(mediaRailStillObjectPosition({ slug: 'someone-else', stillUrl: 'https://cdn.example/heather.jpg' })).toBe('50% 12%')
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
