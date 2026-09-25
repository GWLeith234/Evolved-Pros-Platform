import type { Metadata } from 'next'
import { unstable_noStore as noStore } from 'next/cache'
import { PREVIEW_ROBOTS } from '@/lib/media/storyMeta'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export const metadata: Metadata = {
  title: 'Draft preview',
  robots: PREVIEW_ROBOTS,
}

export default function MediaPreviewLayout({ children }: { children: React.ReactNode }) {
  noStore()
  return children
}
