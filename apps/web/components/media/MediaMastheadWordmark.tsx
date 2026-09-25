'use client'

import { usePathname } from 'next/navigation'
import { MediaMastheadLockup } from '@/components/media/Masthead'

/** The lockup is the /media home H1. Every other /media route has its own. */
export function MediaMastheadWordmark() {
  const pathname = usePathname() || ''
  const heading = pathname === '/media' || pathname === '/media/'
  return <MediaMastheadLockup heading={heading} />
}
