/**
 * Caller-controlled columns for POST /api/polls.
 *
 * The composer always sends context "community". The public media sidebar
 * loads the newest active poll whose context is "media" (GET /api/polls/active
 * uses the service-role client). A signed-in member who posted
 * { context: "media", status: "active", created_by: "<someone else>" }
 * would otherwise replace that public poll. Media placement stays on the
 * admin poll editor. status and created_by are server-owned.
 */

export const MEMBER_POLL_CONTEXT = 'community' as const

/** Present on polls, and not safe to take from a member request body. */
export const POLL_DENIED_FIELDS = [
  'id',
  'created_by',
  'status',
  'show_results_before_vote',
  'created_at',
] as const

export type MemberPollWrite = {
  question: string
  options: string[]
  context: typeof MEMBER_POLL_CONTEXT
  closesAt: string | null
  status: 'active'
}

export type MemberPollResult =
  | { ok: true; poll: MemberPollWrite }
  | { ok: false; error: string; status: 422 }

export function memberPollWrite(body: Record<string, unknown>): MemberPollResult {
  const question = typeof body.question === 'string' ? body.question.trim() : ''
  const options = Array.isArray(body.options)
    ? body.options
        .filter((option): option is string => typeof option === 'string' && option.trim().length > 0)
        .map(option => option.trim())
    : []

  if (!question || question.length > 200) {
    return { ok: false, error: 'Question is required (max 200 chars)', status: 422 }
  }
  if (options.length < 2 || options.length > 6) {
    return { ok: false, error: '2-6 options required', status: 422 }
  }

  // A missing context is the composer default. Any other placement is rejected
  // so it cannot land on the public media sidebar.
  if (typeof body.context === 'string' && body.context.trim() !== '' && body.context !== MEMBER_POLL_CONTEXT) {
    return { ok: false, error: 'context must be community', status: 422 }
  }

  const closesAt = typeof body.closes_at === 'string' ? body.closes_at : null

  return {
    ok: true,
    poll: {
      question,
      options,
      context: MEMBER_POLL_CONTEXT,
      closesAt,
      status: 'active',
    },
  }
}
