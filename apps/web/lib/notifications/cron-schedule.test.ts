import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const here = dirname(fileURLToPath(import.meta.url))
const workflow = readFileSync(
  resolve(here, '../../../../.github/workflows/cron.yml'),
  'utf8',
)
const railway = readFileSync(resolve(here, '../../../../railway.toml'), 'utf8')

describe('notification cron schedule lock', () => {
  it('wires #110 member-nudges after the 17:00 UTC evening cutoff', () => {
    expect(workflow).toContain("cron: '0 17 * * *'")
    expect(workflow).toContain('/api/cron/member-nudges')
    expect(workflow).toContain("github.event.schedule == '0 17 * * *'")
  })

  it('wires weekly goal-snapshots so WIG check-ins are not Home-open only', () => {
    expect(workflow).toContain("cron: '15 8 * * 1'")
    expect(workflow).toContain('/api/cron/goal-snapshots')
    expect(workflow).toContain("github.event.schedule == '15 8 * * 1'")
  })

  it('keeps morning expire/digest jobs off the evening and weekly ticks', () => {
    expect(workflow).toContain('/api/cron/expire-tiers')
    expect(workflow).toContain('/api/cron/daily-digest')
    const morningGate = "github.event.schedule == '0 8 * * *'"
    expect(workflow.split(morningGate).length).toBeGreaterThan(3)
    expect(railway).toMatch(/cronSchedule is intentionally unset/)
    expect(railway).not.toMatch(/^cronSchedule\s*=/m)
  })
})
