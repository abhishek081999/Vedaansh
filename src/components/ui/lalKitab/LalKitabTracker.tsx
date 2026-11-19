'use client'
// 43-day remedy tracker (Gold+). Start from a recommended upay, tick
// consecutive days; a miss forces restart.

import React, { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { ChartOutput, UserPlan } from '@/types/astrology'
import { useLang } from '@/i18n/useLang'
import { lkChartKey, lkGrahaName, type LalKitabReading } from '@/lib/engine/lalKitab'
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

  async function start(upayId: string) {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/lal-kitab/remedies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chartKey, upayId }),
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

  const active = rows.filter((r) => r.status === 'active')
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
          const upayText = reading.remedies.planets
            .flatMap((p) => p.remedies)
            .find((c) => c.upay.id === r.upayId)?.upay.text
            ?? starters.find((c) => c.upay.id === r.upayId)?.upay.text
            ?? r.upayId
          return (
            <article key={r._id} className={styles.mini}>
              <h4 className={styles.miniTitle}>
                {lkGrahaName(r.planet as Parameters<typeof lkGrahaName>[0], lang)} · {t('dayProgress', { done, total: r.days.length })}
              </h4>
              <p className={styles.miniText}>{upayText}</p>
              <div className={styles.dayGrid} role="group" aria-label={t('daysLabel')}>
                {r.days.map((ok, i) => (
                  <button
                    key={i}
                    type="button"
                    className={ok ? `${styles.dayCell} ${styles.dayDone}` : styles.dayCell}
                    disabled={busy}
                    aria-pressed={ok}
                    aria-label={t('dayN', { n: i + 1 })}
                    onClick={() => void patch(r._id, { action: ok ? 'untick' : 'tick', dayIndex: i })}
                  >
                    {i + 1}
                  </button>
                ))}
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
                  onClick={() => void start(c.upay.id)}
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
