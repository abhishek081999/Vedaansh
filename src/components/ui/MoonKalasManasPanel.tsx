'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/MoonKalasManasPanel.tsx
//  Moon: 16 Kalas, Manas stages, past-life combinations
//  Free: overview + primary manas teaser · Gold+: full sections
// ─────────────────────────────────────────────────────────────

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  Brain,
  Flame,
  Lock,
  Moon as MoonIcon,
  Sparkles,
} from 'lucide-react'
import type { ChartOutput, UserPlan } from '@/types/astrology'
import { analyzeMoonKalasManas } from '@/lib/engine/moonKalasManas'
import { planMeetsUiGate } from '@/lib/ui/planGate'
import { PlanGate } from '@/components/ui/patterns/PlanGate'
import { Button } from '@/components/ui/primitives/Button'

type SubTab = 'overview' | 'kalas' | 'manas' | 'pastlife'

const SUB_TABS: { id: SubTab; label: string; short: string; Icon: typeof MoonIcon; free?: boolean }[] = [
  { id: 'overview', label: 'Overview', short: 'Overview', Icon: MoonIcon, free: true },
  { id: 'kalas', label: '16 Kalas', short: 'Kalas', Icon: Sparkles },
  { id: 'manas', label: 'Seven Manas', short: 'Manas', Icon: Brain },
  { id: 'pastlife', label: 'Past Life & Grahan', short: 'Past Life', Icon: BookOpen },
]

interface MoonKalasManasPanelProps {
  chart: ChartOutput
  userPlan?: UserPlan
}

