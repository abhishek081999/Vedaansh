'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/dashboard/MoonTransitPanel.tsx
//  Moon over natal grahas / lagnas / upagrahas — 72h + 27d
// ─────────────────────────────────────────────────────────────

import { Link } from '@/i18n/navigation'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import type { ChartOutput } from '@/types/astrology'
import { moonLitPath } from '@/lib/panchang/moon-phase'
import {
  buildMoonTransitFromCharts,
  type MoonContact,
  type MoonContactTone,
  type MoonTransitReport,
} from '@/lib/engine/moonTransitAnalysis'
import styles from './moon-transit.module.css'

interface MoonTransitPanelProps {
  natalChart: ChartOutput
  /** Optional precomputed transit chart (scrubber). If omitted, fetches "now". */
  transitChart?: ChartOutput | null
  /** Compact embed without cycle grid. */
  compact?: boolean
  className?: string
}

function toneClass(tone: MoonContactTone): string {
  if (tone === 'supportive') return styles.rowSupportive
  if (tone === 'pressure') return styles.rowPressure
  return styles.rowMixed
}

function toneTextClass(tone: MoonContactTone): string {
  if (tone === 'supportive') return styles.toneSupportive
  if (tone === 'pressure') return styles.tonePressure
  return styles.toneMixed
}

function fmtWhen(iso: string, tz: string): string {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: tz,
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(iso))
  } catch {
    return new Date(iso).toLocaleString('en-IN')
  }
}

function normalizeTime(t: string): string {
  const parts = t.split(':')
  if (parts.length >= 3) return t
  if (parts.length === 2) return `${t}:00`
  return `${t}:00:00`
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

function MoonDisc({ elongation }: { elongation: number }) {
  const r = 26
  const lit = moonLitPath(elongation, r)
  return (
    <div className={styles.art} aria-hidden>
      <svg viewBox="0 0 100 100" role="presentation">
        <circle className={styles.orbit} cx="50" cy="50" r="46" />
        <circle className={styles.orbit} cx="50" cy="50" r="38" />
        <g transform="translate(50 50)">
          <circle cx="0" cy="0" r={r} className={styles.moonDark} />
          <path d={lit} className={styles.moonLit} />
          <circle cx="0" cy="0" r={r} className={styles.moonEdge} />
        </g>
      </svg>
    </div>
  )
}

function ContactRow({ c, tz }: { c: MoonContact; tz: string }) {
  return (
    <li className={`${styles.row} ${toneClass(c.tone)}`}>
      <span className={styles.kind}>{c.kind}</span>
      <div className={styles.rowMain}>
        <p className={styles.rowLabel}>
          {c.label}
          <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}> · H{c.natalHouse}</span>
        </p>
        <p className={styles.rowMeta}>
          {c.code}
          {c.activeNow ? ' · within 3° now' : ''}
        </p>
        <p className={styles.rowText}>{c.text}</p>
      </div>
      <div className={styles.rowWhen}>
        <div>{fmtWhen(c.atIso, tz)}</div>
        {c.activeNow ? <span className={styles.nowBadge}>Now</span> : null}
      </div>
    </li>
  )
}

export function MoonPassagesList({
  report,
  tz,
  limit,
  showText = true,
}: {
  report: MoonTransitReport
  tz: string
  limit?: number
  showText?: boolean
}) {
  const rows = limit ? report.nearTerm.slice(0, limit) : report.nearTerm
  if (rows.length === 0) {
    return <p className={styles.empty}>No exact Moon crossings in the next 72 hours.</p>
  }
  return (
    <ul className={styles.list}>
      {rows.map(c =>
        showText ? (
          <ContactRow key={`${c.key}-${c.atIso}`} c={c} tz={tz} />
        ) : (
          <li key={`${c.key}-${c.atIso}`} className={`${styles.row} ${toneClass(c.tone)}`}>
            <span className={styles.kind}>{c.kind}</span>
            <div className={styles.rowMain}>
              <p className={styles.rowLabel}>{c.label}</p>
              <p className={styles.rowMeta}>H{c.natalHouse} · {c.tone}</p>
            </div>
            <div className={styles.rowWhen}>{fmtWhen(c.atIso, tz)}</div>
          </li>
        ),
      )}
    </ul>
  )
}

