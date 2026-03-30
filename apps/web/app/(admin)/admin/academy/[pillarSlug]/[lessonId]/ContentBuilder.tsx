'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// ── Block types ──────────────────────────────────────────────────────────────

type VideoBlock    = { type: 'video';     url: string; title: string; duration: string }
type PullquoteBlock = { type: 'pullquote'; text: string; source: string }
type TextBlock     = { type: 'text';      content: string }
type ExerciseBlock = { type: 'exercise';  question: string; options: string[]; correct: number; open_ended: boolean }
type QuizBlock     = { type: 'quiz';      question: string; options: string[]; correct: number }

type ContentBlock = VideoBlock | PullquoteBlock | TextBlock | ExerciseBlock | QuizBlock
type BlockType = ContentBlock['type']

function defaultBlock(type: BlockType): ContentBlock {
  switch (type) {
    case 'video':     return { type, url: '', title: '', duration: '' }
    case 'pullquote': return { type, text: '', source: '' }
    case 'text':      return { type, content: '' }
    case 'exercise':  return { type, question: '', options: ['', '', '', ''], correct: 0, open_ended: false }
    case 'quiz':      return { type, question: '', options: ['', '', '', ''], correct: 0 }
  }
}

// ── Shared input styles ───────────────────────────────────────────────────────

const INPUT_CLASS = 'w-full font-body text-[13px] text-[#1b3c5a] rounded border px-3 py-2 focus:outline-none transition-colors'
const INPUT_STYLE = { borderColor: 'rgba(27,60,90,0.18)' }

function Inp({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <p className="font-condensed font-bold uppercase tracking-[0.14em] text-[9px] text-[#7a8a96] mb-1">{label}</p>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={INPUT_CLASS}
        style={INPUT_STYLE}
      />
    </div>
  )
}

function Area({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div>
      <p className="font-condensed font-bold uppercase tracking-[0.14em] text-[9px] text-[#7a8a96] mb-1">{label}</p>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        className={`${INPUT_CLASS} resize-none`}
        style={INPUT_STYLE}
      />
    </div>
  )
}

// ── Block editors ─────────────────────────────────────────────────────────────

function VideoEditor({ block, onChange }: { block: VideoBlock; onChange: (b: VideoBlock) => void }) {
  return (
    <div className="space-y-3">
      <Inp label="Video URL" value={block.url} onChange={v => onChange({ ...block, url: v })} placeholder="https://..." />
      <div className="grid grid-cols-2 gap-3">
        <Inp label="Title" value={block.title} onChange={v => onChange({ ...block, title: v })} />
        <Inp label="Duration" value={block.duration} onChange={v => onChange({ ...block, duration: v })} placeholder="14:32" />
      </div>
    </div>
  )
}

function PullquoteEditor({ block, onChange }: { block: PullquoteBlock; onChange: (b: PullquoteBlock) => void }) {
  return (
    <div className="space-y-3">
      <Area label="Quote Text" value={block.text} onChange={v => onChange({ ...block, text: v })} rows={3} />
      <Inp label="Source Attribution" value={block.source} onChange={v => onChange({ ...block, source: v })} placeholder="EVOLVED, Chapter 1" />
    </div>
  )
}

function TextEditor({ block, onChange }: { block: TextBlock; onChange: (b: TextBlock) => void }) {
  return <Area label="Content" value={block.content} onChange={v => onChange({ ...block, content: v })} rows={5} />
}

function QuestionEditor({
  question, options, correct, open_ended, onChangeQuestion, onChangeOption, onChangeCorrect, onChangeOpenEnded, label,
}: {
  question: string; options: string[]; correct: number; open_ended?: boolean
  onChangeQuestion: (v: string) => void
  onChangeOption: (i: number, v: string) => void
  onChangeCorrect: (i: number) => void
  onChangeOpenEnded?: (v: boolean) => void
  label: string
}) {
  return (
    <div className="space-y-3">
      <Area label={label} value={question} onChange={onChangeQuestion} rows={2} />
      <div className="space-y-2">
        <p className="font-condensed font-bold uppercase tracking-[0.14em] text-[9px] text-[#7a8a96]">Options (select correct)</p>
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="radio"
              name={`correct-${label}-${i}`}
              checked={correct === i}
              onChange={() => onChangeCorrect(i)}
              className="flex-shrink-0"
            />
            <input
              type="text"
              value={opt}
              onChange={e => onChangeOption(i, e.target.value)}
              placeholder={`Option ${String.fromCharCode(65 + i)}`}
              className={`flex-1 ${INPUT_CLASS}`}
              style={INPUT_STYLE}
            />
          </div>
        ))}
      </div>
      {onChangeOpenEnded !== undefined && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={open_ended ?? false}
            onChange={e => onChangeOpenEnded(e.target.checked)}
          />
          <span className="font-condensed text-[12px] text-[#1b3c5a]">Open-ended (no correct answer)</span>
        </label>
      )}
    </div>
  )
}

