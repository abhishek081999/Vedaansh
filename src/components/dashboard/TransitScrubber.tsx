'use client'

import React, { useState, useEffect, useCallback, useMemo, useId } from 'react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import type { ChartOutput, DashaNode, DashaSystem, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_SHORT } from '@/types/astrology'
import { BREAKPOINTS } from '@/lib/ui/breakpoints'
import { fromZonedTime } from 'date-fns-tz'
import { useLang } from '@/i18n/useLang'
import { GRAHA_HI, RASHI_HI } from '@/i18n/jyotish'
import { getDashaPathAt } from '@/lib/engine/dasha/current'
import styles from './transit-scrubber.module.css'
import { TransitDetailsPanels } from './TransitDetailsPanels'
import { TransitNatalWheel } from './TransitNatalWheel'
import { buildPointGroups } from './transitPoints'
import { TransitInsightsPanels } from './TransitInsightsPanels'
import { TransitNavtaraPanel } from './TransitNavtaraPanel'
import { MoonTransitPanel } from './MoonTransitPanel'
import { RashiSkyFigure, wheelRashiName, type RashiSkySlice, type SkyGrahaMark } from '@/components/home/LandingCosmicWheel'

const VargaSwitcher = dynamic(() => import('@/components/chakra/VargaSwitcher').then(m => m.VargaSwitcher), { ssr: false })
const DashaTree = dynamic(() => import('@/components/dasha/DashaTree').then(m => m.DashaTree), { ssr: false })

const TRANSIT_DASHA_SYSTEMS = [
  'vimshottari',
  'yogini',
  'chara',
  'chara_fe',
  'mandook',
  'sthir',
  'ashtottari',
  'kalachakra',
] as const satisfies readonly DashaSystem[]

const DASHA_LEVEL_KEY = ['', 'md', 'ad', 'pd', 'sd', 'prd', 'dd'] as const

const EMPTY_DASHA_NODES: DashaNode[] = []

const SKY_GRAHA_IDS = new Set<GrahaId>(['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke'])

function skyMarks(chart: ChartOutput): SkyGrahaMark[] {
  return chart.grahas
    .filter(g => SKY_GRAHA_IDS.has(g.id))
    .map(g => ({ id: g.id, longitude: g.lonSidereal, retro: g.id === 'Ke' ? false : g.isRetro }))
}

function skyFromTransit(chart: ChartOutput): RashiSkySlice {
  const moon = chart.grahas.find(g => g.id === 'Mo')
  const sun = chart.grahas.find(g => g.id === 'Su')
  const moonRashi = (moon?.rashi ?? 1) as Rashi
  const sunRashi = (sun?.rashi ?? 1) as Rashi
  const elong = moon && sun
    ? ((moon.lonSidereal - sun.lonSidereal) % 360 + 360) % 360
    : 0
  return {
    planets: skyMarks(chart),
    moonRashi: { rashi: moonRashi, sa: wheelRashiName(moonRashi) },
    sunRashi: { rashi: sunRashi, sa: wheelRashiName(sunRashi) },
    nakshatra: { name: chart.panchang.nakshatra.name },
    tithi: { name: chart.panchang.tithi.name, paksha: chart.panchang.tithi.paksha },
    lunarElongationDeg: elong,
  }
}

interface TransitScrubberProps {
  natalChart: ChartOutput
  onTransitChange: (grahas: GrahaData[] | null) => void
}

function nowInTimezone(tz: string): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date())
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? '00'
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour').replace('24', '00')}:${get('minute')}:${get('second')}`,
  }
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function daysBetween(from: string, to: string): number {
  const a = new Date(`${from}T12:00:00Z`).getTime()
  const b = new Date(`${to}T12:00:00Z`).getTime()
  return Math.round((b - a) / 86_400_000)
}

function normalizeTime(t: string): string {
  const parts = t.split(':')
  if (parts.length === 2) return `${parts[0]}:${parts[1]}:00`
  if (parts.length >= 3) return `${parts[0]}:${parts[1]}:${parts[2] ?? '00'}`
  return '12:00:00'
}

