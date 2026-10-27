'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/NadiPanel.tsx
//  Nadi workspace. Chart first, then the readings.
// ─────────────────────────────────────────────────────────────

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Briefcase, CalendarRange, Coins, Gem, Grid3x3, Heart, Home, Hourglass, Orbit, Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ChartOutput, DashaNode, DashaSystem, Rashi, UserPlan } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_SHORT } from '@/types/astrology'
import { VARGA_UI_LIST } from '@/lib/engine/vargas'
import { getDashaPathAt } from '@/lib/engine/dasha/current'
import { readNadiChart } from '@/lib/engine/nadi'
import type { NadiChartReading } from '@/lib/engine/nadi'
import { ChakraSelector } from '@/components/chakra/ChakraSelector'
import { GrahaTable } from '@/components/ui/GrahaTable'
import { DashaTree } from '@/components/dasha/DashaTree'
import { ChartContextBar } from '@/components/ui/patterns/ChartContextBar'
import { BREAKPOINTS } from '@/lib/ui/breakpoints'
import { NadiHousesSection, type NadiReadingView } from '@/components/ui/NadiHousesSection'
import { NadiActiveBrief, nadiHighlights } from '@/components/ui/nadiFindings'
import styles from './NadiPanel.module.css'

type NadiView = 'chart' | NadiReadingView

const VIEWS: { id: NadiView; label: string; hint: string; icon: LucideIcon }[] = [
  { id: 'chart', label: 'Chart', hint: 'Planetary positions. The active reading stays above the tabs.', icon: Grid3x3 },
  { id: 'houses', label: 'Houses', hint: 'The Bhrigu Bhava, the occupied houses, and the exchanges.', icon: Home },
  { id: 'yogas', label: 'Yogas', hint: 'The combinations that are present, and dusthana dignity.', icon: Sparkles },
  { id: 'marriage', label: 'Marriage', hint: 'Marriage combinations, then the three marriage rules and Navamsha.', icon: Heart },
  { id: 'career', label: 'Career', hint: 'The career this chart gives, then Dashamsha, Shashtiamsa, and the neighborhood.', icon: Briefcase },
  { id: 'wealth', label: 'Wealth', hint: 'The wealth years, then property from Chaturthamsha and vehicles from Shodashamsha.', icon: Coins },
  { id: 'future', label: 'Future', hint: 'The coming years, the activations that land on them, and the periods still ahead.', icon: CalendarRange },
  { id: 'timing', label: 'Timing', hint: 'The running year, the degree years, and the period now open.', icon: Hourglass },
  { id: 'transits', label: 'Transits', hint: 'The live sky, the windows open now, and the natal signs Jupiter and Saturn wake together.', icon: Orbit },
  { id: 'remedies', label: 'Remedies', hint: 'The stone, color, and remedy this chart allows.', icon: Gem },
]

const DASHA_OPTIONS: { id: DashaSystem; label: string }[] = [
  { id: 'vimshottari', label: 'Vimshottari' },
  { id: 'yogini', label: 'Yogini' },
  { id: 'ashtottari', label: 'Ashtottari' },
  { id: 'chara', label: 'Chara (K.N. Rao)' },
  { id: 'chara_fe', label: 'Chara (Rangacharya FE)' },
  { id: 'mandook', label: 'Mandook' },
  { id: 'sthir', label: 'Sthir' },
]

const SIGN_LABEL: Record<string, string> = {
  Ar: 'Aries', Ta: 'Taurus', Ge: 'Gemini', Cn: 'Cancer',
  Le: 'Leo', Vi: 'Virgo', Li: 'Libra', Sc: 'Scorpio',
  Sg: 'Sagittarius', Cp: 'Capricorn', Aq: 'Aquarius', Pi: 'Pisces',
}

function planRank(plan: UserPlan): number {
  return plan === 'platinum' ? 2 : plan === 'gold' ? 1 : 0
}

function tierRank(tier: 'free' | 'gold' | 'platinum'): number {
  return tier === 'platinum' ? 2 : tier === 'gold' ? 1 : 0
}

