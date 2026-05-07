'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

// Only the /podcast listing page renders its own <PodcastLatestStrip/>;
// the layout's global <EpisodeBanner/> would stack a second "LATEST
// EPISODE" strip on top of it. Episode detail pages (/podcast/[slug])
// don't render the strip themselves, so QA flagged the banner missing
// there — match exactly /podcast (with optional trailing slash) instead
// of every /podcast* path so detail pages keep the global banner.
export function HideOnPodcast({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  if (pathname === '/podcast' || pathname === '/podcast/') return null
  return <>{children}</>
}
