'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/SunAdityasPanel.tsx
//  Surya: 12 Adityas, karakatva, afflictions, spiritual notes
//  Free: overview teaser · Gold+: full sections
// ─────────────────────────────────────────────────────────────

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  Compass,
  Flame,
  Lock,
  Sparkles,
  Sun as SunIcon,
  Zap,
} from 'lucide-react'
import type { ChartOutput, UserPlan } from '@/types/astrology'
import { analyzeSunAdityas } from '@/lib/engine/sunAdityas'
import { analyzeSunReadingMethod } from '@/lib/engine/sunReadingMethod'
import { planMeetsUiGate } from '@/lib/ui/planGate'
import { PlanGate } from '@/components/ui/patterns/PlanGate'
import { ChartScopeToggle, EmptyForChart, type ChartScope } from '@/components/ui/patterns/ChartScopeToggle'
import { Button } from '@/components/ui/primitives/Button'

type SubTab = 'overview' | 'reading' | 'adityas' | 'spiritual' | 'afflictions'

const SUB_TABS: { id: SubTab; label: string; Icon: typeof SunIcon; free?: boolean }[] = [
  { id: 'overview', label: 'Overview', Icon: SunIcon, free: true },
  { id: 'reading', label: 'Reading Method', Icon: Compass },
  { id: 'adityas', label: '12 Adityas', Icon: Sparkles },
  { id: 'spiritual', label: 'Energy & Spirit', Icon: Zap },
  { id: 'afflictions', label: 'Afflictions', Icon: Flame },
]

interface SunAdityasPanelProps {
  chart: ChartOutput
  userPlan?: UserPlan
}