function NadiCharts({
  chart,
  userPlan,
  compact,
  view,
  reading,
}: {
  chart: ChartOutput
  userPlan: UserPlan
  compact: boolean
  view: NadiView
  reading: NadiChartReading
}) {
  const divisionals = VARGA_UI_LIST.filter((v) => v.name !== 'D1')
  const [vargaName, setVargaName] = useState('D9')
  const focus = view === 'marriage' ? 'D9' : view === 'career' ? 'D10' : null
  useEffect(() => {
    if (focus) setVargaName(focus)
  }, [focus])
  const moonNakIndex = chart.grahas.find((g) => g.id === 'Mo')?.nakshatraIndex ?? 0
  const d1Asc = chart.lagnas.ascRashi as Rashi
  const selected = divisionals.find((v) => v.name === vargaName) ?? divisionals.find((v) => v.name === 'D9') ?? divisionals[0]
  const selectedGrahas = selected ? chart.vargas?.[selected.name] ?? [] : []
  const selectedAsc = ((selected ? chart.vargaLagnas?.[selected.name] : undefined) ?? d1Asc) as Rashi
  const core = divisionals.filter((v) => v.tier === 'free')
  const extended = divisionals.filter((v) => v.tier !== 'free')
  const size = compact ? 250 : 300
  const marks = nadiHighlights(view, reading, selected?.name ?? 'D9')
  const option = (v: (typeof divisionals)[number]) => {
    const unlocked = planRank(userPlan) >= tierRank(v.tier)
    const ready = v.name in (chart.vargas ?? {})
    const suffix = !unlocked ? ' (Platinum)' : !ready ? ' (recalculate)' : ''
    return (
      <option key={v.name} value={v.name} disabled={!unlocked || !ready}>
        {v.name} · {v.full}{suffix}
      </option>
    )
  }

  return (
    <div className={styles.charts}>
      <section className={styles.chartCard} aria-label="Birth chart">
        <div className={styles.chartHead}>
          <span className={styles.chartLabel}>D1 · Lagna chart</span>
          <span className={styles.lagnaTag}>{RASHI_SHORT[d1Asc]} lagna</span>
        </div>
        <ChakraSelector
          ascRashi={d1Asc}
          grahas={chart.vargas?.D1 ?? chart.grahas}
          lagnas={chart.lagnas}
          arudhas={chart.arudhas}
          vargaName="D1"
          moonNakIndex={moonNakIndex}
          tithiNumber={chart.panchang?.tithi?.number}
          varaNumber={chart.panchang?.vara?.number}
          userPlan={userPlan}
          size={size}
          highlightHouses={marks.d1}
        />
      </section>
      <section className={styles.chartCard} aria-label="Divisional chart">
        <div className={styles.chartHead}>
          <select
            className={styles.vargaSelect}
            aria-label="Open a divisional chart"
            value={selected?.name ?? 'D9'}
            onChange={(e) => setVargaName(e.target.value)}
          >
            <optgroup label="Divisional charts">{core.map(option)}</optgroup>
            {extended.length > 0 && <optgroup label="Extended charts">{extended.map(option)}</optgroup>}
          </select>
          <span className={styles.lagnaTag}>
            {selectedGrahas.length ? `${RASHI_SHORT[selectedAsc]} lagna` : 'Not on this chart'}
          </span>
        </div>
        {selected && selectedGrahas.length > 0 ? (
          <ChakraSelector
            ascRashi={selectedAsc}
            grahas={selectedGrahas}
            vargaName={selected.name}
            lagnas={chart.lagnas}
            moonNakIndex={moonNakIndex}
            userPlan={userPlan}
            size={size}
            highlightHouses={marks.varga}
          />
        ) : (
          <p className={styles.emptyNote}>Recalculate the chart so this divisional chart is included.</p>
        )}
      </section>
    </div>
  )
}

function lordLabel(lord: string): string {
  if (lord in GRAHA_NAMES) return GRAHA_NAMES[lord as keyof typeof GRAHA_NAMES]
  return SIGN_LABEL[lord] ?? lord
}

