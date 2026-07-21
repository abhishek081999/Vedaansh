// ─────────────────────────────────────────────────────────────
//  src/components/ui/AshtakavargaExtendedPanels.tsx
//  Prastara, Rekhas, Sodhya guide, Kakshya timeline panels
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Spinner } from '@/components/ui/primitives/Spinner'
import { ASHTAKAVARGA_CONTRIBUTORS } from '@/lib/engine/ashtakavarga'
import {
  aggregateKakshyaTimeline,
  buildKakshyaTransitWatch,
  kakshyaNote,
} from '@/lib/engine/ashtakavargaKakshya'
import { analyzeSodhyaPindas } from '@/lib/engine/ashtakavargaSodhyaGuide'
import type { AshtakavargaResult, GrahaData, Rashi } from '@/types/astrology'
import { RASHI_SHORT } from '@/types/astrology'
import styles from '@/components/ui/AshtakavargaWorkspace.module.css'

const BAV_PLANET_ORDER = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'As'] as const
type BavPlanet = (typeof BAV_PLANET_ORDER)[number]

const CONTRIBUTOR_LABELS: Record<string, string> = {
  Su: 'Sun', Mo: 'Moon', Ma: 'Mars', Me: 'Mercury', Ju: 'Jupiter', Ve: 'Venus', Sa: 'Saturn', As: 'Lagna',
}

const COLOR = {
  teal: 'var(--teal, #4fd1c5)',
  gold: 'var(--text-gold, #f6d365)',
  rose: 'var(--rose, #fb7185)',
  muted: 'var(--text-muted, #94a3b8)',
  secondary: 'var(--text-secondary, #cbd5e1)',
} as const

function rashiLabel(i: number): string {
  return RASHI_SHORT[(i + 1) as Rashi] ?? String(i + 1)
}

