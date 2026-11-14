// ─────────────────────────────────────────────────────────────
//  src/components/ui/NakshatramshaWorkspace.tsx
//  Dedicated Nakshatramsha (D27) workspace — bandwidth & ask themes
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useMemo, useState } from 'react'
import {
  Compass,
  Crown,
  Activity,
  Layers,
  MessageCircle,
  Sparkles,
  Waves,
  Zap,
} from 'lucide-react'
import { PanelShell } from '@/components/ui/patterns'
import {
  analyzeNakshatramsha,
} from '@/lib/engine/nakshatramshaAnalysis'
import { useTranslations } from 'next-intl'
import { useDivisionalCommon } from '@/components/ui/useDivisionalCommon'
import { cn } from '@/lib/ui/cn'
import type { ChartOutput, Rashi, UserPlan } from '@/types/astrology'
import {
  vargaStyles as styles,
  tabIconMap,
  useVargaTabGroups,
  VargaCharts,
  VargaHero,
  VargaTabNav,
  VargaWorkspace,
  toneAccent,
  type VargaTabSpec,
  insightClass, toneClass, VargaSectionHead, VargaSignalBalance, VargaInsightGrid } from '@/components/ui/varga/VargaShell'

type TabId = 'overview' | 'bandwidth' | 'ask' | 'layer' | 'houses' | 'planets'

const TABS: VargaTabSpec<TabId>[] = [
  { id: 'overview', Icon: Sparkles, group: 'read' },
  { id: 'bandwidth', Icon: Activity, group: 'themes' },
  { id: 'ask', Icon: MessageCircle, group: 'themes' },
  { id: 'layer', Icon: Waves, group: 'depth' },
  { id: 'houses', Icon: Layers, group: 'chart' },
  { id: 'planets', Icon: Zap, group: 'chart' },
]

const TAB_ICON = tabIconMap(TABS)

interface NakshatramshaWorkspaceProps {
  chart: ChartOutput
  userPlan?: UserPlan
}

