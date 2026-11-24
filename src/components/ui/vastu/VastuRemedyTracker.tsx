'use client'
// ─────────────────────────────────────────────────────────────
//  Vastu remedy tracker (Gold+). A daily zone practice for 21 or
//  40 days, stored by the shared /api/remedies/practices backend.
//  Only today can be ticked; a missed day forces a restart (the
//  server enforces this in the tracker's time zone).
// ─────────────────────────────────────────────────────────────
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import type { ChartOutput } from '@/types/astrology'
import { lkChartKey } from '@/lib/engine/lalKitab/chartKey'
import {
  describePractice, getRemedyPractice, isVastuPractice, vastuPracticesFor, type VastuPracticeZone,
} from '@/lib/engine/remedyPractices'

interface PracticeRow {
  _id: string
  practiceId: string
  days: boolean[]
  status: 'active' | 'completed' | 'abandoned'
  todayIndex: number
  missed: boolean
  over: boolean
  canTick: boolean
}

const small: React.CSSProperties = { fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }
const btn: React.CSSProperties = {
  fontSize: '0.72rem', padding: '0.3rem 0.65rem', borderRadius: 7, border: '1px solid var(--border)',
  background: 'var(--surface-3)', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit',
}
const box: React.CSSProperties = { padding: '0.9rem 1rem', borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border-soft)' }

function browserTimeZone(): string | undefined {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone } catch { return undefined }
}

interface Props {
  chart: ChartOutput
  /** Zones weakest first; the first two are marked as suggested. */
  zoneOrder: VastuPracticeZone[]
  zoneScore: (zone: string) => number | undefined
  dirName: (code: string) => string
}

export function VastuRemedyTracker({ chart, zoneOrder, zoneScore, dirName }: Props) {
  const t = useTranslations('vastu.tracker')
  const lang = useLocale() === 'hi' ? 'hi' : 'en'
  const chartKey = lkChartKey(chart.meta)
  const [rows, setRows] = useState<PracticeRow[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [zone, setZone] = useState<VastuPracticeZone>(zoneOrder[0] ?? 'NE')
  const [length, setLength] = useState(21)

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch(`/api/remedies/practices?chartKey=${encodeURIComponent(chartKey)}`)
      const data = await res.json()
      if (!data.success) { setError(t('loadFail')); return }
      setRows(((data.practices ?? []) as PracticeRow[]).filter(r => isVastuPractice(r.practiceId)))
    } catch {
      setError(t('loadFail'))
    }
  }, [chartKey, t])

  useEffect(() => { void load() }, [load])

  const send = async (url: string, method: string, body?: unknown) => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
      const data = await res.json()
      if (!data.success) setError(t('updateFail'))
      await load()
    } catch {
      setError(t('updateFail'))
    } finally {
      setBusy(false)
    }
  }

  const option = useMemo(() => vastuPracticesFor([zone], lang)[0], [zone, lang])
  const running = new Set(rows.filter(r => r.status === 'active').map(r => r.practiceId))

  return (
    <section className="card" aria-labelledby="vastu-tracker-title" style={{ padding: '1.75rem' }}>
      <h3 id="vastu-tracker-title" style={{ margin: 0, color: 'var(--text-gold)', fontSize: '1.1rem', fontWeight: 600 }}>📿 {t('title')}</h3>
      <p style={{ ...small, fontSize: '0.78rem', margin: '0.3rem 0 1.1rem', maxWidth: 640 }}>{t('subtitle')}</p>

      {error && <p role="alert" style={{ ...small, color: 'var(--rose)', marginBottom: '0.75rem' }}>{error}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {rows.length === 0 && <p style={small}>{t('none')}</p>}
        {rows.map(r => {
          const def = getRemedyPractice(r.practiceId)
          if (!def) return null
          const view = describePractice(def, lang)
          const done = r.days.filter(Boolean).length
          const status = r.status === 'completed' ? t('completed') : r.missed ? t('missed') : r.days[r.todayIndex] ? t('todayDone') : t('todayOpen')
          const statusColor = r.status === 'completed' ? 'var(--teal)' : r.missed ? 'var(--rose)' : 'var(--text-secondary)'
          return (
            <article key={r._id} style={box}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                <strong style={{ fontSize: '0.88rem' }}>{view.title}</strong>
                <span style={small}>{t('progress', { done, total: r.days.length })}</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-gold)', margin: '0.35rem 0' }}>{view.mantra}</div>
              <p style={small}>{view.how}</p>
              <p role={r.missed ? 'alert' : undefined} style={{ ...small, marginTop: '0.35rem', color: statusColor }}>{status}</p>
              <div role="group" aria-label={t('daysLabel')} style={{ display: 'flex', flexWrap: 'wrap', gap: 4, margin: '0.55rem 0' }}>
                {r.days.map((ok, i) => {
                  const isToday = i === r.todayIndex && !r.over
                  const lost = !ok && i < r.todayIndex
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={busy || !isToday || r.missed || r.status !== 'active'}
                      aria-pressed={ok}
                      aria-current={isToday ? 'date' : undefined}
                      aria-label={t(lost ? 'missedN' : 'dayN', { n: i + 1 })}
                      onClick={() => void send(`/api/remedies/practices/${r._id}`, 'PATCH', { action: ok ? 'untick' : 'tick', dayIndex: i })}
                      style={{
                        width: 28, height: 28, borderRadius: 6, fontSize: '0.64rem', fontFamily: 'inherit',
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

        {/* Start a new practice */}
        <div style={box}>
          <strong style={{ fontSize: '0.85rem', display: 'block', marginBottom: '0.6rem' }}>{t('startTitle')}</strong>
          <div role="radiogroup" aria-label={t('zone')} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem' }}>
            {zoneOrder.map((z, i) => {
              const on = z === zone
              const score = zoneScore(z)
              return (
                <button key={z} type="button" role="radio" aria-checked={on} onClick={() => setZone(z)}
                  style={{ ...btn, minHeight: 32, background: on ? 'var(--gold)' : 'var(--surface-3)', color: on ? 'var(--text-on-gold)' : 'var(--text-secondary)', borderColor: on ? 'var(--gold)' : 'var(--border-soft)', fontWeight: 600 }}>
                  {dirName(z)}{score !== undefined ? ` · ${score}%` : ''}{i < 2 ? ` · ${t('suggested')}` : ''}
                </button>
              )
            })}
          </div>
          <div style={{ fontSize: '0.84rem', fontWeight: 600 }}>{option.title}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-gold)', margin: '0.3rem 0' }}>{option.mantra}</div>
          <p style={small}>{option.how}</p>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.65rem' }}>
            <select value={length} onChange={e => setLength(Number(e.target.value))} aria-label={t('length')}
              style={{ background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 7, padding: '0.3rem 0.5rem', fontSize: '0.75rem', fontFamily: 'inherit' }}>
              {option.lengths.map(n => <option key={n} value={n}>{t('nDays', { n })}</option>)}
            </select>
            <button type="button" disabled={busy || running.has(option.id)}
              onClick={() => void send('/api/remedies/practices', 'POST', { chartKey, practiceId: option.id, length, timeZone: browserTimeZone() })}
              style={{ ...btn, borderColor: 'var(--text-gold)', color: 'var(--text-gold)', fontWeight: 600 }}>
              {running.has(option.id) ? t('running') : t('start')}
            </button>
          </div>
        </div>
      </div>
      <p style={{ ...small, marginTop: '0.85rem' }}>{t('rules')}</p>
    </section>
  )
}
