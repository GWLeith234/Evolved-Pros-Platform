import type { CSSProperties, ReactNode } from 'react'

export function AdminKanbanWell({
  columns,
  children,
}: {
  columns: 4 | 5
  children: ReactNode
}) {
  return (
    <div
      className="ep-admin-el-kanban"
      style={{ '--admin-kanban-cols': columns } as CSSProperties}
    >
      {children}
    </div>
  )
}

export function AdminKanbanColumn({ children }: { children: ReactNode }) {
  return <div className="ep-admin-el-kanban-col">{children}</div>
}
