'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/PlanetaryEnergyCyclesPanel.tsx
//  Age-based planetary energy forms (independent of dasha)
//  Free: 2-planet preview · Gold+: full nine cycles
// ─────────────────────────────────────────────────────────────

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { Lock } from 'lucide-react'
import type { ChartOutput, GrahaId, UserPlan } from '@/types/astrology'
import { PanelShell } from '@/components/ui/patterns/PanelShell'
import { PlanGate } from '@/components/ui/patterns/PlanGate'
import { Button } from '@/components/ui/primitives/Button'
import { planMeetsUiGate } from '@/lib/ui/planGate'
import {
  computePlanetaryEnergyCycles,
  type EnergyCycleStatus,
  type PlanetaryEnergyCycle,
} from '@/lib/engine/planetaryEnergyCycles'
import { ICON } from '@/components/ui/PlanetDetailCard'

/** Free users see these two as a teaser (prefer active status when sorting). */
const FREE_PREVIEW_COUNT = 2

interface PlanetaryEnergyCyclesPanelProps {
  chart: ChartOutput
  userPlan?: UserPlan
  /** When true, skip PanelShell title (parent section already titled). */
  embedded?: boolean
}

const STATUS_STYLE: Record<EnergyCycleStatus, { bg: string; border: string; text: string }> = {
  active:          { bg: 'rgba(78,205,196,0.12)',  border: 'rgba(78,205,196,0.4)',  text: 'var(--teal)' },
  approaching:     { bg: 'rgba(245,158,66,0.12)',  border: 'rgba(245,158,66,0.4)',  text: 'var(--amber)' },
  dormant:         { bg: 'rgba(255,255,255,0.04)', border: 'var(--border-soft)',     text: 'var(--text-muted)' },
  continuous:      { bg: 'rgba(129,140,248,0.12)', border: 'rgba(129,140,248,0.4)', text: '#818cf8' },
  natal:           { bg: 'rgba(201,168,76,0.1)',   border: 'rgba(201,168,76,0.35)', text: 'var(--gold)' },
  not_applicable:  { bg: 'rgba(255,255,255,0.03)', border: 'var(--border-soft)',     text: 'var(--text-muted)' },
}

const WINDOW_KIND_COLOR: Record<string, string> = {
  lock: 'var(--rose)',
  release: 'var(--teal)',
  activation: 'var(--gold)',
  cycle: 'var(--text-secondary)',
}

function StatusBadge({ status, label }: { status: EnergyCycleStatus; label: string }) {
  const s = STATUS_STYLE[status]
  return (
    <span style={{
      fontSize: '0.58rem',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      padding: '2px 7px',
      borderRadius: 4,
      background: s.bg,
      border: `1px solid ${s.border}`,
      color: s.text,
      maxWidth: '100%',
      textAlign: 'right',
      lineHeight: 1.3,
    }}>
      {label}
    </span>
  )
}