export function MoonTransitPanel({
  natalChart,
  transitChart: transitProp,
  compact = false,
  className,
}: MoonTransitPanelProps) {
  const tz = natalChart.meta.timezone || 'Asia/Kolkata'
  const [transitChart, setTransitChart] = useState<ChartOutput | null>(transitProp ?? null)
  const [loading, setLoading] = useState(!transitProp)
  const [error, setError] = useState<string | null>(null)

  const fetchNow = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const now = nowInTimezone(tz)
      const res = await fetch('/api/chart/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Transit',
          birthDate: now.date,
          birthTime: normalizeTime(now.time),
          birthPlace: natalChart.meta.birthPlace,
          latitude: natalChart.meta.latitude,
          longitude: natalChart.meta.longitude,
          timezone: tz,
          settings: natalChart.meta.settings,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Calculation failed')
      setTransitChart(json.data as ChartOutput)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load Moon transit')
    } finally {
      setLoading(false)
    }
  }, [natalChart, tz])

  useEffect(() => {
    if (transitProp) {
      setTransitChart(transitProp)
      setLoading(false)
      setError(null)
      return
    }
    void fetchNow()
  }, [transitProp, fetchNow])

  const report = useMemo(() => {
    if (!transitChart) return null
    return buildMoonTransitFromCharts(natalChart, transitChart)
  }, [natalChart, transitChart])

  const elongation = useMemo(() => {
    if (!transitChart) return 0
    const mo = transitChart.grahas.find(g => g.id === 'Mo')
    const su = transitChart.grahas.find(g => g.id === 'Su')
    if (!mo || !su) return 0
    return ((mo.lonSidereal - su.lonSidereal) % 360 + 360) % 360
  }, [transitChart])

  const chandraChip =
    report?.moon.chandraQuality === 'good'
      ? styles.chipGood
      : report?.moon.chandraQuality === 'bad'
        ? styles.chipCaution
        : styles.chip

  const taraChip = report?.moon.taraIsHard ? styles.chipCaution : styles.chipGold

  if (loading && !report) {
    return <p className={styles.status}>Loading Moon passages…</p>
  }
  if (error && !report) {
    return <p className={styles.error}>{error}</p>
  }
  if (!report) {
    return <p className={styles.empty}>Moon passage data unavailable.</p>
  }

  if (compact) {
    return (
      <div className={`${styles.compact} ${className ?? ''}`}>
        <div className={styles.compactHead}>
          <h3 className={styles.sectionTitle}>Moon passages</h3>
          <Link className={styles.compactLink} href="/transit/moon">
            Open full Moon cycle →
          </Link>
        </div>
        <p className={styles.sectionHint}>
          {report.moon.rashiName} · {report.moon.nakshatraName} P{report.moon.pada} · next 72h
        </p>
        <MoonPassagesList report={report} tz={tz} limit={5} showText={false} />
      </div>
    )
  }

  return (
    <div className={`${styles.root} ${className ?? ''}`}>
      <div className={styles.hero}>
        <MoonDisc elongation={elongation} />
        <div className={styles.heroMeta}>
          <p className={styles.eyebrow}>
            <span className={styles.liveDot} aria-hidden />
            Moon passages
          </p>
          <h2 className={styles.title}>
            {report.moon.rashiName} · {report.moon.nakshatraName}
          </h2>
          <div className={styles.chips}>
            <span className={styles.chip}>Pada {report.moon.pada}</span>
            <span className={styles.chip}>
              {report.moon.speedDegPerDay.toFixed(2)}°/day
            </span>
            <span className={chandraChip}>
              Chandra H{report.moon.chandraPosition} · {report.moon.chandraQuality}
            </span>
            <span className={taraChip}>
              Tara {report.moon.taraName}
            </span>
            <span className={styles.chip}>From Lagna H{report.moon.lagnaHouse}</span>
          </div>
        </div>
      </div>

      {report.activeNow.length > 0 && (
        <section className={styles.section} aria-label="Active Moon contacts">
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>Active now</h3>
            <p className={styles.sectionHint}>Within 3° of exact</p>
          </div>
          <ul className={styles.list}>
            {report.activeNow.map(c => (
              <ContactRow key={`now-${c.key}`} c={c} tz={tz} />
            ))}
          </ul>
        </section>
      )}

      <section className={styles.section} aria-label="Next 72 hours">
        <div className={styles.sectionHead}>
          <h3 className={styles.sectionTitle}>Next 72 hours</h3>
          <p className={styles.sectionHint}>Timed Moon → natal point (approx. ±15–30 min)</p>
        </div>
        <MoonPassagesList report={report} tz={tz} />
      </section>

      <section className={styles.section} aria-label="27-day Moon cycle">
        <div className={styles.sectionHead}>
          <h3 className={styles.sectionTitle}>27-day cycle</h3>
          <p className={styles.sectionHint}>Next hit of each natal graha, lagna, and upagraha</p>
        </div>
        <div className={styles.cycleGrid}>
          {report.cycle.map(c => (
            <article key={`cycle-${c.key}`} className={styles.cycleCard}>
              <p className={styles.cycleLabel}>{c.kind}</p>
              <p className={styles.cycleName}>{c.label}</p>
              <p className={styles.cycleWhen}>{fmtWhen(c.atIso, tz)}</p>
              <p className={`${styles.cycleTone} ${toneTextClass(c.tone)}`}>{c.tone}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
