import { describe, expect, it } from 'vitest'
import { episodeSharePath, shareUrls } from './share'

describe('podcast share helpers', () => {
  it('builds episode path', () => {
    expect(episodeSharePath('carson-heady')).toBe('/podcast/carson-heady')
  })

  it('builds social intent URLs', () => {
    const urls = shareUrls('https://platform.evolvedpros.com/podcast/ep-7', 'Evolving Inside a Software Giant')
    expect(urls.x).toContain('twitter.com/intent/tweet')
    expect(urls.x).toContain(encodeURIComponent('https://platform.evolvedpros.com/podcast/ep-7'))
    expect(urls.linkedin).toContain('linkedin.com/sharing/share-offsite')
    expect(urls.facebook).toContain('facebook.com/sharer/sharer.php')
  })
})
