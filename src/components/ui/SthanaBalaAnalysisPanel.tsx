// ─────────────────────────────────────────────────────────────
//  src/components/ui/SthanaBalaAnalysisPanel.tsx
//  Sthana Bala (positional / space strength) interpretive panel
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useMemo, useState } from 'react'
import type { DashaNode, GrahaData, GrahaId, ShadbalaResult } from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'
import {
  analyzeSthanaBala,
  STHANA_CLASSICAL_MIN_VIRUPAS,
  STHANA_SATURN_USABLE,
  STHANA_SOFT_ABOVE_AVG,
  STHANA_SOFT_BASELINE,
  sthanaSoftBandColor,
  sthanaSoftBandLabel,
  type SthanaPlanetAnalysis,
  type SthanaPredictionTone,
} from '@/lib/engine/sthanaBalaAnalysis'
import { PanelShell } from '@/components/ui/patterns/PanelShell'

const ORDER: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa']

function profileColor(profile: string): string {
  if (profile === 'above_average') return 'var(--teal)'
  if (profile === 'struggling') return 'var(--rose)'
  return 'var(--text-gold)'
}

function profileTitle(profile: string): string {
  if (profile === 'above_average') return 'Above average'
  if (profile === 'struggling') return 'Struggling'
  return 'Mixed'
}

function toneColor(tone: SthanaPredictionTone): string {
  if (tone === 'favorable') return 'var(--teal)'
  if (tone === 'supportive') return 'var(--text-gold)'
  if (tone === 'caution') return 'var(--rose)'
  return 'var(--amber)'
}

function toneLabel(tone: SthanaPredictionTone): string {
  if (tone === 'favorable') return 'Favorable'
  if (tone === 'supportive') return 'Supportive'
  if (tone === 'caution') return 'Caution'
  return 'Mixed'
}

function Pill({
  children,
  color,
}: {
  children: React.ReactNode
  color?: string
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: '0.62rem',
        fontWeight: 700,
        letterSpacing: '0.02em',
        padding: '0.12rem 0.4rem',
        borderRadius: 'var(--r-sm)',
        border: '1px solid var(--border)',
        background: 'var(--surface-2)',
        color: color ?? 'var(--text-secondary)',
      }}
    >
      {children}
    </span>
  )
}

