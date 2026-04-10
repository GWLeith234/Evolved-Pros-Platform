import Link from 'next/link'
import { adminClient } from '@/lib/supabase/admin'
import { MediaListClient } from './MediaListClient'

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
    <div className="px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="font-condensed font-bold uppercase tracking-[0.14em] text-[10px] mb-1" style={{ color: '#68a2b9' }}>
            Content
          </p>
          <h1 className="font-display font-bold text-xl" style={{ color: '#1b3c5a' }}>
            Evolved Media
          </h1>
        </div>
        <Link
          href="/admin/media/new"
          className="font-condensed font-bold uppercase tracking-[0.1em] text-[12px] px-5 py-2.5 rounded transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#1b3c5a', color: '#fff' }}
        >
          + New Story
        </Link>
      </div>

      <MediaListClient initialStories={stories ?? []} pillarLabels={PILLAR_LABELS} />
    </div>
  )
}
