import type { Metadata } from 'next'
import { cache } from 'react'
import { adminClient } from '@/lib/supabase/admin'
import { CareersClient } from './CareersClient'
import type { Job } from './CareersClient'
import { mediaSectionTitle } from '@/lib/media/brand'
import { publicPageMetadata } from '@/lib/seo/canonical'
import { mediaListingRobots } from '@/lib/seo/mediaListingRobots'
import { getActivePlatformAds } from '@/lib/cache/shared'
import { pickCommunityFeedAds } from '@/lib/sponsors/partners'
import { adMatchesSurface } from '@/lib/ads/iab'
import type { SponsorAd } from '@/components/home/HomeSponsorAd'

export const revalidate = 120

const fetchPublishedJobs = cache(async (): Promise<Job[]> => {
  const { data } = await adminClient
    .from('job_listings')
    .select('*')
    .eq('status', 'published')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })

  return (data ?? []) as Job[]
})

export async function generateMetadata(): Promise<Metadata> {
  const jobs = await fetchPublishedJobs()
  return publicPageMetadata('/media/careers', {
    title: mediaSectionTitle('Careers'),
    description: 'Curated sales, marketing, and leadership roles for high-performing professionals.',
    ...mediaListingRobots(jobs.length),
  })
}

export default async function MediaCareersPage() {
  const jobs = await fetchPublishedJobs()
  const catalog = ((await getActivePlatformAds()) as SponsorAd[]).filter(a =>
    adMatchesSurface(a, 'media'),
  )
  const ads = pickCommunityFeedAds(catalog, 8)

  return <CareersClient jobs={jobs} ads={ads} />
}
