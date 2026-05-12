import { adminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'
import Link from 'next/link'
import { EpisodeThumbnail } from './EpisodeThumbnail'
import { SyncPodcastButton } from './SyncPodcastButton'

export const dynamic = 'force-dynamic'

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export default async function AdminEpisodesPage() {
  const h = headers()
  if (h.get('RSC') === '1' || h.get('Next-Router-Prefetch') === '1') {
    return null
  }

  // RLS-FIX: adminClient — episodes RLS admin policy keys on users.id = auth.uid(),
  // which the codebase documents as mismatched. SSR client would silently filter
  // drafts for admins. Service role bypasses RLS so admins see all rows.
  const { data: rows } = await adminClient
    .from('episodes')
    .select('id, episode_number, season, title, guest_name, guest_company, thumbnail_url, duration_seconds, is_published, published_at, created_at')
    .order('episode_number', { ascending: false })
    .limit(200)

  const episodes = rows ?? []

  return (
    <div className="px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-black text-[28px] text-[#112535]">Episodes</h1>
          <p className="font-condensed text-[12px] text-[#7a8a96] mt-0.5">
            {episodes.length} total · {episodes.filter(e => e.is_published).length} published
          </p>
        </div>
        <div className="flex items-start gap-3">
          <SyncPodcastButton />
          <Link
            href="/admin/episodes/new"
            className="font-condensed font-bold uppercase tracking-wide text-[12px] rounded px-5 py-2.5 transition-all"
            style={{ backgroundColor: '#1b3c5a', color: 'white' }}
          >
            + New Episode
          </Link>
        </div>
      </div>

      {episodes.length === 0 ? (
        <div
          className="rounded-lg px-8 py-12 text-center"
          style={{ border: '1px dashed rgba(27,60,90,0.2)' }}
        >
          <p className="font-condensed font-bold uppercase tracking-widest text-[11px] text-[#7a8a96]">
            No episodes yet
          </p>
          <p className="font-body text-[13px] text-[#7a8a96] mt-1">
            Create your first episode to get started.
          </p>
        </div>
      ) : (
        <div className="rounded-lg overflow-x-auto" style={{ border: '1px solid rgba(27,60,90,0.1)' }}>
          <table className="w-full" style={{ tableLayout: 'fixed', minWidth: 640 }}>
            <colgroup>
              <col style={{ width: 48 }} />
              <col />
              <col className="hidden md:table-column" style={{ width: 160 }} />
              <col className="hidden md:table-column" style={{ width: 96 }} />
              <col style={{ width: 96 }} />
              <col style={{ width: 80 }} />
            </colgroup>
            <thead>
              <tr style={{ backgroundColor: '#f5f7f9', borderBottom: '1px solid rgba(27,60,90,0.1)' }}>
                <th className="text-left px-4 py-3 font-condensed font-bold uppercase tracking-[0.16em] text-[9px] text-[#7a8a96]">#</th>
                <th className="text-left px-4 py-3 font-condensed font-bold uppercase tracking-[0.16em] text-[9px] text-[#7a8a96]">Title</th>
                <th className="text-left px-4 py-3 font-condensed font-bold uppercase tracking-[0.16em] text-[9px] text-[#7a8a96] hidden md:table-cell">Guest</th>
                <th className="text-left px-4 py-3 font-condensed font-bold uppercase tracking-[0.16em] text-[9px] text-[#7a8a96] hidden md:table-cell">Duration</th>
                <th className="text-left px-4 py-3 font-condensed font-bold uppercase tracking-[0.16em] text-[9px] text-[#7a8a96]">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {episodes.map((ep, i) => (
                <tr
                  key={ep.id}
                  style={{
                    borderBottom: i < episodes.length - 1 ? '1px solid rgba(27,60,90,0.06)' : 'none',
                    backgroundColor: 'white',
                  }}
                >
                  <td className="px-4 py-3">
                    <span className="font-display font-black text-[16px]" style={{ color: 'rgba(27,60,90,0.3)' }}>
                      {ep.episode_number ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {ep.thumbnail_url && (
                        <EpisodeThumbnail src={ep.thumbnail_url} alt={ep.title} />
                      )}
                      <div className="min-w-0">
                        <p className="font-body font-semibold text-[13px] text-[#1b3c5a] truncate max-w-[240px]">
                          {ep.title}
                        </p>
                        {ep.season && ep.season > 1 && (
                          <p className="font-condensed text-[10px] text-[#7a8a96]">Season {ep.season}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {ep.guest_name ? (
                      <div>
                        <p className="font-body text-[12px] text-[#1b3c5a]">{ep.guest_name}</p>
                        {ep.guest_company && (
                          <p className="font-condensed text-[10px] text-[#7a8a96]">{ep.guest_company}</p>
                        )}
                      </div>
                    ) : (
                      <span className="font-condensed text-[11px] text-[#7a8a96]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="font-condensed text-[12px] text-[#7a8a96]">
                      {formatDuration(ep.duration_seconds)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="font-condensed font-bold uppercase text-[9px] tracking-wider rounded px-2 py-0.5"
                      style={
                        ep.is_published
                          ? { backgroundColor: 'rgba(104,162,185,0.12)', color: '#68a2b9' }
                          : { backgroundColor: 'rgba(217,119,6,0.12)', color: '#b45309' }
                      }
                    >
                      {ep.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/episodes/${ep.id}/edit`}
                      className="font-condensed font-semibold uppercase tracking-wide text-[10px] text-[#68a2b9] hover:text-[#1b3c5a] transition-colors"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
