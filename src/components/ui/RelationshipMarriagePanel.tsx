'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/RelationshipMarriagePanel.tsx
//  Individual chart — quality of married life
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useId, useMemo, useState, useTransition } from 'react'
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
import { analyzeMarriageVivah } from '@/lib/engine/marriageVivah'
import { analyzeMarriageMars } from '@/lib/engine/marriageMars'
import { analyzeMarriageKarma } from '@/lib/engine/marriageKarma'
import { analyzeVenusMarriage } from '@/lib/engine/venusMarriage'
import { analyzeMarriageGochar } from '@/lib/engine/marriageGochar'
import { useMarriageGocharWindows } from '@/hooks/useMarriageGocharWindows'
import { analyzePartnerNature } from '@/lib/engine/partnerNature'
import { analyzeDivorceEnergy } from '@/lib/engine/divorceEnergy'
import { analyzeClassicalMarriage } from '@/lib/engine/classicalMarriage'
import { analyzeMarriageCaseBrief } from '@/lib/engine/marriageCaseBrief'
import { ClassicalMarriageSections, CaseBriefCard, DivorceEnergySections, IntimateLifeSections, JayaSections, KarmicDebtSections, MarriageClassSections, MarriageGocharSections, MarriageHousesSections, MarriageKarmaSections, MarriageMarsSections, MarriageVivahSections, NoteCards, PartnerNatureSections, ScoreMeter, SectionLabel, SeventhLordSections, VenusJupiterSections, VenusMarriageSections, YogaChecklist } from '@/components/ui/marriedLifeUi'
import { JaiminiMarriageSection } from '@/components/ui/JaiminiMarriageSection'
import { VedaanshLoader } from '@/components/ui/primitives/VedaanshLoader'
import {
  MarriageHero,
  MarriageLockedCard,
  MarriageOverviewDetails,
  MarriageTabs,
  TabHint,
  type MarriageView,
} from '@/components/ui/relationshipMarriageUi'
import s from '@/components/ui/relationshipMarriage.module.css'

/** A reading block. Several sections are stacked inside one tab. */
type Section = 'overview' | 'axis' | 'bonds' | 'classical' | 'jaimini' | 'jaya' | 'class' | 'bond' | 'method' | 'partner' | 'split' | 'houses' | 'lord' | 'planets' | 'mars' | 'intimate' | 'timing' | 'remedies'

type View = MarriageView

/**
 * Seven tabs, each grouping related sections (rendered in the order of the JSX below).
 * Keep the labels short enough to fit on one row on a phone.
 */
const VIEWS: { id: View; label: string; hint: string; sections: Section[] }[] = [
  { id: 'overview', label: 'Overview', hint: 'Significators, the four questions, who brings the proposal', sections: ['overview'] },
  { id: 'seventh', label: '7th House', hint: 'Aries and Libra axis, Jaya Bhava, and the 7th lord', sections: ['axis', 'jaya', 'lord'] },
  { id: 'planets', label: 'Planets and Yogas', hint: 'Venus, Jupiter, Mars, Saturn, nodes, and marriage combinations', sections: ['bond', 'bonds', 'mars', 'planets'] },
  { id: 'partner', label: 'Partner and Intimacy', hint: 'The partner, intimate life, and in-laws', sections: ['partner', 'intimate'] },
  { id: 'bond', label: 'Bond and Karma', hint: 'D1 and D9, karmic debt, marriage method, and separation', sections: ['class', 'method', 'split'] },
  { id: 'classical', label: 'Classical and Jaimini', hint: 'Classical predictions, yoga checklist, Darakaraka and Upapada', sections: ['jaimini', 'classical'] },
  { id: 'timing', label: 'Timing and Remedies', hint: 'Eight houses, dashas, transits, past and future windows, remedies', sections: ['houses', 'timing', 'remedies'] },
]

