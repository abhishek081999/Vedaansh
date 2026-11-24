'use client'
// 43-day remedy tracker (Gold+). Start from a recommended upay and tick
// each calendar day; only today can be ticked, and a missed day forces
// a restart. The server works out "today" and enforces the same rule.

import React, { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { ChartOutput, UserPlan } from '@/types/astrology'
import { useLang } from '@/i18n/useLang'
import { lkChartKey, lkGrahaName, lkUpayText, type LalKitabReading, type LkGraha } from '@/lib/engine/lalKitab'
import { LalKitabGate, useGold } from './LalKitabGate'
import styles from './LalKitab.module.css'

interface TrackerRow {
  _id: string
  upayId: string
  planet: string
  startedAt: string
  days: boolean[]
  status: 'active' | 'completed' | 'abandoned'
  chartKey: string
  todayIndex: number
  missed: boolean
  over: boolean
  canTick: boolean
}

function browserTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return undefined
  }
}

export function LalKitabTracker({
  chart, reading, userPlan,
}: {
  chart: ChartOutput
  reading: LalKitabReading
  userPlan: UserPlan
}) {
  const t = useTranslations('lalKitab.tracker')
  const { lang } = useLang()
  const gold = useGold(userPlan)
  const chartKey = lkChartKey(chart.meta)
  const [rows, setRows] = useState<TrackerRow[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!gold) return
    setError(null)
    try {
      const res = await fetch(`/api/lal-kitab/remedies?chartKey=${encodeURIComponent(chartKey)}`)
      const data = await res.json()
      if (!data.success) {
        setError(data.error || t('loadFail'))
        return
      }
      setRows(data.remedies ?? [])
    } catch {
      setError(t('loadFail'))
    }
  }, [gold, chartKey, t])

  useEffect(() => { void load() }, [load])

  async function start(upayId: string, planet: LkGraha) {
    // The server keeps one running remedy per planet: starting this one
    // ends the other. Say so first, with how far the other has got.
    const running = rows.find((r) => r.status === 'active' && r.planet === planet && r.upayId !== upayId)
    if (running) {
      const ok = window.confirm(t('replaceConfirm', {
        planet: lkGrahaName(planet, lang),
        done: running.days.filter(Boolean).length,
        total: running.days.length,
      }))
      if (!ok) return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/lal-kitab/remedies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chartKey, upayId, timeZone: browserTimeZone() }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error || t('startFail'))
        return
      }
      await load()
    } catch {
      setError(t('startFail'))
    } finally {
      setBusy(false)
    }
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/lal-kitab/remedies/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error || t('updateFail'))
        if (data.mustRestart) await load()
        return
      }
      await load()
    } catch {
      setError(t('updateFail'))
    } finally {
      setBusy(false)
    }
  }

  const active = rows.filter((r) => r.status === 'active' || r.status === 'completed')
  const starters = reading.remedies.top.slice(0, 5)

  const full = (
    <div className={styles.stack}>
      {error && <p className={styles.empty} role="alert">{error}</p>}

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>{t('activeTitle')}</h3>
        {active.length === 0 ? (
          <p className={styles.note}>{t('noneActive')}</p>
        ) : active.map((r) => {
          const done = r.days.filter(Boolean).length
          const upayText = lkUpayText(r.upayId, lang) ?? t('unknownRemedy')
          return (
            <article key={r._id} className={styles.mini}>
              <h4 className={styles.miniTitle}>
                {lkGrahaName(r.planet as Parameters<typeof lkGrahaName>[0], lang)} · {t('dayProgress', { done, total: r.days.length })}
              </h4>
              <p className={styles.miniText}>{upayText}</p>
              {r.status === 'completed' ? <p className={styles.note}>{t('completed')}</p>
                : r.missed ? <p className={styles.empty} role="alert">{t('missed')}</p>
                  : <p className={styles.note}>{r.days[r.todayIndex] ? t('todayDone') : t('todayOpen', { n: r.todayIndex + 1 })}</p>}
              <div className={styles.dayGrid} role="group" aria-label={t('daysLabel')}>
                {r.days.map((ok, i) => {
                  const isToday = i === r.todayIndex && !r.over
                  const lost = !ok && i < r.todayIndex
                  const cls = [styles.dayCell, ok ? styles.dayDone : '', isToday ? styles.dayToday : '', lost ? styles.dayMissed : ''].filter(Boolean).join(' ')
                  return (
                    <button
                      key={i}
                      type="button"
                      className={cls}
                      disabled={busy || !isToday || r.missed}
                      aria-pressed={ok}
                      aria-current={isToday ? 'date' : undefined}
                      aria-label={t(lost ? 'dayMissedN' : 'dayN', { n: i + 1 })}
                      onClick={() => void patch(r._id, { action: ok ? 'untick' : 'tick', dayIndex: i })}
                    >
                      {i + 1}
                    </button>
                  )
                })}
              </div>
              <div className={styles.cardHead}>
                <button type="button" className={styles.segBtn} disabled={busy} onClick={() => void patch(r._id, { action: 'restart' })}>
                  {t('restart')}
                </button>
                <button type="button" className={styles.segBtn} disabled={busy} onClick={() => void patch(r._id, { action: 'abandon' })}>
                  {t('abandon')}
                </button>
              </div>
            </article>
          )
        })}
      </section>

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>{t('startTitle')}</h3>
        <p className={styles.note}>{t('startLede')}</p>
        {starters.length === 0 ? (
          <p className={styles.empty}>{t('noStarters')}</p>
        ) : (
          <ul className={styles.list}>
            {starters.map((c) => (
              <li key={c.upay.id} className={styles.listRow}>
                <span>{lkGrahaName(c.planet, lang)}: {c.upay.text}</span>
                <button
                  type="button"
                  className={styles.segBtn}
                  disabled={busy || active.some((a) => a.upayId === c.upay.id)}
                  onClick={() => void start(c.upay.id, c.planet)}
                >
                  {t('start')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className={styles.note}>{t('rules')}</p>
    </div>
  )

  return (
    <div className={styles.stack}>
      <header>
        <h2 className={styles.cardTitle}>{t('title')}</h2>
        <p className={styles.note}>{t('lede')}</p>
      </header>
      <LalKitabGate userPlan={userPlan} full={full} teaser={<p className={styles.note}>{t('teaser')}</p>} />
    </div>
  )
}
