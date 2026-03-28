export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const ALLOWED_STRING_FIELDS = [
  'display_name', 'full_name', 'bio', 'role_title', 'location',
  'company', 'linkedin_url', 'website_url', 'twitter_handle', 'phone',
  'current_pillar', 'goal_90day',
] as const
type AllowedStringField = typeof ALLOWED_STRING_FIELDS[number]

const FIELD_MAX_LENGTHS: Record<AllowedStringField, number> = {
  display_name:   50,
  full_name:      100,
  bio:            300,
  role_title:     100,
  location:       100,
  company:        150,
  linkedin_url:   300,
  website_url:    300,
  twitter_handle: 50,
  phone:          30,
  current_pillar: 2,
  goal_90day:     500,
}

const VALID_PILLARS = new Set(['p1', 'p2', 'p3', 'p4', 'p5', 'p6'])

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('users')
    .select('id, email, display_name, full_name, avatar_url, bio, role_title, location, tier, tier_status, tier_expires_at, points, role, created_at, company, linkedin_url, website_url, twitter_handle, phone, phone_visible, current_pillar, goal_90day, goal_visible')
    .eq('id', user.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(data)
}

export async function PATCH(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const update: Record<string, unknown> = {}

  // String fields with length validation
  for (const key of ALLOWED_STRING_FIELDS) {
    if (key in body) {
      const val = body[key]
      if (val === null || val === '') {
        update[key] = null
        continue
      }
      if (typeof val !== 'string') continue
      const maxLen = FIELD_MAX_LENGTHS[key]
      if (val.length > maxLen) {
        return NextResponse.json(
          { error: `${key} exceeds maximum length of ${maxLen}` },
          { status: 422 }
        )
      }
      // Validate current_pillar enum
      if (key === 'current_pillar' && !VALID_PILLARS.has(val)) {
        return NextResponse.json({ error: 'Invalid current_pillar value' }, { status: 422 })
      }
      update[key] = val
    }
  }

  // avatar_url and banner_url allowed only from internal upload flow (validated separately)
  if ('avatar_url' in body && typeof body.avatar_url === 'string') {
    update.avatar_url = body.avatar_url
  }
  if ('banner_url' in body && (typeof body.banner_url === 'string' || body.banner_url === null)) {
    update.banner_url = body.banner_url
  }

  // Boolean fields
  if ('phone_visible' in body && typeof body.phone_visible === 'boolean') {
    update.phone_visible = body.phone_visible
  }
  if ('goal_visible' in body && typeof body.goal_visible === 'boolean') {
    update.goal_visible = body.goal_visible
  }

  // notification_preferences: JSONB object, validated shallowly
  if ('notification_preferences' in body && typeof body.notification_preferences === 'object' && body.notification_preferences !== null && !Array.isArray(body.notification_preferences)) {
    update.notification_preferences = body.notification_preferences
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields provided' }, { status: 422 })
  }

  const { data, error } = await supabase
    .from('users')
    .update(update)
    .eq('id', user.id)
    .select('id, email, display_name, full_name, avatar_url, bio, role_title, location, tier, tier_status, tier_expires_at, points, role, created_at, company, linkedin_url, website_url, twitter_handle, phone, phone_visible, current_pillar, goal_90day, goal_visible')
    .single()

  if (error || !data) return NextResponse.json({ error: 'Update failed' }, { status: 500 })

  return NextResponse.json(data)
}
