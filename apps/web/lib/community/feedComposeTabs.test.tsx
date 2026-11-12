import { describe, expect, it } from 'vitest'
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
})
