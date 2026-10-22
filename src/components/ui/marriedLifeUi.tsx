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
import type { ClassicalMarriageReading } from '@/lib/engine/classicalMarriage'
import type { MarriageSynastryReading } from '@/lib/engine/marriageSynastry'
import type { MarriageCaseBrief } from '@/lib/engine/marriageCaseBrief'
import type { IntimateLife } from '@/lib/engine/intimateLife'
import type { MarriageKarmaReading } from '@/lib/engine/marriageKarma'
import type { VenusMarriageReading } from '@/lib/engine/venusMarriage'
import Link from 'next/link'

export const LIFE_TONE: Record<LifeTone, string> = {
  supportive: 'var(--teal)',
  caution: 'var(--rose)',
  mixed: 'var(--text-gold)',
}

const CLIENT_SAFE_STRIP = /\b(class reads?|classical line|yogas? marked)\b/gi

function softenNote(n: MarriedLifeNote, clientSafe: boolean): MarriedLifeNote {
  if (!clientSafe) return n
  const title = n.title
    .replace(/\bcaution\b/gi, 'note')
    .replace(/\bstrain\b/gi, 'tension')
    .replace(/\bdivorce\b/gi, 'separation risk')
  const detail = n.detail.replace(CLIENT_SAFE_STRIP, 'reading')
  return { ...n, title, detail, tone: n.tone === 'caution' ? 'mixed' : n.tone }
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

export function NoteCards({ notes, clientSafe = false }: { notes: MarriedLifeNote[]; clientSafe?: boolean }) {
  if (!notes.length) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
      {notes.map(raw => {
        const n = softenNote(raw, clientSafe)
        return (
          <div key={n.id} style={{
            padding: '0.75rem 0.85rem',
            borderLeft: `3px solid ${LIFE_TONE[n.tone]}`,
            background: 'var(--surface-2)',
            borderRadius: '0 var(--r-sm) var(--r-sm) 0',
          }}>
            <div style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: 4 }}>{n.title}</div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{n.detail}</p>
          </div>
        )
      })}
    </div>
  )
}

export function MuhurtaWindowLink({ from, to }: { from?: string; to?: string }) {
  if (!from) return null
  const href = `/muhurta?from=${encodeURIComponent(from)}${to ? `&to=${encodeURIComponent(to)}` : ''}`
  return (
    <Link
      href={href}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        fontSize: '0.78rem',
        fontWeight: 700,
        color: 'var(--text-gold)',
        textDecoration: 'none',
        padding: '0.45rem 0.75rem',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-sm)',
        background: 'var(--surface-2)',
        width: 'fit-content',
      }}
    >
      Search muhurta {from}{to ? ` → ${to}` : ''}
    </Link>
  )
}

export function CaseBriefCard({ brief, clientSafe = false }: { brief: MarriageCaseBrief; clientSafe?: boolean }) {
  return (
    <div style={{
      padding: '0.55rem 0.75rem',
      borderRadius: 'var(--r-md)',
      border: '1px solid var(--border)',
      borderLeft: '3px solid var(--text-gold)',
      background: 'var(--surface-1)',
    }}>
      <div className="label-caps" style={{ fontSize: '0.58rem', marginBottom: 4 }}>{brief.headline}</div>
      <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {brief.bullets.map((raw, i) => {
          const n = softenNote(raw, clientSafe)
          return (
            <li
              key={n.id}
              style={{
                display: 'flex',
                gap: '0.4rem',
                alignItems: 'baseline',
                padding: '0.22rem 0.4rem',
                borderRadius: 'var(--r-sm)',
                borderLeft: `2px solid ${LIFE_TONE[n.tone]}`,
                background: i % 2 === 0 ? 'var(--surface-2)' : 'transparent',
                fontSize: '0.72rem',
                lineHeight: 1.35,
              }}
            >
              <span style={{ flexShrink: 0, fontWeight: 800, color: 'var(--text-muted)', minWidth: '1rem' }}>{i + 1}.</span>
              <span style={{ minWidth: 0 }}>
                <strong style={{ color: 'var(--text-primary)' }}>{n.title}</strong>
                <span style={{ color: 'var(--text-muted)' }}> — </span>
                <span style={{ color: 'var(--text-secondary)' }}>{n.detail}</span>
              </span>
            </li>
          )
        })}
      </ol>
      {brief.muhurtaFrom ? (
        <div style={{ marginTop: '0.4rem' }}>
          <MuhurtaWindowLink from={brief.muhurtaFrom} to={brief.muhurtaTo} />
        </div>
      ) : null}
    </div>
  )
}

