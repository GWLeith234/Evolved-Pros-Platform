import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const webRoot = resolve(__dirname, '../..')

/** Pre-band Home / scoreboard modules. Nothing in the app imports them. */
const ORPHAN_PATHS = [
  'components/home/WelcomeBanner.tsx',
  'components/home/AccountabilityHub.tsx',
  'components/home/PillarJourneyStrip.tsx',
  'components/home/HomeMetricsStrip.tsx',
  'components/home/TodaysEvolution.tsx',
  'components/home/ClimbingTowardCard.tsx',
  'components/home/InProgressPillarHero.tsx',
  'components/home/tiles/PodcastReelTile.tsx',
  'components/home/tiles/TopStoriesTile.tsx',
  'components/scoreboard/ScoreboardHero.tsx',
  'lib/scoreboard/fetchPillarProgress.ts',
]

describe('pre-band home orphans stay gone', () => {
  it('does not keep unmounted scoreboard and tile components', () => {
    for (const rel of ORPHAN_PATHS) {
      expect(existsSync(resolve(webRoot, rel)), rel).toBe(false)
    }
  })

  it('does not remount those components from the member Home page', () => {
    const page = readFileSync(resolve(webRoot, 'app/(member)/home/page.tsx'), 'utf8')
    expect(page).not.toMatch(
      /WelcomeBanner|AccountabilityHub|PillarJourneyStrip|HomeMetricsStrip|TodaysEvolution|ClimbingTowardCard|InProgressPillarHero|PodcastReelTile|TopStoriesTile|ScoreboardHero/,
    )
  })

  it('does not keep CSS that only those components used', () => {
    const css = readFileSync(resolve(webRoot, 'app/globals.css'), 'utf8')
    expect(css).not.toMatch(
      /welcome-banner-scoreboard|scoreboard-hero|home-4up-grid|pillarSparkle|hub-flash|hub-overview-grid/,
    )
  })
})
