'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/panchang/CalendarDayDetail.tsx
//  Side panel for the day selected in the monthly calendar
// ─────────────────────────────────────────────────────────────

import Link from 'next/link'
import { limbUntil, type PanchangApiData } from '@/components/panchang/DailyPanchangView'
import type { DayReading, DayTone } from '@/lib/panchang/day-reading'
import styles from './PanchangCalendar.module.css'

export const TONE_LABEL: Record<DayTone, string> = {
  favourable: 'Favourable',
  mixed: 'Mixed',
  cautious: 'Cautious',
}

export const TONE_CLASS: Record<DayTone, string> = {
  favourable: styles.toneFavourable,
  mixed: styles.toneMixed,
  cautious: styles.toneCautious,
}

function fmtTime(iso: string, tz: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso))
}

function fmtRange(w: { start: string; end: string }, tz: string): string {
  return `${fmtTime(w.start, tz)} – ${fmtTime(w.end, tz)}`
}

export function CalendarDayDetail({ data, reading }: { data: PanchangApiData; reading: DayReading }) {
  const tz = data.location.tz
  const calendar = data.calendarContext
  const heading = new Date(data.date + 'T12:00:00Z').toLocaleDateString('en-IN', {
    timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long',
  })
  const limbs = [
    { term: 'Tithi', value: data.tithi.name, until: limbUntil(data.tithi.name, data.timeline?.tithi, data.limbEnds?.tithi, data.date, tz) },
    { term: 'Nakshatra', value: `${data.nakshatra.name}, pada ${data.nakshatra.pada}`, until: limbUntil(data.nakshatra.name, data.timeline?.nakshatra, data.limbEnds?.nakshatra, data.date, tz) },
    { term: 'Yoga', value: data.yoga.name, until: limbUntil(data.yoga.name, data.timeline?.yoga, data.limbEnds?.yoga, data.date, tz) },
    { term: 'Karana', value: data.karana.name, until: limbUntil(data.karana.name, data.timeline?.karana, null, data.date, tz) },
  ]
  const times = [
    { term: 'Sunrise', value: fmtTime(data.sunrise, tz) },
    { term: 'Sunset', value: fmtTime(data.sunset, tz) },
    ...(data.abhijitMuhurta ? [{ term: 'Abhijit', value: fmtRange(data.abhijitMuhurta, tz) }] : []),
    { term: 'Rahu Kalam', value: fmtRange(data.rahuKalam, tz) },
  ]

  return (
    <aside className={`${styles.detail} ${TONE_CLASS[reading.tone]}`} aria-live="polite">
      <header>
        <h2 className={styles.detailDate}>{heading}</h2>
        <p className={styles.detailContext}>
          {data.tithi.paksha === 'shukla' ? 'Shukla' : 'Krishna'} paksha
          {calendar && ` · ${calendar.sauraMasa} · ${calendar.rituSa}`}
        </p>
        <p className={styles.detailTone}>
          <span className={styles.toneDot} aria-hidden />
          {TONE_LABEL[reading.tone]} day
        </p>
      </header>

      <dl className={styles.detailList}>
        {limbs.map(({ term, value, until }) => (
          <div key={term} className={styles.detailLimb}>
            <dt>{term}</dt>
            <dd className={styles.detailValue}>{value}</dd>
            {until && <dd className={styles.detailUntil}>{until}</dd>}
          </div>
        ))}
      </dl>

      <dl className={styles.detailTimes}>
        {times.map(({ term, value }) => (
          <div key={term}>
            <dt>{term}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <Link href={`/panchang?date=${data.date}`} className={styles.detailLink}>
        Full panchang and predictions →
      </Link>
    </aside>
  )
}
