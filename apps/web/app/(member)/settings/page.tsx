import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { ProfileEditForm } from '@/components/profile/ProfileEditForm'
import { Tooltip } from '@/components/ui/Tooltip'
import { NotificationPrefsForm } from '@/components/notifications/NotificationPrefsForm'
import { ProfileAdUnit } from '@/components/profile/ProfileAdUnit'
import { ThemeSelector } from '@/components/settings/ThemeSelector'
import { hasTierAccess } from '@/lib/tier'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: adData }] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('users')
      .select('id, display_name, full_name, avatar_url, banner_url, bio, role_title, location, tier, notification_preferences, company, linkedin_url, website_url, twitter_handle, phone, phone_visible, current_pillar, goal_90day, goal_visible, theme')
      .eq('id', user.id)
      .single(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (adminClient.from('platform_ads' as any) as any)
      .select('id, image_url, headline, tool_name, cta_text, link_url, click_url, sponsor_name')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle(),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const settingsAd = (adData as any) ?? null

  const notifPrefs = {
    new_replies:     (profile?.notification_preferences as Record<string, unknown> | null)?.new_replies !== false,
    new_likes:       (profile?.notification_preferences as Record<string, unknown> | null)?.new_likes !== false,
    new_members:     (profile?.notification_preferences as Record<string, unknown> | null)?.new_members === true,
    event_reminders: (profile?.notification_preferences as Record<string, unknown> | null)?.event_reminders !== false,
    weekly_digest:   (profile?.notification_preferences as Record<string, unknown> | null)?.weekly_digest !== false,
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="mb-8">
        <p
          className="font-condensed font-bold uppercase tracking-[0.14em] text-[10px] mb-1"
          style={{ color: '#68a2b9' }}
        >
          Account
        </p>
        <h1
          className="font-display font-black leading-tight text-white"
          style={{ fontSize: '28px' }}
        >
          Settings
        </h1>
        <p className="font-body text-[14px] mt-1 text-white/50">
          Update your profile information.
        </p>
      </div>

      <div
        className="rounded-lg overflow-hidden"
        style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
      >
        <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <h2
            className="font-condensed font-bold uppercase tracking-[0.12em] text-[12px]"
            style={{ color: '#FFFFFF' }}
          >
            Profile
          </h2>
        </div>
        <div className="px-6 py-6">
          <ProfileEditForm
            userId={user.id}
            profile={{
              display_name: profile?.display_name ?? null,
              full_name: profile?.full_name ?? null,
              bio: profile?.bio ?? null,
              role_title: profile?.role_title ?? null,
              location: profile?.location ?? null,
              avatar_url: profile?.avatar_url ?? null,
              banner_url: profile?.banner_url ?? null,
              company: profile?.company ?? null,
              linkedin_url: profile?.linkedin_url ?? null,
              website_url: profile?.website_url ?? null,
              twitter_handle: profile?.twitter_handle ?? null,
              phone: profile?.phone ?? null,
              phone_visible: profile?.phone_visible ?? false,
              current_pillar: profile?.current_pillar ?? null,
              goal_90day: profile?.goal_90day ?? null,
              goal_visible: profile?.goal_visible ?? true,
            }}
          />
        </div>
      </div>

      <div
        className="rounded-lg overflow-hidden mt-6"
        style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
      >
        <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <h2
            className="font-condensed font-bold uppercase tracking-[0.12em] text-[12px]"
            style={{ color: '#FFFFFF' }}
          >
            Membership
          </h2>
        </div>
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Tooltip content="VIP: Pillars 1–4, community feed, events. Professional: All 6 pillars, exclusive events, priority support.">
                <p className="font-condensed font-bold uppercase tracking-[0.1em] text-[11px] cursor-help" style={{ color: 'var(--text-secondary)' }}>
                  Current Plan
                </p>
              </Tooltip>
              <p className="font-body text-[15px] font-semibold mt-0.5" style={{ color: '#FFFFFF' }}>
                {profile?.tier === 'pro' ? 'Professional' : 'VIP'}
              </p>
            </div>
            {!hasTierAccess(profile?.tier, 'pro') && (
              <a
                href="/membership-upgrade"
                className="font-condensed font-bold uppercase tracking-wider text-[11px] rounded px-4 py-2 transition-all"
                style={{ backgroundColor: '#ef0e30', color: 'white' }}
              >
                Upgrade to Pro →
              </a>
            )}
          </div>
        </div>
      </div>

      <div
        className="rounded-lg overflow-hidden mt-6"
        style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
      >
        <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <h2
            className="font-condensed font-bold uppercase tracking-[0.12em] text-[12px]"
            style={{ color: '#FFFFFF' }}
          >
            Notifications
          </h2>
          <p className="font-body text-[12px] mt-1" style={{ color: 'var(--text-secondary)' }}>
            Choose which in-app notifications you receive.
          </p>
        </div>
        <div className="px-6 py-6">
          <NotificationPrefsForm initialPrefs={notifPrefs} />
        </div>
      </div>

      <div
        className="rounded-lg overflow-hidden mt-6"
        style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
      >
        <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <h2
            className="font-condensed font-bold uppercase tracking-[0.12em] text-[12px]"
            style={{ color: '#FFFFFF' }}
          >
            Appearance
          </h2>
          <p className="font-body text-[12px] mt-1" style={{ color: 'var(--text-secondary)' }}>
            Choose your preferred colour scheme.
          </p>
        </div>
        <div className="px-6 py-6">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <ThemeSelector initialTheme={(profile as any)?.theme ?? 'dark'} />
        </div>
      </div>

      {settingsAd && (
        <div className="mt-6">
          <ProfileAdUnit ad={settingsAd} />
        </div>
      )}
    </div>
  )
}
