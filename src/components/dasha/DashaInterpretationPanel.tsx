'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/dasha/DashaInterpretationPanel.tsx
//  Active Vimshottari MD/AD narrative + chart-conditioned flags
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Lock } from 'lucide-react'
import type {
  AshtakavargaResult,
  DashaNode,
  GrahaData,
  Rashi,
  ShadbalaResult,
  UserPlan,
} from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'
import {
  analyzeVimshottariPeriod,
  type LifeAreaActivation,
  type VimshottariFlag,
  type VimshottariPeriodAnalysis,
} from '@/lib/engine/dasha/vimshottariAnalysis'
import {
  analyzeDashaGochar,
  type DashaGocharOverlay,
} from '@/lib/engine/dasha/vimshottariGochar'
import {
  buildUpcomingVimshottariTimeline,
  formatShortDate,
  type UpcomingDashaItem,
  type VimshottariUpcomingTimeline,
} from '@/lib/engine/dasha/vimshottariTimeline'
import {
  buildVimshottariAntarInterpretation,
  buildVimshottariPratyantarInterpretation,
  durationMsToYears,
  formatVimshottariDurationYears,
  getVimshottariAntarHint,
  getVimshottariInterpretation,
  isBeneficVimNature,
  isMaleficVimNature,
  VIMSHOTTARI_RESULT_HIERARCHY,
  type VimshottariInterpretation,
  type VimshottariNature,
} from '@/lib/engine/dasha/vimshottariInterpretations'
import {
  getVimshottariAntarScriptures,
  getVimshottariMahaScriptures,
  getVimshottariPratyantarScriptures,
  type ScripturePassage,
} from '@/lib/engine/dasha/vimshottariScriptures'
import type { TransitPosition } from '@/lib/engine/transits'
import { planMeetsUiGate } from '@/lib/ui/planGate'
import { Button } from '@/components/ui/primitives/Button'

const DASHA_EVENT_LABELS = [
  'Job change',
  'Move / home',
  'Relationship',
  'Health',
  'Travel',
  'Finance',
  'Other',
] as const

export interface VimshottariInterpretationPanelProps {
  nodes: DashaNode[]
  grahas: GrahaData[]
  ascRashi: Rashi
  shadbala?: ShadbalaResult | null
  ashtakavarga?: AshtakavargaResult | null
  navamshaGrahas?: GrahaData[] | null
  /** Detailed "More" interpretation is Gold+ */
  userPlan?: UserPlan
  /** Saved chart id — enables Platinum dasha event notes */
  chartId?: string | null
}

function natureColor(nature: VimshottariNature): string {
  if (nature === 'Highly Benefic' || nature === 'Benefic') return 'var(--teal)'
  if (nature === 'Mixed') return 'var(--gold)'
  return 'var(--rose)'
}

function natureBg(nature: VimshottariNature): string {
  if (isBeneficVimNature(nature)) return 'rgba(78,205,196,0.08)'
  if (nature === 'Mixed') return 'var(--gold-faint)'
  return 'rgba(224,123,142,0.08)'
}

function flagToneColor(tone: VimshottariFlag['tone']): string {
  if (tone === 'supportive') return 'var(--teal)'
  if (tone === 'caution') return 'var(--rose)'
  if (tone === 'mixed') return 'var(--gold)'
  return 'var(--text-muted)'
}

function flagToneBg(tone: VimshottariFlag['tone']): string {
  if (tone === 'supportive') return 'rgba(78,205,196,0.1)'
  if (tone === 'caution') return 'rgba(224,123,142,0.1)'
  if (tone === 'mixed') return 'var(--gold-faint)'
  return 'var(--surface-3)'
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

function MixBar({ analysis }: { analysis: VimshottariPeriodAnalysis }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', background: 'var(--surface-3)' }}>
        <div style={{ width: `${analysis.favorableShare}%`, background: 'var(--teal)' }} title={`Favorable ${analysis.favorableShare}%`} />
        <div style={{ width: `${analysis.neutralShare}%`, background: 'var(--gold)' }} title={`Neutral ${analysis.neutralShare}%`} />
        <div style={{ width: `${analysis.challengingShare}%`, background: 'var(--rose)' }} title={`Challenging ${analysis.challengingShare}%`} />
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
        <span style={{ color: 'var(--teal)' }}>Favorable {analysis.favorableShare}%</span>
        <span style={{ color: 'var(--gold)' }}>Neutral {analysis.neutralShare}%</span>
        <span style={{ color: 'var(--rose)' }}>Challenging {analysis.challengingShare}%</span>
      </div>
    </div>
  )
}