export function SynastrySections({ reading, clientSafe = false }: { reading: MarriageSynastryReading; clientSafe?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 700 }}>{reading.headline}</p>
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{reading.summary}</p>
      {reading.overlayAonB.length ? (
        <div>
          <SectionLabel>A into B</SectionLabel>
          <NoteCards notes={reading.overlayAonB} clientSafe={clientSafe} />
        </div>
      ) : null}
      {reading.overlayBonA.length ? (
        <div>
          <SectionLabel>B into A</SectionLabel>
          <NoteCards notes={reading.overlayBonA} clientSafe={clientSafe} />
        </div>
      ) : null}
      <div>
        <SectionLabel>D9 × D9</SectionLabel>
        <NoteCards notes={reading.d9} clientSafe={clientSafe} />
      </div>
    </div>
  )
}

export function IntimateLifeSections({ reading, clientSafe = false }: { reading: IntimateLife; clientSafe?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {reading.headline ? (
        <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 700 }}>{reading.headline}</p>
      ) : null}
      {reading.notes.length ? <NoteCards notes={reading.notes} clientSafe={clientSafe} /> : null}
      {reading.inlaws.length ? (
        <div>
          <SectionLabel>In-laws</SectionLabel>
          <NoteCards notes={reading.inlaws} clientSafe={clientSafe} />
        </div>
      ) : null}
      {reading.influence.length ? (
        <div>
          <SectionLabel>Mind</SectionLabel>
          <NoteCards notes={reading.influence} clientSafe={clientSafe} />
        </div>
      ) : null}
    </div>
  )
}

export function YogaChecklist({
  notes,
  filter,
  onFilterChange,
  clientSafe = false,
}: {
  notes: MarriedLifeNote[]
  filter: string
  onFilterChange: (v: string) => void
  clientSafe?: boolean
}) {
  const q = filter.trim().toLowerCase()
  const shown = q ? notes.filter(n => `${n.title} ${n.detail} ${n.id}`.toLowerCase().includes(q)) : notes
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
      <input
        aria-label="Filter yoga checklist"
        value={filter}
        onChange={e => onFilterChange(e.target.value)}
        placeholder="Filter yoga notes…"
        style={{
          padding: '0.4rem 0.55rem',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-sm)',
          background: 'var(--surface-2)',
          color: 'var(--text-primary)',
          fontSize: '0.78rem',
          fontFamily: 'inherit',
        }}
      />
      <NoteCards notes={shown} clientSafe={clientSafe} />
      {!shown.length ? (
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>No yoga notes match this filter.</p>
      ) : null}
    </div>
  )
}

export function JayaSections({ reading, showPrinciples = true, clientSafe = false }: { reading: JayaBhavaReading; showPrinciples?: boolean; clientSafe?: boolean }) {
  const groups: { label: string; notes: MarriedLifeNote[] }[] = [
    { label: 'Seventh lord', notes: reading.lord },
    { label: 'Planets in the 7th', notes: reading.occupants },
    { label: 'How the bond behaves', notes: reading.dynamics },
    { label: 'More than one bond', notes: reading.multiplicity },
    { label: 'When marriage is marked', notes: reading.timing },
    { label: 'Strain on the marriage', notes: reading.strain },
  ]
  const showCoach = showPrinciples && !clientSafe
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 700 }}>{reading.headline}</p>
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{reading.summary}</p>
      {groups.map(group => group.notes.length ? (
        <div key={group.label}>
          <SectionLabel>{group.label}</SectionLabel>
          <NoteCards notes={group.notes} clientSafe={clientSafe} />
        </div>
      ) : null)}
      {showCoach ? (
        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{reading.principles}</p>
      ) : null}
    </div>
  )
}

export function MarriageClassSections({ reading, showPrinciples = true, clientSafe = false }: { reading: MarriageClassReading; showPrinciples?: boolean; clientSafe?: boolean }) {
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
          <NoteCards notes={group.notes} clientSafe={clientSafe} />
        </div>
      ) : null)}
      {showPrinciples && !clientSafe ? (
        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{reading.principles}</p>
      ) : null}
    </div>
  )
}

export function MarriageHousesSections({ reading, showPrinciples = true, clientSafe = false }: { reading: MarriageHousesReading; showPrinciples?: boolean; clientSafe?: boolean }) {
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
          <NoteCards notes={group.notes} clientSafe={clientSafe} />
        </div>
      ) : null)}
      {showPrinciples && !clientSafe ? (
        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{reading.principles}</p>
      ) : null}
    </div>
  )
}

export function SeventhLordSections({ reading, showPrinciples = true, clientSafe = false }: { reading: SeventhLordReading; showPrinciples?: boolean; clientSafe?: boolean }) {
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
          <NoteCards notes={group.notes} clientSafe={clientSafe} />
        </div>
      ) : null)}
      {showPrinciples && !clientSafe ? (
        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{reading.principles}</p>
      ) : null}
    </div>
  )
}

export function KarmicDebtSections({ reading, showPrinciples = true, clientSafe = false }: { reading: KarmicDebtReading; showPrinciples?: boolean; clientSafe?: boolean }) {
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
          <NoteCards notes={group.notes} clientSafe={clientSafe} />
        </div>
      ) : null)}
      {showPrinciples && !clientSafe ? (
        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{reading.principles}</p>
      ) : null}
    </div>
  )
}

