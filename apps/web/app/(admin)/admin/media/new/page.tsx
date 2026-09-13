import { AdminPageHeader } from '@/components/admin/template'
import { NewStoryClient } from './NewStoryClient'

export default function NewMediaStoryPage() {
  return (
    <div className="px-4 sm:px-8 py-6">
      <AdminPageHeader
        title="New Story"
        subline="Manual story for Pros Media. Cancel returns to the library without saving."
      />
      <NewStoryClient />
    </div>
  )
}
