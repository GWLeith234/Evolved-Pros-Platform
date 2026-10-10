import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const here = dirname(fileURLToPath(import.meta.url))
const upcoming = readFileSync(
  resolve(here, '../../components/live/LiveUpcomingDates.tsx'),
  'utf8',
)

describe('/live upcoming block', () => {
  it('returns nothing when there are zero upcoming dates', () => {
    expect(upcoming).toContain('if (!showUpcomingSpeakingBlock(dates.length)) return null')
    expect(upcoming).not.toContain('No confirmed stage dates listed yet')
  })
})
