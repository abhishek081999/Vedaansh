// ─────────────────────────────────────────────────────────────
//  src/components/ui/DrekkanaWorkspace.tsx
//  Dedicated Drekkana (D3) workspace — subconscious mind & effort
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useMemo, useState } from 'react'
import {
  Activity,
  BatteryWarning,
  Brain,
  GitCompare,
  Heart,
  Layers,
  Music,
  Sparkles,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { ChakraSelector } from '@/components/chakra/ChakraSelector'
import { PanelShell } from '@/components/ui/patterns'
import {
  analyzeDrekkana,
  type D3Tone,
  type DrekkanaInsight,
} from '@/lib/engine/drekkanaAnalysis'
import { cn } from '@/lib/ui/cn'
import { useTranslations } from 'next-intl'
import { useDivisionalCommon } from '@/components/ui/useDivisionalCommon'
import type { ChartOutput, Rashi, UserPlan } from '@/types/astrology'
import styles from './DrekkanaWorkspace.module.css'

type TabId = 'overview' | 'mind' | 'style' | 'capacity' | 'drain' | 'kama' | 'effort' | 'houses' | 'planets'

const TABS: { id: TabId; Icon: LucideIcon }[] = [
  { id: 'overview', Icon: Sparkles },
  { id: 'mind', Icon: Brain },
  { id: 'style', Icon: Music },
  { id: 'capacity', Icon: Activity },
  { id: 'drain', Icon: BatteryWarning },
  { id: 'kama', Icon: Heart },
  { id: 'effort', Icon: GitCompare },
  { id: 'houses', Icon: Layers },
  { id: 'planets', Icon: Zap },
]

function insightClass(kind: DrekkanaInsight['kind']): string {
  if (kind === 'strength') return styles.insightStrength
  if (kind === 'caution') return styles.insightCaution
  if (kind === 'highlight') return styles.insightHighlight
  return styles.insightInfo
}

function toneClass(tone: D3Tone): string {
  if (tone === 'supportive') return styles.toneSupportive
  if (tone === 'challenging') return styles.toneChallenging
  if (tone === 'mixed') return styles.toneMixed
  return styles.toneNeutral
}

interface DrekkanaWorkspaceProps {
  chart: ChartOutput
  userPlan?: UserPlan
}

export function DrekkanaWorkspace({ chart, userPlan: _userPlan = 'free' }: DrekkanaWorkspaceProps) {
  const [tab, setTab] = useState<TabId>('overview')
  const t = useTranslations('divisional.d3')
  const c = useDivisionalCommon()
  const { lang } = c
  const analysis = useMemo(() => analyzeDrekkana(chart, lang), [chart, lang])
  const moonNakIndex = chart.grahas.find((g) => g.id === 'Mo')?.nakshatraIndex ?? 0
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
    <div className={styles.workspace}>
      <header className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden />
        <div className={styles.heroTop}>
          <div>
            <p className={styles.eyebrow}>{t('eyebrow')}</p>
            <h2 className={styles.heroTitle}>
              {analysis.d3LagnaName}
              {!c.hi && (
                <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{' '}· {analysis.d3LagnaSanskrit}</span>
              )}
            </h2>
            <p className={styles.heroSub}>{analysis.summary}</p>
          </div>
          <div className={styles.badgeRow}>
            <span className={cn(styles.badge, styles.badgeGold)}>{timeStyle.label}</span>
            <span className={cn(styles.badge, styles.badgeTeal)}>
              {t(`pace.${capacity.style}`)}
            </span>
            {saturnDrain.active && (
              <span className={cn(styles.badge)} style={{ color: 'var(--rose, #fb7185)' }}>
                {t('badgeSaturn')}
              </span>
            )}
            {kamaTrikona.active && (
              <span className={cn(styles.badge, styles.badgeGold)}>{t('badgeKama')}</span>
            )}
            {stuckEighth.loaded && (
              <span className={cn(styles.badge)} style={{ color: 'var(--rose, #fb7185)' }}>
                {t('badgeEighth')}
              </span>
            )}
            {persistence.active && (
              <span className={cn(styles.badge, styles.badgeTeal)}>{t('badgePersist')}</span>
            )}
          </div>
        </div>

        <div className={styles.statGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('statTime')}</div>
            <div className={styles.statValue}>{t(`orientation.${timeStyle.orientation}`)}</div>
            <div className={styles.statHint}>{t(`element.${timeStyle.element}`)}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('statCapacity')}</div>
            <div className={styles.statValue}>{t(`style.${capacity.style}`)}</div>
            <div className={styles.statHint}>{t('digbaliCount', { n: capacity.digbaliCount })}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('statExhaustion')}</div>
            <div className={styles.statValue}>{t(`level.${exhaustion.level}`)}</div>
            <div className={styles.statHint}>{exhaustion.score}/10</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('statCluster')}</div>
            <div className={styles.statValue}>
              {mind.dominantHouse != null ? c.houseShort(mind.dominantHouse) : '—'}
            </div>
            <div className={styles.statHint}>
              {t(`decision.${mind.decisionStyle}`)}
            </div>
          </div>
        </div>
      </header>

      <div className={styles.chartsRow}>
        <div className={styles.chartCard}>
          <div className={styles.chartLabel}>
            <span className={styles.chartTitle}>{t('chartD1')}</span>
            <span className={styles.chartAccent}>{t('chartD1Accent')}</span>
          </div>
          <ChakraSelector
            ascRashi={chart.lagnas.ascRashi as Rashi}
            grahas={chart.vargas?.D1 ?? chart.grahas}
            vargaName="D1"
            moonNakIndex={moonNakIndex}
            arudhas={chart.arudhas}
            tithiNumber={chart.panchang.tithi.number}
            varaNumber={chart.panchang.vara.number}
            defaultStyle="north"
            size={280}
            showCharaDrishtiControls
          />
        </div>
        <div className={styles.chartCard}>
          <div className={styles.chartLabel}>
            <span className={styles.chartTitle}>{t('chartD3')}</span>
            <span className={styles.chartAccent}>{t('chartD3Accent', { lagna: c.lagnaOf(d3Asc) })}</span>
          </div>
          <ChakraSelector
            ascRashi={d3Asc}
            grahas={d3Grahas}
            vargaName="D3"
            lagnas={chart.lagnas}
            moonNakIndex={moonNakIndex}
            defaultStyle="north"
            size={280}
            showCharaDrishtiControls
            highlightHouses={[1, 5, 7, 8, 9]}
          />
        </div>
      </div>

      <div className={styles.tabScroll}>
        <div className={styles.tabRow} role="tablist" aria-label={t('tabsAria')}>
          {TABS.map((tb) => (
            <button
              key={tb.id}
              type="button"
              role="tab"
              aria-selected={tab === tb.id}
              className={cn(styles.tabBtn, tab === tb.id && styles.tabBtnActive)}
              onClick={() => setTab(tb.id)}
            >
              <tb.Icon size={14} style={{ marginRight: 5, verticalAlign: -2 }} strokeWidth={tab === tb.id ? 2.25 : 2} />
              <span className={styles.tabLabelFull}>{t(`tabs.${tb.id}`)}</span>
              <span className={styles.tabLabelShort}>{t(`tabs.${tb.id}Short`)}</span>
            </button>
          ))}
        </div>
      </div>

      {tab === 'overview' && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('insightsTitle')}</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.heroSub} style={{ marginBottom: '0.85rem', maxWidth: 'none' }}>
            {analysis.purpose}
          </p>
          <div className={styles.insightGrid}>
            {analysis.insights.map((ins) => (
              <article key={`${ins.kind}-${ins.title}`} className={cn(styles.insightCard, insightClass(ins.kind))}>
                <h4 className={styles.insightTitle}>{ins.title}</h4>
                <p className={styles.insightText}>{ins.text}</p>
              </article>
            ))}
          </div>
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
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('mindTitle')}</h3>
            <div className={styles.sectionRule} />
          </div>
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
              <div className={styles.sectionHead} style={{ marginTop: '1.1rem' }}>
                <h3 className={styles.sectionTitle}>{t('planetsOnLagna')}</h3>
                <div className={styles.sectionRule} />
              </div>
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
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('styleTitle')}</h3>
            <div className={styles.sectionRule} />
          </div>
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
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('capacityTitle')}</h3>
            <div className={styles.sectionRule} />
          </div>
          <article className={cn(styles.insightCard, insightClass(
            capacity.tone === 'challenging' ? 'caution' : capacity.tone === 'supportive' ? 'strength' : 'info',
          ))} style={{ marginBottom: '0.85rem' }}>
            <h4 className={styles.insightTitle}>
              {t('capacityHead', { style: t(`style.${capacity.style}`), n: capacity.digbaliCount })}
            </h4>
            <p className={styles.insightText}>{capacity.reading}</p>
          </article>
          <p className={styles.heroSub} style={{ marginBottom: '0.85rem', maxWidth: 'none' }}>
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
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('drainTitle')}</h3>
            <div className={styles.sectionRule} />
          </div>
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
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('kamaTitle')}</h3>
            <div className={styles.sectionRule} />
          </div>
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
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('effortTitle')}</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.heroSub} style={{ marginBottom: '0.85rem', maxWidth: 'none' }}>
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
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('focusedTitle')}</h3>
            <div className={styles.sectionRule} />
          </div>
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
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('planetsTitle')}</h3>
            <div className={styles.sectionRule} />
          </div>
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
    </div>
  )
}