function timeForInput(t: string): string {
  const [h = '12', m = '00'] = t.split(':')
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00Z`)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

function timeToMinutes(t: string): number {
  const [h = 0, m = 0] = normalizeTime(t).split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(total: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, total))
  const h = Math.floor(clamped / 60)
  const m = clamped % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
}

function shiftMinutes(time: string, delta: number): string {
  return minutesToTime(timeToMinutes(time) + delta)
}

function formatDisplayTime(t: string): string {
  const [h = 0, m = 0] = normalizeTime(t).split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

function formatDashaEnd(value: Date | string, tz: string, tag = 'en-IN'): string {
  const d = value instanceof Date ? value : new Date(value)
  if (!Number.isFinite(d.getTime())) return '—'
  return d.toLocaleString(tag, {
    timeZone: tz,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function fmtIsoDate(dateStr: string, tag: string): string {
  if (!/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr
  const d = new Date(`${dateStr.slice(0, 10)}T12:00:00Z`)
  if (!Number.isFinite(d.getTime())) return dateStr
  return new Intl.DateTimeFormat(tag, {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  }).format(d)
}

function fmtIsoTime(t: string, tag: string): string {
  const match = t.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/)
  if (!match) return t.slice(0, 8)
  const d = new Date(Date.UTC(2020, 0, 1, Number(match[1]), Number(match[2]), Number(match[3] ?? 0)))
  return new Intl.DateTimeFormat(tag, {
    hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC',
  }).format(d)
}

export function TransitScrubber({ natalChart, onTransitChange }: TransitScrubberProps) {
  const t = useTranslations('transit.scrubber.chrome')
  const { lang, tag, hi } = useLang()
  const fieldId = useId()
  const tz = natalChart.meta.timezone || 'Asia/Kolkata'

  const [targetDate, setTargetDate] = useState(() => nowInTimezone(tz).date)
  const [targetTime, setTargetTime] = useState(() => nowInTimezone(tz).time)
  const [loading, setLoading] = useState(false)
  const [transitData, setTransitData] = useState<GrahaData[] | null>(null)
  const [transitChart, setTransitChart] = useState<ChartOutput | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [dashaSystem, setDashaSystem] = useState<DashaSystem>('vimshottari')

  const today = useMemo(() => nowInTimezone(tz).date, [tz])
  const offsetDays = useMemo(() => daysBetween(today, targetDate), [today, targetDate])
  const sliderValue = Math.max(-365, Math.min(365, offsetDays))
  const timeSliderMinutes = timeToMinutes(targetTime)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < BREAKPOINTS.lg)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const fetchTransit = useCallback(async (date: string, time: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/chart/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Transit',
          birthDate: date,
          birthTime: normalizeTime(time),
          birthPlace: natalChart.meta.birthPlace,
          latitude: natalChart.meta.latitude,
          longitude: natalChart.meta.longitude,
          timezone: tz,
          settings: natalChart.meta.settings,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setTransitChart(json.data)
      setTransitData(json.data.grahas)
      onTransitChange(json.data.grahas)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('calcFailed'))
    } finally {
      setLoading(false)
    }
  }, [natalChart, onTransitChange, t, tz])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransit(targetDate, targetTime)
    }, 400)
    return () => clearTimeout(timer)
  }, [targetDate, targetTime, fetchTransit])

  const resetToNow = () => {
    const now = nowInTimezone(tz)
    setTargetDate(now.date)
    setTargetTime(now.time)
  }

  const shiftDays = (delta: number) => {
    setTargetDate(prev => addDays(prev, delta))
  }

  const shiftMonths = (delta: number) => {
    setTargetDate(prev => addDays(prev, delta * 30))
  }

  const handleSlider = (days: number) => {
    setTargetDate(addDays(today, days))
  }

  const handleTimeSlider = (minutes: number) => {
    setTargetTime(minutesToTime(minutes))
  }

  const shiftHours = (delta: number) => {
    setTargetTime(prev => shiftMinutes(prev, delta * 60))
  }

  const shiftTimeMinutes = (delta: number) => {
    setTargetTime(prev => shiftMinutes(prev, delta))
  }

  const asOf = useMemo(() => {
    try {
      return fromZonedTime(`${targetDate}T${normalizeTime(targetTime)}`, tz)
    } catch {
      return new Date(`${targetDate}T${normalizeTime(targetTime)}`)
    }
  }, [targetDate, targetTime, tz])

  const dashaNodes = useMemo(
    () => natalChart.dashas[dashaSystem] ?? EMPTY_DASHA_NODES,
    [natalChart.dashas, dashaSystem],
  )
  const activeDashaPath = useMemo(
    () => getDashaPathAt(dashaNodes, asOf.getTime()),
    [dashaNodes, asOf],
  )
  const activeDashaDeepest = activeDashaPath[activeDashaPath.length - 1] ?? null
  const dashaSystemKey = TRANSIT_DASHA_SYSTEMS.find(s => s === dashaSystem) ?? 'vimshottari'
  const dashaSystemLabel = t(`systems.${dashaSystemKey}`)
  const showDate = (d: string) => (hi ? fmtIsoDate(d, tag) : formatDisplayDate(d))
  const showTime = (time: string) => (hi ? fmtIsoTime(time, tag) : formatDisplayTime(time))
  const levelLabel = (level: number) => {
    const key = DASHA_LEVEL_KEY[level]
    return key ? t(`levels.${key}`) : `L${level}`
  }
  const lordName = (lord: string) => {
    const id = lord as GrahaId
    return (hi ? GRAHA_HI[id] : GRAHA_NAMES[id]) ?? lord
  }

  // Transit lagnas + upagrahas for the house overlay (planets come from transitData).
  const transitExtraPoints = useMemo(() => {
    if (!transitChart) return []
    return buildPointGroups(natalChart, transitChart, lang)
      .filter(g => g.kind !== 'graha')
      .flatMap(g => g.rows)
  }, [natalChart, transitChart, lang])

  const chartSize = isMobile
    ? (typeof window !== 'undefined' ? Math.min(window.innerWidth - 32, 420) : 360)
    : 520

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      <div className={styles.workspace}>
        {/* Compact sticky controls */}
        <div className={styles.controlsCol}>
          <section className={styles.panel}>
            <div className={styles.momentHeader}>
              <div>
                <div className={styles.momentLabel}>{t('momentLabel')}</div>
                <div className={styles.momentValue}>
                  {showDate(targetDate)}
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400, margin: '0 0.3rem' }}>{t('at')}</span>
                  {showTime(targetTime)}
                </div>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '0.15rem' }} title={tz}>
                  {tz}
                </div>
              </div>
              {offsetDays !== 0 && (
                <span className={`${styles.offsetChip} ${offsetDays > 0 ? styles.offsetChipFuture : styles.offsetChipPast}`}>
                  {t('offsetDays', { n: offsetDays > 0 ? `+${offsetDays}` : String(offsetDays) })}
                </span>
              )}
            </div>

            <div className={styles.datetimeRow}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor={`${fieldId}-date`}>{t('date')}</label>
                <input
                  id={`${fieldId}-date`}
                  type="date"
                  className={styles.datetimeInput}
                  value={targetDate}
                  onChange={e => setTargetDate(e.target.value)}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor={`${fieldId}-time`}>{t('time')}</label>
                <input
                  id={`${fieldId}-time`}
                  type="time"
                  step={60}
                  className={styles.datetimeInput}
                  value={timeForInput(targetTime)}
                  onChange={e => setTargetTime(normalizeTime(e.target.value))}
                />
              </div>
              <div className={styles.nowBtnInline}>
                <button type="button" onClick={resetToNow} className={`btn btn-primary ${styles.nowBtn}`}>
                  {t('now')}
                </button>
              </div>
            </div>

            <div className={styles.scrubberBlock}>
              <span className={styles.scrubberBlockLabel}>{t('date')}</span>
              <div className={styles.scrubberRow}>
                <div className={styles.stepGroup}>
                  <button type="button" onClick={() => shiftMonths(-1)} className={`btn btn-ghost ${styles.stepBtn}`}>{t('stepMonthMinus')}</button>
                  <button type="button" onClick={() => shiftDays(-1)} className={`btn btn-ghost ${styles.stepBtn}`}>{t('stepDayMinus')}</button>
                  <button type="button" onClick={() => shiftDays(1)} className={`btn btn-ghost ${styles.stepBtn}`}>{t('stepDayPlus')}</button>
                  <button type="button" onClick={() => shiftMonths(1)} className={`btn btn-ghost ${styles.stepBtn}`}>{t('stepMonthPlus')}</button>
                </div>
                <div className={styles.sliderWrap}>
                  <input
                    type="range"
                    className={styles.rangeInput}
                    min={-365}
                    max={365}
                    value={sliderValue}
                    onChange={e => handleSlider(parseInt(e.target.value, 10))}
                    aria-label={t('ariaDateSlider')}
                  />
                  <div className={styles.rangeLabels}>
                    <span>{t('rangeYearMinus')}</span>
                    <span>{t('today')}</span>
                    <span>{t('rangeYearPlus')}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.scrubberDivider} />

            <div className={styles.scrubberBlock}>
              <span className={styles.scrubberBlockLabel}>{t('time')}</span>
              <div className={styles.timeScrubberRow}>
                <div className={styles.stepGroup}>
                  <button type="button" onClick={() => shiftHours(-1)} className={`btn btn-ghost ${styles.stepBtn}`}>{t('stepHourMinus')}</button>
                  <button type="button" onClick={() => shiftTimeMinutes(-15)} className={`btn btn-ghost ${styles.stepBtn}`}>{t('stepMinMinus')}</button>
                  <button type="button" onClick={() => shiftTimeMinutes(15)} className={`btn btn-ghost ${styles.stepBtn}`}>{t('stepMinPlus')}</button>
                  <button type="button" onClick={() => shiftHours(1)} className={`btn btn-ghost ${styles.stepBtn}`}>{t('stepHourPlus')}</button>
                </div>
                <div className={styles.timeSliderWrap}>
                  <input
                    type="range"
                    className={styles.timeRangeInput}
                    min={0}
                    max={1439}
                    step={1}
                    value={timeSliderMinutes}
                    onChange={e => handleTimeSlider(parseInt(e.target.value, 10))}
                    aria-label={t('ariaTimeSlider')}
                  />
                  <div className={styles.rangeLabels}>
                    <span>00</span>
                    <span>06</span>
                    <span>12</span>
                    <span>18</span>
                    <span>24</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.scrubberDivider} />

            <div className={styles.activeDashaBlock}>
              <div className={styles.activeDashaHeader}>
                <span className={styles.scrubberBlockLabel}>{t('activeDasha')}</span>
                <select
                  className={styles.dashaSelectCompact}
                  value={dashaSystem}
                  onChange={e => setDashaSystem(e.target.value as DashaSystem)}
                  aria-label={t('ariaDashaSystem')}
                >
                  {TRANSIT_DASHA_SYSTEMS.map(id => (
                    <option key={id} value={id}>{t(`systems.${id}`)}</option>
                  ))}
                </select>
              </div>
              {activeDashaPath.length > 0 ? (
                <>
                  <div className={styles.activeDashaPath} aria-live="polite">
                    {activeDashaPath.slice(0, 4).map((node, i) => (
                      <React.Fragment key={`${node.level}-${node.lord}-${String(node.start)}`}>
                        {i > 0 && <span className={styles.activeDashaSep} aria-hidden>/</span>}
                        <span className={styles.activeDashaChip}>
                          <span className={styles.activeDashaLevel}>
                            {levelLabel(node.level)}
                          </span>
                          {lordName(node.lord)}
                        </span>
                      </React.Fragment>
                    ))}
                  </div>
                  {activeDashaDeepest && (
                    <div className={styles.activeDashaMeta}>
                      {dashaSystemLabel}
                      <span aria-hidden> · </span>
                      {t('until', { date: formatDashaEnd(activeDashaDeepest.end, tz, hi ? tag : 'en-IN') })}
                    </div>
                  )}
                </>
              ) : (
                <p className={styles.activeDashaEmpty}>
                  {dashaNodes.length
                    ? t('noPeriod')
                    : t('recalcDashas')}
                </p>
              )}
            </div>

            {loading && (
              <div className={styles.loadingRow}>
                <span className="spin-loader" style={{ width: 12, height: 12, borderWidth: 2 }} />
                {t('calculating')}
              </div>
            )}
            {error && (
              <p role="alert" style={{ margin: 0, fontSize: '0.75rem', color: 'var(--rose)', textAlign: 'center' }}>{error}</p>
            )}
          </section>
        </div>

        {/* Chart beside controls on desktop */}
        <section className={styles.chartCol}>
          <div className={styles.skyBlock}>
            <div className={styles.momentLabel}>{t('sky')}</div>
            <RashiSkyFigure
              sky={transitChart ? skyFromTransit(transitChart) : null}
              natal={skyMarks(natalChart)}
              accent="#c9a84c"
              wheelId="transit"
              source={transitChart
                ? t('skySource', {
                    date: showDate(targetDate),
                    time: showTime(targetTime),
                    place: natalChart.meta.birthPlace || tz,
                  })
                : null}
              emptyLabel={error ? t('skyUnavailable') : t('skyReading')}
            />
          </div>
          <div style={{ width: '100%' }}>
            <VargaSwitcher
              vargas={natalChart.vargas}
              vargaLagnas={natalChart.vargaLagnas ?? {}}
              ascRashi={natalChart.lagnas.ascRashi}
              lagnas={natalChart.lagnas}
              arudhas={natalChart.arudhas}
              transitGrahas={transitData ?? undefined}
              chart={natalChart}
              size={chartSize}
              direction={isMobile ? 'column' : 'grid'}
            />
          </div>
        </section>
      </div>

      <TransitNatalWheel natalChart={natalChart} transitChart={transitChart} />

      <TransitDetailsPanels
        natalChart={natalChart}
        transitChart={transitChart}
        targetDate={targetDate}
        targetTime={targetTime}
        timezone={tz}
        asOf={asOf}
        formatDisplayDate={formatDisplayDate}
        formatDisplayTime={formatDisplayTime}
        timeForInput={timeForInput}
      />

      <section className={styles.dashaSection}>
        <div className={styles.dashaSectionHeader}>
          <div>
            <h3 className={styles.dashaSectionTitle}>{t('dashaTitle')}</h3>
            <p className={styles.dashaSectionHint}>
              {t('dashaHint', {
                system: dashaSystemLabel,
                date: showDate(targetDate),
                time: showTime(targetTime),
              })}
            </p>
          </div>
        </div>
        {dashaNodes.length > 0 ? (
          <DashaTree
            nodes={dashaNodes}
            birthDate={new Date(natalChart.meta.birthDate)}
            asOf={asOf}
            maxDepth={dashaSystem === 'vimshottari' ? 4 : 3}
          />
        ) : (
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            {t('recalcSystem')}
          </p>
        )}
      </section>

      <TransitNavtaraPanel natalChart={natalChart} transitChart={transitChart} asOf={asOf} />

      {transitChart ? (
        <section className={styles.panel}>
          <MoonTransitPanel natalChart={natalChart} transitChart={transitChart} compact />
        </section>
      ) : null}

      <TransitInsightsPanels natalChart={natalChart} transitChart={transitChart} />

      {/* House overlay */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '1.25rem' }}>
        <div className="card" style={{ padding: isMobile ? '1.25rem' : '1.75rem' }}>
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1.05rem', color: 'var(--text-gold)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
            {t('overlayTitle')}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '0.5rem' }}>
            {Array.from({ length: 12 }, (_, i) => {
              const house = i + 1
              const natalAscRashi = natalChart.lagnas.ascRashi
              const houseRashi = (((natalAscRashi - 1 + house - 1) % 12) + 1) as Rashi
              const planets = transitData?.filter(g => g.rashi === houseRashi) || []
              const points = transitExtraPoints.filter(p => p.transit?.rashi === houseRashi)
              const isLagna = house === 1

              return (
                <div
                  key={house}
                  style={{
                    padding: '0.85rem',
                    background: isLagna ? 'var(--gold-faint)' : 'var(--surface-3)',
                    borderRadius: 'var(--r-md)',
                    border: `1px solid ${isLagna ? 'var(--gold-soft)' : 'var(--border-soft)'}`,
                    minHeight: 72,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text-muted)' }}>{t('house', { n: house })}</span>
                    <span style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-gold)' }}>{hi ? RASHI_HI[houseRashi] : RASHI_SHORT[houseRashi]}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                    {planets.map(p => (
                      <span key={p.id} className="badge badge-accent" style={{ fontSize: '0.68rem', padding: '0.08rem 0.35rem' }}>
                        {p.id}{p.isRetro ? ' ℞' : ''}
                      </span>
                    ))}
                    {points.map(p => (
                      <span
                        key={p.key}
                        className="badge"
                        title={p.label}
                        style={{ fontSize: '0.62rem', padding: '0.06rem 0.3rem', color: 'var(--text-secondary)', border: '1px solid var(--border-soft)' }}
                      >
                        {p.code}
                      </span>
                    ))}
                    {planets.length === 0 && points.length === 0 && (
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', opacity: 0.45 }}>—</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <p style={{
        margin: 0,
        padding: '1rem 1.25rem',
        fontSize: '0.82rem',
        color: 'var(--text-muted)',
        background: 'var(--gold-faint)',
        border: '1px solid rgba(201, 168, 76, 0.15)',
        borderRadius: 'var(--r-lg)',
        lineHeight: 1.5,
      }}>
        {t('footnote')}
      </p>
    </div>
  )
}
