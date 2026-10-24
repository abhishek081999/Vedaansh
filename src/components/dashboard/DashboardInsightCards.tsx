'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/dashboard/DashboardInsightCards.tsx
//  Natal-chart dashboard cards: doshas, remedies, divisional
//  charts, and relationship / career highlights
// ─────────────────────────────────────────────────────────────

import React, { useMemo, useState } from 'react'
import type { ChartOutput, Rashi, UserPlan } from '@/types/astrology'
import { ChakraSelector } from '@/components/chakra/ChakraSelector'
import { PlanGate } from '@/components/ui/patterns/PlanGate'
import { planMeetsUiGate } from '@/lib/ui/planGate'
import { VARGA_META } from '@/lib/engine/vargas'
import { analyzeMarriedLife } from '@/lib/engine/marriedLifeAnalysis'
import { analyzeCareerMethod } from '@/lib/engine/careerMethod'
import { getDoshaSnapshot, getRemedySnapshot, type DoshaTone } from '@/lib/engine/dashboardInsights'
import { DashCard, DashEmpty, DashNote, DashRow, TONE_COLOR, type CardTone } from '@/components/dashboard/DashboardCardShell'

const DOSHA_TONE: Record<DoshaTone, CardTone> = { clear: 'good', watch: 'watch', strong: 'alert' }
const DOSHA_WORD: Record<DoshaTone, string> = { clear: 'Clear', watch: 'Watch', strong: 'Notable' }

// ── Doshas ───────────────────────────────────────────────────

export function DoshaSnapshotCard({ chart }: { chart: ChartOutput }) {
  const snap = useMemo(() => getDoshaSnapshot(chart), [chart])
  if (!snap) {
    return <DashCard title="Doshas & Afflictions"><DashEmpty>Unavailable. Recalculate the chart.</DashEmpty></DashCard>
  }
  return (
    <DashCard title="Doshas & Afflictions" meta="from Lagna">
      {snap.flags.map(f => (
        <DashRow
          key={f.id}
          dot
          tone={DOSHA_TONE[f.tone]}
          label={f.label}
          value={<><strong>{DOSHA_WORD[f.tone]}</strong> · {f.detail}</>}
        />
      ))}
      {snap.maleficYogas.length > 0 && (
        <DashRow label="Malefic yogas" tone="watch" value={snap.maleficYogas.map(y => y.name).join(', ')} />
      )}
      <DashNote>Indicators, not verdicts. Weigh them with dasha, aspects, and the full chart.</DashNote>
    </DashCard>
  )
}

// ── Remedies ─────────────────────────────────────────────────

export function RemediesCard({ chart }: { chart: ChartOutput }) {
  const snap = useMemo(() => getRemedySnapshot(chart), [chart])
  if (!snap.moonNakshatra && snap.focus.length === 0) {
    return <DashCard title="Remedies"><DashEmpty>Unavailable. Recalculate the chart.</DashEmpty></DashCard>
  }
  const nak = snap.moonNakshatra
  return (
    <DashCard title="Remedies & Lucky Data" meta={nak ? `Moon in ${nak.name}` : undefined}>
      {nak && (
        <>
          <DashRow label="Mantra" value={nak.remedies.mantra} />
          <DashRow label="Deity" value={nak.remedies.deity} />
          <DashRow label="Color · Metal" value={`${nak.remedies.color} · ${nak.remedies.metal}`} />
          <DashRow label="Charity" value={nak.remedies.charity} />
          <DashRow label="Fasting" value={nak.remedies.fasting} />
        </>
      )}
      {snap.focus.map(f => (
        <div key={f.role} style={{ marginTop: '0.5rem' }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-gold)' }}>
            {f.role} · {f.name}
          </div>
          <DashRow label="Day" value={f.remedy.day} />
          <DashRow label="Mantra" value={f.remedy.mantra} />
          <DashRow label="Stone" value={f.remedy.gemstone} />
          <DashRow label="Give" value={f.remedy.charity} />
        </div>
      ))}
      <DashNote>
        Start with mantra, charity, and routine. Wear a gemstone only after a full chart review, since the wrong stone can strengthen a difficult planet.
      </DashNote>
    </DashCard>
  )
}

// ── Divisional charts ────────────────────────────────────────

const VARGA_PILLS = ['D9', 'D10', 'D7', 'D12'] as const

