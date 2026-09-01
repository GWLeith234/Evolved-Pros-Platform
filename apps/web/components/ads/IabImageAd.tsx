'use client'

import { useEffect, useRef, type CSSProperties, type RefObject } from 'react'
import { isAcademyAd } from '@/lib/sponsors/partners'
import { iabClickHref, iabSlotPx, type IabAdIdentity } from '@/lib/ads/iab'
import { recordHouseAdFromUnit } from '@/lib/ads/track'

type IabImageAdProps = {
  ad: IabAdIdentity & { id?: string | null; sponsor_name?: string | null; image_url: string }
  locationId: string
  className?: string
  style?: CSSProperties
}

/**
 * Clickable IAB still — the uploaded PNG is the entire unit.
 * No PARTNER chip, no sponsor_name reprint, no LEARN MORE, no 1:1 crop.
 * Destination is the stored click_url / link_url (never rewritten).
 */
export function IabImageAd({ ad, locationId, className, style }: IabImageAdProps) {
  const { w, h, slot } = iabSlotPx(ad)
  const href = iabClickHref(ad)
  const house = isAcademyAd(ad)
  const alt = ad.sponsor_name?.trim() || ad.headline?.trim() || 'Advertisement'
  const ref = useRef<HTMLAnchorElement | HTMLDivElement>(null)
  const impressed = useRef(false)

  useEffect(() => {
    if (!house) return
    const node = ref.current
    if (!node || impressed.current) return
    if (typeof IntersectionObserver === 'undefined') {
      impressed.current = true
      recordHouseAdFromUnit('impression', ad, { slot, locationId })
      return
    }
    const obs = new IntersectionObserver(
      entries => {
        if (impressed.current) return
        if (entries.some(e => e.isIntersecting)) {
          impressed.current = true
          recordHouseAdFromUnit('impression', ad, { slot, locationId })
          obs.disconnect()
        }
      },
      { threshold: 0.5 },
    )
    obs.observe(node)
    return () => obs.disconnect()
  }, [house, ad, slot, locationId])

  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={ad.image_url}
      alt={alt}
      width={w}
      height={h}
      loading="lazy"
      decoding="async"
      style={{
        width: '100%',
        maxWidth: w,
        height: 'auto',
        aspectRatio: `${w} / ${h}`,
        objectFit: 'contain',
        objectPosition: 'center',
        display: 'block',
        background: 'transparent',
      }}
    />
  )

  const wrapStyle: CSSProperties = {
    display: 'block',
    lineHeight: 0,
    maxWidth: w,
    width: '100%',
    marginInline: 'auto',
    ...style,
  }

  if (!href) {
    return (
      <div ref={ref as RefObject<HTMLDivElement>} className={className} style={wrapStyle} data-iab-slot={slot}>
        {img}
      </div>
    )
  }

  const external = /^https?:\/\//i.test(href)
  return (
    <a
      ref={ref as RefObject<HTMLAnchorElement>}
      href={href}
      className={className}
      style={{ ...wrapStyle, textDecoration: 'none' }}
      data-iab-slot={slot}
      aria-label={alt}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer sponsored' : undefined}
      onClick={() => {
        if (house) recordHouseAdFromUnit('click', ad, { slot, locationId })
      }}
    >
      {img}
    </a>
  )
}
