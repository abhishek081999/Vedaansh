'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/panchang/CalendarDayDetail.tsx
//  Side panel for the day selected in the monthly calendar
// ─────────────────────────────────────────────────────────────

import { Link } from '@/i18n/navigation'
import { limbUntil, type PanchangApiData } from '@/components/panchang/DailyPanchangView'
import type { DayReading, DayTone } from '@/lib/panchang/day-reading'
import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import { masaHi, termHi } from '@/i18n/jyotish'
import { useLimbUntilText } from '@/components/panchang/DailyPanchangView'
import styles from './PanchangCalendar.module.css'

export const TONE_CLASS: Record<DayTone, string> = {
  favourable: styles.toneFavourable,
  mixed: styles.toneMixed,
  cautious: styles.toneCautious,
}

function fmtTime(iso: string, tz: string, tag: string): string {
  return new Intl.DateTimeFormat(tag, {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso))
}

function fmtRange(w: { start: string; end: string }, tz: string, tag: string): string {
  return `${fmtTime(w.start, tz, tag)} – ${fmtTime(w.end, tz, tag)}`
}

export function CalendarDayDetail({ data, reading }: { data: PanchangApiData; reading: DayReading }) {
  const t = useTranslations('panchang.calendar')
  const tl = useTranslations('panchang.limbs')
  const { tag, hi } = useLang()
  const untilText = useLimbUntilText()
  const name = (en: string) => (hi ? termHi(en) : en)
  const tz = data.location.tz
  const calendar = data.calendarContext
  const heading = new Date(data.date + 'T12:00:00Z').toLocaleDateString(tag, {
    timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long',
  })
  const limbs = [
    { term: tl('tithi'), value: name(data.tithi.name), until: limbUntil(data.tithi.name, data.timeline?.tithi, data.limbEnds?.tithi, data.date, tz, untilText) },
    { term: tl('nakshatra'), value: t('pada', { nak: name(data.nakshatra.name), pada: data.nakshatra.pada }), until: limbUntil(data.nakshatra.name, data.timeline?.nakshatra, data.limbEnds?.nakshatra, data.date, tz, untilText) },
    { term: tl('yoga'), value: name(data.yoga.name), until: limbUntil(data.yoga.name, data.timeline?.yoga, data.limbEnds?.yoga, data.date, tz, untilText) },
    { term: tl('karana'), value: name(data.karana.name), until: limbUntil(data.karana.name, data.timeline?.karana, null, data.date, tz, untilText) },
  ]
  const times = [
    { term: t('sunrise'), value: fmtTime(data.sunrise, tz, tag) },
    { term: t('sunset'), value: fmtTime(data.sunset, tz, tag) },
    ...(data.abhijitMuhurta ? [{ term: t('abhijit'), value: fmtRange(data.abhijitMuhurta, tz, tag) }] : []),
    { term: t('rahu'), value: fmtRange(data.rahuKalam, tz, tag) },
  ]

  return (
    <aside className={`${styles.detail} ${TONE_CLASS[reading.tone]}`} aria-live="polite">
      <header>
        <h2 className={styles.detailDate}>{heading}</h2>
        <p className={styles.detailContext}>
          {t('pakshaLine', { paksha: name(data.tithi.paksha === 'shukla' ? 'Shukla' : 'Krishna') })}
          {calendar && ` · ${hi ? masaHi(calendar.sauraMasa) : calendar.sauraMasa} · ${name(calendar.rituSa)}`}
        </p>
        <p className={styles.detailTone}>
          <span className={styles.toneDot} aria-hidden />
          {t('toneDay', { tone: t(`tone.${reading.tone}`) })}
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
        {t('fullLink')}
      </Link>
    </aside>
  )
}
