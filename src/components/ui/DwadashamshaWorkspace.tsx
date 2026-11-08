// ─────────────────────────────────────────────────────────────
//  src/components/ui/DwadashamshaWorkspace.tsx
//  Dedicated Dwadashamsha (D12) workspace — isolation, thirst, release
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useMemo, useState } from 'react'
import {
  CloudMoon,
  Droplets,
  GitCompare,
  Layers,
  Sparkles,
  Wind,
  type LucideIcon,
} from 'lucide-react'
import { ChakraSelector } from '@/components/chakra/ChakraSelector'
import { PanelShell } from '@/components/ui/patterns'
import {
  analyzeDwadashamsha,
  type D12Tone,
  type DwadashamshaInsight,
} from '@/lib/engine/dwadashamshaAnalysis'
import { cn } from '@/lib/ui/cn'
import { useTranslations } from 'next-intl'
import { useDivisionalCommon } from '@/components/ui/useDivisionalCommon'
import type { ChartOutput, Rashi, UserPlan } from '@/types/astrology'
import styles from './DwadashamshaWorkspace.module.css'

type TabId = 'overview' | 'isolation' | 'thirst' | 'houses' | 'contrast' | 'cross'

const TABS: { id: TabId; Icon: LucideIcon }[] = [
  { id: 'overview', Icon: Sparkles },
  { id: 'isolation', Icon: CloudMoon },
  { id: 'thirst', Icon: Droplets },
  { id: 'houses', Icon: Layers },
  { id: 'contrast', Icon: GitCompare },
  { id: 'cross', Icon: Wind },
]

function insightClass(kind: DwadashamshaInsight['kind']): string {
  if (kind === 'strength') return styles.insightStrength
  if (kind === 'caution') return styles.insightCaution
  if (kind === 'highlight') return styles.insightHighlight
  return styles.insightInfo
}

function toneClass(tone: D12Tone): string {
  if (tone === 'supportive') return styles.toneSupportive
  if (tone === 'challenging') return styles.toneChallenging
  if (tone === 'mixed') return styles.toneMixed
  return styles.toneNeutral
}

interface DwadashamshaWorkspaceProps {
  chart: ChartOutput
  userPlan?: UserPlan
}

export function DwadashamshaWorkspace({ chart, userPlan: _userPlan = 'free' }: DwadashamshaWorkspaceProps) {
  const [tab, setTab] = useState<TabId>('overview')
  const t = useTranslations('divisional.d12')
  const c = useDivisionalCommon()
  const { lang } = c
  const analysis = useMemo(() => analyzeDwadashamsha(chart, lang), [chart, lang])
  const moonNakIndex = chart.grahas.find((g) => g.id === 'Mo')?.nakshatraIndex ?? 0

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
    <div className={styles.workspace}>
      <header className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden />
        <div className={styles.heroTop}>
          <div>
            <p className={styles.eyebrow}>{t('eyebrow')}</p>
            <h2 className={styles.heroTitle}>
              {analysis.d12LagnaName}
              {!c.hi && (
                <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{' '}· {analysis.d12LagnaSanskrit}</span>
              )}
            </h2>
            <p className={styles.heroSub}>{analysis.summary}</p>
          </div>
          <div className={styles.badgeRow}>
            {isolation.lagnaEmpty ? (
              <span className={cn(styles.badge, styles.badgeTeal)}>{t('badgeEmpty')}</span>
            ) : (
              <span className={cn(styles.badge, styles.badgeGold)}>
                {t('badgeOnLagna', { names: isolation.occupants.map((o) => o.name).join(' · ') })}
              </span>
            )}
            {isolation.aloneInDreams && (
              <span className={cn(styles.badge)} style={{ color: 'var(--rose, #fb7185)' }}>
                {t('badgeAlone')}
              </span>
            )}
            {thirst && (
              <span className={cn(styles.badge, styles.badgeGold)}>
                {t('badgeThirst', { name: thirst.name })}
              </span>
            )}
            {ketuRelease.tone === 'supportive' && (
              <span className={cn(styles.badge, styles.badgeTeal)}>{t('badgeKetu')}</span>
            )}
          </div>
        </div>

        <div className={styles.statGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('statLagna')}</div>
            <div className={styles.statValue}>{analysis.d12LagnaName}</div>
            <div className={styles.statHint}>{t('statLagnaHint')}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('statSignal')}</div>
            <div className={styles.statValue}>
              {isolation.primarySignal.strength === 'occupation' ? t('signalOccupation') : t('signalLord')}
            </div>
            <div className={styles.statHint}>{isolation.primarySignal.label}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('statThirst')}</div>
            <div className={styles.statValue}>{thirst ? thirst.name : t('noneMarked')}</div>
            <div className={styles.statHint}>
              {thirst ? `${thirst.rashiName} · ${c.houseShort(thirst.house)}` : t('noDebility')}
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('statKetu')}</div>
            <div className={styles.statValue}>
              {ketuRelease.house != null ? c.houseShort(ketuRelease.house) : '—'}
            </div>
            <div className={styles.statHint}>{ketuRelease.rashiName ?? '—'}</div>
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
            <span className={styles.chartTitle}>{t('chartD12')}</span>
            <span className={styles.chartAccent}>{t('chartD12Accent', { lagna: c.lagnaOf(d12Asc) })}</span>
          </div>
          <ChakraSelector
            ascRashi={d12Asc}
            grahas={d12Grahas}
            vargaName="D12"
            lagnas={chart.lagnas}
            moonNakIndex={moonNakIndex}
            defaultStyle="north"
            size={280}
            showCharaDrishtiControls
            highlightHouses={[1, 8, 12]}
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

      {tab === 'isolation' && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('isolationTitle')}</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.heroSub} style={{ marginBottom: '0.85rem', maxWidth: 'none' }}>
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
              <div className={styles.sectionHead} style={{ marginTop: '1.1rem' }}>
                <h3 className={styles.sectionTitle}>{t('planetsOnLagna')}</h3>
                <div className={styles.sectionRule} />
              </div>
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
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('thirstTitle')}</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.heroSub} style={{ marginBottom: '0.85rem', maxWidth: 'none' }}>
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
              <div className={styles.sectionHead} style={{ marginTop: '0.5rem' }}>
                <h3 className={styles.sectionTitle}>{t('otherMarkers')}</h3>
                <div className={styles.sectionRule} />
              </div>
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

          <div className={styles.sectionHead} style={{ marginTop: '1.1rem' }}>
            <h3 className={styles.sectionTitle}>{t('ketuLetGo')}</h3>
            <div className={styles.sectionRule} />
          </div>
          <article className={cn(styles.insightCard, ketuRelease.tone === 'supportive' ? styles.insightStrength : styles.insightInfo)}>
            <h4 className={styles.insightTitle}>
              {t('ketu')}
              {ketuRelease.house != null ? ` · ${c.houseShort(ketuRelease.house)}` : ''}
            </h4>
            <p className={styles.insightText}>{ketuRelease.reading}</p>
          </article>

          <div className={styles.sectionHead} style={{ marginTop: '1.1rem' }}>
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

      {tab === 'houses' && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('focusedTitle')}</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.heroSub} style={{ marginBottom: '0.85rem', maxWidth: 'none' }}>
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
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('contrastTitle')}</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.heroSub} style={{ marginBottom: '0.85rem', maxWidth: 'none' }}>
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
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('crossTitle')}</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.heroSub} style={{ marginBottom: '0.85rem', maxWidth: 'none' }}>
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
    </div>
  )
}
