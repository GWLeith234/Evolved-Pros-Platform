'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'

// Only the /podcast listing page renders its own <PodcastLatestStrip/>;
// the layout's global <EpisodeBanner/> would stack a second "LATEST
// EPISODE" strip on top of it. Episode detail pages (/podcast/[slug])
// don't render the strip themselves, so QA flagged the banner missing
// there — match exactly /podcast (with optional trailing slash) instead
// of every /podcast* path so detail pages keep the global banner.
//
// HYDRATION-FIX (Sprint N-2): the server-rendered HTML always contained
// EpisodeBanner because usePathname() on the server returned the actual
// path, while the client's first render — before the routing context
// settled — could read a different value, producing React #425/#422 on
// /community and /events. Mount-gate the gating: return null on the
// server and on the very first client render so the markup matches
// exactly; then flip to the path-based decision after useEffect runs.
export function HideOnPodcast({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const pathname = usePathname()
  if (!mounted) return null
  if (pathname === '/podcast' || pathname === '/podcast/') return null
  return <>{children}</>
}
