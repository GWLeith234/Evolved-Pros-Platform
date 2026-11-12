/**
 * Poll rows written by POST /api/posts.
 *
 * The handler inserts through the service-role client, which bypasses the
 * admin-only polls RLS. polls.context defaults to "media", and the public
 * sidebar serves the newest active media poll. A member post must not create
 * that row. Admins still publish a community poll, and the insert copies only
 * the columns below — never context, status, or created_by from the body.
 */

import { MEMBER_POLL_CONTEXT } from '@/lib/polls/memberPoll'

/** Columns on the polls insert. created_by is the session user, not the body. */
export const POST_POLL_INSERT_KEYS = ['question', 'context', 'created_by', 'status'] as const

export const POST_POLL_OPTION_KEYS = ['poll_id', 'option_text', 'display_order'] as const

export type PostPollInsert = {
  question: string
  context: typeof MEMBER_POLL_CONTEXT
  status: 'active'
}

export type PostPollOptionInsert = {
  poll_id: string
  option_text: string
  display_order: number
}

/** The polls row, minus created_by, which the route sets from the session. */
export function postPollInsert(question: string): PostPollInsert {
  return {
    question: question.slice(0, 500),
    context: MEMBER_POLL_CONTEXT,
    status: 'active',
  }
}

export function postPollOptionRows(pollId: string, options: string[]): PostPollOptionInsert[] {
  return options.map((text, idx) => ({
    poll_id: pollId,
    option_text: text.slice(0, 200),
    display_order: idx,
  }))
}

/**
 * A pollId on a post is accepted only when this caller created it and it
 * lives in the community context. Anything else, including a media poll, is
 * refused.
 */
export function acceptedCallerPoll(
  poll: { created_by?: string | null; context?: string | null } | null,
  callerId: string,
): boolean {
  if (!poll) return false
  return poll.created_by === callerId && poll.context === MEMBER_POLL_CONTEXT
}
