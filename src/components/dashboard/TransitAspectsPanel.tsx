// ─────────────────────────────────────────────────────────────
//  src/components/dashboard/TransitAspectsPanel.tsx
//  Gochara aspects + double/triple transit UI
// ─────────────────────────────────────────────────────────────

'use client'

import React, { useEffect, useMemo, useState } from 'react'
import type { ChartOutput, GrahaId } from '@/types/astrology'
import { BREAKPOINTS } from '@/lib/ui/breakpoints'
import type {
  MultiTransitTone,
  MultiTransitWindow,
  TransitAspectEvent,
  TransitAspectHit,
  TransitAspectReport,
} from '@/lib/engine/transitAspects'

interface TransitAspectsPanelProps {
  chart: ChartOutput
}

function toneColor(tone: MultiTransitTone): string {
  if (tone === 'supportive') return 'var(--teal)'
  if (tone === 'caution') return 'var(--rose)'
  return 'var(--amber)'
}

function encodeNatal(chart: ChartOutput): string {
  const ids: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']
  return ids
    .map(id => {
      const g = chart.grahas.find(x => x.id === id)
      return g ? `${id}-${g.rashi}` : null
    })
    .filter(Boolean)
    .join(',')
}

function MultiCard({ w }: { w: MultiTransitWindow }) {
  const color = toneColor(w.tone)
  return (
    <div
      style={{
        border: '1px solid var(--border-soft)',
        borderLeft: `4px solid ${color}`,
        borderRadius: 10,
        padding: '0.85rem 1rem',
        background: w.isCurrent ? `${color}12` : 'var(--surface-2)',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '0.35rem', marginBottom: '0.3rem' }}>
        <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>
          {w.gradeLabel} · {w.targetLabel}
        </strong>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {w.startIso} → {w.endIso}
        </span>
      </div>
      <div style={{ fontSize: '0.78rem', color: color, fontWeight: 700, marginBottom: '0.25rem' }}>
        {w.transitLordNames.join(' + ')}
        {w.isCurrent ? ' · Active now' : ''}
      </div>
      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
        {w.summary}
      </p>
    </div>
  )
}

function HitChip({ h }: { h: TransitAspectHit }) {
  return (
    <div
      style={{
        border: '1px solid var(--border-soft)',
        borderRadius: 8,
        padding: '0.55rem 0.7rem',
        background: 'var(--surface-3)',
      }}
    >
      <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>
        {h.transitLordName} → {h.targetLabel}
      </div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
        {h.relation === 'conjunction' ? 'Conjunction' : 'Aspect'} · {h.transitSignName} · H{h.houseFromLagna}
      </div>
    </div>
  )
}

function EventRow({ ev }: { ev: TransitAspectEvent }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '88px minmax(0, 1fr)',
        gap: '0.75rem',
        padding: '0.55rem 0',
        borderBottom: '1px solid var(--border-soft)',
      }}
    >
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
        {ev.dateIso}
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>{ev.label}</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{ev.detail}</div>
      </div>
    </div>
  )
}

