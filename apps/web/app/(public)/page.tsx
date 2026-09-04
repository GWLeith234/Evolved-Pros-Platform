import type { Metadata } from 'next'
import { ConversionHome, type ConversionEpisode } from '@/components/home/ConversionHome'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { takeHomeContentRow } from '@/lib/home/contentRow'
import {
  HERO_IMAGE_ALT,
  HERO_IMAGE_SRC,
  HOME_SUB,
  HOME_TITLE,
  youtubeStillUrl,
} from '@/lib/home/conversion'
import { getPublishedEpisodes } from '@/lib/podcast/public'
import { publicPageMetadata } from '@/lib/seo/canonical'

/**
 * Conversion front door (George 2026-09-03).
 *
 * `/` never redirects. A signed-in visitor gets the same page with the nav
 * CTA swapped. Ads stay off this route (Media / Podcast / Academy keep them).
 * Join free lands on /login?mode=signup. See pricing lands on /pricing.
 * Do not add a keynote / Book George card here.
 */

export const metadata: Metadata = publicPageMetadata('/', {
  title: HOME_TITLE,
  description: HOME_SUB,
  openGraph: {
    title: HOME_TITLE,
    description: HOME_SUB,
    images: [{ url: HERO_IMAGE_SRC, alt: HERO_IMAGE_ALT }],
  },
  twitter: {
    card: 'summary_large_image',
    title: HOME_TITLE,
    description: HOME_SUB,
    images: [HERO_IMAGE_SRC],
  },
})

async function loadEpisodes(): Promise<ConversionEpisode[]> {
  try {
    const episodes = await getPublishedEpisodes()
    return takeHomeContentRow(episodes).map(e => ({
      slug: e.slug,
      title: e.title,
      guestName: e.guest_name,
      episodeNumber: e.episode_number,
      publishedAt: e.published_at,
      durationSeconds: e.duration_seconds,
      stillUrl: e.thumbnail_url || e.guest_image_url || youtubeStillUrl(e.youtube_id),
    }))
  } catch {
    return []
  }
}

export default async function LandingPage() {
  const [profile, episodes] = await Promise.all([resolveCurrentUser(), loadEpisodes()])
  return <ConversionHome signedIn={profile !== null} episodes={episodes} />
}
