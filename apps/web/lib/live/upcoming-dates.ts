/**
 * Server loaders for /live upcoming speaking dates.
 * Source of truth: `platform_settings.live_upcoming_speaking` (Admin → Speaking).
 */

import 'server-only'
import { getPlatformSetting } from '@/lib/cache/shared'
import {
  LIVE_UPCOMING_SETTING_KEY,
  filterUpcoming,
  parseUpcomingSpeakingJson,
  type UpcomingDate,
  type UpcomingDateStored,
} from './upcoming-dates-shared'

export {
  LIVE_UPCOMING_SETTING_KEY,
  type UpcomingDate,
  type UpcomingDateStored,
  startOfToday,
  newSpeakingDateId,
  parseUpcomingSpeakingJson,
  validateStoredRow,
  fromStored,
  filterUpcoming,
} from './upcoming-dates-shared'

/** All stored rows (including past) — for admin. */
export async function loadUpcomingSpeakingStored(): Promise<UpcomingDateStored[]> {
  const raw = await getPlatformSetting(LIVE_UPCOMING_SETTING_KEY, '[]')
  return parseUpcomingSpeakingJson(raw)
}

/** Upcoming speaking rows only (date ≥ today), soonest first — for /live. */
export async function getUpcomingSpeakingDates(): Promise<UpcomingDate[]> {
  const stored = await loadUpcomingSpeakingStored()
  return filterUpcoming(stored)
}
