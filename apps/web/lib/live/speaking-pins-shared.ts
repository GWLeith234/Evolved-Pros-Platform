/**
 * Client-safe pin helpers. Base catalogue lives in speaking-pins.ts;
 * admin can append extras via platform_settings.live_speaking_pins_extra.
 */

export const LIVE_SPEAKING_PINS_EXTRA_KEY = 'live_speaking_pins_extra'

export interface SpeakingPinStored {
  id: string
  city: string
  country: string
  lat: number
  lon: number
  featured?: boolean
}

export function newPinId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `pin_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function parseSpeakingPinsExtraJson(raw: string): SpeakingPinStored[] {
  if (!raw?.trim()) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    const out: SpeakingPinStored[] = []
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue
      const r = item as Partial<SpeakingPinStored>
      const city = typeof r.city === 'string' ? r.city.trim() : ''
      const country = typeof r.country === 'string' ? r.country.trim() : ''
      const lat = typeof r.lat === 'number' ? r.lat : Number(r.lat)
      const lon = typeof r.lon === 'number' ? r.lon : Number(r.lon)
      if (!city || !country || !Number.isFinite(lat) || !Number.isFinite(lon)) continue
      if (lat < -90 || lat > 90 || lon < -180 || lon > 180) continue
      out.push({
        id: typeof r.id === 'string' && r.id ? r.id : newPinId(),
        city,
        country,
        lat,
        lon,
        featured: Boolean(r.featured),
      })
    }
    return out
  } catch {
    return []
  }
}

export function validatePinStored(
  row: Partial<SpeakingPinStored>,
): { ok: true; value: SpeakingPinStored } | { ok: false; error: string } {
  const city = String(row.city ?? '').trim()
  const country = String(row.country ?? '').trim()
  const lat = typeof row.lat === 'number' ? row.lat : Number(row.lat)
  const lon = typeof row.lon === 'number' ? row.lon : Number(row.lon)
  if (!city) return { ok: false, error: 'City is required' }
  if (!country) return { ok: false, error: 'Country is required' }
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return { ok: false, error: 'Latitude must be between -90 and 90' }
  }
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
    return { ok: false, error: 'Longitude must be between -180 and 180' }
  }
  return {
    ok: true,
    value: {
      id: String(row.id ?? '').trim() || newPinId(),
      city,
      country,
      lat,
      lon,
      featured: Boolean(row.featured),
    },
  }
}
