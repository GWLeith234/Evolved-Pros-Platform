import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const NAV_ITEMS = [
  { href: '/admin/events', label: 'Events' },
  { href: '/admin/courses', label: 'Courses' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/home')

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#faf9f7' }}>
      {/* Admin sidebar */}
      <aside
        className="w-[200px] flex-shrink-0 flex flex-col py-4"
        style={{ backgroundColor: '#0d1c27', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="px-5 mb-4">
          <p className="font-condensed font-bold uppercase tracking-[0.2em] text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Admin
          </p>
        </div>

        {NAV_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="px-5 py-2.5 font-condensed font-semibold text-[12px] tracking-wide transition-colors hover:text-white"
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            {item.label}
          </Link>
        ))}

        <div className="mt-auto px-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Link
            href="/home"
            className="font-condensed text-[11px] tracking-wide transition-colors hover:text-white"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            ← Back to Platform
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
