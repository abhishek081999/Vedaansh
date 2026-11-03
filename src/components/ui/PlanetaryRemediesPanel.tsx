'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/PlanetaryRemediesPanel.tsx
//  Planetary energies & general remedies (ग्रहों की ऊर्जा और उपाय)
//  Free: 2 most afflicted planets (indications + behavioural) · Gold+: all nine
// ─────────────────────────────────────────────────────────────

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { Lock } from 'lucide-react'
import type { ChartOutput, UserPlan } from '@/types/astrology'
import { PlanGate } from '@/components/ui/patterns/PlanGate'
import { Button } from '@/components/ui/primitives/Button'
import { planMeetsUiGate } from '@/lib/ui/planGate'
import {
  computePlanetaryRemedies,
  REMEDY_CORE_PRINCIPLE,
  type PlanetRemedyAssessment,
  type RemedyGrahaId,
  type RemedyNeed,
} from '@/lib/engine/planetaryRemedies'
import { ICON } from '@/components/ui/PlanetDetailCard'

const FREE_PREVIEW_COUNT = 2

const NEED_STYLE: Record<RemedyNeed, { bg: string; border: string; text: string; label: string }> = {
  high:     { bg: 'rgba(244,114,128,0.12)', border: 'rgba(244,114,128,0.4)', text: 'var(--rose)',       label: 'Needs remedy' },
  moderate: { bg: 'rgba(245,158,66,0.12)',  border: 'rgba(245,158,66,0.4)',  text: 'var(--amber)',      label: 'Some strain' },
  low:      { bg: 'rgba(255,255,255,0.04)', border: 'var(--border-soft)',     text: 'var(--text-muted)', label: 'Supported' },
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.55rem',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--text-muted)',
  marginBottom: '0.35rem',
}

const listStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: '1.1rem',
  fontSize: '0.68rem',
  color: 'var(--text-secondary)',
  lineHeight: 1.5,
}

function RemedyList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <div>
      <div style={labelStyle}>{title}</div>
      <ul style={listStyle}>
        {items.map((i) => <li key={i}>{i}</li>)}
      </ul>
    </div>
  )
}

function RemedyCard({
  p,
  expanded,
  onToggle,
  previewOnly = false,
}: {
  p: PlanetRemedyAssessment
  expanded: boolean
  onToggle: () => void
  previewOnly?: boolean
}) {
  const s = NEED_STYLE[p.need]
  const t = p.teaching
  const deities = [...t.deities, `${p.nakshatraDeity} (nakshatra)`]
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
          {ICON[p.grahaId] || p.grahaId}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                {t.name} · {t.sanskrit}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-gold)', marginTop: 2 }}>
                {p.nakshatraName} · {p.nakshatraDeity}
              </div>
            </div>
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
              whiteSpace: 'nowrap',
            }}>
              {s.label}
            </span>
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            {p.reasons.length > 0 ? p.reasons.join(' · ') : 'No major affliction'}
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
          padding: '0.75rem 0.85rem 0.9rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          borderTop: '1px solid var(--border-soft)',
        }}>
          <div style={{
            padding: '0.55rem 0.65rem',
            background: 'var(--surface-3)',
            borderRadius: 'var(--r-sm)',
            borderLeft: '3px solid var(--gold)',
          }}>
            <div style={{ ...labelStyle, color: 'var(--text-gold)' }}>Deities · this chart</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
              {deities.join(' · ')}
            </div>
          </div>

          <RemedyList title="Indications of weakness" items={t.indications} />
          <RemedyList title="Behavioural remedies" items={t.behavioral} />

          {previewOnly ? (
            <div style={{
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}>
              <Lock size={12} aria-hidden />
              Spiritual remedies, daan, seva, and cautions on Gold
            </div>
          ) : (
            <>
              <RemedyList title="Spiritual remedies" items={t.spiritual} />
              <RemedyList title="Donation (Daan)" items={t.donation} />
              <RemedyList title="Seva" items={t.seva} />
              {t.notes.map((n) => (
                <div key={n} style={{
                  fontSize: '0.66rem',
                  color: 'var(--amber)',
                  lineHeight: 1.45,
                  padding: '0.45rem 0.55rem',
                  border: '1px solid rgba(245,158,66,0.3)',
                  borderRadius: 'var(--r-sm)',
                }}>
                  {n}
                </div>
              ))}
              {t.duration && (
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Duration: {t.duration}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

interface PlanetaryRemediesPanelProps {
  chart: ChartOutput
  userPlan?: UserPlan
}

export function PlanetaryRemediesPanel({ chart, userPlan = 'free' }: PlanetaryRemediesPanelProps) {
  const showFull = planMeetsUiGate(userPlan, 'gold')

  const result = useMemo(
    () => computePlanetaryRemedies(chart.grahas, chart.shadbala),
    [chart.grahas, chart.shadbala],
  )

  const visible = showFull ? result.planets : result.planets.slice(0, FREE_PREVIEW_COUNT)
  const locked = showFull ? [] : result.planets.slice(FREE_PREVIEW_COUNT)

  const [openId, setOpenId] = useState<RemedyGrahaId | null>(() => result.planets[0]?.grahaId ?? null)

  return (
    <div>
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
            Free preview: your {FREE_PREVIEW_COUNT} most afflicted planets with behavioural remedies.
            All nine planets with spiritual remedies, daan, and seva require Gold.
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
      }}>
        <div style={{ fontWeight: 700, color: 'var(--text-gold)', marginBottom: 4 }}>
          {REMEDY_CORE_PRINCIPLE.title}
        </div>
        <div>Look at: {REMEDY_CORE_PRINCIPLE.steps.join(' → ')}.</div>
        <div style={{ marginTop: 4, fontStyle: 'italic' }}>{REMEDY_CORE_PRINCIPLE.keyRule}</div>
        <div style={{ marginTop: 6, color: 'var(--text-primary)' }}>{result.insight}</div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '0.75rem',
      }}>
        {visible.map((p) => (
          <RemedyCard
            key={p.grahaId}
            p={p}
            previewOnly={!showFull}
            expanded={openId === p.grahaId}
            onToggle={() => setOpenId((prev) => (prev === p.grahaId ? null : p.grahaId))}
          />
        ))}
      </div>

      {locked.length > 0 && (
        <div style={{ marginTop: '0.85rem' }}>
          <PlanGate userPlan={userPlan} required="gold" featureName="Full Planetary Remedies">
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '0.75rem',
              minHeight: 160,
            }}>
              {locked.map((p) => (
                <div
                  key={p.grahaId}
                  style={{
                    padding: '0.85rem',
                    borderRadius: 'var(--r-md)',
                    border: '1px solid var(--border-soft)',
                    background: 'var(--surface-2)',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                    {p.teaching.name} · {p.teaching.sanskrit}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 6 }}>
                    {NEED_STYLE[p.need].label}
                  </div>
                </div>
              ))}
            </div>
          </PlanGate>
        </div>
      )}
    </div>
  )
}
