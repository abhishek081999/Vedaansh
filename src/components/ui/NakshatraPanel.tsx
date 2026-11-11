'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/NakshatraPanel.tsx
//  Nakshatra workspace: birth star, D1 chart, and analysis tabs
// ─────────────────────────────────────────────────────────────

import React, { useState, useMemo, useEffect, useId } from 'react'
import { useTranslations } from 'next-intl'
import {
  Activity,
  BookOpen,
  Briefcase,
  CalendarDays,
  Check,
  ChevronDown,
  Coins,
  Compass,
  Flame,
  Gem,
  Heart,
  Home,
  Info,
  Leaf,
  Lightbulb,
  Link2,
  Moon,
  Orbit,
  Plane,
  Sparkles,
  Star,
  Sun,
  Target,
  Trophy,
  TrendingDown,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { MobileBottomNavShell } from '@/components/ui/MobileBottomNavShell'
import { NakshatraProfessionTab } from '@/components/ui/NakshatraProfessionTab'
import { NakshatraMedicalTab } from '@/components/ui/NakshatraMedicalTab'
import { NakshatraTaramandalTab } from '@/components/ui/NakshatraTaramandalTab'
import { NakshatraNavtaraTab } from '@/components/ui/NakshatraNavtaraTab'
import {
  getNakshatraCharacteristics, checkPanchaka,
  getGraNakPositions, getNakCompatibility, TARA_QUALITIES, TARA_NAMES,
  type NakshatraCharacteristics,
} from '@/lib/engine/nakshatraAdvanced'
import {
  loadAbhijitDeepGuide,
  loadNakshatraDeepGuides,
  type AbhijitDeepGuide,
  type NakshatraDeepGuide,
  type NakshatraGuidePlanet,
  type NakshatraGuna,
} from '@/lib/engine/nakshatraDeepGuide'
import { getRelationshipNavtara } from '@/lib/engine/navtaraPrediction'
import {
  getMonthlyForecast, getNakshatraMuhurtaRating, getNakshatraRemedies,
  type ActivityType,
} from '@/lib/engine/nakshatraRemedies'
import { ChakraSelector } from '@/components/chakra/ChakraSelector'
import { NAKSHATRA_NAMES as NAK_NAMES, GRAHA_NAMES, RASHI_SHORT } from '@/types/astrology'
import type { ChartOutput, GrahaId, Rashi } from '@/types/astrology'
import { PlanetDetailCard, ICON } from '@/components/ui/PlanetDetailCard'
import { NakshatraWheel } from '@/components/ui/NakshatraWheel'
import { Button } from '@/components/ui/primitives/Button'
import { cn } from '@/lib/ui/cn'
import { BREAKPOINTS } from '@/lib/ui/breakpoints'
import { useLang } from '@/i18n/useLang'
import { termHi } from '@/i18n/jyotish'
import styles from './NakshatraPanel.module.css'

export type NakshatraSubTab = 'overview' | 'navtara' | 'taramandal' | 'bestdays' | 'muhurta' | 'panchaka' | 'planet' | 'compat' | 'remedies' | 'profession' | 'medical'
type SubTab = NakshatraSubTab

const TAB_DEFS: { id: SubTab; labelKey: string; Icon: LucideIcon }[] = [
  { id: 'overview', labelKey: 'overview', Icon: Info },
  { id: 'navtara', labelKey: 'navtara', Icon: Compass },
  { id: 'taramandal', labelKey: 'taramandal', Icon: Orbit },
  { id: 'bestdays', labelKey: 'bestdays', Icon: CalendarDays },
  { id: 'muhurta', labelKey: 'muhurta', Icon: Zap },
  { id: 'panchaka', labelKey: 'panchaka', Icon: Flame },
  { id: 'planet', labelKey: 'planet', Icon: Star },
  { id: 'compat', labelKey: 'compat', Icon: Link2 },
  { id: 'remedies', labelKey: 'remedies', Icon: Heart },
  { id: 'profession', labelKey: 'profession', Icon: Briefcase },
  { id: 'medical', labelKey: 'medical', Icon: Activity },
]

const MOBILE_TAB_DEFS: { id: SubTab; icon: LucideIcon; labelKey: string }[] = [
  { id: 'overview', icon: Info, labelKey: 'overview' },
  { id: 'navtara', icon: Compass, labelKey: 'navtara' },
  { id: 'taramandal', icon: Orbit, labelKey: 'taramandalShort' },
  { id: 'bestdays', icon: CalendarDays, labelKey: 'bestdaysShort' },
  { id: 'muhurta', icon: Zap, labelKey: 'muhurta' },
  { id: 'panchaka', icon: Flame, labelKey: 'panchaka' },
  { id: 'planet', icon: Star, labelKey: 'planet' },
  { id: 'compat', icon: Link2, labelKey: 'compat' },
  { id: 'remedies', icon: Heart, labelKey: 'remediesShort' },
  { id: 'profession', icon: Briefcase, labelKey: 'professionShort' },
  { id: 'medical', icon: Activity, labelKey: 'medical' },
]

const ACTIVITY_DEFS: { id: ActivityType; labelKey: string; Icon: LucideIcon }[] = [
  { id: 'marriage', labelKey: 'marriage', Icon: Gem },
  { id: 'travel', labelKey: 'travel', Icon: Plane },
  { id: 'business', labelKey: 'business', Icon: Briefcase },
  { id: 'education', labelKey: 'education', Icon: BookOpen },
  { id: 'medical', labelKey: 'medical', Icon: Activity },
  { id: 'spiritual', labelKey: 'spiritual', Icon: Sparkles },
  { id: 'property', labelKey: 'property', Icon: Home },
  { id: 'career', labelKey: 'career', Icon: Target },
  { id: 'finance', labelKey: 'finance', Icon: Coins },
]

type Gana = NakshatraCharacteristics['gana']
type Quality = 'auspicious' | 'inauspicious' | 'neutral'
type Placement = {
  grahaId: string
  grahaName: string
  nakshatraIndex: number
  nakshatraName: string
  pada: number
  lord: GrahaId
  gana: Gana
  degree: number
  panchaka: ReturnType<typeof checkPanchaka>['panchaka']
}

const RATING_CLASS: Record<string, string> = {
  Excellent: styles.ratingExcellent,
  Good: styles.ratingGood,
  Neutral: styles.ratingNeutral,
  Avoid: styles.ratingAvoid,
}

const PADA_START: Record<number, number> = {
  0: 0, 1: 0, 2: 1, 3: 1, 4: 2, 5: 2, 6: 3, 7: 3, 8: 4, 9: 5, 10: 5, 11: 6,
  12: 7, 13: 7, 14: 8, 15: 9, 16: 9, 17: 10, 18: 11, 19: 11, 20: 0, 21: 1,
  22: 2, 23: 2, 24: 3, 25: 4, 26: 4,
}

function ganaClass(gana: string): string {
  if (gana === 'Deva') return styles.ganaDeva
  if (gana === 'Rakshasa') return styles.ganaRakshasa
  return styles.ganaManushya
}

function qualityClass(q: Quality): string {
  if (q === 'auspicious') return styles.qGood
  if (q === 'inauspicious') return styles.qBad
  return styles.qMid
}

function inkClass(q: Quality): string {
  if (q === 'auspicious') return styles.inkGood
  if (q === 'inauspicious') return styles.inkBad
  return styles.inkMid
}

function scoreTone(score: number): string {
  if (score >= 60) return styles.toneGood
  if (score >= 20) return styles.toneMid
  return styles.toneBad
}

function heatTone(score: number): string {
  if (score >= 60) return styles.heatGood
  if (score >= 40) return styles.heatMid
  return styles.heatBad
}

function padaSign(nakIdx: number, pada: number): string {
  const rashi = ((((PADA_START[nakIdx] ?? 0) + pada - 1) % 12) + 1) as Rashi
  return RASHI_SHORT[rashi]
}

export function NakshatraEmpty({
  onOpenBirthForm,
  detailKey = 'emptyDetail',
}: {
  onOpenBirthForm: () => void
  detailKey?: 'emptyDetail' | 'emptyTabDetail'
}) {
  const t = useTranslations('nakshatra.page')
  return (
    <div className={styles.emptyWrap}>
      <div className={styles.emptyIcon} aria-hidden>
        <Moon size={26} />
      </div>
      <h2 className={styles.emptyTitle}>{t('emptyTitle')}</h2>
      <p className={styles.emptyText}>{t(detailKey)}</p>
      <Button onClick={onOpenBirthForm}>{t('openBirthForm')}</Button>
    </div>
  )
}

export function NakshatraPanel({ chart, initialTab = 'overview' }: { chart: ChartOutput; initialTab?: SubTab }) {
  const tHero = useTranslations('nakshatra.hero')
  const tChart = useTranslations('nakshatra.chart')
  const tTabs = useTranslations('nakshatra.tabs')
  const tPlanet = useTranslations('nakshatra.planet')
  const { hi, lang } = useLang()
  const nm = (en: string) => (hi ? termHi(en) : en)
  const [subTab, setSubTab] = useState<SubTab>(initialTab)
  const [chartView, setChartView] = useState<'stars' | 'rashi'>('stars')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < BREAKPOINTS.lg)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (!initialTab) return
    setSubTab(initialTab === 'overview' ? (isMobile ? 'overview' : 'navtara') : initialTab)
  }, [initialTab, isMobile])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [subTab])

  const moon = chart.grahas.find(g => g.id === 'Mo')
  const birthNakIdx = moon?.nakshatraIndex ?? 0
  const birthNakPada = moon?.pada ?? 1
  const moonLon = moon?.lonSidereal ?? 0

  const chars = useMemo(() => getNakshatraCharacteristics(birthNakIdx, birthNakPada, lang), [birthNakIdx, birthNakPada, lang])
  const starName = nm(chars.name)
  const lordName = nm(GRAHA_NAMES[chars.lord])

  const planetPos = useMemo(() => {
    const base = getGraNakPositions(chart.grahas.filter(g => !['Ur', 'Ne', 'Pl'].includes(g.id)), lang)
    const ascDeg = chart.lagnas.ascDegree
    const lagNakIdx = Math.floor(ascDeg / (360 / 27))
    const lagNakPada = Math.floor(((ascDeg % (360 / 27)) / (360 / 27)) * 4) + 1
    const lagChars = getNakshatraCharacteristics(lagNakIdx, lagNakPada, lang)
    const lagPosition: Placement = {
      grahaId: 'As',
      grahaName: tPlanet('lagna'),
      nakshatraIndex: lagNakIdx,
      nakshatraName: lagChars.name,
      pada: lagNakPada,
      lord: lagChars.lord,
      gana: lagChars.gana,
      degree: ascDeg,
      panchaka: checkPanchaka(lagNakIdx, lang).panchaka,
    }
    return [lagPosition, ...base]
  }, [chart.grahas, chart.lagnas, tPlanet, lang])

  const d1Grahas = chart.vargas?.D1 ?? chart.grahas
  const ascRashi = chart.lagnas.ascRashi as Rashi
  const moonNakIdx = moon?.nakshatraIndex ?? 0
  const tithiNum = chart.panchang.tithi.number
  const varaNum = chart.panchang.vara.number

  return (
    <div className={cn(styles.workspace, isMobile && styles.workspaceMobile)}>
      <header className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden />
        <div className={styles.heroTop}>
          <div className={styles.moonMark} aria-hidden>
            <Moon size={20} />
          </div>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>{tHero('eyebrow')}</p>
            <div className={styles.titleRow}>
              <h2 className={styles.heroTitle}>{starName}</h2>
              <span className={styles.padaBadge}>{tHero('pada', { n: chars.pada })}</span>
            </div>
            <p className={styles.heroSub}>
              {tHero('moonSub', { lord: lordName })}
            </p>
          </div>
        </div>
        <div className={styles.statGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{tHero('lord')}</div>
            <div className={styles.statValue}>{lordName}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{tHero('gana')}</div>
            <div className={cn(styles.statValue, ganaClass(chars.gana))}>{nm(chars.gana)}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{tHero('deity')}</div>
            <div className={styles.statValue}>{chars.deity}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{tHero('yoni')}</div>
            <div className={styles.statValue}>{chars.yoni}</div>
          </div>
        </div>
        <div className={styles.shakti}>
          <span className={styles.shaktiLabel}>{tHero('shakti')}</span>
          <p className={styles.shaktiQuote}>{chars.shakti}</p>
        </div>
      </header>

      <div className={styles.layout}>
        <aside className={styles.chartCol}>
          <div className={styles.chartCard}>
            <div className={styles.chartLabel}>
              <span className={styles.chartTitle}>{chartView === 'stars' ? tChart('starsTitle') : tChart('rashiTitle')}</span>
              <div className={styles.viewToggle} role="tablist" aria-label={tChart('typeAria')}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={chartView === 'stars'}
                  className={cn(styles.viewBtn, chartView === 'stars' && styles.viewBtnOn)}
                  onClick={() => setChartView('stars')}
                >
                  {tChart('nakshatras')}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={chartView === 'rashi'}
                  className={cn(styles.viewBtn, chartView === 'rashi' && styles.viewBtnOn)}
                  onClick={() => setChartView('rashi')}
                >
                  {tChart('rashi')}
                </button>
              </div>
            </div>
            {chartView === 'stars' ? (
              <NakshatraWheel
                key={birthNakIdx}
                birthIndex={birthNakIdx}
                birthPada={birthNakPada}
                lang={lang}
                markers={planetPos.map(p => ({
                  id: p.grahaId,
                  nakshatraIndex: p.nakshatraIndex,
                  pada: p.pada,
                }))}
              />
            ) : (
            <div className={styles.chartBody}>
              <ChakraSelector
                ascRashi={ascRashi}
                grahas={d1Grahas}
                moonNakIndex={moonNakIdx}
                arudhas={chart.arudhas}
                tithiNumber={tithiNum}
                varaNumber={varaNum}
                showCharaDrishtiControls
                defaultStyle="north"
                size={340}
              />
            </div>
            )}
            <p className={styles.moonNote}>
              <span>
                {tChart.rich('moonNote', {
                  name: starName,
                  pada: chars.pada,
                  strong: (c) => <strong>{c}</strong>,
                })}
              </span>
              <span className={styles.moonLord}>{tChart('moonLord', { lord: lordName })}</span>
            </p>
          </div>
        </aside>

        <div className={styles.mainCol}>
          <div className={cn(styles.panel, styles.panelFlow)}>
            {!isMobile && (
              <div className={styles.tabScrollSticky}>
                <div className={styles.tabRow} role="tablist" aria-label={tTabs('analysisAria')}>
                  {TAB_DEFS.map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={subTab === tab.id}
                      onClick={() => setSubTab(tab.id)}
                      className={cn(styles.tabBtn, subTab === tab.id && styles.tabBtnActive)}
                    >
                      <tab.Icon size={14} aria-hidden />
                      {tTabs(tab.labelKey)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {subTab === 'overview' ? (
              <OverviewTab chars={chars} placements={planetPos} />
            ) : (
              <TabContent
                subTab={subTab}
                birthNakIdx={birthNakIdx}
                birthNakPada={birthNakPada}
                moonLon={moonLon}
                chart={chart}
                planetPos={planetPos}
              />
            )}
          </div>
        </div>
      </div>

      {isMobile && (
        <MobileBottomNavShell
          ariaLabel={tTabs('sectionsAria')}
          compact
          tabs={MOBILE_TAB_DEFS.map(({ id, icon, labelKey }) => ({
            id,
            icon,
            label: tTabs(labelKey),
            active: subTab === id,
            onClick: () => setSubTab(id),
          }))}
        />
      )}
    </div>
  )
}

function TabContent({
  subTab,
  birthNakIdx,
  birthNakPada,
  moonLon,
  chart,
  planetPos,
}: {
  subTab: SubTab
  birthNakIdx: number
  birthNakPada: number
  moonLon: number
  chart: ChartOutput
  planetPos: Placement[]
}) {
  return (
    <div className={styles.stack}>
      {subTab === 'navtara' && <NakshatraNavtaraTab chart={chart} birthNakIdx={birthNakIdx} />}
      {subTab === 'taramandal' && <NakshatraTaramandalTab chart={chart} />}
      {subTab === 'bestdays' && <BestDaysTab birthNakIdx={birthNakIdx} moonLon={moonLon} />}
      {subTab === 'muhurta' && <MuhurtaTab nakIdx={birthNakIdx} />}
      {subTab === 'panchaka' && <PanchakaTab grahas={chart.grahas} />}
      {subTab === 'planet' && <PlanetTab positions={planetPos} chart={chart} moonNakIdx={birthNakIdx} />}
      {subTab === 'compat' && <CompatTab birthNakIdx={birthNakIdx} />}
      {subTab === 'remedies' && <RemediesTab nakIdx={birthNakIdx} />}
      {subTab === 'profession' && <NakshatraProfessionTab chart={chart} birthNakIdx={birthNakIdx} birthNakPada={birthNakPada} />}
      {subTab === 'medical' && <NakshatraMedicalTab chart={chart} birthNakIdx={birthNakIdx} />}
    </div>
  )
}

const GUIDE_PLANET_ORDER: NakshatraGuidePlanet[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

function isGuidePlanet(id: string): id is NakshatraGuidePlanet {
  return (GUIDE_PLANET_ORDER as string[]).includes(id)
}

function chartPlanetsInNak(
  placements: Placement[],
  nakIndex: number,
): Array<{ id: NakshatraGuidePlanet; pada: number }> {
  return placements
    .filter((p) => p.nakshatraIndex === nakIndex && isGuidePlanet(p.grahaId))
    .map((p) => ({ id: p.grahaId as NakshatraGuidePlanet, pada: p.pada }))
    .sort((a, b) => GUIDE_PLANET_ORDER.indexOf(a.id) - GUIDE_PLANET_ORDER.indexOf(b.id))
}

function OverviewTab({
  chars,
  placements,
}: {
  chars: NakshatraCharacteristics
  placements: Placement[]
}) {
  const t = useTranslations('nakshatra.overview')
  const { hi, lang } = useLang()
  const nm = (en: string) => (hi ? termHi(en) : en)
  const lagnaPlacement = placements.find((p) => p.grahaId === 'As')
  const lagnaNakIdx = lagnaPlacement?.nakshatraIndex
  const inBirthStar = useMemo(
    () => chartPlanetsInNak(placements, chars.index),
    [placements, chars.index],
  )
  const otherByNak = useMemo(() => {
    const byNak = new Map<number, Array<{ id: NakshatraGuidePlanet; pada: number }>>()
    for (const p of placements) {
      if (!isGuidePlanet(p.grahaId) || p.nakshatraIndex === chars.index) continue
      const list = byNak.get(p.nakshatraIndex) ?? []
      list.push({ id: p.grahaId, pada: p.pada })
      byNak.set(p.nakshatraIndex, list)
    }
    return [...byNak.entries()]
      .sort(([a], [b]) => a - b)
      .map(([nakIndex, planets]) => ({
        nakIndex,
        planets: planets.sort(
          (a, b) => GUIDE_PLANET_ORDER.indexOf(a.id) - GUIDE_PLANET_ORDER.indexOf(b.id),
        ),
      }))
  }, [placements, chars.index])

  const neededIndices = useMemo(() => {
    const set = new Set<number>([chars.index, ...otherByNak.map((r) => r.nakIndex)])
    if (lagnaNakIdx != null) set.add(lagnaNakIdx)
    return [...set]
  }, [chars.index, otherByNak, lagnaNakIdx])

  const [guides, setGuides] = useState<Map<number, NakshatraDeepGuide>>(new Map())
  const [guidesLoading, setGuidesLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setGuidesLoading(true)
    void loadNakshatraDeepGuides(neededIndices, lang).then((map) => {
      if (cancelled) return
      setGuides(map)
      setGuidesLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [neededIndices, lang])

  const guide = guides.get(chars.index) ?? null
  const lagnaGuide =
    lagnaNakIdx != null && lagnaNakIdx !== chars.index
      ? (guides.get(lagnaNakIdx) ?? null)
      : null
  const otherOccupied = otherByNak
    .map((row) => {
      const g = guides.get(row.nakIndex)
      return g ? { ...row, guide: g } : null
    })
    .filter((row): row is { nakIndex: number; planets: Array<{ id: NakshatraGuidePlanet; pada: number }>; guide: NakshatraDeepGuide } => row != null)

  const rows: { key: string; value: string; tone?: string }[] = [
    { key: 'deity', value: guide?.deity ?? chars.deity },
    { key: 'gana', value: nm(chars.gana), tone: ganaClass(chars.gana) },
    { key: 'yoni', value: guide?.yoni ?? chars.yoni },
    { key: 'nadi', value: nm(chars.nadi) },
    { key: 'varna', value: chars.varna },
    { key: 'nature', value: nm(chars.nature) },
    { key: 'bodyPart', value: guide?.bodyPart ?? chars.bodyPart },
    { key: 'symbol', value: guide?.symbol ?? chars.symbol },
  ]
  if (guide) {
    rows.push(
      { key: 'guna', value: gunaLabel(guide.guna, t) },
      { key: 'tattva', value: guide.tattva },
      { key: 'goodAges', value: t('agesYears', { ages: guide.goodAges.join(', ') }) },
      { key: 'badAges', value: t('agesYears', { ages: guide.badAges.join(', ') }) },
    )
  }
  return (
    <div className={styles.profileStack}>
      <section className={styles.profileSummary}>
        <div className={styles.sectionHead}>
          <h3 className={styles.sectionTitle}>{t('title')}</h3>
          <div className={styles.sectionRule} />
        </div>
        <div className={styles.profileSummaryGrid}>
          <div className={styles.traitGrid}>
            {rows.map(({ key, value, tone }) => (
              <div key={key} className={styles.traitCard}>
                <div className={styles.traitLabel}>{t(key)}</div>
                <div className={cn(styles.traitValue, tone)}>{value}</div>
              </div>
            ))}
          </div>
          <PadaMap nakIdx={chars.index} pada={chars.pada} />
        </div>
      </section>

      {guidesLoading ? (
        <p className={styles.guideLead}>{t('guidesLoading')}</p>
      ) : null}

      {guide ? <TeachingGuidePanel guide={guide} birthPada={chars.pada} /> : null}

      {guide ? (
        <ChartInterpPanel
          guide={guide}
          chartPlanets={inBirthStar}
          showLagna={lagnaNakIdx === chars.index}
        />
      ) : null}

      {lagnaGuide && lagnaPlacement ? (
        <section className={styles.profileBlock}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('lagnaInterpTitle')}</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.guideLead}>
            {t('lagnaInterpLead', { name: lagnaGuide.name })}
          </p>
          <ChartNakshatraProfile guide={lagnaGuide} compact />
          <GuideDisclosure title={t('lagnaNotes')} paragraphs={[lagnaGuide.lagnaNotes]} />
        </section>
      ) : null}

      {otherOccupied.length ? (
        <section className={styles.profileBlock}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('otherPlacements')}</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.guideLead}>{t('otherPlacementsLead')}</p>
          <div className={styles.guidePlanetGrid}>
            {otherOccupied.map(({ nakIndex, planets, guide: g }) => (
              <OccupiedNakshatraCard
                key={nakIndex}
                guide={g}
                planets={planets}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

/** Button accordion — avoid controlled <details>, which crashes React 19 removeChild. */
function GuideDisclosure({
  title,
  paragraphs,
  defaultOpen = false,
}: {
  title: string
  paragraphs: string[]
  defaultOpen?: boolean
}) {
  if (!paragraphs.length) return null
  return (
    <GuideDisclosureSlot title={title} defaultOpen={defaultOpen}>
      {paragraphs.map((p, i) => (
        <p key={`${title}-${i}`} className={styles.guideProse}>{p}</p>
      ))}
    </GuideDisclosureSlot>
  )
}

function GuideDisclosureSlot({
  title,
  defaultOpen = false,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = useId()
  return (
    <div className={styles.guideDisclosure}>
      <button
        type="button"
        className={styles.guideDisclosureSummary}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{title}</span>
        <ChevronDown
          size={14}
          aria-hidden
          className={cn(styles.guideDisclosureChevron, open && styles.guideDisclosureChevronOpen)}
        />
      </button>
      <div
        id={panelId}
        className={styles.guideDisclosureBody}
        role="region"
        hidden={!open}
      >
        {open ? children : null}
      </div>
    </div>
  )
}

function gunaLabel(
  guna: NakshatraGuna,
  t: (key: 'gunaSattvic' | 'gunaRajasic' | 'gunaTamasic') => string,
): string {
  if (guna === 'Sattvic') return t('gunaSattvic')
  if (guna === 'Rajasic') return t('gunaRajasic')
  return t('gunaTamasic')
}

/** Chart-facing profile for whatever nakshatra is occupied in this chart. */
function ChartNakshatraProfile({
  guide,
  compact = false,
}: {
  guide: NakshatraDeepGuide
  compact?: boolean
}) {
  const t = useTranslations('nakshatra.overview')
  return (
    <div className={styles.guideDisclosureGroup}>
      <div className={styles.guideMeta}>
        <span className={styles.guideChip}><strong>{t('guna')}: </strong>{gunaLabel(guide.guna, t)}</span>
        <span className={styles.guideChip}><strong>{t('tattva')}: </strong>{guide.tattva}</span>
        <span className={styles.guideChip}>
          <strong>{t('goodAges')}: </strong>
          {t('agesYears', { ages: guide.goodAges.join(', ') })}
        </span>
        <span className={styles.guideChip}>
          <strong>{t('badAges')}: </strong>
          {t('agesYears', { ages: guide.badAges.join(', ') })}
        </span>
      </div>
      <GuideDisclosure title={t('coreEnergy')} paragraphs={[guide.coreEnergy]} defaultOpen={!compact} />
      <GuideDisclosure title={t('coreCharacteristics')} paragraphs={guide.coreCharacteristics} defaultOpen={!compact} />
      <GuideDisclosure title={t('keySignifications')} paragraphs={guide.keySignifications} />
      <GuideDisclosure title={t('negativeTendencies')} paragraphs={guide.negativeTendencies} />
      {!compact ? (
        <GuideDisclosure title={t('spiritualTechniques')} paragraphs={guide.spiritualTechniques} />
      ) : null}
      <GuideDisclosure title={t('careers')} paragraphs={guide.careers} />
      <GuideDisclosure title={t('specialNotes')} paragraphs={guide.specialNotes} />
    </div>
  )
}

function OccupiedNakshatraCard({
  guide,
  planets,
}: {
  guide: NakshatraDeepGuide
  planets: Array<{ id: NakshatraGuidePlanet; pada: number }>
}) {
  const t = useTranslations('nakshatra.overview')
  const { hi } = useLang()
  const graha = (id: NakshatraGuidePlanet) => (hi ? termHi(GRAHA_NAMES[id]) : GRAHA_NAMES[id])

  return (
    <div className={styles.guidePlanetCard}>
      <div className={styles.guidePlanetName}>
        {guide.name}
        <span className={styles.guidePadaMeta}> · {guide.keyword}</span>
      </div>
      <ChartNakshatraProfile guide={guide} compact />
      {planets.map(({ id, pada }) => {
        const effect = guide.planetEffects[id]
        const padaLine = guide.planetPadaResults[id]?.[pada - 1]
        if (!effect && !padaLine) return null
        return (
          <div key={`${guide.index}-${id}`} className={styles.guideOccupiedPlanet}>
            <div className={styles.guideOccupiedPlanetName}>{graha(id)}</div>
            {effect ? <p className={styles.guideProse}>{effect}</p> : null}
            {padaLine ? (
              <p className={styles.guidePlanetPada}>
                <strong>{t('chartPadaResult', { n: pada })}: </strong>{padaLine}
              </p>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

function TeachingGuidePanel({
  guide,
  birthPada,
}: {
  guide: NakshatraDeepGuide
  birthPada: number
}) {
  const t = useTranslations('nakshatra.overview')
  const { lang } = useLang()
  const birthPadaGuide = guide.padas.find((p) => p.pada === birthPada) ?? guide.padas[0]
  const showAbhijit = guide.index === 20 || guide.index === 21
  const [abhijit, setAbhijit] = useState<AbhijitDeepGuide | null>(null)

  useEffect(() => {
    if (!showAbhijit) {
      setAbhijit(null)
      return
    }
    let cancelled = false
    void loadAbhijitDeepGuide(lang).then((g) => {
      if (!cancelled) setAbhijit(g)
    })
    return () => { cancelled = true }
  }, [showAbhijit, lang])

  return (
    <section className={styles.profileBlock}>
      <div className={styles.sectionHead}>
        <h3 className={styles.sectionTitle}>{t('teachingTitle')}</h3>
        <div className={styles.sectionRule} />
      </div>
      <p className={styles.guideLead}>{t('teachingLead')}</p>
      <p className={styles.guideKeyword}>
        <strong>{t('keyword')}: </strong>{guide.keyword}
      </p>
      <div className={styles.guideMeta}>
        <span className={styles.guideChip}><strong>{t('span')}: </strong>{guide.degreeSpan}</span>
        <span className={styles.guideChip}><strong>{t('colour')}: </strong>{guide.colour}</span>
        <span className={styles.guideChip}><strong>{t('bodyPart')}: </strong>{guide.bodyPart}</span>
      </div>

      <ChartNakshatraProfile guide={guide} />

      <div className={styles.guideDisclosureGroup}>
        <GuideDisclosureSlot title={t('yourPada')} defaultOpen>
          <div className={cn(styles.guidePadaItem, styles.guidePadaItemActive)}>
            <div className={styles.guidePadaHead}>
              <span className={styles.guidePadaName}>
                {t('pada', { n: birthPadaGuide.pada })} · {birthPadaGuide.navamsa}
              </span>
              <span className={styles.guidePadaMeta}>{birthPadaGuide.span}</span>
            </div>
            <p className={styles.guideProse}>{birthPadaGuide.summary}</p>
          </div>
        </GuideDisclosureSlot>
        <GuideDisclosureSlot title={t('allPadas')}>
          <ul className={styles.guidePadaList}>
            {guide.padas.map((p) => (
              <li
                key={p.pada}
                className={cn(styles.guidePadaItem, p.pada === birthPada && styles.guidePadaItemActive)}
              >
                <div className={styles.guidePadaHead}>
                  <span className={styles.guidePadaName}>{t('pada', { n: p.pada })} · {p.navamsa}</span>
                  <span className={styles.guidePadaMeta}>{p.span}</span>
                </div>
                <p className={styles.guideProse}>{p.summary}</p>
              </li>
            ))}
          </ul>
        </GuideDisclosureSlot>
        <GuideDisclosure title={t('theory')} paragraphs={guide.theory} />
        <GuideDisclosure title={t('deityNotes')} paragraphs={guide.deityNotes} />
        <GuideDisclosure title={t('rulerNotes')} paragraphs={guide.rulerNotes} />
        <GuideDisclosure title={t('rashiNotes')} paragraphs={guide.rashiNotes} />
        <GuideDisclosure title={t('symbolNotes')} paragraphs={guide.symbolNotes} />
        <GuideDisclosure title={t('mythology')} paragraphs={guide.mythology} />
        <GuideDisclosure title={t('animalNotes')} paragraphs={guide.animalNotes} />
        <GuideDisclosure title={t('doshaNotes')} paragraphs={guide.doshaNotes} />
        {abhijit ? (
          <GuideDisclosureSlot title={t('abhijitTitle')}>
            <p className={styles.guideLead}>{t('abhijitLead')}</p>
            <p className={styles.guideKeyword}>
              <strong>{t('keyword')}: </strong>{abhijit.keyword}
            </p>
            <div className={styles.guideMeta}>
              <span className={styles.guideChip}><strong>{t('span')}: </strong>{abhijit.degreeSpan}</span>
              <span className={styles.guideChip}><strong>{t('guna')}: </strong>{gunaLabel(abhijit.guna, t)}</span>
              <span className={styles.guideChip}><strong>{t('tattva')}: </strong>{abhijit.tattva}</span>
              <span className={styles.guideChip}><strong>{t('bodyPart')}: </strong>{abhijit.bodyPart}</span>
            </div>
            <GuideDisclosure title={t('coreEnergy')} paragraphs={[abhijit.coreEnergy]} />
            <GuideDisclosure title={t('keySignifications')} paragraphs={abhijit.keySignifications} />
            <GuideDisclosure title={t('coreCharacteristics')} paragraphs={abhijit.coreCharacteristics} />
            <GuideDisclosure title={t('negativeTendencies')} paragraphs={abhijit.negativeTendencies} />
            <GuideDisclosure title={t('spiritualTechniques')} paragraphs={abhijit.spiritualTechniques} />
            <GuideDisclosure title={t('careers')} paragraphs={abhijit.careers} />
            <GuideDisclosure title={t('specialNotes')} paragraphs={abhijit.specialNotes} />
          </GuideDisclosureSlot>
        ) : null}
      </div>
    </section>
  )
}

function ChartInterpPanel({
  guide,
  chartPlanets,
  showLagna,
}: {
  guide: NakshatraDeepGuide
  chartPlanets: Array<{ id: NakshatraGuidePlanet; pada: number }>
  showLagna: boolean
}) {
  const t = useTranslations('nakshatra.overview')
  const { hi } = useLang()
  const graha = (id: NakshatraGuidePlanet) => (hi ? termHi(GRAHA_NAMES[id]) : GRAHA_NAMES[id])
  const merged = chartPlanets
    .map(({ id, pada }) => ({
      id,
      pada,
      effect: guide.planetEffects[id],
      padaLine: guide.planetPadaResults[id]?.[pada - 1],
    }))
    .filter((e) => Boolean(e.effect || e.padaLine))

  return (
    <section className={styles.profileBlock}>
      <div className={styles.sectionHead}>
        <h3 className={styles.sectionTitle}>{t('chartInterpTitle')}</h3>
        <div className={styles.sectionRule} />
      </div>
      <p className={styles.guideLead}>{t('chartInterpLead')}</p>

      <div className={styles.guideDisclosureGroup}>
        <GuideDisclosureSlot title={t('planetEffects')}>
          {merged.length ? (
            <div className={styles.guidePlanetGrid}>
              {merged.map(({ id, pada, effect, padaLine }) => (
                <div key={id} className={styles.guidePlanetCard}>
                  <div className={styles.guidePlanetName}>{graha(id)}</div>
                  {effect ? <p className={styles.guideProse}>{effect}</p> : null}
                  {padaLine ? (
                    <p className={styles.guidePlanetPada}>
                      <strong>{t('chartPadaResult', { n: pada })}: </strong>{padaLine}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.guideEmpty}>{t('planetEffectsEmpty')}</p>
          )}
        </GuideDisclosureSlot>

        {showLagna ? (
          <GuideDisclosure title={t('lagnaNotes')} paragraphs={[guide.lagnaNotes]} />
        ) : null}
      </div>
    </section>
  )
}

function PadaMap({ nakIdx, pada }: { nakIdx: number; pada: number }) {
  const t = useTranslations('nakshatra.overview')
  return (
    <div className={styles.padaMap} aria-label={t('padasAria')}>
      {[1, 2, 3, 4].map(p => (
        <div key={p} className={cn(styles.padaCell, p === pada && styles.padaCellActive)}>
          <div className={styles.padaLabel}>{t('pada', { n: p })}</div>
          <div className={styles.padaSign}>{padaSign(nakIdx, p)}</div>
          {p === pada && <div className={styles.padaDot} />}
        </div>
      ))}
    </div>
  )
}

function BestDaysTab({ birthNakIdx, moonLon }: { birthNakIdx: number; moonLon: number }) {
  const t = useTranslations('nakshatra.bestDays')
  const { lang, hi } = useLang()
  const nm = (en: string) => (hi ? termHi(en) : en)
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const days = useMemo(() => getMonthlyForecast(birthNakIdx, moonLon, year, month, lang), [birthNakIdx, moonLon, year, month, lang])
  const top3 = useMemo(() => [...days].sort((a, b) => b.score - a.score).slice(0, 3), [days])
  const MONTHS = t.raw('months') as string[]
  const WEEKDAYS = t.raw('weekdays') as string[]

  return (
    <div className={styles.stack}>
      <div className={styles.monthBar}>
        <div>
          <h3 className={styles.monthTitle}>{t('title')}</h3>
          <span className={styles.monthSub}>{t('bestFor', { month: MONTHS[month - 1], year })}</span>
        </div>
        <div className={styles.selectRow}>
          <select className={styles.select} value={month} onChange={e => setMonth(Number(e.target.value))} aria-label={t('monthAria')}>
            {MONTHS.map((m, i) => <option key={`${m}-${i}`} value={i + 1}>{m}</option>)}
          </select>
          <select className={styles.select} value={year} onChange={e => setYear(Number(e.target.value))} aria-label={t('yearAria')}>
            {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className={styles.highlightGrid}>
        {top3.map((d, i) => (
          <div key={d.dayOfMonth} className={cn(styles.highlightCard, qualityClass(d.quality))}>
            <span className={styles.rank}>0{i + 1}</span>
            <div className={styles.dayName}>{d.dayName}</div>
            <div className={styles.dayNum}>{d.dayOfMonth}</div>
            <div className={styles.dayNak}>{nm(d.nakshatra)}</div>
            <div className={styles.dayTara}>{t('taraSuffix', { tara: nm(d.tara) })}</div>
          </div>
        ))}
      </div>

      <div className={styles.calendar}>
        <div className={styles.calGrid}>
          {WEEKDAYS.map(d => (
            <div key={d} className={styles.calHead}>{d}</div>
          ))}
          {Array.from({ length: days[0]?.date.getDay() ?? 0 }).map((_, i) => <div key={`e${i}`} />)}
          {days.map(d => {
            const isToday = d.date.toDateString() === new Date().toDateString()
            return (
              <div
                key={d.dayOfMonth}
                title={`${d.dayName}: ${nm(d.nakshatra)} — ${nm(d.tara)}`}
                className={cn(styles.calCell, qualityClass(d.quality), isToday && styles.calToday)}
              >
                <div className={styles.calDate}>{d.dayOfMonth}</div>
                <div className={styles.calTara}>{hi ? nm(d.tara) : d.tara.slice(0, 4)}</div>
                {d.panchaka && <div className={styles.panchakaDot} />}
                {isToday && <div className={styles.todayMark} />}
              </div>
            )
          })}
        </div>
        <div className={styles.legend}>
          {(['auspicious', 'neutral', 'inauspicious'] as const).map(q => (
            <div key={q} className={styles.legendItem}>
              <span className={cn(styles.swatch, qualityClass(q))} />
              {t(q)}
            </div>
          ))}
          <div className={styles.legendItem}>
            <span className={styles.swatchDot} />
            {t('panchaka')}
          </div>
        </div>
      </div>

      <div className={styles.tip}>
        <Lightbulb className={styles.tipIcon} size={16} aria-hidden />
        <p>
          <strong>{t('planningStrong')}</strong>
          {t.rich('planningBody', {
            teal: (c) => <span className={styles.emTeal}>{c}</span>,
            gold: (c) => <span className={styles.emGold}>{c}</span>,
            rose: (c) => <span className={styles.emRose}>{c}</span>,
          })}
        </p>
      </div>
    </div>
  )
}

function MuhurtaTab({ nakIdx }: { nakIdx: number }) {
  const t = useTranslations('nakshatra.muhurtaTab')
  const { lang, hi } = useLang()
  const ratings = useMemo(
    () => ACTIVITY_DEFS.map(a => ({ ...a, ...getNakshatraMuhurtaRating(nakIdx, a.id, lang) })),
    [nakIdx, lang],
  )
  const starName = hi ? termHi(NAK_NAMES[nakIdx]) : NAK_NAMES[nakIdx]
  return (
    <div className={styles.stack}>
      <p className={styles.lead}>
        {t('lead', { name: starName })}
      </p>
      <div className={styles.activityGrid}>
        {ratings.map(r => (
          <div key={r.id} className={styles.activityCard}>
            <div className={styles.activityTop}>
              <r.Icon size={16} aria-hidden />
              <span className={cn(styles.ratingPill, RATING_CLASS[r.rating])}>
                {t(`ratings.${r.rating}`)}
              </span>
            </div>
            <div className={styles.activityName}>{t(`activities.${r.labelKey}`)}</div>
            <div className={styles.activityNote}>{r.note}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PanchakaTab({ grahas }: { grahas: ChartOutput['grahas'] }) {
  const t = useTranslations('nakshatra.panchaka')
  const { hi, lang } = useLang()
  const nm = (en: string) => (hi ? termHi(en) : en)
  const panchaka = useMemo(() => grahas.map(g => ({ graha: g.id, name: g.name, ...checkPanchaka(g.nakshatraIndex, lang) })), [grahas, lang])
  const allNaks = useMemo(() => NAK_NAMES.map((_, i) => checkPanchaka(i, lang)), [lang])
  const hits = panchaka.filter(p => p.panchaka)
  return (
    <div className={styles.stack}>
      <p className={styles.lead}>{t('lead')}</p>
      <div className={styles.alertList}>
        {hits.map(p => (
          <div key={p.graha} className={styles.alertCard}>
            <span className={styles.glyph}>{ICON[p.graha]}</span>
            <div>
              <div className={styles.alertTitle}>
                {t('inStar', { name: nm(p.name), nakshatra: nm(p.nakshatraName) })}
              </div>
              <div className={styles.alertKind}>{p.panchaka}</div>
              <div className={styles.alertBody}>{p.description}</div>
            </div>
          </div>
        ))}
        {hits.length === 0 && (
          <div className={styles.clearState}>
            <Check size={16} aria-hidden />
            {t('clear')}
          </div>
        )}
      </div>
      <div>
        <div className={styles.sectionHead}>
          <h3 className={styles.sectionTitle}>{t('starMap')}</h3>
          <div className={styles.sectionRule} />
        </div>
        <div className={styles.nakGrid}>
          {allNaks.map((n, i) => {
            const hp = panchaka.find(p => p.nakshatraIndex === i)
            return (
              <div key={n.nakshatraName} className={cn(styles.nakCell, n.panchaka && styles.nakCellHot)}>
                <div>
                  <div className={styles.nakName}>{nm(n.nakshatraName)}</div>
                  {n.panchaka && <div className={styles.nakKind}>{n.panchaka.replace(' Panchaka', '')}</div>}
                </div>
                {hp && <span className={styles.glyph}>{ICON[hp.graha]}</span>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function PlanetTab({ positions, chart, moonNakIdx }: { positions: Placement[]; chart: ChartOutput; moonNakIdx: number }) {
  const t = useTranslations('nakshatra.planet')
  const { hi } = useLang()
  const nm = (en: string) => (hi ? termHi(en) : en)
  const { shadbala } = chart
  const mergedPlanets = useMemo(() => {
    return positions.map(p => {
      const full = chart.grahas.find(g => g.id === p.grahaId)
      const shad = shadbala?.planets[p.grahaId as GrahaId]
      return { ...p, ...full, shadbala: shad }
    })
  }, [positions, chart.grahas, shadbala])
  const headers = ['planet', 'nakshatra', 'pada', 'lord', 'navtara', 'gana'] as const
  const moonName = nm(NAK_NAMES[moonNakIdx])

  return (
    <div className={styles.stack}>
      {shadbala && (
        <>
          <div className={styles.strengthGrid}>
            <div className={cn(styles.strengthCard, styles.strengthTeal)}>
              <div className={styles.strengthIcon}><Trophy size={16} aria-hidden /></div>
              <div>
                <div className={styles.strengthLabel}>{t('strongest')}</div>
                <div className={styles.strengthValue}>
                  {t('rupas', {
                    name: nm(GRAHA_NAMES[shadbala.strongest as GrahaId]),
                    value: shadbala.planets[shadbala.strongest]?.total.toFixed(1) ?? '0',
                  })}
                </div>
              </div>
            </div>
            <div className={cn(styles.strengthCard, styles.strengthRose)}>
              <div className={styles.strengthIcon}><TrendingDown size={16} aria-hidden /></div>
              <div>
                <div className={styles.strengthLabel}>{t('weakest')}</div>
                <div className={styles.strengthValue}>
                  {t('rupas', {
                    name: nm(GRAHA_NAMES[shadbala.weakest as GrahaId]),
                    value: shadbala.planets[shadbala.weakest]?.total.toFixed(1) ?? '0',
                  })}
                </div>
              </div>
            </div>
          </div>
          <div className={styles.profileLine}>
            {t.rich('profileLine', {
              profile: shadbala.generatedProfile ?? t('balanced'),
              ratio: (shadbala.averageRatio ?? 0).toFixed(2),
              b: (c) => <b>{c}</b>,
              gold: (c) => <span className={styles.emGold}>{c}</span>,
            })}
          </div>
        </>
      )}

      <p className={styles.lead}>{t('lead', { name: moonName })}</p>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {headers.map(c => <th key={c}>{t(`headers.${c}`)}</th>)}
            </tr>
          </thead>
          <tbody>
            {positions.map(p => {
              const taraIdx = (p.nakshatraIndex - moonNakIdx + 27) % 9
              const taraName = TARA_NAMES[taraIdx]
              const q = TARA_QUALITIES[taraName].quality
              return (
                <tr key={p.grahaId}>
                  <td>
                    <div className={styles.planetCell}>
                      <span className={styles.glyph}>{p.grahaId === 'As' ? 'Asc' : ICON[p.grahaId]}</span>
                      {p.grahaId === 'As' ? t('lagna') : nm(p.grahaName)}
                    </div>
                  </td>
                  <td>{nm(p.nakshatraName)}</td>
                  <td>{p.pada}</td>
                  <td className={styles.lordCell}>{p.lord ? nm(GRAHA_NAMES[p.lord]) : '—'}</td>
                  <td className={inkClass(q)}>{nm(taraName)}</td>
                  <td className={ganaClass(p.gana)}>{nm(p.gana)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div>
        <div className={styles.sectionHead}>
          <h3 className={styles.sectionTitle}>{t('notes')}</h3>
          <div className={styles.sectionRule} />
        </div>
        <div className={styles.planetGrid}>
          {mergedPlanets.map(p => (
            <PlanetDetailCard key={p.grahaId} p={p} moonNakIdx={moonNakIdx} ascRashi={chart.lagnas.ascRashi} />
          ))}
        </div>
      </div>
    </div>
  )
}

function CompatTab({ birthNakIdx }: { birthNakIdx: number }) {
  const t = useTranslations('nakshatra.compat')
  const { hi, lang } = useLang()
  const nm = (en: string) => (hi ? termHi(en) : en)
  const [cmp, setCmp] = useState(0)
  const compat = useMemo(() => getNakCompatibility(birthNakIdx, cmp, lang), [birthNakIdx, cmp, lang])
  const relation = useMemo(() => getRelationshipNavtara(birthNakIdx, cmp, 'You', 'Other', lang), [birthNakIdx, cmp, lang])
  const miniGrid = useMemo(() => NAK_NAMES.map((_, i) => ({ idx: i, ...getNakCompatibility(birthNakIdx, i, lang) })), [birthNakIdx, lang])
  const tone = scoreTone(compat.score)

  return (
    <div className={styles.stack}>
      <div className={styles.pairRow}>
        <div className={styles.pairCard}>
          <div className={styles.pairLabel}>{t('birthStar')}</div>
          <div className={styles.pairValue}>{nm(NAK_NAMES[birthNakIdx])}</div>
        </div>
        <div className={styles.pairArrow} aria-hidden>↔</div>
        <select className={cn(styles.select, styles.pairSelect)} value={cmp} onChange={e => setCmp(Number(e.target.value))} aria-label={t('compareAria')}>
          {NAK_NAMES.map((n, i) => <option key={n} value={i}>{nm(n)}</option>)}
        </select>
      </div>

      <div className={cn(styles.relationCard, relation.mutualHard && styles.relationHard)}>
        <div className={styles.relationTitle}>{t('relationTitle')}</div>
        <div>
          {t('youToOther')}<strong className={relation.aToB.profile.isHard ? styles.emRose : styles.emTeal}>{nm(relation.aToB.tara)}</strong>
          {' · '}
          {t('otherToYou')}<strong className={relation.bToA.profile.isHard ? styles.emRose : styles.emTeal}>{nm(relation.bToA.tara)}</strong>
        </div>
        <div className={styles.relationAdvice}>{relation.advice}</div>
      </div>

      <div className={styles.scoreCard}>
        <div className={cn(styles.scoreNum, tone)}>{compat.score}%</div>
        <div className={cn(styles.scoreLabel, tone)}>{compat.summary}</div>
        <div className={styles.scoreTrack}>
          <div className={cn(styles.scoreFill, tone === styles.toneBad ? styles.fillRose : tone === styles.toneMid ? styles.fillAmber : styles.fillTeal)} style={{ width: `${compat.score}%` }} />
        </div>
        <div className={styles.factorGrid}>
          <Factor label={t('factors.tarabala')} score={compat.taraScore} max={3} extra={nm(compat.taraName)} fill={styles.fillGold} ink={styles.emGold} />
          <Factor label={t('factors.gana')} score={compat.ganaScore} max={3} extra={compat.ganaMatch ? t('match') : t('mismatch')} fill={styles.fillTeal} ink={styles.emTeal} />
          <Factor
            label={t('factors.nadi')}
            score={compat.nadiScore}
            max={3}
            extra={compat.nadiMatch ? t('sameNadi') : t('different')}
            fill={compat.nadiMatch ? styles.fillRose : styles.fillTeal}
            ink={compat.nadiMatch ? styles.emRose : styles.emTeal}
          />
          <Factor label={t('factors.yoni')} score={compat.yoniScore} max={4} extra="" fill={styles.fillAmber} ink={styles.toneMid} />
        </div>
      </div>

      <div>
        <div className={styles.sectionHead}>
          <h3 className={styles.sectionTitle}>{t('all27')}</h3>
          <div className={styles.sectionRule} />
        </div>
        <div className={styles.heatGrid}>
          {miniGrid.map(n => (
            <button
              key={n.idx}
              type="button"
              className={cn(styles.heatCell, heatTone(n.score), n.idx === cmp && styles.heatCellActive)}
              title={`${nm(NAK_NAMES[n.idx])}: ${n.score}%`}
              onClick={() => setCmp(n.idx)}
            >
              {n.score}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Factor({
  label, score, max, extra, fill, ink,
}: {
  label: string
  score: number
  max: number
  extra: string
  fill: string
  ink: string
}) {
  return (
    <div className={styles.factor}>
      <div className={styles.factorLabel}>{label}</div>
      <div className={styles.factorTop}>
        <span className={cn(styles.factorScore, ink)}>{score}/{max}</span>
        <span className={styles.factorExtra}>{extra}</span>
      </div>
      <div className={styles.factorTrack}>
        <div className={cn(styles.factorFill, fill)} style={{ width: `${(score / max) * 100}%` }} />
      </div>
    </div>
  )
}

function RemediesTab({ nakIdx }: { nakIdx: number }) {
  const t = useTranslations('nakshatra.remedies')
  const { lang, hi } = useLang()
  const starName = hi ? termHi(NAK_NAMES[nakIdx]) : NAK_NAMES[nakIdx]
  const remedy = getNakshatraRemedies(nakIdx, lang)
  if (!remedy) {
    return <p className={styles.lead}>{t('unavailable')}</p>
  }
  const sections: { titleKey: string; Icon: LucideIcon; items: { labelKey: string; value: string }[] }[] = [
    { titleKey: 'mantra', Icon: Sparkles, items: [{ labelKey: 'mantra', value: remedy.mantra }, { labelKey: 'beej', value: remedy.beej }] },
    { titleKey: 'gemMetal', Icon: Gem, items: [{ labelKey: 'gemstone', value: remedy.gemstone }, { labelKey: 'metal', value: remedy.metal }, { labelKey: 'color', value: remedy.color }] },
    { titleKey: 'offerings', Icon: Leaf, items: [{ labelKey: 'flower', value: remedy.flower }, { labelKey: 'tree', value: remedy.tree }] },
    { titleKey: 'worship', Icon: Sun, items: [{ labelKey: 'deity', value: remedy.deity }, { labelKey: 'upasana', value: remedy.upasana }, { labelKey: 'fasting', value: remedy.fasting }] },
    { titleKey: 'service', Icon: Heart, items: [{ labelKey: 'charity', value: remedy.charity }, { labelKey: 'health', value: remedy.dosha }] },
  ]
  return (
    <div className={styles.stack}>
      <p className={styles.lead}>
        {t.rich('lead', {
          name: starName,
          gold: (c) => <strong className={styles.emGold}>{c}</strong>,
        })}
      </p>
      <div className={styles.remedyGrid}>
        {sections.map(s => (
          <div key={s.titleKey} className={styles.remedyCard}>
            <div className={styles.remedyHead}>
              <s.Icon size={14} aria-hidden />
              {t(`sections.${s.titleKey}`)}
            </div>
            {s.items.map(({ labelKey, value }) => (
              <div key={labelKey} className={styles.remedyRow}>
                <span className={styles.remedyKey}>{t(`fields.${labelKey}`)}</span>
                <span className={styles.remedyVal}>{value}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