function ScriptureBlock({ passages }: { passages: ScripturePassage[] }) {
  if (!passages.length) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
      {passages.map((p, i) => (
        <div
          key={`${p.source}-${i}`}
          style={{
            padding: '0.55rem 0.65rem',
            background: 'var(--surface-2)',
            borderRadius: 6,
            borderLeft: '2px solid var(--gold)',
          }}
        >
          <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-gold)', marginBottom: 4 }}>
            {p.source}{p.ref ? ` · ${p.ref}` : ''}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {p.text}
          </div>
        </div>
      ))}
      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', lineHeight: 1.4, fontStyle: 'italic' }}>
        Educational paraphrases of classical teaching — not verbatim scripture, not predictive certainty.
      </div>
    </div>
  )
}

function PlanetCard({
  data,
  levelLabel,
  snapLine,
  antarHint,
  durationLabel,
  scriptures = [],
  isAntar = false,
  defaultExpanded = true,
  canExpandDetails,
}: {
  data: VimshottariInterpretation
  levelLabel: string
  snapLine?: string | null
  antarHint?: string | null
  /** Override years display (e.g. antardasha months) */
  durationLabel?: string | null
  scriptures?: ScripturePassage[]
  isAntar?: boolean
  defaultExpanded?: boolean
  canExpandDetails: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const planet = GRAHA_NAMES[data.lord] ?? data.lord
  const borderColor = isMaleficVimNature(data.nature)
    ? 'var(--rose)'
    : isBeneficVimNature(data.nature)
      ? 'var(--teal)'
      : 'var(--gold-faint)'
  const durationText = durationLabel
    ?? `${data.years} ${data.years === 1 ? 'Year' : 'Years'}`

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
              {data.title}
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
            {durationText} · {data.keyTheme}
          </div>
          {snapLine && (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 4 }}>{snapLine}</div>
          )}
          {!expanded && (
            <p style={{ margin: '0.45rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              {data.primaryPositive}
            </p>
          )}
        </div>
        <span
          style={{
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: '0.65rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            paddingTop: 2,
            whiteSpace: 'nowrap',
          }}
        >
          {!canExpandDetails && !expanded && <Lock size={12} aria-hidden />}
          {expanded ? '▴ Less' : '▾ More'}
        </span>
      </button>

      {expanded && (
        canExpandDetails ? (
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
              <Line label={isAntar ? 'This Antar' : 'Primary'} value={data.primaryPositive} />
              <Line label="Secondary" value={data.secondaryBenefits} />
            </Section>
            <Section title={isAntar ? 'Antar Phases' : 'Mind & Phases'}>
              <Line label="State" value={data.psychologicalState} />
              <Line label="Start" value={data.phaseStart} />
              <Line label="Middle" value={data.phaseMiddle} />
              <Line label="End" value={data.phaseEnd} />
            </Section>
            <Section title="Risks & Caution">
              {data.negativeEffects
                ? <Line label="Negatives" value={data.negativeEffects} />
                : <div style={{ fontSize: '0.82rem', color: 'var(--teal)' }}>Few classical negatives when well placed.</div>}
              {data.healthCaution && <Line label="Health" value={data.healthCaution} />}
            </Section>
            <Section title="Life events">
              <Line label="Themes" value={data.lifeEvents} />
              {antarHint && !isAntar && <Line label="This Antar" value={antarHint} />}
              {isAntar && (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4, marginTop: 4 }}>
                  Sub-period only — does not replace the active mahadasha story.
                </div>
              )}
            </Section>
            {scriptures.length > 0 && (
              <div style={{ gridColumn: '1 / -1' }}>
                <Section title={isAntar ? 'Scriptures · Antardasha' : 'Scriptures · Mahadasha'}>
                  <ScriptureBlock passages={scriptures} />
                </Section>
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              padding: '0.85rem 1rem 1rem',
              borderTop: '1px solid var(--border-soft)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '0.55rem',
            }}
          >
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              <Lock size={14} aria-hidden style={{ verticalAlign: '-2px', marginRight: 6 }} />
              Full mahadasha / antardasha interpretation requires Gold.
            </div>
            <Link href="/pricing" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="sm">View plans</Button>
            </Link>
          </div>
        )
      )}
    </div>
  )
}

