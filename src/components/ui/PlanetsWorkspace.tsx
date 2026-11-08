'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/PlanetsWorkspace.tsx
//  Planets workspace — overview charts, detail cards, energy cycles
// ─────────────────────────────────────────────────────────────

import React, { useMemo, useState } from 'react'
import {
  Activity,
  Brain,
  Compass,
  Hourglass,
  Layers,
  Moon as MoonLucide,
  Orbit,
  Scale,
  Sparkles,
  Star,
  Sun as SunLucide,
  Swords,
  Heart,
  Mountain,
  Eclipse,
  CircleDot,
  Flower2,
} from 'lucide-react'
import { ChakraSelector } from '@/components/chakra/ChakraSelector'
import { GrahaTable } from '@/components/ui/GrahaTable'
import { PlanetDetailCard } from '@/components/ui/PlanetDetailCard'
import { AdvancedAnalysisPanel } from '@/components/ui/AdvancedAnalysisPanel'
import { PlanetaryEnergyCyclesPanel } from '@/components/ui/PlanetaryEnergyCyclesPanel'
import { PlanetaryRemediesPanel } from '@/components/ui/PlanetaryRemediesPanel'
import { PlanetaryMaturityGuide } from '@/components/ui/PlanetaryMaturityGuide'
import { MoonKalasManasPanel } from '@/components/ui/MoonKalasManasPanel'
import { SunAdityasPanel } from '@/components/ui/SunAdityasPanel'
import { SunHousesYutiPanel } from '@/components/ui/SunHousesYutiPanel'
import { MarsAnalysisPanel } from '@/components/ui/MarsAnalysisPanel'
import { MercuryAnalysisPanel } from '@/components/ui/MercuryAnalysisPanel'
import { JupiterAnalysisPanel } from '@/components/ui/JupiterAnalysisPanel'
import { VenusAnalysisPanel } from '@/components/ui/VenusAnalysisPanel'
import { SaturnAnalysisPanel } from '@/components/ui/SaturnAnalysisPanel'
import { RahuAnalysisPanel } from '@/components/ui/RahuAnalysisPanel'
import { KetuAnalysisPanel } from '@/components/ui/KetuAnalysisPanel'
import { YogiPointPanel } from '@/components/ui/YogiPointPanel'
import { InterpretationPanel } from '@/components/ui/InterpretationPanel'
import { getGraNakPositions, getNakshatraCharacteristics } from '@/lib/engine/nakshatraAdvanced'
import { ageFromBirthDate, computePlanetaryEnergyCycles } from '@/lib/engine/planetaryEnergyCycles'
import { NAKSHATRA_NAMES as NAK_NAMES, RASHI_NAMES, RASHI_SHORT } from '@/types/astrology'
import type { ChartOutput, Rashi, UserPlan } from '@/types/astrology'
import { cn } from '@/lib/ui/cn'
import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import { NAKSHATRA_HI, RASHI_HI } from '@/i18n/jyotish'
import { planMeetsUiGate } from '@/lib/ui/planGate'
import styles from './PlanetsWorkspace.module.css'

type TabId = 'overview' | 'details' | 'sun' | 'moon' | 'mars' | 'mercury' | 'jupiter' | 'venus' | 'saturn' | 'rahu' | 'ketu' | 'remedies' | 'maturity' | 'energy' | 'yogi' | 'insights'

