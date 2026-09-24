import type { Metadata } from 'next'
import { AboutPage } from '@/components/about/AboutPage'
import { ABOUT_DESCRIPTION, ABOUT_PATH, ABOUT_TITLE } from '@/lib/about/copy'
import { publicPageMetadata } from '@/lib/seo/canonical'

// Unique title on purpose. This page must not inherit the homepage meta.
export const metadata: Metadata = publicPageMetadata(ABOUT_PATH, {
  title: ABOUT_TITLE,
  description: ABOUT_DESCRIPTION,
})

/**
 * Public indexable /about. Marketing sections under the (public) shell
 * (footer comes from the layout). Not the auth shell.
 */
export default function AboutRoute() {
  return <AboutPage />
}