function snapLabel(
  analysis: VimshottariPeriodAnalysis,
  which: 'maha' | 'antar' | 'pratya',
): string | null {
  const s =
    which === 'maha'
      ? analysis.mahadasha
      : which === 'antar'
        ? analysis.antardasha
        : analysis.pratyantardasha
  if (!s) return null
  const bits: string[] = []
  if (s.housesRuled.length) bits.push(`Rules H${s.housesRuled.join(', H')}`)
  if (s.house != null) bits.push(`placed H${s.house}`)
  if (s.dignity) bits.push(`D1 ${s.dignity}`)
  if (s.d9Dignity) bits.push(`D9 ${s.d9Dignity}`)
  if (s.isVargottama) bits.push('Vargottama')
  if (s.shadbalaBand) bits.push(`Shadbala ${s.shadbalaBand}`)
  if (s.bavBindus != null) bits.push(`BAV ${s.bavBindus}`)
  if (s.arohiniKind === 'arohini') bits.push('Arohini')
  if (s.arohiniKind === 'avarohini') bits.push('Avarohini')
  if (s.isRetro) bits.push('Retro')
  if (s.isYogakaraka) bits.push('Yogakaraka')
  if (s.charaKaraka) bits.push(s.charaKaraka)
  if (s.isMaraka) bits.push('Maraka hardship')
  return bits.length ? bits.join(' · ') : null
}

function TimelineBlock({ timeline }: { timeline: VimshottariUpcomingTimeline }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
        {timeline.headline}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {timeline.upcomingAntars.map((item, i) => (
          <TimelineRow key={`a-${item.lord}-${item.startIso}-${i}`} item={item} />
        ))}
        {timeline.nextMaha && (
          <TimelineRow item={timeline.nextMaha} emphasize />
        )}
      </div>
    </div>
  )
}

function TimelineRow({ item, emphasize }: { item: UpcomingDashaItem; emphasize?: boolean }) {
  const color = flagToneColor(
    item.tone === 'caution' ? 'caution' : item.tone === 'supportive' ? 'supportive' : 'mixed',
  )
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.35rem 0.65rem',
        alignItems: 'baseline',
        fontSize: '0.7rem',
        lineHeight: 1.4,
        padding: emphasize ? '0.35rem 0.45rem' : 0,
        background: emphasize ? 'var(--surface-2)' : 'transparent',
        borderRadius: emphasize ? 4 : 0,
      }}
    >
      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.label}</span>
      <span style={{ color: 'var(--text-muted)' }}>
        {formatShortDate(item.startIso)} → {formatShortDate(item.endIso)}
      </span>
      <span style={{ color, fontWeight: 600 }}>{item.toneLabel}</span>
      {item.hint && (
        <span style={{ color: 'var(--text-secondary)', flexBasis: '100%' }}>{item.hint}</span>
      )}
    </div>
  )
}

function lifeAreaColor(strength: LifeAreaActivation['strength']): string {
  if (strength === 'high') return 'var(--teal)'
  if (strength === 'medium') return 'var(--gold)'
  if (strength === 'low') return 'var(--text-secondary)'
  return 'var(--text-muted)'
}

