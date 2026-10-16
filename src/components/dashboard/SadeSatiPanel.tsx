// ─────────────────────────────────────────────────────────────
//  src/components/dashboard/SadeSatiPanel.tsx
//  Sade Sati / Kantaka / Ashtama tracker UI
// ─────────────────────────────────────────────────────────────

'use client'

import React, { useEffect, useState } from 'react'
import type { ChartOutput } from '@/types/astrology'
import { BREAKPOINTS } from '@/lib/ui/breakpoints'
import type { SadeSatiReport, SaturnMoonPhase, SaturnMoonPhaseKind } from '@/lib/engine/sadeSati'

interface SadeSatiPanelProps {
  chart: ChartOutput
}

function toneColor(kind: SaturnMoonPhaseKind): string {
  if (kind === 'sade_sati_peak' || kind === 'ashtama') return 'var(--rose)'
  if (kind === 'clear') return 'var(--teal)'
  return 'var(--amber)'
}

function statusBadge(report: SadeSatiReport): { label: string; color: string } {
  if (report.now.inSadeSati) {
    return { label: report.now.label, color: toneColor(report.now.kind) }
  }
  if (report.now.inKantaka) {
    return { label: 'Kantaka / Dhaiya active', color: toneColor('kantaka') }
  }
  if (report.now.inAshtama) {
    return { label: 'Ashtama Shani active', color: toneColor('ashtama') }
  }
  return { label: 'Clear window', color: 'var(--teal)' }
}

function PhaseCard({ phase, compact }: { phase: SaturnMoonPhase; compact?: boolean }) {
  const color = toneColor(phase.kind)
  return (
    <div
      style={{
        border: '1px solid var(--border-soft)',
        borderLeft: `4px solid ${color}`,
        borderRadius: 10,
        padding: compact ? '0.65rem 0.75rem' : '0.85rem 1rem',
        background: phase.isCurrent ? `${color}10` : 'var(--surface-2)',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '0.35rem', marginBottom: '0.3rem' }}>
        <strong style={{ color: 'var(--text-primary)', fontSize: compact ? '0.82rem' : '0.9rem' }}>
          {phase.label}
        </strong>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {phase.startIso} → {phase.endIso}
        </span>
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: phase.isCurrent ? '0.45rem' : 0 }}>
        Saturn in {phase.saturnRashiName} · {phase.fromMoonHouse}th from Moon
        {phase.isCurrent ? ` · ${phase.progressPct}% through phase` : ''}
      </div>
      {!compact && (
        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {phase.summary}
        </p>
      )}
      {phase.isCurrent && (
        <div
          style={{
            marginTop: '0.55rem',
            height: 6,
            borderRadius: 4,
            background: 'var(--surface-3)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${phase.progressPct}%`,
              height: '100%',
              background: color,
              borderRadius: 4,
            }}
          />
        </div>
      )}
    </div>
  )
}

