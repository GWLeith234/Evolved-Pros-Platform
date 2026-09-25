'use client'

/**
 * Client-only wrappers for /events chrome.
 *
 * UTC-pinned formatters do not stop #425/#422 here: RSVP pills and
 * Date.now() countdown labels still diverge between server and client.
 * `dynamic({ ssr: false })` cannot be called from a Server Component, so
 * the events page imports this file. Server-fetched props pass through.
 */

import dynamic from 'next/dynamic'

export const CinematicHeroClient = dynamic(
  () => import('@/components/events/CinematicHero').then((m) => m.CinematicHero),
  { ssr: false },
)

export const UpcomingEventsListClient = dynamic(
  () => import('@/components/events/UpcomingEventsList').then((m) => m.UpcomingEventsList),
  { ssr: false },
)
