import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { seatStatusForTier } from '@/lib/commerce/seats'
import { seatsFilledLine } from '@/lib/community/directory'
import { MemberDirectoryClient } from './MemberDirectoryClient'

export const metadata = {
  title: 'Member Directory',
}

export const dynamic = 'force-dynamic'

/**
 * SPRINT Q1 - the directory is open to every signed-in member.
 *
 * The tier decides the PAYLOAD, and that decision is made in /api/members by
 * selecting fewer columns. This page adds the seats line, which reads the
 * same live count the seat cap enforces, so the number on the roster and the
 * number the checkout guard uses can never disagree.
 */
export default async function MemberDirectoryPage() {
  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase)
  if (!profile) redirect('/login')

  let seatsLine: string | null = null
  try {
    const seats = await seatStatusForTier('pro')
    if (seats.known && seats.cap !== null) {
      seatsLine = seatsFilledLine(seats.taken, seats.cap)
    }
  } catch {
    // A seat count that cannot be read is simply not shown. An unreachable
    // Stripe must not blank the roster.
  }

  return <MemberDirectoryClient seatsLine={seatsLine} />
}
