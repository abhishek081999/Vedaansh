'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/PlanetsWorkspace.tsx
//  Planets workspace — overview charts, detail cards, energy cycles
// ─────────────────────────────────────────────────────────────

import React, { useMemo, useState } from 'react'
import {
  Activity,
  Compass,
  Layers,
  Moon as MoonLucide,
  Orbit,
  Sparkles,
  Star,
  Sun as SunLucide,
} from 'lucide-react'
import { ChakraSelector } from '@/components/chakra/ChakraSelector'
import { GrahaTable } from '@/components/ui/GrahaTable'
import { PlanetDetailCard } from '@/components/ui/PlanetDetailCard'
import { AdvancedAnalysisPanel } from '@/components/ui/AdvancedAnalysisPanel'
import { PlanetaryEnergyCyclesPanel } from '@/components/ui/PlanetaryEnergyCyclesPanel'
import { MoonKalasManasPanel } from '@/components/ui/MoonKalasManasPanel'
import { SunAdityasPanel } from '@/components/ui/SunAdityasPanel'
import { YogiPointPanel } from '@/components/ui/YogiPointPanel'
import { InterpretationPanel } from '@/components/ui/InterpretationPanel'
import { getGraNakPositions, getNakshatraCharacteristics } from '@/lib/engine/nakshatraAdvanced'
import { ageFromBirthDate, computePlanetaryEnergyCycles } from '@/lib/engine/planetaryEnergyCycles'
import { NAKSHATRA_NAMES as NAK_NAMES, RASHI_NAMES, RASHI_SHORT } from '@/types/astrology'
import type { ChartOutput, Rashi, UserPlan } from '@/types/astrology'
import { cn } from '@/lib/ui/cn'
import { planMeetsUiGate } from '@/lib/ui/planGate'
import styles from './PlanetsWorkspace.module.css'

type TabId = 'overview' | 'details' | 'sun' | 'moon' | 'energy' | 'yogi' | 'insights'

const TABS: {
  id: TabId
  label: string
  shortLabel: string
  Icon: typeof Star
  optional?: boolean
}[] = [
  { id: 'overview', label: 'Overview', shortLabel: 'Overview', Icon: Compass },
  { id: 'details', label: 'Planet Details', shortLabel: 'Details', Icon: Star },
  { id: 'sun', label: 'Sun · 12 Adityas', shortLabel: 'Sun', Icon: SunLucide },
  { id: 'moon', label: 'Moon · Kalas & Manas', shortLabel: 'Moon', Icon: MoonLucide },
  { id: 'energy', label: 'Energy Cycles', shortLabel: 'Energy', Icon: Orbit },
  { id: 'yogi', label: 'Yogi Point', shortLabel: 'Yogi', Icon: Sparkles, optional: true },
  { id: 'insights', label: 'Insights', shortLabel: 'Insights', Icon: Layers },
]

interface PlanetsWorkspaceProps {
  chart: ChartOutput
  userPlan?: UserPlan
}

