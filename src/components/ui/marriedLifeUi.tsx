'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/marriedLifeUi.tsx
//  Shared meters and note cards for married-life readings
// ─────────────────────────────────────────────────────────────

import { Link } from '@/i18n/navigation'
import React from 'react'
import { useTranslations } from 'next-intl'
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
import type { MarriageVivahReading } from '@/lib/engine/marriageVivah'
import type { MarriageMarsReading } from '@/lib/engine/marriageMars'
import { AlertTriangle, CheckCircle2, CircleDot, ClipboardList } from 'lucide-react'
import s from '@/components/ui/marriedLifeUi.module.css'

export const LIFE_TONE: Record<LifeTone, string> = {
  supportive: 'var(--teal)',
  caution: 'var(--rose)',
  mixed: 'var(--text-gold)',
}

/** Sets the --tone custom property that the module CSS reads. */
export function toneClass(tone: LifeTone): string {
  return tone === 'supportive' ? s.toneSupportive : tone === 'caution' ? s.toneCaution : s.toneMixed
}

const TONE_ICON = { supportive: CheckCircle2, caution: AlertTriangle, mixed: CircleDot } as const

function scoreTone(score: number): LifeTone {
  return score >= 7 ? 'supportive' : score <= 3 ? 'caution' : 'mixed'
}

type UiTranslator = ReturnType<typeof useTranslations>

function toneLabel(tone: LifeTone, tu: UiTranslator): string {
  if (tone === 'supportive') return tu('toneSupportive')
  if (tone === 'caution') return tu('toneCaution')
  return tu('toneMixed')
}

function scoreBand(tone: LifeTone, tu: UiTranslator): string {
  if (tone === 'supportive') return tu('bandStrong')
  if (tone === 'caution') return tu('bandTender')
  return tu('bandModerate')
}

const CLIENT_SAFE_STRIP = /\b(class reads?|classical line|yogas? marked)\b/gi

function softenNote(n: MarriedLifeNote, clientSafe: boolean): MarriedLifeNote {
  if (!clientSafe) return n
  const title = n.title
    .replace(/\bcaution\b/gi, 'note')
    .replace(/\bstrain\b/gi, 'tension')
    .replace(/\bdivorce\b/gi, 'separation risk')
  const detail = n.detail
    .replace(CLIENT_SAFE_STRIP, 'reading')
    .replace(/\bsexual harm\b/gi, 'harm in private life')
    .replace(/\babuse\b/gi, 'harm')
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
  const tu = useTranslations('relationshipMarriage.ui')
  const tone = scoreTone(score)
  const width = Math.max(0, Math.min(10, score)) * 10
  const band = scoreBand(tone, tu)
  return (
    <div className={`${s.meter} ${toneClass(tone)}`}>
      <div className={s.meterTop}>
        <div style={{ minWidth: 0 }}>
          <strong className={s.meterLabel}>{label}</strong>
          <span className={s.meterPlanet}>{planet}</span>
        </div>
        <div className={s.meterScore} aria-label={tu('scoreAria', { label, score, band })}>
          <span className={s.meterNumber}>{score}</span>
          <span className={s.meterOutOf}>/10</span>
          <span className={s.meterBand}>{band}</span>
        </div>
      </div>
      <div className={s.track} role="presentation">
        <div className={s.fill} style={{ width: `${width}%` }} />
      </div>
      <p className={s.meterSummary}>{summary}</p>
    </div>
  )
}

export function NoteCards({ notes, clientSafe = false }: { notes: MarriedLifeNote[]; clientSafe?: boolean }) {
  const tu = useTranslations('relationshipMarriage.ui')
  if (!notes.length) return null
  return (
    <div className={s.noteList}>
      {notes.map(raw => {
        const n = softenNote(raw, clientSafe)
        const Icon = TONE_ICON[n.tone]
        const tone = toneLabel(n.tone, tu)
        return (
          <article key={n.id} className={`${s.note} ${toneClass(n.tone)}`}>
            <header className={s.noteHead}>
              <span className={s.noteIcon} role="img" aria-label={tone} title={tone}>
                <Icon size={14} strokeWidth={2.2} aria-hidden />
              </span>
              <h4 className={s.noteTitle}>{n.title}</h4>
            </header>
            <p className={s.noteBody}>{n.detail}</p>
          </article>
        )
      })}
    </div>
  )
}

