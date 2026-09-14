import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Composer } from '@/components/community/Composer'
import { CommunityPollCard } from '@/components/community/CommunityPollCard'
import { FilterRail } from '@/components/community/FilterRail'
import { COMPOSER_TYPES } from '@/lib/community/composer'

const COMPOSER_USER = {
  displayName: 'George Leith',
  initials: 'GL',
  avatarUrl: null,
  tier: 'pro',
}

describe('community Post CTA + type sheet', () => {
  it('ships one Post CTA on first paint, not equal type tabs', () => {
    const html = renderToStaticMarkup(
      <Composer currentUser={COMPOSER_USER} channelId="channel-1" />,
    )
    expect(html).toContain('>Post<')
    expect(html).toContain('Start a post')
    expect(html).not.toContain('role="tablist"')
    expect(html).not.toContain('role="tab"')
    expect(html).not.toContain('What are you posting?')
    expect(html).not.toMatch(/\u2014|\u2013/)
  })

  it('places Update, Question, Win, and Poll on the type sheet after Post', () => {
    const html = renderToStaticMarkup(
      <Composer currentUser={COMPOSER_USER} channelId="channel-1" initialPhase="sheet" />,
    )
    expect(html).toContain('What are you posting?')
    expect(html).toContain('role="dialog"')
    for (const type of COMPOSER_TYPES) {
      expect(html).toContain(`>${type.label}<`)
    }
    expect(html).not.toContain('role="tablist"')
    expect(html).not.toMatch(/\u2014|\u2013/)
  })

  it('opens the compose fields after a type is chosen', () => {
    const html = renderToStaticMarkup(
      <Composer
        currentUser={COMPOSER_USER}
        channelId="channel-1"
        initialPhase="compose"
        initialKind="win"
      />,
    )
    expect(html).toContain('Tag Pillar')
    expect(html).toContain('Change type')
    expect(html).toContain('Share a win, big or small...')
    expect(html).not.toContain('role="tablist"')
  })
})

describe('community Polls empty', () => {
  it('keeps one Polls empty on the feed, not on the rail card', () => {
    const rail = renderToStaticMarkup(<CommunityPollCard />)
    expect(rail).toBe('')
    expect(rail).not.toContain('Next poll drops soon')

    const root = resolve(__dirname, '../..')
    const pollCard = readFileSync(resolve(root, 'components/community/CommunityPollCard.tsx'), 'utf8')
    const page = readFileSync(resolve(root, 'components/community/UnifiedCommunityPage.tsx'), 'utf8')
    expect(pollCard).not.toContain('Next poll drops soon')
    expect(pollCard).toContain('if (!loading && !poll) return null')
    expect(page).toContain("'No polls yet.'")
    expect(page).toContain('No posts yet. Be the first to share.')
    expect(page).not.toContain('Next poll drops soon')
    expect(page).not.toContain('No posts yet — be the first to share.')
  })

  it('adds Polls as a show-me filter, not a second Post type row', () => {
    const html = renderToStaticMarkup(
      <FilterRail
        activeKind="poll"
        activePillars={[]}
        sortBy="newest"
        onChangeKind={() => {}}
        onChangePillars={() => {}}
        onChangeSort={() => {}}
      />,
    )
    expect(html).toContain('>Polls<')
    expect(html).toContain('>All<')
    expect(html).toContain('Show:')
    expect(html).not.toContain('What are you posting?')
  })
})
