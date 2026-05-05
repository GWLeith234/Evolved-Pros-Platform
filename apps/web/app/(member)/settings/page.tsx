import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

// Per ROUTING-FIX: /settings now points at the consolidated profile
// surface. Notifications, theme, and membership UI moved into the
// profile editor — keeping a redirect (rather than a 404) so legacy
// nav links and bookmarks continue to work.
export default function SettingsPage() {
  redirect('/profile/me')
}
