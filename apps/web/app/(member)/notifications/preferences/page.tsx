import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { EmailPrefsForm } from '@/components/notifications/EmailPrefsForm'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'

export const dynamic = 'force-dynamic'

const DEFAULT_PREFS = {
  community_reply:   'digest'    as const,
  community_mention: 'immediate' as const,
  event_reminder:    'immediate' as const,
  course_unlock:     'immediate' as const,
  system_billing:    'immediate' as const,
}

export default async function NotificationPreferencesPage() {
  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase)
  if (!profile) redirect('/login')

  const prefs = {
    ...DEFAULT_PREFS,
    ...((profile.notification_preferences as Record<string, unknown> | null) ?? {}),
  }

  return (
    <div className="px-8 py-6 max-w-2xl">
      <div className="mb-6">
        <Link
          href="/notifications"
          className="font-condensed font-semibold uppercase tracking-wide text-[11px] transition-colors"
          style={{ color: 'var(--text-tertiary)' }}
        >
          ← Back to Notifications
        </Link>
      </div>
      <h1 className="font-display font-black text-[28px] mb-1" style={{ color: 'var(--text-primary)' }}>Email Preferences</h1>
      <p className="font-body text-[14px] mb-6" style={{ color: 'var(--text-secondary)' }}>
        Control how and when you receive email notifications from Evolved Pros.
      </p>
      <EmailPrefsForm initialPrefs={prefs} />
    </div>
  )
}