export function DivisionalSnapshotCard({ chart }: { chart: ChartOutput }) {
  const available = VARGA_PILLS.filter(v => chart.vargas?.[v]?.length)
  const [selected, setSelected] = useState<string>(available[0] ?? 'D9')
  const active = available.includes(selected as (typeof VARGA_PILLS)[number]) ? selected : available[0]

  if (!active) {
    return <DashCard title="Divisional Charts"><DashEmpty>Unavailable. Recalculate the chart.</DashEmpty></DashCard>
  }

  const d1Asc = chart.lagnas.ascRashi as Rashi
  const asc = (chart.vargaLagnas?.[active] as Rashi | undefined) ?? d1Asc
  const meta = VARGA_META[active]
  const moonNak = chart.grahas.find(g => g.id === 'Mo')?.nakshatraIndex ?? 0

  return (
    <DashCard title="Divisional Charts" meta={meta ? `${active} · ${meta.full}` : active}>
      <div role="tablist" aria-label="Divisional chart" style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
        {available.map(v => {
          const on = v === active
          return (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setSelected(v)}
              style={{
                height: 24,
                padding: '0 0.6rem',
                fontSize: '0.64rem',
                borderRadius: 999,
                border: `1px solid ${on ? 'var(--gold)' : 'var(--border-soft)'}`,
                background: on ? 'var(--gold-faint)' : 'transparent',
                color: on ? 'var(--text-gold)' : 'var(--text-muted)',
                fontWeight: on ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              {v}
            </button>
          )
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', maxWidth: '100%', overflow: 'hidden' }}>
        <ChakraSelector
          ascRashi={asc}
          grahas={chart.vargas?.[active] ?? []}
          vargaName={active}
          moonNakIndex={moonNak}
          defaultStyle="north"
          size={240}
          hideInternalSettingsToggle
        />
      </div>
      {meta && <DashNote>{meta.topic}</DashNote>}
    </DashCard>
  )
}

// ── Relationship & career highlights (Gold) ──────────────────

const TONE_OF: Record<'supportive' | 'caution' | 'mixed', CardTone> = { supportive: 'good', caution: 'alert', mixed: 'watch' }

function LockedPlaceholder() {
  const bar = (w: string) => <div style={{ height: 8, width: w, borderRadius: 4, background: 'var(--surface-3)', marginBottom: 8 }} />
  return (
    <div style={{ padding: '0.4rem 0' }}>
      {bar('70%')}{bar('95%')}{bar('55%')}{bar('85%')}{bar('60%')}
    </div>
  )
}

function LifeHighlightsBody({ chart, onOpenRelationship, onOpenCareer }: {
  chart: ChartOutput
  onOpenRelationship?: () => void
  onOpenCareer?: () => void
}) {
  const marriage = useMemo(() => analyzeMarriedLife(chart), [chart])
  const career = useMemo(() => analyzeCareerMethod(chart), [chart])
  const link = (label: string, fn?: () => void) =>
    fn ? (
      <button type="button" onClick={fn} style={{ fontSize: '0.6rem', border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}>
        {label}
      </button>
    ) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-gold)' }}>Relationship</span>
          {link('Open →', onOpenRelationship)}
        </div>
        {marriage ? (
          <>
            <div style={{ fontSize: '0.74rem', fontWeight: 650, color: 'var(--text-primary)', margin: '0.2rem 0' }}>{marriage.headline}</div>
            <div style={{ fontSize: '0.66rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{marriage.bondStyle}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem 0.65rem', marginTop: '0.4rem' }}>
              {marriage.dimensions.map(d => (
                <div key={d.id} title={d.summary}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: 'var(--text-secondary)' }}>
                    <span>{d.label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-gold)' }}>{d.score.toFixed(1)}</span>
                  </div>
                  <div style={{ height: 3, background: 'var(--surface-3)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.max(0, Math.min(10, d.score)) * 10}%`, background: 'var(--gold)' }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : <DashEmpty>Unavailable.</DashEmpty>}
      </section>

      <section style={{ borderTop: '1px solid var(--border-soft)', paddingTop: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-gold)' }}>Career</span>
          {link('Open →', onOpenCareer)}
        </div>
        {career ? (
          <>
            <div style={{ fontSize: '0.74rem', fontWeight: 650, color: 'var(--text-primary)', margin: '0.2rem 0' }}>{career.headline}</div>
            <div style={{ fontSize: '0.66rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              <strong>{career.dominant.planet}.</strong> {career.dominant.principle}
            </div>
            <div style={{ marginTop: '0.35rem', fontSize: '0.64rem', color: TONE_COLOR[TONE_OF[career.d10.tone]] }}>
              D10: {career.d10.verdict}
            </div>
          </>
        ) : <DashEmpty>Unavailable.</DashEmpty>}
      </section>
    </div>
  )
}

export function LifeHighlightsCard({ chart, userPlan = 'free', onOpenRelationship, onOpenCareer }: {
  chart: ChartOutput
  userPlan?: UserPlan
  onOpenRelationship?: () => void
  onOpenCareer?: () => void
}) {
  // Real content is only rendered for Gold+, so a locked card never ships readings into the DOM.
  const unlocked = planMeetsUiGate(userPlan, 'gold')
  return (
    <DashCard title="Relationship & Career">
      <PlanGate userPlan={userPlan} required="gold" featureName="Relationship and career highlights">
        {unlocked
          ? <LifeHighlightsBody chart={chart} onOpenRelationship={onOpenRelationship} onOpenCareer={onOpenCareer} />
          : <LockedPlaceholder />}
      </PlanGate>
    </DashCard>
  )
}
