/**
 * Composer submit gate (SPRINT COMPOSER-1, FINDING 04).
 *
 * Extracted from Composer.tsx so the rule is testable — vitest only collects
 * lib/**, so a derivation living inside a .tsx could never be covered. The
 * logic here is IDENTICAL to the expression it replaced; this is an
 * extraction, not a redesign.
 *
 * DEPENDENCY-FREE ON PURPOSE. Do not import from lib/podcast/public.ts,
 * lib/supabase/admin.ts, or anything that transitively reaches
 * @/lib/supabase/admin — that module builds its Supabase client at MODULE
 * SCOPE, so merely importing it throws "supabaseUrl is required" under test.
 */

/**
 * The four composer tabs. Declared here, not in Composer.tsx, so there is
 * exactly one identity for this union.
 *
 * NOT interchangeable with PostType in ./types.ts — that one also carries
 * 'announce', which the composer does not offer.
 */
export type ComposerKind = 'update' | 'question' | 'win' | 'poll'

export interface CanSubmitPostInput {
  body: string
  activeKind: ComposerKind
  file: File | null
  /** A standing rejection from the client check or the server. */
  mediaError: string | null
  validPollOptionCount: number
  isPosting: boolean
}

/**
 * Whether POST is enabled.
 *
 * The `!mediaError` term is deliberate and load-bearing: an image on its own is
 * a valid post on the non-poll tabs, so a standing media rejection must block
 * the submit rather than silently publishing text-only while the author
 * believes their image went up.
 *
 * Note the reject path sets `file` to null, so gating on "is a file staged"
 * instead would make that guard permanently false and reintroduce exactly the
 * silent text-only post it exists to prevent.
 *
 * The guard is cleared by the user acknowledging the error — dismissing it, or
 * picking a valid image — never by typing and never by switching tabs.
 */
export function canSubmitPost(input: CanSubmitPostInput): boolean {
  const { body, activeKind, file, mediaError, validPollOptionCount, isPosting } = input

  const pollReady = activeKind !== 'poll' || validPollOptionCount >= 2
  const hasContent = body.trim().length > 0 || (activeKind !== 'poll' && file !== null)

  return hasContent && pollReady && !isPosting && !mediaError
}
