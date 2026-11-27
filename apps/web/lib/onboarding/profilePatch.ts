export const PROFILE_STRING_LIMITS = {
  avatar_url: 2048,
  display_name: 50,
  company: 150,
  bio: 300,
  location: 100,
  role_title: 100,
} as const

/** Writable string columns on PATCH /api/user/me. Shared limits stay in PROFILE_STRING_LIMITS. */
export const USER_ME_STRING_LIMITS = {
  avatar_url: PROFILE_STRING_LIMITS.avatar_url,
  banner_url: PROFILE_STRING_LIMITS.avatar_url,
  display_name: PROFILE_STRING_LIMITS.display_name,
  full_name: 100,
  bio: PROFILE_STRING_LIMITS.bio,
  role_title: PROFILE_STRING_LIMITS.role_title,
  location: PROFILE_STRING_LIMITS.location,
  company: PROFILE_STRING_LIMITS.company,
  linkedin_url: 300,
  website_url: 300,
  twitter_handle: 50,
  phone: 30,
  current_pillar: 2,
  goal_90day: 500,
} as const

const HTTP_URL_FIELDS = new Set<keyof typeof USER_ME_STRING_LIMITS>([
  'avatar_url',
  'banner_url',
  'linkedin_url',
  'website_url',
])

export type ProfileLinkField = 'linkedin_url' | 'website_url'

const CURRENT_PILLARS = new Set(['p1', 'p2', 'p3', 'p4', 'p5', 'p6'])

const FOCUS_PILLARS = new Set([1, 2, 3, 4, 5, 6])

const NOTIFICATION_VALUES: Record<string, readonly string[]> = {
  community_reply: ['immediate', 'digest', 'off'],
  community_mention: ['immediate', 'digest', 'off'],
  event_reminder: ['immediate', 'off'],
  course_unlock: ['immediate', 'off'],
  system_billing: ['immediate'],
}

type StringField = keyof typeof PROFILE_STRING_LIMITS
type UserMeStringField = keyof typeof USER_ME_STRING_LIMITS

type ProfileUpdate = Partial<Record<StringField, string | null> & { focus_pillar: number | null }>

export type UserMeUpdate = Partial<Record<UserMeStringField, string | null>> & {
  phone_visible?: boolean
  goal_visible?: boolean
  notification_preferences?: Record<string, string>
}

const UNSAFE_PROFILE_URL = /[\u0000-\u001F\u007F\s"'`()<>\\`]/

/**
 * http(s) only, and safe to put in an img src or a CSS url().
 * Rejects javascript:, data:, protocol-relative hosts, credentials,
 * and characters that break out of those contexts.
 */
export function isProfileHttpUrl(value: string): boolean {
  if (!/^https?:\/\//i.test(value)) return false
  if (UNSAFE_PROFILE_URL.test(value)) return false
  try {
    const url = new URL(value)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
    if (url.username || url.password || !url.hostname) return false
    return true
  } catch {
    return false
  }
}

export function readProfileImageUrl(
  value: unknown,
): { ok: true; url: string } | { ok: false; error: string } {
  const url = typeof value === 'string' ? value.trim() : ''
  if (!url) return { ok: false, error: 'url is required' }
  if (url.length > PROFILE_STRING_LIMITS.avatar_url) return { ok: false, error: 'url too long' }
  if (!isProfileHttpUrl(url)) return { ok: false, error: 'url must be http(s)' }
  return { ok: true, url }
}

/** JSON object body. Invalid JSON, null, and non-objects share one client error. */
export async function readJsonObject(
  request: Request,
): Promise<{ ok: true; body: Record<string, unknown> } | { ok: false; error: string }> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return { ok: false, error: 'Invalid JSON' }
  }
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Invalid JSON' }
  }
  return { ok: true, body: body as Record<string, unknown> }
}

