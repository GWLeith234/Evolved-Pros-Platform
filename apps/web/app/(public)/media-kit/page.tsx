import type { Metadata } from 'next'
import { MediaKitPage } from '@/components/mediaKit/MediaKitPage'
import {
  MEDIA_KIT_DESCRIPTION,
  MEDIA_KIT_OG_IMAGE,
  MEDIA_KIT_PATH,
  MEDIA_KIT_TITLE,
} from '@/lib/mediaKit/copy'
import { publicPageMetadata } from '@/lib/seo/canonical'

// og:image is a 1200x630 crop of page 1 of the Light PDF.
export const metadata: Metadata = publicPageMetadata(MEDIA_KIT_PATH, {
  title: MEDIA_KIT_TITLE,
  description: MEDIA_KIT_DESCRIPTION,
  openGraph: { images: [MEDIA_KIT_OG_IMAGE] },
  twitter: { images: [MEDIA_KIT_OG_IMAGE.url] },
})

/**
 * Public indexable /media-kit. Static, outside the middleware matcher, so an
 * anonymous request renders the page. Footer comes from the (public) layout.
 */
export default function MediaKitRoute() {
  return <MediaKitPage />
}
