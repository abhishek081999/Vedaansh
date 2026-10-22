// ─────────────────────────────────────────────────────────────
//  src/components/ui/DigDrigChestaAnalysisPanel.tsx
//  Dig / Drig / Cheshta (+ Naisargika) interpretive panel
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useMemo, useState } from 'react'
import type { DashaNode, GrahaData, GrahaId, Rashi, ShadbalaResult } from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'
import {
  analyzeDigDrigChesta,
  DIG_CLASSICAL_MIN_VIRUPAS,
  CHESTA_CLASSICAL_MIN_VIRUPAS,
  DIG_SOFT_STRONG,
  softBandColor,
  softBandLabel,
  predictionToneColor,
  predictionToneLabel,
  drigPolarityColor,
} from '@/lib/engine/digDrigChestaAnalysis'
import { PanelShell } from '@/components/ui/patterns/PanelShell'

type Tab = 'overview' | 'dig' | 'drig' | 'chesta' | 'naisargika'

function Pill({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: '0.62rem',
        fontWeight: 700,
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

export function DigDrigChestaAnalysisPanel({
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
    () => analyzeDigDrigChesta(shadbala, { dashaNodes, grahas, ascRashi }),
    [shadbala, dashaNodes, grahas, ascRashi],
  )
  const [tab, setTab] = useState<Tab>('overview')
  const [active, setActive] = useState<GrahaId>('Su')

  if (!analysis) {
    return (
      <PanelShell
        title="Dig · Drig · Cheshta"
        empty={{ title: 'Analysis unavailable', description: 'Recalculate the chart to load Shadbala.' }}
      >
        {null}
      </PanelShell>
    )
  }

  if (compact) {
    const top = analysis.predictions.find((p) => p.topic === 'dig') ?? analysis.predictions[0]
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
          <div className="label-caps">Dig · Drig · Cheshta</div>
          <Pill>
            Dig {analysis.dig.meanVirupas.toFixed(0)} · Drig {analysis.drig.meanVirupas.toFixed(0)} · Ch{' '}
            {analysis.chesta.meanVirupas.toFixed(0)}
          </Pill>
        </div>
        {top && (
          <div style={{ marginTop: '0.35rem', fontSize: '0.7rem', lineHeight: 1.35 }}>
            <span style={{ fontWeight: 700, color: predictionToneColor(top.tone) }}>{top.title}: </span>
            <span style={{ color: 'var(--text-secondary)' }}>{top.text}</span>
          </div>
        )}
      </div>
    )
  }

  const digRow = analysis.dig.rows.find((r) => r.id === active)!
  const drigRow = analysis.drig.rows.find((r) => r.id === active)!
  const chestaRow = analysis.chesta.rows.find((r) => r.id === active)!

  return (
    <PanelShell title="Dig · Drig · Cheshta analysis" padding="sm">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
            background: 'linear-gradient(135deg, rgba(139,124,246,0.08), rgba(78,205,196,0.06))',
            padding: '0.7rem 0.8rem',
          }}
        >
          <div className="label-caps">Direction · associations · effort</div>
          <div style={{ marginTop: '0.25rem', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            Dig = how committed you are to a path (not whether it is right). Drig = who encourages vs restrains you.
            Cheshta = real effort invested. Naisargika = fixed natural light order.
          </div>
          <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
            <Pill color="var(--text-gold)">Dig mean {analysis.dig.meanVirupas.toFixed(0)} (strong ≥{DIG_SOFT_STRONG})</Pill>
            <Pill>Drig mean {analysis.drig.meanVirupas.toFixed(1)}</Pill>
            <Pill>Cheshta mean {analysis.chesta.meanVirupas.toFixed(0)}</Pill>
            <Pill>Classical Dig {DIG_CLASSICAL_MIN_VIRUPAS} · Ch {CHESTA_CLASSICAL_MIN_VIRUPAS}</Pill>
          </div>
        </div>

        <div style={{ display: 'inline-flex', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', overflow: 'hidden', flexWrap: 'wrap' }}>
          {([
            ['overview', 'Overview'],
            ['dig', 'Dig'],
            ['drig', 'Drig'],
            ['chesta', 'Cheshta'],
            ['naisargika', 'Naisargika'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              style={{
                padding: '0.3rem 0.65rem',
                fontSize: '0.68rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                background: tab === id ? 'var(--surface-3)' : 'transparent',
                color: tab === id ? 'var(--text-gold)' : 'var(--text-muted)',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.4rem' }}>
              <Stat label="Strongest Dig" value={GRAHA_NAMES[analysis.dig.strongestId]} sub={`${analysis.dig.rows.find((r) => r.id === analysis.dig.strongestId)?.virupas.toFixed(0)} V`} color="var(--teal)" />
              <Stat label="Weakest Dig" value={GRAHA_NAMES[analysis.dig.weakestId]} sub={`${analysis.dig.rows.find((r) => r.id === analysis.dig.weakestId)?.virupas.toFixed(0)} V`} color="var(--rose)" />
              <Stat label="Most + Drig" value={GRAHA_NAMES[analysis.drig.mostPositiveId]} sub={`${analysis.drig.rows.find((r) => r.id === analysis.drig.mostPositiveId)?.virupas.toFixed(1)}`} color="var(--teal)" />
              <Stat label="Most − Drig" value={GRAHA_NAMES[analysis.drig.mostNegativeId]} sub={`${analysis.drig.rows.find((r) => r.id === analysis.drig.mostNegativeId)?.virupas.toFixed(1)}`} color="var(--rose)" />
              <Stat label="Top Cheshta" value={GRAHA_NAMES[analysis.chesta.strongestId]} sub={`${analysis.chesta.rows.find((r) => r.id === analysis.chesta.strongestId)?.virupas.toFixed(0)} V`} color="var(--text-gold)" />
            </div>

            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              <strong style={{ color: 'var(--text-gold)' }}>Modality: </strong>
              {analysis.modality.note}
              {analysis.modality.relationshipNote ? ` ${analysis.modality.relationshipNote}` : ''}
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
                        borderLeft: `3px solid ${predictionToneColor(p.tone)}`,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.35rem', flexWrap: 'wrap' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.78rem' }}>{p.title}</div>
                        <Pill color={predictionToneColor(p.tone)}>{predictionToneLabel(p.tone)}</Pill>
                      </div>
                      {(p.basedOn || p.virupas != null) && (
                        <div style={{ marginTop: '0.15rem', fontSize: '0.62rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {p.basedOn ?? ''}
                          {p.basedOn && p.virupas != null ? ' · ' : ''}
                          {p.virupas != null ? `${Number(p.virupas).toFixed(0)} V` : ''}
                        </div>
                      )}
                      <div style={{ marginTop: '0.3rem', fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{p.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {(tab === 'dig' || tab === 'drig' || tab === 'chesta') && (
          <>
            <PlanetPicker active={active} onPick={setActive} />
            <div
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)',
                background: 'var(--surface-1)',
                padding: '0.65rem 0.7rem',
              }}
            >
              {tab === 'dig' && (
                <Detail
                  title={`${digRow.name} · Dig Bala`}
                  band={digRow.softBand}
                  virupas={digRow.virupas}
                  classicalOk={digRow.meetsClassicalMin}
                  classicalLabel="≥35"
                  note={digRow.note}
                  remedy={digRow.remedy}
                />
              )}
              {tab === 'drig' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800 }}>{drigRow.name} · Drig Bala</span>
                    <Pill color={drigPolarityColor(drigRow.polarity)}>{drigRow.polarity}</Pill>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Net {drigRow.virupas.toFixed(2)} Virupas
                    {drigRow.benefic != null ? ` · +${drigRow.benefic.toFixed(1)} benefic` : ''}
                    {drigRow.malefic != null ? ` · −${drigRow.malefic.toFixed(1)} malefic` : ''}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{drigRow.note}</div>
                  <div style={{ fontSize: '0.74rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-gold)' }}>Remedy: </span>
                    <span style={{ color: 'var(--text-secondary)' }}>{drigRow.remedy}</span>
                  </div>
                </div>
              )}
              {tab === 'chesta' && (
                <Detail
                  title={`${chestaRow.name} · Cheshta Bala`}
                  band={chestaRow.softBand}
                  virupas={chestaRow.virupas}
                  classicalOk={chestaRow.meetsClassicalMin}
                  classicalLabel="≥50"
                  note={`${chestaRow.effortTheme}. ${chestaRow.note}`}
                  remedy={chestaRow.remedy}
                />
              )}
            </div>
            <ScoreTable
              rows={
                tab === 'dig'
                  ? analysis.dig.rows.map((r) => ({ id: r.id, name: r.name, v: r.virupas, tag: softBandLabel(r.softBand), color: softBandColor(r.softBand) }))
                  : tab === 'drig'
                    ? analysis.drig.rows.map((r) => ({ id: r.id, name: r.name, v: r.virupas, tag: r.polarity, color: drigPolarityColor(r.polarity) }))
                    : analysis.chesta.rows.map((r) => ({ id: r.id, name: r.name, v: r.virupas, tag: softBandLabel(r.softBand), color: softBandColor(r.softBand) }))
              }
            />
          </>
        )}

        {tab === 'naisargika' && (
          <div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: '0.45rem', lineHeight: 1.45 }}>
              {analysis.naisargika.note}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-bright)' }}>
                  <th style={{ textAlign: 'left', padding: '0.3rem 0.4rem' }}>Rank</th>
                  <th style={{ textAlign: 'left', padding: '0.3rem 0.4rem' }}>Planet</th>
                  <th style={{ textAlign: 'right', padding: '0.3rem 0.4rem' }}>Virupas</th>
                </tr>
              </thead>
              <tbody>
                {analysis.naisargika.rows.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                    <td style={{ padding: '0.3rem 0.4rem', fontWeight: 700 }}>#{r.rank}</td>
                    <td style={{ padding: '0.3rem 0.4rem' }}>{r.name}</td>
                    <td style={{ padding: '0.3rem 0.4rem', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{r.virupas.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
          Dig classical floor {DIG_CLASSICAL_MIN_VIRUPAS} Virupas; Cheshta {CHESTA_CLASSICAL_MIN_VIRUPAS}. Soft Dig strong ≥{DIG_SOFT_STRONG}. Pair with
          Sthana + Kaal and house ownership for full readings.
        </div>
      </div>
    </PanelShell>
  )
}

function Stat({
  label,
  value,
  sub,
  color,
}: {
  label: string
  value: string
  sub: string
  color: string
}) {
  return (
    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', padding: '0.4rem 0.5rem' }}>
      <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontWeight: 800, color }}>{value}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)' }}>{sub}</div>
    </div>
  )
}

function PlanetPicker({ active, onPick }: { active: GrahaId; onPick: (id: GrahaId) => void }) {
  const ids: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa']
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '0.25rem' }}>
      {ids.map((id) => {
        const on = active === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => onPick(id)}
            style={{
              border: `1px solid ${on ? 'var(--border-bright)' : 'var(--border)'}`,
              borderRadius: 'var(--r-sm)',
              background: on ? 'var(--surface-3)' : 'var(--surface-2)',
              padding: '0.35rem 0.2rem',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '0.72rem',
            }}
          >
            {id}
          </button>
        )
      })}
    </div>
  )
}

function Detail({
  title,
  band,
  virupas,
  classicalOk,
  classicalLabel,
  note,
  remedy,
}: {
  title: string
  band: 'strong' | 'baseline' | 'weak'
  virupas: number
  classicalOk: boolean
  classicalLabel: string
  note: string
  remedy: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
        <span style={{ fontWeight: 800 }}>{title}</span>
        <Pill color={softBandColor(band)}>{softBandLabel(band)}</Pill>
        {classicalOk ? <Pill color="var(--teal)">{classicalLabel}</Pill> : <Pill color="var(--rose)">Below floor</Pill>}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
        {virupas.toFixed(1)} Virupas · {(virupas / 60).toFixed(3)} Rupas
      </div>
      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{note}</div>
      <div style={{ fontSize: '0.74rem' }}>
        <span style={{ fontWeight: 700, color: 'var(--text-gold)' }}>Remedy: </span>
        <span style={{ color: 'var(--text-secondary)' }}>{remedy}</span>
      </div>
    </div>
  )
}

function ScoreTable({
  rows,
}: {
  rows: Array<{ id: string; name: string; v: number; tag: string; color: string }>
}) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-bright)' }}>
            <th style={{ textAlign: 'left', padding: '0.3rem 0.4rem' }}>Planet</th>
            <th style={{ textAlign: 'right', padding: '0.3rem 0.4rem' }}>Virupas</th>
            <th style={{ textAlign: 'right', padding: '0.3rem 0.4rem' }}>Read</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
              <td style={{ padding: '0.3rem 0.4rem', fontWeight: 700 }}>{r.name}</td>
              <td style={{ padding: '0.3rem 0.4rem', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{r.v.toFixed(1)}</td>
              <td style={{ padding: '0.3rem 0.4rem', textAlign: 'right', color: r.color, fontWeight: 700 }}>{r.tag}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
