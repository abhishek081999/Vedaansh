'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/NakshatraPanel.tsx
//  Nakshatra workspace: birth star, D1 chart, and analysis tabs
// ─────────────────────────────────────────────────────────────

import React, { useState, useMemo, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import {
  Activity,
  BookOpen,
  Briefcase,
  CalendarDays,
  Check,
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
    if (initialTab === 'overview') {
      setSubTab(isMobile ? 'overview' : 'navtara')
    } else {
      setSubTab(initialTab)
    }
  }, [initialTab, isMobile])

  useEffect(() => {
    if (!isMobile) return
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [subTab, isMobile])

  const moon = chart.grahas.find(g => g.id === 'Mo')
  const birthNakIdx = moon?.nakshatraIndex ?? 0
  const birthNakPada = moon?.pada ?? 1
  const moonLon = moon?.lonSidereal ?? 0

  const chars = useMemo(() => getNakshatraCharacteristics(birthNakIdx, birthNakPada, lang), [birthNakIdx, birthNakPada, lang])
  const starName = nm(chars.name)
  const lordName = nm(GRAHA_NAMES[chars.lord])

  const planetPos = useMemo(() => {
    const base = getGraNakPositions(chart.grahas.filter(g => !['Ur', 'Ne', 'Pl'].includes(g.id)))
    const ascDeg = chart.lagnas.ascDegree
    const lagNakIdx = Math.floor(ascDeg / (360 / 27))
    const lagNakPada = Math.floor(((ascDeg % (360 / 27)) / (360 / 27)) * 4) + 1
    const lagChars = getNakshatraCharacteristics(lagNakIdx, lagNakPada, lang)
    const lagPosition: Placement = {
      grahaId: 'As',
      grahaName: tPlanet('lagna'),
      nakshatraIndex: lagNakIdx,
      nakshatraName: NAK_NAMES[lagNakIdx],
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
  const showOverview = !isMobile || subTab === 'overview'
  const tabForContent: SubTab = subTab === 'overview' ? 'navtara' : subTab

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
          {showOverview && <OverviewTab chars={chars} />}

          {!isMobile && (
            <div className={cn(styles.panel, styles.panelFlow)}>
              <div className={styles.tabScroll}>
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
              <TabContent
                subTab={tabForContent}
                birthNakIdx={birthNakIdx}
                birthNakPada={birthNakPada}
                moonLon={moonLon}
                chart={chart}
                planetPos={planetPos}
              />
            </div>
          )}

          {isMobile && subTab !== 'overview' && (
            <div className={styles.panel}>
              <TabContent
                subTab={subTab}
                birthNakIdx={birthNakIdx}
                birthNakPada={birthNakPada}
                moonLon={moonLon}
                chart={chart}
                planetPos={planetPos}
              />
            </div>
          )}
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

function OverviewTab({ chars }: { chars: NakshatraCharacteristics }) {
  const t = useTranslations('nakshatra.overview')
  const { hi } = useLang()
  const nm = (en: string) => (hi ? termHi(en) : en)
  const rows: { key: string; value: string; tone?: string }[] = [
    { key: 'deity', value: chars.deity },
    { key: 'gana', value: nm(chars.gana), tone: ganaClass(chars.gana) },
    { key: 'yoni', value: chars.yoni },
    { key: 'nadi', value: nm(chars.nadi) },
    { key: 'varna', value: chars.varna },
    { key: 'nature', value: nm(chars.nature) },
    { key: 'bodyPart', value: chars.bodyPart },
    { key: 'symbol', value: chars.symbol },
  ]
  return (
    <section className={styles.panel}>
      <div className={styles.sectionHead}>
        <h3 className={styles.sectionTitle}>{t('title')}</h3>
        <div className={styles.sectionRule} />
      </div>
      <div className={styles.traitGrid}>
        {rows.map(({ key, value, tone }) => (
          <div key={key} className={styles.traitCard}>
            <div className={styles.traitLabel}>{t(key)}</div>
            <div className={cn(styles.traitValue, tone)}>{value}</div>
          </div>
        ))}
      </div>
      <PadaMap nakIdx={chars.index} pada={chars.pada} />
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
