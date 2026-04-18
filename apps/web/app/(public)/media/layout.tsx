import { createClient } from '@/lib/supabase/server'
import { TopNav } from '@/components/layout/TopNav'
import { MediaFooter } from '@/components/media/MediaFooter'
import { MediaNav } from '@/components/media/MediaNav'
import Link from 'next/link'

export default async function MediaLayout({ children }: { children: React.ReactNode }) {
  // Try to get user profile for TopNav — skip gracefully if not logged in
  let profile: {
    id: string
    display_name: string | null
    full_name: string | null
    avatar_url: string | null
    tier: string | null
    tier_expires_at: string | null
  } | null = null

  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('users')
        .select('id, display_name, full_name, avatar_url, tier, tier_expires_at')
        .eq('id', user.id)
        .single()
      profile = data
    }
  } catch {
    // Not logged in — fine for public media pages
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F0E8' }}>
      <style>{`html, body { background-color: #F5F0E8 !important; }`}</style>
      {/* Platform nav — only for logged-in users */}
      {profile && <TopNav profile={profile} />}

      {/* Masthead */}
      <div
        style={{
          backgroundColor: '#F5F0E8',
          borderBottom: '3px solid #2B3A5A',
          padding: '16px 24px 12px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-abril), serif',
                fontWeight: 400,
                fontSize: 50,
                color: '#2B3A5A',
                textTransform: 'uppercase',
                lineHeight: 1,
                margin: 0,
              }}
            >
              EVOLVED <span style={{ color: '#C9302A' }}>M</span>EDIA
            </h1>
            <p
              suppressHydrationWarning
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 10,
                color: '#6B6B6B',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginTop: 2,
              }}
            >
              {today}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link
              href={profile ? '/home' : '/login'}
              style={{
                fontFamily: 'var(--font-condensed)',
                fontWeight: 600,
                fontSize: 12,
                color: '#2B3A5A',
                border: '1.5px solid #2B3A5A',
                padding: '6px 14px',
                borderRadius: 3,
                textDecoration: 'none',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
              }}
            >
              ← Back to platform
            </Link>
            <Link
              href="/pricing"
              style={{
                fontFamily: 'var(--font-condensed)',
                fontWeight: 600,
                fontSize: 12,
                color: '#ffffff',
                backgroundColor: '#C9302A',
                padding: '6px 14px',
                borderRadius: 3,
                textDecoration: 'none',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                border: '1.5px solid #C9302A',
                whiteSpace: 'nowrap',
              }}
            >
              Join Evolved Pros
            </Link>
          </div>
        </div>
      </div>

      <MediaNav />

      {children}

      <MediaFooter />
    </div>
  )
}
