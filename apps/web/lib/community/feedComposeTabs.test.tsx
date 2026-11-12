import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { FeedCompose } from '@/components/community/FeedCompose'

const CHANNEL_ID = 'channel-1'

function composeHtml(isAdmin: boolean) {
  return renderToStaticMarkup(
    <FeedCompose
      channelId={CHANNEL_ID}
      currentUser={{
        id: '11111111-1111-4111-8111-111111111111',
        displayName: 'Member',
        avatarUrl: null,
        isAdmin,
      }}
      onPostCreated={() => {}}
    />,
  )
}

function tabLabels(html: string): string[] {
  return ['Update', 'Question', 'Win', 'Poll', 'Announce'].filter(label => html.includes(`>${label}<`) || html.includes(`>${label}`))
}

describe('FeedCompose post tabs', () => {
  it('hides the Poll tab from non-admins', () => {
    const html = composeHtml(false)
    expect(html).not.toContain('Poll')
    expect(html).not.toContain('Ask a poll question')
    expect(html).toContain('Update')
    expect(html).toContain('Question')
    expect(html).toContain('Win')
    expect(html).not.toContain('Announce')
    expect(tabLabels(html)).toEqual(['Update', 'Question', 'Win'])
  })

  it('shows the Poll tab to admins', () => {
    const html = composeHtml(true)
    expect(html).toContain('Poll')
    expect(html).toContain('Announce')
    expect(html).toContain('Update')
    expect(html).toContain('Question')
    expect(html).toContain('Win')
    expect(tabLabels(html)).toEqual(['Update', 'Question', 'Win', 'Poll', 'Announce'])
  })

  it('falls back from a saved Poll draft to Update and clears the poll draft', () => {
    const store = new Map<string, string>()
    const key = 'ep:draft:community:compose:channel-1'
    store.set(key, JSON.stringify({
      body: 'Which session should we run next?',
      selectedTag: null,
      activePostType: 'poll',
      pollOptions: ['Morning', 'Evening'],
      pollClosesAt: '2026-12-01',
    }))
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (name: string) => store.get(name) ?? null,
        setItem: (name: string, value: string) => { store.set(name, value) },
        removeItem: (name: string) => { store.delete(name) },
      },
    })
    try {
      const html = composeHtml(false)
      expect(html).not.toContain('Poll')
      expect(html).not.toContain('Morning')
      expect(html).not.toContain('Evening')
      const update = buttonHtml(html, 'Update')
      const question = buttonHtml(html, 'Question')
      expect(update).toContain('#1b3c5a')
      expect(question).not.toContain('#1b3c5a')
      const saved = JSON.parse(store.get(key) ?? '{}') as {
        body: string
        activePostType: string
        pollOptions: string[]
        pollClosesAt: string
      }
      expect(saved.activePostType).toBe('update')
      expect(saved.body).toBe('Which session should we run next?')
      expect(saved.pollOptions).toEqual(['', ''])
      expect(saved.pollClosesAt).toBe('')
      expect(JSON.stringify(saved)).not.toContain('Morning')
    } finally {
      vi.unstubAllGlobals()
    }
  })
})

function buttonHtml(html: string, label: string): string {
  const at = html.indexOf(`>${label}<`)
  expect(at).toBeGreaterThan(-1)
  const start = html.lastIndexOf('<button', at)
  return html.slice(start, html.indexOf('</button>', at))
}
