import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loginHrefFor } from '@/lib/auth/gatedIntent'

/**
 * Events consolidated into LIVE (speaking + tour calendar + partners).
 * Deep links to /events/[eventId] still work for RSVP detail.
 *
 * /events stays members-only. Middleware 307s anonymous GETs to
 * /login?redirect=/events. This page repeats that loginHrefFor hop if the
 * request reaches the route.
 */
export default async function EventsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(loginHrefFor('/events'))
  redirect('/live')
}
