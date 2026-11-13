// ─────────────────────────────────────────────────────────────
//  src/components/ui/SaptamshaWorkspace.tsx
//  Dedicated Saptamsha (D7) workspace — purva punya, desire, progeny
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useMemo, useState } from 'react'
import {
  Award,
  Baby,
  Heart,
  HeartCrack,
  Layers,
  Scale,
  Sparkles,
  Users,
  Flower2,
  type LucideIcon,
} from 'lucide-react'
import { ChakraSelector } from '@/components/chakra/ChakraSelector'
import { PanelShell } from '@/components/ui/patterns'
import {
  analyzeSaptamsha,
  type D7Tone,
  type SaptamshaInsight,
} from '@/lib/engine/saptamshaAnalysis'
import { cn } from '@/lib/ui/cn'
import { useTranslations } from 'next-intl'
import { useDivisionalCommon } from '@/components/ui/useDivisionalCommon'
import type { ChartOutput, Rashi, UserPlan } from '@/types/astrology'
import styles from './SaptamshaWorkspace.module.css'

type TabId = 'overview' | 'pillars' | 'desire' | 'devotion' | 'progeny' | 'love' | 'recognition' | 'relating' | 'houses'

const TABS: { id: TabId; Icon: LucideIcon }[] = [
  { id: 'overview', Icon: Sparkles },
  { id: 'pillars', Icon: Scale },
  { id: 'desire', Icon: Heart },
  { id: 'devotion', Icon: Flower2 },
  { id: 'progeny', Icon: Baby },
  { id: 'love', Icon: HeartCrack },
  { id: 'recognition', Icon: Award },
  { id: 'relating', Icon: Users },
  { id: 'houses', Icon: Layers },
]

function insightClass(kind: SaptamshaInsight['kind']): string {
  if (kind === 'strength') return styles.insightStrength
  if (kind === 'caution') return styles.insightCaution
  if (kind === 'highlight') return styles.insightHighlight
  return styles.insightInfo
}

function toneClass(tone: D7Tone): string {
  if (tone === 'supportive') return styles.toneSupportive
  if (tone === 'challenging') return styles.toneChallenging
  if (tone === 'mixed') return styles.toneMixed
  return styles.toneNeutral
}

interface SaptamshaWorkspaceProps {
  chart: ChartOutput
  userPlan?: UserPlan
}

