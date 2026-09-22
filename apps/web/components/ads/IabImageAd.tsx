'use client'

import { useEffect, useRef, type CSSProperties, type RefObject } from 'react'
import { isAcademyAd } from '@/lib/sponsors/partners'
import { AdPlane } from '@/components/ads/AdPlane'
import { iabClickHref, iabSlotPx, type IabAdIdentity } from '@/lib/ads/iab'
import { recordHouseAdFromUnit } from '@/lib/ads/track'

type IabImageAdProps = {
  ad: IabAdIdentity & { id?: string | null; sponsor_name?: string | null; image_url: string }
  locationId: string
  className?: string
  style?: CSSProperties
}

type IabAdvertisementSlotProps = IabImageAdProps & {
  /**
   * @deprecated SPRINT M - ignored. The ad plane steps away from whatever page
   * it sits on, in both themes, so the caller no longer picks a tone. Kept in
   * the type so the existing call sites compile; delete it when they are swept.
   */
  tone?: 'paper' | 'ink'
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

/**
 * The one container every ad on this platform goes through - Media, Home,
 * Academy, Community, Podcast, Profile all render through here.
 *
 * SPRINT M: the chrome is now <AdPlane>, which carries the separation standard
 * (stepped background, four-sided hairline, a real 11px label). It used to be a
 * bare div with a 10px label at 35% opacity - present in the DOM, invisible on
 * the page, and sitting on the same background as the article around it.
 *
 * House Academy units get the plane too, labelled "Sponsored". A promo for our
 * own product placed in an ad slot is still an ad slot; leaving it unmarked is
 * exactly the confusion the standard exists to prevent.
 */
export function IabAdvertisementSlot({
  ad,
  locationId,
  className,
  style,
  tone,
}: IabAdvertisementSlotProps) {
  const { w, h } = iabSlotPx(ad)
  // `tone` is now decided by the theme tokens, not the caller. Kept in the
  // signature so the ~10 existing call sites keep compiling.
  void tone
  return (
    <AdPlane
      label={isAcademyAd(ad) ? 'Sponsored' : 'Advertisement'}
      width={w}
      className={className}
      style={style}
      data={{
        'data-ad-layout': 'iab-media',
        'data-ad-rhythm': 'unit',
        'data-iab-slot': `${w}x${h}`,
        'data-ad-reserved': `${h}`,
      }}
    >
      <IabImageAd ad={ad} locationId={locationId} />
    </AdPlane>
  )
}
