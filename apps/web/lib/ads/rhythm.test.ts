import { describe, expect, it } from 'vitest'
import {
  FEED_AD_EVERY,
  articleAdBreaks,
  cadenceGroupSizes,
  hasAdjacentAds,
  interleaveAds,
  layoutArticleBody,
  splitHtmlBlocks,
} from './rhythm'

describe('cadenceGroupSizes', () => {
  it('keeps a fixed interval when no tighten is set', () => {
    expect(cadenceGroupSizes(9, 3)).toEqual([3, 3, 3])
  })

  it('tightens after the first screen so a long list gets denser', () => {
    expect(cadenceGroupSizes(15, 3, { tightenAfter: 9, deeperEvery: 2 })).toEqual([
      3, 3, 3, 2, 2, 2,
    ])
  })
})

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

  it('defaults to one magazine row so each story row gets punctuation', () => {
    expect(FEED_AD_EVERY).toBe(3)
    const items = Array.from({ length: 9 }, (_, i) => `s${i}`)
    const chunks = interleaveAds(items, ['ad1', 'ad2'])
    expect(chunks.filter(c => c.kind === 'ad')).toHaveLength(2)
    expect(chunks[0]?.kind === 'content' && chunks[0].items).toHaveLength(3)
  })

  it('places more units on a long list once the cadence tightens', () => {
    const items = Array.from({ length: 15 }, (_, i) => `s${i}`)
    const ads = ['a1', 'a2', 'a3', 'a4', 'a5']
    const chunks = interleaveAds(items, ads, 3, {
      trailing: true,
      tightenAfter: 9,
      deeperEvery: 2,
    })
    expect(chunks.filter(c => c.kind === 'ad')).toHaveLength(5)
    expect(hasAdjacentAds(chunks)).toBe(false)
    const contentSizes = chunks
      .filter(c => c.kind === 'content')
      .map(c => (c.kind === 'content' ? c.items.length : 0))
    expect(contentSizes.slice(0, 3)).toEqual([3, 3, 3])
    expect(contentSizes.slice(3)).toEqual([2, 2, 2])
  })
})

describe('articleAdBreaks', () => {
  it('skips a short piece', () => {
    expect(articleAdBreaks(3)).toEqual([])
  })

  it('marks a single late slot on a long story', () => {
    expect(articleAdBreaks(16)).toEqual([15])
  })
})

describe('layoutArticleBody', () => {
  it('inserts after a few paragraphs, not as a stack', () => {
    const blocks = ['<p>1</p>', '<p>2</p>', '<p>3</p>', '<p>4</p>', '<p>5</p>']
    const chunks = layoutArticleBody(blocks, ['ad1', 'ad2'], [3, 6])
    expect(chunks.map(c => c.kind)).toEqual(['html', 'html', 'html', 'ad', 'html', 'html'])
    expect(hasAdjacentAds(chunks)).toBe(false)
  })

  it('adds a second unit later on a long story', () => {
    const blocks = Array.from({ length: 10 }, (_, i) => `<p>${i + 1}</p>`)
    const chunks = layoutArticleBody(blocks, ['ad1', 'ad2'], [3, 6])
    const ads = chunks.filter(c => c.kind === 'ad')
    expect(ads).toHaveLength(2)
    expect(hasAdjacentAds(chunks)).toBe(false)
    expect(chunks[chunks.length - 1]?.kind).toBe('html')
  })

  it('skips in-body ads on a short piece so the story stays the page', () => {
    const chunks = layoutArticleBody(['<p>1</p>', '<p>2</p>'], ['ad1'], [3, 6])
    expect(chunks.every(c => c.kind === 'html')).toBe(true)
  })

  it('uses a single late break when none are passed', () => {
    const blocks = Array.from({ length: 16 }, (_, i) => `<p>${i + 1}</p>`)
    const ads = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6']
    const chunks = layoutArticleBody(blocks, ads)
    expect(chunks.filter(c => c.kind === 'ad')).toHaveLength(1)
    expect(hasAdjacentAds(chunks)).toBe(false)
    expect(chunks[chunks.length - 1]?.kind).toBe('html')
  })
})

describe('splitHtmlBlocks', () => {
  it('splits on paragraph and heading closes', () => {
    const blocks = splitHtmlBlocks('<p>One</p><h2>Head</h2><p>Two</p>')
    expect(blocks).toEqual(['<p>One</p>', '<h2>Head</h2>', '<p>Two</p>'])
  })
})