const TABS: {
  id: TabId
  label: string
  shortLabel: string
  Icon: typeof Star
  optional?: boolean
}[] = [
  { id: 'overview', label: 'Overview', shortLabel: 'Overview', Icon: Compass },
  { id: 'details', label: 'Planet Details', shortLabel: 'Details', Icon: Star },
  { id: 'sun', label: 'Sun · Adityas & Yuti', shortLabel: 'Sun', Icon: SunLucide },
  { id: 'moon', label: 'Moon · Kalas & Manas', shortLabel: 'Moon', Icon: MoonLucide },
  { id: 'mars', label: 'Mars · Mangala', shortLabel: 'Mars', Icon: Swords },
  { id: 'mercury', label: 'Mercury · Budha', shortLabel: 'Mercury', Icon: Brain },
  { id: 'jupiter', label: 'Jupiter · Guru', shortLabel: 'Jupiter', Icon: Scale },
  { id: 'venus', label: 'Venus · Shukra', shortLabel: 'Venus', Icon: Heart },
  { id: 'saturn', label: 'Saturn · Shani', shortLabel: 'Saturn', Icon: Mountain },
  { id: 'rahu', label: 'Rahu · Rāhu', shortLabel: 'Rahu', Icon: Eclipse },
  { id: 'ketu', label: 'Ketu · Śikhin', shortLabel: 'Ketu', Icon: CircleDot },
  { id: 'remedies', label: 'Remedies · Upay', shortLabel: 'Remedies', Icon: Flower2 },
  { id: 'maturity', label: 'Maturity Ages', shortLabel: 'Maturity', Icon: Hourglass },
  { id: 'energy', label: 'Energy Cycles', shortLabel: 'Energy', Icon: Orbit },
  { id: 'yogi', label: 'Yogi Point', shortLabel: 'Yogi', Icon: Sparkles, optional: true },
  { id: 'insights', label: 'Insights', shortLabel: 'Insights', Icon: Layers },
]

interface PlanetsWorkspaceProps {
  chart: ChartOutput
  userPlan?: UserPlan
}

