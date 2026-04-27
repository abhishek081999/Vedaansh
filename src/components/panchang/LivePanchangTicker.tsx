'use client'

import React, { useEffect, useState } from 'react'
import styles from './LivePanchangTicker.module.css'
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

function fmtTime(iso: string, tz: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso))
}

export function LivePanchangTicker({ data, loading, locationName }: Props) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const currentHora = data?.horaTable?.find(h => isNow(h.start, h.end))
  const currentRahu = data ? isNow(data.rahuKalam.start, data.rahuKalam.end) : false
  const currentGulika = data ? isNow(data.gulikaKalam.start, data.gulikaKalam.end) : false
  const currentYamaganda = data ? isNow(data.yamaganda.start, data.yamaganda.end) : false
  const currentChoghadiya =
    data?.choghadiya?.day.find(slot => isNow(slot.start, slot.end)) ??
    data?.choghadiya?.night.find(slot => isNow(slot.start, slot.end))

  if (loading || !data) {
    return (
      <div className={styles.tickerContainer}>
        <div className={styles.tickerContent}>
          <div className={styles.liveIndicator}>
            <span className={styles.liveDot} />
            <span className={styles.liveText}>SYNCING...</span>
          </div>
          <div className={styles.tickerItem}>Loading celestial pulse...</div>
        </div>
      </div>
    )
  }

  const formattedTime = time.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })

  // Extract country from location name if possible
  const locationParts = locationName ? locationName.split(',') : []
  const country = locationParts.length > 0 ? locationParts[locationParts.length - 1].trim() : ''
  const city = locationParts.length > 0 ? locationParts[0].trim() : ''
  const activeWarnings = [
    currentRahu ? 'Rahu Kalam' : null,
    currentGulika ? 'Gulika Kalam' : null,
    currentYamaganda ? 'Yamaganda' : null,
  ].filter(Boolean) as string[]
  const nowRunningLabel = activeWarnings.length > 0 ? activeWarnings.join(' · ') : 'Good Time'
  const nowRunningTone = activeWarnings.length > 0 ? styles.nowRunningBad : styles.nowRunningGood
  const nextChangeCandidates = [
    currentHora?.end,
    currentChoghadiya?.end,
    currentRahu ? data.rahuKalam.end : undefined,
    currentGulika ? data.gulikaKalam.end : undefined,
    currentYamaganda ? data.yamaganda.end : undefined,
  ].filter((v): v is string => Boolean(v))
  const nextChangeAt = nextChangeCandidates.length
    ? nextChangeCandidates
      .map(v => new Date(v).getTime())
      .sort((a, b) => a - b)[0]
    : null
  const msToNextChange = nextChangeAt ? Math.max(0, nextChangeAt - time.getTime()) : null
  const nextChangeCountdown = msToNextChange != null
    ? `${Math.floor(msToNextChange / 60_000)}m ${Math.floor((msToNextChange % 60_000) / 1000)}s`
    : null
  const compactDetails = [
    currentHora ? `Hora ${currentHora.lord}` : null,
    currentChoghadiya ? `Choghadiya ${currentChoghadiya.name}` : null,
    `Tithi ${data.tithi.name}`,
  ].filter(Boolean).join(' | ')

  return (
    <div className={styles.tickerContainer}>
      <div className={styles.tickerContent}>
        <div className={styles.nowCard}>
          <div className={styles.nowMetaCompact}>
            <span className={styles.liveStatusLabel}>
              <span className={styles.liveInlineDot} />
              LIVE
            </span>
            <span className={`${styles.nowRunningPill} ${nowRunningTone}`}>{nowRunningLabel}</span>
            <span className={styles.nowDetail}>{compactDetails}</span>
            {nextChangeAt && (
              <span className={styles.nextChangeText}>
                Next {fmtTime(new Date(nextChangeAt).toISOString(), data.location.tz)}
                {nextChangeCountdown && <span className={styles.nextChangeCountdown}> (changes in {nextChangeCountdown})</span>}
              </span>
            )}
          </div>
        </div>

        <div className={styles.tickerScroll}>
          <div className={styles.tickerTrack}>
            {/* Primary Set */}
            <div className={styles.tickerItem}>
              <span className={styles.itemLabel}>Tithi:</span>
              <span className={styles.itemValue}>{data.tithi.name}</span>
            </div>
            <div className={styles.tickerDivider} />
            <div className={styles.tickerItem}>
              <span className={styles.itemLabel}>Nakshatra:</span>
              <span className={styles.itemValue}>{data.nakshatra.name}</span>
            </div>
            <div className={styles.tickerDivider} />
            <div className={styles.tickerItem}>
              <span className={styles.itemLabel}>Yoga:</span>
              <span className={styles.itemValue}>{data.yoga.name}</span>
            </div>
            <div className={styles.tickerDivider} />
            <div className={styles.tickerItem}>
              <span className={styles.itemLabel}>Karana:</span>
              <span className={styles.itemValue}>{data.karana.name}</span>
            </div>
            <div className={styles.tickerDivider} />
            <div className={styles.tickerItem}>
              <span className={styles.itemLabel}>Rashi:</span>
              <span className={styles.itemValue}>{data.moonRashi?.en}</span>
            </div>
            {currentHora && (
              <>
                <div className={styles.tickerDivider} />
                <div className={styles.tickerItem}>
                  <span className={styles.itemLabel}>Hora:</span>
                  <span className={styles.itemValue}>{currentHora.lord}</span>
                </div>
              </>
            )}

            {/* Duplicate Set for Loop */}
            <div className={styles.tickerDivider} />
            <div className={styles.tickerItem}>
              <span className={styles.itemLabel}>Tithi:</span>
              <span className={styles.itemValue}>{data.tithi.name}</span>
            </div>
            <div className={styles.tickerDivider} />
            <div className={styles.tickerItem}>
              <span className={styles.itemLabel}>Nakshatra:</span>
              <span className={styles.itemValue}>{data.nakshatra.name}</span>
            </div>
            <div className={styles.tickerDivider} />
            <div className={styles.tickerItem}>
              <span className={styles.itemLabel}>Yoga:</span>
              <span className={styles.itemValue}>{data.yoga.name}</span>
            </div>
            <div className={styles.tickerDivider} />
            <div className={styles.tickerItem}>
              <span className={styles.itemLabel}>Karana:</span>
              <span className={styles.itemValue}>{data.karana.name}</span>
            </div>
            <div className={styles.tickerDivider} />
            <div className={styles.tickerItem}>
              <span className={styles.itemLabel}>Rashi:</span>
              <span className={styles.itemValue}>{data.moonRashi?.en}</span>
            </div>
            {currentHora && (
              <>
                <div className={styles.tickerDivider} />
                <div className={styles.tickerItem}>
                  <span className={styles.itemLabel}>Hora:</span>
                  <span className={styles.itemValue}>{currentHora.lord}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className={styles.locationInfo}>
          <div className={styles.timeValue}>{formattedTime}</div>
          <div className={styles.locationValue}>
             <span className={styles.city}>{city}</span>
             {country && <span className={styles.country}>{country}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
