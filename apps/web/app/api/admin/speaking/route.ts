export const dynamic = 'force-dynamic'

import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/helpers'
import { adminClient } from '@/lib/supabase/admin'
import { CACHE_TAGS } from '@/lib/cache/shared'
import {
  LIVE_UPCOMING_SETTING_KEY,
  loadUpcomingSpeakingStored,
  validateStoredRow,
  type UpcomingDateStored,
} from '@/lib/live/upcoming-dates'

async function saveRows(rows: UpcomingDateStored[]) {
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date))
  const { error } = await adminClient.from('platform_settings').upsert({
    key: LIVE_UPCOMING_SETTING_KEY,
    value: JSON.stringify(sorted),
    updated_at: new Date().toISOString(),
  })
  if (error) throw new Error(error.message)
  revalidateTag(CACHE_TAGS.platformSettings)
}

/** GET — full calendar (including past rows) for admin. */
export async function GET() {
  const check = await requireAdminApi()
  if (check instanceof Response) return check

  try {
    const dates = await loadUpcomingSpeakingStored()
    return NextResponse.json({ dates })
  } catch {
    return NextResponse.json({ error: 'Failed to load speaking dates' }, { status: 500 })
  }
}

/**
 * PUT — replace the full calendar.
 * Body: { dates: UpcomingDateStored[] }
 */
export async function PUT(request: Request) {
  const check = await requireAdminApi()
  if (check instanceof Response) return check

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const list = (body as { dates?: unknown })?.dates
  if (!Array.isArray(list)) {
    return NextResponse.json({ error: 'dates must be an array' }, { status: 422 })
  }

  const dates: UpcomingDateStored[] = []
  for (const item of list) {
    const result = validateStoredRow((item ?? {}) as Partial<UpcomingDateStored>)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 422 })
    }
    dates.push(result.value)
  }

  // Deduplicate by id (last wins)
  const byId = new Map<string, UpcomingDateStored>()
  for (const d of dates) byId.set(d.id, d)

  try {
    const next = Array.from(byId.values())
    await saveRows(next)
    return NextResponse.json({ dates: next })
  } catch {
    return NextResponse.json({ error: 'Failed to save speaking dates' }, { status: 500 })
  }
}
