import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const revalidate = 60

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: channels, error } = await supabase
    .from('channels')
    .select('id, slug, name, pillar_number')
    .order('sort_order')

  if (error) return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 })

  // For unread counts we'd need last_visited tracking (future).
  // For now return 0 for all.
  const result = (channels ?? []).map(c => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    pillarNumber: c.pillar_number,
    unreadCount: 0,
  }))

  return NextResponse.json({ channels: result })
}