export function NakshatramshaWorkspace({ chart, userPlan: _userPlan = 'free' }: NakshatramshaWorkspaceProps) {
  const [tab, setTab] = useState<TabId>('overview')
  const t = useTranslations('divisional.d27')
  const tabGroups = useVargaTabGroups(TABS, (id) => t(`tabs.${id}`), (id) => t(`tabs.${id}Short`))
  const c = useDivisionalCommon()
  const { lang } = c
  const analysis = useMemo(() => analyzeNakshatramsha(chart, lang), [chart, lang])
  const d27Asc = (chart.vargaLagnas?.D27 ?? 1) as Rashi
  const d27Grahas = chart.vargas?.D27 ?? []

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

  const { focus, bandwidth, askThemes, layerLink } = analysis

  return (
    <VargaWorkspace varga="D27">
      <VargaHero
        varga="D27"
        eyebrow={t('eyebrow')}
        title={analysis.d27LagnaName}
        sanskrit={c.hi ? undefined : analysis.d27LagnaSanskrit}
        summary={analysis.summary}
        journey={{ from: c.sign(chart.lagnas.ascRashi as Rashi), to: analysis.d27LagnaName }}
        badges={[
          { key: 'band', label: bandwidth.label, tone: bandwidth.tone === 'supportive' ? 'teal' : bandwidth.tone === 'challenging' ? 'rose' : 'plain' },
          askThemes[0] && { key: 'ask', label: t('badgeAsk', { house: askThemes[0].house }), tone: 'gold' },
          layerLink.d3OverlapNote && { key: 'repeat', label: t('badgeRepeat'), tone: 'teal' },
        ]}
        stats={[
          { key: 'lagna', Icon: Compass, label: t('statLagna'), value: analysis.d27LagnaName, hint: t('statLagnaHint') },
          { key: 'band', Icon: Activity, label: t('statBandwidth'), value: `${bandwidth.score}/20`, hint: t(`band.${bandwidth.band}`), accent: toneAccent(bandwidth.tone) },
          { key: 'ask', Icon: MessageCircle, label: t('statTopAsk'), value: askThemes[0] ? c.houseShort(askThemes[0].house) : '—', hint: askThemes[0]?.theme ?? '—' },
          { key: 'lord', Icon: Crown, label: t('statLord'), value: focus.lagnaLord.name, hint: `${focus.lagnaLord.rashiName} · ${c.houseShort(focus.lagnaLord.house)}` },
        ]}
      />

      <VargaCharts
        chart={chart}
        d1Title={t('chartD1')}
        d1Accent={t('chartD1Accent')}
        focus={{
          tag: 'D27',
          title: t('chartD27'),
          accent: t('chartD27Accent', { lagna: c.lagnaOf(d27Asc) }),
          ascRashi: d27Asc,
          grahas: d27Grahas,
          vargaName: 'D27',
          highlightHouses: [1, 4, 7, 10],
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
        </section>
      )}

      {tab === 'bandwidth' && (
        <section className={styles.section}>
          <VargaSectionHead Icon={TAB_ICON[tab]} title={t('pressureTitle')} />
          <article className={cn(styles.insightCard, insightClass(
            bandwidth.tone === 'challenging' ? 'caution' : bandwidth.tone === 'supportive' ? 'strength' : 'info',
          ))}>
            <h4 className={styles.insightTitle}>
              {bandwidth.label} · {bandwidth.score}/20
            </h4>
            <p className={styles.insightText}>{bandwidth.reading}</p>
          </article>
          <div className={styles.sketchGrid} style={{ marginTop: '0.85rem' }}>
            <div className={styles.sketchCard}>
              <h4 className={styles.insightTitle}>{t('signFlavor')}</h4>
              <p className={styles.insightText}>{focus.signFlavor}</p>
            </div>
            <div className={styles.sketchCard}>
              <h4 className={styles.insightTitle}>{t('lagnaLord', { name: focus.lagnaLord.name })}</h4>
              <p className={styles.insightText}>{focus.lagnaLord.reading}</p>
            </div>
          </div>
          <p className={styles.heroSub} style={{ marginTop: '0.85rem', maxWidth: 'none' }}>
            {t('speaker')}
          </p>
        </section>
      )}

      {tab === 'ask' && (
        <section className={styles.section}>
          <VargaSectionHead Icon={TAB_ICON[tab]} title={t('voicedTitle')} />
          <p className={styles.leadText}>
            {t('sutra')}
          </p>
          <article className={cn(styles.insightCard, styles.insightInfo)} style={{ marginBottom: '0.85rem' }}>
            <h4 className={styles.insightTitle}>{t('hintTitle')}</h4>
            <p className={styles.insightText}>{focus.consultationHint}</p>
          </article>
          <div className={styles.insightGrid}>
            {askThemes.map((a) => (
              <article key={a.house} className={cn(styles.insightCard, toneClass(a.tone))}>
                <h4 className={styles.insightTitle}>
                  {c.houseShort(a.house)} · {a.theme}
                </h4>
                <p className={styles.insightText}>{a.reading}</p>
                <div className={styles.statHint} style={{ marginTop: '0.35rem', whiteSpace: 'normal' }}>
                  {c.vitality(a.vitalityScore)}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === 'layer' && (
        <section className={styles.section}>
          <VargaSectionHead Icon={TAB_ICON[tab]} title={t('layersTitle')} />
          <article className={cn(styles.insightCard, styles.insightHighlight)}>
            <h4 className={styles.insightTitle}>D1 → D3 → D27</h4>
            <p className={styles.insightText}>{layerLink.reading}</p>
          </article>
          {layerLink.d3LagnaName && (
            <p className={styles.heroSub} style={{ marginTop: '0.85rem', maxWidth: 'none' }}>
              {t('d3Lagna', { sign: layerLink.d3LagnaName })}
            </p>
          )}
        </section>
      )}

      {tab === 'houses' && (
        <section className={styles.section}>
          <VargaSectionHead Icon={TAB_ICON[tab]} title={t('focusedTitle')} />
          <div className={styles.houseGrid}>
            {analysis.focusedHouses.map((h) => (
              <article
                key={h.house}
                className={cn(styles.houseCard, (h.house === 1 || h.house === 7) && styles.houseCardHot)}
              >
                <div className={styles.houseNum}>{c.house(h.house)}</div>
                <div className={styles.houseSign}>{h.rashiName}</div>
                <div className={styles.houseMeta}>
                  {c.vitality(h.vitalityScore)}
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
