import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

// Bare /profile resolved a 404 because the only profile page lives at
// /profile/[userId]. Send people to /profile/me, which itself looks up
// the current user's public.users.id and redirects on to the canonical
// /profile/<id> URL.
export default function ProfilePage() {
  redirect('/profile/me')
}
