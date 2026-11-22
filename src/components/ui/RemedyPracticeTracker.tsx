'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/RemedyPracticeTracker.tsx
//  Track a planetary remedy (Gold+): a daily beej-mantra japa or a
//  weekly fast on the planet's weekday. Only today's practice day can
//  be ticked and a missed one forces a restart; the server works out
//  "today" in the tracker's time zone and enforces the same rule.
// ─────────────────────────────────────────────────────────────

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { ChartOutput, UserPlan } from '@/types/astrology'
import { useLang } from '@/i18n/useLang'
import { PlanGate } from '@/components/ui/patterns/PlanGate'
import { planMeetsUiGate } from '@/lib/ui/planGate'
import { lkChartKey } from '@/lib/engine/lalKitab/chartKey'
import type { RemedyGrahaId } from '@/lib/engine/planetaryRemedies'
import { describePractice, getRemedyPractice, practiceGrahaName, remedyPracticesFor } from '@/lib/engine/remedyPractices'

interface PracticeRow {
  _id: string
  practiceId: string
  graha: string
  cadence: 'daily' | 'weekly'
  days: boolean[]
  status: 'active' | 'completed' | 'abandoned'
  todayIndex: number
  missed: boolean
  over: boolean
  canTick: boolean
  practiceDay: boolean
  nextDate: string | null
}

function browserTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return undefined
  }
}

const card: React.CSSProperties = {
  padding: '0.85rem',
  borderRadius: 'var(--r-md)',
  border: '1px solid var(--border-soft)',
  background: 'var(--surface-2)',
}
const small: React.CSSProperties = { fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }
const btn: React.CSSProperties = {
  fontSize: '0.7rem', padding: '0.3rem 0.6rem', borderRadius: 6, border: '1px solid var(--border)',
  background: 'var(--surface-3)', color: 'var(--text-secondary)', cursor: 'pointer',
}

interface Props {
  chart: ChartOutput
  userPlan: UserPlan
  /** Planets in remedy order (most in need first). */
  order: RemedyGrahaId[]
}

