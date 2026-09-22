import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { unionSeatPriceIds } from './seatPriceIds'

const seats = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), 'seats.ts'),
  'utf8',
)

describe('seat price ids', () => {
  it('unions catalogue and env prices and drops blanks', () => {
    expect(unionSeatPriceIds(['price_old', ''], ['price_env', 'price_old', '  '])).toEqual([
      'price_old',
      'price_env',
    ])
    expect(unionSeatPriceIds([], [])).toEqual([])
  })

  it('counts env prices and fails closed when a capped product has none', () => {
    expect(seats).toContain('unionSeatPriceIds')
    expect(seats).toContain('envPriceIdsForTier')
    expect(seats).toContain('unknownSeats(product.seat_cap)')
  })
})
