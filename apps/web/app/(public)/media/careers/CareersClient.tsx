'use client'

import { useState, useMemo } from 'react'
import { MediaCenteredAd } from '@/components/media/MediaIabSlot'
import type { SponsorAd } from '@/components/home/HomeSponsorAd'
import {
  COMMUNITY_AD_EVERY,
  COMMUNITY_DEEPER_EVERY,
  COMMUNITY_TIGHTEN_AFTER,
  interleaveAds,
} from '@/lib/ads/rhythm'

export interface Job {
  id: string
  title: string
  company: string
  location: string | null
  job_type: string | null
  salary_range: string | null
  description: string | null
  apply_url: string
  category: string | null
  is_featured: boolean
  status: string
  created_at: string
}

const FC = 'var(--font-condensed)'
const FB = 'var(--font-body)'

const CATEGORY_PILLS = ['All', 'Sales', 'Marketing', 'Leadership', 'Remote']

function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return '1d ago'
  return `${days}d ago`
}

function isNewThisWeek(iso: string): boolean {
  return Date.now() - new Date(iso).getTime() < 7 * 86400000
}

export function CareersClient({ jobs, ads = [] }: { jobs: Job[]; ads?: SponsorAd[] }) {
  const [search, setSearch] = useState('')
  const [locFilter, setLocFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [catFilter, setCatFilter] = useState('All')

  const filtered = useMemo(() => {
    let result = jobs
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        (j.description ?? '').toLowerCase().includes(q)
      )
    }
    if (locFilter !== 'all') {
      result = result.filter(j => {
        const loc = (j.location ?? '').toLowerCase()
        if (locFilter === 'remote') return loc.includes('remote')
        if (locFilter === 'canada') return loc.includes('canada') || loc.includes('ca')
        if (locFilter === 'usa') return loc.includes('usa') || loc.includes('us') || loc.includes('united states')
        return true
      })
    }
    if (typeFilter !== 'all') {
      result = result.filter(j => (j.job_type ?? '').toLowerCase().replace(/[-\s]/g, '') === typeFilter.toLowerCase().replace(/[-\s]/g, ''))
    }
    if (catFilter !== 'All') {
      if (catFilter === 'Remote') {
        result = result.filter(j => (j.location ?? '').toLowerCase().includes('remote'))
      } else {
        result = result.filter(j => (j.category ?? '').toLowerCase() === catFilter.toLowerCase())
      }
    }
    return result
  }, [jobs, search, locFilter, typeFilter, catFilter])

  const newThisWeek = jobs.filter(j => isNewThisWeek(j.created_at)).length
  const jobChunks = useMemo(
    () =>
      interleaveAds(filtered, ads.filter(a => a?.image_url), COMMUNITY_AD_EVERY, {
        trailing: true,
        tightenAfter: COMMUNITY_TIGHTEN_AFTER,
        deeperEvery: COMMUNITY_DEEPER_EVERY,
      }),
    [filtered, ads],
  )

  const selectStyle = {
    fontFamily: FB, fontSize: 12, color: '#2B3A5A',
    backgroundColor: '#fff', border: '1px solid rgba(43,58,90,0.15)',
    borderRadius: 4, padding: '8px 10px', outline: 'none',
  }

  return (
    <div>
      {/* Search hero */}
      <div style={{ backgroundColor: '#2B3A5A', padding: '16px 24px 18px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <h1 style={{ fontFamily: FC, fontWeight: 900, fontSize: 24, color: '#fff', textTransform: 'uppercase', lineHeight: 1.1, margin: '0 0 4px' }}>
            Careers in Sales & Marketing
          </h1>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: FB, margin: '0 0 12px' }}>
            Roles curated for high-performing sales professionals.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Title, company, keyword..."
              style={{ flex: 1, minWidth: 180, fontFamily: FB, fontSize: 12, color: '#2B3A5A', backgroundColor: '#fff', border: '1px solid rgba(43,58,90,0.15)', borderRadius: 4, padding: '8px 12px', outline: 'none' }}
            />
            <select value={locFilter} onChange={e => setLocFilter(e.target.value)} style={selectStyle}>
              <option value="all">All locations</option>
              <option value="remote">Remote</option>
              <option value="canada">Canada</option>
              <option value="usa">USA</option>
            </select>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={selectStyle}>
              <option value="all">All types</option>
              <option value="fulltime">Full-time</option>
              <option value="contract">Contract</option>
              <option value="parttime">Part-time</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '16px 24px 40px' }}>
        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { val: String(jobs.length), label: 'Total jobs' },
            { val: String(newThisWeek), label: 'New this week' },
            { val: 'Free', label: 'Always free to apply' },
          ].map(s => (
            <div key={s.label} style={{ backgroundColor: '#fff', border: '1px solid #E0D8CC', borderRadius: 4, padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontFamily: FC, fontWeight: 900, fontSize: 20, color: '#2B3A5A' }}>{s.val}</div>
              <div style={{ fontSize: 9, color: 'rgba(43,58,90,0.45)', fontFamily: FC, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          {CATEGORY_PILLS.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setCatFilter(p)}
              style={{
                fontFamily: FC, fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em',
                padding: '5px 12px', borderRadius: 3, border: 'none', cursor: 'pointer',
                backgroundColor: catFilter === p ? '#2B3A5A' : 'rgba(43,58,90,0.06)',
                color: catFilter === p ? '#fff' : 'rgba(43,58,90,0.5)',
                transition: 'all 0.15s',
              }}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Job cards */}
        {filtered.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {jobChunks.map((chunk, idx) =>
              chunk.kind === 'ad' ? (
                <MediaCenteredAd key={`${chunk.ad.id}-${idx}`} ad={chunk.ad} locationId="media-careers" />
              ) : (
                chunk.items.map(j => (
              <div key={j.id} style={{ backgroundColor: '#fff', border: '1px solid #E0D8CC', borderRadius: 4, padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                {/* Company logo placeholder */}
                <div style={{ width: 44, height: 44, borderRadius: 4, backgroundColor: '#2B3A5A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#fff', fontWeight: 700, fontFamily: FC, flexShrink: 0 }}>
                  {j.company.slice(0, 2).toUpperCase()}
                </div>
                {/* Middle */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: FC, fontWeight: 800, fontSize: 15, color: '#2B3A5A', margin: '0 0 2px', lineHeight: 1.25 }}>
                    {j.title}
                  </p>
                  <p style={{ fontSize: 12, color: 'rgba(43,58,90,0.55)', fontFamily: FB, margin: '0 0 6px' }}>
                    {j.company}{j.location ? ` · ${j.location}` : ''}
                  </p>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {j.is_featured && (
                      <span style={{ fontSize: 8, fontWeight: 700, fontFamily: FC, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 7px', borderRadius: 2, backgroundColor: 'rgba(201,168,76,0.15)', color: '#AA8C3C' }}>Featured</span>
                    )}
                    {j.job_type && (
                      <span style={{ fontSize: 8, fontWeight: 700, fontFamily: FC, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 7px', borderRadius: 2, backgroundColor: 'rgba(43,58,90,0.06)', color: 'rgba(43,58,90,0.45)' }}>{j.job_type}</span>
                    )}
                    {j.salary_range && (
                      <span style={{ fontSize: 8, fontWeight: 700, fontFamily: FC, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 7px', borderRadius: 2, backgroundColor: 'rgba(43,58,90,0.06)', color: 'rgba(43,58,90,0.45)' }}>{j.salary_range}</span>
                    )}
                    {j.category && (
                      <span style={{ fontSize: 8, fontWeight: 700, fontFamily: FC, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 7px', borderRadius: 2, backgroundColor: 'rgba(43,58,90,0.06)', color: 'rgba(43,58,90,0.45)' }}>{j.category}</span>
                    )}
                  </div>
                </div>
                {/* CTA */}
                <a href={j.apply_url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: FC, fontWeight: 700, fontSize: 11, color: '#fff', backgroundColor: '#2B3A5A', padding: '7px 14px', borderRadius: 3, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap', flexShrink: 0, alignSelf: 'center' }}>
                  Apply →
                </a>
              </div>
                ))
              )
            )}
          </div>
        ) : (
          <div style={{ backgroundColor: '#fff', border: '1px solid #E0D8CC', borderRadius: 4, padding: '40px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'rgba(43,58,90,0.4)', fontFamily: FB }}>
              No listings right now. Check back soon.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