function NadiTabs({
  view,
  onView,
}: {
  view: NadiView
  onView: (id: NadiView) => void
}) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})
  const listRef = useRef<HTMLDivElement | null>(null)
  const [fade, setFade] = useState({ left: false, right: false })

  const measure = useCallback(() => {
    const el = listRef.current
    if (!el) return
    const left = el.scrollLeft > 4
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 4
    setFade((prev) => (prev.left === left && prev.right === right ? prev : { left, right }))
  }, [])

  useEffect(() => {
    measure()
    const el = listRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [measure])

  const firstRun = useRef(true)
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    const list = listRef.current
    const tab = refs.current[view]
    if (!list || !tab) return
    const pad = 36
    if (tab.offsetLeft - pad < list.scrollLeft) list.scrollTo({ left: tab.offsetLeft - pad, behavior: 'smooth' })
    else if (tab.offsetLeft + tab.offsetWidth + pad > list.scrollLeft + list.clientWidth) {
      list.scrollTo({ left: tab.offsetLeft + tab.offsetWidth + pad - list.clientWidth, behavior: 'smooth' })
    }
  }, [view])

  const move = (from: number, step: number) => {
    const next = VIEWS[(from + step + VIEWS.length) % VIEWS.length]
    if (!next) return
    onView(next.id)
    refs.current[next.id]?.focus()
  }

  return (
    <div className={styles.bar}>
      <div
        ref={listRef}
        onScroll={measure}
        className={`${styles.tabs} ${fade.left ? styles.fadeLeft : ''} ${fade.right ? styles.fadeRight : ''}`}
        role="tablist"
        aria-label="Nadi readings"
      >
        {VIEWS.map((item, i) => {
          const Icon = item.icon
          const active = view === item.id
          return (
            <button
              key={item.id}
              ref={(el) => { refs.current[item.id] = el }}
              type="button"
              role="tab"
              id={`nadi-tab-${item.id}`}
              aria-selected={active}
              aria-controls="nadi-panel"
              tabIndex={active ? 0 : -1}
              title={item.hint}
              className={`${styles.tab} ${active ? styles.tabActive : ''}`}
              onClick={() => onView(item.id)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') { e.preventDefault(); move(i, 1) }
                else if (e.key === 'ArrowLeft') { e.preventDefault(); move(i, -1) }
                else if (e.key === 'Home') { e.preventDefault(); move(0, 0) }
                else if (e.key === 'End') { e.preventDefault(); move(VIEWS.length - 1, 0) }
              }}
            >
              <Icon size={14} aria-hidden />
              {item.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface Props {
  chart: ChartOutput
  userPlan?: UserPlan
}

export function NadiPanel({ chart, userPlan = 'free' }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [view, setView] = useState<NadiView>('chart')
  const [dashaSystem, setDashaSystem] = useState<DashaSystem>('vimshottari')

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const apply = (width: number) => setIsMobile(width < BREAKPOINTS.lg)
    apply(el.getBoundingClientRect().width)
    const ro = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width
      if (typeof width === 'number') apply(width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const reading = useMemo(() => readNadiChart(chart), [chart])
  const period = useMemo(() => {
    const path = getDashaPathAt(chart.dashas?.vimshottari ?? [])
    return path.length > 0 ? path.map((node) => lordLabel(node.lord)).join(' · ') : null
  }, [chart])
  const nodes = useMemo(() => chart.dashas[dashaSystem] ?? [], [chart, dashaSystem])
  const running = useMemo(() => getDashaPathAt(nodes), [nodes])
  const current = VIEWS.find((item) => item.id === view) ?? VIEWS[0]

  return (
    <div ref={rootRef} className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.title}>Nadi Astrology</h1>
        <p className={styles.lede}>
          What is active on this chart: the career, the combinations, the year, and the period. Each tab opens that part.
        </p>
      </header>

      <ChartContextBar chart={chart} />
      <NadiCharts chart={chart} userPlan={userPlan} compact={isMobile} view={view} reading={reading} />
      <NadiActiveBrief reading={reading} period={period} />
      <NadiTabs view={view} onView={setView} />
      <p className={styles.tabHint}>{current?.hint}</p>

      <div className={styles.content} id="nadi-panel" role="tabpanel" aria-labelledby={`nadi-tab-${view}`} key={view}>
        {view === 'chart' && (
          <section className="panel" aria-label="Planetary positions">
            <div className="panel-header"><span>Planetary positions</span></div>
            <div className={styles.tableBody}>
              <GrahaTable
                grahas={chart.grahas}
                vargas={chart.vargas}
                vargaLagnas={chart.vargaLagnas}
                lagnas={chart.lagnas}
                upagrahas={chart.upagrahas}
                arudhas={chart.arudhas}
              />
            </div>
          </section>
        )}

        {view === 'timing' && (
          <section className="panel" aria-label="Dasha">
            <div className="panel-header"><span>Dasha</span></div>
            <div className={styles.dashaToolbar}>
              <p className={styles.running}>
                {running.length > 0 ? (
                  <>Running now: <strong>{running.map((n) => lordLabel(n.lord)).join(' · ')}</strong></>
                ) : (
                  'No period is running in this system for the current date.'
                )}
              </p>
              <select
                className={styles.dashaSelect}
                value={dashaSystem}
                aria-label="Dasha system"
                onChange={(e) => setDashaSystem(e.target.value as DashaSystem)}
              >
                {DASHA_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className={styles.dashaBody}>
              {nodes.length > 0 ? (
                <DashaTree
                  nodes={nodes as DashaNode[]}
                  birthDate={new Date(chart.meta.birthDate)}
                  timezone={chart.meta.timezone}
                  maxDepth={dashaSystem === 'vimshottari' ? (userPlan === 'free' ? 4 : 6) : 3}
                />
              ) : (
                <p className={styles.emptyNote}>This dasha is not on the loaded chart.</p>
              )}
            </div>
          </section>
        )}

        {view !== 'chart' ? <NadiHousesSection chart={chart} view={view} reading={reading} /> : null}
      </div>
    </div>
  )
}
