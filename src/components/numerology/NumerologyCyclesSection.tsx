'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/numerology/NumerologyCyclesSection.tsx
//  Personal year / month / day, 9-year forecast, lucky dates
// ─────────────────────────────────────────────────────────────

import React from 'react'
import type { NumerologyReport } from '@/lib/engine/numerology/calc'
import { NUMBER_PROFILES, PERSONAL_YEAR_THEMES } from '@/lib/engine/numerology/data'
import { HarmonyPill, NumberOrb, SectionCard, gridColumns } from './shared'

export function NumerologyCyclesSection({ report }: { report: NumerologyReport }) {
  const { cycles, upcomingYears, luckyDates, moolank, predictions } = report
  const activePinnacle = predictions.pinnacles.find(x => x.active)
  const activePhase = predictions.lifePhases.find(x => x.active)
  const items = [
    { label: 'Personal Year', value: cycles.personalYear, detail: `${cycles.yearTheme.theme} · from birthday ${cycles.cycleYear}` },
    { label: 'Personal Month', value: cycles.personalMonth, detail: PERSONAL_YEAR_THEMES[cycles.personalMonth].theme },
    { label: 'Personal Day', value: cycles.personalDay, detail: PERSONAL_YEAR_THEMES[cycles.personalDay].theme },
    { label: 'Universal Day', value: cycles.universalDay, detail: `Ruled by ${NUMBER_PROFILES[cycles.universalDay].planet}` },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={gridColumns(200)}>
        {items.map(i => (
          <div key={i.label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem', borderRadius: 'var(--r-lg)', background: 'var(--surface-1)', border: '1px solid var(--border-soft)' }}>
            <NumberOrb value={i.value} size={50} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{i.label}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{i.detail}</div>
            </div>
          </div>
        ))}
      </div>

      {(activePhase || activePinnacle) && (
        <SectionCard title="Where you are in life" subtitle={`Age ${predictions.ageNow}`}>
          <div style={gridColumns(260)}>
            {activePhase && (
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-gold)' }}>{activePhase.label}</strong> — {activePhase.rulingLabel}. {activePhase.description}
              </p>
            )}
            {activePinnacle && (
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-gold)' }}>Pinnacle {activePinnacle.index} (number {activePinnacle.value})</strong> — {activePinnacle.theme}. {activePinnacle.guidance}
                {' '}Ages {activePinnacle.fromAge}{activePinnacle.toAge != null ? `–${activePinnacle.toAge}` : '+'}.
              </p>
            )}
          </div>
        </SectionCard>
      )}

      <SectionCard title={`Personal Year ${cycles.personalYear} — ${cycles.yearTheme.theme}`} accent="var(--gold)">
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{cycles.yearTheme.guidance}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Today&apos;s universal number {cycles.universalDay} with your Moolank {moolank.value}:
          </span>
          <HarmonyPill harmony={cycles.dayHarmony} />
        </div>
      </SectionCard>

      <SectionCard title="9-Year Forecast" subtitle="Personal year numbers run in 9-year cycles from birthday to birthday.">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: 420 }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)', textAlign: 'left' }}>
                {['Year', 'Age', 'Personal year', 'Theme', 'Harmony'].map(h => (
                  <th key={h} style={{ padding: '0.4rem 0.5rem', fontWeight: 600, fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border-soft)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {upcomingYears.map(y => (
                <tr key={y.year} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                  <td style={{ padding: '0.45rem 0.5rem', color: 'var(--text-primary)', fontWeight: 600 }}>{y.year}</td>
                  <td style={{ padding: '0.45rem 0.5rem', color: 'var(--text-muted)' }}>{y.age}</td>
                  <td style={{ padding: '0.45rem 0.5rem', color: 'var(--text-gold)', fontWeight: 700 }}>{y.personalYear}</td>
                  <td style={{ padding: '0.45rem 0.5rem', color: 'var(--text-secondary)' }}>{y.theme}</td>
                  <td style={{ padding: '0.45rem 0.5rem' }}><HarmonyPill harmony={y.harmony} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Lucky Dates of Every Month" subtitle="Dates whose root number harmonises with both Moolank and Bhagyank. Use them for launches, signings and important beginnings.">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 4, maxWidth: 420 }}>
          {Array.from({ length: 31 }, (_, i) => i + 1).map(d => {
            const tone = luckyDates.best.includes(d) ? 'best' : luckyDates.good.includes(d) ? 'good' : luckyDates.avoid.includes(d) ? 'avoid' : 'neutral'
            const color = tone === 'best' ? 'var(--teal)' : tone === 'good' ? 'var(--gold)' : tone === 'avoid' ? 'var(--rose)' : 'var(--text-muted)'
            return (
              <div key={d} title={tone} style={{
                padding: '0.4rem 0', textAlign: 'center', borderRadius: 'var(--r-sm)', fontSize: '0.8rem',
                fontWeight: tone === 'best' ? 700 : 500, color,
                background: tone === 'neutral' ? 'var(--surface-2)' : 'var(--surface-1)',
                border: `1px solid ${tone === 'neutral' ? 'var(--border-soft)' : color}`,
              }}>
                {d}
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.72rem' }}>
          <span style={{ color: 'var(--teal)' }}>■ Best</span>
          <span style={{ color: 'var(--gold)' }}>■ Good</span>
          <span style={{ color: 'var(--text-muted)' }}>■ Neutral</span>
          <span style={{ color: 'var(--rose)' }}>■ Avoid</span>
        </div>
      </SectionCard>

      <SectionCard title="Power Days" subtitle="Calendar dates whose root matches your Moolank (personal power) or Bhagyank (destiny). Best for interviews, launches and rituals.">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
          {predictions.powerDays.map(pd => (
            <span
              key={`${pd.day}-${pd.reason}`}
              title={pd.reason}
              style={{
                fontSize: '0.78rem', padding: '4px 10px', borderRadius: 'var(--r-sm)',
                background: pd.reason.includes('Moolank') ? 'var(--gold-faint)' : 'var(--surface-2)',
                border: '1px solid var(--border-soft)', color: 'var(--text-secondary)',
              }}
            >
              <strong style={{ color: 'var(--text-gold)' }}>{pd.day}</strong>
              {' · '}{pd.reason.includes('Moolank') ? 'Power' : 'Destiny'}
            </span>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
