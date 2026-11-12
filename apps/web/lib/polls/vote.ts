/**
 * A poll accepts votes only while it is active and its close time is still
 * in the future. A null closes_at stays open. The vote route and
 * increment_poll_vote() both use this rule.
 */
export function pollIsOpen(
  poll: { status: string | null; closes_at: string | null } | null,
  now: number,
): boolean {
  if (!poll || poll.status !== 'active') return false
  if (poll.closes_at == null) return true
  const closesAt = Date.parse(poll.closes_at)
  return !Number.isNaN(closesAt) && closesAt > now
}
