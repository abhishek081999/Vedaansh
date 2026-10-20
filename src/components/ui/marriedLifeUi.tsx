'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/marriedLifeUi.tsx
//  Shared meters and note cards for married-life readings
// ─────────────────────────────────────────────────────────────

import React from 'react'
import type { LifeTone, MarriedLifeNote } from '@/lib/engine/marriedLifeAnalysis'
import type { JayaBhavaReading } from '@/lib/engine/jayaBhava'
import type { MarriageClassReading } from '@/lib/engine/marriageClass'
import type { MarriageHousesReading } from '@/lib/engine/marriageHouses'
import type { SeventhLordReading } from '@/lib/engine/seventhLord'
import type { KarmicDebtReading } from '@/lib/engine/karmicDebt'
import type { VenusJupiterReading } from '@/lib/engine/venusJupiterBond'
import type { MarriageGocharReading } from '@/lib/engine/marriageGochar'
import type { PartnerNatureReading } from '@/lib/engine/partnerNature'
import type { DivorceEnergyReading } from '@/lib/engine/divorceEnergy'

export const LIFE_TONE: Record<LifeTone, string> = {
  supportive: 'var(--teal)',
  caution: 'var(--rose)',
  mixed: 'var(--text-gold)',
}

export function ScoreMeter({
  label,
  planet,
  score,
  summary,
}: {
  label: string
  planet: string
  score: number
  summary: string
}) {
  const color = score >= 7 ? 'var(--teal)' : score <= 3 ? 'var(--rose)' : 'var(--text-gold)'
  return (
    <div style={{
      padding: '0.85rem 0.9rem',
      background: 'var(--surface-2)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'baseline' }}>
        <strong style={{ fontSize: '0.82rem' }}>{label}</strong>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{planet}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', margin: '0.4rem 0' }}>
        <div style={{ flex: 1, height: 6, background: 'var(--surface-3)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${score * 10}%`, height: '100%', background: color, borderRadius: 3 }} />
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color }}>{score}/10</span>
      </div>
      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{summary}</p>
    </div>
  )
}

export function NoteCards({ notes }: { notes: MarriedLifeNote[] }) {
  if (!notes.length) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
      {notes.map(n => (
        <div key={n.id} style={{
          padding: '0.75rem 0.85rem',
          borderLeft: `3px solid ${LIFE_TONE[n.tone]}`,
          background: 'var(--surface-2)',
          borderRadius: '0 var(--r-sm) var(--r-sm) 0',
        }}>
          <div style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: 4 }}>{n.title}</div>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{n.detail}</p>
        </div>
      ))}
    </div>
  )
}

export function JayaSections({ reading, showPrinciples = true }: { reading: JayaBhavaReading; showPrinciples?: boolean }) {
  const groups: { label: string; notes: MarriedLifeNote[] }[] = [
    { label: 'Seventh lord', notes: reading.lord },
    { label: 'Planets in the 7th', notes: reading.occupants },
    { label: 'How the bond behaves', notes: reading.dynamics },
    { label: 'More than one bond', notes: reading.multiplicity },
    { label: 'When marriage is marked', notes: reading.timing },
    { label: 'Strain on the marriage', notes: reading.strain },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 700 }}>{reading.headline}</p>
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{reading.summary}</p>
      {groups.map(group => group.notes.length ? (
        <div key={group.label}>
          <SectionLabel>{group.label}</SectionLabel>
          <NoteCards notes={group.notes} />
        </div>
      ) : null)}
      {showPrinciples ? (
        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{reading.principles}</p>
      ) : null}
    </div>
  )
}

export function MarriageClassSections({ reading, showPrinciples = true }: { reading: MarriageClassReading; showPrinciples?: boolean }) {
  const groups: { label: string; notes: MarriedLifeNote[] }[] = [
    { label: 'Birth chart and Navamsha', notes: reading.frame },
    { label: 'What kind of marriage', notes: reading.kind },
    { label: 'Feeling, attraction, and protection', notes: reading.pillars },
    { label: 'The pattern', notes: reading.pattern },
    { label: 'Old debt or soul bond', notes: reading.bond },
    { label: 'Birth stars', notes: reading.nakshatra },
    { label: 'Deeper chart, marriage point, children', notes: reading.navamsha },
    { label: 'When it cannot restart', notes: reading.strain },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 700 }}>{reading.headline}</p>
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{reading.summary}</p>
      {groups.map(group => group.notes.length ? (
        <div key={group.label}>
          <SectionLabel>{group.label}</SectionLabel>
          <NoteCards notes={group.notes} />
        </div>
      ) : null)}
      {showPrinciples ? (
        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{reading.principles}</p>
      ) : null}
    </div>
  )
}

