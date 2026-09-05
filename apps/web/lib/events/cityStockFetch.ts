import {
  lookupCityStock,
  normalizeCityInput,
  resolveCityStock,
  type ResolvedCityStock,
} from './cityStock'

type UnsplashPhoto = {
  urls?: { regular?: string; full?: string }
}

/**
 * Admin-time lookup: catalog first, then Unsplash search for the typed city.
 * Never guesses a city. Search failure falls back to the branded still.
 */
export async function resolveCityStockWithSearch(input: {
  city?: string | null
  imageUrl?: string | null
  fetchImpl?: typeof fetch
}): Promise<ResolvedCityStock> {
  const base = resolveCityStock(input)
  if (!base.fallback || !base.city) return base

  const remote = await searchUnsplashCityPhoto(base.city, input.fetchImpl)
  if (remote) {
    return { city: base.city, imageUrl: remote, fallback: false, source: 'provided' }
  }
  return base
}

export async function searchUnsplashCityPhoto(
  city: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  const normalized = normalizeCityInput(city)
  if (!normalized) return null
  if (lookupCityStock(normalized)) return lookupCityStock(normalized)!.imageUrl

  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) return null

  try {
    const url =
      `https://api.unsplash.com/search/photos` +
      `?query=${encodeURIComponent(`${normalized} city skyline`)}` +
      `&per_page=1&orientation=landscape`
    const res = await fetchImpl(url, { headers: { Authorization: `Client-ID ${key}` } })
    if (!res.ok) return null
    const data = (await res.json()) as { results?: UnsplashPhoto[] }
    const photo = data.results?.[0]?.urls?.regular ?? data.results?.[0]?.urls?.full ?? null
    return photo && photo.startsWith('https://images.unsplash.com/') ? photo : null
  } catch {
    return null
  }
}
