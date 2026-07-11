import { redirect } from 'next/navigation'

/**
 * Events consolidated into LIVE (speaking + tour calendar + partners).
 * Deep links to /events/[eventId] still work for RSVP detail.
 */
export default function EventsPage() {
  redirect('/live')
}
