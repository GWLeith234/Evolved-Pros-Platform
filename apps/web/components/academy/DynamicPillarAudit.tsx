'use client'
import dynamic from 'next/dynamic'

interface AuditQuestion {
  id: string
  text: string
}

interface PillarAuditProps {
  pillarId: string
  courseId: string
  questions: AuditQuestion[]
  pillarColor?: string
}

// Below-the-fold pillar page widget — same rationale as
// DynamicReflectionPrompt. PillarAudit is the largest 'use client' file
// on this route (~250 LOC of question state + scoring) and is rarely
// touched on first paint, so ship it as a separate chunk.
const DynamicPillarAuditInner = dynamic<PillarAuditProps>(
  () => import('./PillarAudit').then(m => ({ default: m.PillarAudit })),
  {
    loading: () => (
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 8,
          minHeight: 220,
        }}
      />
    ),
    ssr: false,
  },
)

export function DynamicPillarAudit(props: PillarAuditProps) {
  return <DynamicPillarAuditInner {...props} />
}
