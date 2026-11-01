'use client'

import React, { useEffect, useState } from 'react'
import styles from './LivePanchangTicker.module.css'
import { Spinner } from '@/components/ui/primitives/Spinner'
import { GRAHA_NAMES, type GrahaId } from '@/types/astrology'
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

function fmtCountdown(ms: number): string {
  const totalMin = Math.floor(ms / 60_000)
  if (totalMin >= 60) return `${Math.floor(totalMin / 60)}h ${totalMin % 60}m`
  return `${totalMin}m ${Math.floor((ms % 60_000) / 1000)}s`
}

export function LivePanchangTicker({ data, loading, locationName }: Props) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  if (!data) {
    return (
      <div className={styles.tickerContainer}>
        <div className={styles.tickerContent}>
          {loading && <Spinner size={14} label="Syncing panchang" />}
          <span className={styles.syncing}>{loading ? 'Loading panchang…' : 'Panchang unavailable'}</span>
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
    { label: 'Rahu Kalam', window: data.rahuKalam },
    { label: 'Gulika Kalam', window: data.gulikaKalam },
    { label: 'Yamaganda', window: data.yamaganda },
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
    currentHora ? `Hora ${GRAHA_NAMES[currentHora.lord as GrahaId] ?? currentHora.lord}` : null,
    currentChoghadiya ? `Choghadiya ${currentChoghadiya.name}` : null,
  ].filter(Boolean).join(' · ')

  const clock = time.toLocaleTimeString('en-IN', {
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
              Live
            </span>
            <span className={`${styles.statusPill} ${activeKalams.length > 0 ? styles.statusBad : styles.statusClear}`}>
              {activeKalams.length > 0 ? activeKalams.map(k => k.label).join(' · ') : 'No kalam active'}
            </span>
            {details && <span className={styles.details}>{details}</span>}
            {nextChangeAt && (
              <span className={styles.nextChange}>
                Changes in {fmtCountdown(Math.max(0, nextChangeAt - time.getTime()))}
              </span>
            )}
          </>
        ) : (
          <span className={styles.details}>
            Now showing {new Date(data.date + 'T12:00:00Z').toLocaleDateString('en-IN', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' })}
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