function readOptionalString(
  record: Record<string, unknown>,
  field: string,
  max: number,
  http: boolean,
): { ok: true; present: false } | { ok: true; present: true; value: string | null } | { ok: false; error: string } {
  if (!(field in record)) return { ok: true, present: false }
  const value = record[field]
  if (value === null) return { ok: true, present: true, value: null }
  if (typeof value !== 'string') {
    return { ok: false, error: `${field} must be a string` }
  }
  const trimmed = value.trim()
  if (trimmed.length > max) {
    return { ok: false, error: `${field} exceeds maximum length of ${max}` }
  }
  if (http && trimmed.length > 0 && !isProfileHttpUrl(trimmed)) {
    return { ok: false, error: `${field} must be http(s)` }
  }
  return { ok: true, present: true, value: trimmed.length === 0 ? null : trimmed }
}

export function readProfileLinkUrl(
  field: ProfileLinkField,
  value: unknown,
): { ok: true; value: string | null } | { ok: false; error: string } {
  const read = readOptionalString(
    { [field]: value },
    field,
    USER_ME_STRING_LIMITS[field],
    true,
  )
  if (!read.ok) return read
  return { ok: true, value: read.present ? read.value : null }
}

export function profilePatchUpdate(body: unknown): { ok: true; update: ProfileUpdate } | { ok: false; error: string } {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Invalid JSON' }
  }

  const record = body as Record<string, unknown>
  const update: ProfileUpdate = {}

  for (const field of Object.keys(PROFILE_STRING_LIMITS) as StringField[]) {
    const read = readOptionalString(record, field, PROFILE_STRING_LIMITS[field], field === 'avatar_url')
    if (!read.ok) return read
    if (read.present) update[field] = read.value
  }

  if ('focus_pillar' in record) {
    const value = record.focus_pillar
    if (value === null) {
      update.focus_pillar = null
    } else if (typeof value !== 'number' || !Number.isInteger(value) || !FOCUS_PILLARS.has(value)) {
      return { ok: false, error: 'focus_pillar must be an integer from 1 to 6' }
    } else {
      update.focus_pillar = value
    }
  }

  return { ok: true, update }
}

function readNotificationPreferences(
  value: unknown,
): { ok: true; value: Record<string, string> } | { ok: false; error: string } {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, error: 'notification_preferences must be an object' }
  }
  const record = value as Record<string, unknown>
  const update: Record<string, string> = {}
  for (const [key, allowed] of Object.entries(NOTIFICATION_VALUES)) {
    if (!(key in record)) continue
    const item = record[key]
    if (typeof item !== 'string' || !allowed.includes(item)) {
      return { ok: false, error: `notification_preferences.${key} is invalid` }
    }
    update[key] = item
  }
  if (Object.keys(update).length === 0) {
    return { ok: false, error: 'notification_preferences has no valid fields' }
  }
  return { ok: true, value: update }
}

export function userMePatchUpdate(body: unknown): { ok: true; update: UserMeUpdate } | { ok: false; error: string } {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Invalid JSON' }
  }

  const record = body as Record<string, unknown>
  const update: UserMeUpdate = {}

  for (const field of Object.keys(USER_ME_STRING_LIMITS) as UserMeStringField[]) {
    const read = readOptionalString(
      record,
      field,
      USER_ME_STRING_LIMITS[field],
      HTTP_URL_FIELDS.has(field),
    )
    if (!read.ok) return read
    if (!read.present) continue
    if (field === 'current_pillar' && read.value !== null && !CURRENT_PILLARS.has(read.value)) {
      return { ok: false, error: 'Invalid current_pillar value' }
    }
    update[field] = read.value
  }

  for (const field of ['phone_visible', 'goal_visible'] as const) {
    if (!(field in record)) continue
    if (typeof record[field] !== 'boolean') {
      return { ok: false, error: `${field} must be a boolean` }
    }
    update[field] = record[field]
  }

  if ('notification_preferences' in record) {
    const prefs = readNotificationPreferences(record.notification_preferences)
    if (!prefs.ok) return prefs
    update.notification_preferences = prefs.value
  }

  return { ok: true, update }
}
