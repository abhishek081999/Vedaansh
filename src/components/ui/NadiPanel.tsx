'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/NadiPanel.tsx
//  Nadi workspace. The active reading leads; the chart stays beside it.
// ─────────────────────────────────────────────────────────────

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  BookOpen, Briefcase, CalendarRange, Coins, Gem, Grid3x3, Heart, Home, Hourglass, Orbit, Sparkles, Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ChartOutput, DashaNode, DashaSystem, GrahaId, Rashi, UserPlan } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_SHORT } from '@/types/astrology'
import { GRAHA_HI, RASHI_HI } from '@/i18n/jyotish'
import { useLang } from '@/i18n/useLang'
import { VARGA_UI_LIST } from '@/lib/engine/vargas'
import { getDashaPathAt } from '@/lib/engine/dasha/current'
import { kalachakraCaption } from '@/lib/engine/dasha/kalachakra'
import { readNadiChart } from '@/lib/engine/nadi'
import type { NadiChartReading } from '@/lib/engine/nadi'
import { ChakraSelector } from '@/components/chakra/ChakraSelector'
import { GrahaTable } from '@/components/ui/GrahaTable'
import { DashaTree } from '@/components/dasha/DashaTree'
import { ChartContextBar } from '@/components/ui/patterns/ChartContextBar'
import { BREAKPOINTS } from '@/lib/ui/breakpoints'
import { NadiHousesSection, type NadiReadingView } from '@/components/ui/NadiHousesSection'
import { FindingGrid, NadiActiveBrief, nadiHighlights, placementFindings } from '@/components/ui/nadiFindings'
import styles from './NadiPanel.module.css'

type NadiView = 'chart' | NadiReadingView

const VIEWS: { id: NadiView; icon: LucideIcon }[] = [
  { id: 'chart', icon: Grid3x3 },
  { id: 'houses', icon: Home },
  { id: 'life', icon: Users },
  { id: 'yogas', icon: Sparkles },
  { id: 'marriage', icon: Heart },
  { id: 'career', icon: Briefcase },
  { id: 'wealth', icon: Coins },
  { id: 'future', icon: CalendarRange },
  { id: 'timing', icon: Hourglass },
  { id: 'patel', icon: BookOpen },
  { id: 'transits', icon: Orbit },
  { id: 'remedies', icon: Gem },
]

const DASHA_OPTIONS: DashaSystem[] = [
  'vimshottari', 'yogini', 'ashtottari', 'kalachakra', 'chara', 'chara_fe', 'mandook', 'sthir',
]

const SIGN_HI: Record<string, string> = {
  Ar: 'मेष', Ta: 'वृषभ', Ge: 'मिथुन', Cn: 'कर्क',
  Le: 'सिंह', Vi: 'कन्या', Li: 'तुला', Sc: 'वृश्चिक',
  Sg: 'धनु', Cp: 'मकर', Aq: 'कुंभ', Pi: 'मीन',
}

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

function lordLabel(lord: string, hi: boolean): string {
  if (lord in GRAHA_NAMES) {
    const id = lord as GrahaId
    return hi ? GRAHA_HI[id] : GRAHA_NAMES[id]
  }
  return (hi ? SIGN_HI[lord] : undefined) ?? SIGN_LABEL[lord] ?? lord
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
  const t = useTranslations('nadi.panel')
  const { hi } = useLang()
  const divisionals = VARGA_UI_LIST.filter((v) => v.name !== 'D1')
  const [vargaName, setVargaName] = useState('D9')
  const focus = view === 'marriage' || view === 'patel' ? 'D9' : view === 'career' ? 'D10' : null
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
  const size = compact ? 220 : view === 'chart' ? 280 : 248
  const marks = nadiHighlights(view, reading, selected?.name ?? 'D9')
  const option = (v: (typeof divisionals)[number]) => {
    const unlocked = planRank(userPlan) >= tierRank(v.tier)
    const ready = v.name in (chart.vargas ?? {})
    const suffix = !unlocked ? t('platinum') : !ready ? t('recalcSuffix') : ''
    return (
      <option key={v.name} value={v.name} disabled={!unlocked || !ready}>
        {v.name} · {v.full}{suffix}
      </option>
    )
  }

  return (
    <div className={styles.charts}>
      <section className={styles.chartCard} aria-label={t('birthChart')}>
        <div className={styles.chartHead}>
          <span className={styles.chartLabel}>{t('d1')}</span>
          <span className={styles.lagnaTag}>{t('lagna', { sign: hi ? RASHI_HI[d1Asc] : RASHI_SHORT[d1Asc] })}</span>
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
      <section className={styles.chartCard} aria-label={t('divisional')}>
        <div className={styles.chartHead}>
          <select
            className={styles.vargaSelect}
            aria-label={t('openDivisional')}
            value={selected?.name ?? 'D9'}
            onChange={(e) => setVargaName(e.target.value)}
          >
            <optgroup label={t('divisionalCharts')}>{core.map(option)}</optgroup>
            {extended.length > 0 && <optgroup label={t('extendedCharts')}>{extended.map(option)}</optgroup>}
          </select>
          <span className={styles.lagnaTag}>
            {selectedGrahas.length ? t('lagna', { sign: hi ? RASHI_HI[selectedAsc] : RASHI_SHORT[selectedAsc] }) : t('notOnChart')}
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
          <p className={styles.emptyNote}>{t('recalculate')}</p>
        )}
      </section>
    </div>
  )
}

