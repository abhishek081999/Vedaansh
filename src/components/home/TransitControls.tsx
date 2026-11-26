'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/home/TransitControls.tsx
//  Pinned-transit controls: step through time, pick a moment,
//  choose birthplace or current location, unpin.
//  Shared by the chart dock and the overlay chip on other tabs.
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, MapPin, RefreshCw, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import { zonedDateTime, zonedWallToDate } from '@/lib/chart/zonedNow'
import type { TransitStep, useWorkspacePin } from '@/components/home/useWorkspacePin'
import styles from './TransitControls.module.css'

export type WorkspacePins = ReturnType<typeof useWorkspacePin>

const STEPS: { step: TransitStep; short: 'stepMonth' | 'stepDay' | 'stepHour' }[] = [
  { step: 'month', short: 'stepMonth' },
  { step: 'day', short: 'stepDay' },
  { step: 'hour', short: 'stepHour' },
]

export function TransitControls({
  pins,
  natalTimeZone,
  compact = false,
}: {
  pins: WorkspacePins
  natalTimeZone: string
  /** Single-row layout for the overlay chip. */
  compact?: boolean
}) {
  const t = useTranslations('chart.workspace.dock')
  const { tag } = useLang()
  const { transit, transitLive, transitLoading } = pins
  const tz = transit?.place.kind === 'here' ? transit.place.timezone : natalTimeZone

  const wall = useMemo(() => (transit ? zonedDateTime(tz, new Date(transit.at)) : null), [transit, tz])
  const inputValue = wall ? `${wall.date}T${wall.time.slice(0, 5)}` : ''
  const [draft, setDraft] = useState(inputValue)
  useEffect(() => setDraft(inputValue), [inputValue])

  // Debounce typing in the date field: each segment edit fires onChange.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])
  const onPick = (value: string) => {
    setDraft(value)
    if (timer.current) clearTimeout(timer.current)
    const [date, time] = value.split('T')
    if (!date || !time) return
    timer.current = setTimeout(() => {
      void pins.pinTransitAt(zonedWallToDate(date, `${time}:00`, tz))
    }, 450)
  }

  const asOf = useMemo(() => {
    if (!transit) return ''
    try {
      return new Intl.DateTimeFormat(tag, {
        timeZone: tz,
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(transit.at))
    } catch {
      return new Date(transit.at).toLocaleString(tag)
    }
  }, [transit, tag, tz])

  if (!transit) return null
  const here = transit.place.kind === 'here'

  return (
    <div
      className={`${styles.wrap}${compact ? ` ${styles.compact}` : ''}`}
      role="group"
      aria-label={t('scrubAria')}
      aria-busy={transitLoading}
    >
      <div className={styles.head}>
        <span className={styles.kicker}>{t('pinTransitKicker')}</span>
        <span className={styles.asOf} aria-live="polite">
          {transitLive ? t('live') : t('asOf', { time: asOf })}
        </span>
        <button
          type="button"
          className={`${styles.stepBtn} ${styles.nowBtn}`}
          onClick={() => { void pins.pinTransit() }}
          disabled={transitLoading}
          aria-label={t('refreshTransit')}
          title={t('refreshTransit')}
        >
          <RefreshCw size={11} aria-hidden className={transitLoading ? styles.spin : undefined} />
          {t('now')}
        </button>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={pins.clearTransit}
          aria-label={t('unpinTransit')}
          title={t('unpinTransit')}
        >
          <X size={12} aria-hidden />
        </button>
      </div>

      <div className={`${styles.row} ${styles.steps}`}>
        {STEPS.map(({ step, short }) => (
          <button
            key={`back-${step}`}
            type="button"
            className={styles.stepBtn}
            onClick={() => { void pins.stepTransit(step, -1) }}
            disabled={transitLoading}
            aria-label={t(`back_${step}`)}
            title={t(`back_${step}`)}
          >
            <ChevronLeft size={11} aria-hidden />
            {t(short)}
          </button>
        ))}
        {[...STEPS].reverse().map(({ step, short }) => (
          <button
            key={`fwd-${step}`}
            type="button"
            className={styles.stepBtn}
            onClick={() => { void pins.stepTransit(step, 1) }}
            disabled={transitLoading}
            aria-label={t(`fwd_${step}`)}
            title={t(`fwd_${step}`)}
          >
            {t(short)}
            <ChevronRight size={11} aria-hidden />
          </button>
        ))}
      </div>

      <div className={styles.row}>
        <input
          type="datetime-local"
          className={styles.input}
          value={draft}
          onChange={(e) => onPick(e.target.value)}
          aria-label={t('pickMoment')}
        />
        <button
          type="button"
          className={`${styles.stepBtn}${here ? ` ${styles.on}` : ''}`}
          onClick={() => { void pins.setTransitPlace(here ? 'natal' : 'here') }}
          disabled={transitLoading}
          aria-pressed={here}
          title={here ? t('placeHereOn') : t('placeHereOff')}
        >
          <MapPin size={11} aria-hidden />
          {here ? t('placeHere') : t('placeNatal')}
        </button>
      </div>
    </div>
  )
}
