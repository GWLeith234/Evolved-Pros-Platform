#!/usr/bin/env node
/**
 * Builds supabase/migrations/086_media_desk_copy_cull.sql from
 * content/media/*.md plus targeted live-copy fixes.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dir = join(root, 'content/media')

function parseMd(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) throw new Error('missing frontmatter')
  const meta = {}
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim()
  }
  return { ...meta, body: match[2].trim() }
}

function sqlStr(value) {
  if (value.includes('$body$')) {
    throw new Error('body delimiter collision')
  }
  return `$body$${value}$body$`
}

const updates = []
for (const file of readdirSync(dir).filter(f => f.endsWith('.md')).sort()) {
  const story = parseMd(readFileSync(join(dir, file), 'utf8'))
  if (!story.slug || !story.title || !story.body) {
    throw new Error(`incomplete frontmatter in ${file}`)
  }
  if (/\u2014/.test(`${story.title}${story.excerpt ?? ''}${story.body}`)) {
    throw new Error(`em dash leaked in ${file}`)
  }
  updates.push(`-- ${story.slug}
UPDATE public.media_stories
SET
  title = ${sqlStr(story.title)},
  excerpt = ${sqlStr(story.excerpt ?? '')},
  seo_title = ${sqlStr(`${story.title} | Evolved Pros Media`)},
  body = ${sqlStr(story.body)},
  updated_at = now()
WHERE slug = ${sqlStr(story.slug)};
`)
}

const sql = `-- 086 Media desk copy cull (Q2oUw).
-- Rewrites Apr 2026 cohort bodies, strips em dashes from Media titles/copy,
-- and hardens a few live filler lines. No pricing, billing, or homepage ads.

${updates.join('\n')}

-- Title + SEO for the Fable 5 card (keep Aug/June voice, drop the em dash).
UPDATE public.media_stories
SET
  title = 'What Happened to Claude''s Fable 5, and Why Sales Pros Should Care',
  seo_title = 'What Happened to Claude''s Fable 5, and Why Sales Pros Should Care | Evolved Pros Media',
  excerpt = replace(replace(coalesce(excerpt, ''), ' — ', ', '), '—', ', '),
  body = replace(replace(body, ' — ', '. '), '—', ', '),
  updated_at = now()
WHERE slug = 'what-happened-to-claudes-fable-5';

-- grok-bot: drop the "The Bottom Line" essay closer.
UPDATE public.media_stories
SET
  body = replace(body, '## The Bottom Line', '## Still carrying the bag'),
  updated_at = now()
WHERE slug = 'grok-bot-everywhere'
  AND body LIKE '%## The Bottom Line%';

-- May audit: plain language instead of "leverage", plus em-dash strip.
UPDATE public.media_stories
SET
  body = replace(
    replace(replace(body, ' — ', ', '), '—', ', '),
    'the most powerful leverage a small team has ever had',
    'the most useful tool a small team has ever had'
  ),
  excerpt = replace(replace(coalesce(excerpt, ''), ' — ', ', '), '—', ', '),
  updated_at = now()
WHERE slug = 'how-much-ai-slop-did-we-publish-in-may';

-- Accountability Apr excerpt was ALL-CAPS theater.
UPDATE public.media_stories
SET
  excerpt = 'Most people do not lack discipline. They lack a system that makes the gap between who they are and who they said they would be visible every day.',
  updated_at = now()
WHERE slug = 'accountability-framework-sales-teams';

-- Remaining Media copy: never ship an em dash. Prefer comma/period.
UPDATE public.media_stories
SET
  title = replace(replace(title, ' — ', '. '), '—', ', '),
  excerpt = nullif(replace(replace(coalesce(excerpt, ''), ' — ', ', '), '—', ', '), ''),
  seo_title = nullif(replace(replace(coalesce(seo_title, ''), ' — ', '. '), '—', ', '), ''),
  body = replace(replace(body, ' — ', ', '), '—', ', '),
  updated_at = now()
WHERE position('—' in coalesce(title, '') || coalesce(excerpt, '') || coalesce(seo_title, '') || coalesce(body, '')) > 0;
`

writeFileSync(join(root, 'supabase/migrations/086_media_desk_copy_cull.sql'), sql)
console.log('wrote supabase/migrations/086_media_desk_copy_cull.sql')
