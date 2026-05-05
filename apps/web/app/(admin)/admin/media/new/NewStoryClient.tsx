'use client'

import { useState, type ComponentProps } from 'react'
import { MediaStoryForm } from '../MediaStoryForm'
import { StoryAIWriter, type AIStoryFields } from '@/components/admin/StoryAIWriter'

type FormInitial = NonNullable<ComponentProps<typeof MediaStoryForm>['initial']>

// AI returns canonical pillar slugs ('mental') but MediaStoryForm's <select>
// uses the longer slugs ('mental-toughness'). Map at the boundary so the
// dropdown picks up the AI's selection automatically.
const AI_TO_FORM_PILLAR: Record<string, string> = {
  foundation:     'foundation',
  identity:       'identity',
  mental:         'mental-toughness',
  strategy:       'strategy',
  accountability: 'accountability',
  execution:      'execution',
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
}

export function NewStoryClient() {
  // Re-mount MediaStoryForm with a fresh `initial` whenever the AI
  // produces a new draft — MediaStoryForm reads `initial` only inside
  // useState defaults, so the key bump is what actually re-seeds the
  // controlled inputs.
  const [seed, setSeed] = useState(0)
  const [initial, setInitial] = useState<FormInitial | undefined>(undefined)

  function handlePrefill(fields: AIStoryFields) {
    const formPillar = AI_TO_FORM_PILLAR[fields.pillar] ?? ''
    setInitial({
      title:      fields.title,
      slug:       slugify(fields.title),
      excerpt:    fields.excerpt.slice(0, 160),
      body:       fields.body,
      pillar:     formPillar,
      story_type: 'original',
      author:     'George Leith',
    })
    setSeed(s => s + 1)
  }

  return (
    <>
      <StoryAIWriter onPrefill={handlePrefill} />
      <MediaStoryForm key={seed} initial={initial} />
    </>
  )
}
