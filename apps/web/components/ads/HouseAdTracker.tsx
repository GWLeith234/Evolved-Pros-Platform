'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { isAcademyAd } from '@/lib/sponsors/partners'
import {
  type HouseAdIdentity,
  type HouseAdSlot,
  inferHouseAdSlot,
  resolveServedAdHref,
} from '@/lib/ads/house'
import { recordHouseAdFromUnit } from '@/lib/ads/track'

type TrackableAd = HouseAdIdentity & {
  id: string
  sponsor_name: string | null
  tool_name: string | null
  image_url: string | null
  click_url: string | null
  link_url: string | null
}

/**
 * Click + once-in-view impression tracker for house Academy units.
 * Partner ads (AdCellerant, EvolveX360, XPR) are not wrapped — callers
 * must only mount this for isAcademyAd() units.
 */
export function HouseAdTracker({
  ad,
  slot,
  locationId,
  children,
  className,
  ariaLabel,
  style,
}: {
  ad: TrackableAd
  slot?: HouseAdSlot | string | null
  locationId: string
  children: ReactNode
  className?: string
  ariaLabel?: string
  style?: React.CSSProperties
}) {
  const house = isAcademyAd(ad)
  const resolvedSlot = inferHouseAdSlot(ad, slot)
  const href = resolveServedAdHref(ad, house, resolvedSlot) ?? '#'
  const ref = useRef<HTMLAnchorElement>(null)
  const impressed = useRef(false)

  useEffect(() => {
    if (!house) return
    const node = ref.current
    if (!node || impressed.current) return
    if (typeof IntersectionObserver === 'undefined') {
      impressed.current = true
      recordHouseAdFromUnit('impression', ad, { slot: resolvedSlot, locationId })
      return
    }
    const obs = new IntersectionObserver(
      entries => {
        if (impressed.current) return
        if (entries.some(e => e.isIntersecting)) {
          impressed.current = true
          recordHouseAdFromUnit('impression', ad, { slot: resolvedSlot, locationId })
          obs.disconnect()
        }
      },
      { threshold: 0.5 },
    )
    obs.observe(node)
    return () => obs.disconnect()
  }, [house, ad, resolvedSlot, locationId])

  const external = /^https?:\/\//i.test(href)

  return (
    <a
      ref={ref}
      href={href}
      className={className}
      style={style}
      aria-label={ariaLabel}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      onClick={() => {
        if (!house) return
        recordHouseAdFromUnit('click', ad, { slot: resolvedSlot, locationId })
      }}
    >
      {children}
    </a>
  )
}
