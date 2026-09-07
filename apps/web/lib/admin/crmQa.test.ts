import { describe, expect, it } from 'vitest'
import { isQaTestProspect } from './crmQa'

describe('isQaTestProspect', () => {
  it('flags QA-SWEEP and qaNNNN names from the hygiene mock', () => {
    expect(isQaTestProspect({ full_name: 'QA-SWEEP Lead', email: 'lead@example.com' })).toBe(true)
    expect(isQaTestProspect({ full_name: 'qa0905 Member', email: 'qa0905@test.dev' })).toBe(true)
  })

  it('flags qa tags and qa- prefixed emails', () => {
    expect(isQaTestProspect({ full_name: 'Pat Lee', email: 'pat@co.com', tags: ['qa'] })).toBe(true)
    expect(isQaTestProspect({ full_name: 'Pat Lee', email: 'qa-bot@co.com' })).toBe(true)
    expect(isQaTestProspect({ full_name: 'Pat Lee', email: 'pat+qa@co.com' })).toBe(true)
    expect(isQaTestProspect({ full_name: 'Pat Lee', email: 'pat@co.com', source: 'qa-sweep' })).toBe(true)
  })

  it('does not flag live-looking names or Quality / Qatar', () => {
    expect(isQaTestProspect({ full_name: 'Jane Smith', email: 'jane@company.com' })).toBe(false)
    expect(isQaTestProspect({ full_name: 'Quality Lead', email: 'quality@firm.com' })).toBe(false)
    expect(isQaTestProspect({ full_name: 'Qatar Sales', email: 'sales@qatar.example' })).toBe(false)
  })
})
