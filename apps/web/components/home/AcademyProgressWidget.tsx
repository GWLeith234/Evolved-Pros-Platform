import Link from 'next/link'
import { Card, CardBody, ProgressBar, Button } from '@evolved-pros/ui'

type CourseProgress = {
  id: string
  title: string
  slug: string
  total: number
  completed: number
  pct: number
  pillar_number?: number | null
}

interface AcademyProgressWidgetProps {
  courses: CourseProgress[]
}

export function AcademyProgressWidget({ courses }: AcademyProgressWidgetProps) {
  return (
    <Card>
      <CardBody className="!px-6 !py-5 space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3
            className="font-condensed text-[22px] font-medium uppercase tracking-[0.04em] text-[color:var(--text-primary)] leading-none"
          >
            Active courses
          </h3>
          <Button variant="tertiary" size="sm" href="/academy">
            Continue Learning
          </Button>
        </div>

        {courses.length === 0 ? (
          <p className="font-condensed text-xs tracking-widest text-[color:var(--text-tertiary)] text-center py-4">
            No courses started yet
          </p>
        ) : (
          courses.map(course => {
            const pillar =
              course.pillar_number != null && course.pillar_number >= 1 && course.pillar_number <= 6
                ? (course.pillar_number as 1 | 2 | 3 | 4 | 5 | 6)
                : undefined

            return (
              <Link
                key={course.id}
                href={`/academy/${course.slug}`}
                className="block group"
                style={{ textDecoration: 'none' }}
              >
                <ProgressBar
                  label={course.title}
                  value={course.pct}
                  pillar={pillar}
                  size="sm"
                  meta={`${course.completed}/${course.total}`}
                />
              </Link>
            )
          })
        )}
      </CardBody>
    </Card>
  )
}