interface Props {
  chart: ChartOutput
  userPlan?: UserPlan
  /** Inside Kundali Milan: the reading only, without a second set of charts. */
  embedded?: boolean
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

function RelationshipMarriageReading({ chart, userPlan = 'free', embedded = false }: Props) {
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
  const marriageVivah = useMemo(() => (full ? analyzeMarriageVivah(chart) : null), [chart, full])
  const marriageMars = useMemo(() => (full ? analyzeMarriageMars(chart) : null), [chart, full])
  const { windows: gocharWindows } = useMarriageGocharWindows(chart.lagnas?.ascRashi, full)
  const marriageGochar = useMemo(
    () => (full ? analyzeMarriageGochar(chart, { injectWindows: gocharWindows }) : null),
    [chart, full, gocharWindows],
  )
  const partnerNature = useMemo(() => (full ? analyzePartnerNature(chart) : null), [chart, full])
  const divorceEnergy = useMemo(() => (full ? analyzeDivorceEnergy(chart) : null), [chart, full])
  const classical = useMemo(() => (full ? analyzeClassicalMarriage(chart) : null), [chart, full])
  const marriageKarma = useMemo(() => (full ? analyzeMarriageKarma(chart) : null), [chart, full])
  const venusMarriage = useMemo(() => (full ? analyzeVenusMarriage(chart) : null), [chart, full])
  const caseBrief = useMemo(
    () => (full ? analyzeMarriageCaseBrief(chart, { skipGocharScan: true }) : null),
    [chart, full],
  )
  const yogaNotes = useMemo(() => {
    if (!full) return []
    const fromClassical = classical
      ? [...classical.spouse, ...classical.timing, ...classical.happiness, ...classical.remarriage]
      : []
    const fromJaya = jaya
      ? [...jaya.lord, ...jaya.occupants, ...jaya.dynamics, ...jaya.multiplicity, ...jaya.timing, ...jaya.strain]
      : []
    return [...fromClassical, ...fromJaya]
  }, [full, classical, jaya])
  const [view, setView] = useState<View>('overview')
  const [clientSafe, setClientSafe] = useState(true)
  const [yogaFilter, setYogaFilter] = useState('')
  const panelId = useId()
  const activeView = VIEWS.find(v => v.id === view) ?? VIEWS[0]
  const has = (section: Section) => activeView.sections.includes(section)

  if (!data) {
    return (
      <div style={{ padding: '1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        This chart has no ascendant, so married life cannot be read yet.
      </div>
    )
  }

  return (
    <div className={s.root}>
      <MarriageHero data={data} chart={chart} embedded={embedded} />

      {embedded ? null : <MarriageCharts chart={chart} userPlan={userPlan} showDivisionals={full} />}

      {!full && (
        <>
          <div className={s.grid}>
            {data.dimensions.map(d => (
              <ScoreMeter key={d.id} label={d.label} planet={d.planet} score={d.score} summary={firstSentence(d.summary)} />
            ))}
          </div>
          <PlanGate userPlan={userPlan} required="gold" featureName="Relationship and marriage">
            <MarriageLockedCard />
          </PlanGate>
        </>
      )}

      {full && <>
      {caseBrief ? <CaseBriefCard brief={caseBrief} clientSafe={clientSafe} /> : null}
      <MarriageTabs
        views={VIEWS}
        view={view}
        onView={setView}
        clientSafe={clientSafe}
        onClientSafe={setClientSafe}
        panelId={panelId}
      />

      <div
        key={view}
        className={s.content}
        role="tabpanel"
        id={`${panelId}-panel`}
        aria-labelledby={`${panelId}-tab-${view}`}
      >
      <TabHint>{activeView.hint}</TabHint>

      {has('overview') && (
        <>
          <div className={s.grid}>
            {data.dimensions.map(d => (
              <ScoreMeter key={d.id} label={d.label} planet={d.planet} score={d.score} summary={d.summary} />
            ))}
          </div>
          <MarriageOverviewDetails data={data} gender={chart.meta.gender} />
        </>
      )}

      {has('axis') && axis && (
        <>
          <SectionLabel>Aries and Libra — the marriage axis</SectionLabel>
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
          <NoteCards notes={axis.notes} clientSafe={clientSafe} />
        </>
      )}

      {has('jaya') && jaya && (
        <>
          <SectionLabel>Seventh house — Jaya Bhava</SectionLabel>
          <JayaSections reading={jaya} clientSafe={clientSafe} />
        </>
      )}

      {has('jaimini') && (
        <>
          <SectionLabel>Jaimini — Darakaraka and Upapada</SectionLabel>
          <JaiminiMarriageSection chart={chart} />
        </>
      )}

      {has('class') && marriageClass && (
        <>
          <SectionLabel>D1, D9, and the kind of bond</SectionLabel>
          <MarriageClassSections reading={marriageClass} clientSafe={clientSafe} />
          {karmicDebt ? (
            <>
              <SectionLabel>Karmic debt</SectionLabel>
              <KarmicDebtSections reading={karmicDebt} clientSafe={clientSafe} />
            </>
          ) : null}
          {marriageKarma ? (
            <>
              <SectionLabel>Marriage debt and karma</SectionLabel>
              <MarriageKarmaSections reading={marriageKarma} clientSafe={clientSafe} />
            </>
          ) : null}
        </>
      )}

      {has('bond') && venusJupiter && (
        <>
          <SectionLabel>Venus and Jupiter — closeness and depth</SectionLabel>
          <VenusJupiterSections reading={venusJupiter} clientSafe={clientSafe} />
          {venusMarriage ? (
            <>
              <SectionLabel>Venus as the marriage bridge</SectionLabel>
              <VenusMarriageSections reading={venusMarriage} clientSafe={clientSafe} />
            </>
          ) : null}
        </>
      )}

      {has('method') && marriageVivah && (
        <>
          <SectionLabel>Marriage method — Mars, stars, bond, and debt</SectionLabel>
          <MarriageVivahSections reading={marriageVivah} clientSafe={clientSafe} />
        </>
      )}

      {has('partner') && partnerNature && (
        <>
          <SectionLabel>The partner — read from this chart</SectionLabel>
          <PartnerNatureSections reading={partnerNature} clientSafe={clientSafe} />
        </>
      )}

      {has('split') && divorceEnergy && (
        <>
          <SectionLabel>Separation — Moon, Venus, and Saturn</SectionLabel>
          <DivorceEnergySections reading={divorceEnergy} clientSafe={clientSafe} />
        </>
      )}

      {has('houses') && marriageHouses && (
        <>
          <SectionLabel>Eight houses — and when a period can marry</SectionLabel>
          <MarriageHousesSections reading={marriageHouses} clientSafe={clientSafe} />
        </>
      )}

      {has('lord') && seventhLord && (
        <>
          <SectionLabel>7th lord — house, combinations, age band</SectionLabel>
          <SeventhLordSections reading={seventhLord} clientSafe={clientSafe} />
        </>
      )}

      {has('bonds') && (
        <>
          <SectionLabel>Venus and the marriage combinations</SectionLabel>
          <NoteCards notes={data.combinations} clientSafe={clientSafe} />
          <SectionLabel>What each planet is doing</SectionLabel>
          <NoteCards notes={data.roles} clientSafe={clientSafe} />
        </>
      )}

      {has('classical') && classical && (
        <>
          <SectionLabel>Classical predictions</SectionLabel>
          <ClassicalMarriageSections reading={classical} clientSafe={clientSafe} />
          {yogaNotes.length ? (
            <>
              <SectionLabel>Yoga checklist</SectionLabel>
              <YogaChecklist notes={yogaNotes} filter={yogaFilter} onFilterChange={setYogaFilter} clientSafe={clientSafe} />
            </>
          ) : null}
        </>
      )}

      {has('mars') && marriageMars && (
        <>
          <SectionLabel>Mars — the fire that starts and defends the marriage</SectionLabel>
          <MarriageMarsSections reading={marriageMars} clientSafe={clientSafe} />
        </>
      )}

      {has('planets') && (
        <>
          <SectionLabel>Jupiter — vow and blessing</SectionLabel>
          <NoteCards notes={data.jupiter} clientSafe={clientSafe} />
          <SectionLabel>Mars, Rahu, and Ketu</SectionLabel>
          <NoteCards notes={data.marsAndNodes} clientSafe={clientSafe} />
          <SectionLabel>Saturn and family speech</SectionLabel>
          <NoteCards notes={data.saturn} clientSafe={clientSafe} />
        </>
      )}

      {has('intimate') && intimate && (
        <>
          <SectionLabel>Intimate life and in-laws</SectionLabel>
          <IntimateLifeSections reading={intimate} clientSafe={clientSafe} />
        </>
      )}

      {has('timing') && (marriageGochar || intimate?.timings.length || intimate?.divisions.length) ? (
        <>
          {marriageGochar ? (
            <>
              <SectionLabel>Jupiter and Saturn — transit beside the period</SectionLabel>
              <MarriageGocharSections reading={marriageGochar} clientSafe={clientSafe} />
            </>
          ) : null}
          {intimate?.divisions.length ? (
            <>
              <SectionLabel>D3 and D7</SectionLabel>
              <NoteCards notes={intimate.divisions} clientSafe={clientSafe} />
            </>
          ) : null}
          {intimate?.timings.some(n => n.id.startsWith('past-')) ? (
            <>
              <SectionLabel>Last 5 years</SectionLabel>
              <NoteCards notes={intimate.timings.filter(n => n.id.startsWith('past-'))} clientSafe={clientSafe} />
            </>
          ) : null}
          {intimate?.timings.some(n => !n.id.startsWith('past-')) ? (
            <>
              <SectionLabel>Open and ahead</SectionLabel>
              <NoteCards notes={intimate.timings.filter(n => !n.id.startsWith('past-'))} clientSafe={clientSafe} />
            </>
          ) : null}
        </>
      ) : null}

      {has('remedies') && (
        <>
          <SectionLabel>Remedies from the birth chart</SectionLabel>
          <NoteCards notes={data.remedies} clientSafe={clientSafe} />
        </>
      )}
      </div>
      </>}
    </div>
  )
}

export function RelationshipMarriagePanel({ chart, userPlan = 'free', embedded = false }: Props) {
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
  return <RelationshipMarriageReading chart={chart} userPlan={userPlan} embedded={embedded} />
}