export function MuhurtaWindowLink({ from, to }: { from?: string; to?: string }) {
  const tu = useTranslations('relationshipMarriage.ui')
  if (!from) return null
  const href = `/muhurta?from=${encodeURIComponent(from)}${to ? `&to=${encodeURIComponent(to)}` : ''}`
  const label = to ? tu('muhurtaSearchRange', { from, to }) : tu('muhurtaSearch', { from })
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
      {label}
    </Link>
  )
}

export function CaseBriefCard({ brief, clientSafe = false }: { brief: MarriageCaseBrief; clientSafe?: boolean }) {
  const tu = useTranslations('relationshipMarriage.ui')
  return (
    <section className={s.brief} aria-label={tu('caseBriefAria')}>
      <div className={s.briefHead}>
        <ClipboardList size={15} aria-hidden />
        <h3 className={s.briefTitle}>{brief.headline}</h3>
      </div>
      <ol className={s.briefList}>
        {brief.bullets.map((raw, i) => {
          const n = softenNote(raw, clientSafe)
          return (
            <li key={n.id} className={`${s.briefItem} ${toneClass(n.tone)}`}>
              <span className={s.briefNum}>{i + 1}</span>
              <span className={s.briefText}>
                <strong>{n.title}</strong>
                <span style={{ color: 'var(--text-muted)' }}> — </span>
                {n.detail}
              </span>
            </li>
          )
        })}
      </ol>
      {brief.muhurtaFrom ? (
        <div className={s.briefLink}>
          <MuhurtaWindowLink from={brief.muhurtaFrom} to={brief.muhurtaTo} />
        </div>
      ) : null}
    </section>
  )
}

export function SynastrySections({ reading, clientSafe = false }: { reading: MarriageSynastryReading; clientSafe?: boolean }) {
  const ts = useTranslations('relationshipMarriage.sections')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 700 }}>{reading.headline}</p>
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{reading.summary}</p>
      {reading.overlayAonB.length ? (
        <div>
          <SectionLabel>{ts('synastryA')}</SectionLabel>
          <NoteCards notes={reading.overlayAonB} clientSafe={clientSafe} />
        </div>
      ) : null}
      {reading.overlayBonA.length ? (
        <div>
          <SectionLabel>{ts('synastryB')}</SectionLabel>
          <NoteCards notes={reading.overlayBonA} clientSafe={clientSafe} />
        </div>
      ) : null}
      <div>
        <SectionLabel>{ts('synastryD9')}</SectionLabel>
        <NoteCards notes={reading.d9} clientSafe={clientSafe} />
      </div>
    </div>
  )
}

export function IntimateLifeSections({ reading, clientSafe = false }: { reading: IntimateLife; clientSafe?: boolean }) {
  const ts = useTranslations('relationshipMarriage.sections')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {reading.headline ? (
        <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 700 }}>{reading.headline}</p>
      ) : null}
      {reading.notes.length ? <NoteCards notes={reading.notes} clientSafe={clientSafe} /> : null}
      {reading.inlaws.length ? (
        <div>
          <SectionLabel>{ts('inlaws')}</SectionLabel>
          <NoteCards notes={reading.inlaws} clientSafe={clientSafe} />
        </div>
      ) : null}
      {reading.influence.length ? (
        <div>
          <SectionLabel>{ts('mind')}</SectionLabel>
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
  const tu = useTranslations('relationshipMarriage.ui')
  const q = filter.trim().toLowerCase()
  const shown = q ? notes.filter(n => `${n.title} ${n.detail} ${n.id}`.toLowerCase().includes(q)) : notes
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
      <input
        aria-label={tu('yogaFilter')}
        value={filter}
        onChange={e => onFilterChange(e.target.value)}
        placeholder={tu('yogaFilter')}
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
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tu('yogaEmpty')}</p>
      ) : null}
    </div>
  )
}

