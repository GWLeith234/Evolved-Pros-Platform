import { describe, expect, it } from 'vitest'
import {
  FEED_AD_EVERY,
  hasAdjacentAds,
  interleaveAds,
  layoutArticleBody,
  splitHtmlBlocks,
} from './rhythm'

describe('interleaveAds', () => {
  it('inserts one ad between content groups and never adjacent ads', () => {
    const chunks = interleaveAds(['a', 'b', 'c', 'd', 'e', 'f'], ['ad1', 'ad2'], 3)
    expect(chunks.map(c => c.kind)).toEqual(['content', 'ad', 'content'])
    expect(hasAdjacentAds(chunks)).toBe(false)
    expect(chunks[0]).toEqual({ kind: 'content', items: ['a', 'b', 'c'] })
    expect(chunks[1]).toEqual({ kind: 'ad', ad: 'ad1' })
    expect(chunks[2]).toEqual({ kind: 'content', items: ['d', 'e', 'f'] })
  })

  it('does not dump leftover ads after the last story group', () => {
    const chunks = interleaveAds(['a', 'b', 'c'], ['ad1', 'ad2', 'ad3'], 3)
    expect(chunks).toEqual([{ kind: 'content', items: ['a', 'b', 'c'] }])
  })

  it('allows a single trailing unit when asked — still not a pair', () => {
    const chunks = interleaveAds(['a', 'b', 'c'], ['ad1', 'ad2'], 3, { trailing: true })
    expect(chunks.map(c => c.kind)).toEqual(['content', 'ad'])
    expect(hasAdjacentAds(chunks)).toBe(false)
  })

  it('returns content only when there are no ads', () => {
    const chunks = interleaveAds(['a', 'b'], [], 3)
    expect(chunks).toEqual([{ kind: 'content', items: ['a', 'b'] }])
  })

  it('defaults to two magazine rows so an ad is not punctuation on every row', () => {
    expect(FEED_AD_EVERY).toBe(6)
    const items = Array.from({ length: 9 }, (_, i) => `s${i}`)
    const chunks = interleaveAds(items, ['ad1', 'ad2'])
    expect(chunks.filter(c => c.kind === 'ad')).toHaveLength(1)
    expect(chunks[0]?.kind === 'content' && chunks[0].items).toHaveLength(6)
  })
})

describe('layoutArticleBody', () => {
  it('inserts after a few paragraphs, not as a stack', () => {
    const blocks = ['<p>1</p>', '<p>2</p>', '<p>3</p>', '<p>4</p>', '<p>5</p>']
    const chunks = layoutArticleBody(blocks, ['ad1', 'ad2'], [3, 8])
    expect(chunks.map(c => c.kind)).toEqual(['html', 'html', 'html', 'ad', 'html', 'html'])
    expect(hasAdjacentAds(chunks)).toBe(false)
  })

  it('adds a second unit later on a long story', () => {
    const blocks = Array.from({ length: 10 }, (_, i) => `<p>${i + 1}</p>`)
    const chunks = layoutArticleBody(blocks, ['ad1', 'ad2'], [3, 8])
    const ads = chunks.filter(c => c.kind === 'ad')
    expect(ads).toHaveLength(2)
    expect(hasAdjacentAds(chunks)).toBe(false)
    expect(chunks[chunks.length - 1]?.kind).toBe('html')
  })

  it('skips in-body ads on a short piece so the story stays the page', () => {
    const chunks = layoutArticleBody(['<p>1</p>', '<p>2</p>'], ['ad1'], [3, 8])
    expect(chunks.every(c => c.kind === 'html')).toBe(true)
  })
})

describe('splitHtmlBlocks', () => {
  it('splits on paragraph and heading closes', () => {
    const blocks = splitHtmlBlocks('<p>One</p><h2>Head</h2><p>Two</p>')
    expect(blocks).toEqual(['<p>One</p>', '<h2>Head</h2>', '<p>Two</p>'])
  })
})
