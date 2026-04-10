import { MediaStoryForm } from '../MediaStoryForm'

export default function NewMediaStoryPage() {
  return (
    <div className="px-8 py-6">
      <p className="font-condensed font-bold uppercase tracking-[0.14em] text-[10px] mb-1" style={{ color: '#68a2b9' }}>
        Evolved Media
      </p>
      <h1 className="font-display font-bold text-xl mb-6" style={{ color: '#1b3c5a' }}>
        New Story
      </h1>
      <MediaStoryForm />
    </div>
  )
}
