// ─────────────────────────────────────────────────────────────
//  src/components/ui/DwadashamshaWorkspace.tsx
//  Dedicated Dwadashamsha (D12) workspace — isolation, thirst, release
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useMemo, useState } from 'react'
import {
  Compass,
  CloudMoon,
  Droplets,
  GitCompare,
  Layers,
  Sparkles,
  Wind,
} from 'lucide-react'
import { PanelShell } from '@/components/ui/patterns'
import {
  analyzeDwadashamsha,
} from '@/lib/engine/dwadashamshaAnalysis'
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
  toneAccent,
  type VargaTabSpec,
  toneClass, VargaSectionHead, VargaSignalBalance, VargaInsightGrid } from '@/components/ui/varga/VargaShell'

type TabId = 'overview' | 'isolation' | 'thirst' | 'houses' | 'contrast' | 'cross'

const TABS: VargaTabSpec<TabId>[] = [
  { id: 'overview', Icon: Sparkles, group: 'read' },
  { id: 'isolation', Icon: CloudMoon, group: 'themes' },
  { id: 'thirst', Icon: Droplets, group: 'themes' },
  { id: 'houses', Icon: Layers, group: 'chart' },
  { id: 'contrast', Icon: GitCompare, group: 'themes' },
  { id: 'cross', Icon: Wind, group: 'depth' },
]

const TAB_ICON = tabIconMap(TABS)

interface DwadashamshaWorkspaceProps {
  chart: ChartOutput
  userPlan?: UserPlan
}