function CycleCard({
  cycle,
  expanded,
  onToggle,
  previewOnly = false,
}: {
  cycle: PlanetaryEnergyCycle
  expanded: boolean
  onToggle: () => void
  /** Free teaser: title + status + short summary only */
  previewOnly?: boolean
}) {
  const s = STATUS_STYLE[cycle.status]
  return (
    <div style={{
      border: `1px solid ${expanded ? s.border : 'var(--border-soft)'}`,
      borderRadius: 'var(--r-md)',
      background: 'var(--surface-2)',
      overflow: 'hidden',
      transition: 'border-color 0.15s ease',
    }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          padding: '0.85rem',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          color: 'inherit',
        }}
      >
        <div style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          flexShrink: 0,
          background: 'var(--surface-3)',
          border: '1px solid var(--border-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.1rem',
        }}>
          {ICON[cycle.grahaId] || cycle.grahaId}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                {cycle.grahaName}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-gold)', marginTop: 2 }}>
                {cycle.title}
              </div>
            </div>
            <StatusBadge status={cycle.status} label={cycle.statusLabel} />
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            {cycle.theme} · {cycle.cyclePeriod}
          </div>
        </div>
        <span style={{
          fontSize: '0.7rem',
          color: 'var(--text-muted)',
          marginTop: 4,
          transform: expanded ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.15s ease',
        }}>▾</span>
      </button>

      {expanded && (
        <div style={{
          padding: '0 0.85rem 0.9rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          borderTop: '1px solid var(--border-soft)',
        }}>
          <p style={{
            margin: '0.75rem 0 0',
            fontSize: '0.74rem',
            lineHeight: 1.55,
            color: 'var(--text-secondary)',
          }}>
            {previewOnly
              ? `${cycle.summary.slice(0, 140)}${cycle.summary.length > 140 ? '…' : ''}`
              : cycle.summary}
          </p>

          {previewOnly ? (
            <div style={{
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}>
              <Lock size={12} aria-hidden />
              Full phases, timing windows, and chart notes on Gold
            </div>
          ) : (
            <>
              {cycle.phases.length > 0 && (
                <div>
                  <div style={{
                    fontSize: '0.55rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--text-muted)',
                    marginBottom: '0.4rem',
                  }}>
                    Phases
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {cycle.phases.map(p => (
                      <div key={p.label} style={{
                        padding: '0.45rem 0.55rem',
                        background: 'var(--surface-3)',
                        borderRadius: 'var(--r-sm)',
                        border: '1px solid var(--border-soft)',
                      }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)' }}>{p.label}</div>
                        <div style={{ fontSize: '0.66rem', color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.4 }}>
                          {p.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {cycle.windows.length > 0 && (
                <div>
                  <div style={{
                    fontSize: '0.55rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--text-muted)',
                    marginBottom: '0.4rem',
                  }}>
                    Timing Windows
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {cycle.windows.map(w => (
                      <span
                        key={`${w.label}-${w.ages}`}
                        style={{
                          fontSize: '0.62rem',
                          padding: '3px 8px',
                          borderRadius: 4,
                          border: `1px solid ${w.active ? WINDOW_KIND_COLOR[w.kind] : 'var(--border-soft)'}`,
                          background: w.active ? 'rgba(255,255,255,0.04)' : 'transparent',
                          color: w.active ? WINDOW_KIND_COLOR[w.kind] : 'var(--text-muted)',
                          fontWeight: w.active ? 700 : 500,
                        }}
                      >
                        {w.label}: {w.ages}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {cycle.manifestations.length > 0 && (
                <div>
                  <div style={{
                    fontSize: '0.55rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--text-muted)',
                    marginBottom: '0.35rem',
                  }}>
                    How it shows
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {cycle.manifestations.map(m => <li key={m}>{m}</li>)}
                  </ul>
                </div>
              )}

              {cycle.natalNotes.length > 0 && (
                <div style={{
                  padding: '0.55rem 0.65rem',
                  background: 'var(--surface-3)',
                  borderRadius: 'var(--r-sm)',
                  borderLeft: '3px solid var(--gold)',
                }}>
                  <div style={{
                    fontSize: '0.55rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--text-gold)',
                    marginBottom: '0.3rem',
                  }}>
                    This chart
                  </div>
                  {cycle.natalNotes.map(n => (
                    <div key={n} style={{ fontSize: '0.68rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                      {n}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                {cycle.insight}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export function PlanetaryEnergyCyclesPanel({
  chart,
  userPlan = 'free',
  embedded = false,
}: PlanetaryEnergyCyclesPanelProps) {
  const showFull = planMeetsUiGate(userPlan, 'gold')

  const result = useMemo(
    () => computePlanetaryEnergyCycles(chart.grahas, chart.meta.birthDate),
    [chart.grahas, chart.meta.birthDate],
  )

  const activeFirst = useMemo(() => {
    const rank: Record<EnergyCycleStatus, number> = {
      active: 0,
      approaching: 1,
      continuous: 2,
      natal: 3,
      dormant: 4,
      not_applicable: 5,
    }
    return [...result.cycles].sort((a, b) => rank[a.status] - rank[b.status])
  }, [result.cycles])

  const previewCycles = useMemo(
    () => activeFirst.slice(0, FREE_PREVIEW_COUNT),
    [activeFirst],
  )
  const lockedCycles = useMemo(
    () => (showFull ? [] : activeFirst.slice(FREE_PREVIEW_COUNT)),
    [activeFirst, showFull],
  )

  const [openId, setOpenId] = useState<GrahaId | null>(() => {
    const first = activeFirst.find(c => c.status === 'active' || c.status === 'approaching')
    return first?.grahaId ?? 'Sa'
  })

  const activeCount = result.cycles.filter(c => c.status === 'active').length

  const body = (
    <>
      {!showFull && (
        <div style={{
          padding: '0.75rem 1rem',
          background: 'var(--surface-3)',
          borderRadius: 'var(--r-md)',
          border: '1px solid var(--gold-faint)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '0.55rem',
          marginBottom: '0.85rem',
        }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            <Lock size={14} aria-hidden style={{ verticalAlign: '-2px', marginRight: 6 }} />
            Free preview: {FREE_PREVIEW_COUNT} energy cycles with a short summary.
            Full nine planets, phases, timing windows, and chart notes require Gold.
          </div>
          <Link href="/pricing" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="sm">View plans</Button>
          </Link>
        </div>
      )}

      <div style={{
        fontSize: '0.72rem',
        color: 'var(--text-secondary)',
        lineHeight: 1.5,
        marginBottom: '0.85rem',
        padding: '0.65rem 0.75rem',
        background: 'rgba(201,168,76,0.06)',
        border: '1px solid rgba(201,168,76,0.2)',
        borderRadius: 'var(--r-sm)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.5rem',
      }}>
        <span>{result.insight}</span>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          Age {result.age}
          {activeCount > 0 ? ` · ${activeCount} active` : ''}
          {!showFull ? ' · preview' : ''}
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '0.75rem',
      }}>
        {(showFull ? activeFirst : previewCycles).map(cycle => (
          <CycleCard
            key={cycle.grahaId}
            cycle={cycle}
            previewOnly={!showFull}
            expanded={openId === cycle.grahaId}
            onToggle={() => setOpenId(prev => (prev === cycle.grahaId ? null : cycle.grahaId))}
          />
        ))}
      </div>

      {!showFull && lockedCycles.length > 0 && (
        <div style={{ marginTop: '0.85rem' }}>
          <PlanGate
            userPlan={userPlan}
            required="gold"
            featureName="Full Planetary Energy Cycles"
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '0.75rem',
              minHeight: 160,
            }}>
              {lockedCycles.map(cycle => (
                <div
                  key={cycle.grahaId}
                  style={{
                    padding: '0.85rem',
                    borderRadius: 'var(--r-md)',
                    border: '1px solid var(--border-soft)',
                    background: 'var(--surface-2)',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{cycle.grahaName}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-gold)', marginTop: 2 }}>{cycle.title}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 6 }}>
                    {cycle.theme}
                  </div>
                </div>
              ))}
            </div>
          </PlanGate>
        </div>
      )}
    </>
  )

  if (embedded) return <div>{body}</div>

  return (
    <PanelShell
      title="Planetary Energy Cycles"
      headerActions={
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
          Age {result.age}
          {activeCount > 0 ? ` · ${activeCount} active` : ''}
          {!showFull ? ' · Free preview' : ''}
        </span>
      }
      padding="sm"
    >
      {body}
    </PanelShell>
  )
}