export function TransitAspectsPanel({ chart }: TransitAspectsPanelProps) {
  const [report, setReport] = useState<TransitAspectReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [filter, setFilter] = useState<'all' | 'multi' | 'events'>('all')

  const natal = useMemo(() => encodeNatal(chart), [chart])
  const ascRashi = chart.lagnas.ascRashi

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < BREAKPOINTS.lg)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const qs = new URLSearchParams({
          ascRashi: String(ascRashi),
          natal,
          months: '18',
        })
        const res = await fetch(`/api/transit/aspects?${qs}`)
        const json = await res.json()
        if (cancelled) return
        if (!json.success) {
          setError(json.error || 'Failed to load aspects')
          setReport(null)
        } else {
          setReport(json.data)
        }
      } catch {
        if (!cancelled) setError('Failed to load aspects')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [ascRashi, natal])

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <div
          className="spin-loader"
          style={{
            margin: '0 auto 1.5rem',
            width: 40,
            height: 40,
            border: '3px solid var(--border-soft)',
            borderTopColor: 'var(--gold)',
            borderRadius: '50%',
          }}
        />
        <div style={{ color: 'var(--text-gold)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
          Scanning gochara aspects…
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="card" style={{ padding: '1.5rem', color: 'var(--text-muted)' }}>
        {error || 'No aspect data available.'}
      </div>
    )
  }

  const upcomingMulti = report.multiWindows.filter(w => !w.isCurrent).slice(0, 8)
  const showMulti = filter === 'all' || filter === 'multi'
  const showEvents = filter === 'all' || filter === 'events'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1rem' : '1.35rem' }}>
      <div className="card" style={{ padding: isMobile ? '1rem' : '1.35rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Ju · Sa · Ra · Ke · Parashara whole-sign
            </div>
            <h2 style={{ margin: '0.25rem 0 0', fontFamily: 'var(--font-display)', fontSize: isMobile ? '1.35rem' : '1.75rem', color: 'var(--text-gold)' }}>
              Aspects & Multi-Transit
            </h2>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', background: 'var(--surface-3)', padding: 3, borderRadius: 8, border: '1px solid var(--border-soft)', height: 'fit-content' }}>
            {([
              ['all', 'All'],
              ['multi', 'Double / Triple'],
              ['events', 'Aspect starts'],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                style={{
                  padding: '0.35rem 0.7rem',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  background: filter === id ? 'var(--gold)' : 'transparent',
                  color: filter === id ? 'var(--text-on-gold)' : 'var(--text-secondary)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          {report.summary}
        </p>
        <div style={{ marginTop: '0.65rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          Window {report.windowStartIso} → {report.windowEndIso} · as of {report.asOfIso}
        </div>
      </div>

      {showMulti && (
        <>
          <section style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            <h3 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Active multi-transits
            </h3>
            {report.nowMulti.length === 0 ? (
              <div className="card" style={{ padding: '0.9rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                No double/triple transit on a natal point right now.
              </div>
            ) : (
              report.nowMulti.map(w => <MultiCard key={w.id} w={w} />)
            )}
          </section>

          {report.nowHits.length > 0 && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              <h3 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Current gochara hits
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: '0.45rem' }}>
                {report.nowHits.map(h => (
                  <HitChip key={`${h.transitLord}-${h.targetId}-${h.relation}`} h={h} />
                ))}
              </div>
            </section>
          )}

          {upcomingMulti.length > 0 && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              <h3 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Upcoming double / triple windows
              </h3>
              {upcomingMulti.map(w => <MultiCard key={w.id} w={w} />)}
            </section>
          )}
        </>
      )}

      {showEvents && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <h3 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Aspect / conjunction starts
          </h3>
          <div className="card" style={{ padding: isMobile ? '0.65rem 0.85rem' : '0.75rem 1.1rem' }}>
            {report.upcomingEvents.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', padding: '0.5rem 0' }}>
                No new aspect starts in this window.
              </div>
            ) : (
              report.upcomingEvents.map(ev => (
                <EventRow key={`${ev.dateIso}-${ev.transitLord}-${ev.targetId}-${ev.relation}`} ev={ev} />
              ))
            )}
          </div>
        </section>
      )}

      <div
        style={{
          padding: '1rem 1.15rem',
          background: 'var(--surface-2)',
          borderRadius: 'var(--r-md)',
          border: '1px dashed var(--border-soft)',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
        }}
      >
        <strong style={{ color: 'var(--text-primary)' }}>How to read this:</strong> Whole-sign Parashara drishti
        (7th for all; Ju 5/9; Sa 3/10; nodes via 7th). Double/triple means two or more of Ju/Sa/Ra/Ke
        simultaneously conjunct or aspect the same natal point. Confirm with dasha before acting on any window.
      </div>
    </div>
  )
}
