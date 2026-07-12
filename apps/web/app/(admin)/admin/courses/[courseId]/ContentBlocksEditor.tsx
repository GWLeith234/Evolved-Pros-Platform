'use client'

import { useState } from 'react'

// Content-block shapes — kept byte-identical to the former academy
// ContentBuilder so persisted lessons.content_blocks need no migration.
export type VideoBlock     = { type: 'video';     url: string; title: string; duration: string }
export type PullquoteBlock = { type: 'pullquote'; text: string; source: string }
export type TextBlock      = { type: 'text';      content: string }
export type ExerciseBlock  = { type: 'exercise';  question: string; options: string[]; correct: number; open_ended: boolean }
export type QuizBlock      = { type: 'quiz';      question: string; options: string[]; correct: number }

export type ContentBlock = VideoBlock | PullquoteBlock | TextBlock | ExerciseBlock | QuizBlock
type BlockType = ContentBlock['type']

/** Coerce arbitrary jsonb into a typed block list, dropping anything unknown. */
export function asContentBlocks(value: unknown): ContentBlock[] {
  if (!Array.isArray(value)) return []
  const valid: BlockType[] = ['video', 'pullquote', 'text', 'exercise', 'quiz']
  return value.filter(
    (b): b is ContentBlock =>
      !!b && typeof b === 'object' && valid.includes((b as { type?: unknown }).type as BlockType),
  )
}

function defaultBlock(type: BlockType): ContentBlock {
  switch (type) {
    case 'video':     return { type, url: '', title: '', duration: '' }
    case 'pullquote': return { type, text: '', source: '' }
    case 'text':      return { type, content: '' }
    case 'exercise':  return { type, question: '', options: ['', '', '', ''], correct: 0, open_ended: false }
    case 'quiz':      return { type, question: '', options: ['', '', '', ''], correct: 0 }
  }
}

const INPUT_CLASS = 'w-full font-body text-[13px] text-[#1b3c5a] rounded border px-3 py-2 focus:outline-none transition-colors'
const INPUT_STYLE = { borderColor: 'rgba(27,60,90,0.18)' }

function Inp({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <p className="font-condensed font-bold uppercase tracking-[0.14em] text-[9px] text-[#7a8a96] mb-1">{label}</p>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={INPUT_CLASS} style={INPUT_STYLE} />
    </div>
  )
}

function Area({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div>
      <p className="font-condensed font-bold uppercase tracking-[0.14em] text-[9px] text-[#7a8a96] mb-1">{label}</p>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} className={`${INPUT_CLASS} resize-none`} style={INPUT_STYLE} />
    </div>
  )
}

function updateOptions<T extends { options: string[] }>(block: T, i: number, v: string): T {
  const options = [...block.options]
  options[i] = v
  return { ...block, options }
}

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
  label, question, options, correct, open_ended, onChangeQuestion, onChangeOption, onChangeCorrect, onChangeOpenEnded,
}: {
  label: string; question: string; options: string[]; correct: number; open_ended?: boolean
  onChangeQuestion: (v: string) => void
  onChangeOption: (i: number, v: string) => void
  onChangeCorrect: (i: number) => void
  onChangeOpenEnded?: (v: boolean) => void
}) {
  return (
    <div className="space-y-3">
      <Area label={label} value={question} onChange={onChangeQuestion} rows={2} />
      <div className="space-y-2">
        <p className="font-condensed font-bold uppercase tracking-[0.14em] text-[9px] text-[#7a8a96]">Options (select correct)</p>
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <input type="radio" name={`correct-${label}-${i}`} checked={correct === i} onChange={() => onChangeCorrect(i)} className="flex-shrink-0" />
            <input type="text" value={opt} onChange={e => onChangeOption(i, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + i)}`} className={`flex-1 ${INPUT_CLASS}`} style={INPUT_STYLE} />
          </div>
        ))}
      </div>
      {onChangeOpenEnded !== undefined && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={open_ended ?? false} onChange={e => onChangeOpenEnded(e.target.checked)} />
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
      onChangeOption={(i, v) => onChange(updateOptions(block, i, v))}
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
      onChangeOption={(i, v) => onChange(updateOptions(block, i, v))}
      onChangeCorrect={i => onChange({ ...block, correct: i })}
    />
  )
}

const TYPE_LABELS: Record<BlockType, string> = {
  video: 'VIDEO',
  pullquote: 'PULL QUOTE',
  text: 'TEXT',
  exercise: 'EXERCISE',
  quiz: 'QUIZ',
}

/**
 * Controlled content-block editor. Owns no persistence — the parent form holds
 * the block array and includes it in its own save payload. This is the former
 * academy ContentBuilder's editing surface, minus the standalone publish/save
 * controls (the merged lesson editor owns those now).
 */
export function ContentBlocksEditor({
  blocks,
  onChange,
  accentColor,
}: {
  blocks: ContentBlock[]
  onChange: (blocks: ContentBlock[]) => void
  accentColor: string
}) {
  const [addType, setAddType] = useState<BlockType>('text')

  function updateBlock(i: number, b: ContentBlock) {
    onChange(blocks.map((x, idx) => idx === i ? b : x))
  }

  function deleteBlock(i: number) {
    onChange(blocks.filter((_, idx) => idx !== i))
  }

  function moveBlock(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= blocks.length) return
    const next = [...blocks]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <div className="space-y-3">
      {blocks.length === 0 ? (
        <div
          className="rounded-lg px-5 py-8 text-center"
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
                  <button type="button" onClick={() => moveBlock(i, -1)} disabled={i === 0} className="font-condensed text-[12px] text-[#7a8a96] hover:text-[#1b3c5a] disabled:opacity-30 transition-colors">↑</button>
                  <button type="button" onClick={() => moveBlock(i, 1)} disabled={i === blocks.length - 1} className="font-condensed text-[12px] text-[#7a8a96] hover:text-[#1b3c5a] disabled:opacity-30 transition-colors">↓</button>
                  <button type="button" onClick={() => deleteBlock(i)} className="font-condensed font-semibold text-[11px] text-[#ef0e30] hover:opacity-70 transition-opacity">Remove</button>
                </div>
              </div>
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

      <div
        className="flex items-center gap-3 rounded-lg px-5 py-4"
        style={{ backgroundColor: 'white', border: '1px solid rgba(27,60,90,0.1)' }}
      >
        <p className="font-condensed font-bold uppercase tracking-[0.14em] text-[9px] text-[#7a8a96] flex-shrink-0">Add Block</p>
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
          type="button"
          onClick={() => onChange([...blocks, defaultBlock(addType)])}
          className="font-condensed font-bold uppercase tracking-wide text-[11px] rounded px-4 py-2 flex-shrink-0 transition-all"
          style={{ backgroundColor: '#1b3c5a', color: 'white' }}
        >
          + Add
        </button>
      </div>
    </div>
  )
}