function ExerciseEditor({ block, onChange }: { block: ExerciseBlock; onChange: (b: ExerciseBlock) => void }) {
  return (
    <QuestionEditor
      label="Exercise Question"
      question={block.question}
      options={block.options}
      correct={block.correct}
      open_ended={block.open_ended}
      onChangeQuestion={v => onChange({ ...block, question: v })}
      onChangeOption={(i, v) => { const opts = [...block.options]; opts[i] = v; onChange({ ...block, options: opts }) }}
      onChangeCorrect={i => onChange({ ...block, correct: i })}
      onChangeOpenEnded={v => onChange({ ...block, open_ended: v })}
    />
  )
}

function QuizEditor({ block, onChange }: { block: QuizBlock; onChange: (b: QuizBlock) => void }) {
  return (
    <QuestionEditor
      label="Quiz Question"
      question={block.question}
      options={block.options}
      correct={block.correct}
      onChangeQuestion={v => onChange({ ...block, question: v })}
      onChangeOption={(i, v) => { const opts = [...block.options]; opts[i] = v; onChange({ ...block, options: opts }) }}
      onChangeCorrect={i => onChange({ ...block, correct: i })}
    />
  )
}

// ── Block type labels ─────────────────────────────────────────────────────────

const TYPE_LABELS: Record<BlockType, string> = {
  video: 'VIDEO',
  pullquote: 'PULL QUOTE',
  text: 'TEXT',
  exercise: 'EXERCISE',
  quiz: 'QUIZ',
}

// ── Main component ────────────────────────────────────────────────────────────

interface ContentBuilderProps {
  lessonId: string
  lessonTitle: string
  isPublished: boolean
  initialBlocks: ContentBlock[]
  pillarSlug: string
  accentColor: string
}

