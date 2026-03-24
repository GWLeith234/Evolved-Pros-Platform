import { CourseCard } from './CourseCard'
import type { CourseWithProgress } from '@/lib/academy/types'

interface CourseGridProps {
  courses: CourseWithProgress[]
  userTier: string | null
}

export function CourseGrid({ courses, userTier }: CourseGridProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {courses.map(course => {
        const isLocked = course.requiredTier === 'pro' && userTier !== 'pro'
        return (
          <CourseCard key={course.id} course={course} isLocked={isLocked} />
        )
      })}
    </div>
  )
}