export function PlanetsWorkspace({ chart, userPlan = 'free' }: PlanetsWorkspaceProps) {
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
    return {
      retro,
      combust,
      strong,
      age,
      activeEnergy,
      sunLabel: sun ? `${RASHI_SHORT[sun.rashi]} ${Math.floor(sun.degree)}°` : '—',
      moonLabel: moon ? NAK_NAMES[moon.nakshatraIndex] : '—',
      lagnaLabel: `${RASHI_NAMES[chart.lagnas.ascRashi]}`,
    }
  }, [classical, chart.shadbala, chart.meta.birthDate, chart.grahas, chart.lagnas.ascRashi])

  const visibleTabs = TABS.filter((t) => !(t.optional && t.id === 'yogi' && !chart.yogiPoint))

  return (
    <div className={styles.workspace}>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <header className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden />
        <div className={styles.heroTop}>
          <div>
            <p className={styles.eyebrow}>Graha Analysis</p>
            <h2 className={styles.heroTitle}>Planets Workspace</h2>
            <p className={styles.heroSub}>
              Natal positions, dignity, and planetary energy forms — independent of running dasha.
            </p>
          </div>
          <div className={styles.badgeRow}>
            <span className={cn(styles.badge, styles.badgeGold)}>Lagna · {stats.lagnaLabel}</span>
            <span className={styles.badge}>Sun · {stats.sunLabel}</span>
            <span className={styles.badge}>Moon · {stats.moonLabel}</span>
            {stats.retro > 0 && (
              <span className={cn(styles.badge, styles.badgeRose)}>{stats.retro} Retro</span>
            )}
            {stats.combust > 0 && (
              <span className={cn(styles.badge, styles.badgeAmber)}>{stats.combust} Combust</span>
            )}
          </div>
        </div>

        <div className={styles.statGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Age</div>
            <div className={styles.statValue}>{stats.age}</div>
            <div className={styles.statHint}>Completed years</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Energy Active</div>
            <div className={styles.statValue}>{stats.activeEnergy}</div>
            <div className={styles.statHint}>Cycle windows lit now</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Shadbala Strong</div>
            <div className={styles.statValue}>{stats.strong}</div>
            <div className={styles.statHint}>of {classical.length} grahas</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Special Points</div>
            <div className={styles.statValue}>4</div>
            <div className={styles.statHint}>Lagna · PP · IL · BB</div>
          </div>
        </div>
      </header>

      {/* ── Tabs ─────────────────────────────────────────────── */}
      <div className={styles.tabScroll}>
        <div className={styles.tabRow} role="tablist" aria-label="Planets sections">
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
                <span className={styles.tabLabelFull}>{t.label}</span>
                <span className={styles.tabLabelShort}>{t.shortLabel}</span>
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
            <h3 className={styles.sectionTitle}>Charts & Micro-Details</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.sectionHint}>
            D1 and D9 side by side, with planetary micro-details for quick scanning.
          </p>
          <div className={styles.overviewGrid}>
            <div className={styles.chartCard}>
              <div className={styles.chartLabel}>
                <span className={styles.chartTitle}>D1 · Rashi Chart</span>
                <span className={styles.chartAccent}>{RASHI_SHORT[chart.lagnas.ascRashi]} lagna</span>
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
                <span className={styles.chartTitle}>D9 · Navamsha</span>
                <span className={styles.chartAccent}>
                  {RASHI_SHORT[(chart.vargaLagnas?.D9 ?? 1) as Rashi]} lagna
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
                <span className={styles.chartTitle}>Planetary Micro-Details</span>
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
            <h3 className={styles.sectionTitle}>Deep Planetary Analysis</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.sectionHint}>
            Sign, nakshatra, KP lords, dignity, energy-cycle teaser, and shadbala for each graha and special point.
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

      {/* ── Sun · 12 Adityas ─────────────────────────────────── */}
      {tab === 'sun' && (
        <section className={styles.section} role="tabpanel">
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>Sun · 12 Adityas</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.sectionHint}>
            {energyFull
              ? 'Full Surya teaching: 12 Adityas, Pingala/prana, afflictions, Pitru Dosh — primary Aditya scored from natal Sun nakshatra, sign, and house.'
              : 'Free preview of primary Aditya and core karakatva. Gold unlocks all 12 Adityas, spiritual notes, and afflictions.'}
          </p>
          <SunAdityasPanel chart={chart} userPlan={userPlan} />
        </section>
      )}

      {/* ── Moon · Kalas & Manas ─────────────────────────────── */}
      {tab === 'moon' && (
        <section className={styles.section} role="tabpanel">
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>Moon · 16 Kalas & Manas</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.sectionHint}>
            {energyFull
              ? 'Full Moon teaching: all 16 kalas, seven manas with remedies, grahan yoga, and past-life combinations — active items highlighted for this chart.'
              : 'Free preview of active kala and primary manas. Gold unlocks the complete kalas, manas, and past-life reference.'}
          </p>
          <MoonKalasManasPanel chart={chart} userPlan={userPlan} />
        </section>
      )}

      {/* ── Energy Cycles ────────────────────────────────────── */}
      {tab === 'energy' && (
        <section className={styles.section} role="tabpanel">
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>Planetary Energy Cycles</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.sectionHint}>
            {energyFull
              ? 'Energy forms from classical cycle teaching — Saturn locks/releases, Jupiter peace ages, Venus pada desires, Sun authority switch in air signs, and more. Independent of mahadasha.'
              : 'Free preview of two cycles. Upgrade to Gold for all nine planets with phases, timing windows, and chart-specific notes.'}
          </p>
          <PlanetaryEnergyCyclesPanel chart={chart} userPlan={userPlan} embedded />
        </section>
      )}

      {/* ── Yogi Point ───────────────────────────────────────── */}
      {tab === 'yogi' && (
        <section className={styles.section} role="tabpanel">
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>Yogi Point System</h3>
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
            <div className={styles.emptyNote}>Yogi Point is not available for this chart.</div>
          )}
        </section>
      )}

      {/* ── Insights ─────────────────────────────────────────── */}
      {tab === 'insights' && (
        <section className={styles.section} role="tabpanel">
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>Interpretation & Advanced Flags</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.sectionHint}>
            Narrative interpretation plus Gandanta, Pushkara, Mrityu Bhaga, and Yuddha status.
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
