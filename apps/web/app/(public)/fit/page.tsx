import type { Metadata } from 'next'
import { FitMasthead } from '@/components/fit/FitMasthead'
import { HOME_BOOK } from '@/lib/home/conversion'
import { publicPageMetadata } from '@/lib/seo/canonical'

export const metadata: Metadata = publicPageMetadata('/fit', {
  title: 'Evolved Pros Fit',
  description: HOME_BOOK.body,
})

export default function FitPage() {
  return (
    <div className="min-h-screen bg-page text-primary ep-no-x-scroll" style={{ maxWidth: '100vw' }}>
      <FitMasthead />
      <div className="ep-fit-shell">
        <p className="ep-fit-dek">{HOME_BOOK.body}</p>
      </div>
    </div>
  )
}
