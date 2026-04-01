'use client'

import { useState, useRef, useEffect } from 'react'

const CRIMSON = '#F87171'
const GOLD = '#C9A84C'

interface Item {
  id: string
  label: string
  description?: string
}

interface Props {
  title: string
  items: Item[]
  onSortComplete: (sortedIds: string[]) => void
  saveKey?: string
}

export function HierarchySort({ title, items: initialItems, onSortComplete, saveKey }: Props) {
  const [items, setItems] = useState<Item[]>(() => {
    // Restore from localStorage if saveKey provided
    if (saveKey && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(saveKey)
        if (saved) {
          const savedIds: string[] = JSON.parse(saved)
          const itemMap = new Map(initialItems.map(i => [i.id, i]))
          const restored = savedIds.map(id => itemMap.get(id)).filter((i): i is Item => !!i)
          // Include any new items not in saved order
          const extra = initialItems.filter(i => !savedIds.includes(i.id))
          if (restored.length > 0) return [...restored, ...extra]
        }
      } catch {/* ignore */}
    }
    return initialItems
  })

  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [saved, setSaved] = useState(false)
  const dragNode = useRef<HTMLDivElement | null>(null)

  // Restore from localStorage on client mount (avoids SSR mismatch)
  useEffect(() => {
    if (!saveKey) return
    try {
      const stored = localStorage.getItem(saveKey)
      if (stored) {
        const savedIds: string[] = JSON.parse(stored)
        const itemMap = new Map(initialItems.map(i => [i.id, i]))
        const restored = savedIds.map(id => itemMap.get(id)).filter((i): i is Item => !!i)
        const extra = initialItems.filter(i => !savedIds.includes(i.id))
        if (restored.length > 0) setItems([...restored, ...extra])
      }
    } catch {/* ignore */}
  }, [saveKey]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleDragStart(e: React.DragEvent<HTMLDivElement>, index: number) {
    setDragIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    // Small delay so the ghost image renders before we hide the original
    dragNode.current = e.currentTarget
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>, index: number) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (index !== overIndex) setOverIndex(index)
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>, dropIndex: number) {
    e.preventDefault()
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null)
      setOverIndex(null)
      return
    }
    const reordered = [...items]
    const [moved] = reordered.splice(dragIndex, 1)
    reordered.splice(dropIndex, 0, moved)
    setItems(reordered)
    setDragIndex(null)
    setOverIndex(null)
    setIsDirty(true)
    setSaved(false)
    onSortComplete(reordered.map(i => i.id))
  }

  function handleDragEnd() {
    setDragIndex(null)
    setOverIndex(null)
  }

  function handleSave() {
    if (!saveKey) return
    try {
      localStorage.setItem(saveKey, JSON.stringify(items.map(i => i.id)))
    } catch {/* ignore */}
    setSaved(true)
    setIsDirty(false)
  }

  return (
    <div style={{ backgroundColor: '#111926', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <p style={{
          fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
          fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase',
          color: GOLD, margin: '0 0 4px',
        }}>
          Ranking Exercise
        </p>
        <p style={{ color: '#faf9f7', fontSize: '15px', fontWeight: 600, margin: '0 0 4px' }}>
          {title}
        </p>
        <p style={{ color: 'rgba(250,249,247,0.35)', fontSize: '12px', margin: 0 }}>
          Drag to rank from most to least impactful for you.
        </p>
      </div>

      {/* Sortable list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: isDirty ? '16px' : '0' }}>
        {items.map((item, index) => {
          const isDragging = dragIndex === index
          const isOver = overIndex === index && dragIndex !== null && dragIndex !== index
          return (
            <div
              key={item.id}
              draggable
              onDragStart={e => handleDragStart(e, index)}
              onDragOver={e => handleDragOver(e, index)}
              onDrop={e => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px',
                backgroundColor: isDragging
                  ? 'rgba(248,113,113,0.08)'
                  : isOver
                  ? 'rgba(248,113,113,0.05)'
                  : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isOver ? CRIMSON + '44' : isDragging ? CRIMSON + '33' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: '6px', padding: '12px 14px',
                cursor: 'grab', opacity: isDragging ? 0.5 : 1,
                transition: 'background 0.15s, border-color 0.15s',
                userSelect: 'none',
              }}
            >
              {/* Rank number */}
              <span style={{
                flexShrink: 0,
                fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 900,
                fontSize: '16px', color: isDragging || isOver ? CRIMSON : 'rgba(250,249,247,0.15)',
                lineHeight: 1.3, minWidth: '20px', textAlign: 'center',
                transition: 'color 0.15s',
              }}>
                {index + 1}
              </span>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: '#faf9f7', fontSize: '13px', fontWeight: 600, margin: '0 0 2px', lineHeight: 1.4 }}>
                  {item.label}
                </p>
                {item.description && (
                  <p style={{ color: 'rgba(250,249,247,0.38)', fontSize: '12px', margin: 0, lineHeight: 1.5 }}>
                    {item.description}
                  </p>
                )}
              </div>

              {/* Drag handle */}
              <span style={{
                flexShrink: 0, color: isDragging ? CRIMSON : 'rgba(250,249,247,0.2)',
                fontSize: '16px', lineHeight: 1, paddingTop: '2px',
                transition: 'color 0.15s',
              }}>
                ⠿
              </span>
            </div>
          )
        })}
      </div>

      {/* Save / saved state */}
      {(isDirty || saved) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
          {isDirty && saveKey && (
            <button
              type="button"
              onClick={handleSave}
              style={{
                backgroundColor: GOLD, color: '#0A0F18',
                fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
                fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase',
                padding: '9px 20px', borderRadius: '4px', border: 'none', cursor: 'pointer',
              }}
            >
              Save Ranking
            </button>
          )}
          {saved && (
            <span style={{
              fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
              fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase',
              color: CRIMSON,
            }}>
              ✓ Ranking Saved
            </span>
          )}
        </div>
      )}
    </div>
  )
}
