import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(__dirname, '../..')

function read(rel: string): string {
  return readFileSync(resolve(root, rel), 'utf8')
}

describe('LIVE booking inquire lock', () => {
  it('does not use mailto for Inquire about booking CTAs', () => {
    const files = [
      'components/live/LiveSplitHero.tsx',
      'components/live/LiveUpcomingDates.tsx',
      'components/live/LiveFinalCTA.tsx',
      'components/live/LiveBookingInquiry.tsx',
      'components/live/InquireBookingButton.tsx',
      'components/live/BookingInquiryForm.tsx',
    ]
    for (const file of files) {
      const src = read(file)
      expect(src, file).not.toContain('mailto:george@evolvex360.com')
      expect(src, file).not.toMatch(/mailto:[^\s"']+Keynote/)
    }
  })

  it('posts the locked five-field intake to the existing speaking inquiry route', () => {
    const form = read('components/live/BookingInquiryForm.tsx')
    expect(form).toContain('/api/speaking/inquiry')
    expect(form).toContain('Name *')
    expect(form).toContain('Email *')
    expect(form).toContain('Date of event')
    expect(form).toContain('htmlFor={`${idPrefix}-sms`}>SMS')
    expect(form).toContain('Company')
    expect(form).not.toContain('—')
    expect(form).toContain('Inquiry received')
  })

  it('keeps the $49 / $249 ladder out of the LIVE inquire flow', () => {
    const form = read('components/live/BookingInquiryForm.tsx')
    expect(form).not.toContain('$49')
    expect(form).not.toContain('$249')
  })
})
