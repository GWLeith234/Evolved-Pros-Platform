/**
 * License-safe city stock for event cards (S5).
 * Curated Unsplash stills only. Never invent a city from a title.
 * Unknown / blank city uses the branded fallback, not a guessed skyline.
 */

export const EVENT_CITY_FALLBACK_IMAGE = '/events/city-fallback.svg'

const UNSPLASH = 'https://images.unsplash.com'

function unsplash(id: string): string {
  return `${UNSPLASH}/${id}?auto=format&fit=crop&w=1400&q=80`
}

export type CityStockEntry = {
  slug: string
  label: string
  aliases: readonly string[]
  imageUrl: string
}

/**
 * Verified Unsplash landscape stills (HTTP 200 as of S5).
 * Aliases cover how an admin might type the same city. No extra cities.
 */
export const CITY_STOCK_CATALOG: readonly CityStockEntry[] = [
  {
    slug: 'las-vegas',
    label: 'Las Vegas',
    aliases: ['las vegas', 'vegas', 'las vegas nv'],
    imageUrl: unsplash('photo-1605833556294-ea5c7a74f57d'),
  },
  {
    slug: 'new-york',
    label: 'New York',
    aliases: ['new york', 'new york city', 'nyc', 'manhattan'],
    imageUrl: unsplash('photo-1480714378408-67cf0d13bc1b'),
  },
  {
    slug: 'chicago',
    label: 'Chicago',
    aliases: ['chicago', 'chicago il'],
    imageUrl: unsplash('photo-1494522855154-9297ac14b55f'),
  },
  {
    slug: 'san-francisco',
    label: 'San Francisco',
    aliases: ['san francisco', 'sf', 'san francisco ca'],
    imageUrl: unsplash('photo-1501594907352-04cda38ebc29'),
  },
  {
    slug: 'los-angeles',
    label: 'Los Angeles',
    aliases: ['los angeles', 'la', 'los angeles ca'],
    imageUrl: unsplash('photo-1515895309288-a3815ab7cf81'),
  },
  {
    slug: 'austin',
    label: 'Austin',
    aliases: ['austin', 'austin tx'],
    imageUrl: unsplash('photo-1531218150217-54595bc2b934'),
  },
  {
    slug: 'miami',
    label: 'Miami',
    aliases: ['miami', 'miami fl'],
    imageUrl: unsplash('photo-1533106497176-45ae19e68ba2'),
  },
  {
    slug: 'denver',
    label: 'Denver',
    aliases: ['denver', 'denver co'],
    imageUrl: unsplash('photo-1546156929-a4c0ac411f47'),
  },
  {
    slug: 'boston',
    label: 'Boston',
    aliases: ['boston', 'boston ma'],
    imageUrl: unsplash('photo-1501979376754-2ff867a4f659'),
  },
  {
    slug: 'london',
    label: 'London',
    aliases: ['london', 'london uk'],
    imageUrl: unsplash('photo-1513635269975-59663e0ac1ad'),
  },
  {
    slug: 'paris',
    label: 'Paris',
    aliases: ['paris', 'paris france'],
    imageUrl: unsplash('photo-1502602898657-3e91760cbb34'),
  },
  {
    slug: 'tokyo',
    label: 'Tokyo',
    aliases: ['tokyo', 'tokyo japan'],
    imageUrl: unsplash('photo-1540959733332-eab4deabeeaf'),
  },
  {
    slug: 'singapore',
    label: 'Singapore',
    aliases: ['singapore'],
    imageUrl: unsplash('photo-1525625293386-3f8f99389edd'),
  },
] as const

const ALIAS_INDEX = new Map<string, CityStockEntry>()
for (const entry of CITY_STOCK_CATALOG) {
  for (const alias of entry.aliases) {
    ALIAS_INDEX.set(alias, entry)
  }
}

/** Letters, spaces, hyphen, apostrophe, period. Rejects junk so we do not search garbage. */
const CITY_NAME_RE = /^[a-zA-Z][a-zA-Z .'-]{1,79}$/

export function normalizeCityInput(raw: string | null | undefined): string | null {
  if (!raw) return null
  const trimmed = raw.replace(/\s+/g, ' ').trim()
  if (!trimmed) return null
  if (!CITY_NAME_RE.test(trimmed)) return null
  return trimmed
}

export function cityLookupKey(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[.]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function lookupCityStock(raw: string | null | undefined): CityStockEntry | null {
  const normalized = normalizeCityInput(raw)
  if (!normalized) return null
  return ALIAS_INDEX.get(cityLookupKey(normalized)) ?? null
}

export function isManagedEventImage(url: string | null | undefined): boolean {
  if (!url) return true
  if (url === EVENT_CITY_FALLBACK_IMAGE) return true
  if (url.startsWith(`${UNSPLASH}/`)) return true
  return false
}

export type ResolvedCityStock = {
  city: string | null
  imageUrl: string
  fallback: boolean
  source: 'catalog' | 'fallback' | 'provided'
}

/**
 * Resolve the city → image pair stored on the event.
 * `providedImage` wins when the admin uploaded a custom cover.
 * Blank or invalid city never invents a location.
 */
export function resolveCityStock(input: {
  city?: string | null
  imageUrl?: string | null
}): ResolvedCityStock {
  const city = normalizeCityInput(input.city)
  const provided = input.imageUrl?.trim() || null
  const customCover = provided && !isManagedEventImage(provided)

  if (customCover) {
    return { city, imageUrl: provided, fallback: false, source: 'provided' }
  }

  if (city) {
    const hit = lookupCityStock(city)
    if (hit) {
      return { city: hit.label, imageUrl: hit.imageUrl, fallback: false, source: 'catalog' }
    }
    if (provided) {
      return { city, imageUrl: provided, fallback: false, source: 'provided' }
    }
  }

  return { city, imageUrl: EVENT_CITY_FALLBACK_IMAGE, fallback: true, source: 'fallback' }
}

export function eventCardImageUrl(imageUrl: string | null | undefined): string {
  const url = imageUrl?.trim()
  return url || EVENT_CITY_FALLBACK_IMAGE
}

export function eventCardImageAlt(city: string | null | undefined): string {
  const label = normalizeCityInput(city)
  return label ? `Stock photo of ${label}` : 'Event'
}
