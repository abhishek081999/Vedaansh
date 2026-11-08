'use client'

import React, { useEffect, useState } from 'react'
import styles from './LivePanchangTicker.module.css'
import { Spinner } from '@/components/ui/primitives/Spinner'
import { GRAHA_NAMES, type GrahaId } from '@/types/astrology'
import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import { GRAHA_HI, termHi } from '@/i18n/jyotish'
import type { PanchangApiData } from './DailyPanchangView'

interface Props {
  data: PanchangApiData | null
  loading: boolean
  locationName?: string
}

function isNow(start: string, end: string): boolean {
  const now = Date.now()
  return now >= new Date(start).getTime() && now <= new Date(end).getTime()
}

function fmtCountdown(ms: number, t: (key: 'hm' | 'ms', v: Record<string, number>) => string): string {
  const totalMin = Math.floor(ms / 60_000)
  if (totalMin >= 60) return t('hm', { h: Math.floor(totalMin / 60), m: totalMin % 60 })
  return t('ms', { m: totalMin, s: Math.floor((ms % 60_000) / 1000) })
}

export function LivePanchangTicker({ data, loading, locationName }: Props) {
  const [time, setTime] = useState(new Date())
  const t = useTranslations('panchang.ticker')
  const tw = useTranslations('panchang.windows')
  const { tag, hi } = useLang()

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  if (!data) {
    return (
      <div className={styles.tickerContainer}>
        <div className={styles.tickerContent}>
          {loading && <Spinner size={14} label={t('syncing')} />}
          <span className={styles.syncing}>{loading ? t('loading') : t('unavailable')}</span>
        </div>
      </div>
    )
  }

  const tz = data.location.tz
  const isToday = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(time) === data.date

  const currentHora = data.horaTable?.find(h => isNow(h.start, h.end))
  const currentChoghadiya =
    data.choghadiya?.day.find(slot => isNow(slot.start, slot.end)) ??
    data.choghadiya?.night.find(slot => isNow(slot.start, slot.end))
  const activeKalams = [
    { label: tw('rahu'), window: data.rahuKalam },
    { label: tw('gulika'), window: data.gulikaKalam },
    { label: tw('yamaganda'), window: data.yamaganda },
  ].filter(k => isNow(k.window.start, k.window.end))

  const nextChangeAt = [
    currentHora?.end,
    currentChoghadiya?.end,
    ...activeKalams.map(k => k.window.end),
  ]
    .filter((v): v is string => Boolean(v))
    .map(v => new Date(v).getTime())
    .sort((a, b) => a - b)[0]

  const details = [
    currentHora ? t('hora', { lord: (hi ? GRAHA_HI : GRAHA_NAMES)[currentHora.lord as GrahaId] ?? currentHora.lord }) : null,
    currentChoghadiya ? t('choghadiya', { name: hi ? termHi(currentChoghadiya.name) : currentChoghadiya.name }) : null,
  ].filter(Boolean).join(' · ')

  const clock = time.toLocaleTimeString(tag, {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
  const city = locationName?.split(',')[0].trim()

  return (
    <div className={styles.tickerContainer}>
      <div className={styles.tickerContent}>
        {isToday ? (
          <>
            <span className={styles.liveLabel}>
              <span className={styles.liveDot} aria-hidden />
              {t('live')}
            </span>
            <span className={`${styles.statusPill} ${activeKalams.length > 0 ? styles.statusBad : styles.statusClear}`}>
              {activeKalams.length > 0 ? activeKalams.map(k => k.label).join(' · ') : t('noKalam')}
            </span>
            {details && <span className={styles.details}>{details}</span>}
            {nextChangeAt && (
              <span className={styles.nextChange}>
                {t('changesIn', { time: fmtCountdown(Math.max(0, nextChangeAt - time.getTime()), t) })}
              </span>
            )}
          </>
        ) : (
          <span className={styles.details}>
            {t('showing', { date: new Date(data.date + 'T12:00:00Z').toLocaleDateString(tag, { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' }) })}
          </span>
        )}

        <div className={styles.locationInfo}>
          <span className={styles.timeValue}>{clock}</span>
          {city && <span className={styles.city}>{city}</span>}
        </div>
      </div>
    </div>
  )
}
