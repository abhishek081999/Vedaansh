// ─────────────────────────────────────────────────────────────
//  src/components/ui/ChaturthamsaWorkspace.tsx
//  Dedicated Chaturthamsha (D4) workspace — home, happiness, space
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useMemo, useState } from 'react'
import {
  Heart,
  Home,
  Hourglass,
  Layers,
  ScrollText,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { ChakraSelector } from '@/components/chakra/ChakraSelector'
import { PanelShell } from '@/components/ui/patterns'
import { ChaturthamsaClassicalPanel } from '@/components/ui/ChaturthamsaClassicalPanel'
import {
  analyzeChaturthamsa,
  type ChaturthamsaInsight,
  type D4Tone,
} from '@/lib/engine/chaturthamsaAnalysis'
import { buildChaturthamsaClassical } from '@/lib/engine/chaturthamsaClassical'
import { cn } from '@/lib/ui/cn'
import { useTranslations } from 'next-intl'
import { useDivisionalCommon } from '@/components/ui/useDivisionalCommon'
import type { ChartOutput, Rashi, UserPlan } from '@/types/astrology'
import styles from './ChaturthamsaWorkspace.module.css'

type TabId = 'overview' | 'classical' | 'heart' | 'keyPlanets' | 'houses' | 'relocation' | 'affinity'

const TABS: { id: TabId; Icon: LucideIcon }[] = [
  { id: 'overview', Icon: Sparkles },
  { id: 'classical', Icon: ScrollText },
  { id: 'heart', Icon: Heart },
  { id: 'keyPlanets', Icon: Home },
  { id: 'houses', Icon: Layers },
  { id: 'relocation', Icon: Hourglass },
  { id: 'affinity', Icon: Users },
]

function insightClass(kind: ChaturthamsaInsight['kind']): string {
  if (kind === 'strength') return styles.insightStrength
  if (kind === 'caution') return styles.insightCaution
  if (kind === 'highlight') return styles.insightHighlight
  return styles.insightInfo
}

function toneClass(tone: D4Tone): string {
  if (tone === 'supportive') return styles.toneSupportive
  if (tone === 'challenging') return styles.toneChallenging
  if (tone === 'mixed') return styles.toneMixed
  return styles.toneNeutral
}

interface ChaturthamsaWorkspaceProps {
  chart: ChartOutput
  userPlan?: UserPlan
}

export function ChaturthamsaWorkspace({ chart, userPlan: _userPlan = 'free' }: ChaturthamsaWorkspaceProps) {
  const [tab, setTab] = useState<TabId>('overview')
  const t = useTranslations('divisional.d4')
  const c = useDivisionalCommon()
  const { lang } = c
  const analysis = useMemo(() => analyzeChaturthamsa(chart, lang), [chart, lang])
  const classical = useMemo(
    () => (analysis ? buildChaturthamsaClassical(analysis, chart, lang) : null),
    [analysis, chart, lang],
  )
  const moonNakIndex = chart.grahas.find((g) => g.id === 'Mo')?.nakshatraIndex ?? 0

  const d4Asc = (chart.vargaLagnas?.D4 ?? 1) as Rashi
  const d4Grahas = chart.vargas?.D4 ?? []
  const dashaHighlights = analysis?.relocation?.highlightHouses ?? []

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

  const { heart, keyTriad, relocation } = analysis

  return (
    <div className={styles.workspace}>
      <header className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden />
        <div className={styles.heroTop}>
          <div>
            <p className={styles.eyebrow}>{t('eyebrow')}</p>
            <h2 className={styles.heroTitle}>
              {analysis.d4LagnaName}
              {!c.hi && (
                <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{' '}· {analysis.d4LagnaSanskrit}</span>
              )}
            </h2>
            <p className={styles.heroSub}>{analysis.summary}</p>
          </div>
          <div className={styles.badgeRow}>
            {heart.lagnaEmpty ? (
              <span className={cn(styles.badge, styles.badgeTeal)}>{t('badgeEmpty')}</span>
            ) : (
              <span className={cn(styles.badge, styles.badgeGold)}>
                {t('badgeOnLagna', { names: heart.occupants.map((o) => o.name).join(' · ') })}
              </span>
            )}
            {heart.heartDisturbed && (
              <span className={cn(styles.badge)} style={{ color: 'var(--rose, #fb7185)' }}>
                {t('badgeNodes')}
              </span>
            )}
            {classical && (
              <span className={cn(styles.badge, styles.badgeGold)}>
                {t('badgeSukha', { score: classical.sukhaphala.score })}
              </span>
            )}
            {relocation?.pathLabel && (
              <span className={cn(styles.badge, styles.badgeTeal)}>
                {t('badgeDasha', { path: relocation.pathLabel })}
              </span>
            )}
          </div>
        </div>

        <div className={styles.statGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('statLagna')}</div>
            <div className={styles.statValue}>{analysis.d4LagnaName}</div>
            <div className={styles.statHint}>{t('statLagnaHint')}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('statSignal')}</div>
            <div className={styles.statValue}>{t(`strength.${heart.primarySignal.strength}`)}</div>
            <div className={styles.statHint}>{heart.primarySignal.label}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('statLord')}</div>
            <div className={styles.statValue}>{heart.lagnaLord.name}</div>
            <div className={styles.statHint}>
              {heart.lagnaLord.rashiName} · {c.houseShort(heart.lagnaLord.house)}
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('statTriad')}</div>
            <div className={styles.statValue}>
              {keyTriad.map((k) => k.name).join(' · ')}
            </div>
            <div className={styles.statHint}>{t('statTriadHint')}</div>
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
            <span className={styles.chartTitle}>{t('chartD4')}</span>
            <span className={styles.chartAccent}>
              {c.lagnaOf(d4Asc)}
              {dashaHighlights.length ? t('chartDasha', { houses: dashaHighlights.join(',') }) : ''}
            </span>
          </div>
          <ChakraSelector
            ascRashi={d4Asc}
            grahas={d4Grahas}
            vargaName="D4"
            lagnas={chart.lagnas}
            moonNakIndex={moonNakIndex}
            defaultStyle="north"
            size={280}
            showCharaDrishtiControls
            highlightHouses={dashaHighlights.length ? dashaHighlights : [1, 4, 8]}
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

      {tab === 'classical' && (
        classical
          ? <ChaturthamsaClassicalPanel classical={classical} />
          : (
            <section className={styles.section}>
              <p className={styles.emptyHint}>{t('classicalEmpty')}</p>
            </section>
          )
      )}

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
          {analysis.conflictFlags.length > 0 && (
            <>
              <div className={styles.sectionHead} style={{ marginTop: '1.1rem' }}>
                <h3 className={styles.sectionTitle}>{t('conflictTitle')}</h3>
                <div className={styles.sectionRule} />
              </div>
              <ul className={styles.noteList}>
                {analysis.conflictFlags.map((f) => (
                  <li key={f.id} className={styles.noteItem}>
                    <strong>{f.title}.</strong> {f.text}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {tab === 'heart' && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('heartTitle')}</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.heroSub} style={{ marginBottom: '0.85rem', maxWidth: 'none' }}>
            {t('heartIntro')}
            {heart.lagnaEmpty ? t('heartEmpty') : ''}
          </p>

          <article className={cn(styles.insightCard, styles.insightHighlight)} style={{ marginBottom: '0.85rem' }}>
            <h4 className={styles.insightTitle}>{heart.primarySignal.label}</h4>
            <p className={styles.insightText}>{heart.primarySignal.detail}</p>
          </article>

          <div className={styles.sketchGrid}>
            <div className={styles.sketchCard}>
              <h4 className={styles.insightTitle}>{t('signFlavor')}</h4>
              <p className={styles.insightText}>{heart.signFlavor}</p>
            </div>
            <div className={styles.sketchCard}>
              <h4 className={styles.insightTitle}>
                {t('lagnaLord', { name: heart.lagnaLord.name })}
              </h4>
              <p className={styles.insightText}>{heart.lagnaLord.reading}</p>
              {heart.lagnaLord.conjunctNames.length > 0 && (
                <p className={styles.statHint} style={{ marginTop: '0.4rem', whiteSpace: 'normal' }}>
                  {t('with', { names: heart.lagnaLord.conjunctNames.join(', ') })}
                </p>
              )}
            </div>
          </div>

          {heart.occupants.length > 0 && (
            <>
              <div className={styles.sectionHead} style={{ marginTop: '1.1rem' }}>
                <h3 className={styles.sectionTitle}>{t('planetsOnLagna')}</h3>
                <div className={styles.sectionRule} />
              </div>
              <div className={styles.cardGrid}>
                {heart.occupants.map((o) => (
                  <article key={o.id} className={styles.planetCard}>
                    <div className={styles.planetCardHead}>
                      <h4 className={styles.planetName}>
                        {o.name}
                        {o.isRetro ? ' ℞' : ''}
                      </h4>
                    </div>
                    <p className={styles.planetBody}>{o.reading}</p>
                    {o.signExtras.length > 0 && (
                      <ul className={styles.bulletList}>
                        {o.signExtras.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    )}
                  </article>
                ))}
              </div>
            </>
          )}

          {heart.aspectsOnLagna.length > 0 && (
            <>
              <div className={styles.sectionHead} style={{ marginTop: '1.1rem' }}>
                <h3 className={styles.sectionTitle}>{t('aspectsTitle')}</h3>
                <div className={styles.sectionRule} />
              </div>
              <ul className={styles.noteList}>
                {heart.aspectsOnLagna.map((a) => (
                  <li key={a.id} className={styles.noteItem}>
                    <strong>{a.name}</strong> {t('aspectFrom', { house: a.fromHouse, rashi: a.fromRashiName })} {a.note}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {tab === 'keyPlanets' && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('triadTitle')}</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.heroSub} style={{ marginBottom: '0.85rem', maxWidth: 'none' }}>
            {t('triadIntro')}
          </p>
          <div className={styles.cardGrid}>
            {keyTriad.map((k) => (
              <article key={k.role} className={styles.planetCard}>
                <div className={styles.planetCardHead}>
                  <h4 className={styles.planetName}>{k.name}</h4>
                  <span className={cn(styles.pill, toneClass(k.tone))}>{c.tone(k.tone)}</span>
                </div>
                <div className={styles.mappingLine}>{k.roleLabel}</div>
                <p className={styles.planetBody}>
                  {k.rashiName} · {c.houseShort(k.house)} · {c.dignity(k.dignity)}
                  {k.isRetro ? ' · ℞' : ''}
                </p>
                <p className={styles.planetBody}>{k.reading}</p>
              </article>
            ))}
          </div>

          {analysis.retrogradeNotes.length > 0 && (
            <>
              <div className={styles.sectionHead} style={{ marginTop: '1.1rem' }}>
                <h3 className={styles.sectionTitle}>{t('retroTitle')}</h3>
                <div className={styles.sectionRule} />
              </div>
              <ul className={styles.noteList}>
                {analysis.retrogradeNotes.map((n) => (
                  <li key={n} className={styles.noteItem}>{n}</li>
                ))}
              </ul>
            </>
          )}
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
                className={cn(styles.houseCard, (h.house === 4 || h.house === 8) && styles.houseCardHot)}
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

      {tab === 'relocation' && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('relocTitle')}</h3>
            <div className={styles.sectionRule} />
          </div>
          {!relocation ? (
            <p className={styles.emptyHint}>{t('relocEmpty')}</p>
          ) : (
            <>
              <article className={cn(styles.insightCard, insightClass(
                relocation.tone === 'challenging' ? 'caution'
                  : relocation.tone === 'supportive' ? 'strength' : 'highlight',
              ))} style={{ marginBottom: '0.85rem' }}>
                <h4 className={styles.insightTitle}>{relocation.headline}</h4>
                <p className={styles.insightText}>{relocation.detail}</p>
              </article>

              <div className={styles.statGrid} style={{ marginBottom: '0.85rem' }}>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>{t('eighthOcc')}</div>
                  <div className={styles.statValue}>
                    {relocation.eighthOccupants.length
                      ? relocation.eighthOccupants.map((o) => o.name).join(', ')
                      : t('none')}
                  </div>
                  <div className={styles.statHint}>{t('eighthOccHint')}</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>{t('eighthPeriod')}</div>
                  <div className={styles.statValue}>{relocation.eighthLordPeriodActive ? t('active') : t('quiet')}</div>
                  <div className={styles.statHint}>{t('currentPath')}</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>{t('mdAd')}</div>
                  <div className={styles.statValue}>{relocation.sixthEighthDashaLink ? t('yes') : t('no')}</div>
                  <div className={styles.statHint}>{t('classRule')}</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>{t('path')}</div>
                  <div className={styles.statValue}>{relocation.pathLabel || '—'}</div>
                  <div className={styles.statHint}>{t('vimshottari')}</div>
                </div>
              </div>

              {relocation.dashaLords.length > 0 && (
                <div className={styles.dashaStack}>
                  {relocation.dashaLords.map((l) => (
                    <article key={`${l.level}-${l.lord}`} className={cn(styles.dashaCard, toneClass(l.tone))}>
                      <div className={styles.planetCardHead}>
                        <h4 className={styles.planetName}>
                          {l.levelLabel} · {l.lordName}
                        </h4>
                        <span className={cn(styles.pill, toneClass(l.tone))}>
                          {l.d4House != null ? c.houseShort(l.d4House) : '—'}
                        </span>
                      </div>
                      <div className={styles.statHint} style={{ whiteSpace: 'normal' }}>
                        {l.start} → {l.end}
                        {l.d4RashiName ? ` · ${l.d4RashiName}` : ''}
                      </div>
                      <p className={styles.planetBody}>{l.note}</p>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      )}

      {tab === 'affinity' && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('affinityTitle')}</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.heroSub} style={{ marginBottom: '0.85rem', maxWidth: 'none' }}>
            {t('affinityIntro')}
          </p>
          <div className={styles.insightGrid}>
            {analysis.affinityGuide.map((n) => (
              <article key={n.pair} className={cn(styles.insightCard, toneClass(n.tone))}>
                <h4 className={styles.insightTitle}>{n.title}</h4>
                <p className={styles.insightText}>{n.text}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
