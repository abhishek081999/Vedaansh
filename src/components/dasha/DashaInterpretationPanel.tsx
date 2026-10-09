'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/dasha/DashaInterpretationPanel.tsx
//  Active Vimshottari MD/AD narrative + chart-conditioned flags
// ─────────────────────────────────────────────────────────────

import React, { useMemo, useState } from 'react'
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
  type VimshottariFlag,
  type VimshottariPeriodAnalysis,
} from '@/lib/engine/dasha/vimshottariAnalysis'
import {
  getVimshottariAntarHint,
  getVimshottariInterpretation,
  isBeneficVimNature,
  isMaleficVimNature,
  VIMSHOTTARI_RESULT_HIERARCHY,
  type VimshottariInterpretation,
  type VimshottariNature,
} from '@/lib/engine/dasha/vimshottariInterpretations'
import { planMeetsUiGate } from '@/lib/ui/planGate'
import { Button } from '@/components/ui/primitives/Button'

export interface VimshottariInterpretationPanelProps {
  nodes: DashaNode[]
  grahas: GrahaData[]
  ascRashi: Rashi
  shadbala?: ShadbalaResult | null
  ashtakavarga?: AshtakavargaResult | null
  navamshaGrahas?: GrahaData[] | null
  /** Detailed "More" interpretation is Gold+ */
  userPlan?: UserPlan
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

function PlanetCard({
  data,
  levelLabel,
  snapLine,
  antarHint,
  defaultExpanded = false,
  canExpandDetails,
}: {
  data: VimshottariInterpretation
  levelLabel: string
  snapLine?: string | null
  antarHint?: string | null
  defaultExpanded?: boolean
  canExpandDetails: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded && canExpandDetails)
  const planet = GRAHA_NAMES[data.lord] ?? data.lord
  const borderColor = isMaleficVimNature(data.nature)
    ? 'var(--rose)'
    : isBeneficVimNature(data.nature)
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
            {data.years} {data.years === 1 ? 'Year' : 'Years'} · {data.keyTheme}
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
              <Line label="Primary" value={data.primaryPositive} />
              <Line label="Secondary" value={data.secondaryBenefits} />
            </Section>
            <Section title="Mind & Phases">
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
              {antarHint && <Line label="This Antar" value={antarHint} />}
            </Section>
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

function snapLabel(analysis: VimshottariPeriodAnalysis, which: 'maha' | 'antar'): string | null {
  const s = which === 'maha' ? analysis.mahadasha : analysis.antardasha
  if (!s) return null
  const bits: string[] = []
  if (s.housesRuled.length) bits.push(`Rules H${s.housesRuled.join(', H')}`)
  if (s.house != null) bits.push(`placed H${s.house}`)
  if (s.dignity) bits.push(s.dignity)
  if (s.shadbalaBand) bits.push(`Shadbala ${s.shadbalaBand}`)
  if (s.bavBindus != null) bits.push(`BAV ${s.bavBindus}`)
  if (s.arohiniKind === 'arohini') bits.push('Arohini')
  if (s.arohiniKind === 'avarohini') bits.push('Avarohini')
  if (s.isRetro) bits.push('Retro')
  if (s.isYogakaraka) bits.push('Yogakaraka')
  if (s.isMaraka) bits.push('Maraka hardship')
  return bits.length ? bits.join(' · ') : null
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
}: VimshottariInterpretationPanelProps) {
  const canExpandDetails = planMeetsUiGate(userPlan, 'gold')

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

  if (activePath.length < 1) return null

  const maha = getVimshottariInterpretation(activePath[0].lord)
  const antar = activePath[1] ? getVimshottariInterpretation(activePath[1].lord) : null
  if (!maha) return null

  const antarHint = activePath[1]
    ? getVimshottariAntarHint(activePath[0].lord, activePath[1].lord)
    : null

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
        </div>
      )}

      <PlanetCard
        data={maha}
        levelLabel="Active Mahadasha"
        snapLine={analysis ? snapLabel(analysis, 'maha') : null}
        defaultExpanded={false}
        canExpandDetails={canExpandDetails}
      />
      {antar && (
        <PlanetCard
          data={antar}
          levelLabel="Active Antardasha"
          snapLine={analysis ? snapLabel(analysis, 'antar') : null}
          antarHint={antarHint}
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
