import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MediaAttachControl } from '@/components/community/MediaAttachControl'
import { Composer } from '@/components/community/Composer'
import { PostMedia } from '@/components/community/PostMedia'

/**
 * CM-1 acceptance criterion, encoded so it cannot silently regress:
 *   on /community, document.querySelectorAll('input[type=file]').length >= 1
 *
 * The composer is always mounted on the community page, so proving the
 * composer's markup contains a real file input proves the page does.
 * renderToStaticMarkup gives us the server pass — effects don't run, which is
 * exactly the first-paint DOM the criterion is about.
 */

const noop = () => {}

const COMPOSER_USER = {
  displayName: 'George Leith',
  initials: 'GL',
  avatarUrl: null,
  tier: 'pro',
}

function countFileInputs(html: string): number {
  return (html.match(/<input[^>]*type="file"/g) ?? []).length
}

describe('attach control — a real file input is in the DOM', () => {
  it('renders exactly one input[type=file]', () => {
    const html = renderToStaticMarkup(
      <MediaAttachControl file={null} onChange={noop} error={null} onError={noop} />,
    )
    expect(countFileInputs(html)).toBe(1)
  })

  it('is present in the composer as shipped on /community', () => {
    const html = renderToStaticMarkup(
      <Composer currentUser={COMPOSER_USER} channelId="channel-1" />,
    )
    expect(countFileInputs(html)).toBeGreaterThanOrEqual(1)
  })

  it('offers only the CM-1 image types — no video until CM-2', () => {
    const html = renderToStaticMarkup(
      <MediaAttachControl file={null} onChange={noop} error={null} onError={noop} />,
    )
    expect(html).toContain('accept="image/png,image/jpeg,image/webp"')
    expect(html).not.toContain('video/mp4')
  })

  it('hides the input without removing it from the tree', () => {
    const html = renderToStaticMarkup(
      <MediaAttachControl file={null} onChange={noop} error={null} onError={noop} />,
    )
    /* clip-path keeps it focusable and in the a11y tree; display:none would not. */
    expect(html).toContain('clip-path:inset(50%)')
    expect(html).not.toMatch(/<input[^>]*type="file"[^>]*display:none/)
  })

  it('keeps the input mounted while disabled, so the count never drops to zero', () => {
    const html = renderToStaticMarkup(
      <MediaAttachControl file={null} onChange={noop} error={null} onError={noop} disabled />,
    )
    expect(countFileInputs(html)).toBe(1)
    expect(html).toContain('disabled')
  })

  it('labels the trigger so the input is reachable by name', () => {
    const html = renderToStaticMarkup(
      <MediaAttachControl file={null} onChange={noop} error={null} onError={noop} />,
    )
    expect(html).toContain('<label')
    expect(html).toContain('for=')
    expect(html).toContain('Add image')
  })

  it('surfaces a rejection message with role=alert rather than swallowing it', () => {
    const html = renderToStaticMarkup(
      <MediaAttachControl
        file={null}
        onChange={noop}
        error="image/gif isn't supported. Attach a PNG, JPEG, or WebP image."
        onError={noop}
      />,
    )
    expect(html).toContain('role="alert"')
    expect(html).toContain('isn&#x27;t supported')
  })
})

describe('feed media render', () => {
  const media = { kind: 'image' as const, url: 'https://cdn.test/q.png', width: 1080, height: 1080 }

  it('contains the image instead of cropping it', () => {
    const html = renderToStaticMarkup(<PostMedia media={media} />)
    expect(html).toContain('object-fit:contain')
    expect(html).not.toContain('object-fit:cover')
  })

  it('reserves the box from the stored intrinsic ratio — no layout shift', () => {
    const html = renderToStaticMarkup(<PostMedia media={media} />)
    expect(html).toContain('aspect-ratio:1080 / 1080')
    expect(html).toContain('width="1080"')
    expect(html).toContain('height="1080"')
  })

  it('frames the letterbox with a theme token, never a fixed light colour', () => {
    const html = renderToStaticMarkup(<PostMedia media={media} />)
    expect(html).toContain('var(--post-media-frame-bg)')
    expect(html).not.toMatch(/background:\s*#[Ff]{3,6}/)
  })

  it('still renders when dimensions are unknown', () => {
    const html = renderToStaticMarkup(
      <PostMedia media={{ kind: 'image', url: 'https://cdn.test/q.png', width: null, height: null }} />,
    )
    expect(html).toContain('<img')
    expect(html).not.toContain('aspect-ratio')
  })

  it('renders nothing for a video until CM-2 builds it', () => {
    const html = renderToStaticMarkup(
      <PostMedia media={{ kind: 'video', url: 'https://cdn.test/q.mp4', width: 1920, height: 1080 }} />,
    )
    expect(html).toBe('')
  })

  it('carries alt text', () => {
    const html = renderToStaticMarkup(<PostMedia media={media} alt="Quote card" />)
    expect(html).toContain('alt="Quote card"')
  })
})
