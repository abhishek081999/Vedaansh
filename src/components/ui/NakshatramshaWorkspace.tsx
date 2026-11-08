// ─────────────────────────────────────────────────────────────
//  src/components/ui/NakshatramshaWorkspace.tsx
//  Dedicated Nakshatramsha (D27) workspace — bandwidth & ask themes
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useMemo, useState } from 'react'
import {
  Activity,
  Layers,
  MessageCircle,
  Sparkles,
  Waves,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { ChakraSelector } from '@/components/chakra/ChakraSelector'
import { PanelShell } from '@/components/ui/patterns'
import {
  analyzeNakshatramsha,
  type D27Tone,
  type NakshatramshaInsight,
} from '@/lib/engine/nakshatramshaAnalysis'
import { useTranslations } from 'next-intl'
import { useDivisionalCommon } from '@/components/ui/useDivisionalCommon'
import { cn } from '@/lib/ui/cn'
import type { ChartOutput, Rashi, UserPlan } from '@/types/astrology'
import styles from './NakshatramshaWorkspace.module.css'

type TabId = 'overview' | 'bandwidth' | 'ask' | 'layer' | 'houses' | 'planets'

const TABS: { id: TabId; Icon: LucideIcon }[] = [
  { id: 'overview', Icon: Sparkles },
  { id: 'bandwidth', Icon: Activity },
  { id: 'ask', Icon: MessageCircle },
  { id: 'layer', Icon: Waves },
  { id: 'houses', Icon: Layers },
  { id: 'planets', Icon: Zap },
]

function insightClass(kind: NakshatramshaInsight['kind']): string {
  if (kind === 'strength') return styles.insightStrength
  if (kind === 'caution') return styles.insightCaution
  if (kind === 'highlight') return styles.insightHighlight
  return styles.insightInfo
}

function toneClass(tone: D27Tone): string {
  if (tone === 'supportive') return styles.toneSupportive
  if (tone === 'challenging') return styles.toneChallenging
  if (tone === 'mixed') return styles.toneMixed
  return styles.toneNeutral
}

interface NakshatramshaWorkspaceProps {
  chart: ChartOutput
  userPlan?: UserPlan
}

export function NakshatramshaWorkspace({ chart, userPlan: _userPlan = 'free' }: NakshatramshaWorkspaceProps) {
  const [tab, setTab] = useState<TabId>('overview')
  const t = useTranslations('divisional.d27')
  const c = useDivisionalCommon()
  const { lang } = c
  const analysis = useMemo(() => analyzeNakshatramsha(chart, lang), [chart, lang])
  const moonNakIndex = chart.grahas.find((g) => g.id === 'Mo')?.nakshatraIndex ?? 0
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
    <div className={styles.workspace}>
      <header className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden />
        <div className={styles.heroTop}>
          <div>
            <p className={styles.eyebrow}>{t('eyebrow')}</p>
            <h2 className={styles.heroTitle}>
              {analysis.d27LagnaName}
              {!c.hi && (
                <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
                  {' '}· {analysis.d27LagnaSanskrit}
                </span>
              )}
            </h2>
            <p className={styles.heroSub}>{analysis.summary}</p>
          </div>
          <div className={styles.badgeRow}>
            <span className={cn(styles.badge, bandwidth.tone === 'supportive' ? styles.badgeTeal : bandwidth.tone === 'challenging' ? styles.badgeGold : styles.badge)}>
              {bandwidth.label}
            </span>
            {askThemes[0] && (
              <span className={cn(styles.badge, styles.badgeGold)}>
                {t('badgeAsk', { house: askThemes[0].house })}
              </span>
            )}
            {layerLink.d3OverlapNote && (
              <span className={cn(styles.badge, styles.badgeTeal)}>{t('badgeRepeat')}</span>
            )}
          </div>
        </div>

        <div className={styles.statGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('statLagna')}</div>
            <div className={styles.statValue}>{analysis.d27LagnaName}</div>
            <div className={styles.statHint}>{t('statLagnaHint')}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('statBandwidth')}</div>
            <div className={styles.statValue}>{bandwidth.score}/20</div>
            <div className={styles.statHint}>{t(`band.${bandwidth.band}`)}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('statTopAsk')}</div>
            <div className={styles.statValue}>
              {askThemes[0] ? c.houseShort(askThemes[0].house) : '—'}
            </div>
            <div className={styles.statHint}>{askThemes[0]?.theme ?? '—'}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('statLord')}</div>
            <div className={styles.statValue}>{focus.lagnaLord.name}</div>
            <div className={styles.statHint}>
              {focus.lagnaLord.rashiName} · {c.houseShort(focus.lagnaLord.house)}
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
            <span className={styles.chartTitle}>{t('chartD27')}</span>
            <span className={styles.chartAccent}>{t('chartD27Accent', { lagna: c.lagnaOf(d27Asc) })}</span>
          </div>
          <ChakraSelector
            ascRashi={d27Asc}
            grahas={d27Grahas}
            vargaName="D27"
            lagnas={chart.lagnas}
            moonNakIndex={moonNakIndex}
            defaultStyle="north"
            size={280}
            showCharaDrishtiControls
            highlightHouses={[1, 4, 7, 10]}
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
        </section>
      )}

      {tab === 'bandwidth' && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('pressureTitle')}</h3>
            <div className={styles.sectionRule} />
          </div>
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
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('voicedTitle')}</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.heroSub} style={{ marginBottom: '0.85rem', maxWidth: 'none' }}>
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
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('layersTitle')}</h3>
            <div className={styles.sectionRule} />
          </div>
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
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('focusedTitle')}</h3>
            <div className={styles.sectionRule} />
          </div>
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
