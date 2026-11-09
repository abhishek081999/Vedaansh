// ─────────────────────────────────────────────────────────────
//  src/components/dashboard/SadeSatiPanel.tsx
//  Sade Sati / Kantaka / Ashtama tracker UI
// ─────────────────────────────────────────────────────────────

'use client'

import React, { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { ChartOutput } from '@/types/astrology'
import { useLang } from '@/i18n/useLang'
import { BREAKPOINTS } from '@/lib/ui/breakpoints'
import { TimelineBand, VizCard, type BandSegment } from '@/components/ui/viz'
import type { SadeSatiReport, SaturnMoonPhase, SaturnMoonPhaseKind } from '@/lib/engine/sadeSati'

interface SadeSatiPanelProps {
  chart: ChartOutput
}

function toneColor(kind: SaturnMoonPhaseKind): string {
  if (kind === 'sade_sati_peak' || kind === 'ashtama') return 'var(--rose)'
  if (kind === 'clear') return 'var(--teal)'
  return 'var(--amber)'
}

function PhaseCard({ phase, compact }: { phase: SaturnMoonPhase; compact?: boolean }) {
  const t = useTranslations('transit.sadeSati')
  const color = toneColor(phase.kind)
  const placement = phase.isCurrent
    ? t('placementProgress', {
        rashi: phase.saturnRashiName,
        house: phase.fromMoonHouse,
        pct: phase.progressPct,
      })
    : t('placement', { rashi: phase.saturnRashiName, house: phase.fromMoonHouse })

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
        {placement}
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
  const t = useTranslations('transit.sadeSati')
  const { lang } = useLang()
  const [report, setReport] = useState<SadeSatiReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  const moon = chart.grahas.find(g => g.id === 'Mo')
  const moonRashi = moon?.rashi ?? null
  const ascRashi = chart.lagnas.ascRashi

  const statusBadge = (r: SadeSatiReport): { label: string; color: string } => {
    if (r.now.inSadeSati) return { label: r.now.label, color: toneColor(r.now.kind) }
    if (r.now.inKantaka) return { label: t('badgeKantaka'), color: toneColor('kantaka') }
    if (r.now.inAshtama) return { label: t('badgeAshtama'), color: toneColor('ashtama') }
    return { label: t('badgeClear'), color: 'var(--teal)' }
  }

  const phaseShort = (p: SaturnMoonPhase): string => {
    if (p.kind === 'ashtama') return t('shortAshtama')
    if (p.kind === 'kantaka') return t('shortKantaka')
    if (p.kind === 'sade_sati_peak') return t('shortPeak')
    if (p.kind === 'sade_sati_rising') return t('shortRising')
    if (p.kind === 'sade_sati_setting') return t('shortSetting')
    return p.label.replace(/Sade Sati — |साढ़े साती — /, '').split(/[\s—]/)[0]
  }

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < BREAKPOINTS.lg)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (!moonRashi) {
      setLoading(false)
      setError(t('needMoon'))
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
          lang,
        })
        const res = await fetch(`/api/transit/sade-sati?${qs}`)
        const json = await res.json()
        if (cancelled) return
        if (!json.success) {
          setError(json.error || t('loadFailed'))
          setReport(null)
        } else {
          setReport(json.data)
        }
      } catch {
        if (!cancelled) setError(t('loadFailed'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [moonRashi, ascRashi, lang, t])

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
          {t('loading')}
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="card" style={{ padding: '1.5rem', color: 'var(--text-muted)' }}>
        {error || t('noData')}
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
              {t('fromMoon', { rashi: report.moonRashiName })}
            </div>
            <h2 style={{ margin: '0.25rem 0 0', fontFamily: 'var(--font-display)', fontSize: isMobile ? '1.35rem' : '1.75rem', color: 'var(--text-gold)' }}>
              {t('title')}
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
            { k: t('statSaturn'), v: report.now.saturnRashiName },
            { k: t('statHouse'), v: `${report.now.fromMoonHouse}` },
            { k: t('statAsOf'), v: report.asOfIso },
          ].map(row => (
            <div key={row.k} style={{ background: 'var(--surface-3)', borderRadius: 8, padding: '0.55rem 0.7rem', border: '1px solid var(--border-soft)' }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{row.k}</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{row.v}</div>
            </div>
          ))}
        </div>
      </div>

      <VizCard
        title={t('timelineTitle')}
        caption={t('timelineCaption')}
        legend={[
          { label: t('legendPeak'), color: toneColor('ashtama') },
          { label: t('legendRising'), color: toneColor('kantaka') },
        ]}
      >
        <TimelineBand
          segments={[
            ...report.cycles.flatMap((c) => c.phases).map((p): BandSegment => ({
              key: `c-${p.kind}-${p.startIso}`,
              start: p.startIso,
              end: p.endIso,
              lane: 0,
              color: toneColor(p.kind),
              label: phaseShort(p),
              emphasis: p.isCurrent,
              title: `${p.label} · ${p.startIso} → ${p.endIso}`,
            })),
            ...report.specials.map((p): BandSegment => ({
              key: `s-${p.kind}-${p.startIso}`,
              start: p.startIso,
              end: p.endIso,
              lane: 1,
              color: toneColor(p.kind),
              label: phaseShort(p),
              emphasis: p.isCurrent,
              title: `${p.label} · ${p.startIso} → ${p.endIso}`,
            })),
          ]}
          laneLabels={[t('laneSade'), t('laneDhaiya')]}
          from={report.windowStartIso}
          to={report.windowEndIso}
          now={report.asOfIso}
          ticks={8}
          ariaLabel={t('ariaTimeline')}
        />
      </VizCard>

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
            {t('currentPhase')}
          </h3>
          <PhaseCard phase={report.currentPhase} />
        </section>
      )}

      {report.currentCycle && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '0.35rem' }}>
            <h3 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {t('activeCycle', { pct: report.currentCycle.progressPct })}
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
            {t('specials')}
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
            {t('upcoming')}
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
            {t('cyclesInWindow')}
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
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{c.label}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                  {c.startIso} → {c.endIso}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
