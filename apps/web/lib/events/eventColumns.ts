import { adminClient } from '@/lib/supabase/admin'
import {
  EVENT_PRIVILEGED_COLUMNS,
  EVENT_PRIVILEGED_COLUMNS_WITH_CITY,
  eventColumns,
  isMissingCityColumnError,
} from '@/lib/events/privilegedUrls'

/** How long a "city column missing" answer is reused. Present is cached for the process. */
export const EVENT_CITY_COLUMN_MISS_TTL_MS = 5 * 60 * 1000

type CityColumnCache =
  | { status: 'present' }
  | { status: 'missing'; at: number }
  | null

let cache: CityColumnCache = null

export function resetEventCityColumnCache(): void {
  cache = null
}

/**
 * True when `events.city` can be selected (migration 088 applied).
 * A missing column is cached briefly so each event read does not probe,
 * and a later apply of 088 starts returning city without a restart.
 * Other errors are not cached: this request omits city, the next one retries.
 */
export async function eventsHaveCityColumn(now = Date.now()): Promise<boolean> {
  if (cache?.status === 'present') return true
  if (cache?.status === 'missing' && now - cache.at < EVENT_CITY_COLUMN_MISS_TTL_MS) return false

  let error: { code?: string | null; message?: string | null } | null
  try {
    const result = await adminClient.from('events').select('city').limit(1)
    error = result.error
  } catch {
    return false
  }
  if (!error) {
    cache = { status: 'present' }
    return true
  }
  if (isMissingCityColumnError(error)) {
    cache = { status: 'missing', at: now }
    return false
  }
  return false
}

export async function eventPrivilegedColumns(): Promise<
  typeof EVENT_PRIVILEGED_COLUMNS | typeof EVENT_PRIVILEGED_COLUMNS_WITH_CITY
> {
  return (await eventsHaveCityColumn())
    ? EVENT_PRIVILEGED_COLUMNS_WITH_CITY
    : EVENT_PRIVILEGED_COLUMNS
}

/** Arbitrary event select list, with `city` appended only when the column exists. */
export async function eventSelectColumns(columns: string): Promise<string> {
  return eventColumns(columns, await eventsHaveCityColumn())
}

/**
 * PostgREST's select parser only accepts one string literal. Callers pass the
 * runtime list (city included only when 088 is applied) and keep the row type
 * of the post-088 select. A missing `city` field reads as null.
 */
export function privilegedEventSelect(
  columns: string,
): typeof EVENT_PRIVILEGED_COLUMNS_WITH_CITY {
  return columns as typeof EVENT_PRIVILEGED_COLUMNS_WITH_CITY
}

export function privilegedEventEmbedSelect(
  columns: string,
): `event_id, events(${typeof EVENT_PRIVILEGED_COLUMNS_WITH_CITY})` {
  return `event_id, events(${columns})` as `event_id, events(${typeof EVENT_PRIVILEGED_COLUMNS_WITH_CITY})`
}
