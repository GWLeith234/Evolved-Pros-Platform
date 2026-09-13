import { Suspense } from 'react'
import { adminClient } from '@/lib/supabase/admin'
import { AdminButton, AdminPageHeader } from '@/components/admin/template'
import { MediaListClient } from './MediaListClient'
import { MediaToast } from './MediaToast'

export const dynamic = 'force-dynamic'

const PILLAR_LABELS: Record<string, string> = {
  foundation:        'Foundation',
  identity:          'Identity',
  'mental-toughness':'Mental Toughness',
  strategy:          'Strategy',
  accountability:    'Accountability',
  execution:         'Execution',
}

export default async function AdminMediaPage() {
  const { data: stories } = await adminClient
    .from('media_stories')
    .select('id, title, slug, pillar, story_type, is_published, is_featured, published_at, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="px-4 sm:px-8 py-6">
      <AdminPageHeader
        title="Pros Media"
        subline="Stories live on /media when published."
        primary={
          <AdminButton variant="primary" href="/admin/media/new">
            + New Story
          </AdminButton>
        }
      />

      <Suspense fallback={null}>
        <MediaToast />
      </Suspense>

      <MediaListClient initialStories={stories ?? []} pillarLabels={PILLAR_LABELS} />
    </div>
  )
}
