'use client'
// ─────────────────────────────────────────────────────────────
//  src/app/panchang/calendar/page.tsx
//  Monthly Panchang Calendar
//  Shows moon phase, Tithi, Nakshatra and day tone for every day of a month
//  Fetches each day on demand, cached by Redis server-side
// ─────────────────────────────────────────────────────────────

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import { termHi } from '@/i18n/jyotish'
import { useChart } from '@/components/providers/ChartProvider'
import { LocationPicker, getSavedLocation, type LocationValue } from '@/components/ui/LocationPicker'
import { CalendarDayDetail, TONE_CLASS } from '@/components/panchang/CalendarDayDetail'
import type { PanchangApiData } from '@/components/panchang/DailyPanchangView'
import styles from '@/components/panchang/PanchangCalendar.module.css'
import { buildDayReading, type DayReading, type DayTone } from '@/lib/panchang/day-reading'
import { elongationForTithi, moonLitPath } from '@/lib/panchang/moon-phase'

type DayEntry = PanchangApiData | 'error'

/** Month and weekday names in the page language (Intl, so no tables to translate). */
function monthName(tag: string, month: number, style: 'long' | 'short' = 'long'): string {
  return new Intl.DateTimeFormat(tag, { month: style, timeZone: 'UTC' }).format(new Date(Date.UTC(2024, month, 15)))
}
function weekdayNames(tag: string): string[] {
  // 2024-01-07 was a Sunday
  return Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(tag, { weekday: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2024, 0, 7 + i))),
  )
}
const TONES: DayTone[] = ['favourable', 'mixed', 'cautious']

/** Enough to fill a month quickly without tripping the public API rate limit. */
const FETCH_CONCURRENCY = 6

/** Tithi numbers (1–30) most people look for in a monthly view; names in panchang.calendar.key. */
const KEY_TITHIS = new Set([11, 15, 26, 30])

function todayIn(tz: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date())
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function firstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

function dateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function MoonIcon({ tithiNumber, size }: { tithiNumber: number; size: number }) {
  const r = size / 2 - 0.5
  return (
    <svg className={styles.moon} width={size} height={size} viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`} aria-hidden>
      <circle r={r} className={styles.moonDark} />
      <path d={moonLitPath(elongationForTithi(tithiNumber), r)} className={styles.moonLit} />
    </svg>
  )
}

interface DayCellProps {
  day: number
  date: string
  isToday: boolean
  selected: boolean
  entry: DayEntry | undefined
  reading: DayReading | undefined
  onSelect: (date: string) => void
}

function DayCell({ day, date, isToday, selected, entry, reading, onSelect }: DayCellProps) {
  const t = useTranslations('panchang.calendar')
  const tw = useTranslations('panchang.view')
  const { tag, hi } = useLang()
  const name = (en: string) => (hi ? termHi(en) : en)
  const data = typeof entry === 'object' ? entry : null
  const dayLabel = `${day} ${monthName(tag, Number(date.slice(5, 7)) - 1)}`
  const label = data && reading
    ? t('cellLabel', { date: dayLabel, tithi: name(data.tithi.name), nak: name(data.nakshatra.name), tone: t(`tone.${reading.tone}`) })
    : dayLabel
  return (
    <button
      type="button"
      onClick={() => onSelect(date)}
      aria-pressed={selected}
      aria-label={label}
      aria-current={isToday ? 'date' : undefined}
      className={`${styles.cell} ${selected ? styles.cellSelected : ''} ${reading ? TONE_CLASS[reading.tone] : ''}`}
    >
      <span className={styles.cellTop}>
        <span className={`${styles.dayNumber} ${isToday ? styles.dayNumberToday : ''}`}>{day}</span>
        {data && <MoonIcon tithiNumber={data.tithi.number} size={18} />}
      </span>
      {data && reading && (
        <>
          <span className={`${styles.tithiName} ${KEY_TITHIS.has(data.tithi.number) ? styles.tithiKey : ''}`}>{name(data.tithi.name)}</span>
          <span className={styles.nakName}>{name(data.nakshatra.name)}</span>
          <span className={styles.cellFoot}>
            <span className={styles.toneDot} aria-hidden />
            {data.karana.isBhadra && <span className={`${styles.cellFootText} ${styles.bhadra}`}>{tw('bhadra')}</span>}
          </span>
        </>
      )}
      {!entry && (
        <>
          <span className={styles.skeleton} />
          <span className={`${styles.skeleton} ${styles.skeletonShort}`} />
        </>
      )}
      {entry === 'error' && <span className={styles.failed}>—</span>}
    </button>
  )
}

export default function MonthlyPanchangPage() {
  const t = useTranslations('panchang.calendar')
  const { lang, tag } = useLang()
  const { chart } = useChart()
  const [location, setLocation] = useState<LocationValue>(getSavedLocation)
  const today = todayIn(location.tz)

  const [year, setYear] = useState(() => Number(today.slice(0, 4)))
  const [month, setMonth] = useState(() => Number(today.slice(5, 7)) - 1)
  const [selected, setSelected] = useState(today)
  const [days, setDays] = useState<Record<string, DayEntry>>({})
  const [retryCount, setRetryCount] = useState(0)
  /** Mirrors `days` so the fetch effect can skip loaded days without re-running on each result */
  const cache = useRef(new Map<string, DayEntry>())

  const locationKey = `${location.lat},${location.lng},${location.tz}`
  const totalDays = daysInMonth(year, month)
  const monthDates = useMemo(
    () => Array.from({ length: totalDays }, (_, i) => dateStr(year, month, i + 1)),
    [year, month, totalDays],
  )

  useEffect(() => {
    const controller = new AbortController()
    const pending = monthDates.filter((date) => {
      const cached = cache.current.get(`${locationKey}|${date}`)
      return !cached || cached === 'error'
    })
    const store = (date: string, entry: DayEntry) => {
      const key = `${locationKey}|${date}`
      cache.current.set(key, entry)
      setDays((prev) => ({ ...prev, [key]: entry }))
    }

    const worker = async () => {
      for (let date = pending.shift(); date; date = pending.shift()) {
        try {
          const qs = new URLSearchParams({ date, lat: String(location.lat), lng: String(location.lng), tz: location.tz })
          const res = await fetch(`/api/panchang?${qs.toString()}`, { signal: controller.signal })
          const json = await res.json()
          store(date, json.success ? json.data : 'error')
        } catch {
          if (controller.signal.aborted) return
          store(date, 'error')
        }
      }
    }
    for (let i = 0; i < FETCH_CONCURRENCY; i++) void worker()

    return () => controller.abort()
  }, [monthDates, locationKey, location.lat, location.lng, location.tz, retryCount])

  const entryFor = (date: string): DayEntry | undefined => days[`${locationKey}|${date}`]

  const readings = useMemo(() => {
    const out: Record<string, DayReading> = {}
    for (const date of monthDates) {
      const entry = days[`${locationKey}|${date}`]
      if (!entry || entry === 'error') continue
      out[date] = buildDayReading({
        tithiNumber: entry.tithi.number,
        nakshatraIndex: entry.nakshatra.index,
        nakshatraPada: entry.nakshatra.pada,
        yogaName: entry.yoga.name,
        karanaName: entry.karana.name,
        varaNumber: entry.vara.number,
        timeline: entry.timeline,
        lang,
      })
    }
    return out
  }, [days, locationKey, monthDates, lang])

  // A long tithi can hold at noon on two consecutive days, so those merge into one row
  const keyDays: Array<{ date: string; lastDay: number; name: string; tithiNumber: number }> = []
  monthDates.forEach((date, i) => {
    const entry = entryFor(date)
    if (!entry || entry === 'error' || !KEY_TITHIS.has(entry.tithi.number)) return
    const last = keyDays[keyDays.length - 1]
    if (last?.tithiNumber === entry.tithi.number && last.lastDay === i) last.lastDay = i + 1
    else keyDays.push({ date, lastDay: i + 1, name: t(`key.${entry.tithi.number}`), tithiNumber: entry.tithi.number })
  })
  const failedCount = monthDates.filter((date) => entryFor(date) === 'error').length

  function showMonth(nextYear: number, nextMonth: number) {
    setYear(nextYear)
    setMonth(nextMonth)
    const isCurrent = Number(today.slice(0, 4)) === nextYear && Number(today.slice(5, 7)) - 1 === nextMonth
    setSelected(isCurrent ? today : dateStr(nextYear, nextMonth, 1))
  }

  const isCurrentMonth = today.startsWith(dateStr(year, month, 1).slice(0, 7))
  const selectedEntry = entryFor(selected)

  return (
    <main className={styles.main}>
      <div className={styles.toolbar}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>{monthName(tag, month)} {year}</h1>
          <div className={styles.navGroup}>
            <button
              type="button"
              className={styles.navButton}
              aria-label={t('prevMonth')}
              onClick={() => (month === 0 ? showMonth(year - 1, 11) : showMonth(year, month - 1))}
            >
              <ChevronLeft size={18} aria-hidden />
            </button>
            <button
              type="button"
              className={styles.navButton}
              aria-label={t('nextMonth')}
              onClick={() => (month === 11 ? showMonth(year + 1, 0) : showMonth(year, month + 1))}
            >
              <ChevronRight size={18} aria-hidden />
            </button>
            {!isCurrentMonth && (
              <button
                type="button"
                className={styles.todayButton}
                onClick={() => showMonth(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1)}
              >
                {t('today')}
              </button>
            )}
          </div>
        </div>
        <div className={styles.locationGroup}>
          <LocationPicker
            value={location}
            onChange={setLocation}
            label=""
            birthLocation={chart ? { lat: chart.meta.latitude, lng: chart.meta.longitude, tz: chart.meta.timezone, name: chart.meta.birthPlace } : null}
          />
        </div>
      </div>

      {failedCount > 0 && (
        <div className={styles.retry} role="alert">
          <span>{t('failed', { n: failedCount })}</span>
          <button type="button" onClick={() => setRetryCount((n) => n + 1)}>{t('retry')}</button>
        </div>
      )}

      <div className={styles.layout}>
        <div className={styles.calendarColumn}>
          <div className={styles.board}>
            <div className={styles.weekdays}>
              {weekdayNames(tag).map((d) => <div key={d} className={styles.weekday}>{d}</div>)}
            </div>
            <div className={styles.grid}>
              {Array.from({ length: firstDayOfMonth(year, month) }, (_, i) => (
                <div key={`blank-${i}`} className={styles.blank} />
              ))}
              {monthDates.map((date, i) => (
                <DayCell
                  key={date}
                  day={i + 1}
                  date={date}
                  isToday={date === today}
                  selected={date === selected}
                  entry={entryFor(date)}
                  reading={readings[date]}
                  onSelect={setSelected}
                />
              ))}
            </div>
          </div>

          <ul className={styles.legend} aria-label={t('dayTone')}>
            {TONES.map((tone) => (
              <li key={tone} className={TONE_CLASS[tone]}>
                <span className={styles.toneDot} aria-hidden />
                {t(`tone.${tone}`)}
              </li>
            ))}
          </ul>

          {keyDays.length > 0 && (
            <section className={styles.keyDays}>
              <h2 className={styles.sectionTitle}>{t('keyDays')}</h2>
              <ul className={styles.keyDayList}>
                {keyDays.map(({ date, lastDay, name, tithiNumber }) => (
                  <li key={date}>
                    <button type="button" className={styles.keyDay} onClick={() => setSelected(date)}>
                      <MoonIcon tithiNumber={tithiNumber} size={18} />
                      <span className={styles.keyDayDate}>
                        {Number(date.slice(8))}{lastDay !== Number(date.slice(8)) && `–${lastDay}`} {monthName(tag, month, 'short')}
                      </span>
                      {name}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className={styles.note}>
            {t('note', { place: location.name })}
          </p>
        </div>

        <div className={styles.detailColumn}>
          {typeof selectedEntry === 'object' && readings[selected] ? (
            <CalendarDayDetail data={selectedEntry} reading={readings[selected]} />
          ) : (
            <div className={styles.detailEmpty}>
              {selectedEntry === 'error' ? t('dayError') : t('dayLoading')}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
