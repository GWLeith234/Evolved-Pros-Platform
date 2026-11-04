/**
 * Alumni is a program credential, not a side effect of one pillar.
 *
 * POST /api/capstones inserts through the service role. A single published
 * pillar — including Execution, which is pillar 6 — must not stamp
 * program_completed_at or award the alumni badge. The member has finished
 * the program only when a submitted capstone exists for every pillar.
 */

export const PROGRAM_PILLAR_NUMBERS = [1, 2, 3, 4, 5, 6] as const

export function capstoneCoversProgram(pillarNumbers: readonly number[]): boolean {
  const have = new Set(pillarNumbers)
  return PROGRAM_PILLAR_NUMBERS.every(pillar => have.has(pillar))
}
