import { CourseCard } from './CourseCard'
import type { CourseWithProgress } from '@/lib/academy/types'

interface CourseGridProps {
  courses: CourseWithProgress[]
  userTier: string | null
}

export function CourseGrid({ courses, userTier }: CourseGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {courses.map(course => (
        <CourseCard key={course.id} course={course} isLocked={!course.hasAccess} userTier={userTier} />
      ))}
    </div>
  )
}
