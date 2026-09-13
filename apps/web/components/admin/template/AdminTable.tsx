import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react'

export function AdminTable({
  title,
  count,
  children,
}: {
  title?: string
  count?: string
  children: ReactNode
}) {
  return (
    <div className="ep-admin-el-table-wrap">
      {(title || count) ? (
        <div className="ep-admin-el-table-head">
          {title ? <h2 className="ep-admin-el-table-title">{title}</h2> : <span />}
          {count ? <span className="ep-admin-el-count">{count}</span> : null}
        </div>
      ) : null}
      <table className="ep-admin-el-table">{children}</table>
    </div>
  )
}

export function AdminTh({ children, ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className="ep-admin-el-th" {...rest}>
      {children}
    </th>
  )
}

export function AdminTd({
  label,
  children,
  ...rest
}: TdHTMLAttributes<HTMLTableCellElement> & { label?: string }) {
  return (
    <td className="ep-admin-el-td" data-label={label} {...rest}>
      {children}
    </td>
  )
}