export function PlanetsWorkspace({ chart, userPlan = 'free' }: PlanetsWorkspaceProps) {
  const t = useTranslations('chart.planetsWs')
  const tw = t
  const { hi } = useLang()
  const [tab, setTab] = useState<TabId>('overview')
  const energyFull = planMeetsUiGate(userPlan, 'gold')
  const moonNakIndex = chart.grahas.find((g) => g.id === 'Mo')?.nakshatraIndex ?? 0
  const classical = useMemo(
    () => chart.grahas.filter((g) => !['Ur', 'Ne', 'Pl'].includes(g.id)),
    [chart.grahas],
  )

  const mergedPlanets = useMemo(() => {
    const base = getGraNakPositions(classical)
    const ascDeg = chart.lagnas.ascDegree

    const createSpecialPos = (id: string, name: string, degree: number) => {
      const nakIdx = Math.floor(degree / (360 / 27))
      const nakPada = Math.floor(((degree % (360 / 27)) / (360 / 27)) * 4) + 1
      const chars = getNakshatraCharacteristics(nakIdx, nakPada)
      return {
        grahaId: id as 'As' | 'PP' | 'IL' | 'BB',
        grahaName: name,
        nakshatraIndex: nakIdx,
        nakshatraName: NAK_NAMES[nakIdx],
        pada: nakPada,
        lord: chars.lord,
        gana: chars.gana,
        deity: chars.deity,
        degree,
      }
    }

    const lagPosition = createSpecialPos('As', 'Lagna', ascDeg)
    const ppPosition = createSpecialPos('PP', 'Pranapada Lagna', chart.lagnas.pranapada)
    const ilPosition = createSpecialPos('IL', 'Indu Lagna', chart.lagnas.induLagna)
    const bbPosition = createSpecialPos('BB', 'Bhrigu Bindu', chart.lagnas.bhriguBindu)

    return [lagPosition, ppPosition, ilPosition, bbPosition, ...base].map((p) => {
      const full = chart.grahas.find((g) => g.id === p.grahaId)
      const shad = chart.shadbala?.planets[p.grahaId]
      return { ...p, ...full, shadbala: shad }
    })
  }, [classical, chart.grahas, chart.lagnas, chart.shadbala])

  const stats = useMemo(() => {
    const retro = classical.filter((g) => g.isRetro).length
    const combust = classical.filter((g) => g.isCombust).length
    const strong = classical.filter((g) => chart.shadbala?.planets[g.id]?.isStrong).length
    const age = ageFromBirthDate(chart.meta.birthDate)
    const energy = computePlanetaryEnergyCycles(chart.grahas, chart.meta.birthDate)
    const activeEnergy = energy.cycles.filter((c) => c.status === 'active').length
    const sun = classical.find((g) => g.id === 'Su')
    const moon = classical.find((g) => g.id === 'Mo')
    const mars = classical.find((g) => g.id === 'Ma')
    return {
      retro,
      combust,
      strong,
      age,
      activeEnergy,
      sunLabel: sun ? `${hi ? RASHI_HI[sun.rashi] : RASHI_SHORT[sun.rashi]} ${Math.floor(sun.degree)}°` : '—',
      moonLabel: moon ? (hi ? NAKSHATRA_HI[moon.nakshatraIndex] : NAK_NAMES[moon.nakshatraIndex]) : '—',
      marsLabel: mars ? `${hi ? RASHI_HI[mars.rashi] : RASHI_SHORT[mars.rashi]} ${Math.floor(mars.degree)}°` : '—',
      lagnaLabel: `${hi ? RASHI_HI[chart.lagnas.ascRashi] : RASHI_NAMES[chart.lagnas.ascRashi]}`,
    }
  }, [classical, chart.shadbala, chart.meta.birthDate, chart.grahas, chart.lagnas.ascRashi, hi])

  const visibleTabs = TABS.filter((t) => !(t.optional && t.id === 'yogi' && !chart.yogiPoint))

  return (
    <div className={styles.workspace}>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <header className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden />
        <div className={styles.heroTop}>
          <div>
            <p className={styles.eyebrow}>{t('eyebrow')}</p>
            <h2 className={styles.heroTitle}>{t('heroTitle')}</h2>
            <p className={styles.heroSub}>
              {t('heroSub')}
            </p>
          </div>
          <div className={styles.badgeRow}>
            <span className={cn(styles.badge, styles.badgeGold)}>{t('badgeLagna', { v: stats.lagnaLabel })}</span>
            <span className={styles.badge}>{t('badgeSun', { v: stats.sunLabel })}</span>
            <span className={styles.badge}>{t('badgeMoon', { v: stats.moonLabel })}</span>
            <span className={styles.badge}>{t('badgeMars', { v: stats.marsLabel })}</span>
            {stats.retro > 0 && (
              <span className={cn(styles.badge, styles.badgeRose)}>{t('retro', { n: stats.retro })}</span>
            )}
            {stats.combust > 0 && (
              <span className={cn(styles.badge, styles.badgeAmber)}>{t('combust', { n: stats.combust })}</span>
            )}
          </div>
        </div>

        <div className={styles.statGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('statAge')}</div>
            <div className={styles.statValue}>{stats.age}</div>
            <div className={styles.statHint}>{t('statAgeHint')}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('statEnergy')}</div>
            <div className={styles.statValue}>{stats.activeEnergy}</div>
            <div className={styles.statHint}>{t('statEnergyHint')}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('statStrong')}</div>
            <div className={styles.statValue}>{stats.strong}</div>
            <div className={styles.statHint}>{t('ofGrahas', { n: classical.length })}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('statSpecial')}</div>
            <div className={styles.statValue}>4</div>
            <div className={styles.statHint}>{t('statSpecialHint')}</div>
          </div>
        </div>
      </header>

      {/* ── Tabs ─────────────────────────────────────────────── */}
      <div className={styles.tabScroll}>
        <div className={styles.tabRow} role="tablist" aria-label={t('tabsAria')}>
          {visibleTabs.map((t) => {
            const active = tab === t.id
            const count =
              t.id === 'energy' && stats.activeEnergy > 0
                ? stats.activeEnergy
                : t.id === 'details'
                  ? mergedPlanets.length
                  : null
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={cn(styles.tabBtn, active && styles.tabBtnActive)}
                onClick={() => setTab(t.id)}
              >
                <t.Icon size={14} strokeWidth={active ? 2.25 : 2} aria-hidden />
                <span className={styles.tabLabelFull}>{tw(`tab_${t.id}`)}</span>
                <span className={styles.tabLabelShort}>{tw(`tabShort_${t.id}`)}</span>
                {count != null && <span className={styles.tabCount}>{count}</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Overview ─────────────────────────────────────────── */}
      {tab === 'overview' && (
        <section className={styles.section} role="tabpanel">
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('tChartsMicro')}</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.sectionHint}>
            {t('overviewHint')}
          </p>
          <div className={styles.overviewGrid}>
            <div className={styles.chartCard}>
              <div className={styles.chartLabel}>
                <span className={styles.chartTitle}>{t('cD1')}</span>
                <span className={styles.chartAccent}>{t('lagnaOf', { sign: hi ? RASHI_HI[chart.lagnas.ascRashi] : RASHI_SHORT[chart.lagnas.ascRashi] })}</span>
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
                showCharaDrishtiControls
                size={300}
              />
            </div>

            <div className={styles.chartCard}>
              <div className={styles.chartLabel}>
                <span className={styles.chartTitle}>{t('cD9')}</span>
                <span className={styles.chartAccent}>
                  {t('lagnaOf', { sign: hi ? RASHI_HI[(chart.vargaLagnas?.D9 ?? 1) as Rashi] : RASHI_SHORT[(chart.vargaLagnas?.D9 ?? 1) as Rashi] })}
                </span>
              </div>
              <ChakraSelector
                ascRashi={chart.vargaLagnas?.D9 ?? 1}
                grahas={chart.vargas?.D9 ?? []}
                vargaName="D9"
                lagnas={chart.lagnas}
                moonNakIndex={moonNakIndex}
                defaultStyle="north"
                size={300}
                showCharaDrishtiControls
              />
            </div>

            <div className={styles.tableCard}>
              <div className={styles.chartLabel}>
                <span className={styles.chartTitle}>{t('cMicro')}</span>
                <Activity size={14} color="var(--text-gold)" aria-hidden />
              </div>
              <GrahaTable
                grahas={chart.grahas}
                vargas={chart.vargas}
                vargaLagnas={chart.vargaLagnas}
                lagnas={chart.lagnas}
                upagrahas={chart.upagrahas}
                arudhas={chart.arudhas}
              />
            </div>
          </div>
        </section>
      )}

      {/* ── Details ──────────────────────────────────────────── */}
      {tab === 'details' && (
        <section className={styles.section} role="tabpanel">
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('tDeep')}</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.sectionHint}>
            {t('detailsHint')}
          </p>
          <div className={styles.planetGrid}>
            {mergedPlanets.map((p) => (
              <PlanetDetailCard
                key={p.grahaId}
                p={p}
                moonNakIdx={moonNakIndex}
                ascRashi={chart.lagnas.ascRashi}
                grahas={chart.grahas}
                birthDate={chart.meta.birthDate}
                userPlan={userPlan}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Sun · Adityas, houses & yuti ─────────────────────── */}
      {tab === 'sun' && (
        <section className={styles.section} role="tabpanel">
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('tSunAditya')}</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.sectionHint}>
            {energyFull
              ? t('sunAdityaFull')
              : t('sunAdityaFree')}
          </p>
          <SunAdityasPanel chart={chart} userPlan={userPlan} />

          <div className={styles.sectionHead} style={{ marginTop: '1.25rem' }}>
            <h3 className={styles.sectionTitle}>{t('tSunHouses')}</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.sectionHint}>
            {energyFull
              ? t('sunHousesFull')
              : t('sunHousesFree')}
          </p>
          <SunHousesYutiPanel chart={chart} userPlan={userPlan} />
        </section>
      )}

      {/* ── Moon · Kalas & Manas ─────────────────────────────── */}
      {tab === 'moon' && (
        <section className={styles.section} role="tabpanel">
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('tMoon')}</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.sectionHint}>
            {energyFull
              ? t('moonFull')
              : t('moonFree')}
          </p>
          <MoonKalasManasPanel chart={chart} userPlan={userPlan} />
        </section>
      )}

      {/* ── Mars · Mangala ───────────────────────────────────── */}
      {tab === 'mars' && (
        <section className={styles.section} role="tabpanel">
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('tMars')}</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.sectionHint}>
            {energyFull
              ? t('marsFull')
              : t('marsFree')}
          </p>
          <MarsAnalysisPanel chart={chart} userPlan={userPlan} />
        </section>
      )}

      {/* ── Mercury · Budha ──────────────────────────────────── */}
      {tab === 'mercury' && (
        <section className={styles.section} role="tabpanel">
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('tMercury')}</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.sectionHint}>
            {energyFull
              ? t('mercuryFull')
              : t('mercuryFree')}
          </p>
          <MercuryAnalysisPanel chart={chart} userPlan={userPlan} />
        </section>
      )}

      {/* ── Jupiter · Guru ───────────────────────────────────── */}
      {tab === 'jupiter' && (
        <section className={styles.section} role="tabpanel">
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('tJupiter')}</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.sectionHint}>
            {energyFull
              ? t('jupiterFull')
              : t('jupiterFree')}
          </p>
          <JupiterAnalysisPanel chart={chart} userPlan={userPlan} />
        </section>
      )}

      {/* ── Venus · Shukra ───────────────────────────────────── */}
      {tab === 'venus' && (
        <section className={styles.section} role="tabpanel">
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('tVenus')}</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.sectionHint}>
            {energyFull
              ? t('venusFull')
              : t('venusFree')}
          </p>
          <VenusAnalysisPanel chart={chart} userPlan={userPlan} />
        </section>
      )}

      {/* ── Saturn · Shani ───────────────────────────────────── */}
      {tab === 'saturn' && (
        <section className={styles.section} role="tabpanel">
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('tSaturn')}</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.sectionHint}>
            {energyFull
              ? t('saturnFull')
              : t('saturnFree')}
          </p>
          <SaturnAnalysisPanel chart={chart} userPlan={userPlan} />
        </section>
      )}

      {/* ── Rahu · Rāhu ──────────────────────────────────────── */}
      {tab === 'rahu' && (
        <section className={styles.section} role="tabpanel">
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('tRahu')}</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.sectionHint}>
            {energyFull
              ? t('rahuFull')
              : t('rahuFree')}
          </p>
          <RahuAnalysisPanel chart={chart} userPlan={userPlan} />
        </section>
      )}

      {/* ── Ketu · Śikhin ────────────────────────────────────── */}
      {tab === 'ketu' && (
        <section className={styles.section} role="tabpanel">
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('tKetu')}</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.sectionHint}>
            {energyFull
              ? t('ketuFull')
              : t('ketuFree')}
          </p>
          <KetuAnalysisPanel chart={chart} userPlan={userPlan} />
        </section>
      )}

      {/* ── Remedies · Upay ──────────────────────────────────── */}
      {tab === 'remedies' && (
        <section className={styles.section} role="tabpanel">
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('tRemedies')}</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.sectionHint}>
            {energyFull
              ? t('remediesFull')
              : t('remediesFree')}
          </p>
          <PlanetaryRemediesPanel chart={chart} userPlan={userPlan} />
        </section>
      )}

      {/* ── Maturity Ages ────────────────────────────────────── */}
      {tab === 'maturity' && (
        <section className={styles.section} role="tabpanel">
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('tMaturity')}</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.sectionHint}>
            {t('maturityHint1')}
            {t('maturityHint2')}
          </p>
          <PlanetaryMaturityGuide />
        </section>
      )}

      {/* ── Energy Cycles ────────────────────────────────────── */}
      {tab === 'energy' && (
        <section className={styles.section} role="tabpanel">
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('tEnergy')}</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.sectionHint}>
            {energyFull
              ? t('energyFull')
              : t('energyFree')}
          </p>
          <PlanetaryEnergyCyclesPanel chart={chart} userPlan={userPlan} embedded />
        </section>
      )}

      {/* ── Yogi Point ───────────────────────────────────────── */}
      {tab === 'yogi' && (
        <section className={styles.section} role="tabpanel">
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('tYogi')}</h3>
            <div className={styles.sectionRule} />
          </div>
          {chart.yogiPoint ? (
            <YogiPointPanel
              yogiPoint={chart.yogiPoint}
              grahas={chart.grahas.map((g) => ({
                id: g.id,
                lonSidereal: g.lonSidereal,
                name: g.name,
              }))}
            />
          ) : (
            <div className={styles.emptyNote}>{t('yogiNA')}</div>
          )}
        </section>
      )}

      {/* ── Insights ─────────────────────────────────────────── */}
      {tab === 'insights' && (
        <section className={styles.section} role="tabpanel">
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('tInsights')}</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.sectionHint}>
            {t('insightsHint')}
          </p>
          <div className={styles.stack}>
            {chart.interpretation ? (
              <InterpretationPanel interpretation={chart.interpretation} />
            ) : (
              <div className={styles.emptyNote}>No narrative interpretation on this chart yet.</div>
            )}
            <AdvancedAnalysisPanel grahas={chart.grahas} />
          </div>
        </section>
      )}
    </div>
  )
}
