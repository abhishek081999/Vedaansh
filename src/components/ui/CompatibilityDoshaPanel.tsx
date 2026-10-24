'use client'

import React, { useMemo } from 'react'
import { ChartOutput } from '@/types/astrology'
import { calculateManglik, calculatePapeSamya, type ManglikAnalysis } from '@/lib/engine/doshas'
import { getManglikTeaching } from '@/lib/engine/manglikTeaching'
import { analyzeDashaPair } from '@/lib/engine/milanExtras'

/** Manglik, Pape-Samya, and current/next dasha overlap for a pair. */
export function CompatibilityDoshaPanel({ chartA, chartB }: { chartA: ChartOutput; chartB?: ChartOutput }) {
  const m1 = useMemo(() => calculateManglik(chartA.grahas, [], chartA.lagnas.ascRashi), [chartA])
  const p1 = useMemo(() => calculatePapeSamya(chartA.grahas, chartA.lagnas.ascRashi), [chartA])
  
  const m2 = useMemo(() => chartB ? calculateManglik(chartB.grahas, [], chartB.lagnas.ascRashi) : null, [chartB])
  const p2 = useMemo(() => chartB ? calculatePapeSamya(chartB.grahas, chartB.lagnas.ascRashi) : null, [chartB])
  const dashaPair = useMemo(
    () => (chartB ? analyzeDashaPair(chartA, chartB) : null),
    [chartA, chartB],
  )

  const nameA = chartA.meta.name
  const nameB = chartB?.meta.name ?? 'Partner'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Manglik Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
        <ManglikCard name={nameA} analysis={m1} grahas={chartA.grahas} ascRashi={chartA.lagnas.ascRashi} />
        {chartB && m2 && (
          <ManglikCard name={nameB} analysis={m2} grahas={chartB.grahas} ascRashi={chartB.lagnas.ascRashi} />
        )}
      </div>

      {/* Pape Samya Balance */}
      {chartB && p1 && p2 && (
        <PapeSamyaComparison 
          p1={p1} p2={p2} 
          nameA={nameA} nameB={nameB} 
        />
      )}

      {dashaPair && (
        <div className="card" style={{ padding: '1.15rem' }}>
          <h3 className="label-caps" style={{ margin: '0 0 0.55rem', fontSize: '0.72rem' }}>Dasha pairing</h3>
          <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {dashaPair.summary}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {dashaPair.findings.slice(0, 6).map((f, i) => (
              <div key={`${f.title}-${i}`} style={{
                fontSize: '0.75rem',
                borderLeft: `3px solid ${f.tone === 'supportive' ? 'var(--teal)' : f.tone === 'caution' ? 'var(--rose)' : 'var(--text-gold)'}`,
                paddingLeft: '0.65rem',
              }}>
                <strong>{f.title}</strong>
                <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>{f.detail}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ 
        padding: '1rem', background: 'var(--surface-2)', borderRadius: 'var(--r-md)', 
        fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', border: '1px solid var(--border)' 
      }}>
        Manglik means Mars sits in a house traditionally linked to extra heat in partnership. Classical practice also looks at the balance of Mars and other difficult planets across both charts. Cancellation rules and age matter, and a Manglik chart is never a verdict on a relationship.
      </div>
    </div>
  )
}

function ManglikCard({
  name,
  analysis,
  grahas,
  ascRashi,
}: {
  name: string
  analysis: ManglikAnalysis
  grahas: ChartOutput['grahas']
  ascRashi: ChartOutput['lagnas']['ascRashi']
}) {
  const teaching = getManglikTeaching(analysis, grahas, ascRashi)
  const intensity = analysis.intensity

  const color =
    teaching.status === 'present'
      ? intensity === 'High'
        ? 'var(--rose)'
        : 'var(--amber)'
      : teaching.status === 'cancelled'
        ? 'var(--amber)'
        : 'var(--teal)'

  const title =
    teaching.status === 'present'
      ? 'Kuja (Manglik) Dosha'
      : teaching.status === 'cancelled'
        ? 'Manglik cancelled'
        : 'Non-Manglik'

  return (
    <div className="card" style={{
      padding: '1.25rem',
      border: `1px solid ${teaching.status === 'not_present' ? 'var(--border)' : color}`,
      background: `linear-gradient(135deg, var(--surface-1) 0%, ${color}05 100%)`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <div className="label-caps" style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{name}</div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: teaching.status === 'present' ? 'var(--text-primary)' : 'var(--teal)' }}>
            {title}
          </h3>
        </div>
        <div style={{
          padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800,
          background: `${color}15`, color, border: `1px solid ${color}30`,
        }}>
          {teaching.headline.toUpperCase()}
          {teaching.status === 'present' && intensity !== 'None' ? ` · ${intensity.toUpperCase()}` : ''}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {teaching.statusDetail}
        </div>
        {teaching.houseNote ? (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {teaching.houseNote}
          </div>
        ) : null}
        {teaching.cancellationNotes.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {teaching.cancellationNotes.map((c) => (
              <span
                key={c}
                style={{
                  fontSize: '0.65rem',
                  background: 'var(--teal-faint)',
                  color: 'var(--teal)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: '1px solid var(--teal)30',
                }}
              >
                {c}
              </span>
            ))}
          </div>
        ) : null}
        {teaching.perspectives ? (
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--text-gold)' }}>Scope:</strong> {teaching.perspectives.scopeLabel}
          </div>
        ) : null}
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {teaching.controlNote}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {teaching.overview}
        </div>
      </div>
    </div>
  )
}

function PapeSamyaComparison({ p1, p2, nameA, nameB }: { p1: any; p2: any; nameA: string; nameB: string }) {
  const w1 = p1.totalWeight
  const w2 = p2.totalWeight
  const max = Math.max(w1, w2, 4)
  const diff = Math.abs(w1 - w2)
  const isBalanced = diff <= 1.25

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <div className="label-caps" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Pape-Samya (balance of difficult planets)</div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Row Chart A */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 100, textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-gold)' }}>{nameA}</div>
          <div style={{ flex: 1, height: 10, background: 'var(--surface-3)', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ width: `${(w1/max)*100}%`, height: '100%', background: 'var(--rose)', opacity: 0.8 }} />
          </div>
          <div style={{ width: 40, fontSize: '0.85rem', fontWeight: 800 }}>{w1.toFixed(2)}</div>
        </div>

        {/* Row Chart B */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 100, textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)' }}>{nameB}</div>
          <div style={{ flex: 1, height: 10, background: 'var(--surface-3)', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ width: `${(w2/max)*100}%`, height: '100%', background: 'var(--rose)', opacity: 0.8 }} />
          </div>
          <div style={{ width: 40, fontSize: '0.85rem', fontWeight: 800 }}>{w2.toFixed(2)}</div>
        </div>

        <div style={{ 
          marginTop: '1rem', padding: '1rem', borderRadius: 'var(--r-md)', textAlign: 'center',
          background: isBalanced ? 'rgba(78,205,196,0.08)' : 'rgba(224,123,142,0.08)',
          border: `1px solid ${isBalanced ? 'var(--teal)' : 'var(--rose)'}30`,
          color: isBalanced ? 'var(--teal)' : 'var(--rose)',
          fontSize: '0.85rem'
        }}>
          {isBalanced ? (
            <span><strong>Balanced</strong>: the weight of difficult planets is shared fairly evenly between both charts.</span>
          ) : (
            <span><strong>Uneven</strong>: the weight of difficult planets differs between the charts ({diff.toFixed(2)} points). This is a tendency, and awareness and shared effort help.</span>
          )}
        </div>
      </div>
    </div>
  )
}
