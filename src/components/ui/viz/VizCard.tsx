// ─────────────────────────────────────────────────────────────
//  src/components/ui/viz/VizCard.tsx
//  Titled frame for a visual + optional legend row
// ─────────────────────────────────────────────────────────────

import React from 'react'

export interface LegendItem {
  label: string
  color: string
  dashed?: boolean
}

export function VizCard({
  title,
  caption,
  legend,
  children,
  style,
}: {
  title?: string
  caption?: string
  legend?: LegendItem[]
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <figure
      style={{
        margin: 0,
        padding: '1rem 1.1rem',
        background: 'var(--surface-1)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        minWidth: 0,
        ...style,
      }}
    >
      {(title || caption) && (
        <figcaption style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          {title && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <span aria-hidden style={{ width: 3, height: 14, background: 'var(--gold)', borderRadius: 2 }} />
              <span className="label-caps" style={{ fontSize: '0.72rem', color: 'var(--text-primary)' }}>{title}</span>
            </span>
          )}
          {caption && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>{caption}</span>}
        </figcaption>
      )}
      {children}
      {legend && legend.length > 0 && <Legend items={legend} />}
    </figure>
  )
}

export function Legend({ items }: { items: LegendItem[] }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem 0.9rem' }}>
      {items.map((it) => (
        <span key={it.label} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
          <span
            aria-hidden
            style={{
              width: 10,
              height: it.dashed ? 0 : 10,
              borderRadius: 2,
              background: it.dashed ? 'transparent' : it.color,
              borderTop: it.dashed ? `2px dashed ${it.color}` : undefined,
            }}
          />
          {it.label}
        </span>
      ))}
    </div>
  )
}