export function SunAdityasPanel({ chart, userPlan = 'free' }: SunAdityasPanelProps) {
  const showFull = planMeetsUiGate(userPlan, 'gold')
  const [sub, setSub] = useState<SubTab>('overview')
  const [scope, setScope] = useState<ChartScope>('chart')
  const data = useMemo(() => analyzeSunAdityas(chart), [chart])
  const reading = useMemo(() => analyzeSunReadingMethod(chart), [chart])

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
        Sun data unavailable for this chart.
      </div>
    )
  }

  const select = (id: SubTab) => {
    if (!showFull && id !== 'overview') return
    setSub(id)
  }

  const activeAfflictions = data.afflictions.filter(f => f.active)

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
            Free preview: natal Sun placement, primary Aditya, and core significations.
            Gold unlocks the 5-step reading method, all 12 Adityas, Pingala/spiritual notes, afflictions, and Pitru Dosh.
          </div>
          <Link href="/pricing" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="sm">View plans</Button>
          </Link>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
        <Pill gold>{data.sun.rashiName} · H{data.sun.house}</Pill>
        <Pill>{data.sun.nakshatraName} P{data.sun.pada}</Pill>
        <Pill>{data.sun.dignity.replace('_', ' ')}</Pill>
        <Pill gold>Aditya: {data.primaryAditya.name}</Pill>
        {data.pitruDosh.active && <Pill warn>Pitru Dosh</Pill>}
        {activeAfflictions.map(a => (
          <Pill key={a.id} warn>{a.title}</Pill>
        ))}
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
        aria-label="Sun analysis sections"
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
              {t.label}
              {locked && <Lock size={11} aria-hidden />}
            </button>
          )
        })}
      </div>

      {sub === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <Card>
            <Label>Primary Aditya (natal Sun)</Label>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-gold)' }}>
              {data.primaryAditya.name}{' '}
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{data.primaryAditya.sanskrit}</span>
            </div>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {data.primaryAditya.meaning}
            </p>
            {data.matchingAdityas[0]?.reasons.length ? (
              <div style={{ marginTop: '0.45rem', fontSize: '0.68rem', color: 'var(--teal)' }}>
                Why: {data.matchingAdityas[0].reasons.join(' · ')}
              </div>
            ) : null}
            {!showFull && (
              <div style={{ marginTop: '0.55rem', fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', gap: 4, alignItems: 'center' }}>
                <Lock size={12} aria-hidden /> Full 12 Adityas catalogue on Gold
              </div>
            )}
          </Card>

          <Card>
            <Label>Core karakatva</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {data.karakatva.slice(0, showFull ? 99 : 5).map(k => <li key={k}>{k}</li>)}
            </ul>
          </Card>

          <Card>
            <Label>Dignity</Label>
            {data.dignityNotes.map(n => (
              <p key={n} style={{ margin: '0 0 0.35rem', fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {n}
              </p>
            ))}
            {data.houseNotes.map(n => (
              <p key={n} style={{ margin: '0.35rem 0 0', fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                {n}
              </p>
            ))}
          </Card>

          {!showFull && (
            <PlanGate userPlan={userPlan} required="gold" featureName="Sun Adityas full analysis">
              <div style={{ minHeight: 120, padding: '1rem', background: 'var(--surface-2)', borderRadius: 'var(--r-md)' }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Locked on Free</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  All 12 Adityas · Pingala / chakras / inner Guru · Rahu–Ketu–Saturn afflictions · Pitru Dosh · rays & methodology
                </div>
              </div>
            </PlanGate>
          )}
        </div>
      )}

      {showFull && sub === 'reading' && reading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
            Read the Sun alone first, in five steps: background → characteristics → daivik support → negatives → remedies.
          </p>

          {reading.steps.map(s => (
            <Card key={s.step}>
              <Label>Step {s.step} · {s.title}</Label>
              <div style={{ fontSize: '0.72rem', color: 'var(--teal)', marginBottom: 4 }}>{s.question}</div>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {s.points.map(p => <li key={p}>{p}</li>)}
              </ul>
            </Card>
          ))}

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '0.55rem',
          }}>
            <Card>
              <Label>Motion in the zodiac</Label>
              <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-gold)' }}>{reading.motion.label}</div>
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {reading.motion.detail}
              </p>
              <div style={{ marginTop: 4, fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                {reading.motion.degreesToExaltation.toFixed(0)}° to exaltation · {reading.motion.degreesToDebilitation.toFixed(0)}° to debilitation
              </div>
            </Card>
            {reading.sandhi.active && (
              <Card>
                <Label>Sandhi / gandanta</Label>
                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--rose)', lineHeight: 1.45 }}>
                  {reading.sandhi.detail}
                </p>
              </Card>
            )}
            <Card>
              <Label>Solar month</Label>
              <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-gold)' }}>
                {reading.solarMonth.month}{reading.solarMonth.aditya ? ` · ${reading.solarMonth.aditya}` : ''}
              </div>
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Sun at this degree puts birth around {reading.solarMonth.approxBirthWindow} — a quick sanity check on the birth data.
              </p>
            </Card>
            <Card>
              <Label>Body side</Label>
              <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {reading.bodySide.detail}
              </p>
            </Card>
          </div>

          <Card>
            <Label>Appearance (Surya on Lagna)</Label>
            <div style={{ fontSize: '0.68rem', color: reading.appearance.applies ? 'var(--teal)' : 'var(--text-muted)', marginBottom: 4 }}>
              {reading.appearance.reason}
            </div>
            {reading.appearance.applies && (
              <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {reading.appearance.traits.map(t => <li key={t}>{t}</li>)}
              </ul>
            )}
          </Card>

          <Card>
            <Label>Activation ages</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {reading.activationAges.map(a => (
                <li key={`${a.age}-${a.source}`}>
                  <strong>{a.age}</strong> — {a.source}{a.mahadasha ? ` · ${a.mahadasha} Mahadasha running` : ''}
                </li>
              ))}
            </ul>
            <p style={{ margin: '0.45rem 0 0', fontSize: '0.66rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              An age is only confirmed when the dasha running then also supports the theme.
            </p>
          </Card>

          <Card>
            <Label>Practices & remedies</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {reading.practices.map(p => <li key={p}>{p}</li>)}
            </ul>
          </Card>

          <Card>
            <Label>Reading principles</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {reading.principles.map(p => <li key={p}>{p}</li>)}
            </ul>
          </Card>
        </div>
      )}

      {showFull && sub === 'adityas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <ChartScopeToggle
            value={scope}
            onChange={setScope}
            chartCount={data.matchingAdityas.length}
            totalCount={data.allAdityas.length}
          />
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
            {scope === 'chart'
              ? 'Aditya forms this natal Sun carries — primary first, scored by nakshatra, then sign, then house.'
              : 'All twelve Adityas (Veda / Purana solar forms) for study; forms matching this Sun are highlighted.'}
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '0.55rem',
          }}>
            {(scope === 'chart' ? data.matchingAdityas.map(m => m.aditya) : data.allAdityas).map(a => {
              const match = data.matchingAdityas.find(m => m.aditya.id === a.id)
              const isPrimary = a.id === data.primaryAditya.id
              return (
                <div
                  key={a.id}
                  style={{
                    padding: '0.7rem 0.75rem',
                    borderRadius: 'var(--r-md)',
                    border: `1px solid ${isPrimary ? 'var(--gold)' : match ? 'color-mix(in srgb, var(--gold) 35%, var(--border))' : 'var(--border-soft)'}`,
                    background: isPrimary ? 'var(--gold-faint)' : match ? 'var(--surface-2)' : 'var(--surface-1)',
                    opacity: match || isPrimary ? 1 : 0.65,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                    <span style={{ fontWeight: 800, fontSize: '0.82rem', color: isPrimary ? 'var(--text-gold)' : 'var(--text-primary)' }}>
                      {a.name} <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>{a.sanskrit}</span>
                      {isPrimary && <span style={{ fontSize: '0.55rem', marginLeft: 6 }}>PRIMARY</span>}
                      {!isPrimary && match && <span style={{ fontSize: '0.55rem', marginLeft: 6, color: 'var(--teal)' }}>MATCH</span>}
                    </span>
                    {match && (
                      <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>Score {match.score}</span>
                    )}
                  </div>
                  <p style={{ margin: '0.35rem 0 0', fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {a.meaning}
                  </p>
                  <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1rem', fontSize: '0.66rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {a.significance.slice(0, 3).map(s => <li key={s}>{s}</li>)}
                  </ul>
                  {match && match.reasons.length > 0 && (
                    <div style={{ marginTop: 6, fontSize: '0.64rem', color: 'var(--teal)' }}>
                      Chart: {match.reasons.join(' · ')}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <Card>
            <Label>Other Surya names</Label>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              {data.otherNames.join(' · ')}
            </div>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
              {data.dashaNote}
            </p>
          </Card>
        </div>
      )}

      {showFull && sub === 'spiritual' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Card>
            <Label>Physical & element</Label>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Colors: {data.physical.colors.join(', ')} · Metals: {data.physical.metals.join(', ')} · Varna: {data.physical.varna}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>{data.physical.transitNote}</div>
          </Card>

          <Card>
            <Label>Health significations</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {data.health.map(h => <li key={h}>{h}</li>)}
            </ul>
          </Card>

          <Card>
            <Label>Prana · Pingala · Inner Guru</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {data.spiritual.map(s => <li key={s}>{s}</li>)}
            </ul>
            <p style={{ margin: '0.55rem 0 0', fontSize: '0.74rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
              {data.egoNote}
            </p>
          </Card>

          <Card>
            <Label>Three rays</Label>
            {data.rays.map(r => (
              <div key={r.name} style={{ marginBottom: '0.45rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-gold)' }}>{r.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{r.detail}</div>
              </div>
            ))}
          </Card>

          <Card>
            <Label>Kharmas note</Label>
            <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              {data.kharmasNote}
            </p>
          </Card>
        </div>
      )}

      {showFull && sub === 'afflictions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <ChartScopeToggle
            value={scope}
            onChange={setScope}
            chartCount={activeAfflictions.length}
            totalCount={data.afflictions.length}
          />
          {scope === 'chart' && activeAfflictions.length === 0 && (
            <EmptyForChart>No Rahu, Ketu, Saturn, debilitation or Aquarius pressure on this Sun.</EmptyForChart>
          )}
          <Card>
            <Label>Pitru Dosh</Label>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{data.pitruDosh.title}</span>
              <span style={{
                fontSize: '0.55rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                color: data.pitruDosh.active ? 'var(--rose)' : 'var(--text-muted)',
              }}>
                {data.pitruDosh.active ? 'Indicated' : 'Not indicated'}
              </span>
            </div>
            <p style={{ margin: '0.4rem 0 0', fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              {data.pitruDosh.detail}
            </p>
          </Card>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '0.55rem',
          }}>
            {(scope === 'chart' ? activeAfflictions : data.afflictions).map(f => (
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
            <Label>Methodology</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {data.methodology.map(m => <li key={m}>{m}</li>)}
            </ul>
            <div style={{ marginTop: '0.55rem', fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', gap: 4, alignItems: 'center' }}>
              <BookOpen size={12} aria-hidden />
              Sources: Matsya / Agni / Brahmanda Puranas · Rigveda Adityas · Ishopanishad
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

function Pill({
  children,
  gold,
  warn,
}: {
  children: React.ReactNode
  gold?: boolean
  warn?: boolean
}) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.22rem 0.5rem',
      borderRadius: 'var(--r-md)',
      border: '1px solid var(--border)',
      background: gold ? 'var(--gold-faint)' : warn ? 'rgba(224,123,142,0.1)' : 'var(--surface-2)',
      color: gold ? 'var(--text-gold)' : warn ? 'var(--rose)' : 'var(--text-secondary)',
      fontSize: '0.65rem',
      fontWeight: 700,
    }}>
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
