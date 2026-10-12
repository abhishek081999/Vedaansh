'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/numerology/NumerologyGridSection.tsx
//  Lo Shu / Vedic grid, planes (yogas), missing & repeated
//  numbers with remedies, and Kua number directions
// ─────────────────────────────────────────────────────────────

import React, { useState } from 'react'
import type { NumerologyReport, GridSource } from '@/lib/engine/numerology/calc'
import { NUMBER_PROFILES, type CoreNumber } from '@/lib/engine/numerology/data'
import { KeyValue, SectionCard, gridColumns } from './shared'

const SOURCE_LABEL: Record<GridSource, string> = {
  dob: 'birth date digit',
  moolank: 'Moolank',
  bhagyank: 'Bhagyank',
  kua: 'Kua',
}

const PLANE_COLOR = { complete: 'var(--teal)', partial: 'var(--gold)', empty: 'var(--rose)' } as const

export function NumerologyGridSection({ report }: { report: NumerologyReport }) {
  const [layout, setLayout] = useState<'vedic' | 'loshu'>('vedic')
  const { grid, kua } = report
  const cells = layout === 'vedic' ? grid.layout.vedic : grid.layout.loshu

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={gridColumns(300)}>
        <SectionCard
          title={layout === 'vedic' ? 'Vedic Grid' : 'Lo Shu Grid'}
          subtitle={`Built from your birth date digits, Moolank, Bhagyank${kua ? ' and Kua' : ''}. Zeros are ignored.`}
        >
          <div className="tab-bar" role="tablist" aria-label="Grid layout">
            {(['vedic', 'loshu'] as const).map(l => (
              <button
                key={l}
                type="button"
                role="tab"
                aria-selected={layout === l}
                className={`tab-btn${layout === l ? ' active' : ''}`}
                onClick={() => setLayout(l)}
              >
                {l === 'vedic' ? 'Vedic Square' : 'Lo Shu'}
              </button>
            ))}
          </div>

          <div
            role="grid"
            aria-label="Numerology grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, maxWidth: 320, width: '100%', margin: '0 auto' }}
          >
            {cells.flat().map(n => <GridCell key={n} n={n} count={grid.counts[n]} sources={grid.sources[n]} />)}
          </div>
          <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            {layout === 'vedic'
              ? 'Vedic square: Jupiter · Sun · Mars across the top, Ketu at the centre.'
              : 'Lo Shu magic square: every row, column and diagonal sums to 15.'}
          </p>
        </SectionCard>

        <SectionCard title="Planes & Yogas" subtitle="Complete lines (all three numbers present) form a yoga; empty lines indicate an area to develop.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {grid.planes.map(p => (
              <div key={p.id} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                <span style={{
                  fontSize: '0.6rem', fontWeight: 700, padding: '2px 7px', borderRadius: 99, marginTop: 2,
                  border: `1px solid ${PLANE_COLOR[p.status]}`, color: PLANE_COLOR[p.status],
                  textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: 78, textAlign: 'center',
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  {p.status}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {p.name} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({p.numbers.join('-')})</span>
                  </div>
                  {p.status !== 'partial' && (
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                      {p.status === 'complete' ? p.complete : p.empty}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div style={gridColumns(300)}>
        <SectionCard title="Missing Numbers" subtitle="Absent energies and their classical remedies." accent="var(--rose)">
          {grid.missing.length === 0 ? (
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--teal)' }}>All nine numbers are present — a rare, well-rounded grid.</p>
          ) : grid.missing.map(m => (
            <div key={m.number} style={{ display: 'flex', gap: '0.6rem' }}>
              <CellBadge n={m.number} />
              <div style={{ fontSize: '0.78rem', lineHeight: 1.5 }}>
                <div style={{ color: 'var(--text-secondary)' }}>{m.effect}</div>
                <div style={{ color: 'var(--text-muted)' }}><strong style={{ color: 'var(--text-gold)' }}>Remedy:</strong> {m.remedy}</div>
              </div>
            </div>
          ))}
        </SectionCard>

        <SectionCard title="Present & Repeated Numbers" subtitle="Repetition intensifies a number — beneficial up to a point, then excessive.">
          {grid.repeated.map(r => (
            <div key={r.number} style={{ display: 'flex', gap: '0.6rem' }}>
              <CellBadge n={r.number} />
              <div style={{ fontSize: '0.78rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>{r.count}×</strong> {r.effect}
              </div>
            </div>
          ))}
        </SectionCard>
      </div>

      {kua ? (
        <SectionCard title={`Kua Number ${kua.value} — ${kua.group} Group`} subtitle={`Directional number from solar year ${kua.solarYear} and gender. Face these directions while working, sleeping and meeting.`}>
          <div style={gridColumns(150)}>
            <KeyValue label="Success & wealth" value={kua.directions.success} />
            <KeyValue label="Health" value={kua.directions.health} />
            <KeyValue label="Love & relationships" value={kua.directions.love} />
            <KeyValue label="Personal growth" value={kua.directions.growth} />
          </div>
        </SectionCard>
      ) : (
        <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-muted)' }}>
          Select male or female above to include the Kua number and its favourable directions.
        </p>
      )}
    </div>
  )
}

function GridCell({ n, count, sources }: { n: CoreNumber; count: number; sources: GridSource[] }) {
  const present = count > 0
  const extra = sources.filter(s => s !== 'dob').map(s => SOURCE_LABEL[s])
  const title = present
    ? `${n} × ${count} (${NUMBER_PROFILES[n].planet})${extra.length ? ` — includes ${extra.join(', ')}` : ''}`
    : `${n} missing (${NUMBER_PROFILES[n].planet})`
  return (
    <div
      role="gridcell"
      title={title}
      aria-label={title}
      style={{
        aspectRatio: '1', borderRadius: 'var(--r-md)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
        background: present ? 'var(--gold-faint)' : 'var(--surface-2)',
        border: `1px solid ${present ? 'var(--border-bright)' : 'var(--border-soft)'}`,
      }}
    >
      <span style={{
        fontFamily: 'var(--font-display)', fontSize: 'clamp(1rem, 4vw, 1.5rem)', fontWeight: 600, letterSpacing: '0.08em',
        color: present ? 'var(--text-gold)' : 'var(--text-muted)', opacity: present ? 1 : 0.35,
      }}>
        {present ? String(n).repeat(count) : n}
      </span>
      <span style={{ fontSize: '0.56rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {NUMBER_PROFILES[n].planet}
      </span>
    </div>
  )
}

function CellBadge({ n }: { n: CoreNumber }) {
  return (
    <span style={{
      width: 28, height: 28, borderRadius: 'var(--r-sm)', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--surface-2)', border: '1px solid var(--border-soft)',
      fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-gold)',
    }}>
      {n}
    </span>
  )
}
