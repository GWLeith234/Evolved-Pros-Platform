import type { ReactNode } from 'react'

interface AdminPageHeaderProps {
  title: string
  subline: string
  /** Solid red. Page headers show at most two actions. */
  primary?: ReactNode
  /** Navy outline. */
  secondary?: ReactNode
}

/**
 * Element Template page header. H1 navy sans + one muted subline.
 * No eyebrow. No hyphen or em dash in the subline. Max two actions.
 */
export function AdminPageHeader({ title, subline, primary, secondary }: AdminPageHeaderProps) {
  return (
    <div className="ep-admin-el-head">
      <div>
        <h1 className="ep-admin-el-title">{title}</h1>
        {subline ? <p className="ep-admin-el-sub">{subline}</p> : null}
      </div>
      {(primary || secondary) ? (
        <div className="ep-admin-el-actions">
          {secondary}
          {primary}
        </div>
      ) : null}
    </div>
  )
}
