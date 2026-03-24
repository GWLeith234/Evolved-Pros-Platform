import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { AdminEventsTable } from './AdminEventsTable'

export const dynamic = 'force-dynamic'

export default async function AdminEventsPage() {
  const supabase = createClient()

  const { data: rows } = await supabase
    .from('events')
    .select('id, title, event_type, starts_at, is_published, registration_count, required_tier')
    .order('starts_at', { ascending: false })
    .limit(200)

  const events = rows ?? []

  return (
    <div className="px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-black text-[28px] text-[#112535]">Events</h1>
          <p className="font-condensed text-[12px] text-[#7a8a96] mt-0.5">
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
