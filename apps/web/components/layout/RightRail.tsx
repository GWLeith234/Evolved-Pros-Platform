'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Ad {
  id: string
  image_url: string | null
  click_url: string | null
  link_url: string | null
  headline: string | null
  sponsor_name: string | null
}

export function RightRail() {
  const [ads, setAds] = useState<Ad[]>([])
  const [idx, setIdx] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('platform_ads')
      .select('id, image_url, click_url, link_url, headline, sponsor_name')
      .eq('zone', 'A')
      .eq('is_active', true)
      .then(({ data }) => {
        if (data?.length) setAds(data)
      })
  }, [])

  useEffect(() => {
    if (ads.length <= 1) return
    timerRef.current = setInterval(() => {
      setIdx(i => (i + 1) % ads.length)
    }, 10000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [ads.length])

  if (!ads.length) return null

  const ad = ads[idx]
  if (!ad) return null

  // Filter out '#', empty strings, and null — only use real URLs
  const adHref = [ad.click_url, ad.link_url].find(u => u && u !== '#') ?? null

  const adInner = (
    <>
      {/* 300×250 image slot */}
      {ad.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ad.image_url}
          alt={ad.sponsor_name ?? ad.headline ?? 'Ad'}
          style={{ width: '250px', height: '208px', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div
          style={{ width: '250px', height: '208px', backgroundColor: 'rgba(27,60,90,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <span className="font-condensed text-[11px]" style={{ color: 'rgba(27,60,90,0.25)' }}>
            {ad.sponsor_name ?? 'Ad'}
          </span>
        </div>
      )}

      {/* Bottom bar */}
      {(ad.headline || ad.sponsor_name) && (
        <div
          className="px-3 py-2 flex items-center justify-between"
          style={{ backgroundColor: '#f5f7f9', borderTop: '1px solid rgba(27,60,90,0.08)' }}
        >
          <span className="font-condensed text-[11px] font-semibold truncate" style={{ color: '#1b3c5a', maxWidth: '180px' }}>
            {ad.headline ?? ad.sponsor_name}
          </span>
          <span
            className="font-condensed font-bold text-[8px] uppercase tracking-wider rounded flex-shrink-0 ml-2 px-1.5 py-0.5"
            style={{ backgroundColor: '#ef0e30', color: 'white' }}
          >
            AD
          </span>
        </div>
      )}
    </>
  )

  const adCardStyle: React.CSSProperties = {
    border: '1px solid rgba(27,60,90,0.1)',
    width: '250px',
  }

  return (
    <aside
      className="hidden"
      style={{
        width: '280px',
        borderLeft: '1px solid rgba(27,60,90,0.08)',
        backgroundColor: 'var(--page-bg)',
      }}
    >
      <p
        className="font-condensed font-bold uppercase tracking-[0.2em] text-[9px] mb-3"
        style={{ color: 'rgba(27,60,90,0.3)' }}
      >
        Advertisement
      </p>
      {adHref ? (
        <a
          href={adHref}
          target="_blank"
          rel="noopener noreferrer"
          className="block group rounded-lg overflow-hidden transition-all duration-200 hover:opacity-90"
          style={adCardStyle}
        >
          {adInner}
        </a>
      ) : (
        <div className="rounded-lg overflow-hidden" style={adCardStyle}>
          {adInner}
        </div>
      )}

      {/* Dot indicators for multiple ads */}
      {ads.length > 1 && (
        <div className="flex gap-1.5 mt-3">
          {ads.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                if (timerRef.current) clearInterval(timerRef.current)
                setIdx(i)
                timerRef.current = setInterval(() => {
                  setIdx(prev => (prev + 1) % ads.length)
                }, 10000)
              }}
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: i === idx ? '#1b3c5a' : 'rgba(27,60,90,0.2)',
                border: 'none',
                padding: '9px',
                cursor: 'pointer',
                backgroundClip: 'content-box',
              }}
            />
          ))}
        </div>
      )}
    </aside>
  )
}
