'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/dasha/YoginiInterpretationPanel.tsx
//  Active Yogini / Antar-Yogini narrative — collapsed by default
// ─────────────────────────────────────────────────────────────

import React, { useMemo, useState } from 'react'
import type { DashaNode } from '@/types/astrology'
import {
  getYoginiInterpretation,
  isBeneficNature,
  isMaleficNature,
  type YoginiInterpretation,
  type YoginiNature,
} from '@/lib/engine/dasha/yoginiInterpretations'

interface Props {
  nodes: DashaNode[]
}

const GRAHA_NAME: Record<string, string> = {
  Mo: 'Moon', Su: 'Sun', Ju: 'Jupiter', Ma: 'Mars',
  Me: 'Mercury', Sa: 'Saturn', Ve: 'Venus', Ra: 'Rahu',
}

function natureColor(nature: YoginiNature): string {
  if (nature === 'Highly Benefic' || nature === 'Benefic') return 'var(--teal)'
  if (nature === 'Mixed') return 'var(--gold)'
  return 'var(--rose)'
}

function natureBg(nature: YoginiNature): string {
  if (isBeneficNature(nature)) return 'rgba(78,205,196,0.08)'
  if (nature === 'Mixed') return 'var(--gold-faint)'
  return 'rgba(224,123,142,0.08)'
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <div className="label-caps" style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{title}</div>
      {children}
    </div>
  )
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{label}: </span>
      {value}
    </div>
  )
}

function YoginiCard({
  data,
  levelLabel,
  defaultExpanded = false,
}: {
  data: YoginiInterpretation
  levelLabel: string
  defaultExpanded?: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const planet = GRAHA_NAME[data.lord] ?? data.lord
  const borderColor = isMaleficNature(data.nature)
    ? 'var(--rose)'
    : isBeneficNature(data.nature)
      ? 'var(--teal)'
      : 'var(--gold-faint)'

  return (
    <div
      className="card"
      style={{
        padding: 0,
        overflow: 'hidden',
        border: `1px solid ${borderColor}`,
        background: `linear-gradient(135deg, var(--surface-1) 0%, ${natureBg(data.nature)} 100%)`,
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '0.75rem',
          padding: '0.85rem 1rem',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: 'inherit',
          color: 'inherit',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="label-caps" style={{ color: natureColor(data.nature), marginBottom: '0.3rem' }}>
            {levelLabel}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              {data.name}
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, marginLeft: '0.35rem' }}>
                ({planet})
              </span>
            </h3>
            <span
              style={{
                fontSize: '0.62rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: natureColor(data.nature),
                background: natureBg(data.nature),
                border: `1px solid ${natureColor(data.nature)}`,
                borderRadius: 4,
                padding: '0.15rem 0.4rem',
              }}
            >
              {data.nature}
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, fontWeight: 600 }}>
            {data.years} {data.years === 1 ? 'Year' : 'Years'} · {data.keyTheme}
          </div>
          {!expanded && (
            <p style={{ margin: '0.45rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              {data.primaryPositive}
            </p>
          )}
        </div>
        <span
          style={{
            flexShrink: 0,
            fontSize: '0.65rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            paddingTop: 2,
            whiteSpace: 'nowrap',
          }}
        >
          {expanded ? '▴ Less' : '▾ More'}
        </span>
      </button>

      {expanded && (
        <div
          style={{
            padding: '0 1rem 1rem',
            borderTop: '1px solid var(--border-soft)',
            paddingTop: '0.85rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.85rem',
          }}
        >
          <Section title="Positive Effects">
            <Line label="Primary" value={data.primaryPositive} />
            <Line label="Secondary" value={data.secondaryBenefits} />
          </Section>
          <Section title="Mind & Psychology">
            <Line label="State" value={data.psychologicalState} />
            <Line label="Activation" value={data.mentalActivation} />
          </Section>
          <Section title="Risks & Caution">
            {data.negativeEffects
              ? <Line label="Negatives" value={data.negativeEffects} />
              : <div style={{ fontSize: '0.82rem', color: 'var(--teal)' }}>Generally favorable — few classical negatives.</div>}
            {data.healthConcerns && <Line label="Health" value={data.healthConcerns} />}
            {data.otherRisks && <Line label="Other" value={data.otherRisks} />}
          </Section>
          <Section title="Triggers & Events">
            <Line label="Triggers" value={data.primaryTriggers} />
            <Line label="Life events" value={data.lifeEvents} />
          </Section>
        </div>
      )}
    </div>
  )
}

export function YoginiInterpretationPanel({ nodes }: Props) {
  const activePath = useMemo(() => {
    const path: DashaNode[] = []
    let current = nodes.find(n => n.isCurrent)
    while (current) {
      path.push(current)
      current = current.children.find(c => c.isCurrent)
    }
    return path
  }, [nodes])

  if (activePath.length < 1) return null

  const maha = getYoginiInterpretation(activePath[0].lord)
  const antar = activePath[1] ? getYoginiInterpretation(activePath[1].lord) : null
  if (!maha) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      <div className="label-caps" style={{ fontSize: '0.62rem', color: 'var(--text-muted)', padding: '0 0.15rem' }}>
        Yogini Interpretation
      </div>
      <YoginiCard data={maha} levelLabel="Active Yogini (Mahadasha)" />
      {antar && (
        <YoginiCard data={antar} levelLabel="Active Antar-Yogini" />
      )}
    </div>
  )
}
