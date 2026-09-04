import {
  ACADEMY_CARDS_PER_AD,
  ACADEMY_DEEPER_EVERY,
  ACADEMY_TIGHTEN_AFTER,
} from '@/lib/ads/rhythm'

/** After every N lesson cards, attach one ad to that card's id.
 *  After the first screen the interval tightens so a long pillar stays dense. */
export function assignThreadAds<T extends { id: string }, A>(
  cards: readonly T[],
  ads: readonly A[],
  every = ACADEMY_CARDS_PER_AD,
  options?: { tightenAfter?: number; deeperEvery?: number },
): Map<string, A> {
  const out = new Map<string, A>()
  const start = Math.max(1, every)
  const tightenAfter = options?.tightenAfter ?? ACADEMY_TIGHTEN_AFTER
  const deeper = Math.max(1, options?.deeperEvery ?? ACADEMY_DEEPER_EVERY)
  let nextAt = start
  let step = start
  let ai = 0
  cards.forEach((card, i) => {
    const n = i + 1
    if (n === nextAt && ai < ads.length) {
      out.set(card.id, ads[ai] as A)
      ai += 1
      if (n >= tightenAfter) step = deeper
      nextAt += step
    }
  })
  return out
}
