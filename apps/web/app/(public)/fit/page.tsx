import type { Metadata } from 'next'
import { FitMasthead } from '@/components/fit/FitMasthead'
import { FitMarketing } from '@/components/fit/FitMarketing'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { FIT_PAGE_DESCRIPTION, FIT_PAGE_TITLE } from '@/lib/fit/copy'
import { publicPageMetadata } from '@/lib/seo/canonical'

export const metadata: Metadata = publicPageMetadata('/fit', {
  title: FIT_PAGE_TITLE,
  description: FIT_PAGE_DESCRIPTION,
})

export default async function FitPage() {
  const profile = await resolveCurrentUser()
  return (
    <div className="min-h-screen bg-page text-primary ep-no-x-scroll" style={{ maxWidth: '100vw' }}>
      <FitMasthead />
      <FitMarketing viewerTier={profile?.tier ?? null} />
    </div>
  )
}
