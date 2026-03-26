import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileEditForm } from '@/components/profile/ProfileEditForm'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, display_name, full_name, avatar_url, bio, role_title, location, tier')
    .eq('id', user.id)
    .single()

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
          className="font-display font-black leading-tight"
          style={{ fontSize: '28px', color: '#112535' }}
        >
          Settings
        </h1>
        <p className="font-body text-[14px] mt-1" style={{ color: '#7a8a96' }}>
          Update your profile information and preferences.
        </p>
      </div>

      <div
        className="bg-white rounded-lg overflow-hidden"
        style={{ border: '1px solid rgba(27,60,90,0.1)', boxShadow: '0 1px 3px rgba(27,60,90,0.06)' }}
      >
        <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(27,60,90,0.08)' }}>
          <h2
            className="font-condensed font-bold uppercase tracking-[0.12em] text-[12px]"
            style={{ color: '#1b3c5a' }}
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
            }}
          />
        </div>
      </div>

      <div
        className="bg-white rounded-lg overflow-hidden mt-6"
        style={{ border: '1px solid rgba(27,60,90,0.1)', boxShadow: '0 1px 3px rgba(27,60,90,0.06)' }}
      >
        <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(27,60,90,0.08)' }}>
          <h2
            className="font-condensed font-bold uppercase tracking-[0.12em] text-[12px]"
            style={{ color: '#1b3c5a' }}
          >
            Membership
          </h2>
        </div>
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-condensed font-bold uppercase tracking-[0.1em] text-[11px]" style={{ color: '#7a8a96' }}>
                Current Plan
              </p>
              <p className="font-body text-[15px] font-semibold mt-0.5 capitalize" style={{ color: '#1b3c5a' }}>
                {profile?.tier ?? 'Community'}
              </p>
            </div>
            {profile?.tier !== 'pro' && (
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
    </div>
  )
}