function LifeAreaGrid({ areas, headline }: { areas: LifeAreaActivation[]; headline: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{headline}</div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(9.5rem, 1fr))',
          gap: 6,
        }}
      >
        {areas.map(a => (
          <div
            key={a.id}
            title={a.note}
            style={{
              padding: '0.45rem 0.55rem',
              borderRadius: 6,
              border: `1px solid ${lifeAreaColor(a.strength)}`,
              background: a.strength === 'quiet' ? 'var(--surface-2)' : 'var(--surface-1)',
              opacity: a.strength === 'quiet' ? 0.65 : 1,
            }}
          >
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: lifeAreaColor(a.strength) }}>
              {a.label}
              <span style={{ fontWeight: 500, marginLeft: 4, textTransform: 'uppercase', fontSize: '0.58rem', letterSpacing: '0.04em' }}>
                {a.strength}
              </span>
            </div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.35 }}>
              {a.note}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function GocharBlock({ overlay }: { overlay: DashaGocharOverlay | null }) {
  if (!overlay) {
    return (
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
        Loading dasha × gochar…
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
        {overlay.summary}
        <span style={{ color: 'var(--text-muted)' }}> · as of {overlay.asOfLabel}</span>
      </div>
      {overlay.hits.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {overlay.hits.map(h => (
            <span
              key={h.id}
              title={h.detail}
              style={{
                fontSize: '0.62rem',
                fontWeight: 700,
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
                color: flagToneColor(h.tone === 'caution' ? 'caution' : h.tone === 'supportive' ? 'supportive' : 'mixed'),
                background: flagToneBg(h.tone === 'caution' ? 'caution' : h.tone === 'supportive' ? 'supportive' : 'mixed'),
                border: `1px solid ${flagToneColor(h.tone === 'caution' ? 'caution' : h.tone === 'supportive' ? 'supportive' : 'mixed')}`,
                borderRadius: 4,
                padding: '0.2rem 0.45rem',
                cursor: 'help',
              }}
            >
              {h.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/** @deprecated Prefer VimshottariInterpretationPanel — alias kept for clarity */
export function DashaInterpretationPanel(props: VimshottariInterpretationPanelProps) {
  return <VimshottariInterpretationPanel {...props} />
}

export function VimshottariInterpretationPanel({
  nodes,
  grahas,
  ascRashi,
  shadbala,
  ashtakavarga,
  navamshaGrahas,
  userPlan = 'free',
  chartId = null,
}: VimshottariInterpretationPanelProps) {
  const canExpandDetails = planMeetsUiGate(userPlan, 'gold')
  const canTagEvents = planMeetsUiGate(userPlan, 'platinum')
  const [transitPositions, setTransitPositions] = useState<TransitPosition[] | null>(null)
  const [eventLabel, setEventLabel] = useState<string>(DASHA_EVENT_LABELS[0])
  const [eventNote, setEventNote] = useState('')
  const [eventSaving, setEventSaving] = useState(false)
  const [eventMsg, setEventMsg] = useState<string | null>(null)

  const activePath = useMemo(() => {
    const path: DashaNode[] = []
    let current = nodes.find(n => n.isCurrent)
    while (current) {
      path.push(current)
      current = current.children.find(c => c.isCurrent)
    }
    return path
  }, [nodes])

  const analysis = useMemo(
    () => analyzeVimshottariPeriod({
      nodes,
      ascRashi,
      grahas,
      shadbala,
      ashtakavarga,
      navamshaGrahas,
    }),
    [nodes, ascRashi, grahas, shadbala, ashtakavarga, navamshaGrahas],
  )

  const timeline = useMemo(
    () => buildUpcomingVimshottariTimeline(nodes),
    [nodes],
  )

  useEffect(() => {
    let cancelled = false
    const asOf = new Date().toISOString().slice(0, 10)
    fetch(`/api/transit?ascRashi=${ascRashi}&months=1&startDate=${asOf}`)
      .then(r => r.json())
      .then((body: { success?: boolean; currentPositions?: TransitPosition[] }) => {
        if (cancelled) return
        if (body?.success && Array.isArray(body.currentPositions)) {
          setTransitPositions(body.currentPositions)
        } else {
          setTransitPositions([])
        }
      })
      .catch(() => {
        if (!cancelled) setTransitPositions([])
      })
    return () => { cancelled = true }
  }, [ascRashi])

  const gochar = useMemo(() => {
    if (!transitPositions || activePath.length < 1) return null
    return analyzeDashaGochar({
      ascRashi,
      natalGrahas: grahas,
      mahaLord: activePath[0].lord,
      antarLord: activePath[1]?.lord ?? null,
      pratyaLord: activePath[2]?.lord ?? null,
      transitPositions,
    })
  }, [transitPositions, activePath, ascRashi, grahas])

  if (activePath.length < 1) return null

  const maha = getVimshottariInterpretation(activePath[0].lord)
  if (!maha) return null

  const antarNode = activePath[1] ?? null
  const pratyaNode = activePath[2] ?? null
  const antarHint = antarNode
    ? getVimshottariAntarHint(activePath[0].lord, antarNode.lord)
    : null
  const antarYears = antarNode ? durationMsToYears(antarNode.durationMs) : 0
  const antar = antarNode
    ? buildVimshottariAntarInterpretation(activePath[0].lord, antarNode.lord, antarYears)
    : null
  const antarDurationLabel = antarNode
    ? formatVimshottariDurationYears(antarYears)
    : null
  const pratyaYears = pratyaNode ? durationMsToYears(pratyaNode.durationMs) : 0
  const pratya = antarNode && pratyaNode
    ? buildVimshottariPratyantarInterpretation(
      activePath[0].lord,
      antarNode.lord,
      pratyaNode.lord,
      pratyaYears,
    )
    : null
  const pratyaDurationLabel = pratyaNode
    ? formatVimshottariDurationYears(pratyaYears)
    : null
  const mahaScriptures = getVimshottariMahaScriptures(activePath[0].lord)
  const antarScriptures = antarNode
    ? getVimshottariAntarScriptures(activePath[0].lord, antarNode.lord)
    : []
  const pratyaScriptures = antarNode && pratyaNode
    ? getVimshottariPratyantarScriptures(activePath[0].lord, antarNode.lord, pratyaNode.lord)
    : []

  async function saveDashaEvent() {
    if (!chartId || !canTagEvents || eventSaving) return
    const text = eventNote.trim()
    if (!text) {
      setEventMsg('Add a short note first.')
      return
    }
    setEventSaving(true)
    setEventMsg(null)
    const mahaLord = activePath[0].lord
    const antarLord = antarNode?.lord
    const periodStart = antarNode
      ? new Date(antarNode.start).toISOString()
      : new Date(activePath[0].start).toISOString()
    const periodEnd = antarNode
      ? new Date(antarNode.end).toISOString()
      : new Date(activePath[0].end).toISOString()
    const content = `[Dasha · ${mahaLord}${antarLord ? `/${antarLord}` : ''} · ${eventLabel}] ${text}`
    try {
      const res = await fetch('/api/chart/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chartId,
          content,
          dashaTag: {
            mahaLord,
            antarLord,
            periodStart,
            periodEnd,
            eventLabel,
          },
        }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok || !body?.success) {
        setEventMsg(body?.error || 'Could not save note.')
      } else {
        setEventNote('')
        setEventMsg('Saved to chart notes.')
      }
    } catch {
      setEventMsg('Could not save note.')
    } finally {
      setEventSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      <div className="label-caps" style={{ fontSize: '0.62rem', color: 'var(--text-muted)', padding: '0 0.15rem' }}>
        Vimshottari Interpretation
      </div>

      {analysis && (
        <div
          className="card"
          style={{
            padding: '0.85rem 1rem',
            border: '1px solid var(--gold-faint)',
            background: 'linear-gradient(135deg, var(--surface-1) 0%, rgba(201,168,76,0.06) 100%)',
          }}
        >
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: '0.35rem' }}>
            {analysis.insight.headline}
          </div>
          <ul style={{ margin: '0 0 0.65rem', paddingLeft: '1.1rem', fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            {analysis.insight.bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
          {analysis.insight.watch && (
            <div style={{ fontSize: '0.72rem', color: 'var(--rose)', marginBottom: '0.65rem', lineHeight: 1.4 }}>
              Watch: {analysis.insight.watch}
            </div>
          )}
          <MixBar analysis={analysis} />
          {analysis.d9Note && (
            <div style={{ marginTop: '0.65rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              <span style={{ color: 'var(--text-gold)', fontWeight: 600 }}>Navamsha: </span>
              {analysis.d9Note}
            </div>
          )}
          {analysis.charaKarakaNote && (
            <div style={{ marginTop: '0.55rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              <span style={{ color: 'var(--text-gold)', fontWeight: 600 }}>Chara Karaka: </span>
              {analysis.charaKarakaNote}
            </div>
          )}
          {(analysis.lagnaSpecialNote || analysis.yogakarakaNote) && (
            <div style={{ marginTop: '0.65rem', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
              {analysis.yogakarakaNote && (
                <div><span style={{ color: 'var(--text-gold)', fontWeight: 600 }}>Yogakaraka: </span>{analysis.yogakarakaNote}</div>
              )}
              {analysis.lagnaSpecialNote && (
                <div style={{ marginTop: 4 }}>{analysis.lagnaSpecialNote}</div>
              )}
            </div>
          )}
          {analysis.flags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: '0.75rem' }}>
              {analysis.flags.map(f => (
                <span
                  key={f.id}
                  title={f.detail}
                  style={{
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase',
                    color: flagToneColor(f.tone),
                    background: flagToneBg(f.tone),
                    border: `1px solid ${flagToneColor(f.tone)}`,
                    borderRadius: 4,
                    padding: '0.2rem 0.45rem',
                    cursor: 'help',
                  }}
                >
                  {f.label}
                </span>
              ))}
            </div>
          )}
          {analysis.flags.some(f => f.tone === 'caution') && (
            <ul style={{ margin: '0.65rem 0 0', paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
              {analysis.flags.filter(f => f.tone === 'caution').slice(0, 4).map(f => (
                <li key={`d-${f.id}`}>{f.detail}</li>
              ))}
            </ul>
          )}

          {canExpandDetails && (
            <>
              <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-soft)' }}>
                <div className="label-caps" style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                  Upcoming timeline
                </div>
                <TimelineBlock timeline={timeline} />
              </div>
              <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-soft)' }}>
                <div className="label-caps" style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                  Dispositor chain · who delivers
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  <div><span style={{ color: 'var(--text-gold)', fontWeight: 600 }}>MD: </span>{analysis.dispositorChains.mahadasha.summary}</div>
                  {analysis.dispositorChains.antardasha && (
                    <div style={{ marginTop: 4 }}>
                      <span style={{ color: 'var(--text-gold)', fontWeight: 600 }}>AD: </span>
                      {analysis.dispositorChains.antardasha.summary}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-soft)' }}>
                <div className="label-caps" style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                  Life areas · activated now
                </div>
                <LifeAreaGrid areas={analysis.lifeAreas.areas} headline={analysis.lifeAreas.headline} />
              </div>
              <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-soft)' }}>
                <div className="label-caps" style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                  Dasha × Gochar
                </div>
                <GocharBlock overlay={gochar} />
              </div>
            </>
          )}
        </div>
      )}

      {canTagEvents && (
        <div
          className="card"
          style={{
            padding: '0.85rem 1rem',
            border: '1px solid var(--border-soft)',
            background: 'var(--surface-1)',
          }}
        >
          <div className="label-caps" style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: 6 }}>
            Event tag · Platinum
          </div>
          {!chartId ? (
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              Save this chart to attach dasha-dated notes, or manage clients in{' '}
              <Link href="/clients" style={{ color: 'var(--gold)' }}>CRM</Link>.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Tag against current {activePath[0].lord}
                {antarNode ? `/${antarNode.lord}` : ''} period
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <select
                  value={eventLabel}
                  onChange={e => setEventLabel(e.target.value)}
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.35rem 0.5rem',
                    borderRadius: 4,
                    border: '1px solid var(--border)',
                    background: 'var(--surface-2)',
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                  }}
                >
                  {DASHA_EVENT_LABELS.map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
                <input
                  value={eventNote}
                  onChange={e => setEventNote(e.target.value)}
                  placeholder="What happened / note…"
                  maxLength={500}
                  style={{
                    flex: '1 1 12rem',
                    fontSize: '0.75rem',
                    padding: '0.35rem 0.5rem',
                    borderRadius: 4,
                    border: '1px solid var(--border)',
                    background: 'var(--surface-2)',
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                  }}
                />
                <Button variant="secondary" size="sm" onClick={() => void saveDashaEvent()} disabled={eventSaving}>
                  {eventSaving ? 'Saving…' : 'Save note'}
                </Button>
              </div>
              {eventMsg && (
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{eventMsg}</div>
              )}
              <Link href="/clients" style={{ fontSize: '0.68rem', color: 'var(--gold)', textDecoration: 'none' }}>
                Open client CRM →
              </Link>
            </div>
          )}
        </div>
      )}

      <PlanetCard
        data={maha}
        levelLabel="Active Mahadasha"
        snapLine={analysis ? snapLabel(analysis, 'maha') : null}
        scriptures={mahaScriptures}
        defaultExpanded
        canExpandDetails={canExpandDetails}
      />
      {antar && (
        <PlanetCard
          data={antar}
          levelLabel="Active Antardasha"
          snapLine={analysis ? snapLabel(analysis, 'antar') : null}
          antarHint={antarHint}
          durationLabel={antarDurationLabel}
          scriptures={antarScriptures}
          isAntar
          defaultExpanded
          canExpandDetails={canExpandDetails}
        />
      )}
      {pratya && (
        <PlanetCard
          data={pratya}
          levelLabel="Active Pratyantardasha"
          snapLine={analysis ? snapLabel(analysis, 'pratya') : null}
          durationLabel={pratyaDurationLabel}
          scriptures={pratyaScriptures}
          isAntar
          defaultExpanded
          canExpandDetails={canExpandDetails}
        />
      )}

      <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.4, padding: '0 0.15rem' }}>
        {VIMSHOTTARI_RESULT_HIERARCHY}
      </p>
      <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.4, padding: '0 0.15rem' }}>
        Educational timing overlay — every dasha mixes supportive, neutral, and challenging themes.
        Health notes are soft cautions, not medical advice. Maraka means hardship pressure, not a life-ending forecast.
      </p>
    </div>
  )
}