export function PrastaraTable({
  ashtakavarga,
  ascRashi,
  columnMode,
}: {
  ashtakavarga: AshtakavargaResult
  ascRashi: number
  columnMode: 'rasi' | 'house'
}) {
  const [planet, setPlanet] = useState<BavPlanet>('Su')
  const prastara = ashtakavarga.prastara?.[planet]

  if (!ashtakavarga.prastara) {
    return (
      <div className="card" style={{ padding: '0.8rem', color: COLOR.muted, fontSize: '0.78rem' }}>
        Recalculate the chart to load Prastara Ashtakavarga contributor grids.
      </div>
    )
  }

  const colIndices = Array.from({ length: 12 }, (_, i) => i)
  const colLabel = (i: number) => {
    if (columnMode === 'house') {
      const rashi = ((ascRashi - 1 + i) % 12) + 1
      return `H${i + 1}\n${RASHI_SHORT[rashi as Rashi]}`
    }
    return rashiLabel(i)
  }

  const reorderFlags = (flags: number[]) => {
    if (columnMode === 'rasi') return flags
    return colIndices.map((h) => {
      const rashi = ((ascRashi - 1 + h) % 12)
      return flags[rashi] ?? 0
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div className="card" style={{ padding: '0.75rem' }}>
        <p style={{ fontSize: '0.72rem', color: COLOR.secondary, marginBottom: '0.55rem', lineHeight: 1.45, marginTop: 0 }}>
          Prastara shows which of the 8 contributors (Su–Sa + Lagna) gave each bindu.
        </p>
        <div className={styles.planetGrid}>
          {BAV_PLANET_ORDER.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPlanet(p)}
              className={`${styles.planetBtn} ${planet === p ? styles.planetBtnActive : ''}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {prastara ? (
        <div className={`card no-scrollbar ${styles.tableWrap}`}>
          <div className={styles.tableHint}>Swipe horizontally to see all columns</div>
          <p style={{ fontSize: '0.78rem', fontWeight: 800, color: COLOR.gold, marginBottom: '0.45rem', marginTop: 0 }}>
            {planet} Prastara — contributor flags
          </p>
          <table className={styles.dataTable}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '0.35rem', position: 'sticky', left: 0, background: 'var(--surface-1)' }}>Contributor</th>
                {colIndices.map((i) => (
                  <th key={i} style={{ textAlign: 'center', padding: '0.35rem', fontSize: '0.65rem', whiteSpace: 'pre-line', lineHeight: 1.2 }}>
                    {colLabel(i)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ASHTAKAVARGA_CONTRIBUTORS.map((c) => {
                const flags = reorderFlags(prastara.byContributor[c] ?? Array(12).fill(0))
                return (
                  <tr key={c} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                    <td style={{ padding: '0.35rem', fontWeight: 700, position: 'sticky', left: 0, background: 'var(--surface-1)' }}>
                      {c} <span style={{ color: COLOR.muted, fontWeight: 500 }}>({CONTRIBUTOR_LABELS[c]})</span>
                    </td>
                    {flags.map((v, i) => (
                      <td
                        key={i}
                        style={{
                          textAlign: 'center',
                          padding: '0.3rem',
                          fontWeight: 800,
                          color: v ? COLOR.teal : COLOR.muted,
                          background: v ? 'color-mix(in srgb, var(--teal) 8%, transparent)' : 'transparent',
                        }}
                      >
                        {v ? '●' : '·'}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}

export function RekhasView({
  ashtakavarga,
  ascRashi,
  NorthIndianChart,
}: {
  ashtakavarga: AshtakavargaResult
  ascRashi: number
  NorthIndianChart: React.ComponentType<{
    valuesByRashi: number[]
    ascRashi: number
    title: string
    size?: number
  }>
}) {
  const rekhas = ashtakavarga.rekhas
  const [view, setView] = useState<'rekhas' | 'bindus'>('rekhas')

  if (!rekhas) {
    return (
      <div className="card" style={{ padding: '0.8rem', color: COLOR.muted, fontSize: '0.78rem' }}>
        Recalculate the chart to load Rekha (56 − SAV) values.
      </div>
    )
  }

  const display = view === 'rekhas' ? rekhas : ashtakavarga.sav
  const total = display.reduce((a, b) => a + b, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div className="card" style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.72rem', color: COLOR.secondary }}>
          Rekhas = 56 − SAV bindus per sign (resistance measure).
        </span>
        <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: '0.35rem' }}>
          {(['rekhas', 'bindus'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              style={{
                border: '1px solid var(--border)',
                background: view === v ? 'var(--gold-faint)' : 'var(--surface-1)',
                color: view === v ? 'var(--text-gold)' : 'var(--text-muted)',
                borderRadius: 'var(--r-sm)',
                padding: '0.28rem 0.55rem',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.68rem',
              }}
            >
              {v === 'rekhas' ? 'Rekhas' : 'SAV Bindus'}
            </button>
          ))}
        </span>
      </div>
      <NorthIndianChart valuesByRashi={display} ascRashi={ascRashi} title={view === 'rekhas' ? 'Rekha Chart (56 − SAV)' : 'SAV Bindu Chart'} size={320} />
      <div className="card" style={{ padding: '0.75rem', fontSize: '0.78rem', color: COLOR.secondary }}>
        Total {view === 'rekhas' ? 'Rekhas' : 'SAV'}: <b style={{ color: COLOR.teal }}>{total}</b>
      </div>
    </div>
  )
}

export function SodhyaGuidePanel({ ashtakavarga }: { ashtakavarga: AshtakavargaResult }) {
  const guide = useMemo(() => analyzeSodhyaPindas(ashtakavarga), [ashtakavarga])

  if (!guide) {
    return (
      <div className="card" style={{ padding: '0.8rem', color: COLOR.muted, fontSize: '0.78rem' }}>
        Recalculate the chart to load Sodhya Pinda interpretations.
      </div>
    )
  }

  const bandColor = (band: string) => {
    if (band === 'exceptional' || band === 'strong') return COLOR.teal
    if (band === 'weak') return COLOR.rose
    return COLOR.gold
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div className="card" style={{ padding: '0.85rem' }}>
        <p style={{ fontSize: '0.82rem', fontWeight: 800, color: COLOR.gold, marginBottom: '0.35rem', marginTop: 0 }}>Sodhya Pinda Guide</p>
        <p style={{ fontSize: '0.72rem', color: COLOR.secondary, lineHeight: 1.5, margin: 0 }}>{guide.summary}</p>
      </div>
      <div className={styles.sodhyaGrid}>
        {guide.readings.map((r) => (
          <div key={r.planet} className="card" style={{ padding: '0.65rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>{r.name}</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: bandColor(r.band) }}>{r.sodhyaPinda}</span>
            </div>
            <p style={{ fontSize: '0.65rem', color: bandColor(r.band), fontWeight: 700, marginBottom: '0.3rem', marginTop: 0 }}>{r.bandLabel}</p>
            <p style={{ fontSize: '0.68rem', color: COLOR.secondary, lineHeight: 1.45, margin: 0 }}>{r.reading}</p>
            <p style={{ fontSize: '0.65rem', color: COLOR.muted, marginTop: '0.35rem', lineHeight: 1.4, marginBottom: 0 }}>{r.eventNote}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function KakshyaTimeline({
  ashtakavarga,
  transitGrahas,
  ayanamsha,
}: {
  ashtakavarga: AshtakavargaResult
  transitGrahas?: GrahaData[]
  ayanamsha?: string
}) {
  const [timeline, setTimeline] = useState<ReturnType<typeof aggregateKakshyaTimeline> | null>(null)
  const [loading, setLoading] = useState(false)

  const currentRows = useMemo(() => {
    if (!transitGrahas?.length || !ashtakavarga.prastara) return []
    return buildKakshyaTransitWatch(ashtakavarga, transitGrahas)
  }, [ashtakavarga, transitGrahas])

  useEffect(() => {
    if (!ashtakavarga.prastara) return
    let cancelled = false
    const run = async () => {
      setLoading(true)
      try {
        const offsets = [0, 5, 10, 15, 20, 25, 30, 45, 60, 75, 90]
        const today = new Date()
        const samples = await Promise.all(offsets.map(async (offset) => {
          const d = new Date(today)
          d.setDate(today.getDate() + offset)
          const date = d.toISOString().slice(0, 10)
          const qs = new URLSearchParams({ date, ayanamsha: ayanamsha ?? 'lahiri' })
          const res = await fetch(`/api/transits/planets?${qs.toString()}`)
          const json = await res.json()
          const grahas: GrahaData[] = json?.success ? (json.grahas ?? []) : []
          return { date, grahas }
        }))
        if (!cancelled) setTimeline(aggregateKakshyaTimeline(samples, ashtakavarga))
      } catch {
        if (!cancelled) setTimeline(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => { cancelled = true }
  }, [ashtakavarga, ayanamsha])

  if (!ashtakavarga.prastara) {
    return (
      <div className="card" style={{ padding: '0.8rem', color: COLOR.muted, fontSize: '0.78rem' }}>
        Recalculate the chart to enable Kakshya degree-level transit timing.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div className="card" style={{ padding: '0.85rem' }}>
        <p style={{ fontSize: '0.82rem', fontWeight: 800, color: COLOR.gold, marginBottom: '0.35rem', marginTop: 0 }}>Kakshya Transit Watch (Now)</p>
        <p style={{ fontSize: '0.68rem', color: COLOR.muted, marginBottom: '0.45rem', lineHeight: 1.4, marginTop: 0 }}>
          Each sign has 8 kakshyas (3°45′ each). Favorable when the kakshya lord contributed a bindu in the planet BAV.
        </p>
        {currentRows.length === 0 ? (
          <p style={{ fontSize: '0.78rem', color: COLOR.secondary, margin: 0 }}>Transit data unavailable.</p>
        ) : (
          <div className={styles.cardGrid}>
            {currentRows.map((row) => (
              <div
                key={row.planet}
                style={{
                  border: `1px solid ${row.hasBindu ? 'color-mix(in srgb, var(--teal) 35%, var(--border-soft))' : 'color-mix(in srgb, var(--rose) 25%, var(--border-soft))'}`,
                  borderRadius: 'var(--r-sm)',
                  padding: '0.55rem',
                  background: 'var(--surface-1)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>{row.planet}</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: row.hasBindu ? COLOR.teal : COLOR.rose }}>
                    {row.hasBindu ? 'Bindu' : 'No bindu'}
                  </span>
                </div>
                <p style={{ fontSize: '0.68rem', color: COLOR.secondary, lineHeight: 1.4, margin: 0 }}>{kakshyaNote(row)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ padding: '0.85rem' }}>
        <p style={{ fontSize: '0.82rem', fontWeight: 800, color: COLOR.gold, marginBottom: '0.45rem', marginTop: 0 }}>Kakshya Timeline (90 days)</p>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: COLOR.secondary }}>
            <Spinner size={18} label="Loading kakshya timeline" />
            Loading kakshya timeline…
          </div>
        ) : !timeline ? (
          <p style={{ fontSize: '0.78rem', color: COLOR.secondary, margin: 0 }}>Timeline unavailable.</p>
        ) : (
          <div className={styles.statGrid}>
            {timeline.map((row) => {
              const c = row.tag === 'best' ? COLOR.teal : row.tag === 'good' ? COLOR.gold : COLOR.rose
              return (
                <div key={row.date} style={{ border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', padding: '0.45rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                    <span style={{ fontSize: '0.68rem', color: COLOR.secondary }}>{row.date}</span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: c }}>{row.score}</span>
                  </div>
                  <p style={{ fontSize: '0.62rem', color: COLOR.muted, margin: '0 0 2px' }}>
                    {row.favorableCount} favorable · {row.unfavorableCount} weak
                  </p>
                  <p style={{ fontSize: '0.62rem', color: c, fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>{row.tag}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

