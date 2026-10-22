// ─────────────────────────────────────────────────────────────
//  src/components/ui/KalaBalaAnalysisPanel.tsx
//  Kaal Bala (temporal / time-luck strength) interpretive panel
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useMemo, useState } from 'react'
import type { DashaNode, GrahaData, GrahaId, Rashi, ShadbalaResult } from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'
import {
  analyzeKalaBala,
  KALA_CLASSICAL_MIN_VIRUPAS,
  KALA_SOFT_BASELINE,
  KALA_SOFT_STABLE,
  kalaPredictionToneColor,
  kalaPredictionToneLabel,
  kalaSoftBandColor,
  kalaSoftBandLabel,
  type KalaPlanetAnalysis,
} from '@/lib/engine/kalaBalaAnalysis'
import { PanelShell } from '@/components/ui/patterns/PanelShell'

const ORDER: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa']

function profileColor(profile: string): string {
  if (profile === 'stable') return 'var(--teal)'
  if (profile === 'weak') return 'var(--rose)'
  return 'var(--text-gold)'
}

function profileTitle(profile: string): string {
  if (profile === 'stable') return 'Stable time'
  if (profile === 'weak') return 'Weak time'
  return 'Fluctuating'
}

function careerTitle(path: string): string {
  if (path === 'job_ok') return 'Job OK'
  if (path === 'business_preferred') return 'Prefer business'
  return 'Mixed path'
}

