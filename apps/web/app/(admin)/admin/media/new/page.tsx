import { NewStoryClient } from './NewStoryClient'

export default function NewMediaStoryPage() {
  return (
    <div className="px-4 sm:px-8 py-6">
      <p className="font-condensed font-bold uppercase tracking-[0.14em] text-[10px] mb-1" style={{ color: 'var(--admin-text-2)' }}>
        Pros Media
      </p>
      <h1 className="font-display font-bold text-xl mb-6" style={{ color: 'var(--admin-text)' }}>
        New Story
      </h1>
      <NewStoryClient />
    </div>
  )
}
