import { LessonPageSkeleton } from '@/components/shared/Skeleton'

/** Theme-aware lesson detail skeleton — player + content + sponsors. */
export default function AcademyLessonLoading() {
  return (
    <div role="status" aria-label="Loading lesson">
      <LessonPageSkeleton />
    </div>
  )
}
