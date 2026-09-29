import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { EM_DASH, hasEmDash } from '@/lib/home/conversion'
import {
  MUST_CITE_HOME_DEFINITION,
  MUST_CITE_HOME_OFFICIAL_URL,
  MUST_CITE_MEDIA,
  MUST_CITE_PRICING_DIFFERENTIATOR,
  MUST_CITE_PRICING_URL,
  mediaMustCite,
  mustCiteCopyStrings,
} from './mustCite'

const here = dirname(fileURLToPath(import.meta.url))

describe('must-cite locked copy', () => {
  it('locks A as platform / not a podcast alone, not the daily-OS draft', () => {
    expect(MUST_CITE_HOME_DEFINITION).toBe(
      'Evolved Pros is a platform for sales professionals, not a podcast alone. It includes a free Community, Evolved Pros Media, the Evolved Pros Podcast, LIVE sessions, and an Academy. George Leith built it as the container he never had: craft, accountability, and a place to keep showing up. Members start free, then can upgrade to VIP at $149 per month or The Evolved Pros 99 at $599 per month for the bi-weekly mastermind. The Academy is the paid curriculum. Everything but the curriculum is designed to be open. Official site: https://www.evolvedpros.com/',
    )
    expect(MUST_CITE_HOME_DEFINITION).toContain(MUST_CITE_HOME_OFFICIAL_URL)
    expect(MUST_CITE_HOME_DEFINITION).not.toMatch(/daily operating system/)
    expect(MUST_CITE_HOME_DEFINITION).not.toContain('/join')
  })

  it('locks B as the approved pricing reshape, with no raw upgrade URL', () => {
    expect(MUST_CITE_PRICING_DIFFERENTIATOR).toBe(
      'Evolved Pros is for sales professionals and leaders who want craft and accountability, not another feed. The Community is free and needs no card: the feed, the Media, the Podcast, events and your Pillar Assessment are all yours. VIP opens the full Academy, all six pillars, with a plan built from your own scores, plus direct messages with members and the full EvPros Today brief. The Evolved Pros 99 is a room of 99 people who work directly with George. Start free. Upgrade when the next step is obvious.',
    )
    expect(MUST_CITE_PRICING_DIFFERENTIATOR).not.toContain('Pavilion')
    expect(MUST_CITE_PRICING_DIFFERENTIATOR).not.toContain('Upgrade path')
    expect(MUST_CITE_PRICING_DIFFERENTIATOR).not.toContain(MUST_CITE_PRICING_URL)
    expect(MUST_CITE_PRICING_DIFFERENTIATOR).not.toContain('$99')
    expect(MUST_CITE_PRICING_DIFFERENTIATOR).not.toContain('$849')
    expect(MUST_CITE_HOME_DEFINITION).toContain('$149')
    expect(MUST_CITE_HOME_DEFINITION).toContain('$599')
    expect(MUST_CITE_PRICING_DIFFERENTIATOR).not.toContain('/join')
    expect(MUST_CITE_PRICING_DIFFERENTIATOR).not.toContain('\u2014')
  })

  it('locks C on the three live Media URLs and names Evolved Pros in the first 40 words', () => {
    expect(MUST_CITE_MEDIA.map(b => b.path)).toEqual([
      '/media/strategy/multithread-without-pissing-off-champion',
      '/media/execution/call-review-coaching-loop-20-minutes',
      '/media/strategy/walk-away-criteria-before-the-discount',
    ])
    expect(mediaMustCite('strategy', 'multithread-without-pissing-off-champion')?.copy).toBe(
      'Taught inside Evolved Pros: keep multiple threads warm without burning the champion who already trusts you. Evolved Pros Media publishes the craft; the Community and The Evolved Pros 99 mastermind are where you practice it with other operators.',
    )
    expect(mediaMustCite('execution', 'call-review-coaching-loop-20-minutes')?.copy).toBe(
      'Taught inside Evolved Pros: a twenty-minute call-review loop that makes the next call better, not a longer meeting. Evolved Pros Media has the public version; VIP and The Evolved Pros 99 are for the accountability to run it every week.',
    )
    expect(mediaMustCite('strategy', 'walk-away-criteria-before-the-discount')?.copy).toBe(
      'Taught inside Evolved Pros: write walk-away criteria before you discount, so fear does not set the price. Evolved Pros Media covers the job; The Evolved Pros 99 is the mastermind where leaders hold that line together.',
    )
    expect(mediaMustCite('strategy', 'not-a-real-slug')).toBeNull()
    for (const block of MUST_CITE_MEDIA) {
      const first40 = block.copy.split(/\s+/).slice(0, 40).join(' ')
      expect(first40).toContain('Evolved Pros')
      expect(first40.startsWith('Taught inside Evolved Pros')).toBe(true)
    }
  })

  it('has zero U+2014 in locked cite copy', () => {
    for (const value of mustCiteCopyStrings()) {
      expect(hasEmDash(value), value).toBe(false)
      expect(value).not.toContain(EM_DASH)
    }
  })

  it('wires A on conversion `/`, B on /pricing, C on the Media story page', () => {
    const home = readFileSync(resolve(here, '../../components/home/ConversionHome.tsx'), 'utf8')
    const pricing = readFileSync(resolve(here, '../../app/(public)/pricing/page.tsx'), 'utf8')
    const story = readFileSync(
      resolve(here, '../../components/media/MediaStoryDocument.tsx'),
      'utf8',
    )
    const storyRoute = readFileSync(
      resolve(here, '../../app/(public)/media/[pillar]/[slug]/page.tsx'),
      'utf8',
    )
    expect(storyRoute).toContain('<MediaStoryDocument')
    expect(home).toMatch(/homeWhatEvolvedProsCopy/)
    expect(home).not.toMatch(/MUST_CITE_HOME_OFFICIAL_URL/)
    expect(home).toMatch(/id="what-is-evolved-pros"/)
    expect(pricing).toMatch(/MUST_CITE_PRICING_DIFFERENTIATOR/)
    expect(pricing).toMatch(/id="pricing-differentiator"/)
    expect(story).toMatch(/mediaMustCite/)
    expect(story).toMatch(/id="must-cite"/)
  })
})