export function ContentBuilder({
  lessonId,
  lessonTitle,
  isPublished: initialPublished,
  initialBlocks,
  pillarSlug,
  accentColor,
}: ContentBuilderProps) {
  const router = useRouter()
  const [blocks, setBlocks] = useState<ContentBlock[]>(initialBlocks)
  const [isPublished, setIsPublished] = useState(initialPublished)
  const [addType, setAddType] = useState<BlockType>('text')
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

  function updateBlock(i: number, b: ContentBlock) {
    setBlocks(prev => prev.map((x, idx) => idx === i ? b : x))
  }

  function deleteBlock(i: number) {
    setBlocks(prev => prev.filter((_, idx) => idx !== i))
  }

  function moveBlock(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= blocks.length) return
    const next = [...blocks]
    ;[next[i], next[j]] = [next[j], next[i]]
    setBlocks(next)
  }

  function addBlock() {
    setBlocks(prev => [...prev, defaultBlock(addType)])
  }

  async function handleSave() {
    setSaving(true)
    setSaveMsg(null)
    try {
      const res = await fetch(`/api/admin/lessons/${lessonId}/content`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_blocks: blocks }),
      })
      if (!res.ok) {
        const data = await res.json()
        setSaveMsg(`Error: ${data.error ?? 'Save failed'}`)
      } else {
        setSaveMsg('Saved ✓')
        router.refresh()
      }
    } catch {
      setSaveMsg('Network error')
    } finally {
      setSaving(false)
    }
  }

  async function handleTogglePublish() {
    setToggling(true)
    try {
      const res = await fetch(`/api/admin/lessons/${lessonId}/publish`, { method: 'PATCH' })
      if (res.ok) {
        const data = await res.json()
        setIsPublished(data.isPublished)
      }
    } finally {
      setToggling(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Publish toggle row */}
      <div
        className="flex items-center justify-between rounded-lg px-5 py-4"
        style={{ backgroundColor: 'white', border: '1px solid rgba(27,60,90,0.1)' }}
      >
        <div>
          <p className="font-condensed font-bold uppercase tracking-[0.14em] text-[9px] text-[#7a8a96] mb-0.5">Status</p>
          <span
            className="font-condensed font-bold uppercase text-[11px] rounded px-2 py-0.5"
            style={{
              color: isPublished ? '#1b3c5a' : '#7a8a96',
              backgroundColor: isPublished ? 'rgba(27,60,90,0.06)' : 'rgba(122,138,150,0.08)',
              border: isPublished ? '1px solid rgba(27,60,90,0.15)' : '1px solid rgba(122,138,150,0.2)',
            }}
          >
            {isPublished ? 'Published' : 'Draft'}
          </span>
        </div>
        <button
          onClick={handleTogglePublish}
          disabled={toggling}
          className="font-condensed font-bold uppercase tracking-wide text-[11px] rounded px-4 py-2 transition-all disabled:opacity-50"
          style={{
            backgroundColor: isPublished ? 'rgba(239,14,48,0.08)' : 'rgba(27,60,90,0.08)',
            color: isPublished ? '#ef0e30' : '#1b3c5a',
            border: isPublished ? '1px solid rgba(239,14,48,0.2)' : '1px solid rgba(27,60,90,0.2)',
          }}
        >
          {toggling ? '...' : isPublished ? 'Unpublish' : 'Publish'}
        </button>
      </div>

      {/* Block list */}
      {blocks.length === 0 ? (
        <div
          className="rounded-lg px-5 py-10 text-center"
          style={{ backgroundColor: 'white', border: '1px solid rgba(27,60,90,0.1)' }}
        >
          <p className="font-condensed text-[12px] text-[#7a8a96]">No content blocks yet. Add one below.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {blocks.map((block, i) => (
            <div
              key={i}
              className="rounded-lg overflow-hidden"
              style={{ backgroundColor: 'white', border: '1px solid rgba(27,60,90,0.1)' }}
            >
              {/* Block header */}
              <div
                className="flex items-center justify-between px-5 py-2.5"
                style={{ borderBottom: '1px solid rgba(27,60,90,0.07)', backgroundColor: 'rgba(27,60,90,0.02)' }}
              >
                <span
                  className="font-condensed font-bold uppercase tracking-[0.16em] text-[10px] rounded px-2 py-0.5"
                  style={{ backgroundColor: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}30` }}
                >
                  {TYPE_LABELS[block.type]}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => moveBlock(i, -1)}
                    disabled={i === 0}
                    className="font-condensed text-[12px] text-[#7a8a96] hover:text-[#1b3c5a] disabled:opacity-30 transition-colors"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveBlock(i, 1)}
                    disabled={i === blocks.length - 1}
                    className="font-condensed text-[12px] text-[#7a8a96] hover:text-[#1b3c5a] disabled:opacity-30 transition-colors"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => deleteBlock(i)}
                    className="font-condensed font-semibold text-[11px] text-[#ef0e30] hover:opacity-70 transition-opacity"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {/* Block editor */}
              <div className="px-5 py-4">
                {block.type === 'video'     && <VideoEditor     block={block} onChange={b => updateBlock(i, b)} />}
                {block.type === 'pullquote' && <PullquoteEditor block={block} onChange={b => updateBlock(i, b)} />}
                {block.type === 'text'      && <TextEditor      block={block} onChange={b => updateBlock(i, b)} />}
                {block.type === 'exercise'  && <ExerciseEditor  block={block} onChange={b => updateBlock(i, b)} />}
                {block.type === 'quiz'      && <QuizEditor      block={block} onChange={b => updateBlock(i, b)} />}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add block row */}
      <div
        className="flex items-center gap-3 rounded-lg px-5 py-4"
        style={{ backgroundColor: 'white', border: '1px solid rgba(27,60,90,0.1)' }}
      >
        <p className="font-condensed font-bold uppercase tracking-[0.14em] text-[9px] text-[#7a8a96] flex-shrink-0">
          Add Block
        </p>
        <select
          value={addType}
          onChange={e => setAddType(e.target.value as BlockType)}
          className="flex-1 font-condensed text-[12px] text-[#1b3c5a] rounded border px-3 py-2 focus:outline-none bg-white"
          style={{ borderColor: 'rgba(27,60,90,0.18)' }}
        >
          <option value="text">Text</option>
          <option value="video">Video</option>
          <option value="pullquote">Pull Quote</option>
          <option value="exercise">Exercise</option>
          <option value="quiz">Quiz</option>
        </select>
        <button
          onClick={addBlock}
          className="font-condensed font-bold uppercase tracking-wide text-[11px] rounded px-4 py-2 flex-shrink-0 transition-all"
          style={{ backgroundColor: '#1b3c5a', color: 'white' }}
        >
          + Add
        </button>
      </div>

      {/* Save row */}
      <div className="flex items-center justify-between">
        {saveMsg ? (
          <p
            className="font-condensed text-[12px]"
            style={{ color: saveMsg.startsWith('Error') ? '#ef0e30' : '#22c55e' }}
          >
            {saveMsg}
          </p>
        ) : (
          <span />
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="font-condensed font-bold uppercase tracking-wide text-[12px] rounded px-6 py-2.5 transition-all disabled:opacity-50"
          style={{ backgroundColor: accentColor, color: '#ffffff' }}
        >
          {saving ? 'Saving…' : `Save ${blocks.length} Block${blocks.length !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  )
}