function PlanetDetail({ row }: { row: SthanaPlanetAnalysis }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
        <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{row.name}</span>
        <Pill color={sthanaSoftBandColor(row.softBand)}>{sthanaSoftBandLabel(row.softBand)}</Pill>
        {row.meetsClassicalMin ? <Pill color="var(--teal)">≥165 classical</Pill> : <Pill color="var(--rose)">Below 165</Pill>}
        {row.id === 'Sa' && row.virupas >= STHANA_SATURN_USABLE && row.virupas < STHANA_SOFT_ABOVE_AVG ? (
          <Pill color="var(--amber)">Saturn usable ≥{STHANA_SATURN_USABLE}</Pill>
        ) : null}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
        {row.virupas.toFixed(1)} Virupas · {row.rupas.toFixed(3)} Rupas · classical {(row.classicalRatio * 100).toFixed(0)}% of {STHANA_CLASSICAL_MIN_VIRUPAS}
      </div>
      {row.spaceThemes.length > 0 && (
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          Space themes: {row.spaceThemes.join(' · ')}
        </div>
      )}
      {row.bodyCue && (
        <div style={{ fontSize: '0.74rem', color: 'var(--rose)', borderLeft: '2px solid var(--rose)', paddingLeft: '0.5rem' }}>
          {row.bodyCue}
        </div>
      )}
      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
        <span style={{ fontWeight: 700, color: 'var(--text-gold)' }}>Remedy focus: </span>
        {row.remedy}
      </div>
      {row.breakdown && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '0.3rem' }}>
          {(
            [
              ['Uccha', row.breakdown.uccha],
              ['Saptavarga', row.breakdown.saptavargaja],
              ['Ojhayugma', row.breakdown.ojhayugma],
              ['Kendradi', row.breakdown.kendradi],
              ['Drekkana', row.breakdown.drekkana],
            ] as const
          ).map(([label, val]) => (
            <div
              key={label}
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border-soft)',
                borderRadius: 'var(--r-sm)',
                padding: '0.28rem 0.35rem',
              }}
            >
              <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>{label}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700 }}>{val.toFixed(1)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function SthanaBalaAnalysisPanel({
  shadbala,
  dashaNodes,
  grahas,
  compact = false,
}: {
  shadbala: ShadbalaResult
  dashaNodes?: DashaNode[]
  grahas?: GrahaData[]
  compact?: boolean
}) {
  const analysis = useMemo(
    () => analyzeSthanaBala(shadbala, { dashaNodes, grahas }),
    [shadbala, dashaNodes, grahas],
  )
  const [active, setActive] = useState<GrahaId>('Su')

  if (!analysis) {
    return (
      <PanelShell
        title="Sthana Bala analysis"
        empty={{ title: 'Sthana analysis unavailable', description: 'Recalculate the chart to load Shadbala.' }}
      >
        {null}
      </PanelShell>
    )
  }

  const activeRow = analysis.rows.find((r) => r.id === active) ?? analysis.rows[0]

  if (compact) {
    const topPred = analysis.predictions.find((p) => p.topic === 'career') ?? analysis.predictions[0]
    return (
      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-sm)',
          background: 'var(--surface-2)',
          padding: '0.5rem 0.55rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="label-caps">Sthana profile</div>
          <Pill color={profileColor(analysis.profile)}>{profileTitle(analysis.profile)}</Pill>
        </div>
        <div style={{ marginTop: '0.25rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{analysis.summary}</div>
        {topPred && (
          <div style={{ marginTop: '0.35rem', fontSize: '0.7rem', color: toneColor(topPred.tone), lineHeight: 1.35 }}>
            <span style={{ fontWeight: 700 }}>{topPred.title}: </span>
            <span style={{ color: 'var(--text-secondary)' }}>{topPred.text}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <PanelShell title="Sthana Bala analysis" padding="sm">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
            background: 'linear-gradient(135deg, rgba(166,124,0,0.08), rgba(78,205,196,0.06))',
            padding: '0.7rem 0.8rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <div className="label-caps">Lifetime space strength</div>
              <div style={{ marginTop: '0.2rem', fontWeight: 800, fontSize: '0.92rem', color: profileColor(analysis.profile) }}>
                {profileTitle(analysis.profile)} · mean {analysis.meanVirupas.toFixed(0)} Virupas
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
              <Pill>Soft ≥{STHANA_SOFT_ABOVE_AVG}</Pill>
              <Pill>Baseline {STHANA_SOFT_BASELINE}</Pill>
              <Pill>Classical {STHANA_CLASSICAL_MIN_VIRUPAS}</Pill>
            </div>
          </div>
          <div style={{ marginTop: '0.35rem', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>{analysis.profileNote}</div>
          <div style={{ marginTop: '0.25rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{analysis.summary}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.4rem' }}>
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', padding: '0.4rem 0.5rem' }}>
            <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>Strongest Sthana</div>
            <div style={{ fontWeight: 800, color: 'var(--teal)' }}>{GRAHA_NAMES[analysis.strongestId]}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              {analysis.rows.find((r) => r.id === analysis.strongestId)?.virupas.toFixed(0)} V
            </div>
          </div>
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', padding: '0.4rem 0.5rem' }}>
            <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>Weakest Sthana</div>
            <div style={{ fontWeight: 800, color: 'var(--rose)' }}>{GRAHA_NAMES[analysis.weakestId]}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              {analysis.rows.find((r) => r.id === analysis.weakestId)?.virupas.toFixed(0)} V
            </div>
          </div>
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', padding: '0.4rem 0.5rem' }}>
            <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>Range / dips</div>
            <div style={{ fontWeight: 800 }}>
              {analysis.minVirupas.toFixed(0)}–{analysis.maxVirupas.toFixed(0)}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{analysis.dipCount} weak</div>
          </div>
        </div>

        {analysis.predictions.length > 0 && (
          <div>
            <div className="label-caps" style={{ marginBottom: '0.4rem' }}>Predictions</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.45rem' }}>
              {analysis.predictions.map((p) => (
                <div
                  key={p.id}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-sm)',
                    background: 'var(--surface-2)',
                    padding: '0.55rem 0.6rem',
                    borderLeft: `3px solid ${toneColor(p.tone)}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.78rem' }}>{p.title}</div>
                    <Pill color={toneColor(p.tone)}>{toneLabel(p.tone)}</Pill>
                  </div>
                  {(p.basedOn || p.virupas != null) && (
                    <div style={{ marginTop: '0.15rem', fontSize: '0.62rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {p.basedOn ?? ''}
                      {p.basedOn && p.virupas != null ? ' · ' : ''}
                      {p.virupas != null ? `${p.virupas.toFixed(0)} V` : ''}
                    </div>
                  )}
                  <div style={{ marginTop: '0.3rem', fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {p.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(analysis.dasha.current || analysis.dasha.next) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.45rem' }}>
            {[analysis.dasha.current, analysis.dasha.next].filter(Boolean).map((cue) => (
              <div
                key={cue!.role}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-sm)',
                  background: 'var(--surface-2)',
                  padding: '0.5rem 0.55rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.35rem', alignItems: 'center' }}>
                  <div className="label-caps">{cue!.role === 'current' ? 'Current MD' : 'Next MD'}</div>
                  <Pill color={sthanaSoftBandColor(cue!.softBand)}>{sthanaSoftBandLabel(cue!.softBand)}</Pill>
                </div>
                <div style={{ marginTop: '0.2rem', fontWeight: 800 }}>
                  {cue!.lordName}
                  {cue!.viaDispositor && cue!.scoredName ? (
                    <span style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.72rem' }}> → {cue!.scoredName}</span>
                  ) : null}
                </div>
                {cue!.virupas != null && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {cue!.virupas.toFixed(0)} Virupas
                  </div>
                )}
                <div style={{ marginTop: '0.3rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {cue!.note}
                </div>
              </div>
            ))}
          </div>
        )}

        <div>
          <div className="label-caps" style={{ marginBottom: '0.4rem' }}>Per-planet Sthana</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '0.25rem' }}>
            {ORDER.map((id) => {
              const row = analysis.rows.find((r) => r.id === id)!
              const on = active === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActive(id)}
                  style={{
                    border: `1px solid ${on ? 'var(--border-bright)' : 'var(--border)'}`,
                    borderRadius: 'var(--r-sm)',
                    background: on ? 'var(--surface-3)' : 'var(--surface-2)',
                    padding: '0.35rem 0.2rem',
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '0.72rem' }}>{id}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: sthanaSoftBandColor(row.softBand), fontWeight: 700 }}>
                    {row.virupas.toFixed(0)}
                  </div>
                </button>
              )
            })}
          </div>
          <div
            style={{
              marginTop: '0.5rem',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              background: 'var(--surface-1)',
              padding: '0.65rem 0.7rem',
            }}
          >
            {activeRow ? <PlanetDetail row={activeRow} /> : null}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-bright)' }}>
                <th style={{ textAlign: 'left', padding: '0.3rem 0.4rem' }}>Planet</th>
                <th style={{ textAlign: 'right', padding: '0.3rem 0.4rem' }}>Virupas</th>
                <th style={{ textAlign: 'right', padding: '0.3rem 0.4rem' }}>Soft</th>
                <th style={{ textAlign: 'right', padding: '0.3rem 0.4rem' }}>vs 165</th>
              </tr>
            </thead>
            <tbody>
              {analysis.rows.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                  <td style={{ padding: '0.3rem 0.4rem', fontWeight: 700 }}>{r.name}</td>
                  <td style={{ padding: '0.3rem 0.4rem', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{r.virupas.toFixed(1)}</td>
                  <td style={{ padding: '0.3rem 0.4rem', textAlign: 'right', color: sthanaSoftBandColor(r.softBand), fontWeight: 700 }}>
                    {sthanaSoftBandLabel(r.softBand)}
                  </td>
                  <td style={{ padding: '0.3rem 0.4rem', textAlign: 'right', fontFamily: 'var(--font-mono)', color: r.meetsClassicalMin ? 'var(--teal)' : 'var(--rose)' }}>
                    {(r.classicalRatio * 100).toFixed(0)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
          Soft bands (~100 / 135–145+) are practice heuristics for life-space reading. Classical % uses the {STHANA_CLASSICAL_MIN_VIRUPAS} Virupa
          Sthana floor. High Sthana is capacity — always pair with house ownership and dashas.
        </div>
      </div>
    </PanelShell>
  )
}
