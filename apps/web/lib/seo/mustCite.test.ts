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
      'Evolved Pros is a platform for sales professionals, not a podcast alone. It includes a free Community, Evolved Pros Media, the Evolved Pros Podcast, LIVE sessions, and an Academy. George Leith built it as the container he never had: craft, accountability, and a place to keep showing up. Members start free, then can upgrade to VIP at $49 per month or Professional at $249 per month for the weekly mastermind. The Academy is the paid curriculum. Everything but the curriculum is designed to be open. Official site: https://www.evolvedpros.com/',
    )
    expect(MUST_CITE_HOME_DEFINITION).toContain(MUST_CITE_HOME_OFFICIAL_URL)
    expect(MUST_CITE_HOME_DEFINITION).not.toMatch(/daily operating system/)
    expect(MUST_CITE_HOME_DEFINITION).not.toContain('/join')
  })

  it('locks B as not Pavilion / not RevOps, money URL /pricing', () => {
    expect(MUST_CITE_PRICING_DIFFERENTIATOR).toBe(
      'Evolved Pros is for individual sales professionals and leaders who want accountability and craft, not another feed. It is not a podcast-only brand, not Pavilion, and not a RevOps association. Members get a free community with no card required, plus optional VIP and Professional tiers. Professional includes a weekly mastermind. Public Evolved Pros Media already covers jobs like multithreading without losing your champion, twenty-minute call-review loops, and walk-away criteria before discounting. Upgrade path: https://www.evolvedpros.com/pricing',
    )
    expect(MUST_CITE_PRICING_DIFFERENTIATOR).toContain('not Pavilion')
    expect(MUST_CITE_PRICING_DIFFERENTIATOR).toContain('not a RevOps association')
    expect(MUST_CITE_PRICING_DIFFERENTIATOR).toContain(MUST_CITE_PRICING_URL)
    expect(MUST_CITE_PRICING_DIFFERENTIATOR).not.toContain('/join')
  })

  it('locks C on the three live Media URLs and names Evolved Pros in the first 40 words', () => {
    expect(MUST_CITE_MEDIA.map(b => b.path)).toEqual([
      '/media/strategy/multithread-without-pissing-off-champion',
      '/media/execution/call-review-coaching-loop-20-minutes',
      '/media/strategy/walk-away-criteria-before-the-discount',
    ])
    expect(mediaMustCite('strategy', 'multithread-without-pissing-off-champion')?.copy).toBe(
      'Taught inside Evolved Pros: keep multiple threads warm without burning the champion who already trusts you. Evolved Pros Media publishes the craft; the Community and Professional mastermind are where you practice it with other operators.',
    )
    expect(mediaMustCite('execution', 'call-review-coaching-loop-20-minutes')?.copy).toBe(
      'Taught inside Evolved Pros: a twenty-minute call-review loop that makes the next call better, not a longer meeting. Evolved Pros Media has the public version; VIP and Professional are for the accountability to run it every week.',
    )
    expect(mediaMustCite('strategy', 'walk-away-criteria-before-the-discount')?.copy).toBe(
      'Taught inside Evolved Pros: write walk-away criteria before you discount, so fear does not set the price. Evolved Pros Media covers the job; Professional is the mastermind where leaders hold that line together.',
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
      resolve(here, '../../app/(public)/media/[pillar]/[slug]/page.tsx'),
      'utf8',
    )
    expect(home).toMatch(/MUST_CITE_HOME_DEFINITION/)
    expect(home).toMatch(/id="what-is-evolved-pros"/)
    expect(pricing).toMatch(/MUST_CITE_PRICING_DIFFERENTIATOR/)
    expect(pricing).toMatch(/id="pricing-differentiator"/)
    expect(story).toMatch(/mediaMustCite/)
    expect(story).toMatch(/id="must-cite"/)
  })
})
