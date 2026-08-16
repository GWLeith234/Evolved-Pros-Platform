import { adminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  active:  { bg: 'rgba(34,197,94,0.10)',  color: '#15803d' },
  paused:  { bg: 'rgba(201,168,76,0.10)', color: '#92660b' },
  expired: { bg: 'rgba(239,14,48,0.08)',  color: '#ef0e30' },
}

const TYPE_STYLE: Record<string, { bg: string; color: string }> = {
  sponsor:   { bg: 'rgba(27,60,90,0.06)',  color: 'var(--admin-text)' },
  affiliate: { bg: 'rgba(10,191,163,0.10)', color: '#0ABFA3' },
}

export default async function AdminPartnersPage() {
  const h = headers()
  if (h.get('Next-Router-Prefetch') === '1') return null

  const { data: sponsors } = await adminClient
    .from('sponsors')
    .select('id, name, type, status, brand_color, logo_url, url, created_at')
    .order('created_at', { ascending: false })

  const { data: placements } = await adminClient
    .from('sponsor_placements')
    .select('sponsor_id, surface, enabled')

  const surfacesBySponsor = new Map<string, string[]>()
  for (const p of placements ?? []) {
    if (!p.enabled) continue
    const list = surfacesBySponsor.get(p.sponsor_id) ?? []
    list.push(p.surface)
    surfacesBySponsor.set(p.sponsor_id, list)
  }

  const rows = sponsors ?? []

  return (
    <div className="px-8 py-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-[28px] text-[color:var(--admin-text-strong)]">Partners</h1>
          <p className="font-condensed text-[12px] text-[color:var(--admin-text-2)] mt-0.5">
            {rows.length} sponsor{rows.length === 1 ? '' : 's'} + affiliate{rows.length === 1 ? '' : 's'}
          </p>
        </div>
        <Link
          href="/admin/partners/new"
          className="font-condensed font-bold uppercase tracking-[0.12em] text-[11px] rounded px-4 py-2 transition-all"
          style={{ backgroundColor: '#1b3c5a', color: 'white' }}
        >
          + New Partner
        </Link>
      </div>

      <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(27,60,90,0.1)', backgroundColor: 'var(--admin-card)' }}>
        {rows.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="font-condensed text-[12px] text-[color:var(--admin-text-2)]">
              No partners yet. Click &ldquo;+ New Partner&rdquo; to add one.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(27,60,90,0.1)', backgroundColor: 'rgba(27,60,90,0.03)' }}>
                {['Partner', 'Type', 'Status', 'Surfaces', ''].map(label => (
                  <th key={label} className="px-4 py-3 text-left font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[color:var(--admin-text-2)]">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((s, i) => {
                const surfaces = surfacesBySponsor.get(s.id) ?? []
                const tStyle = TYPE_STYLE[s.type] ?? TYPE_STYLE.sponsor
                const sStyle = STATUS_STYLE[s.status] ?? STATUS_STYLE.active
                return (
                  <tr key={s.id} style={{ borderBottom: i === rows.length - 1 ? 'none' : '1px solid rgba(27,60,90,0.06)' }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {s.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={s.logo_url} alt={s.name} style={{ width: 28, height: 28, objectFit: 'contain', background: 'var(--admin-card)', borderRadius: 4, border: '1px solid rgba(27,60,90,0.08)' }} />
                        ) : (
                          <div
                            style={{
                              width: 28, height: 28, borderRadius: 4,
                              background: s.brand_color || '#1b3c5a',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontFamily: 'var(--font-logo), sans-serif', fontSize: 13, color: '#fff',
                            }}
                          >
                            {s.name[0]?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-body font-semibold text-[12px] text-[color:var(--admin-text-strong)] leading-tight">{s.name}</p>
                          {s.url && (
                            <p className="font-condensed text-[10px] text-[color:var(--admin-text-2)] truncate max-w-[260px]">{s.url}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-condensed font-bold uppercase text-[9px] px-2 py-0.5 rounded" style={{ backgroundColor: tStyle.bg, color: tStyle.color }}>
                        {s.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-condensed font-bold uppercase text-[9px] px-2 py-0.5 rounded" style={{ backgroundColor: sStyle.bg, color: sStyle.color }}>
                        {s.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {surfaces.length === 0 ? (
                        <span className="font-condensed text-[10px] text-[color:var(--admin-text-2)]">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {surfaces.map(sur => (
                            <span
                              key={sur}
                              className="font-condensed font-bold uppercase text-[9px] px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: 'rgba(27,60,90,0.06)', color: 'var(--admin-text)' }}
                            >
                              {sur}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/partners/${s.id}/edit`}
                        className="font-condensed font-semibold uppercase tracking-wide text-[10px] px-3 py-1.5 rounded transition-all"
                        style={{ color: 'var(--admin-text)', border: '1px solid rgba(27,60,90,0.25)' }}
                      >
                        Edit →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
