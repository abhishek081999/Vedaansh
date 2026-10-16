// ─────────────────────────────────────────────────────────────
//  src/components/dashboard/TransitCalendarPanel.tsx
//  Personal monthly gochar calendar (Gold+)
// ─────────────────────────────────────────────────────────────

'use client'

import React, { useEffect, useState } from 'react'
import type { ChartOutput } from '@/types/astrology'
import { BREAKPOINTS } from '@/lib/ui/breakpoints'
import type { TransitCalendarDay, TransitCalendarMonth } from '@/lib/engine/transitCalendar'

interface TransitCalendarPanelProps {
  chart: ChartOutput
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function kindColor(kind: string): string {
  if (kind === 'sade_sati_peak' || kind === 'ashtama') return 'var(--rose)'
  if (kind === 'clear') return 'transparent'
  if (kind.startsWith('sade_sati') || kind === 'kantaka') return 'var(--amber)'
  return 'var(--border-soft)'
}

function DayCell({
  day,
  isToday,
  selected,
  onSelect,
}: {
  day: TransitCalendarDay | null
  isToday: boolean
  selected: boolean
  onSelect: () => void
}) {
  if (!day) {
    return <div style={{ minHeight: 64, background: 'transparent' }} />
  }
  const accent = kindColor(day.sadeSatiKind)
  const edge = selected ? 'var(--gold)' : 'var(--border-soft)'
  const leftEdge = accent === 'transparent' ? edge : accent
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        minHeight: 64,
        textAlign: 'left',
        padding: '0.35rem 0.4rem',
        borderRadius: 8,
        borderTop: `1px solid ${edge}`,
        borderRight: `1px solid ${edge}`,
        borderBottom: `1px solid ${edge}`,
        borderLeft: `3px solid ${leftEdge}`,
        background: selected ? 'var(--gold-faint)' : isToday ? 'var(--surface-3)' : 'var(--surface-2)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--text-primary)' }}>{day.day}</span>
        {day.events.length > 0 && (
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)' }} />
        )}
      </div>
      {day.sadeSatiKind !== 'clear' && (
        <span style={{ fontSize: '0.58rem', fontWeight: 700, color: accent }}>{day.sadeSatiLabel}</span>
      )}
      {day.events[0] && (
        <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {day.events[0].label}
        </span>
      )}
    </button>
  )
}

export function TransitCalendarPanel({ chart }: TransitCalendarPanelProps) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [cal, setCal] = useState<TransitCalendarMonth | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIso, setSelectedIso] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  const moonRashi = chart.grahas.find(g => g.id === 'Mo')?.rashi
  const ascRashi = chart.lagnas.ascRashi

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < BREAKPOINTS.lg)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (!moonRashi) {
      setError('Natal Moon required')
      setLoading(false)
      return
    }
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const qs = new URLSearchParams({
          ascRashi: String(ascRashi),
          moonRashi: String(moonRashi),
          year: String(year),
          month: String(month),
        })
        const res = await fetch(`/api/transit/calendar?${qs}`)
        const json = await res.json()
        if (cancelled) return
        if (!json.success) {
          setError(json.error || 'Failed to load calendar')
          setCal(null)
        } else {
          setCal(json.data)
          setSelectedIso(null)
        }
      } catch {
        if (!cancelled) setError('Failed to load calendar')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [ascRashi, moonRashi, year, month])

  const shiftMonth = (delta: number) => {
    let m = month + delta
    let y = year
    if (m < 1) { m = 12; y -= 1 }
    if (m > 12) { m = 1; y += 1 }
    setMonth(m)
    setYear(y)
  }

  const openPrint = () => {
    if (!moonRashi) return
    const qs = new URLSearchParams({
      ascRashi: String(ascRashi),
      moonRashi: String(moonRashi),
      year: String(year),
      month: String(month),
      format: 'html',
      name: chart.meta.name || 'Native',
    })
    window.open(`/api/transit/calendar?${qs}`, '_blank')
  }

  const todayIso = now.toISOString().slice(0, 10)
  const selected = cal?.days.find(d => d.dateIso === selectedIso) ?? null

  // Pad grid to week starts (Sunday)
  const firstDow = cal ? new Date(`${cal.year}-${String(cal.month).padStart(2, '0')}-01T12:00:00Z`).getUTCDay() : 0
  const cells: Array<TransitCalendarDay | null> = []
  if (cal) {
    for (let i = 0; i < firstDow; i += 1) cells.push(null)
    for (const d of cal.days) cells.push(d)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0.85rem' : '1.15rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Personal gochar month
          </div>
          <h2 style={{ margin: '0.2rem 0 0', fontFamily: 'var(--font-display)', fontSize: isMobile ? '1.3rem' : '1.65rem', color: 'var(--text-gold)' }}>
            {cal?.monthLabel ?? 'Transit Calendar'}
          </h2>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
          <button type="button" className="btn" onClick={() => shiftMonth(-1)} style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem' }}>←</button>
          <button type="button" className="btn" onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth() + 1) }} style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem' }}>Today</button>
          <button type="button" className="btn" onClick={() => shiftMonth(1)} style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem' }}>→</button>
          <button type="button" className="btn btn-primary" onClick={openPrint} style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
            Print / HTML
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-gold)', fontStyle: 'italic' }}>
          Building month…
        </div>
      )}
      {error && <div className="card" style={{ padding: '1rem', color: 'var(--rose)' }}>{error}</div>}

      {!loading && cal && (
        <>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{cal.summary}</p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
              gap: isMobile ? '0.3rem' : '0.4rem',
            }}
          >
            {WEEKDAYS.map(w => (
              <div key={w} style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textAlign: 'center', padding: '0.2rem' }}>
                {w}
              </div>
            ))}
            {cells.map((day, i) => (
              <DayCell
                key={day?.dateIso ?? `pad-${i}`}
                day={day}
                isToday={day?.dateIso === todayIso}
                selected={day?.dateIso === selectedIso}
                onSelect={() => day && setSelectedIso(day.dateIso)}
              />
            ))}
          </div>

          {selected && (
            <div className="card" style={{ padding: '1rem' }}>
              <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                {selected.dateIso} · {selected.sadeSatiLabel}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.55rem' }}>
                {selected.majorSnippet}
              </div>
              {selected.events.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No major ingress/retro events this day.</div>
              ) : (
                <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  {selected.events.map((e, idx) => (
                    <li key={`${e.planetId}-${e.type}-${idx}`}>{e.label}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Amber/rose day marks = Saturn–Moon stress (Sade Sati / Kantaka / Ashtama). Gold dot = major transit event.
            Full chart PDF (Gold+) also includes a Gochar chapter.
          </div>
        </>
      )}
    </div>
  )
}
