import type { ReactNode } from 'react'

interface AdminMetricCardProps {
  label: string
  value: ReactNode
  hint?: string
}

/** White metric surface. Label, then figure, then one muted line. */
export function AdminMetricCard({ label, value, hint }: AdminMetricCardProps) {
  return (
    <div className="ep-admin-el-metric">
      <p className="ep-admin-el-metric-label">{label}</p>
      <strong className="ep-admin-el-metric-value">{value}</strong>
      {hint ? <span className="ep-admin-el-metric-hint">{hint}</span> : null}
    </div>
  )
}

export function AdminMetricRow({
  columns = 3,
  children,
}: {
  columns?: 2 | 3 | 4
  children: ReactNode
}) {
  return (
    <div className={`ep-admin-el-metrics ep-admin-el-metrics--${columns}`}>
      {children}
    </div>
  )
}
