'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/RelationshipMarriagePanel.tsx
//  Individual chart — quality of married life
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useMemo, useState, useTransition } from 'react'
import type { ChartOutput, Rashi, UserPlan } from '@/types/astrology'
import { RASHI_SHORT } from '@/types/astrology'
import { ChakraSelector } from '@/components/chakra/ChakraSelector'
import { VARGA_UI_LIST } from '@/lib/engine/vargas'
import { PlanGate } from '@/components/ui/patterns/PlanGate'
import { planMeetsUiGate } from '@/lib/ui/planGate'
import { analyzeMarriedLife } from '@/lib/engine/marriedLifeAnalysis'
import { analyzeIntimateLife } from '@/lib/engine/intimateLife'
import { analyzeSeventhAxis } from '@/lib/engine/seventhAxis'
import { analyzeJayaBhava } from '@/lib/engine/jayaBhava'
import { analyzeMarriageClass } from '@/lib/engine/marriageClass'
import { analyzeMarriageHouses } from '@/lib/engine/marriageHouses'
import { analyzeSeventhLord } from '@/lib/engine/seventhLord'
import { analyzeKarmicDebt } from '@/lib/engine/karmicDebt'
import { analyzeVenusJupiterBond } from '@/lib/engine/venusJupiterBond'
import { analyzeMarriageGochar } from '@/lib/engine/marriageGochar'
import { analyzePartnerNature } from '@/lib/engine/partnerNature'
import { analyzeDivorceEnergy } from '@/lib/engine/divorceEnergy'
import { DivorceEnergySections, JayaSections, KarmicDebtSections, LIFE_TONE, MarriageClassSections, MarriageGocharSections, MarriageHousesSections, NoteCards, PartnerNatureSections, ScoreMeter, SectionLabel, SeventhLordSections, VenusJupiterSections } from '@/components/ui/marriedLifeUi'
import { VedaanshLoader } from '@/components/ui/primitives/VedaanshLoader'

type View = 'overview' | 'axis' | 'bonds' | 'jaya' | 'class' | 'bond' | 'partner' | 'split' | 'houses' | 'lord' | 'planets' | 'intimate' | 'timing' | 'remedies'

const VIEWS: { id: View; label: string }[] = [
  { id: 'overview', label: 'Significators' },
  { id: 'axis', label: 'Aries and Libra' },
  { id: 'bonds', label: 'Combinations' },
  { id: 'jaya', label: 'Jaya Bhava' },
  { id: 'class', label: 'D1 and D9' },
  { id: 'bond', label: 'Venus and Jupiter' },
  { id: 'partner', label: 'The partner' },
  { id: 'split', label: 'Separation' },
  { id: 'houses', label: 'Eight houses' },
  { id: 'lord', label: '7th lord' },
  { id: 'planets', label: 'Jupiter, Mars, Saturn' },
  { id: 'intimate', label: 'Intimate and in-laws' },
  { id: 'timing', label: 'Timing' },
  { id: 'remedies', label: 'Remedies' },
]

interface Props {
  chart: ChartOutput
  userPlan?: UserPlan
}

function planRank(plan: UserPlan): number {
  return plan === 'platinum' ? 2 : plan === 'gold' ? 1 : 0
}

function tierRank(tier: 'free' | 'gold' | 'platinum'): number {
  return tier === 'platinum' ? 2 : tier === 'gold' ? 1 : 0
}

function firstSentence(text: string): string {
  const cut = text.split(/(?<=\.)\s/)[0] ?? text
  return cut.length > 180 ? `${cut.slice(0, 177).trim()}…` : cut
}