export function SadeSatiPanel({ chart }: SadeSatiPanelProps) {
  const [report, setReport] = useState<SadeSatiReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  const moon = chart.grahas.find(g => g.id === 'Mo')
  const moonRashi = moon?.rashi ?? null
  const ascRashi = chart.lagnas.ascRashi

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < BREAKPOINTS.lg)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (!moonRashi) {
      setLoading(false)
      setError('Natal Moon position is required for Sade Sati.')
      return
    }

    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const qs = new URLSearchParams({
          moonRashi: String(moonRashi),
          ascRashi: String(ascRashi),
          lookbackYears: '12',
          lookAheadYears: '20',
        })
        const res = await fetch(`/api/transit/sade-sati?${qs}`)
        const json = await res.json()
        if (cancelled) return
        if (!json.success) {
          setError(json.error || 'Failed to load Sade Sati')
          setReport(null)
        } else {
          setReport(json.data)
        }
      } catch {
        if (!cancelled) setError('Failed to load Sade Sati')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [moonRashi, ascRashi])

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
          Mapping Saturn against your Moon…
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="card" style={{ padding: '1.5rem', color: 'var(--text-muted)' }}>
        {error || 'No Sade Sati data available.'}
      </div>
    )
  }

  const badge = statusBadge(report)
  const pastCycles = report.cycles.filter(c => !c.isCurrent && new Date(c.endIso) < new Date(report.asOfIso))
  const futureCycles = report.cycles.filter(c => !c.isCurrent && new Date(c.startIso) > new Date(report.asOfIso))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1rem' : '1.35rem' }}>
      <div className="card" style={{ padding: isMobile ? '1rem' : '1.35rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              From natal Moon · {report.moonRashiName}
            </div>
            <h2 style={{ margin: '0.25rem 0 0', fontFamily: 'var(--font-display)', fontSize: isMobile ? '1.35rem' : '1.75rem', color: 'var(--text-gold)' }}>
              Saturn–Moon Tracker
            </h2>
          </div>
          <div
            style={{
              alignSelf: 'flex-start',
              padding: '0.4rem 0.75rem',
              borderRadius: 8,
              border: `1px solid ${badge.color}55`,
              background: `${badge.color}18`,
              color: badge.color,
              fontSize: '0.75rem',
              fontWeight: 800,
            }}
          >
            {badge.label}
          </div>
        </div>

        <p style={{ margin: '0 0 0.85rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          {report.now.summary}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: '0.55rem' }}>
          {[
            { k: 'Transit Saturn', v: report.now.saturnRashiName },
            { k: 'House from Moon', v: `${report.now.fromMoonHouse}` },
            { k: 'As of', v: report.asOfIso },
          ].map(row => (
            <div key={row.k} style={{ background: 'var(--surface-3)', borderRadius: 8, padding: '0.55rem 0.7rem', border: '1px solid var(--border-soft)' }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{row.k}</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{row.v}</div>
            </div>
          ))}
        </div>
      </div>

      {report.softeners.length > 0 && (
        <div
          className="card"
          style={{
            padding: '0.9rem 1rem',
            borderColor: 'var(--teal)',
            background: 'rgba(78, 205, 196, 0.08)',
          }}
        >
          {report.softeners.map(s => (
            <div key={s.id}>
              <div style={{ fontWeight: 800, color: 'var(--teal)', fontSize: '0.82rem', marginBottom: '0.25rem' }}>{s.title}</div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s.detail}</p>
            </div>
          ))}
        </div>
      )}

      {report.currentPhase && report.currentPhase.kind !== 'clear' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          <h3 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Current phase
          </h3>
          <PhaseCard phase={report.currentPhase} />
        </section>
      )}

      {report.currentCycle && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '0.35rem' }}>
            <h3 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Active Sade Sati cycle · {report.currentCycle.progressPct}% complete
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {report.currentCycle.startIso} → {report.currentCycle.endIso}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {report.currentCycle.phases.map(p => (
              <PhaseCard key={`${p.kind}-${p.startIso}`} phase={p} compact />
            ))}
          </div>
        </section>
      )}

      {report.specials.some(p => p.isCurrent || new Date(p.startIso) > new Date(report.asOfIso)) && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          <h3 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Kantaka (Dhaiya) & Ashtama
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {report.specials
              .filter(p => p.isCurrent || new Date(p.startIso) >= new Date(report.asOfIso))
              .slice(0, 6)
              .map(p => (
                <PhaseCard key={`${p.kind}-${p.startIso}`} phase={p} compact />
              ))}
          </div>
        </section>
      )}

      {report.upcoming.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          <h3 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Upcoming Saturn–Moon windows
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {report.upcoming.map(p => (
              <PhaseCard key={`up-${p.kind}-${p.startIso}`} phase={p} compact />
            ))}
          </div>
        </section>
      )}

      {(futureCycles.length > 0 || pastCycles.length > 0) && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          <h3 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Sade Sati cycles in window
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.55rem' }}>
            {[...futureCycles.slice(0, 2), ...pastCycles.slice(-2).reverse()].map(c => (
              <div
                key={c.startIso}
                style={{
                  border: '1px solid var(--border-soft)',
                  borderRadius: 10,
                  padding: '0.75rem',
                  background: 'var(--surface-2)',
                }}
              >
                <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{c.label}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
                  {c.startIso} → {c.endIso}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                  {c.phases.map(p => p.label.replace('Sade Sati — ', '')).join(' · ')}
                </div>
              </div>
            ))}
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
        <strong style={{ color: 'var(--text-primary)' }}>How to read this:</strong> Sade Sati is Saturn’s ~7.5-year pass through the 12th, Moon-sign, and 2nd from natal Moon.
        Kantaka (Dhaiya) is the 4th; Ashtama is the 8th. Always weigh results with Vimshottari dasha and Ashtakavarga — never from Saturn alone.
      </div>
    </div>
  )
}