export function MarriageHousesSections({ reading, showPrinciples = true }: { reading: MarriageHousesReading; showPrinciples?: boolean }) {
  const groups: { label: string; notes: MarriedLifeNote[] }[] = [
    { label: 'The eight houses', notes: reading.houses },
    { label: 'How the houses group', notes: reading.groups },
    { label: 'What has to activate', notes: reading.activation },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 700 }}>{reading.headline}</p>
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{reading.summary}</p>
      {groups.map(group => group.notes.length ? (
        <div key={group.label}>
          <SectionLabel>{group.label}</SectionLabel>
          <NoteCards notes={group.notes} />
        </div>
      ) : null)}
      {showPrinciples ? (
        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{reading.principles}</p>
      ) : null}
    </div>
  )
}

export function SeventhLordSections({ reading, showPrinciples = true }: { reading: SeventhLordReading; showPrinciples?: boolean }) {
  const groups: { label: string; notes: MarriedLifeNote[] }[] = [
    { label: 'Where the 7th lord sits', notes: reading.placement },
    { label: 'Combinations', notes: reading.combinations },
    { label: 'Age band', notes: reading.timing },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 700 }}>{reading.headline}</p>
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{reading.summary}</p>
      {groups.map(group => group.notes.length ? (
        <div key={group.label}>
          <SectionLabel>{group.label}</SectionLabel>
          <NoteCards notes={group.notes} />
        </div>
      ) : null)}
      {showPrinciples ? (
        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{reading.principles}</p>
      ) : null}
    </div>
  )
}

export function KarmicDebtSections({ reading, showPrinciples = true }: { reading: KarmicDebtReading; showPrinciples?: boolean }) {
  const groups: { label: string; notes: MarriedLifeNote[] }[] = [
    { label: 'The account', notes: reading.debt },
    { label: 'Whether it can finish', notes: reading.release },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 700 }}>{reading.headline}</p>
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{reading.summary}</p>
      {groups.map(group => group.notes.length ? (
        <div key={group.label}>
          <SectionLabel>{group.label}</SectionLabel>
          <NoteCards notes={group.notes} />
        </div>
      ) : null)}
      {showPrinciples ? (
        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{reading.principles}</p>
      ) : null}
    </div>
  )
}

export function DivorceEnergySections({ reading, showPrinciples = true }: { reading: DivorceEnergyReading; showPrinciples?: boolean }) {
  const groups: { label: string; notes: MarriedLifeNote[] }[] = [
    { label: 'The three energies', notes: reading.energies },
    { label: 'What can speed it', notes: reading.triggers },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 700 }}>{reading.headline}</p>
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{reading.summary}</p>
      {groups.map(group => group.notes.length ? (
        <div key={group.label}>
          <SectionLabel>{group.label}</SectionLabel>
          <NoteCards notes={group.notes} />
        </div>
      ) : null)}
      {showPrinciples ? (
        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{reading.principles}</p>
      ) : null}
    </div>
  )
}

export function PartnerNatureSections({ reading, showPrinciples = true }: { reading: PartnerNatureReading; showPrinciples?: boolean }) {
  const groups: { label: string; notes: MarriedLifeNote[] }[] = [
    { label: 'From this chart', notes: reading.portrait },
    { label: 'Planets on the marriage', notes: reading.planets },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 700 }}>{reading.headline}</p>
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{reading.summary}</p>
      {groups.map(group => group.notes.length ? (
        <div key={group.label}>
          <SectionLabel>{group.label}</SectionLabel>
          <NoteCards notes={group.notes} />
        </div>
      ) : null)}
      {showPrinciples ? (
        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{reading.principles}</p>
      ) : null}
    </div>
  )
}

export function MarriageGocharSections({ reading, showPrinciples = true }: { reading: MarriageGocharReading; showPrinciples?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 700 }}>{reading.headline}</p>
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{reading.summary}</p>
      <NoteCards notes={reading.window} />
      {showPrinciples ? (
        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{reading.principles}</p>
      ) : null}
    </div>
  )
}

export function VenusJupiterSections({ reading, showPrinciples = true }: { reading: VenusJupiterReading; showPrinciples?: boolean }) {
  const groups: { label: string; notes: MarriedLifeNote[] }[] = [
    { label: 'The pattern', notes: reading.scenario },
    { label: 'What can steady it', notes: reading.support },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 700 }}>{reading.headline}</p>
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{reading.summary}</p>
      {groups.map(group => group.notes.length ? (
        <div key={group.label}>
          <SectionLabel>{group.label}</SectionLabel>
          <NoteCards notes={group.notes} />
        </div>
      ) : null)}
      {showPrinciples ? (
        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{reading.principles}</p>
      ) : null}
    </div>
  )
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="label-caps" style={{ margin: '0.2rem 0 0.55rem', fontSize: '0.72rem' }}>{children}</h3>
  )
}
