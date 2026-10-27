'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/NakshatraPanel.tsx
//  Nakshatra workspace: birth star, D1 chart, and analysis tabs
// ─────────────────────────────────────────────────────────────

import React, { useState, useMemo, useEffect } from 'react'
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
  getMonthlyForecast, getNakshatraMuhurtaRating, NAKSHATRA_REMEDIES,
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
import styles from './NakshatraPanel.module.css'

export type NakshatraSubTab = 'overview' | 'navtara' | 'taramandal' | 'bestdays' | 'muhurta' | 'panchaka' | 'planet' | 'compat' | 'remedies' | 'profession' | 'medical'
type SubTab = NakshatraSubTab

const TABS: { id: SubTab; label: string; Icon: LucideIcon }[] = [
  { id: 'navtara', label: 'Navtara', Icon: Compass },
  { id: 'taramandal', label: 'Taramandal', Icon: Orbit },
  { id: 'bestdays', label: 'Best Days', Icon: CalendarDays },
  { id: 'muhurta', label: 'Muhurta', Icon: Zap },
  { id: 'panchaka', label: 'Panchaka', Icon: Flame },
  { id: 'planet', label: 'Planets', Icon: Star },
  { id: 'compat', label: 'Compat', Icon: Link2 },
  { id: 'remedies', label: 'Remedies', Icon: Heart },
  { id: 'profession', label: 'Profession', Icon: Briefcase },
  { id: 'medical', label: 'Medical', Icon: Activity },
]