function Pill({ children, color }: { children: React.ReactNode; color?: string }) {
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

function PlanetDetail({ row }: { row: KalaPlanetAnalysis }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
        <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{row.name}</span>
        <Pill color={kalaSoftBandColor(row.softBand)}>{kalaSoftBandLabel(row.softBand)}</Pill>
        {row.meetsClassicalMin ? <Pill color="var(--teal)">≥112 classical</Pill> : <Pill color="var(--rose)">Below 112</Pill>}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
        {row.virupas.toFixed(1)} Virupas · {row.rupas.toFixed(3)} Rupas · classical {(row.classicalRatio * 100).toFixed(0)}% of {KALA_CLASSICAL_MIN_VIRUPAS}
      </div>
      {row.themes.length > 0 && (
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Themes: {row.themes.join(' · ')}</div>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '0.3rem' }}>
          {(
            [
              ['Natha', row.breakdown.natha],
              ['Paksha', row.breakdown.paksha],
              ['Tribhaga', row.breakdown.tribhaga],
              ['Vaara', row.breakdown.vaara],
              ['Hora', row.breakdown.hora],
              ['Maasa', row.breakdown.maasa],
              ['Varsha', row.breakdown.varsha],
              ['Ayana', row.breakdown.ayana],
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

export function KalaBalaAnalysisPanel({
  shadbala,
  dashaNodes,
  grahas,
  ascRashi,
  compact = false,
}: {
  shadbala: ShadbalaResult
  dashaNodes?: DashaNode[]
  grahas?: GrahaData[]
  ascRashi?: Rashi
  compact?: boolean
}) {
  const analysis = useMemo(
    () => analyzeKalaBala(shadbala, { dashaNodes, grahas, ascRashi }),
    [shadbala, dashaNodes, grahas, ascRashi],
  )
  const [active, setActive] = useState<GrahaId>('Su')

  if (!analysis) {
    return (
      <PanelShell
        title="Kaal Bala analysis"
        empty={{ title: 'Kaal analysis unavailable', description: 'Recalculate the chart to load Shadbala.' }}
      >
        {null}
      </PanelShell>
    )
  }

  const activeRow = analysis.rows.find((r) => r.id === active) ?? analysis.rows[0]

  if (compact) {
    const top =
      analysis.predictions.find((p) => p.topic === 'job_vs_business') ??
      analysis.predictions.find((p) => p.topic === 'career') ??
      analysis.predictions[0]
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
          <div className="label-caps">Kaal profile</div>
          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
            <Pill color={profileColor(analysis.profile)}>{profileTitle(analysis.profile)}</Pill>
            <Pill>{careerTitle(analysis.careerPath)}</Pill>
          </div>
        </div>
        <div style={{ marginTop: '0.25rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{analysis.summary}</div>
        {top && (
          <div style={{ marginTop: '0.35rem', fontSize: '0.7rem', lineHeight: 1.35 }}>
            <span style={{ fontWeight: 700, color: kalaPredictionToneColor(top.tone) }}>{top.title}: </span>
            <span style={{ color: 'var(--text-secondary)' }}>{top.text}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <PanelShell title="Kaal Bala analysis" padding="sm">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
            background: 'linear-gradient(135deg, rgba(78,205,196,0.08), rgba(166,124,0,0.06))',
            padding: '0.7rem 0.8rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <div className="label-caps">Time luck strength</div>
              <div style={{ marginTop: '0.2rem', fontWeight: 800, fontSize: '0.92rem', color: profileColor(analysis.profile) }}>
                {profileTitle(analysis.profile)} · mean {analysis.meanVirupas.toFixed(0)} Virupas
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
              <Pill color="var(--text-gold)">{careerTitle(analysis.careerPath)}</Pill>
              <Pill>Soft ≥{KALA_SOFT_STABLE}</Pill>
              <Pill>Baseline {KALA_SOFT_BASELINE}</Pill>
              <Pill>Classical {KALA_CLASSICAL_MIN_VIRUPAS}</Pill>
            </div>
          </div>
          <div style={{ marginTop: '0.35rem', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>{analysis.profileNote}</div>
          <div style={{ marginTop: '0.35rem', fontSize: '0.74rem', color: 'var(--text-gold)', fontWeight: 600, lineHeight: 1.4 }}>
            {analysis.goldenRule}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.4rem' }}>
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', padding: '0.4rem 0.5rem' }}>
            <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>Strongest Kaal</div>
            <div style={{ fontWeight: 800, color: 'var(--teal)' }}>{GRAHA_NAMES[analysis.strongestId]}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              {analysis.rows.find((r) => r.id === analysis.strongestId)?.virupas.toFixed(0)} V
            </div>
          </div>
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', padding: '0.4rem 0.5rem' }}>
            <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>Weakest Kaal</div>
            <div style={{ fontWeight: 800, color: 'var(--rose)' }}>{GRAHA_NAMES[analysis.weakestId]}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              {analysis.rows.find((r) => r.id === analysis.weakestId)?.virupas.toFixed(0)} V
            </div>
          </div>
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', padding: '0.4rem 0.5rem' }}>
            <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>Spread / dips</div>
            <div style={{ fontWeight: 800 }}>{analysis.spreadVirupas.toFixed(0)}</div>
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
                    borderLeft: `3px solid ${kalaPredictionToneColor(p.tone)}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.78rem' }}>{p.title}</div>
                    <Pill color={kalaPredictionToneColor(p.tone)}>{kalaPredictionToneLabel(p.tone)}</Pill>
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

        {(analysis.dasha.previous || analysis.dasha.current || analysis.dasha.next) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.45rem' }}>
            {([analysis.dasha.previous, analysis.dasha.current, analysis.dasha.next] as const)
              .filter(Boolean)
              .map((cue) => (
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
                    <div className="label-caps">
                      {cue!.role === 'previous' ? 'Prev MD' : cue!.role === 'current' ? 'Current MD' : 'Next MD'}
                    </div>
                    <Pill color={kalaSoftBandColor(cue!.softBand)}>{kalaSoftBandLabel(cue!.softBand)}</Pill>
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

        {analysis.drains.some((d) => d.active) && (
          <div
            style={{
              border: '1px solid var(--border-soft)',
              borderRadius: 'var(--r-sm)',
              padding: '0.5rem 0.55rem',
              background: 'var(--surface-1)',
            }}
          >
            <div className="label-caps" style={{ marginBottom: '0.35rem' }}>
              Drain scan · {GRAHA_NAMES[analysis.dasha.current?.scoredId ?? analysis.dasha.next?.scoredId ?? analysis.weakestId]}
            </div>
            <div style={{ display: 'grid', gap: '0.3rem' }}>
              {analysis.drains
                .filter((d) => d.active)
                .map((d) => (
                  <div key={d.varga} style={{ fontSize: '0.72rem', color: 'var(--rose)', lineHeight: 1.4 }}>
                    <strong>{d.label}:</strong> {d.detail}
                  </div>
                ))}
            </div>
          </div>
        )}

        <div>
          <div className="label-caps" style={{ marginBottom: '0.4rem' }}>Per-planet Kaal</div>
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
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: kalaSoftBandColor(row.softBand), fontWeight: 700 }}>
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
                <th style={{ textAlign: 'right', padding: '0.3rem 0.4rem' }}>vs 112</th>
              </tr>
            </thead>
            <tbody>
              {analysis.rows.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                  <td style={{ padding: '0.3rem 0.4rem', fontWeight: 700 }}>{r.name}</td>
                  <td style={{ padding: '0.3rem 0.4rem', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{r.virupas.toFixed(1)}</td>
                  <td style={{ padding: '0.3rem 0.4rem', textAlign: 'right', color: kalaSoftBandColor(r.softBand), fontWeight: 700 }}>
                    {kalaSoftBandLabel(r.softBand)}
                  </td>
                  <td
                    style={{
                      padding: '0.3rem 0.4rem',
                      textAlign: 'right',
                      fontFamily: 'var(--font-mono)',
                      color: r.meetsClassicalMin ? 'var(--teal)' : 'var(--rose)',
                    }}
                  >
                    {(r.classicalRatio * 100).toFixed(0)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
          Soft bands (~100 / ≥130 stable) are practice heuristics for time-luck reading. Classical % uses the {KALA_CLASSICAL_MIN_VIRUPAS}{' '}
          Virupa Kaal floor. High Kaal is timing capacity — pair with Sthana, houses, and full Shadbala.
        </div>
      </div>
    </PanelShell>
  )
}
