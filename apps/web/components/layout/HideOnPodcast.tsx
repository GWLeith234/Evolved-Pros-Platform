'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

// /podcast renders its own page-level <PodcastLatestStrip/>. The global
// member-layout <EpisodeBanner/> would stack a second "LATEST EPISODE"
// strip directly above it, which is what QA flagged on PODCAST-THEME.
// Wrapping the layout banner in this hides it only on the podcast tree;
// every other route keeps the global banner unchanged.
export function HideOnPodcast({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  if (pathname?.startsWith('/podcast')) return null
  return <>{children}</>
}
