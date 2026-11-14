// ─────────────────────────────────────────────────────────────
//  src/components/ui/DrekkanaWorkspace.tsx
//  Dedicated Drekkana (D3) workspace — subconscious mind & effort
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useMemo, useState } from 'react'
import {
  Clock,
  Activity,
  BatteryWarning,
  Brain,
  GitCompare,
  Heart,
  Layers,
  Music,
  Sparkles,
  Zap,
} from 'lucide-react'
import { PanelShell } from '@/components/ui/patterns'
import {
  analyzeDrekkana,
} from '@/lib/engine/drekkanaAnalysis'
import { cn } from '@/lib/ui/cn'
import { useTranslations } from 'next-intl'
import { useDivisionalCommon } from '@/components/ui/useDivisionalCommon'
import type { ChartOutput, Rashi, UserPlan } from '@/types/astrology'
import {
  vargaStyles as styles,
  tabIconMap,
  useVargaTabGroups,
  VargaCharts,
  VargaHero,
  VargaTabNav,
  VargaWorkspace,
  type VargaTabSpec,
  insightClass, toneClass, VargaSectionHead, VargaSignalBalance, VargaInsightGrid } from '@/components/ui/varga/VargaShell'

type TabId = 'overview' | 'mind' | 'style' | 'capacity' | 'drain' | 'kama' | 'effort' | 'houses' | 'planets'

const TABS: VargaTabSpec<TabId>[] = [
  { id: 'overview', Icon: Sparkles, group: 'read' },
  { id: 'mind', Icon: Brain, group: 'themes' },
  { id: 'style', Icon: Music, group: 'themes' },
  { id: 'capacity', Icon: Activity, group: 'themes' },
  { id: 'drain', Icon: BatteryWarning, group: 'themes' },
  { id: 'kama', Icon: Heart, group: 'themes' },
  { id: 'effort', Icon: GitCompare, group: 'themes' },
  { id: 'houses', Icon: Layers, group: 'chart' },
  { id: 'planets', Icon: Zap, group: 'chart' },
]

const TAB_ICON = tabIconMap(TABS)

interface DrekkanaWorkspaceProps {
  chart: ChartOutput
  userPlan?: UserPlan
}