export function RemedyPracticeTracker({ chart, userPlan, order }: Props) {
  const t = useTranslations('planetsB.remedies.tracker')
  const { lang, hi } = useLang()
  const gold = planMeetsUiGate(userPlan, 'gold')
  const chartKey = lkChartKey(chart.meta)
  const [rows, setRows] = useState<PracticeRow[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [graha, setGraha] = useState<RemedyGrahaId>(order[0] ?? 'Sa')
  const [lengths, setLengths] = useState<Record<string, number>>({})

  const load = useCallback(async () => {
    if (!gold) return
    setError(null)
    try {
      const res = await fetch(`/api/remedies/practices?chartKey=${encodeURIComponent(chartKey)}`)
      const data = await res.json()
      if (!data.success) { setError(data.error || t('loadFail')); return }
      setRows(data.practices ?? [])
    } catch {
      setError(t('loadFail'))
    }
  }, [gold, chartKey, t])

  useEffect(() => { void load() }, [load])

  const send = async (url: string, method: string, body?: unknown) => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      })
      const data = await res.json()
      if (!data.success) setError(data.error || t('updateFail'))
      await load()
    } catch {
      setError(t('updateFail'))
    } finally {
      setBusy(false)
    }
  }

  const options = useMemo(() => remedyPracticesFor(graha, lang), [graha, lang])
  const running = new Set(rows.filter((r) => r.status === 'active').map((r) => r.practiceId))
  const dateFmt = (ymd: string) =>
    new Intl.DateTimeFormat(hi ? 'hi-IN' : 'en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
      .format(new Date(`${ymd}T12:00:00Z`))

  const full = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {error && <p role="alert" style={{ ...small, color: 'var(--rose)' }}>{error}</p>}

      {rows.length === 0 ? (
        <p style={small}>{t('noneActive')}</p>
      ) : rows.map((r) => {
        const def = getRemedyPractice(r.practiceId)
        if (!def) return null
        const view = describePractice(def, lang)
        const done = r.days.filter(Boolean).length
        const unit = r.cadence === 'daily' ? t('unitDay') : t('unitWeek')
        return (
          <article key={r._id} style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
              <strong style={{ fontSize: '0.85rem' }}>{view.title}</strong>
              <span style={small}>{t('progress', { done, total: r.days.length, unit })}</span>
            </div>
            {view.mantra && <div style={{ fontSize: '0.85rem', color: 'var(--text-gold)', margin: '0.35rem 0' }}>{view.mantra}</div>}
            <p style={small}>{view.how}</p>
            <p style={{ ...small, marginTop: '0.35rem', color: r.missed ? 'var(--rose)' : r.status === 'completed' ? 'var(--teal)' : 'var(--text-secondary)' }} role={r.missed ? 'alert' : undefined}>
              {r.status === 'completed'
                ? t('completed')
                : r.missed
                  ? t('missed')
                  : r.practiceDay
                    ? r.days[r.todayIndex] ? t('todayDone') : t('todayOpen')
                    : r.nextDate ? t('nextOn', { date: dateFmt(r.nextDate) }) : ''}
            </p>
            <div role="group" aria-label={t('daysLabel')} style={{ display: 'flex', flexWrap: 'wrap', gap: 4, margin: '0.5rem 0' }}>
              {r.days.map((ok, i) => {
                const isToday = r.practiceDay && i === r.todayIndex && !r.over
                const lost = !ok && i < r.todayIndex
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={busy || !isToday || r.missed}
                    aria-pressed={ok}
                    aria-current={isToday ? 'date' : undefined}
                    aria-label={t(lost ? 'missedN' : 'dayN', { n: i + 1 })}
                    onClick={() => void send(`/api/remedies/practices/${r._id}`, 'PATCH', { action: ok ? 'untick' : 'tick', dayIndex: i })}
                    style={{
                      width: 26, height: 26, borderRadius: 6, fontSize: '0.62rem',
                      border: `1px solid ${isToday ? 'var(--text-gold)' : 'var(--border-soft)'}`,
                      background: ok ? 'var(--teal)' : lost ? 'rgba(244,114,128,0.25)' : 'var(--surface-3)',
                      color: ok ? 'var(--surface-1, #000)' : 'var(--text-muted)',
                      cursor: isToday && !busy ? 'pointer' : 'default',
                    }}
                  >
                    {i + 1}
                  </button>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <button type="button" style={btn} disabled={busy} onClick={() => void send(`/api/remedies/practices/${r._id}`, 'PATCH', { action: 'restart' })}>{t('restart')}</button>
              <button type="button" style={btn} disabled={busy} onClick={() => void send(`/api/remedies/practices/${r._id}`, 'PATCH', { action: 'abandon' })}>{t('stop')}</button>
            </div>
          </article>
        )
      })}

      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
          <strong style={{ fontSize: '0.82rem' }}>{t('startTitle')}</strong>
          <select
            value={graha}
            onChange={(e) => setGraha(e.target.value as RemedyGrahaId)}
            aria-label={t('planet')}
            style={{ background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.2rem 0.4rem', fontSize: '0.75rem' }}
          >
            {order.map((g, i) => (
              <option key={g} value={g}>{practiceGrahaName(g, lang)}{i < 2 ? ` · ${t('suggested')}` : ''}</option>
            ))}
          </select>
        </div>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {options.map((o) => {
            const len = lengths[o.id] ?? o.defaultLength
            return (
              <li key={o.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-primary)' }}>{o.title}</span>
                {o.mantra && <span style={{ fontSize: '0.8rem', color: 'var(--text-gold)' }}>{o.mantra}</span>}
                <span style={small}>{o.how}</span>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <select
                    value={len}
                    onChange={(e) => setLengths((p) => ({ ...p, [o.id]: Number(e.target.value) }))}
                    aria-label={t('length')}
                    style={{ background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.2rem 0.4rem', fontSize: '0.72rem' }}
                  >
                    {o.lengths.map((n) => (
                      <option key={n} value={n}>{o.cadence === 'daily' ? t('nDays', { n }) : t('nWeeks', { n })}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    style={{ ...btn, borderColor: 'var(--text-gold)', color: 'var(--text-gold)' }}
                    disabled={busy || running.has(o.id)}
                    onClick={() => void send('/api/remedies/practices', 'POST', { chartKey, practiceId: o.id, length: len, timeZone: browserTimeZone() })}
                  >
                    {running.has(o.id) ? t('running') : t('start')}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
      <p style={small}>{t('rules')}</p>
    </div>
  )

  return (
    <section style={{ marginTop: '1.25rem' }} aria-labelledby="remedy-tracker-title">
      <h3 id="remedy-tracker-title" style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', color: 'var(--text-gold)', fontFamily: 'var(--font-display)' }}>
        {t('title')}
      </h3>
      <p style={{ ...small, marginBottom: '0.75rem' }}>{t('lede')}</p>
      {gold ? full : (
        <PlanGate userPlan={userPlan} required="gold" featureName={t('gate')}>
          <div style={{ ...card, minHeight: 120 }}><p style={small}>{t('teaser')}</p></div>
        </PlanGate>
      )}
    </section>
  )
}
