import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(__dirname, '../..')

function src(rel: string) {
  return readFileSync(resolve(root, rel), 'utf8')
}

describe('ASK-ALWAYS send lock', () => {
  it('batch and send APIs refuse work without explicit YES', () => {
    const batch = src('app/api/admin/thanks/batch/route.ts')
    const send = src('app/api/admin/thanks/send/route.ts')
    expect(batch).toContain('explicitYes(body.confirm)')
    expect(send).toContain('explicitYes(body.confirm)')
    expect(batch).toContain('Nothing was created or sent')
    expect(send).toContain('Nothing was sent')
    expect(batch).toContain("eq('code', THANKS_PROMO_CODE)")
    expect(batch).toContain("code.code === 'FRIENDSOFGEORGE'")
    expect(batch).not.toMatch(/eq\('code',\s*'FRIENDSOFGEORGE'\)/)
  })

  it('cron sweep imports enqueue only and never the Resend sender', () => {
    const cron = src('app/api/cron/thanks-nudges/route.ts')
    expect(cron).toContain('enqueueDueThanksNudges')
    expect(cron).toContain('autoSend: false')
    expect(cron).toContain('sent: 0')
    expect(cron).not.toContain('sendCommunityThanksEmail')
    expect(cron).not.toContain('resend.emails.send')
  })

  it('queue-without-send parks D0 as pending_approval', () => {
    const batch = src('app/api/admin/thanks/batch/route.ts')
    expect(batch).toContain("status: 'pending_approval'")
    expect(batch).toContain('sendD0')
  })
})