export function DivorceEnergySections({ reading, showPrinciples = true, clientSafe = false }: { reading: DivorceEnergyReading; showPrinciples?: boolean; clientSafe?: boolean }) {
  const groups: { label: string; notes: MarriedLifeNote[] }[] = [
    { label: 'The three energies', notes: reading.energies },
    { label: 'Cancellations and softeners', notes: reading.cancellations },
    { label: 'What can speed it', notes: reading.triggers },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 700 }}>{reading.headline}</p>
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{reading.summary}</p>
      {groups.map(group => group.notes.length ? (
        <div key={group.label}>
          <SectionLabel>{group.label}</SectionLabel>
          <NoteCards notes={group.notes} clientSafe={clientSafe} />
        </div>
      ) : null)}
      {showPrinciples && !clientSafe ? (
        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{reading.principles}</p>
      ) : null}
    </div>
  )
}

export function PartnerNatureSections({ reading, showPrinciples = true, clientSafe = false }: { reading: PartnerNatureReading; showPrinciples?: boolean; clientSafe?: boolean }) {
  const groups: { label: string; notes: MarriedLifeNote[] }[] = [
    { label: 'From this chart', notes: reading.portrait },
    { label: 'Appearance, family, direction', notes: reading.classical },
    { label: 'Planets on the marriage', notes: reading.planets },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 700 }}>{reading.headline}</p>
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{reading.summary}</p>
      {groups.map(group => group.notes.length ? (
        <div key={group.label}>
          <SectionLabel>{group.label}</SectionLabel>
          <NoteCards notes={group.notes} clientSafe={clientSafe} />
        </div>
      ) : null)}
      {showPrinciples && !clientSafe ? (
        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{reading.principles}</p>
      ) : null}
    </div>
  )
}

export function MarriageGocharSections({
  reading,
  showPrinciples = true,
  clientSafe = false,
}: {
  reading: MarriageGocharReading
  showPrinciples?: boolean
  clientSafe?: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 700 }}>{reading.headline}</p>
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{reading.summary}</p>
      <NoteCards notes={reading.window} clientSafe={clientSafe} />
      <MuhurtaWindowLink from={reading.muhurtaFrom} to={reading.muhurtaTo} />
      {showPrinciples && !clientSafe ? (
        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{reading.principles}</p>
      ) : null}
    </div>
  )
}

export function VenusJupiterSections({ reading, showPrinciples = true, clientSafe = false }: { reading: VenusJupiterReading; showPrinciples?: boolean; clientSafe?: boolean }) {
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
          <NoteCards notes={group.notes} clientSafe={clientSafe} />
        </div>
      ) : null)}
      {showPrinciples && !clientSafe ? (
        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{reading.principles}</p>
      ) : null}
    </div>
  )
}

export function ClassicalMarriageSections({ reading, clientSafe = false }: { reading: ClassicalMarriageReading; clientSafe?: boolean }) {
  const groups: { label: string; notes: MarriedLifeNote[] }[] = [
    { label: 'Spouse portrait', notes: reading.spouse },
    { label: 'Marriage timing', notes: reading.timing },
    { label: 'Happiness and strain', notes: reading.happiness },
    { label: 'More than one bond', notes: reading.remarriage },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 700 }}>{reading.headline}</p>
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{reading.summary}</p>
      {groups.map(group => group.notes.length ? (
        <div key={group.label}>
          <SectionLabel>{group.label}</SectionLabel>
          <NoteCards notes={group.notes} clientSafe={clientSafe} />
        </div>
      ) : null)}
    </div>
  )
}

export function MarriageKarmaSections({ reading, clientSafe = false }: { reading: MarriageKarmaReading; clientSafe?: boolean }) {
  const groups: { label: string; notes: MarriedLifeNote[] }[] = [
    { label: 'Debt and account', notes: reading.debt },
    { label: 'Venus in the debt frame', notes: reading.venus },
    { label: 'Period notes', notes: reading.period },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        Kind: <strong style={{ color: 'var(--text-secondary)' }}>{reading.flags.kind}</strong>
      </p>
      {groups.map(group => group.notes.length ? (
        <div key={group.label}>
          <SectionLabel>{group.label}</SectionLabel>
          <NoteCards notes={group.notes} clientSafe={clientSafe} />
        </div>
      ) : null)}
    </div>
  )
}

export function VenusMarriageSections({ reading, clientSafe = false }: { reading: VenusMarriageReading; clientSafe?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        Bridge: <strong style={{ color: 'var(--text-secondary)' }}>{reading.flags.bridge}</strong>
        {reading.flags.combust ? ' · combust' : ''}
        {reading.flags.venusDasha ? ' · Venus dasha' : ''}
      </p>
      <NoteCards notes={reading.venus} clientSafe={clientSafe} />
    </div>
  )
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="label-caps" style={{ margin: '0.2rem 0 0.55rem', fontSize: '0.72rem' }}>{children}</h3>
  )
}