export function DwadashamshaWorkspace({ chart, userPlan: _userPlan = 'free' }: DwadashamshaWorkspaceProps) {
  const [tab, setTab] = useState<TabId>('overview')
  const t = useTranslations('divisional.d12')
  const tabGroups = useVargaTabGroups(TABS, (id) => t(`tabs.${id}`), (id) => t(`tabs.${id}Short`))
  const c = useDivisionalCommon()
  const { lang } = c
  const analysis = useMemo(() => analyzeDwadashamsha(chart, lang), [chart, lang])

  const d12Asc = (chart.vargaLagnas?.D12 ?? 1) as Rashi
  const d12Grahas = chart.vargas?.D12 ?? []

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

  const { isolation, thirst, ketuRelease } = analysis

  return (
    <VargaWorkspace varga="D12">
      <VargaHero
        varga="D12"
        eyebrow={t('eyebrow')}
        title={analysis.d12LagnaName}
        sanskrit={c.hi ? undefined : analysis.d12LagnaSanskrit}
        summary={analysis.summary}
        journey={{ from: c.sign(chart.lagnas.ascRashi as Rashi), to: analysis.d12LagnaName }}
        badges={[
          isolation.lagnaEmpty
            ? { key: 'lagna', label: t('badgeEmpty'), tone: 'teal' }
            : { key: 'lagna', label: t('badgeOnLagna', { names: isolation.occupants.map((o) => o.name).join(' · ') }), tone: 'gold' },
          isolation.aloneInDreams && { key: 'alone', label: t('badgeAlone'), tone: 'rose' },
          thirst && { key: 'thirst', label: t('badgeThirst', { name: thirst.name }), tone: 'gold' },
          ketuRelease.tone === 'supportive' && { key: 'ketu', label: t('badgeKetu'), tone: 'teal' },
        ]}
        stats={[
          { key: 'lagna', Icon: Compass, label: t('statLagna'), value: analysis.d12LagnaName, hint: t('statLagnaHint') },
          {
            key: 'signal',
            Icon: CloudMoon,
            label: t('statSignal'),
            value: isolation.primarySignal.strength === 'occupation' ? t('signalOccupation') : t('signalLord'),
            hint: isolation.primarySignal.label,
          },
          {
            key: 'thirst',
            Icon: Droplets,
            label: t('statThirst'),
            value: thirst ? thirst.name : t('noneMarked'),
            hint: thirst ? `${thirst.rashiName} · ${c.houseShort(thirst.house)}` : t('noDebility'),
            accent: thirst ? 'rose' : 'teal',
          },
          {
            key: 'ketu',
            Icon: Wind,
            label: t('statKetu'),
            value: ketuRelease.house != null ? c.houseShort(ketuRelease.house) : '—',
            hint: ketuRelease.rashiName ?? '—',
            accent: toneAccent(ketuRelease.tone),
          },
        ]}
      />

      <VargaCharts
        chart={chart}
        d1Title={t('chartD1')}
        d1Accent={t('chartD1Accent')}
        focus={{
          tag: 'D12',
          title: t('chartD12'),
          accent: t('chartD12Accent', { lagna: c.lagnaOf(d12Asc) }),
          ascRashi: d12Asc,
          grahas: d12Grahas,
          vargaName: 'D12',
          highlightHouses: [1, 8, 12],
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

      {tab === 'isolation' && (
        <section className={styles.section}>
          <VargaSectionHead Icon={TAB_ICON[tab]} title={t('isolationTitle')} />
          <p className={styles.leadText}>
            {t('isolationIntro')}
            {isolation.lagnaEmpty ? t('isolationEmpty') : ''}
          </p>

          <article className={cn(styles.insightCard, styles.insightHighlight)} style={{ marginBottom: '0.85rem' }}>
            <h4 className={styles.insightTitle}>{isolation.primarySignal.label}</h4>
            <p className={styles.insightText}>{isolation.primarySignal.detail}</p>
          </article>

          <div className={styles.sketchGrid}>
            <div className={styles.sketchCard}>
              <h4 className={styles.insightTitle}>{t('signFlavor')}</h4>
              <p className={styles.insightText}>{isolation.signFlavor}</p>
            </div>
            <div className={styles.sketchCard}>
              <h4 className={styles.insightTitle}>
                {t('lagnaLord', { name: isolation.lagnaLord.name })}
              </h4>
              <p className={styles.insightText}>{isolation.lagnaLord.reading}</p>
              {isolation.lagnaLord.conjunctNames.length > 0 && (
                <p className={styles.statHint} style={{ marginTop: '0.4rem', whiteSpace: 'normal' }}>
                  {t('with', { names: isolation.lagnaLord.conjunctNames.join(', ') })}
                </p>
              )}
            </div>
          </div>

          {isolation.occupants.length > 0 && (
            <>
              <VargaSectionHead title={t('planetsOnLagna')} style={{ marginTop: '1.1rem' }} />
              <div className={styles.cardGrid}>
                {isolation.occupants.map((o) => (
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

          {isolation.aloneInDreams && (
            <article className={cn(styles.insightCard, styles.insightCaution)} style={{ marginTop: '0.85rem' }}>
              <h4 className={styles.insightTitle}>{t('emptyKendras')}</h4>
              <p className={styles.insightText}>
                {t('emptyKendrasText', { houses: isolation.emptyKendras.join(', ') })}
              </p>
            </article>
          )}
        </section>
      )}

      {tab === 'thirst' && (
        <section className={styles.section}>
          <VargaSectionHead Icon={TAB_ICON[tab]} title={t('thirstTitle')} />
          <p className={styles.leadText}>
            {t('thirstIntro')}
          </p>

          {thirst ? (
            <article className={cn(styles.insightCard, styles.insightCaution)} style={{ marginBottom: '0.85rem' }}>
              <h4 className={styles.insightTitle}>
                {t('primaryThirst', { name: thirst.name })}
              </h4>
              <p className={styles.insightText}>{thirst.reading}</p>
              <p className={styles.insightText} style={{ marginTop: '0.45rem' }}>
                {thirst.overcompensateHint}
              </p>
              <div className={styles.statHint} style={{ marginTop: '0.4rem', whiteSpace: 'normal' }}>
                {thirst.rashiName} · {c.houseShort(thirst.house)} · {c.dignity(thirst.dignity)}
              </div>
            </article>
          ) : (
            <p className={styles.emptyHint}>{t('noThirst')}</p>
          )}

          {analysis.thirstCandidates.length > 1 && (
            <>
              <VargaSectionHead title={t('otherMarkers')} style={{ marginTop: '0.5rem' }} />
              <div className={styles.cardGrid}>
                {analysis.thirstCandidates.slice(1).map((tc) => (
                  <article key={tc.id} className={styles.planetCard}>
                    <div className={styles.planetCardHead}>
                      <h4 className={styles.planetName}>{tc.name}</h4>
                      <span className={cn(styles.pill, toneClass(tc.tone))}>{t('thirstPill')}</span>
                    </div>
                    <p className={styles.planetBody}>{tc.reading}</p>
                  </article>
                ))}
              </div>
            </>
          )}

          <VargaSectionHead title={t('ketuLetGo')} style={{ marginTop: '1.1rem' }} />
          <article className={cn(styles.insightCard, ketuRelease.tone === 'supportive' ? styles.insightStrength : styles.insightInfo)}>
            <h4 className={styles.insightTitle}>
              {t('ketu')}
              {ketuRelease.house != null ? ` · ${c.houseShort(ketuRelease.house)}` : ''}
            </h4>
            <p className={styles.insightText}>{ketuRelease.reading}</p>
          </article>

          <VargaSectionHead title={t('planetsTitle')} style={{ marginTop: '1.1rem' }} />
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

      {tab === 'houses' && (
        <section className={styles.section}>
          <VargaSectionHead Icon={TAB_ICON[tab]} title={t('focusedTitle')} />
          <p className={styles.leadText}>
            {t('focusedIntro')}
          </p>
          <div className={styles.houseGrid}>
            {analysis.focusedHouses.map((h) => (
              <article
                key={h.house}
                className={cn(styles.houseCard, (h.house === 8 || h.house === 12) && styles.houseCardHot)}
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

      {tab === 'contrast' && (
        <section className={styles.section}>
          <VargaSectionHead Icon={TAB_ICON[tab]} title={t('contrastTitle')} />
          <p className={styles.leadText}>
            {t('contrastIntro')}
          </p>
          <div className={styles.insightGrid}>
            {analysis.contrasts.map((ct) => (
              <article key={ct.id} className={cn(styles.insightCard, ct.id === 'd12' ? styles.insightHighlight : styles.insightInfo)}>
                <h4 className={styles.insightTitle}>{ct.label}</h4>
                <p className={styles.insightText}>
                  <strong>{ct.nature}</strong> {ct.summary}
                </p>
                {ct.chartNote && (
                  <p className={styles.insightText} style={{ marginTop: '0.45rem' }}>
                    {ct.chartNote}
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === 'cross' && (
        <section className={styles.section}>
          <VargaSectionHead Icon={TAB_ICON[tab]} title={t('crossTitle')} />
          <p className={styles.leadText}>
            {t('crossIntro')}
          </p>
          {analysis.crossNotes.length === 0 ? (
            <p className={styles.emptyHint}>
              {t('crossEmpty')}
            </p>
          ) : (
            <div className={styles.insightGrid}>
              {analysis.crossNotes.map((n) => (
                <article key={n.id} className={cn(styles.insightCard, toneClass(n.tone))}>
                  <h4 className={styles.insightTitle}>{n.title}</h4>
                  <p className={styles.insightText}>{n.text}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </VargaWorkspace>
  )
}
