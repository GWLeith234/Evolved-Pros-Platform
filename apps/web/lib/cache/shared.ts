import 'server-only'
import { unstable_cache } from 'next/cache'
import { adminClient } from '@/lib/supabase/admin'

/** Cache tags — revalidate from admin write routes when those land. */
export const CACHE_TAGS = {
  platformSettings: 'platform-settings',
  greetingQuotes: 'greeting-quotes',
  platformAds: 'platform-ads',
  podcastEpisodes: 'podcast-episodes',
} as const

type SettingRow = { key: string; value: string | null }

async function loadPlatformSettings(): Promise<SettingRow[]> {
  const { data } = await adminClient
    .from('platform_settings')
    .select('key, value')
  return (data ?? []) as SettingRow[]
}

const getPlatformSettingsCached = unstable_cache(
  loadPlatformSettings,
  ['platform-settings-all'],
  { revalidate: 300, tags: [CACHE_TAGS.platformSettings] },
)

/** Map of platform_settings key → value (5 min CDN/server cache). */
export async function getPlatformSettingsMap(): Promise<Map<string, string>> {
  const rows = await getPlatformSettingsCached()
  return new Map(
    rows
      .filter((r): r is SettingRow & { value: string } => typeof r.value === 'string')
      .map(r => [r.key, r.value]),
  )
}

export async function getPlatformSetting(
  key: string,
  fallback = '',
): Promise<string> {
  const map = await getPlatformSettingsMap()
  return map.get(key) ?? fallback
}

export async function getDefaultTheme(): Promise<string> {
  return getPlatformSetting('default_theme', 'dark')
}

type QuoteRow = { quote_text: string; source: string | null }

async function loadGreetingQuotes(): Promise<QuoteRow[]> {
  const { data } = await adminClient
    .from('greeting_quotes')
    .select('quote_text, source')
    .order('day_number')
  return (data ?? []) as QuoteRow[]
}

const getGreetingQuotesCached = unstable_cache(
  loadGreetingQuotes,
  ['greeting-quotes-all'],
  { revalidate: 3600, tags: [CACHE_TAGS.greetingQuotes] },
)

/** Full greeting-quote catalogue (1h cache). Callers pick by day-of-year. */
export async function getGreetingQuotes(): Promise<QuoteRow[]> {
  return getGreetingQuotesCached()
}

/**
 * One rotating quote for the given UTC day-of-year (1–366).
 * Still uses the cached catalogue (small) — avoids shipping the array to
 * callers that only need a single entry.
 */
export async function getGreetingQuoteOfDay(
  dayOfYear: number,
): Promise<QuoteRow | null> {
  const quotes = await getGreetingQuotes()
  if (!quotes.length) return null
  // Match historical home behaviour: dayOfYear % length (0-based index).
  const idx = ((dayOfYear % quotes.length) + quotes.length) % quotes.length
  return quotes[idx] ?? null
}

type AdRow = {
  id: string
  image_url: string | null
  headline: string | null
  body_copy: string | null
  tool_name: string | null
  cta_text: string | null
  link_url: string | null
  click_url: string | null
  sponsor_name: string | null
  endorsement_quote: string | null
  rotation_interval: number | null
  sort_order: number | null
  placement: string | null
  is_active: boolean | null
}

async function loadActivePlatformAds(): Promise<AdRow[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (adminClient as any)
    .from('platform_ads')
    .select(
      'id, image_url, headline, body_copy, tool_name, cta_text, link_url, click_url, sponsor_name, endorsement_quote, rotation_interval, sort_order, placement, is_active',
    )
    .eq('is_active', true)
    .order('sort_order')
    .limit(24)
  return (data ?? []) as AdRow[]
}

const getActivePlatformAdsCached = unstable_cache(
  loadActivePlatformAds,
  ['platform-ads-active'],
  { revalidate: 120, tags: [CACHE_TAGS.platformAds] },
)

/** Active platform ads (2 min cache). */
export async function getActivePlatformAds(): Promise<AdRow[]> {
  return getActivePlatformAdsCached()
}
