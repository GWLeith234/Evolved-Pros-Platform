'use client'

/**
 * SPRINT HYDRATION-FIX-5 — SSR-skip wrappers for the /events page chrome.
 *
 * CinematicHero and UpcomingEventsList both render time-dependent and
 * user-RSVP-dependent content:
 *
 *   CinematicHero
 *     - "STARTS IN 12D" countdown (CountdownTimer reads Date.now() on tick)
 *     - "ON YOUR CALENDAR" RSVP pill driven by initialIsRsvpd
 *     - Hero schedule label formatted from event.starts_at
 *   UpcomingEventsList
 *     - Per-card date / time / month badges
 *     - "RSVP" vs "✓ Going" pill driven by registeredIds
 *     - Relative time hints
 *
 * Even with UTC-pinned formatters and mount-gated CountdownTimer, hydration
 * errors #425 / #422 still fire on /events because the user-specific RSVP
 * state and Date.now()-derived countdown labels do not survive the SSR /
 * client diff. Deferring both subtrees to client-only via next/dynamic with
 * ssr: false closes the diff entirely — the server emits the page shell
 * (EpisodeBanner + EventsPageHeader) and these two components mount fresh
 * on the client with their real values from the first paint forward.
 *
 * dynamic({ ssr: false }) cannot be invoked from a Server Component in App
 * Router, so this wrapper file lives next to the Server page.tsx and is
 * imported by it. Server-fetched props (event, initialIsRsvpd, events,
 * registeredIds) flow through unchanged.
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
