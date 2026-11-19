'use client'
// Life timeline 1–120: cycle planet spans, maturity ages, year tone.
// Gold only (Free sees a short teaser).

import React, { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import type { UserPlan } from '@/types/astrology'
import { useLang } from '@/i18n/useLang'
import { TimelineBand, type BandSegment } from '@/components/ui/viz'
import {
  LK_CYCLE, lkCycleAt, lkGrahaName, lkTimeline,
  type LalKitabReading,
} from '@/lib/engine/lalKitab'
import { LalKitabGate } from './LalKitabGate'
import styles from './LalKitab.module.css'

const TONE_COLOR = {
  good: 'var(--teal)',
  mixed: 'var(--amber)',
  hard: 'var(--rose)',
} as const

const CYCLE_COLORS: Record<string, string> = {
  Sa: '#6b7280', Ra: '#7c3aed', Ke: '#a16207', Ju: '#ca8a04', Su: '#ea580c',
  Mo: '#64748b', Ve: '#db2777', Ma: '#dc2626', Me: '#059669',
}

function yearStart(y: number): number {
  return Date.UTC(y, 0, 1)
}

export function LalKitabTimeline({
  reading, userPlan, currentYear,
}: {
  reading: LalKitabReading
  userPlan: UserPlan
  currentYear: number
}) {
  const t = useTranslations('lalKitab.timeline')
  const { lang } = useLang()

  const segments = useMemo((): BandSegment[] => {
    const name = (id: Parameters<typeof lkGrahaName>[0]) => lkGrahaName(id, lang)
    const tl = lkTimeline(reading.teva)
    const segs: BandSegment[] = []

    let y = 1
    while (y <= 120) {
      const at = lkCycleAt(y)
      const end = Math.min(120, y + at.yearsLeft - 1)
      segs.push({
        key: `c-${y}-${at.planet}`,
        start: yearStart(y),
        end: yearStart(end + 1),
        lane: 0,
        color: CYCLE_COLORS[at.planet] ?? 'var(--gold)',
        label: name(at.planet),
        title: `${name(at.planet)} · ${y}–${end}`,
        emphasis: currentYear >= y && currentYear <= end,
      })
      y = end + 1
    }

    for (const row of tl) {
      if (!row.maturity.length) continue
      segs.push({
        key: `m-${row.yearOfLife}`,
        start: yearStart(row.yearOfLife),
        end: yearStart(row.yearOfLife + 1),
        lane: 1,
        color: 'var(--gold)',
        label: row.maturity.map(name).join(', '),
        title: row.maturity.map((p) => t('maturity', { planet: name(p) })).join(' · '),
        emphasis: row.yearOfLife === currentYear,
      })
    }

    let runStart = tl[0]!.yearOfLife
    let runTone = tl[0]!.tone
    for (let i = 1; i < tl.length; i++) {
      if (tl[i]!.tone !== runTone) {
        segs.push({
          key: `t-${runStart}-${tl[i - 1]!.yearOfLife}`,
          start: yearStart(runStart),
          end: yearStart(tl[i]!.yearOfLife),
          lane: 2,
          color: TONE_COLOR[runTone],
          label: t(`tone.${runTone}`),
          title: `${t(`tone.${runTone}`)} · ${runStart}–${tl[i - 1]!.yearOfLife}`,
        })
        runStart = tl[i]!.yearOfLife
        runTone = tl[i]!.tone
      }
    }
    segs.push({
      key: `t-${runStart}-120`,
      start: yearStart(runStart),
      end: yearStart(121),
      lane: 2,
      color: TONE_COLOR[runTone],
      label: t(`tone.${runTone}`),
      title: `${t(`tone.${runTone}`)} · ${runStart}–120`,
    })

    return segs
  }, [reading.teva, currentYear, lang, t])

  const full = (
    <div className={styles.stack}>
      <p className={styles.note}>{t('now', { year: currentYear })}</p>
      <div className={styles.card}>
        <TimelineBand
          segments={segments}
          laneLabels={[t('cycleLane'), t('maturityLane'), t('toneLane')]}
          from={yearStart(1)}
          to={yearStart(121)}
          now={yearStart(currentYear) + 180 * 86_400_000}
          ticks={10}
          tickFormat={(ms) => String(new Date(ms).getUTCFullYear())}
          ariaLabel={t('aria')}
        />
      </div>
      <ul className={styles.list}>
        {LK_CYCLE.map((s) => (
          <li key={s.planet} className={styles.listRow}>
            <span>{lkGrahaName(s.planet, lang)}</span>
            <span className={styles.num}>{s.years}</span>
          </li>
        ))}
      </ul>
    </div>
  )

  return (
    <div className={styles.stack}>
      <header>
        <h2 className={styles.cardTitle}>{t('title')}</h2>
        <p className={styles.note}>{t('lede')}</p>
      </header>
      <LalKitabGate
        userPlan={userPlan}
        full={full}
        teaser={<p className={styles.note}>{t('teaser')}</p>}
      />
    </div>
  )
}
