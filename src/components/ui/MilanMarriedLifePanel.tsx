'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/MilanMarriedLifePanel.tsx
//  Match reading: emotion, home, in-laws, flavor and lasting continuity
// ─────────────────────────────────────────────────────────────

import React, { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import type { ChartOutput, UserPlan } from '@/types/astrology'
import { analyzeMilanMarriedLife } from '@/lib/engine/milanMarriedLife'
import type { MarriedLifeNote } from '@/lib/engine/marriedLifeAnalysis'
import { analyzeJayaBhava, compareJayaBhava } from '@/lib/engine/jayaBhava'
import { analyzeMarriageClass, compareMarriageClass } from '@/lib/engine/marriageClass'
import { analyzeMarriageHouses, compareMarriageHouses } from '@/lib/engine/marriageHouses'
import { analyzeSeventhLord, compareSeventhLord } from '@/lib/engine/seventhLord'
import { analyzeKarmicDebt, compareKarmicDebt } from '@/lib/engine/karmicDebt'
import { analyzeVenusJupiterBond, compareVenusJupiterBond } from '@/lib/engine/venusJupiterBond'
import { analyzeMarriageVivah, compareMarriageVivah } from '@/lib/engine/marriageVivah'
import { analyzeMarriageMars, compareMarriageMars } from '@/lib/engine/marriageMars'
import { analyzeMarriageGochar, compareMarriageGochar } from '@/lib/engine/marriageGochar'
import { useMarriageGocharWindows } from '@/hooks/useMarriageGocharWindows'
import { analyzePartnerNature, comparePartnerNature } from '@/lib/engine/partnerNature'
import { analyzeDivorceEnergy, compareDivorceEnergy } from '@/lib/engine/divorceEnergy'
import type { MilanRole } from '@/lib/engine/milanSuite'
import { analyzeDualJaiminiMarriage, resolveMilanRoles } from '@/lib/engine/milanSuite'
import { analyzeClassicalMarriage, compareClassicalMarriage } from '@/lib/engine/classicalMarriage'
import { analyzeMarriageSynastry } from '@/lib/engine/marriageSynastry'
import { analyzePairCaseBrief } from '@/lib/engine/marriageCaseBrief'
import { analyzeIntimateLife } from '@/lib/engine/intimateLife'
import { analyzeMarriedLife } from '@/lib/engine/marriedLifeAnalysis'
import { analyzeSeventhAxis, seventhAxisMatch } from '@/lib/engine/seventhAxis'
import { analyzeMarriageKarma, compareMarriageKarma } from '@/lib/engine/marriageKarma'
import { analyzeVenusMarriage, compareVenusMarriage } from '@/lib/engine/venusMarriage'
import { JaiminiMarriageSection } from '@/components/ui/JaiminiMarriageSection'
import {
  ClassicalMarriageSections,
  CaseBriefCard,
  DivorceEnergySections,
  IntimateLifeSections,
  JayaSections,
  KarmicDebtSections,
  LIFE_TONE,
  MarriageClassSections,
  MarriageGocharSections,
  MarriageHousesSections,
  MarriageKarmaSections,
  NoteCards,
  PartnerNatureSections,
  SectionLabel,
  SeventhLordSections,
  SynastrySections,
  VenusJupiterSections,
  VenusMarriageSections,
  MarriageMarsSections,
  MarriageVivahSections,
} from '@/components/ui/marriedLifeUi'
import { PlanGate } from '@/components/ui/patterns/PlanGate'
import { LagnaPairCard } from '@/components/ui/LagnaPairCard'
import { planMeetsUiGate } from '@/lib/ui/planGate'
import { Legend, RadarChart } from '@/components/ui/viz'

interface Props {
  chartA: ChartOutput
  chartB: ChartOutput
  roleA: MilanRole
  roleB: MilanRole
  userPlan?: UserPlan
  /** Pair cards and the notes that fire between the charts. Each person's reading stays on its own tabs. */
  pairOnly?: boolean
}

function PairBetween({
  clientSafe,
  groups,
  heading,
}: {
  clientSafe: boolean
  groups: { title: string; notes?: MarriedLifeNote[] }[]
  heading: string
}) {
  const shown = groups.filter(g => g.notes && g.notes.length > 0)
  if (!shown.length) return null
  return (
    <div className="card" style={{ padding: '1.15rem' }}>
      <SectionLabel>{heading}</SectionLabel>
      {shown.map(g => (
        <div key={g.title} style={{ marginTop: '0.85rem' }}>
          <SectionLabel>{g.title}</SectionLabel>
          <NoteCards notes={g.notes!} clientSafe={clientSafe} />
        </div>
      ))}
    </div>
  )
}

export function MilanMarriedLifePanel({ chartA, chartB, roleA, roleB, userPlan = 'free', pairOnly = false }: Props) {
  const { lang } = useLang()
  const tMilan = useTranslations('relationshipMarriage.milan')
  const tTabs = useTranslations('relationshipMarriage.tabs')
  const tSections = useTranslations('relationshipMarriage.sections')
  const tOverview = useTranslations('relationshipMarriage.overview')
  const full = planMeetsUiGate(userPlan, 'gold')
  const [clientSafe, setClientSafe] = useState(true)
  const bride: 'a' | 'b' | undefined = roleA === 'girl' ? 'a' : roleB === 'girl' ? 'b' : undefined
  const data = useMemo(
    () => analyzeMilanMarriedLife(chartA, chartB, { bride, lang }),
    [chartA, chartB, bride, lang],
  )
  const roles = useMemo(
    () => resolveMilanRoles(chartA, chartB, { personA: roleA, personB: roleB }),
    [chartA, chartB, roleA, roleB],
  )
  const nameA = chartA.meta?.name?.trim() || tMilan('chartFallbackA')
  const nameB = chartB.meta?.name?.trim() || tMilan('chartFallbackB')

  const soloLife = useMemo(() => {
    if (!full) return null
    const a = analyzeMarriedLife(chartA, lang)
    const b = analyzeMarriedLife(chartB, lang)
    if (!a || !b) return null
    return { a, b }
  }, [chartA, chartB, full, lang])

  const axis = useMemo(() => {
    if (!full) return null
    const a = analyzeSeventhAxis(chartA, lang)
    const b = analyzeSeventhAxis(chartB, lang)
    const match = seventhAxisMatch(chartA, chartB, lang)
    if (!a && !b && !match) return null
    return { a, b, match }
  }, [chartA, chartB, full, lang])

  const jaya = useMemo(() => {
    if (!full) return null
    const a = analyzeJayaBhava(chartA, lang)
    const b = analyzeJayaBhava(chartB, lang)
    if (!a || !b) return null
    return { a, b, pair: compareJayaBhava(a, b, nameA, nameB, lang) }
  }, [chartA, chartB, full, nameA, nameB, lang])
  const marriageClass = useMemo(() => {
    if (!full) return null
    const a = analyzeMarriageClass(chartA, lang)
    const b = analyzeMarriageClass(chartB, lang)
    if (!a || !b) return null
    return { a, b, pair: compareMarriageClass(a, b, nameA, nameB, lang) }
  }, [chartA, chartB, full, nameA, nameB, lang])
  const marriageHouses = useMemo(() => {
    if (!full) return null
    const a = analyzeMarriageHouses(chartA, lang)
    const b = analyzeMarriageHouses(chartB, lang)
    if (!a || !b) return null
    return { a, b, pair: compareMarriageHouses(a, b, nameA, nameB, lang) }
  }, [chartA, chartB, full, nameA, nameB, lang])
  const seventhLord = useMemo(() => {
    if (!full) return null
    const a = analyzeSeventhLord(chartA, lang)
    const b = analyzeSeventhLord(chartB, lang)
    if (!a || !b) return null
    return { a, b, pair: compareSeventhLord(a, b, nameA, nameB, lang) }
  }, [chartA, chartB, full, nameA, nameB, lang])
  const venusJupiter = useMemo(() => {
    if (!full) return null
    const a = analyzeVenusJupiterBond(chartA, lang)
    const b = analyzeVenusJupiterBond(chartB, lang)
    if (!a || !b) return null
    return { a, b, pair: compareVenusJupiterBond(a, b, nameA, nameB, lang) }
  }, [chartA, chartB, full, nameA, nameB, lang])
  const marriageVivah = useMemo(() => {
    if (!full) return null
    const a = analyzeMarriageVivah(chartA, lang)
    const b = analyzeMarriageVivah(chartB, lang)
    if (!a || !b) return null
    const pair = compareMarriageVivah(a, b, nameA, nameB, lang)
    const marked = a.harm.length + a.pattern.length + a.debt.length + b.harm.length + b.pattern.length + b.debt.length
    if (!marked && !pair.length) return null
    return { a, b, pair }
  }, [chartA, chartB, full, nameA, nameB, lang])
  const marriageMars = useMemo(() => {
    if (!full) return null
    const a = analyzeMarriageMars(chartA, {}, lang)
    const b = analyzeMarriageMars(chartB, {}, lang)
    if (!a || !b) return null
    return { a, b, pair: compareMarriageMars(a, b, nameA, nameB, lang) }
  }, [chartA, chartB, full, nameA, nameB, lang])

  const { windows: gocharWindowsA } = useMarriageGocharWindows(chartA.lagnas?.ascRashi, full)
  const { windows: gocharWindowsB } = useMarriageGocharWindows(chartB.lagnas?.ascRashi, full)
  const marriageGochar = useMemo(() => {
    if (!full) return null
    const a = analyzeMarriageGochar(chartA, { injectWindows: gocharWindowsA }, lang)
    const b = analyzeMarriageGochar(chartB, { injectWindows: gocharWindowsB }, lang)
    if (!a || !b) return null
    return { a, b, pair: compareMarriageGochar(a, b, nameA, nameB, lang) }
  }, [chartA, chartB, full, gocharWindowsA, gocharWindowsB, nameA, nameB, lang])

  const partnerNature = useMemo(() => {
    if (!full) return null
    const a = analyzePartnerNature(chartA, lang)
    const b = analyzePartnerNature(chartB, lang)
    if (!a || !b) return null
    return { a, b, pair: comparePartnerNature(a, b, nameA, nameB, lang) }
  }, [chartA, chartB, full, nameA, nameB, lang])

  const divorceEnergy = useMemo(() => {
    if (!full) return null
    const a = analyzeDivorceEnergy(chartA, lang)
    const b = analyzeDivorceEnergy(chartB, lang)
    if (!a || !b) return null
    return { a, b, pair: compareDivorceEnergy(a, b, nameA, nameB, lang) }
  }, [chartA, chartB, full, nameA, nameB, lang])

  const karmicDebt = useMemo(() => {
    if (!full) return null
    const a = analyzeKarmicDebt(chartA, lang)
    const b = analyzeKarmicDebt(chartB, lang)
    if (!a || !b) return null
    return { a, b, pair: compareKarmicDebt(a, b, nameA, nameB, lang) }
  }, [chartA, chartB, full, nameA, nameB, lang])

  const marriageKarma = useMemo(() => {
    if (!full) return null
    const a = analyzeMarriageKarma(chartA, lang)
    const b = analyzeMarriageKarma(chartB, lang)
    if (!a || !b) return null
    return { a, b, pair: compareMarriageKarma(a, b, nameA, nameB, lang) }
  }, [chartA, chartB, full, nameA, nameB, lang])

  const venusMarriage = useMemo(() => {
    if (!full) return null
    const a = analyzeVenusMarriage(chartA, lang)
    const b = analyzeVenusMarriage(chartB, lang)
    if (!a || !b) return null
    return { a, b, pair: compareVenusMarriage(a, b, nameA, nameB, lang) }
  }, [chartA, chartB, full, nameA, nameB, lang])

  const classical = useMemo(() => {
    if (!full) return null
    const a = analyzeClassicalMarriage(chartA, lang)
    const b = analyzeClassicalMarriage(chartB, lang)
    if (!a || !b) return null
    const nameA = chartA.meta?.name?.trim() || 'Chart A'
    const nameB = chartB.meta?.name?.trim() || 'Chart B'
    return { a, b, pair: compareClassicalMarriage(a, b, nameA, nameB, lang) }
  }, [chartA, chartB, full, lang])

  const synastry = useMemo(
    () => (full ? analyzeMarriageSynastry(chartA, chartB, lang) : null),
    [chartA, chartB, full, lang],
  )

  const caseBrief = useMemo(
    () => (full ? analyzePairCaseBrief(chartA, chartB, { skipGocharScan: true, lang }) : null),
    [chartA, chartB, full, lang],
  )

  const jaimini = useMemo(
    () => (full ? analyzeDualJaiminiMarriage(roles.boyChart, roles.girlChart, lang) : null),
    [full, roles.boyChart, roles.girlChart, lang],
  )

  const intimate = useMemo(() => {
    if (!full) return null
    const a = analyzeIntimateLife(chartA, lang)
    const b = analyzeIntimateLife(chartB, lang)
    if (!a || !b) return null
    return { a, b }
  }, [chartA, chartB, full, lang])

  if (!data) {
    return (
      <div className="card" style={{ padding: '1.2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        {tMilan('emptyNoAscendant')}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 className="label-caps" style={{ margin: 0, fontSize: '0.72rem' }}>
            {tMilan('title')}
          </h3>
          {full ? (
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <input type="checkbox" checked={clientSafe} onChange={e => setClientSafe(e.target.checked)} />
              {tTabs('gentleWording')}
            </label>
          ) : null}
        </div>
        <p style={{ margin: '0.45rem 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{data.summary}</p>
      </div>

      <LagnaPairCard chartA={chartA} chartB={chartB} nameA={nameA} nameB={nameB} />

      {full && caseBrief ? <CaseBriefCard brief={caseBrief} clientSafe={clientSafe} /> : null}

      <div className="card" style={{ padding: '1.15rem', borderLeft: `4px solid ${LIFE_TONE[data.moon.tone]}` }}>
        <SectionLabel>{tMilan('moonEmotion')}</SectionLabel>
        <div style={{ fontWeight: 800, marginBottom: 4 }}>{data.moon.signA} × {data.moon.signB}</div>
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{data.moon.detail}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '0.75rem' }}>
        <div className="card" style={{ padding: '1.1rem', borderLeft: `4px solid ${LIFE_TONE[data.home.tone]}` }}>
          <SectionLabel>{tOverview('house4')}</SectionLabel>
          <p style={{ margin: '0 0 0.55rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{data.home.reading}</p>
          <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>{data.home.a.reading}</p>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{data.home.b.reading}</p>
        </div>
        <div className="card" style={{ padding: '1.1rem', borderLeft: `4px solid ${LIFE_TONE[data.tenth.tone]}` }}>
          <SectionLabel>{tMilan('tenthCareerMil')}</SectionLabel>
          <p style={{ margin: '0 0 0.55rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{data.tenth.reading}</p>
          <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>{data.tenth.a.reading}</p>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{data.tenth.b.reading}</p>
        </div>
      </div>

      <div className="card" style={{ padding: '1.15rem' }}>
        <SectionLabel>{tMilan('dimensions')}</SectionLabel>
        {data.dimensions.length >= 3 && (
          <div style={{ maxWidth: 320, margin: '0 auto 0.75rem' }}>
            <RadarChart
              axes={data.dimensions.map((d) => d.label)}
              max={10}
              size={200}
              series={[
                { label: data.nameA, values: data.dimensions.map((d) => d.scoreA), color: 'var(--text-gold)' },
                { label: data.nameB, values: data.dimensions.map((d) => d.scoreB), color: 'var(--accent)' },
              ]}
              ariaLabel={tMilan('radarAria', { nameA: data.nameA, nameB: data.nameB })}
            />
            <Legend items={[{ label: data.nameA, color: 'var(--text-gold)' }, { label: data.nameB, color: 'var(--accent)' }]} />
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          {data.dimensions.map(d => (
            <div key={d.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 3 }}>
                <strong>{d.label}</strong>
                <span style={{ color: LIFE_TONE[d.tone] }}>{data.nameA} {d.scoreA} · {data.nameB} {d.scoreB}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                {[d.scoreA, d.scoreB].map((score, i) => (
                  <div key={i} style={{ height: 6, background: 'var(--surface-3)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      width: `${score * 10}%`,
                      height: '100%',
                      background: i === 0 ? 'var(--text-gold)' : 'var(--accent)',
                    }} />
                  </div>
                ))}
              </div>
              {full ? <p style={{ margin: '0.3rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{d.note}</p> : null}
            </div>
          ))}
        </div>
      </div>

      {!full && (
        <PlanGate userPlan={userPlan} required="gold" featureName={tMilan('featureName')}>
          <div style={{ minHeight: 96, padding: '1rem', background: 'var(--surface-2)', borderRadius: 'var(--r-md)' }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>{tMilan('lockedTitle')}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {tMilan('lockedBody')}
            </div>
          </div>
        </PlanGate>
      )}

      {full && <>
      <div className="card" style={{ padding: '1.15rem' }}>
        <SectionLabel>{tMilan('crossChartReadings')}</SectionLabel>
        <NoteCards notes={data.findings} clientSafe={clientSafe} />
      </div>

      {synastry && (
        <div className="card" style={{ padding: '1.15rem' }}>
          <SectionLabel>{tMilan('crossChartOverlay')}</SectionLabel>
          <SynastrySections reading={synastry} clientSafe={clientSafe} />
        </div>
      )}

      {pairOnly ? (
        <PairBetween
          clientSafe={clientSafe}
          heading={tMilan('pairBetween')}
          groups={[
            { title: tMilan('pairSecondBond'), notes: classical?.pair },
            { title: tMilan('pairSeventhHouse'), notes: jaya?.pair },
            { title: tMilan('pairKindOfMarriage'), notes: marriageClass?.pair },
            { title: tMilan('pairEightHouses'), notes: marriageHouses?.pair },
            { title: tMilan('pairSeventhLord'), notes: seventhLord?.pair },
            { title: tMilan('pairVenusJupiter'), notes: venusJupiter?.pair },
            { title: tMilan('pairMars'), notes: marriageMars?.pair },
            { title: tMilan('pairMarriageMethod'), notes: marriageVivah?.pair },
            { title: tMilan('pairVenusBridge'), notes: venusMarriage?.pair },
            { title: tMilan('pairTransit'), notes: marriageGochar?.pair },
            { title: tMilan('pairPartner'), notes: partnerNature?.pair },
            { title: tMilan('pairSeparation'), notes: divorceEnergy?.pair },
            { title: tMilan('pairKarmic'), notes: karmicDebt?.pair },
            { title: tMilan('pairMarriageKarma'), notes: marriageKarma?.pair },
          ]}
        />
      ) : null}
      {!pairOnly && <>
      {classical && (
        <div className="card" style={{ padding: '1.15rem' }}>
          <SectionLabel>{tMilan('bothClassical')}</SectionLabel>
          {classical.pair.length ? (
            <div style={{ marginBottom: '0.85rem' }}>
              <SectionLabel>{tMilan('secondBondClassical')}</SectionLabel>
              <NoteCards notes={classical.pair} clientSafe={clientSafe} />
            </div>
          ) : null}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '0.85rem' }}>
            {[{ name: data.nameA, reading: classical.a }, { name: data.nameB, reading: classical.b }].map(col => (
              <div key={col.name}>
                <SectionLabel>{col.name}</SectionLabel>
                <ClassicalMarriageSections reading={col.reading} clientSafe={clientSafe} />
              </div>
            ))}
          </div>
        </div>
      )}

      {jaimini && (
        <div className="card" style={{ padding: '1.15rem', borderLeft: `4px solid ${LIFE_TONE[jaimini.tone]}` }}>
          <SectionLabel>{tMilan('jaiminiBoth')}</SectionLabel>
          <p style={{ margin: '0 0 0.85rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{jaimini.summary}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '0.85rem' }}>
            <div>
              <SectionLabel>{roles.boyLabel}</SectionLabel>
              <JaiminiMarriageSection chart={roles.boyChart} lang={lang} />
            </div>
            <div>
              <SectionLabel>{roles.girlLabel}</SectionLabel>
              <JaiminiMarriageSection chart={roles.girlChart} lang={lang} />
            </div>
          </div>
        </div>
      )}

      {intimate && (
        <div className="card" style={{ padding: '1.15rem' }}>
          <SectionLabel>{tMilan('intimateBoth')}</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '0.85rem' }}>
            {[{ name: data.nameA, reading: intimate.a }, { name: data.nameB, reading: intimate.b }].map(col => (
              <div key={col.name}>
                <SectionLabel>{col.name}</SectionLabel>
                <IntimateLifeSections reading={col.reading} clientSafe={clientSafe} />
              </div>
            ))}
          </div>
        </div>
      )}

      {axis && (
        <div className="card" style={{ padding: '1.15rem' }}>
          <SectionLabel>{tMilan('axisBoth')}</SectionLabel>
          {axis.match ? (
            <div style={{
              marginBottom: '0.85rem',
              padding: '0.75rem 0.85rem',
              borderLeft: `3px solid ${LIFE_TONE[axis.match.tone]}`,
              background: 'var(--surface-2)',
              borderRadius: '0 var(--r-sm) var(--r-sm) 0',
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: 4 }}>{axis.match.mark}</div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{axis.match.detail}</p>
            </div>
          ) : null}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '0.85rem' }}>
            {[
              { name: data.nameA, reading: axis.a },
              { name: data.nameB, reading: axis.b },
            ].map(col => col.reading ? (
              <div key={col.name}>
                <SectionLabel>{col.name}</SectionLabel>
                <p style={{ margin: '0 0 0.45rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{col.reading.pair.teaches}</p>
                <NoteCards notes={col.reading.notes} clientSafe={clientSafe} />
              </div>
            ) : null)}
          </div>
        </div>
      )}

      {soloLife && (
        <div className="card" style={{ padding: '1.15rem' }}>
          <SectionLabel>{tMilan('comboBoth')}</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '0.85rem' }}>
            {[{ name: data.nameA, reading: soloLife.a }, { name: data.nameB, reading: soloLife.b }].map(col => (
              <div key={col.name}>
                <SectionLabel>{col.name}</SectionLabel>
                <SectionLabel>{tSections('combinations')}</SectionLabel>
                <NoteCards notes={col.reading.combinations} clientSafe={clientSafe} />
                <SectionLabel>{tSections('roles')}</SectionLabel>
                <NoteCards notes={col.reading.roles} clientSafe={clientSafe} />
              </div>
            ))}
          </div>
        </div>
      )}

      {soloLife && (
        <div className="card" style={{ padding: '1.15rem' }}>
          <SectionLabel>{tMilan('jupiterMarsSaturnBoth')}</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '0.85rem' }}>
            {[{ name: data.nameA, reading: soloLife.a }, { name: data.nameB, reading: soloLife.b }].map(col => (
              <div key={col.name}>
                <SectionLabel>{col.name}</SectionLabel>
                <SectionLabel>{tSections('jupiter')}</SectionLabel>
                <NoteCards notes={col.reading.jupiter} clientSafe={clientSafe} />
                <SectionLabel>{tSections('marsNodes')}</SectionLabel>
                <NoteCards notes={col.reading.marsAndNodes} clientSafe={clientSafe} />
                <SectionLabel>{tSections('saturn')}</SectionLabel>
                <NoteCards notes={col.reading.saturn} clientSafe={clientSafe} />
              </div>
            ))}
          </div>
        </div>
      )}

      {jaya && (
        <div className="card" style={{ padding: '1.15rem' }}>
          <SectionLabel>{tMilan('jayaBoth')}</SectionLabel>
          <NoteCards notes={jaya.pair} clientSafe={clientSafe} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '0.85rem', marginTop: '0.85rem' }}>
            {[{ name: data.nameA, reading: jaya.a }, { name: data.nameB, reading: jaya.b }].map(col => (
              <div key={col.name}>
                <SectionLabel>{col.name}</SectionLabel>
                <JayaSections reading={col.reading} showPrinciples={false} clientSafe={clientSafe} />
              </div>
            ))}
          </div>
          {!clientSafe ? (
            <p style={{ margin: '0.85rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{jaya.a.principles}</p>
          ) : null}
        </div>
      )}

      {marriageClass && (
        <div className="card" style={{ padding: '1.15rem' }}>
          <SectionLabel>{tMilan('classBothTitle')}</SectionLabel>
          <NoteCards notes={marriageClass.pair} clientSafe={clientSafe} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '0.85rem', marginTop: '0.85rem' }}>
            {[{ name: data.nameA, reading: marriageClass.a }, { name: data.nameB, reading: marriageClass.b }].map(col => (
              <div key={col.name}>
                <SectionLabel>{col.name}</SectionLabel>
                <MarriageClassSections reading={col.reading} showPrinciples={false} clientSafe={clientSafe} />
              </div>
            ))}
          </div>
          {!clientSafe ? (
            <p style={{ margin: '0.85rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{marriageClass.a.principles}</p>
          ) : null}
        </div>
      )}

      {marriageHouses && (
        <div className="card" style={{ padding: '1.15rem' }}>
          <SectionLabel>{tMilan('housesBothTitle')}</SectionLabel>
          <NoteCards notes={marriageHouses.pair} clientSafe={clientSafe} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '0.85rem', marginTop: '0.85rem' }}>
            {[{ name: data.nameA, reading: marriageHouses.a }, { name: data.nameB, reading: marriageHouses.b }].map(col => (
              <div key={col.name}>
                <SectionLabel>{col.name}</SectionLabel>
                <MarriageHousesSections reading={col.reading} showPrinciples={false} clientSafe={clientSafe} />
              </div>
            ))}
          </div>
          {!clientSafe ? (
            <p style={{ margin: '0.85rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{marriageHouses.a.principles}</p>
          ) : null}
        </div>
      )}

      {seventhLord && (
        <div className="card" style={{ padding: '1.15rem' }}>
          <SectionLabel>{tMilan('lordBothTitle')}</SectionLabel>
          <NoteCards notes={seventhLord.pair} clientSafe={clientSafe} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '0.85rem', marginTop: '0.85rem' }}>
            {[{ name: data.nameA, reading: seventhLord.a }, { name: data.nameB, reading: seventhLord.b }].map(col => (
              <div key={col.name}>
                <SectionLabel>{col.name}</SectionLabel>
                <SeventhLordSections reading={col.reading} showPrinciples={false} clientSafe={clientSafe} />
              </div>
            ))}
          </div>
          {!clientSafe ? (
            <p style={{ margin: '0.85rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{seventhLord.a.principles}</p>
          ) : null}
        </div>
      )}

      {venusJupiter && (
        <div className="card" style={{ padding: '1.15rem' }}>
          <SectionLabel>{tMilan('venusJupiterBothTitle')}</SectionLabel>
          <NoteCards notes={venusJupiter.pair} clientSafe={clientSafe} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '0.85rem', marginTop: '0.85rem' }}>
            {[{ name: data.nameA, reading: venusJupiter.a }, { name: data.nameB, reading: venusJupiter.b }].map(col => (
              <div key={col.name}>
                <SectionLabel>{col.name}</SectionLabel>
                <VenusJupiterSections reading={col.reading} showPrinciples={false} clientSafe={clientSafe} />
              </div>
            ))}
          </div>
          {!clientSafe ? (
            <p style={{ margin: '0.85rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{venusJupiter.a.principles}</p>
          ) : null}
        </div>
      )}

      {marriageMars && (
        <div className="card" style={{ padding: '1.15rem' }}>
          <SectionLabel>{tMilan('marsBothTitle')}</SectionLabel>
          <NoteCards notes={marriageMars.pair} clientSafe={clientSafe} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '0.85rem', marginTop: '0.85rem' }}>
            {[{ name: data.nameA, reading: marriageMars.a }, { name: data.nameB, reading: marriageMars.b }].map(col => (
              <div key={col.name}>
                <SectionLabel>{col.name}</SectionLabel>
                <MarriageMarsSections reading={col.reading} showPrinciples={false} clientSafe={clientSafe} />
              </div>
            ))}
          </div>
          {!clientSafe ? (
            <p style={{ margin: '0.85rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{marriageMars.a.principles}</p>
          ) : null}
        </div>
      )}

      {marriageVivah && (
        <div className="card" style={{ padding: '1.15rem' }}>
          <SectionLabel>{tMilan('vivahBothTitle')}</SectionLabel>
          <NoteCards notes={marriageVivah.pair} clientSafe={clientSafe} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '0.85rem', marginTop: '0.85rem' }}>
            {[{ name: data.nameA, reading: marriageVivah.a }, { name: data.nameB, reading: marriageVivah.b }].map(col => (
              <div key={col.name}>
                <SectionLabel>{col.name}</SectionLabel>
                <MarriageVivahSections reading={col.reading} showPrinciples={false} clientSafe={clientSafe} />
              </div>
            ))}
          </div>
          {!clientSafe ? (
            <p style={{ margin: '0.85rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{marriageVivah.a.principles}</p>
          ) : null}
        </div>
      )}

      {venusMarriage && (
        <div className="card" style={{ padding: '1.15rem' }}>
          <SectionLabel>{tMilan('venusBridgeBothTitle')}</SectionLabel>
          <NoteCards notes={venusMarriage.pair} clientSafe={clientSafe} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '0.85rem', marginTop: '0.85rem' }}>
            {[{ name: data.nameA, reading: venusMarriage.a }, { name: data.nameB, reading: venusMarriage.b }].map(col => (
              <div key={col.name}>
                <SectionLabel>{col.name}</SectionLabel>
                <VenusMarriageSections reading={col.reading} clientSafe={clientSafe} />
              </div>
            ))}
          </div>
        </div>
      )}

      {marriageGochar && (
        <div className="card" style={{ padding: '1.15rem' }}>
          <SectionLabel>{tMilan('gocharBothTitle')}</SectionLabel>
          <NoteCards notes={marriageGochar.pair} clientSafe={clientSafe} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '0.85rem', marginTop: '0.85rem' }}>
            {[{ name: data.nameA, reading: marriageGochar.a }, { name: data.nameB, reading: marriageGochar.b }].map(col => (
              <div key={col.name}>
                <SectionLabel>{col.name}</SectionLabel>
                <MarriageGocharSections reading={col.reading} showPrinciples={false} clientSafe={clientSafe} />
              </div>
            ))}
          </div>
          {!clientSafe ? (
            <p style={{ margin: '0.85rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{marriageGochar.a.principles}</p>
          ) : null}
        </div>
      )}

      {partnerNature && (
        <div className="card" style={{ padding: '1.15rem' }}>
          <SectionLabel>{tMilan('partnerBothTitle')}</SectionLabel>
          <NoteCards notes={partnerNature.pair} clientSafe={clientSafe} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '0.85rem', marginTop: '0.85rem' }}>
            {[{ name: data.nameA, reading: partnerNature.a }, { name: data.nameB, reading: partnerNature.b }].map(col => (
              <div key={col.name}>
                <SectionLabel>{col.name}</SectionLabel>
                <PartnerNatureSections reading={col.reading} showPrinciples={false} clientSafe={clientSafe} />
              </div>
            ))}
          </div>
          {!clientSafe ? (
            <p style={{ margin: '0.85rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{partnerNature.a.principles}</p>
          ) : null}
        </div>
      )}

      {divorceEnergy && (
        <div className="card" style={{ padding: '1.15rem' }}>
          <SectionLabel>{tMilan('splitBothTitle')}</SectionLabel>
          <NoteCards notes={divorceEnergy.pair} clientSafe={clientSafe} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '0.85rem', marginTop: '0.85rem' }}>
            {[{ name: data.nameA, reading: divorceEnergy.a }, { name: data.nameB, reading: divorceEnergy.b }].map(col => (
              <div key={col.name}>
                <SectionLabel>{col.name}</SectionLabel>
                <DivorceEnergySections reading={col.reading} showPrinciples={false} clientSafe={clientSafe} />
              </div>
            ))}
          </div>
          {!clientSafe ? (
            <p style={{ margin: '0.85rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{divorceEnergy.a.principles}</p>
          ) : null}
        </div>
      )}

      {karmicDebt && (
        <div className="card" style={{ padding: '1.15rem' }}>
          <SectionLabel>{tMilan('karmicBothTitle')}</SectionLabel>
          <NoteCards notes={karmicDebt.pair} clientSafe={clientSafe} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '0.85rem', marginTop: '0.85rem' }}>
            {[{ name: data.nameA, reading: karmicDebt.a }, { name: data.nameB, reading: karmicDebt.b }].map(col => (
              <div key={col.name}>
                <SectionLabel>{col.name}</SectionLabel>
                <KarmicDebtSections reading={col.reading} showPrinciples={false} clientSafe={clientSafe} />
              </div>
            ))}
          </div>
          {!clientSafe ? (
            <p style={{ margin: '0.85rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{karmicDebt.a.principles}</p>
          ) : null}
        </div>
      )}

      {marriageKarma && (
        <div className="card" style={{ padding: '1.15rem' }}>
          <SectionLabel>{tMilan('marriageKarmaBothTitle')}</SectionLabel>
          <NoteCards notes={marriageKarma.pair} clientSafe={clientSafe} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '0.85rem', marginTop: '0.85rem' }}>
            {[{ name: data.nameA, reading: marriageKarma.a }, { name: data.nameB, reading: marriageKarma.b }].map(col => (
              <div key={col.name}>
                <SectionLabel>{col.name}</SectionLabel>
                <MarriageKarmaSections reading={col.reading} clientSafe={clientSafe} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '0.75rem' }}>
        {[{ name: data.nameA, life: data.personA }, { name: data.nameB, life: data.personB }].map(({ name, life }) => (
          <div key={name} className="card" style={{ padding: '1.1rem' }}>
            <SectionLabel>{name}</SectionLabel>
            <p style={{ margin: '0 0 0.45rem', fontWeight: 750, fontSize: '0.88rem' }}>{life.headline}</p>
            <p style={{ margin: '0 0 0.45rem', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{life.bondStyle}</p>
            <ul style={{ margin: 0, paddingLeft: '1.05rem', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
              {life.significators.map(s => (
                <li key={s.id} style={{ marginBottom: 4 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{s.title}:</strong> {s.placement}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      </>}
      </>}
    </div>
  )
}
