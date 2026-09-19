/**
 * SooToday / Toronto Today slot geometry with EP / partner empty-states.
 * Never loads an open ad network. Creative is EP or partner inventory only.
 */
import type { CSSProperties } from 'react'
import { MediaIabSlot } from '@/components/media/MediaIabSlot'
import type { SponsorAd } from '@/components/home/HomeSponsorAd'

export type PartnerSlotKind =
  | 'leaderboard'
  | 'mid-fluid'
  | 'mid-rect'
  | 'rail'
  | 'rail-half'
  | 'sponsored-row'
  | 'article-inline'

const SLOT_PX: Record<PartnerSlotKind, { w: number; h: number }> = {
  leaderboard: { w: 728, h: 90 },
  'mid-fluid': { w: 970, h: 250 },
  'mid-rect': { w: 300, h: 250 },
  rail: { w: 300, h: 250 },
  'rail-half': { w: 300, h: 600 },
  'sponsored-row': { w: 100, h: 67 },
  'article-inline': { w: 300, h: 250 },
}

const SLOT_LABEL: Record<PartnerSlotKind, string> = {
  leaderboard: 'Partner leaderboard',
  'mid-fluid': 'Partner placement',
  'mid-rect': 'Sponsored',
  rail: 'Partner rail',
  'rail-half': 'Partner half-page',
  'sponsored-row': 'Partner story',
  'article-inline': 'Sponsored',
}

export function MediaPartnerSlot({
  kind,
  ad,
  locationId,
}: {
  kind: PartnerSlotKind
  ad?: SponsorAd | null
  locationId: string
}) {
  if (ad?.image_url) {
    return (
      <div data-media-partner-slot={kind} data-media-partner-filled="true">
        <MediaIabSlot ad={ad} locationId={locationId} />
      </div>
    )
  }

  const px = SLOT_PX[kind]
  const isRow = kind === 'sponsored-row'
  const frame: CSSProperties = {
    width: '100%',
    maxWidth: isRow ? '100%' : px.w,
    minHeight: px.h,
    aspectRatio: isRow ? undefined : `${px.w} / ${px.h}`,
    marginInline: isRow ? 0 : 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: isRow ? 'flex-start' : 'center',
    gap: isRow ? 12 : 8,
    padding: isRow ? '10px 12px' : 12,
    background: 'var(--media-slot-bg)',
    border: '1px dashed var(--media-slot-line)',
    color: 'var(--media-slot-ink)',
    boxSizing: 'border-box',
  }

  return (
    <div
      className={kind === 'mid-fluid' ? 'ep-media-partner-mid-fluid' : undefined}
      data-media-partner-slot={kind}
      data-media-partner-empty="true"
      aria-label={SLOT_LABEL[kind]}
      style={frame}
    >
      {isRow ? (
        <div
          aria-hidden="true"
          style={{
            width: px.w,
            height: px.h,
            flexShrink: 0,
            background: 'var(--media-slot-thumb)',
          }}
        />
      ) : null}
      <div>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-barlow-condensed), "Barlow Condensed", sans-serif',
            fontWeight: 700,
            fontSize: isRow ? 10 : 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          {SLOT_LABEL[kind]}
        </p>
        <p
          style={{
            margin: isRow ? '2px 0 0' : '4px 0 0',
            fontFamily: 'var(--font-body)',
            fontSize: isRow ? 12 : 13,
          }}
        >
          Evolved Pros Media partner inventory
        </p>
      </div>
    </div>
  )
}

/** Centered 300x250 scroll avail. Empty-state or house/partner creative only. */
export function MediaScrollRect({
  ad,
  locationId,
}: {
  ad?: SponsorAd | null
  locationId: string
}) {
  return (
    <div className="ep-media-mid-rect" data-media-scroll-rect="300x250">
      <MediaPartnerSlot kind="mid-rect" ad={ad} locationId={locationId} />
    </div>
  )
}
