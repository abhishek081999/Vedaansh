'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/ClassicalNotesList.tsx
//  Source-tagged classical Jyotish notes
// ─────────────────────────────────────────────────────────────
import React from 'react'
import {
  CLASSICAL_SOURCE_LABEL,
  type ClassicalNote,
} from '@/lib/engine/classicalInterpretations'

export function ClassicalNotesList({
  title = 'Classical sources',
  notes,
}: {
  title?: string
  notes: ClassicalNote[]
}) {
  if (!notes.length) return null
  return (
    <div>
      <div
        style={{
          fontSize: '0.62rem',
          fontWeight: 700,
          color: 'var(--text-gold)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: '0.45rem',
        }}
      >
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        {notes.map((n, i) => (
          <div
            key={`${n.source}-${i}`}
            style={{
              padding: '0.6rem 0.75rem',
              background: 'rgba(129,140,248,0.06)',
              borderRadius: 'var(--r-sm)',
              border: '1px solid rgba(129,140,248,0.22)',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.3rem', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: '0.58rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: '#818cf8',
                  background: 'rgba(129,140,248,0.12)',
                  border: '1px solid rgba(129,140,248,0.3)',
                  borderRadius: 4,
                  padding: '1px 6px',
                }}
              >
                {n.source}
              </span>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                {CLASSICAL_SOURCE_LABEL[n.source]}
                {n.ref ? ` · ${n.ref}` : ''}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {n.text}
            </p>
          </div>
        ))}
      </div>
      <p style={{ margin: '0.45rem 0 0', fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
        Paraphrased educational summaries from classical tradition—not a critical edition translation.
      </p>
    </div>
  )
}
