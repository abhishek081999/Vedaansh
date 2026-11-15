'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/RashiClassificationGrid.tsx
//  Classical sign groups for one rashi (optionally at a degree).
//  All text comes from the engine in the active language, so this
//  needs no message namespace and works in any IntlScope.
// ─────────────────────────────────────────────────────────────
import React from 'react'
import { useLang } from '@/i18n/useLang'
import { classificationFieldLabel, getRashiClassification } from '@/lib/engine/rashiClassification'

export function RashiClassificationGrid({
  rashi,
  degree,
  title,
  showPlaces = true,
}: {
  rashi: number
  degree?: number
  title: string
  showPlaces?: boolean
}) {
  const { lang } = useLang()
  const c = getRashiClassification(rashi, degree, lang)
  if (!c) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 0 }}>
      <div style={heading}>{title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 150px), 1fr))', gap: '0.4rem' }}>
        {c.rows.map((row) => (
          <div
            key={row.field}
            style={{
              padding: '0.45rem 0.6rem',
              background: 'var(--surface-2)',
              borderRadius: 7,
              border: '1px solid var(--border-soft)',
              borderLeft: row.field === 'edge' && c.inEdgeDegrees ? '3px solid var(--rose)' : undefined,
              minWidth: 0,
            }}
          >
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{row.label}</div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.35, overflowWrap: 'anywhere' }}>{row.value}</div>
          </div>
        ))}
      </div>
      {showPlaces ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '0.5rem' }}>
          <List title={classificationFieldLabel('places', lang)} items={c.places} />
          <List title={classificationFieldLabel('bodyParts', lang)} items={c.bodyParts} />
        </div>
      ) : null}
    </div>
  )
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 700 }}>{title}</div>
      <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1.1rem', color: 'var(--text-secondary)', fontSize: '0.76rem', lineHeight: 1.5 }}>
        {items.map((x) => <li key={x}>{x}</li>)}
      </ul>
    </div>
  )
}

const heading: React.CSSProperties = {
  fontSize: '0.62rem',
  fontWeight: 700,
  color: 'var(--text-gold)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}