const MOBILE_TABS: { id: SubTab; icon: LucideIcon; label: string }[] = [
  { id: 'overview', icon: Info, label: 'Overview' },
  { id: 'navtara', icon: Compass, label: 'Navtara' },
  { id: 'taramandal', icon: Orbit, label: 'Mandal' },
  { id: 'bestdays', icon: CalendarDays, label: 'Days' },
  { id: 'muhurta', icon: Zap, label: 'Muhurta' },
  { id: 'panchaka', icon: Flame, label: 'Panchaka' },
  { id: 'planet', icon: Star, label: 'Planets' },
  { id: 'compat', icon: Link2, label: 'Compat' },
  { id: 'remedies', icon: Heart, label: 'Remedy' },
  { id: 'profession', icon: Briefcase, label: 'Career' },
  { id: 'medical', icon: Activity, label: 'Medical' },
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

function scoreTone(summary: string): string {
  if (summary === 'Excellent' || summary === 'Good') return styles.toneGood
  if (summary === 'Average' || summary === 'Poor') return styles.toneMid
  return styles.toneBad
}

function heatTone(summary: string): string {
  if (summary === 'Excellent' || summary === 'Good') return styles.heatGood
  if (summary === 'Average') return styles.heatMid
  return styles.heatBad
}

function padaSign(nakIdx: number, pada: number): string {
  const rashi = ((((PADA_START[nakIdx] ?? 0) + pada - 1) % 12) + 1) as Rashi
  return RASHI_SHORT[rashi]
}

export function NakshatraEmpty({
  onOpenBirthForm,
  detail,
}: {
  onOpenBirthForm: () => void
  detail?: string
}) {
  return (
    <div className={styles.emptyWrap}>
      <div className={styles.emptyIcon} aria-hidden>
        <Moon size={26} />
      </div>
      <h2 className={styles.emptyTitle}>Nakshatra</h2>
      <p className={styles.emptyText}>
        {detail ?? 'Load a birth chart for the Moon’s star, Navtara, muhurta, compatibility, and remedies.'}
      </p>
      <Button onClick={onOpenBirthForm}>Open birth form</Button>
    </div>
  )
}

export function NakshatraPanel({ chart, initialTab = 'overview' }: { chart: ChartOutput; initialTab?: SubTab }) {
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

  const chars = useMemo(() => getNakshatraCharacteristics(birthNakIdx, birthNakPada), [birthNakIdx, birthNakPada])

  const planetPos = useMemo(() => {
    const base = getGraNakPositions(chart.grahas.filter(g => !['Ur', 'Ne', 'Pl'].includes(g.id)))
    const ascDeg = chart.lagnas.ascDegree
    const lagNakIdx = Math.floor(ascDeg / (360 / 27))
    const lagNakPada = Math.floor(((ascDeg % (360 / 27)) / (360 / 27)) * 4) + 1
    const lagChars = getNakshatraCharacteristics(lagNakIdx, lagNakPada)
    const lagPosition: Placement = {
      grahaId: 'As',
      grahaName: 'Lagna',
      nakshatraIndex: lagNakIdx,
      nakshatraName: NAK_NAMES[lagNakIdx],
      pada: lagNakPada,
      lord: lagChars.lord,
      gana: lagChars.gana,
      degree: ascDeg,
      panchaka: checkPanchaka(lagNakIdx).panchaka,
    }
    return [lagPosition, ...base]
  }, [chart.grahas, chart.lagnas])

  const remedy = NAKSHATRA_REMEDIES[birthNakIdx]
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
            <p className={styles.eyebrow}>Janma Nakshatra</p>
            <div className={styles.titleRow}>
              <h2 className={styles.heroTitle}>{chars.name}</h2>
              <span className={styles.padaBadge}>Pada {chars.pada}</span>
            </div>
            <p className={styles.heroSub}>
              Birth Moon star · lord {GRAHA_NAMES[chars.lord]}
            </p>
          </div>
        </div>
        <div className={styles.statGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Lord</div>
            <div className={styles.statValue}>{GRAHA_NAMES[chars.lord]}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Gana</div>
            <div className={cn(styles.statValue, ganaClass(chars.gana))}>{chars.gana}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Deity</div>
            <div className={styles.statValue}>{chars.deity}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Yoni</div>
            <div className={styles.statValue}>{chars.yoni}</div>
          </div>
        </div>
        <div className={styles.shakti}>
          <span className={styles.shaktiLabel}>Shakti</span>
          <p className={styles.shaktiQuote}>{chars.shakti}</p>
        </div>
      </header>

      <div className={styles.layout}>
        <aside className={styles.chartCol}>
          <div className={styles.chartCard}>
            <div className={styles.chartLabel}>
              <span className={styles.chartTitle}>{chartView === 'stars' ? '27 stars' : 'D1 · Rashi'}</span>
              <div className={styles.viewToggle} role="tablist" aria-label="Chart type">
                <button
                  type="button"
                  role="tab"
                  aria-selected={chartView === 'stars'}
                  className={cn(styles.viewBtn, chartView === 'stars' && styles.viewBtnOn)}
                  onClick={() => setChartView('stars')}
                >
                  Nakshatras
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={chartView === 'rashi'}
                  className={cn(styles.viewBtn, chartView === 'rashi' && styles.viewBtnOn)}
                  onClick={() => setChartView('rashi')}
                >
                  Rashi
                </button>
              </div>
            </div>
            {chartView === 'stars' ? (
              <NakshatraWheel
                key={birthNakIdx}
                birthIndex={birthNakIdx}
                birthPada={birthNakPada}
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
              <span>Moon in <strong>{chars.name}</strong> pada {chars.pada}</span>
              <span className={styles.moonLord}>Lord {GRAHA_NAMES[chars.lord]}</span>
            </p>
          </div>
        </aside>

        <div className={styles.mainCol}>
          {showOverview && <OverviewTab chars={chars} />}

          {!isMobile && (
            <div className={cn(styles.panel, styles.panelFlow)}>
              <div className={styles.tabScroll}>
                <div className={styles.tabRow} role="tablist" aria-label="Nakshatra analysis">
                  {TABS.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      role="tab"
                      aria-selected={subTab === t.id}
                      onClick={() => setSubTab(t.id)}
                      className={cn(styles.tabBtn, subTab === t.id && styles.tabBtnActive)}
                    >
                      <t.Icon size={14} aria-hidden />
                      {t.label}
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
                remedy={remedy}
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
                remedy={remedy}
              />
            </div>
          )}
        </div>
      </div>

      {isMobile && (
        <MobileBottomNavShell
          ariaLabel="Nakshatra sections"
          compact
          tabs={MOBILE_TABS.map(({ id, icon, label }) => ({
            id,
            icon,
            label,
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
  remedy,
}: {
  subTab: SubTab
  birthNakIdx: number
  birthNakPada: number
  moonLon: number
  chart: ChartOutput
  planetPos: Placement[]
  remedy: (typeof NAKSHATRA_REMEDIES)[number]
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
      {subTab === 'remedies' && <RemediesTab remedy={remedy} nakIdx={birthNakIdx} />}
      {subTab === 'profession' && <NakshatraProfessionTab chart={chart} birthNakIdx={birthNakIdx} birthNakPada={birthNakPada} />}
      {subTab === 'medical' && <NakshatraMedicalTab chart={chart} birthNakIdx={birthNakIdx} />}
    </div>
  )
}

function OverviewTab({ chars }: { chars: NakshatraCharacteristics }) {
  const rows: { label: string; value: string; tone?: string }[] = [
    { label: 'Deity', value: chars.deity },
    { label: 'Gana', value: chars.gana, tone: ganaClass(chars.gana) },
    { label: 'Yoni', value: chars.yoni },
    { label: 'Nadi', value: chars.nadi },
    { label: 'Varna', value: chars.varna },
    { label: 'Nature', value: chars.nature },
    { label: 'Body part', value: chars.bodyPart },
    { label: 'Symbol', value: chars.symbol },
  ]
  return (
    <section className={styles.panel}>
      <div className={styles.sectionHead}>
        <h3 className={styles.sectionTitle}>Birth star</h3>
        <div className={styles.sectionRule} />
      </div>
      <div className={styles.traitGrid}>
        {rows.map(({ label, value, tone }) => (
          <div key={label} className={styles.traitCard}>
            <div className={styles.traitLabel}>{label}</div>
            <div className={cn(styles.traitValue, tone)}>{value}</div>
          </div>
        ))}
      </div>
      <PadaMap nakIdx={chars.index} pada={chars.pada} />
    </section>
  )
}

function PadaMap({ nakIdx, pada }: { nakIdx: number; pada: number }) {
  return (
    <div className={styles.padaMap} aria-label="Nakshatra padas">
      {[1, 2, 3, 4].map(p => (
        <div key={p} className={cn(styles.padaCell, p === pada && styles.padaCellActive)}>
          <div className={styles.padaLabel}>Pada {p}</div>
          <div className={styles.padaSign}>{padaSign(nakIdx, p)}</div>
          {p === pada && <div className={styles.padaDot} />}
        </div>
      ))}
    </div>
  )
}

function BestDaysTab({ birthNakIdx, moonLon }: { birthNakIdx: number; moonLon: number }) {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const days = useMemo(() => getMonthlyForecast(birthNakIdx, moonLon, year, month), [birthNakIdx, moonLon, year, month])
  const top3 = useMemo(() => [...days].sort((a, b) => b.score - a.score).slice(0, 3), [days])
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  return (
    <div className={styles.stack}>
      <div className={styles.monthBar}>
        <div>
          <h3 className={styles.monthTitle}>Monthly forecast</h3>
          <span className={styles.monthSub}>Best days for {MONTHS[month - 1]} {year}</span>
        </div>
        <div className={styles.selectRow}>
          <select className={styles.select} value={month} onChange={e => setMonth(Number(e.target.value))} aria-label="Month">
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select className={styles.select} value={year} onChange={e => setYear(Number(e.target.value))} aria-label="Year">
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
            <div className={styles.dayNak}>{d.nakshatra}</div>
            <div className={styles.dayTara}>{d.tara} tara</div>
          </div>
        ))}
      </div>

      <div className={styles.calendar}>
        <div className={styles.calGrid}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className={styles.calHead}>{d}</div>
          ))}
          {Array.from({ length: days[0]?.date.getDay() ?? 0 }).map((_, i) => <div key={`e${i}`} />)}
          {days.map(d => {
            const isToday = d.date.toDateString() === new Date().toDateString()
            return (
              <div
                key={d.dayOfMonth}
                title={`${d.dayName}: ${d.nakshatra} — ${d.tara}`}
                className={cn(styles.calCell, qualityClass(d.quality), isToday && styles.calToday)}
              >
                <div className={styles.calDate}>{d.dayOfMonth}</div>
                <div className={styles.calTara}>{d.tara.slice(0, 4)}</div>
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
              {q}
            </div>
          ))}
          <div className={styles.legendItem}>
            <span className={styles.swatchDot} />
            Panchaka
          </div>
        </div>
      </div>

      <div className={styles.tip}>
        <Lightbulb className={styles.tipIcon} size={16} aria-hidden />
        <p>
          <strong>Planning. </strong>
          Keep launches and <span className={styles.emTeal}>travel</span> on <span className={styles.emGold}>auspicious</span> days.
          Leave contracts and medical procedures off <span className={styles.emRose}>inauspicious</span> and <span className={styles.emRose}>Panchaka</span> days.
        </p>
      </div>
    </div>
  )
}

const ACTIVITIES: { id: ActivityType; label: string; Icon: LucideIcon }[] = [
  { id: 'marriage', label: 'Marriage', Icon: Gem },
  { id: 'travel', label: 'Travel', Icon: Plane },
  { id: 'business', label: 'Business', Icon: Briefcase },
  { id: 'education', label: 'Education', Icon: BookOpen },
  { id: 'medical', label: 'Medical', Icon: Activity },
  { id: 'spiritual', label: 'Spiritual', Icon: Sparkles },
  { id: 'property', label: 'Property', Icon: Home },
  { id: 'career', label: 'Career', Icon: Target },
  { id: 'finance', label: 'Finance', Icon: Coins },
]

function MuhurtaTab({ nakIdx }: { nakIdx: number }) {
  const ratings = useMemo(() => ACTIVITIES.map(a => ({ ...a, ...getNakshatraMuhurtaRating(nakIdx, a.id) })), [nakIdx])
  return (
    <div className={styles.stack}>
      <p className={styles.lead}>
        How {NAK_NAMES[nakIdx]} suits each kind of beginning.
      </p>
      <div className={styles.activityGrid}>
        {ratings.map(r => (
          <div key={r.id} className={styles.activityCard}>
            <div className={styles.activityTop}>
              <r.Icon size={16} aria-hidden />
              <span className={cn(styles.ratingPill, RATING_CLASS[r.rating])}>{r.rating}</span>
            </div>
            <div className={styles.activityName}>{r.label}</div>
            <div className={styles.activityNote}>{r.note}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PanchakaTab({ grahas }: { grahas: ChartOutput['grahas'] }) {
  const panchaka = useMemo(() => grahas.map(g => ({ graha: g.id, name: g.name, ...checkPanchaka(g.nakshatraIndex) })), [grahas])
  const allNaks = useMemo(() => NAK_NAMES.map((_, i) => checkPanchaka(i)), [])
  const hits = panchaka.filter(p => p.panchaka)
  return (
    <div className={styles.stack}>
      <p className={styles.lead}>
        Panchaka covers the last five stars, Dhanishtha through Revati. A planet born there carries that dosha.
      </p>
      <div className={styles.alertList}>
        {hits.map(p => (
          <div key={p.graha} className={styles.alertCard}>
            <span className={styles.glyph}>{ICON[p.graha]}</span>
            <div>
              <div className={styles.alertTitle}>{p.name} in {p.nakshatraName}</div>
              <div className={styles.alertKind}>{p.panchaka}</div>
              <div className={styles.alertBody}>{p.description}</div>
            </div>
          </div>
        ))}
        {hits.length === 0 && (
          <div className={styles.clearState}>
            <Check size={16} aria-hidden />
            No planet sits in the Panchaka zone at birth
          </div>
        )}
      </div>
      <div>
        <div className={styles.sectionHead}>
          <h3 className={styles.sectionTitle}>Star map</h3>
          <div className={styles.sectionRule} />
        </div>
        <div className={styles.nakGrid}>
          {allNaks.map((n, i) => {
            const hp = panchaka.find(p => p.nakshatraIndex === i)
            return (
              <div key={n.nakshatraName} className={cn(styles.nakCell, n.panchaka && styles.nakCellHot)}>
                <div>
                  <div className={styles.nakName}>{n.nakshatraName}</div>
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
  const { shadbala } = chart
  const mergedPlanets = useMemo(() => {
    return positions.map(p => {
      const full = chart.grahas.find(g => g.id === p.grahaId)
      const shad = shadbala?.planets[p.grahaId as GrahaId]
      return { ...p, ...full, shadbala: shad }
    })
  }, [positions, chart.grahas, shadbala])

  return (
    <div className={styles.stack}>
      {shadbala && (
        <>
          <div className={styles.strengthGrid}>
            <div className={cn(styles.strengthCard, styles.strengthTeal)}>
              <div className={styles.strengthIcon}><Trophy size={16} aria-hidden /></div>
              <div>
                <div className={styles.strengthLabel}>Strongest</div>
                <div className={styles.strengthValue}>
                  {GRAHA_NAMES[shadbala.strongest as GrahaId]} ({shadbala.planets[shadbala.strongest]?.total.toFixed(1)} rupas)
                </div>
              </div>
            </div>
            <div className={cn(styles.strengthCard, styles.strengthRose)}>
              <div className={styles.strengthIcon}><TrendingDown size={16} aria-hidden /></div>
              <div>
                <div className={styles.strengthLabel}>Weakest</div>
                <div className={styles.strengthValue}>
                  {GRAHA_NAMES[shadbala.weakest as GrahaId]} ({shadbala.planets[shadbala.weakest]?.total.toFixed(1)} rupas)
                </div>
              </div>
            </div>
          </div>
          <div className={styles.profileLine}>
            Chart profile <b>{shadbala.generatedProfile ?? 'balanced'}</b>
            {' · '}mean ratio <span className={styles.emGold}>{(shadbala.averageRatio ?? 0).toFixed(2)}x</span>
          </div>
        </>
      )}

      <p className={styles.lead}>
        Each graha’s star, pada, and Navtara counted from the birth Moon in {NAK_NAMES[moonNakIdx]}.
      </p>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {['Planet', 'Nakshatra', 'Pada', 'Lord', 'Navtara', 'Gana'].map(c => <th key={c}>{c}</th>)}
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
                      {p.grahaName}
                    </div>
                  </td>
                  <td>{p.nakshatraName}</td>
                  <td>{p.pada}</td>
                  <td className={styles.lordCell}>{GRAHA_NAMES[p.lord] || '—'}</td>
                  <td className={inkClass(q)}>{taraName}</td>
                  <td className={ganaClass(p.gana)}>{p.gana}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div>
        <div className={styles.sectionHead}>
          <h3 className={styles.sectionTitle}>Planet notes</h3>
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
  const [cmp, setCmp] = useState(0)
  const compat = useMemo(() => getNakCompatibility(birthNakIdx, cmp), [birthNakIdx, cmp])
  const relation = useMemo(() => getRelationshipNavtara(birthNakIdx, cmp, 'You', 'Other'), [birthNakIdx, cmp])
  const miniGrid = useMemo(() => NAK_NAMES.map((_, i) => ({ idx: i, ...getNakCompatibility(birthNakIdx, i) })), [birthNakIdx])
  const tone = scoreTone(compat.summary)

  return (
    <div className={styles.stack}>
      <div className={styles.pairRow}>
        <div className={styles.pairCard}>
          <div className={styles.pairLabel}>Birth star</div>
          <div className={styles.pairValue}>{NAK_NAMES[birthNakIdx]}</div>
        </div>
        <div className={styles.pairArrow} aria-hidden>↔</div>
        <select className={cn(styles.select, styles.pairSelect)} value={cmp} onChange={e => setCmp(Number(e.target.value))} aria-label="Compare nakshatra">
          {NAK_NAMES.map((n, i) => <option key={n} value={i}>{n}</option>)}
        </select>
      </div>

      <div className={cn(styles.relationCard, relation.mutualHard && styles.relationHard)}>
        <div className={styles.relationTitle}>Relationship Navtara</div>
        <div>
          You → other: <strong className={relation.aToB.profile.isHard ? styles.emRose : styles.emTeal}>{relation.aToB.tara}</strong>
          {' · '}
          Other → you: <strong className={relation.bToA.profile.isHard ? styles.emRose : styles.emTeal}>{relation.bToA.tara}</strong>
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
          <Factor label="Tarabala" score={compat.taraScore} max={3} extra={compat.taraName} fill={styles.fillGold} ink={styles.emGold} />
          <Factor label="Gana" score={compat.ganaScore} max={3} extra={compat.ganaMatch ? 'Match' : 'Mismatch'} fill={styles.fillTeal} ink={styles.emTeal} />
          <Factor
            label="Nadi"
            score={compat.nadiScore}
            max={3}
            extra={compat.nadiMatch ? 'Same nadi' : 'Different'}
            fill={compat.nadiMatch ? styles.fillRose : styles.fillTeal}
            ink={compat.nadiMatch ? styles.emRose : styles.emTeal}
          />
          <Factor label="Yoni" score={compat.yoniScore} max={4} extra="" fill={styles.fillAmber} ink={styles.toneMid} />
        </div>
      </div>

      <div>
        <div className={styles.sectionHead}>
          <h3 className={styles.sectionTitle}>All 27</h3>
          <div className={styles.sectionRule} />
        </div>
        <div className={styles.heatGrid}>
          {miniGrid.map(n => (
            <button
              key={n.idx}
              type="button"
              className={cn(styles.heatCell, heatTone(n.summary), n.idx === cmp && styles.heatCellActive)}
              title={`${NAK_NAMES[n.idx]}: ${n.score}%`}
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

function RemediesTab({ remedy, nakIdx }: { remedy: (typeof NAKSHATRA_REMEDIES)[number]; nakIdx: number }) {
  if (!remedy) {
    return <p className={styles.lead}>Remedy notes are not available for this star.</p>
  }
  const sections: { title: string; Icon: LucideIcon; items: { label: string; value: string }[] }[] = [
    { title: 'Mantra', Icon: Sparkles, items: [{ label: 'Mantra', value: remedy.mantra }, { label: 'Beej', value: remedy.beej }] },
    { title: 'Gem and metal', Icon: Gem, items: [{ label: 'Gemstone', value: remedy.gemstone }, { label: 'Metal', value: remedy.metal }, { label: 'Color', value: remedy.color }] },
    { title: 'Offerings', Icon: Leaf, items: [{ label: 'Flower', value: remedy.flower }, { label: 'Tree', value: remedy.tree }] },
    { title: 'Worship', Icon: Sun, items: [{ label: 'Deity', value: remedy.deity }, { label: 'Upasana', value: remedy.upasana }, { label: 'Fasting', value: remedy.fasting }] },
    { title: 'Service', Icon: Heart, items: [{ label: 'Charity', value: remedy.charity }, { label: 'Health', value: remedy.dosha }] },
  ]
  return (
    <div className={styles.stack}>
      <p className={styles.lead}>
        Worship, mantra, and service traditionally kept for <strong className={styles.emGold}>{NAK_NAMES[nakIdx]}</strong>.
      </p>
      <div className={styles.remedyGrid}>
        {sections.map(s => (
          <div key={s.title} className={styles.remedyCard}>
            <div className={styles.remedyHead}>
              <s.Icon size={14} aria-hidden />
              {s.title}
            </div>
            {s.items.map(({ label, value }) => (
              <div key={label} className={styles.remedyRow}>
                <span className={styles.remedyKey}>{label}</span>
                <span className={styles.remedyVal}>{value}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
