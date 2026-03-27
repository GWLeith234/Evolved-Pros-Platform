import Link from 'next/link'
import { Card, CardHeader, CardBody, Button } from '@evolved-pros/ui'

type CourseProgress = {
  id: string
  title: string
  slug: string
  total: number
  completed: number
  pct: number
}

interface AcademyProgressWidgetProps {
  courses: CourseProgress[]
}

export function AcademyProgressWidget({ courses }: AcademyProgressWidgetProps) {
  return (
    <Card>
      <CardHeader title="Your Academy" />
      <CardBody className="!px-6 !py-4 space-y-4">
        {courses.length === 0 ? (
          <p className="font-condensed text-xs tracking-widest text-[#7a8a96] text-center py-4">
            No courses started yet
          </p>
        ) : (
          courses.map(course => {
            const isDone = course.pct === 100
            const fillColor = isDone ? '#22c55e' : '#68a2b9'
            const pctColor = isDone ? '#22c55e' : '#68a2b9'

            return (
              <Link key={course.id} href={`/academy/${course.slug}`} className="block group">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-body font-semibold text-[12px] text-[#1b3c5a] group-hover:text-[#68a2b9] transition-colors">
                    {course.title}
                  </span>
                  <span
                    className="font-condensed font-bold text-[10px]"
                    style={{ color: pctColor }}
                  >
                    {course.pct}%
                  </span>
                </div>
                {/* Progress bar */}
                <div
                  className="w-full rounded-full overflow-hidden"
                  style={{ height: '3px', backgroundColor: 'rgba(27,60,90,0.12)' }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${course.pct}%`, backgroundColor: fillColor }}
                  />
                </div>
              </Link>
            )
          })
        )}

        <div className="pt-2">
          <Link href="/academy" className="block">
            <Button variant="primary" size="sm" className="w-full">
              Continue Learning →
            </Button>
          </Link>
        </div>
      </CardBody>
    </Card>
  )
}
