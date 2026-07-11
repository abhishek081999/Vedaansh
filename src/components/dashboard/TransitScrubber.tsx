'use client'

import React, { useState, useEffect, useCallback, useMemo, useId } from 'react'
import dynamic from 'next/dynamic'
import type { ChartOutput, GrahaData, Rashi } from '@/types/astrology'
import { RASHI_SHORT } from '@/types/astrology'
import styles from './transit-scrubber.module.css'
import { TransitDetailsPanels } from './TransitDetailsPanels'
import { TransitInsightsPanels } from './TransitInsightsPanels'

const VargaSwitcher = dynamic(() => import('@/components/chakra/VargaSwitcher').then(m => m.VargaSwitcher), { ssr: false })

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

export function TransitScrubber({ natalChart, onTransitChange }: TransitScrubberProps) {
  const fieldId = useId()
  const tz = natalChart.meta.timezone || 'Asia/Kolkata'

  const [targetDate, setTargetDate] = useState(() => nowInTimezone(tz).date)
  const [targetTime, setTargetTime] = useState(() => nowInTimezone(tz).time)
  const [loading, setLoading] = useState(false)
  const [transitData, setTransitData] = useState<GrahaData[] | null>(null)
  const [transitChart, setTransitChart] = useState<ChartOutput | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  const today = useMemo(() => nowInTimezone(tz).date, [tz])
  const offsetDays = useMemo(() => daysBetween(today, targetDate), [today, targetDate])
  const sliderValue = Math.max(-365, Math.min(365, offsetDays))
  const timeSliderMinutes = timeToMinutes(targetTime)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1000)
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
      setError(e instanceof Error ? e.message : 'Calculation failed')
    } finally {
      setLoading(false)
    }
  }, [natalChart, onTransitChange, tz])

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

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* Date / time controls */}
      <section className={styles.panel}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
          <div>
            <div style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-gold)', marginBottom: '0.25rem' }}>
              Transit moment
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? '1.1rem' : '1.35rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {formatDisplayDate(targetDate)}
              <span style={{ color: 'var(--text-muted)', fontWeight: 400, margin: '0 0.35rem' }}>at</span>
              {formatDisplayTime(targetTime)}
              <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.85em', marginLeft: '0.25rem' }}>
                ({timeForInput(targetTime)})
              </span>
            </div>
          </div>
          {offsetDays !== 0 && (
            <span className={`${styles.offsetChip} ${offsetDays > 0 ? styles.offsetChipFuture : styles.offsetChipPast}`}>
              {offsetDays > 0 ? `+${offsetDays}` : offsetDays} days from today
            </span>
          )}
        </div>

        <div className={styles.datetimeRow}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor={`${fieldId}-date`}>Date</label>
            <input
              id={`${fieldId}-date`}
              type="date"
              className={styles.datetimeInput}
              value={targetDate}
              onChange={e => setTargetDate(e.target.value)}
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor={`${fieldId}-time`}>Time</label>
            <input
              id={`${fieldId}-time`}
              type="time"
              step={60}
              className={styles.datetimeInput}
              value={timeForInput(targetTime)}
              onChange={e => setTargetTime(normalizeTime(e.target.value))}
            />
          </div>
          <div className={`${styles.fieldGroup} ${styles.tzBadge}`}>
            <span className={styles.fieldLabel}>Timezone</span>
            <span className={styles.tzValue} title={tz}>{tz}</span>
          </div>
        </div>

        <div className={styles.scrubberBlock}>
          <span className={styles.scrubberBlockLabel}>Date scrubber</span>
          <div className={styles.scrubberRow}>
            <div className={styles.stepGroup}>
              <button type="button" onClick={() => shiftMonths(-1)} className={`btn btn-ghost ${styles.stepBtn}`}>-1 Month</button>
              <button type="button" onClick={() => shiftDays(-1)} className={`btn btn-ghost ${styles.stepBtn}`}>-1 Day</button>
              <button type="button" onClick={() => shiftDays(1)} className={`btn btn-ghost ${styles.stepBtn}`}>+1 Day</button>
              <button type="button" onClick={() => shiftMonths(1)} className={`btn btn-ghost ${styles.stepBtn}`}>+1 Month</button>
            </div>

            <div className={styles.sliderWrap}>
              <input
                type="range"
                className={styles.rangeInput}
                min={-365}
                max={365}
                value={sliderValue}
                onChange={e => handleSlider(parseInt(e.target.value, 10))}
                aria-label="Shift transit date relative to today"
              />
              <div className={styles.rangeLabels}>
                <span>-1 Year</span>
                <span>Today</span>
                <span>+1 Year</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.scrubberDivider} />

        <div className={styles.scrubberBlock}>
          <span className={styles.scrubberBlockLabel}>24-hour time scrubber</span>
          <div className={styles.timeScrubberRow}>
            <div className={styles.stepGroup}>
              <button type="button" onClick={() => shiftHours(-1)} className={`btn btn-ghost ${styles.stepBtn}`}>-1 Hour</button>
              <button type="button" onClick={() => shiftTimeMinutes(-15)} className={`btn btn-ghost ${styles.stepBtn}`}>-15 min</button>
              <button type="button" onClick={() => shiftTimeMinutes(15)} className={`btn btn-ghost ${styles.stepBtn}`}>+15 min</button>
              <button type="button" onClick={() => shiftHours(1)} className={`btn btn-ghost ${styles.stepBtn}`}>+1 Hour</button>
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
                aria-label="Scrub time through the day"
              />
              <div className={styles.rangeLabels}>
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>23:59</span>
              </div>
            </div>

            <button type="button" onClick={resetToNow} className={`btn btn-primary ${styles.nowBtn}`}>
              Now
            </button>
          </div>
        </div>

        {loading && (
          <div className={styles.loadingRow}>
            <span className="spin-loader" style={{ width: 14, height: 14, borderWidth: 2 }} />
            Calculating transits…
          </div>
        )}
        {error && (
          <p role="alert" style={{ margin: 0, fontSize: '0.82rem', color: 'var(--rose)', textAlign: 'center' }}>{error}</p>
        )}
      </section>

      {/* Chart */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
        <div style={{ maxWidth: 700, width: '100%' }}>
          <VargaSwitcher
            vargas={natalChart.vargas}
            vargaLagnas={natalChart.vargaLagnas ?? {}}
            ascRashi={natalChart.lagnas.ascRashi}
            lagnas={natalChart.lagnas}
            arudhas={natalChart.arudhas}
            transitGrahas={transitData ?? undefined}
            chart={natalChart}
            size={isMobile ? (typeof window !== 'undefined' ? window.innerWidth - 40 : 360) : 600}
            direction="column"
          />
        </div>
      </section>

      <TransitDetailsPanels
        natalChart={natalChart}
        transitChart={transitChart}
        targetDate={targetDate}
        targetTime={targetTime}
        timezone={tz}
        formatDisplayDate={formatDisplayDate}
        formatDisplayTime={formatDisplayTime}
        timeForInput={timeForInput}
      />

      <TransitInsightsPanels natalChart={natalChart} transitChart={transitChart} />

      {/* House overlay */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '1.25rem' }}>
        <div className="card" style={{ padding: isMobile ? '1.25rem' : '1.75rem' }}>
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1.05rem', color: 'var(--text-gold)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
            Transit–natal overlay
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '0.5rem' }}>
            {Array.from({ length: 12 }, (_, i) => {
              const house = i + 1
              const natalAscRashi = natalChart.lagnas.ascRashi
              const houseRashi = (((natalAscRashi - 1 + house - 1) % 12) + 1) as Rashi
              const planets = transitData?.filter(g => g.rashi === houseRashi) || []
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
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text-muted)' }}>H{house}</span>
                    <span style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-gold)' }}>{RASHI_SHORT[houseRashi]}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                    {planets.map(p => (
                      <span key={p.id} className="badge badge-accent" style={{ fontSize: '0.68rem', padding: '0.08rem 0.35rem' }}>
                        {p.id}{p.isRetro ? ' ℞' : ''}
                      </span>
                    ))}
                    {planets.length === 0 && (
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
        Slow movers (Saturn, Jupiter, Rahu/Ketu) often mark 1.5–2.5 year shifts when they change houses. Use exact time for Moon and ascendant-sensitive transits.
      </p>
    </div>
  )
}