function MarriageCharts({ chart, userPlan, showDivisionals }: { chart: ChartOutput; userPlan: UserPlan; showDivisionals: boolean }) {
  const divisionals = VARGA_UI_LIST.filter(v => v.name !== 'D1')
  const [vargaName, setVargaName] = useState('D9')
  const moonNakIndex = chart.grahas.find(g => g.id === 'Mo')?.nakshatraIndex ?? 0
  const d1Asc = chart.lagnas.ascRashi as Rashi
  const selected = divisionals.find(v => v.name === vargaName) ?? divisionals.find(v => v.name === 'D9') ?? divisionals[0]
  const selectedGrahas = selected ? chart.vargas?.[selected.name] ?? [] : []
  const selectedAsc = (selected ? chart.vargaLagnas?.[selected.name] : undefined) ?? d1Asc
  const card: React.CSSProperties = {
    border: '1px solid var(--border)',
    borderRadius: 'var(--r-md)',
    background: 'var(--surface-1)',
    padding: '0.65rem',
    minWidth: 0,
    overflow: 'hidden',
  }
  const labelRow: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
    marginBottom: '0.45rem',
  }
  const core = divisionals.filter(v => v.tier === 'free')
  const extended = divisionals.filter(v => v.tier !== 'free')
  const option = (v: (typeof divisionals)[number]) => {
    const unlocked = planRank(userPlan) >= tierRank(v.tier)
    const ready = v.name in (chart.vargas ?? {})
    const suffix = !unlocked ? ' (Platinum)' : !ready ? ' (recalculate)' : ''
    return (
      <option key={v.name} value={v.name} disabled={!unlocked || !ready}>
        {v.name} · {v.full}{suffix}
      </option>
    )
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '0.75rem' }}>
      <article style={card}>
        <div style={labelRow}>
          <span className="label-caps" style={{ fontSize: '0.62rem' }}>D1 · Lagna chart</span>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-gold)' }}>{RASHI_SHORT[d1Asc]} lagna</span>
        </div>
        <ChakraSelector
          ascRashi={d1Asc}
          grahas={chart.vargas?.D1 ?? chart.grahas}
          vargaName="D1"
          moonNakIndex={moonNakIndex}
          arudhas={chart.arudhas}
          tithiNumber={chart.panchang.tithi.number}
          varaNumber={chart.panchang.vara.number}
          lagnas={chart.lagnas}
          defaultStyle="north"
          size={280}
          showCharaDrishtiControls
          highlightHouses={[7]}
        />
      </article>
      {showDivisionals ? (
      <article style={card}>
        <div style={labelRow}>
          <select
            aria-label="Open a divisional chart"
            value={selected?.name ?? 'D9'}
            onChange={e => setVargaName(e.target.value)}
            style={{
              flex: 1,
              minWidth: 0,
              padding: '0.28rem 0.4rem',
              background: 'var(--surface-2)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontFamily: 'inherit',
            }}
          >
            <optgroup label="Divisional charts">{core.map(option)}</optgroup>
            <optgroup label="Extended charts">{extended.map(option)}</optgroup>
          </select>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-gold)', flexShrink: 0 }}>
            {selectedGrahas.length ? `${RASHI_SHORT[selectedAsc]} lagna` : 'Not on this chart'}
          </span>
        </div>
        {selected && selectedGrahas.length ? (
          <ChakraSelector
            ascRashi={selectedAsc}
            grahas={selectedGrahas}
            vargaName={selected.name}
            lagnas={chart.lagnas}
            moonNakIndex={moonNakIndex}
            defaultStyle="north"
            size={280}
            showCharaDrishtiControls
            highlightHouses={[7]}
          />
        ) : (
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Recalculate the chart so this divisional chart is included.
          </p>
        )}
      </article>
      ) : null}
    </div>
  )
}

function MarriageReadingLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 280, padding: '3rem 1rem' }}>
      <VedaanshLoader size={44} message="Reading relationship and marriage…" />
    </div>
  )
}

