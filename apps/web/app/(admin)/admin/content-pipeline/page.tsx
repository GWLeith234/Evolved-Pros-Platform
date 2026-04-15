import { PipelineForm } from '@/components/pipeline/PipelineForm'

export const dynamic = 'force-dynamic'

export default function ContentPipelinePage() {
  return (
    <div className="px-8 py-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="font-condensed font-bold uppercase tracking-[0.14em] text-[10px] mb-1" style={{ color: '#A78BFA' }}>
            AI Content
          </p>
          <h1 className="font-display font-black text-[28px]" style={{ color: '#1b3c5a' }}>
            Content Pipeline
          </h1>
          <p className="font-body text-[13px] mt-1" style={{ color: '#7a8a96' }}>
            Drop an episode. Get a community post, article, email, and social copy in George&apos;s voice.
          </p>
        </div>
      </div>
      <PipelineForm />
    </div>
  )
}
