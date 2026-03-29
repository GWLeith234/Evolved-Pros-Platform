import { EpisodeForm } from '../EpisodeForm'

export const dynamic = 'force-dynamic'

export default function NewEpisodePage() {
  return (
    <div className="px-8 py-6">
      <div className="mb-6">
        <h1 className="font-display font-black text-[28px] text-[#112535]">New Episode</h1>
        <p className="font-condensed text-[12px] text-[#7a8a96] mt-0.5">
          Create a new episode entry
        </p>
      </div>
      <EpisodeForm />
    </div>
  )
}