function NadiTabs({
  view,
  onView,
}: {
  view: NadiView
  onView: (id: NadiView) => void
}) {
  const t = useTranslations('nadi')
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
        aria-label={t('panel.readings')}
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
              title={t(`hints.${item.id}`)}
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
              {t(`views.${item.id}`)}
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
  const t = useTranslations('nadi.panel')
  const td = useTranslations('nadi.dashaOptions')
  const { hi, lang } = useLang()
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

  const reading = useMemo(() => readNadiChart(chart, lang), [chart, lang])
  const period = useMemo(() => {
    const path = getDashaPathAt(chart.dashas?.vimshottari ?? [])
    return path.length > 0 ? path.map((node) => lordLabel(node.lord, hi)).join(' · ') : null
  }, [chart, hi])
  const nodes = useMemo(() => chart.dashas[dashaSystem] ?? [], [chart, dashaSystem])
  const running = useMemo(() => getDashaPathAt(nodes), [nodes])
  const current = VIEWS.find((item) => item.id === view) ?? VIEWS[0]
  const th = useTranslations('nadi.hints')

  const openView = (next: NadiView) => {
    setView(next)
    requestAnimationFrame(() => {
      rootRef.current?.querySelector('#nadi-panel')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
  }

  return (
    <div ref={rootRef} className={styles.root}>
      <NadiActiveBrief reading={reading} period={period} onOpen={openView} />
      <ChartContextBar chart={chart} />
      <NadiTabs view={view} onView={openView} />
      <p className={styles.tabHint}>{current ? th(current.id) : ''}</p>

      <div className={view === 'chart' ? styles.workspaceChart : styles.workspace}>
      <div className={styles.content} id="nadi-panel" role="tabpanel" aria-labelledby={`nadi-tab-${view}`} key={view}>
        {view === 'chart' && (
          <>
          <section className="panel" aria-label={t('positions')}>
            <div className="panel-header"><span>{t('positions')}</span></div>
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
          <section className="panel" aria-label={t('housePlanetSign')}>
            <div className="panel-header"><span>{t('housePlanetSign')}</span></div>
            <div className={styles.placementBoard}>
              <p className={styles.placementNote}>{reading.placementNote}</p>
              <FindingGrid items={placementFindings(reading, hi)} />
            </div>
          </section>
          </>
        )}

        {view !== 'chart' ? <NadiHousesSection chart={chart} view={view} reading={reading} /> : null}

        {view === 'timing' && (
          <section className="panel" aria-label={t('dasha')}>
            <div className="panel-header"><span>{t('dasha')}</span></div>
            <div className={styles.dashaToolbar}>
              <p className={styles.running}>
                {running.length > 0
                  ? t('runningNow', { period: running.map((n) => lordLabel(n.lord, hi)).join(' · ') })
                  : t('noPeriod')}
              </p>
              <select
                className={styles.dashaSelect}
                value={dashaSystem}
                aria-label={t('dashaSystem')}
                onChange={(e) => setDashaSystem(e.target.value as DashaSystem)}
              >
                {DASHA_OPTIONS.map((id) => (
                  <option key={id} value={id}>{td(id)}</option>
                ))}
              </select>
            </div>
            <div className={styles.dashaBody}>
              {dashaSystem === 'kalachakra' && Number.isFinite(chart.grahas.find((g) => g.id === 'Mo')?.lonSidereal) && (
                <p className={styles.running}>{kalachakraCaption(chart.grahas.find((g) => g.id === 'Mo')!.lonSidereal)}</p>
              )}
              {nodes.length > 0 ? (
                <DashaTree
                  nodes={nodes as DashaNode[]}
                  birthDate={new Date(chart.meta.birthDate)}
                  timezone={chart.meta.timezone}
                  maxDepth={dashaSystem === 'vimshottari' ? (userPlan === 'free' ? 4 : 6) : 3}
                />
              ) : (
                <p className={styles.emptyNote}>{t('dashaMissing')}</p>
              )}
            </div>
          </section>
        )}
      </div>
      <aside className={styles.chartRail} aria-label={t('chartsRail')}>
        <NadiCharts chart={chart} userPlan={userPlan} compact={isMobile} view={view} reading={reading} />
      </aside>
      </div>
    </div>
  )
}
