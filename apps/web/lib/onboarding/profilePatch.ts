export const PROFILE_STRING_LIMITS = {
  avatar_url: 2048,
  display_name: 50,
  company: 150,
  bio: 300,
  location: 100,
  role_title: 100,
} as const

type StringField = keyof typeof PROFILE_STRING_LIMITS

const FOCUS_PILLARS = new Set([1, 2, 3, 4, 5, 6])

type ProfileUpdate = Partial<Record<StringField, string | null> & { focus_pillar: number | null }>

export function profilePatchUpdate(body: unknown): { ok: true; update: ProfileUpdate } | { ok: false; error: string } {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Invalid JSON' }
  }

  const record = body as Record<string, unknown>
  const update: ProfileUpdate = {}

  for (const field of Object.keys(PROFILE_STRING_LIMITS) as StringField[]) {
    if (!(field in record)) continue
    const value = record[field]
    if (value === null) {
      update[field] = null
      continue
    }
    if (typeof value !== 'string') {
      return { ok: false, error: `${field} must be a string` }
    }
    const trimmed = value.trim()
    if (trimmed.length > PROFILE_STRING_LIMITS[field]) {
      return { ok: false, error: `${field} exceeds maximum length of ${PROFILE_STRING_LIMITS[field]}` }
    }
    if (field === 'avatar_url' && trimmed.length > 0 && !/^https?:\/\//i.test(trimmed)) {
      return { ok: false, error: 'avatar_url must be http(s)' }
    }
    update[field] = trimmed.length === 0 ? null : trimmed
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