export function DrekkanaWorkspace({ chart, userPlan: _userPlan = 'free' }: DrekkanaWorkspaceProps) {
  const [tab, setTab] = useState<TabId>('overview')
  const t = useTranslations('divisional.d3')
  const tabGroups = useVargaTabGroups(TABS, (id) => t(`tabs.${id}`), (id) => t(`tabs.${id}Short`))
  const c = useDivisionalCommon()
  const { lang } = c
  const analysis = useMemo(() => analyzeDrekkana(chart, lang), [chart, lang])
  const d3Asc = (chart.vargaLagnas?.D3 ?? 1) as Rashi
  const d3Grahas = chart.vargas?.D3 ?? []

  if (!analysis) {
    return (
      <PanelShell
        title={t('title')}
        empty={{
          title: t('emptyTitle'),
          description: t('emptyDesc'),
        }}
      >
        {null}
      </PanelShell>
    )
  }

  const {
    mind, kamaTrikona, persistence, stuckEighth,
    saturnDrain, timeStyle, musicStudy, capacity, courage, exhaustion,
  } = analysis

  return (
    <VargaWorkspace varga="D3">
      <VargaHero
        varga="D3"
        eyebrow={t('eyebrow')}
        title={analysis.d3LagnaName}
        sanskrit={c.hi ? undefined : analysis.d3LagnaSanskrit}
        summary={analysis.summary}
        journey={{ from: c.sign(chart.lagnas.ascRashi as Rashi), to: analysis.d3LagnaName }}
        badges={[
          { key: 'time', label: timeStyle.label, tone: 'gold' },
          { key: 'pace', label: t(`pace.${capacity.style}`), tone: 'teal' },
          saturnDrain.active && { key: 'saturn', label: t('badgeSaturn'), tone: 'rose' },
          stuckEighth.loaded && { key: 'eighth', label: t('badgeEighth'), tone: 'rose' },
          kamaTrikona.active && { key: 'kama', label: t('badgeKama'), tone: 'gold' },
          persistence.active && { key: 'persist', label: t('badgePersist'), tone: 'teal' },
        ]}
        stats={[
          { key: 'time', Icon: Clock, label: t('statTime'), value: t(`orientation.${timeStyle.orientation}`), hint: t(`element.${timeStyle.element}`) },
          { key: 'capacity', Icon: Activity, label: t('statCapacity'), value: t(`style.${capacity.style}`), hint: t('digbaliCount', { n: capacity.digbaliCount }) },
          { key: 'exhaustion', Icon: BatteryWarning, label: t('statExhaustion'), value: t(`level.${exhaustion.level}`), hint: `${exhaustion.score}/10`, accent: exhaustion.score >= 7 ? 'rose' : exhaustion.score <= 3 ? 'teal' : 'gold' },
          {
            key: 'cluster',
            Icon: Brain,
            label: t('statCluster'),
            value: mind.dominantHouse != null ? c.houseShort(mind.dominantHouse) : '—',
            hint: t(`decision.${mind.decisionStyle}`),
          },
        ]}
      />

      <VargaCharts
        chart={chart}
        d1Title={t('chartD1')}
        d1Accent={t('chartD1Accent')}
        focus={{
          tag: 'D3',
          title: t('chartD3'),
          accent: t('chartD3Accent', { lagna: c.lagnaOf(d3Asc) }),
          ascRashi: d3Asc,
          grahas: d3Grahas,
          vargaName: 'D3',
          highlightHouses: [1, 5, 7, 8, 9],
        }}
      />

      <VargaTabNav groups={tabGroups} active={tab} onChange={setTab} ariaLabel={t('tabsAria')} />

      {tab === 'overview' && (
        <section className={styles.section}>
          <VargaSectionHead Icon={TAB_ICON[tab]} title={t('insightsTitle')} />
          <p className={styles.leadText}>
            {analysis.purpose}
          </p>
          <VargaSignalBalance kinds={analysis.insights.map((i) => i.kind)} />
          <VargaInsightGrid insights={analysis.insights} />
          <p className={styles.heroSub} style={{ marginTop: '0.85rem', maxWidth: 'none' }}>
            {analysis.layerNote}
          </p>
          <p className={styles.heroSub} style={{ marginTop: '0.55rem', maxWidth: 'none' }}>
            {analysis.sangatNote}
          </p>
        </section>
      )}

      {tab === 'mind' && (
        <section className={styles.section}>
          <VargaSectionHead Icon={TAB_ICON[tab]} title={t('mindTitle')} />
          <article className={cn(styles.insightCard, styles.insightHighlight)} style={{ marginBottom: '0.85rem' }}>
            <h4 className={styles.insightTitle}>{mind.primarySignal.label}</h4>
            <p className={styles.insightText}>{mind.primarySignal.detail}</p>
          </article>
          <div className={styles.sketchGrid}>
            <div className={styles.sketchCard}>
              <h4 className={styles.insightTitle}>{t('signFlavor')}</h4>
              <p className={styles.insightText}>{mind.signFlavor}</p>
            </div>
            <div className={styles.sketchCard}>
              <h4 className={styles.insightTitle}>{t('decisionStyle')}</h4>
              <p className={styles.insightText}>{mind.decisionNote}</p>
            </div>
          </div>
          <div className={styles.sketchGrid} style={{ marginTop: '0.65rem' }}>
            <div className={styles.sketchCard}>
              <h4 className={styles.insightTitle}>{t('lagnaLord', { name: mind.lagnaLord.name })}</h4>
              <p className={styles.insightText}>{mind.lagnaLord.reading}</p>
            </div>
            <div className={styles.sketchCard}>
              <h4 className={styles.insightTitle}>{t('persistence')}</h4>
              <p className={styles.insightText}>{persistence.reading}</p>
            </div>
          </div>
          {stuckEighth.loaded && (
            <article className={cn(styles.insightCard, styles.insightCaution)} style={{ marginTop: '0.85rem' }}>
              <h4 className={styles.insightTitle}>{t('eighthStuck')}</h4>
              <p className={styles.insightText}>{stuckEighth.reading}</p>
            </article>
          )}
          {mind.occupants.length > 0 && (
            <>
              <VargaSectionHead title={t('planetsOnLagna')} style={{ marginTop: '1.1rem' }} />
              <div className={styles.cardGrid}>
                {mind.occupants.map((o) => (
                  <article key={o.id} className={styles.planetCard}>
                    <div className={styles.planetCardHead}>
                      <h4 className={styles.planetName}>
                        {o.name}
                        {o.isRetro ? ' ℞' : ''}
                      </h4>
                    </div>
                    <p className={styles.planetBody}>{o.reading}</p>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {tab === 'style' && (
        <section className={styles.section}>
          <VargaSectionHead Icon={TAB_ICON[tab]} title={t('styleTitle')} />
          <div className={styles.insightGrid}>
            <article className={cn(styles.insightCard, styles.insightHighlight)}>
              <h4 className={styles.insightTitle}>{timeStyle.label}</h4>
              <p className={styles.insightText}>{timeStyle.reading}</p>
            </article>
            <article className={cn(styles.insightCard, styles.insightInfo)}>
              <h4 className={styles.insightTitle}>{musicStudy.musicLabel}</h4>
              <p className={styles.insightText}>{musicStudy.musicReading}</p>
            </article>
            <article className={cn(styles.insightCard, toneClass(musicStudy.tone))}>
              <h4 className={styles.insightTitle}>{musicStudy.studyLabel}</h4>
              <p className={styles.insightText}>{musicStudy.studyReading}</p>
            </article>
            <article className={cn(styles.insightCard, toneClass(courage.tone))}>
              <h4 className={styles.insightTitle}>{t('courage')}</h4>
              <p className={styles.insightText}>{courage.reading}</p>
            </article>
          </div>
        </section>
      )}

      {tab === 'capacity' && (
        <section className={styles.section}>
          <VargaSectionHead Icon={TAB_ICON[tab]} title={t('capacityTitle')} />
          <article className={cn(styles.insightCard, insightClass(
            capacity.tone === 'challenging' ? 'caution' : capacity.tone === 'supportive' ? 'strength' : 'info',
          ))} style={{ marginBottom: '0.85rem' }}>
            <h4 className={styles.insightTitle}>
              {t('capacityHead', { style: t(`style.${capacity.style}`), n: capacity.digbaliCount })}
            </h4>
            <p className={styles.insightText}>{capacity.reading}</p>
          </article>
          <p className={styles.leadText}>
            {t('capacityIntro')}
          </p>
          <div className={styles.cardGrid}>
            {capacity.digbali.map((d) => (
              <article key={d.id} className={styles.planetCard}>
                <div className={styles.planetCardHead}>
                  <h4 className={styles.planetName}>{d.name}</h4>
                  <span className={cn(styles.pill, d.isDigbali ? styles.toneSupportive : styles.toneNeutral)}>
                    {d.isDigbali ? t('digbali') : t('needsHouse', { house: d.digHouse })}
                  </span>
                </div>
                <div className={styles.mappingLine}>{t('nowIn', { house: d.house })}</div>
                <p className={styles.planetBody}>{d.reading}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === 'drain' && (
        <section className={styles.section}>
          <VargaSectionHead Icon={TAB_ICON[tab]} title={t('drainTitle')} />
          <div className={styles.insightGrid}>
            <article className={cn(styles.insightCard, toneClass(saturnDrain.tone))}>
              <h4 className={styles.insightTitle}>{t('saturnDrain')}</h4>
              <p className={styles.insightText}>{saturnDrain.reading}</p>
            </article>
            <article className={cn(styles.insightCard, toneClass(exhaustion.tone))}>
              <h4 className={styles.insightTitle}>
                {t('exhaustionHead', { level: t(`level.${exhaustion.level}`), score: exhaustion.score })}
              </h4>
              <p className={styles.insightText}>{exhaustion.reading}</p>
            </article>
            <article className={cn(styles.insightCard, toneClass(stuckEighth.tone))}>
              <h4 className={styles.insightTitle}>{t('eighthZone')}</h4>
              <p className={styles.insightText}>{stuckEighth.reading}</p>
            </article>
            <article className={cn(styles.insightCard, styles.insightInfo)}>
              <h4 className={styles.insightTitle}>{t('sangat')}</h4>
              <p className={styles.insightText}>{analysis.sangatNote}</p>
            </article>
          </div>
        </section>
      )}

      {tab === 'kama' && (
        <section className={styles.section}>
          <VargaSectionHead Icon={TAB_ICON[tab]} title={t('kamaTitle')} />
          <article className={cn(styles.insightCard, kamaTrikona.active ? styles.insightCaution : styles.insightInfo)}>
            <h4 className={styles.insightTitle}>
              {kamaTrikona.classicPattern ? t('kamaClassic') : kamaTrikona.active ? t('kamaActive') : t('kamaQuiet')}
            </h4>
            <p className={styles.insightText}>{kamaTrikona.reading}</p>
            <div className={styles.statHint} style={{ marginTop: '0.45rem', whiteSpace: 'normal' }}>
              {t('kamaHouses', { ra: kamaTrikona.rahuHouse ?? '—', ve: kamaTrikona.venusHouse ?? '—', me: kamaTrikona.mercuryHouse ?? '—' })}
            </div>
          </article>
          <p className={styles.heroSub} style={{ marginTop: '0.85rem', maxWidth: 'none' }}>
            {t('kamaNote')}
          </p>
        </section>
      )}

      {tab === 'effort' && (
        <section className={styles.section}>
          <VargaSectionHead Icon={TAB_ICON[tab]} title={t('effortTitle')} />
          <p className={styles.leadText}>
            {t('effortIntro')}
          </p>
          <div className={styles.insightGrid}>
            {analysis.effortCompares.map((e) => (
              <article key={e.id} className={cn(styles.insightCard, toneClass(
                e.lean === 'balanced' ? 'neutral' : e.lean === 'self' ? 'supportive' : 'mixed',
              ))}>
                <h4 className={styles.insightTitle}>{e.label}</h4>
                <p className={styles.insightText}>{e.reading}</p>
                <div className={styles.statHint} style={{ marginTop: '0.35rem', whiteSpace: 'normal' }}>
                  {t('effortScores', { self: e.selfScore, house: e.otherHouse, other: e.otherScore })}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === 'houses' && (
        <section className={styles.section}>
          <VargaSectionHead Icon={TAB_ICON[tab]} title={t('focusedTitle')} />
          <div className={styles.houseGrid}>
            {analysis.focusedHouses.map((h) => (
              <article
                key={h.house}
                className={cn(styles.houseCard, (h.house === 8 || h.house === 7) && styles.houseCardHot)}
              >
                <div className={styles.houseNum}>{c.house(h.house)}</div>
                <div className={styles.houseSign}>{h.rashiName}</div>
                <div className={styles.houseMeta}>
                  {t('lord', { name: h.lordName })}
                  <span className={cn(styles.pill, toneClass(h.tone))} style={{ marginLeft: 6 }}>
                    {c.tone(h.tone)}
                  </span>
                </div>
                <div className={styles.housePlanets}>
                  {h.occupants.length
                    ? h.occupants.map((o) => `${o.name}${o.isRetro ? '℞' : ''}`).join(', ')
                    : '—'}
                </div>
                <p className={styles.planetBody} style={{ marginTop: '0.4rem' }}>{h.reading}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === 'planets' && (
        <section className={styles.section}>
          <VargaSectionHead Icon={TAB_ICON[tab]} title={t('planetsTitle')} />
          <div className={styles.cardGrid}>
            {analysis.planets.map((p) => (
              <article key={p.id} className={styles.planetCard}>
                <div className={styles.planetCardHead}>
                  <h4 className={styles.planetName}>
                    {p.name}
                    {p.isRetro ? ' ℞' : ''}
                  </h4>
                  <span className={cn(styles.pill, toneClass(p.tone))}>{c.tone(p.tone)}</span>
                </div>
                <div className={styles.mappingLine}>
                  {p.rashiName} · {c.houseShort(p.house)} · {c.dignity(p.dignity)}
                </div>
                <p className={styles.planetBody}>{p.interpretation}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </VargaWorkspace>
  )
}
