export const dynamic = 'force-dynamic'

import { PillarPageShell } from '@/components/academy/PillarPageShell'

interface Props {
  params: { pillarSlug: string }
}

export default function CourseDetailPage({ params }: Props) {
  return <PillarPageShell pillarSlug={params.pillarSlug} />
}
