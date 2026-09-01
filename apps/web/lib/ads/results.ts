import { HOUSE_AD_SLOTS, type HouseAdSlot, isHouseAdSlot } from './house'

export type AdEventRow = {
  ad_id: string | null
  event_type: string
  creative_name: string | null
  creative_slot: string
  created_at: string
}

export type AdCatalogRow = {
  id: string
  image_url: string | null
  headline: string | null
  sponsor_name: string | null
  tool_name: string | null
}

export type AdResultRow = {
  key: string
  adId: string
  creativeName: string
  creativeSlot: HouseAdSlot
  imageUrl: string | null
  impressions: number
  clicks: number
  /** clicks / impressions, or null when there are no impressions (do not invent). */
  ctr: number | null
  lastClickAt: string | null
}

export type AdResults = {
  rows: AdResultRow[]
  totals: {
    impressions: number
    clicks: number
    ctr: number | null
  }
  /** Latest event timestamp, or null when the table is empty. */
  asOf: string | null
}

function resultKey(adId: string, slot: HouseAdSlot): string {
  return `${adId}::${slot}`
}

/**
 * Roll first-party ad_events up by creative + IAB slot.
 * Empty input → empty rows and asOf=null (the dashboard empty state).
 * Does not invent impressions, clicks, CTR, or revenue.
 */
export function aggregateAdResults(
  events: AdEventRow[],
  catalog: AdCatalogRow[] = [],
): AdResults {
  const byId = new Map(catalog.map(a => [a.id, a]))
  const buckets = new Map<
    string,
    {
      adId: string
      creativeName: string
      creativeSlot: HouseAdSlot
      impressions: number
      clicks: number
      lastClickAt: string | null
      lastEventAt: string
    }
  >()

  let asOf: string | null = null

  for (const ev of events) {
    if (!isHouseAdSlot(ev.creative_slot)) continue
    if (ev.event_type !== 'impression' && ev.event_type !== 'click') continue
    const adId = ev.ad_id ?? 'unknown'
    const slot = ev.creative_slot
    const key = resultKey(adId, slot)
    const ad = byId.get(adId)
    const name =
      ev.creative_name?.trim() ||
      ad?.headline?.trim() ||
      ad?.sponsor_name?.trim() ||
      ad?.tool_name?.trim() ||
      'Untitled'
    const existing = buckets.get(key)
    const bucket = existing ?? {
      adId,
      creativeName: name,
      creativeSlot: slot,
      impressions: 0,
      clicks: 0,
      lastClickAt: null,
      lastEventAt: ev.created_at,
    }
    if (ev.event_type === 'impression') bucket.impressions += 1
    if (ev.event_type === 'click') {
      bucket.clicks += 1
      if (!bucket.lastClickAt || ev.created_at > bucket.lastClickAt) {
        bucket.lastClickAt = ev.created_at
      }
    }
    if (ev.created_at > bucket.lastEventAt) bucket.lastEventAt = ev.created_at
    if (!existing) buckets.set(key, bucket)
    if (!asOf || ev.created_at > asOf) asOf = ev.created_at
  }

  const rows: AdResultRow[] = [...buckets.values()]
    .map(b => {
      const ad = byId.get(b.adId)
      return {
        key: resultKey(b.adId, b.creativeSlot),
        adId: b.adId,
        creativeName: b.creativeName,
        creativeSlot: b.creativeSlot,
        imageUrl: ad?.image_url ?? null,
        impressions: b.impressions,
        clicks: b.clicks,
        ctr: b.impressions > 0 ? b.clicks / b.impressions : null,
        lastClickAt: b.lastClickAt,
      }
    })
    .sort((a, b) => {
      const slotOrder = HOUSE_AD_SLOTS.indexOf(a.creativeSlot) - HOUSE_AD_SLOTS.indexOf(b.creativeSlot)
      if (slotOrder !== 0) return slotOrder
      return a.creativeName.localeCompare(b.creativeName)
    })

  const impressions = rows.reduce((s, r) => s + r.impressions, 0)
  const clicks = rows.reduce((s, r) => s + r.clicks, 0)

  return {
    rows,
    totals: {
      impressions,
      clicks,
      ctr: impressions > 0 ? clicks / impressions : null,
    },
    asOf,
  }
}

export function formatCtr(ctr: number | null): string {
  if (ctr === null) return '—'
  return `${(ctr * 100).toFixed(1)}%`
}
