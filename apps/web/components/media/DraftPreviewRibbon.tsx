import Link from 'next/link'

/** Fixed label so a draft cannot be mistaken for the live article. */
export function DraftPreviewRibbon({ cardHref }: { cardHref?: string }) {
  return (
    <div className="ep-draft-preview-ribbon" role="status">
      <span>DRAFT PREVIEW</span>
      {cardHref ? <Link href={cardHref}>Social card</Link> : null}
    </div>
  )
}