export function JayaSections({ reading, showPrinciples = true, clientSafe = false }: { reading: JayaBhavaReading; showPrinciples?: boolean; clientSafe?: boolean }) {
  const tg = useTranslations('relationshipMarriage.groups.jaya')
  const groups: { key: 'lord' | 'occupants' | 'dynamics' | 'multiplicity' | 'timing' | 'strain'; notes: MarriedLifeNote[] }[] = [
    { key: 'lord', notes: reading.lord },
    { key: 'occupants', notes: reading.occupants },
    { key: 'dynamics', notes: reading.dynamics },
    { key: 'multiplicity', notes: reading.multiplicity },
    { key: 'timing', notes: reading.timing },
    { key: 'strain', notes: reading.strain },
  ]
  const showCoach = showPrinciples && !clientSafe
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 700 }}>{reading.headline}</p>
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{reading.summary}</p>
      {groups.map(group => group.notes.length ? (
        <div key={group.key}>
          <SectionLabel>{tg(group.key)}</SectionLabel>
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
  const tg = useTranslations('relationshipMarriage.groups.class')
  const groups: { key: 'frame' | 'kind' | 'pillars' | 'pattern' | 'bond' | 'nakshatra' | 'navamsha' | 'strain'; notes: MarriedLifeNote[] }[] = [
    { key: 'frame', notes: reading.frame },
    { key: 'kind', notes: reading.kind },
    { key: 'pillars', notes: reading.pillars },
    { key: 'pattern', notes: reading.pattern },
    { key: 'bond', notes: reading.bond },
    { key: 'nakshatra', notes: reading.nakshatra },
    { key: 'navamsha', notes: reading.navamsha },
    { key: 'strain', notes: reading.strain },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 700 }}>{reading.headline}</p>
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{reading.summary}</p>
      {groups.map(group => group.notes.length ? (
        <div key={group.key}>
          <SectionLabel>{tg(group.key)}</SectionLabel>
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
  const tg = useTranslations('relationshipMarriage.groups.houses')
  const groups: { key: 'houses' | 'groups' | 'activation'; notes: MarriedLifeNote[] }[] = [
    { key: 'houses', notes: reading.houses },
    { key: 'groups', notes: reading.groups },
    { key: 'activation', notes: reading.activation },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 700 }}>{reading.headline}</p>
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{reading.summary}</p>
      {groups.map(group => group.notes.length ? (
        <div key={group.key}>
          <SectionLabel>{tg(group.key)}</SectionLabel>
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
  const tg = useTranslations('relationshipMarriage.groups.lord')
  const groups: { key: 'placement' | 'combinations' | 'timing'; notes: MarriedLifeNote[] }[] = [
    { key: 'placement', notes: reading.placement },
    { key: 'combinations', notes: reading.combinations },
    { key: 'timing', notes: reading.timing },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 700 }}>{reading.headline}</p>
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{reading.summary}</p>
      {groups.map(group => group.notes.length ? (
        <div key={group.key}>
          <SectionLabel>{tg(group.key)}</SectionLabel>
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
  const tg = useTranslations('relationshipMarriage.groups.karmic')
  const groups: { key: 'debt' | 'release'; notes: MarriedLifeNote[] }[] = [
    { key: 'debt', notes: reading.debt },
    { key: 'release', notes: reading.release },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 700 }}>{reading.headline}</p>
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{reading.summary}</p>
      {groups.map(group => group.notes.length ? (
        <div key={group.key}>
          <SectionLabel>{tg(group.key)}</SectionLabel>
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
  const tg = useTranslations('relationshipMarriage.groups.divorce')
  const groups: { key: 'energies' | 'cancellations' | 'triggers'; notes: MarriedLifeNote[] }[] = [
    { key: 'energies', notes: reading.energies },
    { key: 'cancellations', notes: reading.cancellations },
    { key: 'triggers', notes: reading.triggers },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 700 }}>{reading.headline}</p>
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{reading.summary}</p>
      {groups.map(group => group.notes.length ? (
        <div key={group.key}>
          <SectionLabel>{tg(group.key)}</SectionLabel>
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
  const tg = useTranslations('relationshipMarriage.groups.partner')
  const groups: { key: 'portrait' | 'classical' | 'planets'; notes: MarriedLifeNote[] }[] = [
    { key: 'portrait', notes: reading.portrait },
    { key: 'classical', notes: reading.classical },
    { key: 'planets', notes: reading.planets },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 700 }}>{reading.headline}</p>
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{reading.summary}</p>
      {groups.map(group => group.notes.length ? (
        <div key={group.key}>
          <SectionLabel>{tg(group.key)}</SectionLabel>
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
  const tg = useTranslations('relationshipMarriage.groups.venusJupiter')
  const groups: { key: 'scenario' | 'support'; notes: MarriedLifeNote[] }[] = [
    { key: 'scenario', notes: reading.scenario },
    { key: 'support', notes: reading.support },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 700 }}>{reading.headline}</p>
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{reading.summary}</p>
      {groups.map(group => group.notes.length ? (
        <div key={group.key}>
          <SectionLabel>{tg(group.key)}</SectionLabel>
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
  const tg = useTranslations('relationshipMarriage.groups.classical')
  const groups: { key: 'spouse' | 'timing' | 'happiness' | 'remarriage'; notes: MarriedLifeNote[] }[] = [
    { key: 'spouse', notes: reading.spouse },
    { key: 'timing', notes: reading.timing },
    { key: 'happiness', notes: reading.happiness },
    { key: 'remarriage', notes: reading.remarriage },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 700 }}>{reading.headline}</p>
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{reading.summary}</p>
      {groups.map(group => group.notes.length ? (
        <div key={group.key}>
          <SectionLabel>{tg(group.key)}</SectionLabel>
          <NoteCards notes={group.notes} clientSafe={clientSafe} />
        </div>
      ) : null)}
    </div>
  )
}

export function MarriageKarmaSections({ reading, clientSafe = false }: { reading: MarriageKarmaReading; clientSafe?: boolean }) {
  const tg = useTranslations('relationshipMarriage.groups.karma')
  const tu = useTranslations('relationshipMarriage.ui')
  const groups: { key: 'debt' | 'venus' | 'period'; notes: MarriedLifeNote[] }[] = [
    { key: 'debt', notes: reading.debt },
    { key: 'venus', notes: reading.venus },
    { key: 'period', notes: reading.period },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        {tu('kindLabel')}{' '}
        <strong style={{ color: 'var(--text-secondary)' }}>{reading.flags.kind}</strong>
      </p>
      {groups.map(group => group.notes.length ? (
        <div key={group.key}>
          <SectionLabel>{tg(group.key)}</SectionLabel>
          <NoteCards notes={group.notes} clientSafe={clientSafe} />
        </div>
      ) : null)}
    </div>
  )
}

export function MarriageMarsSections({ reading, showPrinciples = true, clientSafe = false }: { reading: MarriageMarsReading; showPrinciples?: boolean; clientSafe?: boolean }) {
  const tg = useTranslations('relationshipMarriage.groups.mars')
  const groups: { key: 'level' | 'placements' | 'pairs'; notes: MarriedLifeNote[] }[] = [
    { key: 'level', notes: reading.level },
    { key: 'placements', notes: reading.placements },
    { key: 'pairs', notes: reading.pairs },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 700 }}>{reading.headline}</p>
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{reading.summary}</p>
      {groups.map(group => group.notes.length ? (
        <div key={group.key}>
          <SectionLabel>{tg(group.key)}</SectionLabel>
          <NoteCards notes={group.notes} clientSafe={clientSafe} />
        </div>
      ) : null)}
      {showPrinciples && !clientSafe ? (
        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{reading.principles}</p>
      ) : null}
    </div>
  )
}

export function MarriageVivahSections({ reading, showPrinciples = true, clientSafe = false }: { reading: MarriageVivahReading; showPrinciples?: boolean; clientSafe?: boolean }) {
  const tg = useTranslations('relationshipMarriage.groups.vivah')
  const groups: { key: 'harm' | 'pattern' | 'debt'; notes: MarriedLifeNote[] }[] = [
    { key: 'harm', notes: reading.harm },
    { key: 'pattern', notes: reading.pattern },
    { key: 'debt', notes: reading.debt },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 700 }}>{reading.headline}</p>
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{reading.summary}</p>
      {groups.map(group => group.notes.length ? (
        <div key={group.key}>
          <SectionLabel>{tg(group.key)}</SectionLabel>
          <NoteCards notes={group.notes} clientSafe={clientSafe} />
        </div>
      ) : null)}
      {showPrinciples && !clientSafe ? (
        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{reading.principles}</p>
      ) : null}
    </div>
  )
}

export function VenusMarriageSections({ reading, clientSafe = false }: { reading: VenusMarriageReading; clientSafe?: boolean }) {
  const tu = useTranslations('relationshipMarriage.ui')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        {tu('bridgeLabel')}{' '}
        <strong style={{ color: 'var(--text-secondary)' }}>{reading.flags.bridge}</strong>
        {reading.flags.combust ? tu('combustSuffix') : ''}
        {reading.flags.venusDasha ? tu('venusDashaSuffix') : ''}
      </p>
      <NoteCards notes={reading.venus} clientSafe={clientSafe} />
    </div>
  )
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className={s.sectionLabel}>{children}</h3>
  )
}