export function SaptamshaWorkspace({ chart, userPlan: _userPlan = 'free' }: SaptamshaWorkspaceProps) {
  const [tab, setTab] = useState<TabId>('overview')
  const t = useTranslations('divisional.d7')
  const c = useDivisionalCommon()
  const { lang } = c
  const analysis = useMemo(() => analyzeSaptamsha(chart, lang), [chart, lang])
  const moonNakIndex = chart.grahas.find((g) => g.id === 'Mo')?.nakshatraIndex ?? 0

  const d7Asc = (chart.vargaLagnas?.D7 ?? 1) as Rashi
  const d7Grahas = chart.vargas?.D7 ?? []

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

  const { relating, desire, devotion, recognition, progeny, loveLife, pillars } = analysis

  return (
    <div className={styles.workspace}>
      <header className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden />
        <div className={styles.heroTop}>
          <div>
            <p className={styles.eyebrow}>{t('eyebrow')}</p>
            <h2 className={styles.heroTitle}>
              {analysis.d7LagnaName}
              {!c.hi && (
                <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{' '}· {analysis.d7LagnaSanskrit}</span>
              )}
            </h2>
            <p className={styles.heroSub}>{analysis.summary}</p>
          </div>
          <div className={styles.badgeRow}>
            {relating.lagnaEmpty ? (
              <span className={cn(styles.badge, styles.badgeTeal)}>{t('badgeEmpty')}</span>
            ) : (
              <span className={cn(styles.badge, styles.badgeGold)}>
                {t('badgeOnLagna', { names: relating.occupants.map((o) => o.name).join(' · ') })}
              </span>
            )}
            <span className={cn(styles.badge, styles.badgeGold)}>
              {t('badgeClutch', { who: relating.clutchLabel })}
            </span>
            {progeny.tone === 'challenging' && (
              <span className={cn(styles.badge)} style={{ color: 'var(--rose, #fb7185)' }}>
                {t('badgeProgeny')}
              </span>
            )}
            {(loveLife.tone === 'challenging' || loveLife.playboyFlag) && (
              <span className={cn(styles.badge)} style={{ color: 'var(--rose, #fb7185)' }}>
                {t('badgeLove')}
              </span>
            )}
          </div>
        </div>

        <div className={styles.statGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('statLagna')}</div>
            <div className={styles.statValue}>{analysis.d7LagnaName}</div>
            <div className={styles.statHint}>{t('statLagnaHint')}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('statClutch')}</div>
            <div className={styles.statValue}>{relating.clutchLabel}</div>
            <div className={styles.statHint}>{relating.clutchReading}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('statDharma')}</div>
            <div className={styles.statValue}>{c.tone(pillars[0].tone)}</div>
            <div className={styles.statHint}>{pillars[0].focus}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('statDistance')}</div>
            <div className={styles.statValue}>
              {relating.distance === 'long'
                ? t('distanceLong')
                : relating.distance === 'mixed'
                  ? t('distanceMixed')
                  : t('distanceLocal')}
            </div>
            <div className={styles.statHint}>{relating.distanceReading}</div>
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
            <span className={styles.chartTitle}>{t('chartD7')}</span>
            <span className={styles.chartAccent}>{t('chartD7Accent', { lagna: c.lagnaOf(d7Asc) })}</span>
          </div>
          <ChakraSelector
            ascRashi={d7Asc}
            grahas={d7Grahas}
            vargaName="D7"
            lagnas={chart.lagnas}
            moonNakIndex={moonNakIndex}
            defaultStyle="north"
            size={280}
            showCharaDrishtiControls
            highlightHouses={[1, 5, 7]}
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

      {tab === 'pillars' && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('pillarsTitle')}</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.heroSub} style={{ marginBottom: '0.85rem', maxWidth: 'none' }}>
            {t('pillarsIntro')}
          </p>
          <div className={styles.insightGrid}>
            {pillars.map((p) => (
              <article key={p.id} className={cn(styles.insightCard, toneClass(p.tone))}>
                <h4 className={styles.insightTitle}>
                  {p.label}
                  <span className={cn(styles.pill, toneClass(p.tone))} style={{ marginLeft: 8 }}>
                    {c.tone(p.tone)}
                  </span>
                </h4>
                <div className={styles.statHint} style={{ marginBottom: '0.4rem', whiteSpace: 'normal' }}>
                  {p.focus}
                  {p.occupants.length > 0 ? ` · ${p.occupants.join(', ')}` : ''}
                </div>
                <p className={styles.insightText}>{p.reading}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === 'desire' && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('desireTitle')}</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.heroSub} style={{ marginBottom: '0.85rem', maxWidth: 'none' }}>
            {t('desireIntro')}
          </p>
          <div className={styles.sketchGrid}>
            {desire.moon && (
              <div className={styles.sketchCard}>
                <h4 className={styles.insightTitle}>
                  {t('moonAttach', { sign: desire.moon.rashiName })}
                </h4>
                <p className={styles.insightText}>{desire.moon.reading}</p>
                <div className={styles.statHint} style={{ marginTop: '0.4rem', whiteSpace: 'normal' }}>
                  {c.houseShort(desire.moon.house)}
                </div>
              </div>
            )}
            {desire.venus && (
              <div className={styles.sketchCard}>
                <h4 className={styles.insightTitle}>
                  {t('venusPrefer', { sign: desire.venus.rashiName })}
                </h4>
                <p className={styles.insightText}>{desire.venus.reading}</p>
                <div className={styles.statHint} style={{ marginTop: '0.4rem', whiteSpace: 'normal' }}>
                  {c.houseShort(desire.venus.house)}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {tab === 'devotion' && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('devotionTitle')}</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.heroSub} style={{ marginBottom: '0.85rem', maxWidth: 'none' }}>
            {t('devotionIntro')}
          </p>
          <article className={cn(styles.insightCard, styles.insightHighlight)} style={{ marginBottom: '0.85rem' }}>
            <h4 className={styles.insightTitle}>
              {devotion.moonRashiName
                ? t('moonAttach', { sign: devotion.moonRashiName })
                : t('devotionTitle')}
            </h4>
            <p className={styles.insightText}>{devotion.reading}</p>
            {devotion.moonHouse != null && (
              <div className={styles.statHint} style={{ marginTop: '0.4rem', whiteSpace: 'normal' }}>
                {c.houseShort(devotion.moonHouse)}
              </div>
            )}
          </article>
          {devotion.deityHints.length > 0 && (
            <>
              <div className={styles.sectionHead} style={{ marginTop: '0.5rem' }}>
                <h3 className={styles.sectionTitle}>{t('devotionHints')}</h3>
                <div className={styles.sectionRule} />
              </div>
              <div className={styles.insightGrid}>
                {devotion.deityHints.map((hint) => (
                  <article key={hint} className={cn(styles.insightCard, styles.insightInfo)}>
                    <p className={styles.insightText}>{hint}</p>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {tab === 'progeny' && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('progenyTitle')}</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.heroSub} style={{ marginBottom: '0.85rem', maxWidth: 'none' }}>
            {t('progenyIntro')}
          </p>
          <div className={styles.insightGrid}>
            <article className={cn(styles.insightCard, styles.insightInfo)}>
              <h4 className={styles.insightTitle}>{t('progenyConception')}</h4>
              <p className={styles.insightText}>{progeny.conceptionNote}</p>
              {progeny.sunHouse != null && (
                <div className={styles.statHint} style={{ marginTop: '0.4rem', whiteSpace: 'normal' }}>
                  {t('sunAt', { house: c.houseShort(progeny.sunHouse) })}
                </div>
              )}
            </article>
            <article className={cn(styles.insightCard, styles.insightInfo)}>
              <h4 className={styles.insightTitle}>{t('progenyContinuity')}</h4>
              <p className={styles.insightText}>{progeny.continuityNote}</p>
              {progeny.ketuHouse != null && (
                <div className={styles.statHint} style={{ marginTop: '0.4rem', whiteSpace: 'normal' }}>
                  {t('ketuAt', { house: c.houseShort(progeny.ketuHouse) })}
                </div>
              )}
            </article>
            <article className={cn(styles.insightCard, styles.insightInfo)}>
              <h4 className={styles.insightTitle}>{t('progenyJoy')}</h4>
              <p className={styles.insightText}>{progeny.joyNote}</p>
              {progeny.jupiterHouse != null && (
                <div className={styles.statHint} style={{ marginTop: '0.4rem', whiteSpace: 'normal' }}>
                  {t('jupiterAt', { house: c.houseShort(progeny.jupiterHouse) })}
                </div>
              )}
            </article>
            {progeny.miscarriageNote && (
              <article className={cn(styles.insightCard, styles.insightCaution)}>
                <h4 className={styles.insightTitle}>{t('progenyMiscarriage')}</h4>
                <p className={styles.insightText}>{progeny.miscarriageNote}</p>
              </article>
            )}
            {progeny.adoptionNote && (
              <article className={cn(styles.insightCard, styles.insightHighlight)}>
                <h4 className={styles.insightTitle}>{t('progenyAdoption')}</h4>
                <p className={styles.insightText}>{progeny.adoptionNote}</p>
              </article>
            )}
            {progeny.lagnaLordNote && (
              <article className={cn(styles.insightCard, styles.insightInfo)}>
                <h4 className={styles.insightTitle}>{t('progenyLagnaLord')}</h4>
                <p className={styles.insightText}>{progeny.lagnaLordNote}</p>
              </article>
            )}
          </div>
        </section>
      )}

      {tab === 'love' && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('loveTitle')}</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.heroSub} style={{ marginBottom: '0.85rem', maxWidth: 'none' }}>
            {t('loveIntro')}
          </p>
          <div className={styles.insightGrid}>
            <article className={cn(styles.insightCard, styles.insightInfo)}>
              <h4 className={styles.insightTitle}>{t('loveEntry')}</h4>
              <p className={styles.insightText}>{loveLife.entryReading}</p>
            </article>
            {loveLife.hiddenReading && (
              <article className={cn(styles.insightCard, styles.insightCaution)}>
                <h4 className={styles.insightTitle}>{t('loveHidden')}</h4>
                <p className={styles.insightText}>{loveLife.hiddenReading}</p>
              </article>
            )}
            {loveLife.departureReading && (
              <article className={cn(styles.insightCard, styles.insightCaution)}>
                <h4 className={styles.insightTitle}>{t('loveDeparture')}</h4>
                <p className={styles.insightText}>{loveLife.departureReading}</p>
              </article>
            )}
            <article className={cn(styles.insightCard, toneClass(loveLife.tone))}>
              <h4 className={styles.insightTitle}>{t('loveFidelity')}</h4>
              <p className={styles.insightText}>{loveLife.fidelityReading}</p>
              {loveLife.playboyFlag && (
                <p className={styles.insightText} style={{ marginTop: '0.45rem' }}>
                  {loveLife.patterns.find((p) => p.id === 'playboy-moon')?.text}
                </p>
              )}
            </article>
            {loveLife.exposureReading && (
              <article className={cn(styles.insightCard, styles.insightCaution)}>
                <h4 className={styles.insightTitle}>{t('loveExposure')}</h4>
                <p className={styles.insightText}>{loveLife.exposureReading}</p>
              </article>
            )}
          </div>

          {loveLife.d3Notes.length > 0 && (
            <>
              <div className={styles.sectionHead} style={{ marginTop: '1.1rem' }}>
                <h3 className={styles.sectionTitle}>{t('loveD3')}</h3>
                <div className={styles.sectionRule} />
              </div>
              <div className={styles.insightGrid}>
                {loveLife.d3Notes.map((n) => (
                  <article key={n.id} className={cn(styles.insightCard, toneClass(n.tone))}>
                    <h4 className={styles.insightTitle}>{n.title}</h4>
                    <p className={styles.insightText}>{n.text}</p>
                  </article>
                ))}
              </div>
            </>
          )}

          {loveLife.patterns.length > 0 && (
            <>
              <div className={styles.sectionHead} style={{ marginTop: '1.1rem' }}>
                <h3 className={styles.sectionTitle}>{t('lovePatterns')}</h3>
                <div className={styles.sectionRule} />
              </div>
              <div className={styles.insightGrid}>
                {loveLife.patterns.map((p) => (
                  <article key={p.id} className={cn(styles.insightCard, toneClass(p.tone))}>
                    <h4 className={styles.insightTitle}>{p.title}</h4>
                    <p className={styles.insightText}>{p.text}</p>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {tab === 'recognition' && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('recognitionTitle')}</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.heroSub} style={{ marginBottom: '0.85rem', maxWidth: 'none' }}>
            {t('recognitionIntro')}
          </p>
          <div className={styles.insightGrid}>
            <article className={cn(styles.insightCard, toneClass(recognition.tone))}>
              <h4 className={styles.insightTitle}>
                {t('bkTitle')}
                {recognition.bhratriName ? ` · ${recognition.bhratriName}` : ''}
              </h4>
              <p className={styles.insightText}>{recognition.bhratriReading}</p>
              {recognition.bhratriHouse != null && (
                <div className={styles.statHint} style={{ marginTop: '0.4rem', whiteSpace: 'normal' }}>
                  {c.houseShort(recognition.bhratriHouse)}
                  {recognition.bhratriDignity ? ` · ${c.dignity(recognition.bhratriDignity)}` : ''}
                </div>
              )}
            </article>
            {recognition.lagnaPowerReading && (
              <article className={cn(styles.insightCard, styles.insightStrength)}>
                <h4 className={styles.insightTitle}>{t('lagnaPower')}</h4>
                <p className={styles.insightText}>{recognition.lagnaPowerReading}</p>
              </article>
            )}
            {recognition.moonFameReading && (
              <article className={cn(styles.insightCard, styles.insightHighlight)}>
                <h4 className={styles.insightTitle}>{t('moonFame')}</h4>
                <p className={styles.insightText}>{recognition.moonFameReading}</p>
              </article>
            )}
            {recognition.sunPowerReading && (
              <article className={cn(styles.insightCard, styles.insightHighlight)}>
                <h4 className={styles.insightTitle}>{t('sunPower')}</h4>
                <p className={styles.insightText}>{recognition.sunPowerReading}</p>
              </article>
            )}
            {recognition.ketuDelayReading && (
              <article className={cn(styles.insightCard, styles.insightCaution)}>
                <h4 className={styles.insightTitle}>{t('ketuDelay')}</h4>
                <p className={styles.insightText}>{recognition.ketuDelayReading}</p>
              </article>
            )}
            {recognition.atmaReading && (
              <article className={cn(styles.insightCard, styles.insightCaution)}>
                <h4 className={styles.insightTitle}>
                  {t('akTitle')}
                  {recognition.atmaName ? ` · ${recognition.atmaName}` : ''}
                </h4>
                <p className={styles.insightText}>{recognition.atmaReading}</p>
              </article>
            )}
            {recognition.daraReading && (
              <article className={cn(styles.insightCard, styles.insightInfo)}>
                <h4 className={styles.insightTitle}>{t('dkTitle')}</h4>
                <p className={styles.insightText}>{recognition.daraReading}</p>
              </article>
            )}
          </div>
        </section>
      )}

      {tab === 'relating' && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('relatingTitle')}</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.heroSub} style={{ marginBottom: '0.85rem', maxWidth: 'none' }}>
            {t('relatingIntro')}
          </p>

          <article className={cn(styles.insightCard, styles.insightHighlight)} style={{ marginBottom: '0.85rem' }}>
            <h4 className={styles.insightTitle}>{t('signFlavor')}</h4>
            <p className={styles.insightText}>{relating.signFlavor}</p>
          </article>

          <div className={styles.sketchGrid}>
            <div className={styles.sketchCard}>
              <h4 className={styles.insightTitle}>
                {t('lagnaLord', { name: relating.lagnaLord.name })}
              </h4>
              <p className={styles.insightText}>{relating.lagnaLord.reading}</p>
              {relating.lagnaLord.conjunctNames.length > 0 && (
                <p className={styles.statHint} style={{ marginTop: '0.4rem', whiteSpace: 'normal' }}>
                  {t('with', { names: relating.lagnaLord.conjunctNames.join(', ') })}
                </p>
              )}
            </div>
            <div className={styles.sketchCard}>
              <h4 className={styles.insightTitle}>{t('clutchTitle')}</h4>
              <p className={styles.insightText}>{relating.clutchReading}</p>
            </div>
          </div>

          {relating.occupants.length > 0 && (
            <>
              <div className={styles.sectionHead} style={{ marginTop: '1.1rem' }}>
                <h3 className={styles.sectionTitle}>{t('planetsOnLagna')}</h3>
                <div className={styles.sectionRule} />
              </div>
              <div className={styles.cardGrid}>
                {relating.occupants.map((o) => (
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

          <div className={styles.sectionHead} style={{ marginTop: '1.1rem' }}>
            <h3 className={styles.sectionTitle}>{t('meetingTitle')}</h3>
            <div className={styles.sectionRule} />
          </div>
          <article className={cn(styles.insightCard, styles.insightInfo)} style={{ marginBottom: '0.85rem' }}>
            <p className={styles.insightText}>{relating.meetingReading}</p>
            <p className={styles.insightText} style={{ marginTop: '0.45rem' }}>{relating.distanceReading}</p>
          </article>

          <article className={cn(styles.insightCard, styles.insightHighlight)} style={{ marginBottom: '0.85rem' }}>
            <h4 className={styles.insightTitle}>{t('pastLifeTitle')}</h4>
            <p className={styles.insightText}>{relating.pastLifeFriendHint}</p>
          </article>

          {relating.patterns.length > 0 && (
            <>
              <div className={styles.sectionHead} style={{ marginTop: '0.5rem' }}>
                <h3 className={styles.sectionTitle}>{t('patternsTitle')}</h3>
                <div className={styles.sectionRule} />
              </div>
              <div className={styles.insightGrid}>
                {relating.patterns.map((pat) => (
                  <article key={pat.id} className={cn(styles.insightCard, toneClass(pat.tone))}>
                    <h4 className={styles.insightTitle}>{pat.title}</h4>
                    <p className={styles.insightText}>{pat.text}</p>
                  </article>
                ))}
              </div>
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
                className={cn(styles.houseCard, (h.house === 5 || h.house === 7) && styles.houseCardHot)}
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
    </div>
  )
}