function RelationshipMarriageReading({ chart, userPlan = 'free' }: Props) {
  const full = planMeetsUiGate(userPlan, 'gold')
  const data = useMemo(() => analyzeMarriedLife(chart), [chart])
  const axis = useMemo(() => (full ? analyzeSeventhAxis(chart) : null), [chart, full])
  const intimate = useMemo(() => (full ? analyzeIntimateLife(chart) : null), [chart, full])
  const jaya = useMemo(() => (full ? analyzeJayaBhava(chart) : null), [chart, full])
  const marriageClass = useMemo(() => (full ? analyzeMarriageClass(chart) : null), [chart, full])
  const marriageHouses = useMemo(() => (full ? analyzeMarriageHouses(chart) : null), [chart, full])
  const seventhLord = useMemo(() => (full ? analyzeSeventhLord(chart) : null), [chart, full])
  const karmicDebt = useMemo(() => (full ? analyzeKarmicDebt(chart) : null), [chart, full])
  const venusJupiter = useMemo(() => (full ? analyzeVenusJupiterBond(chart) : null), [chart, full])
  const marriageGochar = useMemo(() => (full ? analyzeMarriageGochar(chart) : null), [chart, full])
  const partnerNature = useMemo(() => (full ? analyzePartnerNature(chart) : null), [chart, full])
  const divorceEnergy = useMemo(() => (full ? analyzeDivorceEnergy(chart) : null), [chart, full])
  const [view, setView] = useState<View>('overview')
  const views = VIEWS.filter(v => v.id !== 'timing' || !!intimate?.timings.length || !!intimate?.divisions.length || !!marriageGochar)

  if (!data) {
    return (
      <div style={{ padding: '1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        This chart has no ascendant, so married life cannot be read yet.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', padding: '0.85rem' }}>
      <header>
        <div className="label-caps" style={{ fontSize: '0.62rem', marginBottom: 4 }}>Relationship and marriage</div>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.45rem', fontWeight: 650 }}>{data.headline}</h2>
        <p style={{ margin: '0.45rem 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55, maxWidth: 760 }}>
          {data.summary}
        </p>
      </header>

      <MarriageCharts chart={chart} userPlan={userPlan} showDivisionals={full} />

      {!full && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '0.65rem' }}>
            {data.dimensions.map(d => (
              <ScoreMeter key={d.id} label={d.label} planet={d.planet} score={d.score} summary={firstSentence(d.summary)} />
            ))}
          </div>
          <PlanGate userPlan={userPlan} required="gold" featureName="Relationship and marriage">
            <div style={{ minHeight: 112, padding: '1rem', background: 'var(--surface-2)', borderRadius: 'var(--r-md)' }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Full reading is on Gold</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Every divisional chart, the four questions, D1 and D9, the partner, separation, houses, timing, and remedies.
              </div>
            </div>
          </PlanGate>
        </>
      )}

      {full && <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
        {views.map(v => (
          <button
            key={v.id}
            type="button"
            onClick={() => setView(v.id)}
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: '999px',
              border: `1px solid ${view === v.id ? 'var(--text-gold)' : 'var(--border)'}`,
              background: view === v.id ? 'var(--surface-3)' : 'transparent',
              color: view === v.id ? 'var(--text-gold)' : 'var(--text-muted)',
              fontSize: '0.75rem',
              fontWeight: view === v.id ? 700 : 500,
              cursor: 'pointer',
            }}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === 'overview' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '0.65rem' }}>
            {data.dimensions.map(d => (
              <ScoreMeter key={d.id} label={d.label} planet={d.planet} score={d.score} summary={d.summary} />
            ))}
          </div>

          <SectionLabel>Four questions</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '0.65rem' }}>
            {data.significators.map(s => (
              <article key={s.id} style={{
                padding: '0.85rem',
                borderRadius: 'var(--r-md)',
                border: '1px solid var(--border)',
                borderTop: `3px solid ${LIFE_TONE[s.tone]}`,
                background: 'var(--surface-1)',
              }}>
                <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{s.title}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-gold)', margin: '0.2rem 0 0.35rem' }}>{s.question}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 6 }}>{s.placement}</div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{s.reading}</p>
              </article>
            ))}
          </div>

          <article style={{ padding: '0.9rem 1rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
            <SectionLabel>Who brings the proposal</SectionLabel>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--text-primary)' }}>House {data.proposal.house} · {data.proposal.relative}.</strong>{' '}
              {data.proposal.detail}
            </p>
            <p style={{ margin: '0.65rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{data.bondStyle}</p>
          </article>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '0.65rem' }}>
            <article style={{ padding: '0.85rem', borderLeft: `3px solid ${LIFE_TONE[data.fourth.tone]}`, background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
              <SectionLabel>4th house — home</SectionLabel>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{data.fourth.reading}</p>
            </article>
            <article style={{ padding: '0.85rem', borderLeft: `3px solid ${LIFE_TONE[data.tenth.tone]}`, background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
              <SectionLabel>10th house — work{chart.meta.gender === 'female' ? ' and mother-in-law' : ''}</SectionLabel>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {data.tenth.reading}
              </p>
            </article>
          </div>
        </>
      )}

      {view === 'axis' && axis && (
        <>
          <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{axis.principle}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '0.65rem' }}>
            <article style={{ padding: '0.85rem', borderLeft: '3px solid var(--text-gold)', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
              <SectionLabel>{axis.aries.title}</SectionLabel>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{axis.aries.detail}</p>
            </article>
            <article style={{ padding: '0.85rem', borderLeft: '3px solid var(--teal)', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
              <SectionLabel>{axis.libra.title}</SectionLabel>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{axis.libra.detail}</p>
            </article>
          </div>
          <article style={{ padding: '0.9rem 1rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--surface-1)' }}>
            <SectionLabel>{axis.pair.lagnaName} lagna · {axis.pair.seventhName} in the 7th</SectionLabel>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{axis.pair.self}</p>
            <p style={{ margin: '0.55rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{axis.pair.teaches}</p>
            {axis.pair.friction ? (
              <p style={{ margin: '0.55rem 0 0', fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{axis.pair.friction}</p>
            ) : null}
            <p style={{ margin: '0.65rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{axis.perception}</p>
          </article>
          <article style={{ padding: '0.85rem 1rem', borderRadius: 'var(--r-md)', background: 'var(--surface-2)' }}>
            <SectionLabel>What to read in the partner</SectionLabel>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{axis.matchHint}</p>
          </article>
          <NoteCards notes={axis.notes} />
        </>
      )}

      {view === 'jaya' && jaya && (
        <>
          <SectionLabel>BPHS Chapter 19 — seventh house</SectionLabel>
          <JayaSections reading={jaya} />
        </>
      )}

      {view === 'class' && marriageClass && (
        <>
          <SectionLabel>D1, D9, and the kind of bond</SectionLabel>
          <MarriageClassSections reading={marriageClass} />
          {karmicDebt ? (
            <>
              <SectionLabel>Karmic debt</SectionLabel>
              <KarmicDebtSections reading={karmicDebt} />
            </>
          ) : null}
        </>
      )}

      {view === 'bond' && venusJupiter && (
        <>
          <SectionLabel>Venus and Jupiter — closeness and depth</SectionLabel>
          <VenusJupiterSections reading={venusJupiter} />
        </>
      )}

      {view === 'partner' && partnerNature && (
        <>
          <SectionLabel>The partner — read from this chart</SectionLabel>
          <PartnerNatureSections reading={partnerNature} />
        </>
      )}

      {view === 'split' && divorceEnergy && (
        <>
          <SectionLabel>Separation — Moon, Venus, and Saturn</SectionLabel>
          <DivorceEnergySections reading={divorceEnergy} />
        </>
      )}

      {view === 'houses' && marriageHouses && (
        <>
          <SectionLabel>Eight houses — and when a period can marry</SectionLabel>
          <MarriageHousesSections reading={marriageHouses} />
        </>
      )}

      {view === 'lord' && seventhLord && (
        <>
          <SectionLabel>7th lord — house, combinations, age band</SectionLabel>
          <SeventhLordSections reading={seventhLord} />
        </>
      )}

      {view === 'bonds' && (
        <>
          <SectionLabel>Venus and the marriage combinations</SectionLabel>
          <NoteCards notes={data.combinations} />
          <SectionLabel>What each planet is doing</SectionLabel>
          <NoteCards notes={data.roles} />
        </>
      )}

      {view === 'planets' && (
        <>
          <SectionLabel>Jupiter — vow and blessing</SectionLabel>
          <NoteCards notes={data.jupiter} />
          <SectionLabel>Mars, Rahu, and Ketu</SectionLabel>
          <NoteCards notes={data.marsAndNodes} />
          <SectionLabel>Saturn and family speech</SectionLabel>
          <NoteCards notes={data.saturn} />
        </>
      )}

      {view === 'intimate' && intimate && (
        <>
          {intimate.headline ? (
            <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 700 }}>{intimate.headline}</p>
          ) : null}
          {intimate.notes.length ? <NoteCards notes={intimate.notes} /> : null}
          {intimate.inlaws.length ? (
            <>
              <SectionLabel>In-laws</SectionLabel>
              <NoteCards notes={intimate.inlaws} />
            </>
          ) : null}
          {intimate.influence.length ? (
            <>
              <SectionLabel>Mind</SectionLabel>
              <NoteCards notes={intimate.influence} />
            </>
          ) : null}
        </>
      )}

      {view === 'timing' && (marriageGochar || intimate?.timings.length || intimate?.divisions.length) ? (
        <>
          {marriageGochar ? (
            <>
              <SectionLabel>Jupiter and Saturn — transit beside the period</SectionLabel>
              <MarriageGocharSections reading={marriageGochar} />
            </>
          ) : null}
          {intimate?.divisions.length ? (
            <>
              <SectionLabel>D3 and D7</SectionLabel>
              <NoteCards notes={intimate.divisions} />
            </>
          ) : null}
          {intimate?.timings.some(n => n.id.startsWith('past-')) ? (
            <>
              <SectionLabel>Last 5 years</SectionLabel>
              <NoteCards notes={intimate.timings.filter(n => n.id.startsWith('past-'))} />
            </>
          ) : null}
          {intimate.timings.some(n => !n.id.startsWith('past-')) ? (
            <>
              <SectionLabel>Open and ahead</SectionLabel>
              <NoteCards notes={intimate.timings.filter(n => !n.id.startsWith('past-'))} />
            </>
          ) : null}
        </>
      ) : null}

      {view === 'remedies' && (
        <>
          <SectionLabel>Remedies from the birth chart</SectionLabel>
          <NoteCards notes={data.remedies} />
        </>
      )}
      </>}
    </div>
  )
}

export function RelationshipMarriagePanel({ chart, userPlan = 'free' }: Props) {
  const [shown, setShown] = useState(false)
  const [, startTransition] = useTransition()

  useEffect(() => {
    setShown(false)
    const frame = requestAnimationFrame(() => {
      startTransition(() => setShown(true))
    })
    return () => cancelAnimationFrame(frame)
  }, [chart, startTransition])

  if (!shown) return <MarriageReadingLoader />
  return <RelationshipMarriageReading chart={chart} userPlan={userPlan} />
}
