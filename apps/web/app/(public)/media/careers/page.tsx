import type { Metadata } from 'next'
import { adminClient } from '@/lib/supabase/admin'
import { CareersClient } from './CareersClient'
import type { Job } from './CareersClient'
import { mediaSectionTitle } from '@/lib/media/brand'
import { publicPageMetadata } from '@/lib/seo/canonical'
import { getActivePlatformAds } from '@/lib/cache/shared'
import { pickCommunityFeedAds } from '@/lib/sponsors/partners'
import { adMatchesSurface } from '@/lib/ads/iab'
import type { SponsorAd } from '@/components/home/HomeSponsorAd'

export const revalidate = 120

export const metadata: Metadata = publicPageMetadata('/media/careers', {
  title: mediaSectionTitle('Careers'),
  description: 'Curated sales, marketing, and leadership roles for high-performing professionals.',
})

export default async function MediaCareersPage() {
  const { data } = await adminClient
    .from('job_listings')
    .select('*')
    .eq('status', 'published')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })

  const jobs = (data ?? []) as Job[]
  const catalog = ((await getActivePlatformAds()) as SponsorAd[]).filter(a =>
    adMatchesSurface(a, 'media'),
  )
  const ads = pickCommunityFeedAds(catalog, 8)

  return <CareersClient jobs={jobs} ads={ads} />
}
