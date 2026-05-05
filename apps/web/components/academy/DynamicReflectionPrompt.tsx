'use client'
import dynamic from 'next/dynamic'

interface ReflectionPromptProps {
  pillarId: string
  courseId: string
  promptText: string
}

// Below-the-fold pillar page widget. Pulls in form state, fetch helpers,
// and Tailwind-class chunks that we don't need on first paint of the
// modules accordion. ssr:false because the placeholder is cheap and the
// real interactive form only matters once the user scrolls.
const DynamicReflectionPromptInner = dynamic<ReflectionPromptProps>(
  () => import('./ReflectionPrompt').then(m => ({ default: m.ReflectionPrompt })),
  {
    loading: () => (
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 8,
          minHeight: 180,
        }}
      />
    ),
    ssr: false,
  },
)

export function DynamicReflectionPrompt(props: ReflectionPromptProps) {
  return <DynamicReflectionPromptInner {...props} />
}
