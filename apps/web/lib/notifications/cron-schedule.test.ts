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

  it('checks published media heroes every 30 minutes, off the :00 and :30 marks', () => {
    expect(workflow).toContain("cron: '1,31 * * * *'")
    expect(workflow).not.toContain("cron: '*/30 * * * *'")
    expect(workflow).toContain('/api/cron/media-image-check')
    expect(workflow).toContain("github.event.schedule == '1,31 * * * *'")
    expect(workflow).toContain("github.event.inputs.job == 'media-image-check'")
    expect(workflow).toContain('"$APP_URL/api/cron/media-image-check"')
    expect(workflow).not.toContain('curl -sf "$APP_URL/api/cron/media-image-check"')
  })

  it('fails the step when a cron response is not 2xx', () => {
    expect(workflow).toContain('set -euo pipefail')
    expect(workflow).toContain('bash --noprofile --norc -euo pipefail {0}')
    expect(workflow).not.toContain('curl -sf')
    expect(workflow).not.toMatch(/\|\s*jq\b/)
    const endpoints = [
      'expire-tiers',
      'renewal-reminders',
      'event-reminders',
      'daily-digest',
      'thanks-nudges',
      'member-nudges',
      'goal-snapshots',
      'media-image-check',
    ]
    expect(workflow.match(/-w '%\{http_code\}'/g)).toHaveLength(endpoints.length)
    expect(workflow.match(/jq \. body\.json/g)).toHaveLength(endpoints.length)
    for (const endpoint of endpoints) {
      expect(workflow).toContain(`"$APP_URL/api/cron/${endpoint}"`)
      expect(workflow).toContain(`HTTP \${status} from /api/cron/${endpoint}`)
    }
  })

  it('queues thank-you Community nudges on the morning tick and never names a send job', () => {
    expect(workflow).toContain('/api/cron/thanks-nudges')
    expect(workflow).toContain("github.event.inputs.job == 'thanks-nudges'")
    expect(workflow).toContain('never send')
    expect(workflow).not.toContain('/api/cron/thanks-send')
  })
})
