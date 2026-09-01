import { adminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'
import Link from 'next/link'
import { AdminEventsTable } from './AdminEventsTable'

export const dynamic = 'force-dynamic'

export default async function AdminEventsPage() {
  const h = headers()
  if (h.get('RSC') === '1' || h.get('Next-Router-Prefetch') === '1') {
    return null
  }

  // RLS-FIX: adminClient — events_select_authenticated filters is_published=true,
  // hiding drafts from admins on the SSR client. Mirrors AD2.3 episodes fix.
  const { data: rows } = await adminClient
    .from('events')
    .select('id, title, event_type, starts_at, is_published, registration_count, required_tier')
    .order('starts_at', { ascending: false })
    .limit(200)

  const events = rows ?? []

  return (
    <div className="px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-black text-[28px] text-[color:var(--admin-text-strong)]">Events</h1>
          <p className="font-condensed text-[12px] text-[color:var(--admin-text-2)] mt-0.5">
            {events.length} total · {events.filter(e => e.is_published).length} published
          </p>
        </div>
        <Link
          href="/admin/events/new"
          className="font-condensed font-bold uppercase tracking-wide text-[12px] rounded px-5 py-2.5 transition-all"
          style={{ backgroundColor: '#1b3c5a', color: 'white' }}
        >
          + New Event
        </Link>
      </div>

      <AdminEventsTable events={events} />
    </div>
  )
}
