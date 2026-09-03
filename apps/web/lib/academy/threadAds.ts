import { ACADEMY_CARDS_PER_AD } from '@/lib/ads/rhythm'

/** After every N lesson cards, attach one ad to that card's id. */
export function assignThreadAds<T extends { id: string }, A>(
  cards: readonly T[],
  ads: readonly A[],
  every = ACADEMY_CARDS_PER_AD,
): Map<string, A> {
  const out = new Map<string, A>()
  const size = Math.max(1, every)
  let ai = 0
  cards.forEach((card, i) => {
    if ((i + 1) % size === 0 && ai < ads.length) {
      out.set(card.id, ads[ai] as A)
      ai += 1
    }
  })
  return out
}
