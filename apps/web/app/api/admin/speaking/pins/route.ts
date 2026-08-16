export const dynamic = 'force-dynamic'

import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/helpers'
import { adminClient } from '@/lib/supabase/admin'
import { CACHE_TAGS } from '@/lib/cache/shared'
import {
  LIVE_SPEAKING_PINS_EXTRA_KEY,
  loadSpeakingPinsExtra,
  validatePinStored,
  type SpeakingPinStored,
} from '@/lib/live/get-speaking-pins'

async function savePins(pins: SpeakingPinStored[]) {
  const { error } = await adminClient.from('platform_settings').upsert({
    key: LIVE_SPEAKING_PINS_EXTRA_KEY,
    value: JSON.stringify(pins),
    updated_at: new Date().toISOString(),
  })
  if (error) throw new Error(error.message)
  revalidateTag(CACHE_TAGS.platformSettings)
}

/** GET — admin-added globe pins (extras on top of the code catalogue). */
export async function GET() {
  const check = await requireAdminApi()
  if (check instanceof Response) return check

  try {
    const pins = await loadSpeakingPinsExtra()
    return NextResponse.json({ pins })
  } catch {
    return NextResponse.json({ error: 'Failed to load pins' }, { status: 500 })
  }
}

/** PUT — replace the extras list. Body: { pins: SpeakingPinStored[] } */
export async function PUT(request: Request) {
  const check = await requireAdminApi()
  if (check instanceof Response) return check

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const list = (body as { pins?: unknown })?.pins
  if (!Array.isArray(list)) {
    return NextResponse.json({ error: 'pins must be an array' }, { status: 422 })
  }

  const pins: SpeakingPinStored[] = []
  for (const item of list) {
    const result = validatePinStored((item ?? {}) as Partial<SpeakingPinStored>)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 422 })
    }
    pins.push(result.value)
  }

  const byId = new Map<string, SpeakingPinStored>()
  for (const p of pins) byId.set(p.id, p)

  try {
    const next = Array.from(byId.values())
    await savePins(next)
    return NextResponse.json({ pins: next })
  } catch {
    return NextResponse.json({ error: 'Failed to save pins' }, { status: 500 })
  }
}