export function MoonKalasManasPanel({ chart, userPlan = 'free' }: MoonKalasManasPanelProps) {
  const showFull = planMeetsUiGate(userPlan, 'gold')
  const [sub, setSub] = useState<SubTab>('overview')
  const data = useMemo(() => analyzeMoonKalasManas(chart), [chart])

  if (!data) {
    return (
      <div style={{
        padding: '1.25rem',
        border: '1px dashed var(--border-soft)',
        borderRadius: 'var(--r-md)',
        color: 'var(--text-muted)',
        fontSize: '0.8rem',
        textAlign: 'center',
      }}>
        Moon data unavailable for this chart.
      </div>
    )
  }

  const select = (id: SubTab) => {
    if (!showFull && id !== 'overview') return
    setSub(id)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
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
        }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            <Lock size={14} aria-hidden style={{ verticalAlign: '-2px', marginRight: 6 }} />
            Free preview: birth Moon overview, active kala, and primary manas.
            Gold unlocks the full 16 kalas, all seven manas with remedies, grahan yoga, and all past-life combinations.
          </div>
          <Link href="/pricing" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="sm">View plans</Button>
          </Link>
        </div>
      )}

      {/* Moon status strip */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.45rem',
        alignItems: 'center',
      }}>
        <Pill gold>{data.moon.rashiName} · H{data.moon.house}</Pill>
        <Pill>{data.moon.nakshatraName} P{data.moon.pada}</Pill>
        <Pill>{data.tithiName} · {data.paksha === 'shukla' ? 'Shukla' : 'Krishna'}</Pill>
        <Pill gold>Kala {data.activeKala.number}: {data.activeKala.name}</Pill>
        <Pill>{data.awakenedCount}/16 awakened</Pill>
        {data.isAmavasya && <Pill warn>Amavasya</Pill>}
        {data.isPurnima && <Pill teal>Purnima</Pill>}
        {data.grahanYoga.active && <Pill warn>Grahan Yoga</Pill>}
      </div>

      <div
        className="mobile-tab-scroll"
        style={{
          display: 'flex',
          gap: 3,
          flexWrap: 'nowrap',
          background: 'var(--surface-3)',
          borderRadius: 'var(--r-md)',
          padding: 4,
          border: '1px solid var(--border-soft)',
          overflowX: 'auto',
        }}
        role="tablist"
        aria-label="Moon analysis sections"
      >
        {SUB_TABS.map(t => {
          const locked = !showFull && !t.free
          const active = sub === t.id
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={locked}
              onClick={() => select(t.id)}
              style={{
                flex: '1 1 auto',
                padding: '0.42rem 0.55rem',
                background: active ? 'var(--surface-1)' : 'transparent',
                border: 'none',
                borderRadius: 'calc(var(--r-md) - 2px)',
                cursor: locked ? 'not-allowed' : 'pointer',
                color: locked ? 'var(--text-muted)' : active ? 'var(--text-gold)' : 'var(--text-muted)',
                fontWeight: active ? 700 : 500,
                fontSize: '0.7rem',
                opacity: locked ? 0.55 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                whiteSpace: 'nowrap',
              }}
            >
              <t.Icon size={13} aria-hidden />
              <span className="moon-tab-full">{t.label}</span>
              {locked && <Lock size={11} aria-hidden />}
            </button>
          )
        })}
      </div>

      {sub === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <Card>
            <Label>Active Kala (birth Moon)</Label>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-gold)' }}>
              {data.activeKala.number}. {data.activeKala.name}
            </div>
            <p style={{ margin: '0.4rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {data.activeKala.meaning}
            </p>
            <p style={{ margin: '0.55rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
              Elongation {data.elongationDeg.toFixed(1)}° · {data.worshipNote}
            </p>
          </Card>

          <Card>
            <Label>Primary Manas</Label>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              {data.primaryManas.name}
            </div>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {data.primaryManas.meaning}
            </p>
            {data.manasScores[0]?.reasons.length > 0 && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                Why: {data.manasScores[0].reasons.join(' · ')}
              </div>
            )}
            {!showFull && (
              <div style={{ marginTop: '0.55rem', fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', gap: 4, alignItems: 'center' }}>
                <Lock size={12} aria-hidden /> Full seven stages + remedies on Gold
              </div>
            )}
          </Card>

          <Card>
            <Label>Mind significations</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {data.psychology.positive.slice(0, showFull ? 99 : 4).map(p => <li key={p}>{p}</li>)}
            </ul>
            <p style={{ margin: '0.55rem 0 0', fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              {data.psychology.waterNote}
            </p>
          </Card>

          {!showFull && (
            <PlanGate userPlan={userPlan} required="gold" featureName="Moon Kalas & Manas full analysis">
              <div style={{ minHeight: 120, padding: '1rem', background: 'var(--surface-2)', borderRadius: 'var(--r-md)' }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Locked on Free</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  All 16 kalas · seven manas + remedies · grahan yoga · past-life combinations · Shri Vidya
                </div>
              </div>
            </PlanGate>
          )}
        </div>
      )}

      {showFull && sub === 'kalas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
            Full 16 kalas — Amavasya (0°) to Purnima (180°), ~12° per tithi.
            Active for this chart highlighted. {data.awakenedCount}/16 awakened
            ({data.paksha === 'shukla' ? 'waxing' : 'waning'}). {data.shriVidyaNote}
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '0.55rem',
          }}>
            {data.allKalas.map(k => {
              const active = k.number === data.activeKala.number
              const lit = k.number <= data.awakenedCount
              return (
                <div
                  key={k.number}
                  style={{
                    padding: '0.65rem 0.7rem',
                    borderRadius: 'var(--r-md)',
                    border: `1px solid ${active ? 'var(--gold)' : 'var(--border-soft)'}`,
                    background: active
                      ? 'var(--gold-faint)'
                      : lit
                        ? 'var(--surface-2)'
                        : 'var(--surface-1)',
                    opacity: lit || active ? 1 : 0.55,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                    <span style={{ fontWeight: 800, fontSize: '0.78rem', color: active ? 'var(--text-gold)' : 'var(--text-primary)' }}>
                      {k.number}. {k.name}
                      {active && <span style={{ fontSize: '0.55rem', marginLeft: 6 }}>ACTIVE</span>}
                    </span>
                    <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>{k.fromDeg}°</span>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
                    {k.meaning}
                  </div>
                </div>
              )
            })}
          </div>
          <Card>
            <Label>Worship note</Label>
            <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {data.worshipNote}
            </p>
          </Card>
        </div>
      )}

      {showFull && sub === 'manas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
            All seven manas stages. Primary for this chart is highlighted; scores come from natal Moon nakshatra, house, and yogas.
            Remedies must be lived in daily routine — not only chanting.
          </p>
          {data.manasStages.map(stage => {
            const score = data.manasScores.find(s => s.id === stage.id)
            const isPrimary = stage.id === data.primaryManas.id
            const isActive = (score?.score ?? 0) > 0
            return (
              <div
                key={stage.id}
                style={{
                  padding: '0.75rem 0.85rem',
                  borderRadius: 'var(--r-md)',
                  border: `1px solid ${isPrimary ? 'color-mix(in srgb, var(--gold) 45%, var(--border))' : 'var(--border-soft)'}`,
                  background: isPrimary ? 'var(--gold-faint)' : 'var(--surface-2)',
                  opacity: isActive || isPrimary ? 1 : 0.7,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: isPrimary ? 'var(--text-gold)' : 'var(--text-primary)' }}>
                    {stage.name}
                    {isPrimary && <span style={{ fontSize: '0.6rem', marginLeft: 8, fontWeight: 700 }}>PRIMARY</span>}
                    {!isPrimary && isActive && <span style={{ fontSize: '0.6rem', marginLeft: 8, fontWeight: 700, color: 'var(--teal)' }}>ACTIVE</span>}
                  </div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    Score {score?.score ?? 0}
                  </span>
                </div>
                <p style={{ margin: '0.35rem 0 0', fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  {stage.meaning}
                </p>
                <div style={{ marginTop: 6, fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                  Planets: {stage.planets}
                </div>
                {score && score.reasons.length > 0 && (
                  <div style={{ marginTop: 4, fontSize: '0.66rem', color: 'var(--teal, #4fd1c5)' }}>
                    Chart: {score.reasons.join(' · ')}
                  </div>
                )}
                <div style={{
                  marginTop: '0.55rem',
                  padding: '0.45rem 0.55rem',
                  background: 'var(--surface-3)',
                  borderRadius: 'var(--r-sm)',
                  fontSize: '0.68rem',
                  color: 'var(--text-primary)',
                  lineHeight: 1.4,
                }}>
                  <Flame size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} aria-hidden />
                  Remedy: {stage.remedy}
                </div>
              </div>
            )
          })}

          <Card>
            <Label>When Moon is afflicted</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {data.psychology.negativeWhenAfflicted.map(n => <li key={n}>{n}</li>)}
            </ul>
          </Card>
        </div>
      )}

      {showFull && sub === 'pastlife' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Card>
            <Label>Grahan Yoga</Label>
            <p style={{
              margin: 0,
              fontSize: '0.78rem',
              color: data.grahanYoga.active ? 'var(--rose)' : 'var(--text-secondary)',
              lineHeight: 1.5,
              fontWeight: data.grahanYoga.active ? 600 : 400,
            }}>
              {data.grahanYoga.detail}
            </p>
          </Card>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '0.55rem',
          }}>
            {data.pastLifeFlags.map(f => (
              <div
                key={f.id}
                style={{
                  padding: '0.7rem 0.75rem',
                  borderRadius: 'var(--r-md)',
                  border: `1px solid ${f.active ? 'rgba(224,123,142,0.4)' : 'var(--border-soft)'}`,
                  background: f.active ? 'rgba(224,123,142,0.08)' : 'var(--surface-2)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                  <span style={{ fontWeight: 800, fontSize: '0.8rem' }}>{f.title}</span>
                  <span style={{
                    fontSize: '0.55rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: f.active ? 'var(--rose)' : 'var(--text-muted)',
                  }}>
                    {f.active ? 'Active' : 'Not indicated'}
                  </span>
                </div>
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  {f.detail}
                </p>
              </div>
            ))}
          </div>

          <Card>
            <Label>Reading emphasis</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {data.chartReadingTips.map(t => <li key={t}>{t}</li>)}
            </ul>
            <p style={{ margin: '0.65rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
              {data.gocharNote}
            </p>
          </Card>
        </div>
      )}

    </div>
  )
}

function Pill({
  children,
  gold,
  teal,
  warn,
}: {
  children: React.ReactNode
  gold?: boolean
  teal?: boolean
  warn?: boolean
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.22rem 0.5rem',
        borderRadius: 'var(--r-md)',
        border: '1px solid var(--border)',
        background: gold
          ? 'var(--gold-faint)'
          : warn
            ? 'rgba(224,123,142,0.1)'
            : teal
              ? 'rgba(78,205,196,0.1)'
              : 'var(--surface-2)',
        color: gold
          ? 'var(--text-gold)'
          : warn
            ? 'var(--rose)'
            : teal
              ? 'var(--teal)'
              : 'var(--text-secondary)',
        fontSize: '0.65rem',
        fontWeight: 700,
      }}
    >
      {children}
    </span>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: '0.85rem',
      borderRadius: 'var(--r-md)',
      border: '1px solid var(--border-soft)',
      background: 'var(--surface-2)',
    }}>
      {children}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: '0.55rem',
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      marginBottom: '0.35rem',
    }}>
      {children}
    </div>
  )
}
