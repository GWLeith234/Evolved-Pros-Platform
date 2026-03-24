import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('display_name, full_name, tier, tier_status')
    .eq('id', user.id)
    .single()

  const name = profile?.display_name ?? profile?.full_name ?? 'Member'

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0d1c27' }}>
      {/* Top nav */}
      <header
        className="border-b px-8 py-4 flex items-center justify-between"
        style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: '#112535' }}
      >
        <p
          className="tracking-[0.18em] text-base font-bold text-white"
          style={{ fontFamily: '"Barlow Condensed", sans-serif' }}
        >
          EVOLVED<span style={{ color: '#ef0e30' }}>·</span>PROS
        </p>
        <span
          className="text-xs font-semibold uppercase tracking-widest px-2 py-1 rounded"
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            color: profile?.tier === 'pro' ? '#c9a84c' : '#68a2b9',
            border: `1px solid ${profile?.tier === 'pro' ? 'rgba(201,168,76,0.3)' : 'rgba(104,162,185,0.3)'}`,
          }}
        >
          {profile?.tier === 'pro' ? 'Pro' : 'Community'}
        </span>
      </header>

      {/* Main */}
      <main className="px-8 py-12 max-w-4xl mx-auto">
        <h1
          className="text-white mb-2"
          style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '40px', fontWeight: 900 }}
        >
          Welcome, {name}.
        </h1>
        <p className="text-[#7a8a96] text-base" style={{ fontFamily: 'Barlow, sans-serif' }}>
          The architecture. Not the inspiration.
        </p>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Community', href: '/community', desc: 'Join the conversation' },
            { label: 'Courses',   href: '/courses',   desc: 'The 6 pillars' },
            { label: 'Events',    href: '/events',    desc: 'Live sessions' },
          ].map(item => (
            <a
              key={item.href}
              href={item.href}
              className="block p-5 rounded-lg border transition-all hover:border-[#68a2b9]"
              style={{
                backgroundColor: '#112535',
                borderColor: 'rgba(255,255,255,0.06)',
              }}
            >
              <p
                className="text-white font-semibold uppercase tracking-wide text-sm mb-1"
                style={{ fontFamily: '"Barlow Condensed", sans-serif' }}
              >
                {item.label}
              </p>
              <p className="text-[#7a8a96] text-xs" style={{ fontFamily: 'Barlow, sans-serif' }}>
                {item.desc}
              </p>
            </a>
          ))}
        </div>
      </main>
    </div>
  )
}
