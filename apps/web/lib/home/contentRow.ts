import { HOME_CONTENT_CARDS } from '@/lib/ads/rhythm'

/** Cap a home editorial row at two cards. The third slot is an IAB, not another story. */
export function takeHomeContentRow<T>(items: readonly T[], max = HOME_CONTENT_CARDS): T[] {
  return items.slice(0, Math.max(0, max))
}
