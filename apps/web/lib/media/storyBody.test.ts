import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { demoteHtmlH1, stripLeadingTitle } from './storyBody'

const here = dirname(fileURLToPath(import.meta.url))

describe('stripLeadingTitle', () => {
  const title = 'Agentic Buying Expectations Are Ahead of the Proof'

  it('strips an exact leading markdown title and the blank lines after it', () => {
    const body = `# ${title}\n\nThe deck says agentic.\n`
    expect(stripLeadingTitle(body, title)).toBe('The deck says agentic.\n')
  })

  it('matches case, whitespace, curly quotes, dashes, and trailing punctuation', () => {
    expect(stripLeadingTitle("#  it's  the proof.  \n\nNext", 'It’s the proof')).toBe('Next')
    expect(stripLeadingTitle('# Proof — gap\n\nNext', 'Proof - gap!')).toBe('Next')
    expect(stripLeadingTitle('##  TITLE   NAME \n\n\nBody', 'title name')).toBe('Body')
  })

  it('keeps a leading heading that is not the story title', () => {
    const body = '# A different claim\n\nThe deck says agentic.\n'
    expect(stripLeadingTitle(body, title)).toBe(body)
  })

  it('keeps a matching heading that is not the first content', () => {
    const body = `Intro line\n\n# ${title}\n\nMore\n`
    expect(stripLeadingTitle(body, title)).toBe(body)
  })

  it('strips a leading HTML h1 and leaves a non-matching one', () => {
    expect(stripLeadingTitle(`<h1>${title}</h1>\n\n<p>Next</p>`, title)).toBe('<p>Next</p>')
    expect(stripLeadingTitle('<h1 class="x">Other</h1>\n\n<p>Next</p>', title)).toBe(
      '<h1 class="x">Other</h1>\n\n<p>Next</p>',
    )
  })

  it('does not treat a deeper heading or a title-less body as a duplicate', () => {
    const deeper = `### ${title}\n\nBody`
    expect(stripLeadingTitle(deeper, title)).toBe(deeper)
    expect(stripLeadingTitle(`# ${title}\n\nBody`, '   ')).toBe(`# ${title}\n\nBody`)
  })
})

describe('demoteHtmlH1', () => {
  it('turns body h1 tags into h2 and leaves code and existing h2s', () => {
    const html = '<h1>Other claim</h1><h2>The Bottom Line</h2><pre><code># not a heading</code></pre>'
    expect(demoteHtmlH1(html)).toBe(
      '<h2>Other claim</h2><h2>The Bottom Line</h2><pre><code># not a heading</code></pre>',
    )
    expect(demoteHtmlH1('<h1 class="x">Kept as h2</h1>')).toBe('<h2 class="x">Kept as h2</h2>')
  })
})

describe('story body write path', () => {
  it('normalises body on admin media POST and PATCH', () => {
    const webRoot = resolve(here, '../..')
    const post = readFileSync(resolve(webRoot, 'app/api/admin/media/route.ts'), 'utf8')
    const patch = readFileSync(resolve(webRoot, 'app/api/admin/media/[id]/route.ts'), 'utf8')
    const document = readFileSync(
      resolve(webRoot, 'components/media/MediaStoryDocument.tsx'),
      'utf8',
    )
    expect(post).toContain('stripLeadingTitle')
    expect(patch).toContain('stripLeadingTitle')
    expect(document).toContain('stripLeadingTitle(story.body ?? \'\', story.title)')
    expect(document).toContain('demoteHtmlH1')
    expect(document).toContain('newspaperReadMinutes(body)')
  })
})
