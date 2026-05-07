import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { SettingsClient } from './SettingsClient'

export const dynamic = 'force-dynamic'

const DEFAULT_PREFS = {
  community_reply:   'digest'    as const,
  community_mention: 'immediate' as const,
  event_reminder:    'immediate' as const,
  course_unlock:     'immediate' as const,
  system_billing:    'immediate' as const,
}

export default async function SettingsPage() {
  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase)
  if (!profile) redirect('/login')

  const prefs = {
    ...DEFAULT_PREFS,
    ...((profile.notification_preferences as Record<string, unknown> | null) ?? {}),
  }

  return (
    <SettingsClient
      userId={profile.id}
      email={profile.email ?? ''}
      fullName={profile.full_name ?? ''}
      tier={profile.tier ?? null}
      createdAt={profile.created_at ?? null}
      initialPrefs={prefs}
    />
  )
}
