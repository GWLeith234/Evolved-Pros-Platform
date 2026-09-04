import type { Metadata } from 'next'
import { adminClient } from '@/lib/supabase/admin'
import { CareersClient } from './CareersClient'
import type { Job } from './CareersClient'
import { mediaSectionTitle } from '@/lib/media/brand'
import { publicPageMetadata } from '@/lib/seo/canonical'

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

  return <CareersClient jobs={jobs} />
}
