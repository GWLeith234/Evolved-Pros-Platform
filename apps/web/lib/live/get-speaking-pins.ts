import 'server-only'
import { getPlatformSetting } from '@/lib/cache/shared'
import { SPEAKING_PINS, type SpeakingPin } from './speaking-pins'
import {
  LIVE_SPEAKING_PINS_EXTRA_KEY,
  parseSpeakingPinsExtraJson,
  type SpeakingPinStored,
} from './speaking-pins-shared'

export {
  LIVE_SPEAKING_PINS_EXTRA_KEY,
  type SpeakingPinStored,
  parseSpeakingPinsExtraJson,
  validatePinStored,
  newPinId,
} from './speaking-pins-shared'

export async function loadSpeakingPinsExtra(): Promise<SpeakingPinStored[]> {
  const raw = await getPlatformSetting(LIVE_SPEAKING_PINS_EXTRA_KEY, '[]')
  return parseSpeakingPinsExtraJson(raw)
}

/**
 * Base catalogue + admin-added extras. Extras with the same city+country
 * replace the base pin (so you can fix coords without a code change).
 */
export async function getSpeakingPins(): Promise<SpeakingPin[]> {
  const extras = await loadSpeakingPinsExtra()
  const byKey = new Map<string, SpeakingPin>()
  for (const p of SPEAKING_PINS) {
    byKey.set(`${p.city.toLowerCase()}|${p.country.toLowerCase()}`, p)
  }
  for (const e of extras) {
    const key = `${e.city.toLowerCase()}|${e.country.toLowerCase()}`
    const base = byKey.get(key)
    byKey.set(key, {
      city: e.city,
      country: e.country,
      lat: e.lat,
      lon: e.lon,
      // Explicit featured:true wins; otherwise keep catalogue featured pulse
      // so a coords-only override does not silently drop Fripp/Saskatoon.
      featured: e.featured ? true : base?.featured || undefined,
    })
  }
  return Array.from(byKey.values())
}

export function statsFromPins(pins: SpeakingPin[]) {
  return {
    cities: new Set(pins.map(p => p.city)).size,
    countries: new Set(pins.map(p => p.country)).size,
  }
}
