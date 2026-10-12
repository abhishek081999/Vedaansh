'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/numerology/NumerologyPredictionsSection.tsx
//  Life-area predictions, maturity / pinnacles / challenges,
//  number yogas, annual + monthly forecast
// ─────────────────────────────────────────────────────────────

import React, { useState } from 'react'
import type { ChartOutput } from '@/types/astrology'
import type { NumerologyReport } from '@/lib/engine/numerology/calc'
import { HarmonyPill, KeyValue, NumberOrb, SectionCard, gridColumns } from './shared'
import { DashaNumberBridgePanel } from './DashaNumberBridge'

const TONE_COLOR = {
  favourable: 'var(--teal)',
  mixed: 'var(--gold)',
  caution: 'var(--rose)',
} as const

const YOGA_COLOR = {
  raj: 'var(--teal)',
  dhana: 'var(--gold)',
  mixed: 'var(--text-gold)',
  dosha: 'var(--rose)',
} as const

type SubTab = 'life' | 'year' | 'structure' | 'dasha'

export function NumerologyPredictionsSection({
  report,
  chart = null,
}: {
  report: NumerologyReport
  chart?: ChartOutput | null
}) {
  const { predictions: p } = report
  const [sub, setSub] = useState<SubTab>('life')
  const presentYogas = p.yogas.filter(y => y.present)
  const activePinnacle = p.pinnacles.find(x => x.active)
  const activePhase = p.lifePhases.find(x => x.active)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={gridColumns(160)}>
        <MiniStat label="Age now" value={String(p.ageNow)} />
        <MiniStat label="Maturity no." value={String(p.maturity.value)} hint={`activates ~${p.maturity.activatesAroundAge}`} />
        <MiniStat label="Active pinnacle" value={activePinnacle ? String(activePinnacle.value) : '—'} hint={activePinnacle?.theme} />
        <MiniStat label="Life phase" value={activePhase ? activePhase.rulingLabel.split(' ')[0]! : '—'} hint={activePhase?.label} />
      </div>

      <div className="tab-bar" role="tablist" aria-label="Prediction views">
        {([
          { id: 'life' as const, label: 'Life Areas' },
          { id: 'year' as const, label: 'This Year & Months' },
          { id: 'structure' as const, label: 'Pinnacles, Yogas & Challenges' },
          { id: 'dasha' as const, label: 'Dasha Timing' },
        ]).map(t => (
          <button key={t.id} type="button" role="tab" aria-selected={sub === t.id} className={`tab-btn${sub === t.id ? ' active' : ''}`} onClick={() => setSub(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {sub === 'life' && (
        <>
          <SectionCard title="Maturity Number" subtitle={`Moolank ${report.moolank.value} + Bhagyank ${report.bhagyank.value} = ${p.maturity.compound} → ${p.maturity.value}. The personality that emerges after ~35.`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <NumberOrb value={p.maturity.value} size={56} />
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{p.maturity.meaning}</p>
            </div>
          </SectionCard>

          <SectionCard title="Life Area Predictions" subtitle="Based primarily on Moolank, coloured by harmony with Bhagyank.">
            <div style={gridColumns(280)}>
              {p.lifeAreas.map(a => (
                <div key={a.id} style={{ padding: '0.85rem', borderRadius: 'var(--r-md)', background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderLeft: `3px solid ${TONE_COLOR[a.tone]}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{a.label}</strong>
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: TONE_COLOR[a.tone] }}>{a.tone}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-gold)', marginBottom: '0.25rem' }}>{a.summary}</div>
                  <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{a.detail}</p>
                  <div style={{ marginTop: '0.4rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{a.timing}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          {activePhase && (
            <SectionCard title="Current Life Phase" accent="var(--gold)">
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                <strong style={{ color: 'var(--text-gold)' }}>{activePhase.label}</strong> — ruled by {activePhase.rulingLabel}. {activePhase.description}
              </p>
            </SectionCard>
          )}
        </>
      )}

      {sub === 'year' && (
        <>
          <SectionCard title={`Personal Year ${p.annual.personalYear} — ${p.annual.theme}`} accent="var(--gold)" subtitle={`Birthday-to-birthday cycle starting ${report.cycles.cycleYear}`}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{p.annual.overview}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.76rem' }}>
              {p.annual.favourableMonths.length > 0 && (
                <span style={{ color: 'var(--teal)' }}>Favourable months: {p.annual.favourableMonths.map(m => MONTH[m - 1]).join(', ')}</span>
              )}
              {p.annual.criticalMonths.length > 0 && (
                <span style={{ color: 'var(--rose)' }}>Caution months: {p.annual.criticalMonths.map(m => MONTH[m - 1]).join(', ')}</span>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Area Outlook This Year">
            <div style={gridColumns(240)}>
              {p.annual.areas.map(a => (
                <div key={a.area} style={{ padding: '0.7rem', borderRadius: 'var(--r-md)', background: 'var(--surface-2)', borderLeft: `3px solid ${TONE_COLOR[a.outlook]}` }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{a.label}</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{a.text}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="12-Month Forecast" subtitle="Personal month = personal year + calendar month, reduced. Harmony is vs your Moolank.">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', minWidth: 480 }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', textAlign: 'left' }}>
                    {['Month', 'Pers. month', 'Theme', 'Harmony', 'Guidance'].map(h => (
                      <th key={h} style={{ padding: '0.4rem 0.5rem', fontSize: '0.64rem', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border-soft)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {p.monthly.map(m => (
                    <tr key={m.month} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                      <td style={{ padding: '0.4rem 0.5rem', fontWeight: 600 }}>{m.monthName}</td>
                      <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-gold)', fontWeight: 700 }}>{m.personalMonth}</td>
                      <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{m.theme}</td>
                      <td style={{ padding: '0.4rem 0.5rem' }}><HarmonyPill harmony={m.harmony} /></td>
                      <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.72rem' }}>{m.guidance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </>
      )}

      {sub === 'structure' && (
        <>
          <SectionCard title="Life Pinnacles" subtitle="Four chapters of life. First pinnacle length = 36 − Bhagyank.">
            <div style={gridColumns(220)}>
              {p.pinnacles.map(pin => (
                <div key={pin.index} style={{
                  padding: '0.85rem', borderRadius: 'var(--r-md)',
                  background: pin.active ? 'var(--gold-faint)' : 'var(--surface-2)',
                  border: `1px solid ${pin.active ? 'var(--border-bright)' : 'var(--border-soft)'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                    <NumberOrb value={pin.value} size={40} muted={!pin.active} />
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>Pinnacle {pin.index}{pin.active ? ' · now' : ''}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        Ages {pin.fromAge}{pin.toAge != null ? `–${pin.toAge}` : '+'}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-gold)', fontWeight: 600 }}>{pin.theme}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginTop: 2 }}>{pin.guidance}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Life Challenges" subtitle="Lessons derived from differences between day, month and year roots.">
            {p.challenges.map(c => (
              <div key={c.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <NumberOrb value={c.value} size={36} />
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{c.label}</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{c.lesson}</div>
                </div>
              </div>
            ))}
          </SectionCard>

          <SectionCard title="Number Yogas" subtitle="Classical Anka combinations from core numbers and the grid.">
            {presentYogas.length === 0 ? (
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>No major yogas present right now — build them via name correction and missing-number remedies.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {presentYogas.map(y => (
                  <div key={y.id} style={{ padding: '0.65rem 0.75rem', borderRadius: 'var(--r-md)', background: 'var(--surface-2)', borderLeft: `3px solid ${YOGA_COLOR[y.quality]}` }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: YOGA_COLOR[y.quality] }}>{y.name}</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{y.meaning}</div>
                  </div>
                ))}
              </div>
            )}
            <details style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              <summary style={{ cursor: 'pointer', color: 'var(--text-gold)' }}>Show all yoga checks ({p.yogas.length})</summary>
              <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.1rem', lineHeight: 1.55 }}>
                {p.yogas.map(y => (
                  <li key={y.id} style={{ color: y.present ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                    {y.present ? '●' : '○'} {y.name}
                  </li>
                ))}
              </ul>
            </details>
          </SectionCard>

          <SectionCard title="Life Phases">
            <div style={gridColumns(240)}>
              {p.lifePhases.map(ph => (
                <div key={ph.id} style={{
                  padding: '0.75rem', borderRadius: 'var(--r-md)',
                  background: ph.active ? 'var(--gold-faint)' : 'var(--surface-2)',
                  border: `1px solid ${ph.active ? 'var(--border-bright)' : 'var(--border-soft)'}`,
                }}>
                  <KeyValue label={ph.active ? `${ph.label} · current` : ph.label} value={`${ph.rulingLabel} · ages ${ph.ageFrom}${ph.ageTo != null ? `–${ph.ageTo}` : '+'}`} />
                  <p style={{ margin: '0.35rem 0 0', fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>{ph.description}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </>
      )}

      {sub === 'dasha' && <DashaNumberBridgePanel report={report} chart={chart} />}
    </div>
  )
}

const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function MiniStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div style={{ padding: '0.75rem', borderRadius: 'var(--r-md)', background: 'var(--surface-1)', border: '1px solid var(--border-soft)' }}>
      <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', color: 'var(--text-gold)', fontWeight: 600 }}>{value}</div>
      {hint && <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>{hint}</div>}
    </div>
  )
}
