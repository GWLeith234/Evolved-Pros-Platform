import { describe, expect, it } from 'vitest'
import { canSubmitPost, type CanSubmitPostInput, type ComposerKind } from './composer'

/**
 * COMPOSER-1 / FINDING 04 — the submit gate.
 *
 * The guard that blocks POST while a media rejection stands is intentional:
 * without it a user whose image was rejected could publish text-only believing
 * the image went up. These specs pin BOTH halves — the guard holds while the
 * error stands, and clears once it is acknowledged.
 */

const BASE: CanSubmitPostInput = {
  body: '',
  activeKind: 'update',
  file: null,
  mediaError: null,
  validPollOptionCount: 0,
  isPosting: false,
}

function gate(over: Partial<CanSubmitPostInput> = {}): boolean {
  return canSubmitPost({ ...BASE, ...over })
}

/** Stand-in for a picked image. Only identity matters to the gate. */
const IMAGE = { name: 'shot.png', type: 'image/png', size: 1024 } as unknown as File

const REJECTION = 'That image is 10.6 MB. Images must be 10.0 MB or smaller.'

describe('canSubmitPost', () => {
  it('1. enables on body text alone', () => {
    expect(gate({ body: 'Shipped the thing today.' })).toBe(true)
  })

  it('2. blocks while a media rejection stands, even with valid body text', () => {
    expect(gate({ body: 'Shipped the thing today.', mediaError: REJECTION })).toBe(false)
  })

  it('3. enables once the rejection is dismissed — the FINDING 04 fix', () => {
    // Dismissing sets mediaError back to null; that is the whole exit.
    expect(gate({ body: 'Shipped the thing today.', mediaError: null })).toBe(true)
  })

  it('4. enables on a staged image with no body on the update tab', () => {
    expect(gate({ activeKind: 'update', file: IMAGE })).toBe(true)
  })

  it('5. blocks a staged image with no body on the poll tab', () => {
    expect(gate({ activeKind: 'poll', file: IMAGE, validPollOptionCount: 2 })).toBe(false)
  })

  it('6. blocks an empty composer', () => {
    expect(gate()).toBe(false)
  })

  it('7. blocks while a post is already in flight', () => {
    expect(gate({ body: 'Shipped it.', isPosting: true })).toBe(false)
  })

  it('8. blocks a poll with only one valid option', () => {
    expect(gate({ activeKind: 'poll', body: 'Which one?', validPollOptionCount: 1 })).toBe(false)
  })

  it('9. enables a poll with a question and two valid options', () => {
    expect(gate({ activeKind: 'poll', body: 'Which one?', validPollOptionCount: 2 })).toBe(true)
  })

  it("10. treats 'question' and 'win' exactly like 'update' for an image-only post", () => {
    for (const kind of ['question', 'win'] as ComposerKind[]) {
      expect(gate({ activeKind: kind, file: IMAGE })).toBe(true)
    }
  })

  it('11. blocks a whitespace-only body with no file', () => {
    expect(gate({ body: '   \n\t  ' })).toBe(false)
  })

  it('12. blocks a poll with two valid options but no question', () => {
    expect(gate({ activeKind: 'poll', body: '', file: null, validPollOptionCount: 2 })).toBe(false)
  })
})

describe('canSubmitPost — the guard cannot be bypassed', () => {
  it('stays blocked on a staged image while a rejection stands', () => {
    // A server-side rejection can arrive with a file still staged.
    expect(gate({ file: IMAGE, mediaError: REJECTION })).toBe(false)
  })

  it('is not cleared by typing — only by acknowledging the error', () => {
    const typing = ['S', 'Sh', 'Shipped', 'Shipped the thing today.']
    for (const body of typing) {
      expect(gate({ body, mediaError: REJECTION })).toBe(false)
    }
    expect(gate({ body: 'Shipped the thing today.', mediaError: null })).toBe(true)
  })

  it('is not cleared by switching tabs', () => {
    for (const kind of ['update', 'question', 'win', 'poll'] as ComposerKind[]) {
      expect(
        gate({ activeKind: kind, body: 'Shipped it.', validPollOptionCount: 2, mediaError: REJECTION }),
      ).toBe(false)
    }
  })
})
