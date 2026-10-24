'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/MilanMatchMakingPanel.tsx
//  Match reading sequence and house-first chart overlay
// ─────────────────────────────────────────────────────────────

import React, { useMemo, useState } from 'react'
import type { ChartOutput, UserPlan } from '@/types/astrology'
import { analyzeMatchMaking } from '@/lib/engine/matchMaking'
import { LIFE_TONE, NoteCards, SectionLabel } from '@/components/ui/marriedLifeUi'
import { PlanGate } from '@/components/ui/patterns/PlanGate'
import { planMeetsUiGate } from '@/lib/ui/planGate'

interface Props {
  chartA: ChartOutput
  chartB: ChartOutput
  userPlan?: UserPlan
}

export function MilanMatchMakingPanel({ chartA, chartB, userPlan = 'free' }: Props) {
  const data = useMemo(() => analyzeMatchMaking(chartA, chartB), [chartA, chartB])
  const full = planMeetsUiGate(userPlan, 'gold')
  const [varga, setVarga] = useState('D9')

  if (!data) {
    return (
      <div className="card" style={{ padding: '1.2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        Both charts need a calculated ascendant (lagna) before this match reading can run.
      </div>
    )
  }

  const active = data.vargas.find(v => v.code === varga) ?? data.vargas[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <div className="card" style={{ padding: '1.25rem', borderLeft: `4px solid ${LIFE_TONE[data.lagna.tone]}` }}>
        <h3 className="label-caps" style={{ margin: '0 0 0.4rem', fontSize: '0.72rem' }}>Match reading, step by step</h3>
        <div style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: 6 }}>{data.headline}</div>
        <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{data.summary}</p>
        <p style={{ margin: '0.7rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
          {data.lagna.nameA} lagna × {data.lagna.nameB} lagna · {data.lagna.level}. {data.lagna.reason}
        </p>
        {data.elementNote && (
          <p style={{ margin: '0.45rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{data.elementNote}</p>
        )}
      </div>

      {!full && (
        <PlanGate userPlan={userPlan} required="gold" featureName="Match reading">
          <div style={{ minHeight: 96, padding: '1rem', background: 'var(--surface-2)', borderRadius: 'var(--r-md)' }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>The rest of the match reading is on the Gold plan</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              The step-by-step sequence, the four pillars and the divisional chart overlay for both charts.
            </div>
          </div>
        </PlanGate>
      )}

      {full && <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
        {data.steps.map(step => (
          <article key={step.id} className="card" style={{ padding: '0.9rem 1rem', borderLeft: `4px solid ${LIFE_TONE[step.tone]}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'baseline' }}>
              <strong style={{ fontSize: '0.86rem' }}>{step.order}. {step.title}</strong>
              <span style={{ fontSize: '0.72rem', color: LIFE_TONE[step.tone], fontWeight: 700 }}>{step.mark}</span>
            </div>
            <p style={{ margin: '0.4rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{step.detail}</p>
          </article>
        ))}
      </div>

      <div className="card" style={{ padding: '1.1rem' }}>
        <SectionLabel>Four pillars</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '0.6rem' }}>
          {data.pillars.map(p => (
            <div key={p.id} style={{ padding: '0.75rem', borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', borderTop: `3px solid ${LIFE_TONE[p.tone]}` }}>
              <div style={{ fontWeight: 750, fontSize: '0.8rem' }}>{p.title}</div>
              <div style={{ fontSize: '0.72rem', color: LIFE_TONE[p.tone], margin: '0.15rem 0 0.3rem' }}>{p.mark}</div>
              <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{p.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: '1.1rem' }}>
        <SectionLabel>Divisional chart overlay: planets in the same house across both charts</SectionLabel>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem' }}>
          {data.vargas.map(v => (
            <button
              key={v.code}
              type="button"
              onClick={() => setVarga(v.code)}
              style={{
                padding: '0.35rem 0.65rem',
                borderRadius: 999,
                border: `1px solid ${varga === v.code ? 'var(--text-gold)' : 'var(--border)'}`,
                background: varga === v.code ? 'var(--surface-3)' : 'transparent',
                color: varga === v.code ? 'var(--text-gold)' : 'var(--text-muted)',
                fontSize: '0.72rem',
                cursor: 'pointer',
              }}
            >
              {v.code}{v.score == null ? '' : ` ${v.score}`}
            </button>
          ))}
        </div>
        {active && (
          <>
            <p style={{ margin: '0 0 0.65rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              <strong>{active.name}.</strong> {active.summary}
            </p>
            <NoteCards notes={active.hits.map(h => ({ id: h.id, title: h.title, detail: h.detail, tone: h.tone }))} />
          </>
        )}
      </div>
      </>}
    </div>
  )
}
