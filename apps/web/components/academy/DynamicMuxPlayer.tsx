'use client'
import dynamic from 'next/dynamic'

interface MuxPlayerProps {
  playbackId: string
  token: string | null
  initialProgress?: number
  lessonId: string
  lessonNumber: number
  totalLessons: number
  courseTitle: string
  onComplete?: () => void
}

// Lazy-load the heavy Mux player — keeps the initial bundle ~200KB lighter.
// ssr: false because @mux/mux-player-react relies on browser APIs.
const DynamicMuxPlayerInner = dynamic<MuxPlayerProps>(
  () => import('./MuxPlayer').then(m => ({ default: m.MuxPlayer })),
  {
    loading: () => (
      <div style={{ aspectRatio: '16/9', background: '#112535', maxHeight: 420 }} />
    ),
    ssr: false,
  },
)

export function DynamicMuxPlayer(props: MuxPlayerProps) {
  return <DynamicMuxPlayerInner {...props} />
}
