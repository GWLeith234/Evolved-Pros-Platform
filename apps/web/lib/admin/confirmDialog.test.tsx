import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ConfirmDialog } from '@/components/admin/safety/ConfirmDialog'
import { OwnerOnlyBadge } from '@/components/admin/safety/OwnerOnlyBadge'
import { CONFIRM } from '@/components/admin/safety/confirmCopy'

describe('ConfirmDialog (M1 shell)', () => {
  it('renders the question title, consequence, and Cancel left of Confirm', () => {
    const html = renderToStaticMarkup(
      <ConfirmDialog
        open
        title="Send broadcast?"
        consequence="This will deliver the message to all selected audience members immediately. This cannot be undone from admin."
        emphasis="all selected audience members"
        onCancel={() => {}}
        onConfirm={() => {}}
      />,
    )
    expect(html).toContain('data-testid="confirm-dialog"')
    expect(html).toContain('Confirm action')
    expect(html).toContain('Send broadcast?')
    expect(html).toContain('all selected audience members')
    expect(html).toContain('text-red')
    expect(html).toContain('Cancel')
    expect(html).toContain('Confirm')
    expect(html.indexOf('confirm-dialog-cancel')).toBeLessThan(html.indexOf('confirm-dialog-confirm'))
    expect(html).not.toContain('rounded')
    expect(html).not.toContain('shadow')
  })

  it('renders nothing when closed', () => {
    const html = renderToStaticMarkup(
      <ConfirmDialog
        open={false}
        title="Send broadcast?"
        consequence="Hidden"
        onCancel={() => {}}
        onConfirm={() => {}}
      />,
    )
    expect(html).toBe('')
  })
})

describe('OwnerOnlyBadge', () => {
  it('renders the navy owner-only marker', () => {
    const html = renderToStaticMarkup(<OwnerOnlyBadge />)
    expect(html).toContain('data-testid="owner-only-badge"')
    expect(html).toContain('Owner-only')
    expect(html).toContain('bg-navy')
  })
})

describe('CONFIRM copy', () => {
  it('uses verb + object questions and avoids em dashes', () => {
    const samples = [
      CONFIRM.inviteMember(),
      CONFIRM.sendBroadcast('all selected audience members'),
      CONFIRM.syncStripe(),
      CONFIRM.publishStory(),
      CONFIRM.deleteAd(),
      CONFIRM.cleanupQa(3),
    ]
    for (const s of samples) {
      expect(s.title.endsWith('?')).toBe(true)
      expect(s.title + s.consequence).not.toContain('\u2014')
      expect(s.title + s.consequence).not.toContain('\u2013')
    }
  })
})
