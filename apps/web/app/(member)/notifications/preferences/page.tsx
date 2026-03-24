import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { EmailPrefsForm } from '@/components/notifications/EmailPrefsForm'

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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('notification_preferences')
    .eq('id', user.id)
    .single()

  const prefs = {
    ...DEFAULT_PREFS,
    ...(profile?.notification_preferences ?? {}),
  }

  return (
    <div className="px-8 py-6 max-w-2xl">
      <div className="mb-6">
        <Link
          href="/notifications"
          className="font-condensed font-semibold uppercase tracking-wide text-[11px] text-[#7a8a96] hover:text-[#1b3c5a] transition-colors"
        >
          ← Back to Notifications
        </Link>
      </div>
      <h1 className="font-display font-black text-[28px] text-[#112535] mb-1">Email Preferences</h1>
      <p className="font-body text-[14px] text-[#7a8a96] mb-6">
        Control how and when you receive email notifications from Evolved Pros.
      </p>
      <EmailPrefsForm initialPrefs={prefs} />
    </div>
  )
}
