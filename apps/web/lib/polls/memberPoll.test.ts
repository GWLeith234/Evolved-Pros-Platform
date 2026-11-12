import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { MEMBER_POLL_CONTEXT, POLL_DENIED_FIELDS, memberPollWrite } from './memberPoll'

const here = dirname(fileURLToPath(import.meta.url))
const route = readFileSync(resolve(here, '../../app/api/polls/route.ts'), 'utf8')

const OTHER = '22222222-2222-4222-8222-222222222222'

describe('memberPollWrite', () => {
  it('keeps a community poll and ignores privileged columns', () => {
    const result = memberPollWrite({
      question: '  What are you working on this week?  ',
      options: [' Pipeline ', '', 'Hiring', 12, '  '],
      context: 'community',
      closes_at: '2026-12-01T00:00:00.000Z',
      status: 'closed',
      created_by: OTHER,
      id: OTHER,
      show_results_before_vote: true,
      created_at: '1999-01-01T00:00:00.000Z',
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.poll).toEqual({
      question: 'What are you working on this week?',
      options: ['Pipeline', 'Hiring'],
      context: MEMBER_POLL_CONTEXT,
      closesAt: '2026-12-01T00:00:00.000Z',
      status: 'active',
    })
    expect(result.poll.status).toBe('active')
    expect(result.poll).not.toHaveProperty('created_by')
    expect(result.poll).not.toHaveProperty('id')
    expect(result.poll).not.toHaveProperty('show_results_before_vote')
    expect(result.poll).not.toHaveProperty('created_at')
    expect(POLL_DENIED_FIELDS).toEqual([
      'id',
      'created_by',
      'status',
      'show_results_before_vote',
      'created_at',
    ])
  })

  it('defaults a missing context to community', () => {
    const result = memberPollWrite({
      question: 'Which pillar is next?',
      options: ['Foundation', 'Identity'],
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.poll.context).toBe('community')
    expect(result.poll.status).toBe('active')
    expect(result.poll.closesAt).toBeNull()
  })

  it('rejects a media (or any other) context instead of publishing it', () => {
    const media = memberPollWrite({
      question: 'Public poll',
      options: ['Yes', 'No'],
      context: 'media',
      status: 'active',
    })
    expect(media).toEqual({ ok: false, error: 'context must be community', status: 422 })

    const other = memberPollWrite({
      question: 'Public poll',
      options: ['Yes', 'No'],
      context: 'admin',
    })
    expect(other.ok).toBe(false)
  })

  it('still rejects an empty question or the wrong number of options', () => {
    expect(memberPollWrite({ question: '  ', options: ['A', 'B'] }).ok).toBe(false)
    expect(memberPollWrite({ question: 'Q', options: ['Only one'] })).toMatchObject({ status: 422 })
    expect(memberPollWrite({
      question: 'Q',
      options: ['1', '2', '3', '4', '5', '6', '7'],
    }).ok).toBe(false)
  })
})

describe('POST /api/polls', () => {
  it('writes the allowlisted row and does not copy context or status off the body', () => {
    expect(route).toContain('memberPollWrite(body)')
    expect(route).toContain('context: poll.context')
    expect(route).toContain("status: poll.status")
    expect(route).toContain('created_by: user.id')
    expect(route).not.toContain('body.context')
    expect(route).not.toContain('body.status')
    expect(route).not.toContain('.insert(body')
  })
})
