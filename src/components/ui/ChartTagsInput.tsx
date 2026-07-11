// ─────────────────────────────────────────────────────────────
//  src/components/ui/ChartTagsInput.tsx
//  Add/remove hashtag labels on charts
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useState } from 'react'
import { formatTagLabel } from '@/lib/chart/tags'

interface ChartTagsInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  compact?: boolean
}

export function ChartTagsInput({ tags, onChange, compact = false }: ChartTagsInputProps) {
  const [draft, setDraft] = useState('')

  function addTag(raw: string) {
    const trimmed = raw.trim()
    if (!trimmed) return
    const norm = trimmed.replace(/^#+/, '').toLowerCase()
    if (!norm || tags.includes(norm)) {
      setDraft('')
      return
    }
    onChange([...tags, norm])
    setDraft('')
  }

  function removeTag(tag: string) {
    onChange(tags.filter(t => t !== tag))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(draft)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '0.35rem' : '0.5rem' }}>
      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {tags.map(t => (
          <span key={t} className="badge" style={{
            fontSize: compact ? '0.62rem' : '0.68rem',
            padding: '0.1rem 0.45rem',
            background: 'rgba(201,168,76,0.06)',
            color: 'var(--gold)',
            border: '1px solid rgba(201,168,76,0.12)',
            display: 'flex', alignItems: 'center', gap: '0.2rem',
          }}>
            {formatTagLabel(t)}
            <button
              type="button"
              onClick={() => removeTag(t)}
              aria-label={`Remove ${formatTagLabel(t)}`}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, lineHeight: 1 }}
            >
              ×
            </button>
          </span>
        ))}
        {tags.length < 20 && (
          <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', flex: compact ? undefined : 1, minWidth: compact ? undefined : 140 }}>
            <input
              className="input"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add hashtag"
              style={{
                fontSize: compact ? '0.72rem' : '0.8rem',
                padding: compact ? '0.2rem 0.45rem' : '0.35rem 0.55rem',
                height: compact ? 26 : 32,
                width: compact ? 110 : '100%',
                minWidth: 100,
              }}
            />
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              style={{ fontSize: '0.65rem', padding: '0 0.4rem', whiteSpace: 'nowrap' }}
              onClick={() => addTag(draft)}
            >
              + Add
            </button>
          </div>
        )}
      </div>
      {!compact && (
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          Use hashtags like <strong>#career</strong> or <strong>#family</strong> to find charts later.
        </span>
      )}
    </div>
  )
}
