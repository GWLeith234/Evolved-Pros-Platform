/**
 * Price ids that draw on a capped seat.
 *
 * Checkout sells the catalogue price when one exists and the env price
 * otherwise. The seat count has to include both, or a half-applied catalogue
 * (env price live, catalogue empty) sells The 99 with the cap reading zero.
 */

export function unionSeatPriceIds(
  catalogueIds: readonly string[],
  envIds: readonly string[],
): string[] {
  const ids = new Set<string>()
  for (const id of [...catalogueIds, ...envIds]) {
    const trimmed = id.trim()
    if (trimmed) ids.add(trimmed)
  }
  return [...ids]
}
