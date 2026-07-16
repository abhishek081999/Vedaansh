// ─────────────────────────────────────────────────────────────
//  src/components/ui/AshtakavargaGrid.tsx
//  REDESIGNED: Modern-Classic Ashtakavarga Workspace
//  Features: Interactive SAV/BAV, Traditional Chart Views, & Heatmaps
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Spinner } from '@/components/ui/primitives/Spinner'
import { toHousesFromLagna } from '@/lib/engine/ashtakavarga'
import { RASHI_SHORT } from '@/types/astrology'
import type { AshtakavargaResult, GrahaData, Rashi } from '@/types/astrology'

const PLANET_ORDER = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa'] as const
const PLANET_NAMES: Record<(typeof PLANET_ORDER)[number], string> = {
  Su: 'Sun',
  Mo: 'Moon',
  Ma: 'Mars',
  Me: 'Mercury',
  Ju: 'Jupiter',
  Ve: 'Venus',
  Sa: 'Saturn',
}

function rashiLabel(i: number): string {
  return RASHI_SHORT[(i + 1) as Rashi] ?? String(i + 1)
}

/** Prefer reduced tables when present (new charts); fall back for saved charts. */
function bavBindus(av: AshtakavargaResult, planet: string, reduced: boolean): number[] {
  if (reduced && av.bavReduced?.[planet]?.bindus) return av.bavReduced[planet].bindus
  return av.bav[planet]?.bindus ?? Array(12).fill(0)
}

function bavTotal(av: AshtakavargaResult, planet: string, reduced: boolean): number {
  if (reduced && av.bavReduced?.[planet]) return av.bavReduced[planet].total
  return av.bav[planet]?.total ?? 0
}

function savValues(av: AshtakavargaResult, reduced: boolean): number[] {
  if (reduced && av.savReduced) return av.savReduced
  return av.sav
}

const COLOR = {
  teal: 'var(--teal, #4fd1c5)',
  blue: 'var(--blue, #60a5fa)',
  gold: 'var(--text-gold, #f6d365)',
  rose: 'var(--rose, #fb7185)',
  muted: 'var(--text-muted, #94a3b8)',
  primary: 'var(--text-primary, #e5e7eb)',
  secondary: 'var(--text-secondary, #cbd5e1)',
  accent: 'var(--gold, #f6d365)',
} as const

function binduColor(v: number, isSav: boolean): string {
  if (isSav) {
    if (v >= 32) return COLOR.teal
    if (v >= 28) return COLOR.blue
    if (v >= 24) return COLOR.gold
    return COLOR.rose
  }
  if (v >= 6) return COLOR.teal
  if (v >= 4) return COLOR.blue
  if (v >= 3) return COLOR.gold
  return COLOR.rose
}

function NorthIndianAshtakavargaChart({
  valuesByRashi,
  ascRashi,
  title,
  size = 320,
}: {
  valuesByRashi: number[]
  ascRashi: number
  title: string
  size?: number
}) {
  const S = size
  const Q = S / 4
  const M = S / 2
  const isSav = valuesByRashi.reduce((a, b) => a + b, 0) > 100

  const polyPts = (h: number): [number, number][] => {
    switch (h) {
      case 1: return [[Q, Q], [M, M], [3 * Q, Q], [M, 0]]
      case 2: return [[0, 0], [Q, Q], [M, 0]]
      case 3: return [[0, 0], [0, M], [Q, Q]]
      case 4: return [[0, M], [Q, 3 * Q], [M, M], [Q, Q]]
      case 5: return [[0, M], [0, S], [Q, 3 * Q]]
      case 6: return [[Q, 3 * Q], [0, S], [M, S]]
      case 7: return [[Q, 3 * Q], [M, S], [3 * Q, 3 * Q], [M, M]]
      case 8: return [[3 * Q, 3 * Q], [M, S], [S, S]]
      case 9: return [[3 * Q, 3 * Q], [S, S], [S, M]]
      case 10: return [[3 * Q, Q], [M, M], [3 * Q, 3 * Q], [S, M]]
      case 11: return [[3 * Q, Q], [S, M], [S, 0]]
      case 12: return [[M, 0], [3 * Q, Q], [S, 0]]
      default: return []
    }
  }

  const centroid = (pts: [number, number][]) => ({
    x: pts.reduce((sum, p) => sum + p[0], 0) / pts.length,
    y: pts.reduce((sum, p) => sum + p[1], 0) / pts.length,
  })

  return (
    <div className="card" style={{ padding: '1rem', width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      {title ? <div style={{ fontSize: '0.8rem', marginBottom: '0.75rem', fontWeight: 700, color: COLOR.secondary }}>{title}</div> : null}
      <svg
        viewBox={`0 0 ${S} ${S}`}
        style={{ display: 'block', margin: '0 auto', width: 'min(100%, 340px)', height: 'auto', aspectRatio: '1 / 1' }}
      >
        {Array.from({ length: 12 }, (_, i) => i + 1).map((houseNo) => {
          const pts = polyPts(houseNo)
          const pos = centroid(pts)
          // Ashtakavarga arrays are indexed by rashi (1..12), not by house.
          const rashi = ((ascRashi - 1 + houseNo - 1) % 12) + 1
          const val = valuesByRashi[rashi - 1] ?? 0
          const c = binduColor(val, isSav)
          return (
            <g key={houseNo}>
              <polygon
                points={pts.map((p) => p.join(',')).join(' ')}
                fill="var(--surface-1)"
                stroke="var(--border)"
                strokeWidth="1"
              />
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={S * 0.085}
                fontWeight={700}
                fill={c}
              >
                {val}
              </text>
              <text
                x={pos.x}
                y={pos.y + S * 0.055}
                textAnchor="middle"
                fontSize={S * 0.028}
                fill={rashi === ascRashi ? COLOR.accent : COLOR.muted}
                fontWeight={rashi === ascRashi ? 800 : 600}
              >
                {RASHI_SHORT[rashi as keyof typeof RASHI_SHORT]}
              </text>
            </g>
          )
        })}
        <rect width={S} height={S} fill="none" stroke="var(--gold)" strokeWidth="1.5" />
      </svg>
    </div>
  )
}

function BAVTable({
  ashtakavarga,
  reduced,
  ascRashi,
  columnMode,
}: {
  ashtakavarga: AshtakavargaResult
  reduced: boolean
  ascRashi: number
  /** 'rasi' = Aries→Pisces (absolute); 'house' = H1–H12 from Lagna (JHora table style) */
  columnMode: 'rasi' | 'house'
}) {
  const savRaw = savValues(ashtakavarga, reduced)
  const sav = columnMode === 'house' ? toHousesFromLagna(savRaw, ascRashi) : savRaw
  const savTotal = reduced
    ? (ashtakavarga.savReducedTotal ?? savRaw.reduce((a, b) => a + b, 0))
    : ashtakavarga.savTotal
  const lagnaRaw = bavBindus(ashtakavarga, 'As', reduced)
  const lagnaBindus = columnMode === 'house' ? toHousesFromLagna(lagnaRaw, ascRashi) : lagnaRaw
  const lagnaTotal = bavTotal(ashtakavarga, 'As', reduced)
  const hasLagna = Boolean(ashtakavarga.bav.As)

  const colLabel = (i: number) => {
    if (columnMode === 'house') {
      const rashi = ((ascRashi - 1 + i) % 12) + 1
      return `H${i + 1}\n${RASHI_SHORT[rashi as Rashi]}`
    }
    return rashiLabel(i)
  }

  return (
    <div className="card no-scrollbar" style={{ overflowX: 'auto', padding: '0.65rem' }}>
      <div style={{ fontSize: '0.68rem', color: COLOR.muted, marginBottom: '0.45rem' }}>
        {columnMode === 'house'
          ? 'Columns = houses from Lagna (JHora style). Values are the same sign-based bindus.'
          : 'Columns = absolute signs Aries→Pisces.'}
        {reduced ? ' Sodhita (reduced) bindus.' : ' Raw JHora/Parasara bindus (SAV = 337).'}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760, fontSize: 'clamp(0.72rem, 2.4vw, 0.92rem)' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th style={{ textAlign: 'left', padding: '0.4rem', position: 'sticky', left: 0, background: 'var(--surface-1)', zIndex: 1 }}>Graha</th>
            {Array.from({ length: 12 }, (_, i) => (
              <th key={i} style={{ textAlign: 'center', padding: '0.4rem', minWidth: 42, whiteSpace: 'pre-line', lineHeight: 1.2, fontSize: '0.68rem' }}>
                {colLabel(i)}
              </th>
            ))}
            <th style={{ textAlign: 'center', padding: '0.4rem', minWidth: 46 }}>Tot</th>
          </tr>
        </thead>
        <tbody>
          {PLANET_ORDER.map((p) => {
            const raw = bavBindus(ashtakavarga, p, reduced)
            const bindus = columnMode === 'house' ? toHousesFromLagna(raw, ascRashi) : raw
            return (
              <tr key={p} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                <td style={{ padding: '0.4rem', fontWeight: 700, position: 'sticky', left: 0, background: 'var(--surface-1)', zIndex: 1 }}>{p}</td>
                {bindus.map((v, i) => (
                  <td key={i} style={{ textAlign: 'center', padding: '0.35rem', color: binduColor(v, reduced), fontWeight: 700 }}>
                    {v}
                  </td>
                ))}
                <td style={{ textAlign: 'center', padding: '0.4rem', color: COLOR.blue, fontWeight: 800 }}>{bavTotal(ashtakavarga, p, reduced)}</td>
              </tr>
            )
          })}
          <tr>
            <td style={{ padding: '0.4rem', fontWeight: 800, color: 'var(--text-gold)', position: 'sticky', left: 0, background: 'var(--surface-1)', zIndex: 1 }}>SAV</td>
            {sav.map((v, i) => (
              <td key={i} style={{ textAlign: 'center', padding: '0.35rem', color: binduColor(v, !reduced), fontWeight: 800 }}>
                {v}
              </td>
            ))}
            <td style={{ textAlign: 'center', padding: '0.4rem', color: COLOR.teal, fontWeight: 900 }}>{savTotal}</td>
          </tr>
          {hasLagna ? (
            <tr>
              <td style={{ padding: '0.4rem', fontWeight: 800, position: 'sticky', left: 0, background: 'var(--surface-1)', zIndex: 1 }}>As</td>
              {lagnaBindus.map((v, i) => (
                <td key={i} style={{ textAlign: 'center', padding: '0.35rem', color: binduColor(v, reduced), fontWeight: 700 }}>
                  {v}
                </td>
              ))}
              <td style={{ textAlign: 'center', padding: '0.4rem', color: COLOR.blue, fontWeight: 800 }}>{lagnaTotal}</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  )
}

function SodhyaPindaTable({ ashtakavarga }: { ashtakavarga: AshtakavargaResult }) {
  if (!ashtakavarga.sodhyaPindas) {
    return (
      <div className="card" style={{ padding: '0.8rem', color: COLOR.muted, fontSize: '0.78rem' }}>
        Recalculate the chart to load Sodhya Pindas (JHora).
      </div>
    )
  }
  return (
    <div className="card no-scrollbar" style={{ overflowX: 'auto', padding: '0.65rem' }}>
      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: COLOR.gold, marginBottom: '0.4rem' }}>Sodhya Pindas</div>
      <div style={{ fontSize: '0.66rem', color: COLOR.muted, marginBottom: '0.45rem' }}>
        From Sodhita BAV × Rasi/Graha gunakara (same method as Jagannatha Hora).
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420, fontSize: '0.78rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th style={{ textAlign: 'left', padding: '0.35rem' }}>Graha</th>
            <th style={{ textAlign: 'center', padding: '0.35rem' }}>Rasi Pinda</th>
            <th style={{ textAlign: 'center', padding: '0.35rem' }}>Graha Pinda</th>
            <th style={{ textAlign: 'center', padding: '0.35rem' }}>Sodhya Pinda</th>
          </tr>
        </thead>
        <tbody>
          {PLANET_ORDER.map((p) => {
            const row = ashtakavarga.sodhyaPindas![p]
            return (
              <tr key={p} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                <td style={{ padding: '0.35rem', fontWeight: 700 }}>{p}</td>
                <td style={{ textAlign: 'center', padding: '0.35rem' }}>{row.rasiPinda}</td>
                <td style={{ textAlign: 'center', padding: '0.35rem' }}>{row.grahaPinda}</td>
                <td style={{ textAlign: 'center', padding: '0.35rem', color: COLOR.teal, fontWeight: 800 }}>{row.sodhyaPinda}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ClassicalNinePanels({
  ashtakavarga,
  ascRashi,
  reduced,
}: {
  ashtakavarga: AshtakavargaResult
  ascRashi: number
  reduced: boolean
}) {
  const lagnaValues = bavBindus(ashtakavarga, 'As', reduced)
  const hasLagna = Boolean(ashtakavarga.bav.As)
  const ascName = RASHI_SHORT[ascRashi as Rashi] ?? String(ascRashi)

  const items: Array<{ key: string; title: string; values: number[] }> = [
    { key: 'SAV', title: 'SAV', values: savValues(ashtakavarga, reduced) },
    ...(hasLagna ? [{ key: 'As', title: 'As', values: lagnaValues }] : []),
    ...PLANET_ORDER.map((p) => ({ key: p, title: p, values: bavBindus(ashtakavarga, p, reduced) })),
  ]

  return (
    <div className="card" style={{ padding: '1rem' }}>
      <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem', color: COLOR.primary }}>
        D-1 Ashtakavarga Charts
      </div>
      <div style={{ fontSize: '0.78rem', color: COLOR.secondary, marginBottom: '1rem' }}>
        Sign-based Bhinna Ashtakavarga (JHora/Parasara) oriented from Ascendant ({ascName}).
        {reduced ? ' Sodhita figures.' : ' Raw bindus.'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
        {items.map((item) => (
          <div key={item.key} style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '0.65rem', background: 'var(--surface-1)' }}>
            <div style={{ textAlign: 'center', fontWeight: 800, color: COLOR.gold, marginBottom: '0.5rem' }}>{item.title}</div>
            <NorthIndianAshtakavargaChart
              valuesByRashi={item.values}
              ascRashi={ascRashi}
              title=""
              size={190}
            />
          </div>
        ))}
      </div>
      {hasLagna ? (
        <div style={{ marginTop: '0.65rem', color: COLOR.muted, fontSize: '0.68rem' }}>
          As = classical Lagna Ashtakavarga (49 bindus), not included in SAV 337.
        </div>
      ) : (
        <div style={{ marginTop: '0.65rem', color: COLOR.muted, fontSize: '0.68rem' }}>
          Recalculate the chart to load classical Lagna Ashtakavarga and Sodhya figures.
        </div>
      )}
    </div>
  )
}

function AshtakavargaInterpretation({
  ashtakavarga,
  transitGrahas,
  ayanamsha,
}: {
  ashtakavarga: AshtakavargaResult
  transitGrahas?: GrahaData[]
  ayanamsha?: string
}) {
  const [forecastRows, setForecastRows] = useState<Array<{ date: string; score: number; tag: 'best' | 'good' | 'caution' }> | null>(null)
  const [forecastLoading, setForecastLoading] = useState(false)

  const insights = useMemo(() => {
    const savRanked = ashtakavarga.sav
      .map((val, i) => ({ sign: i + 1, val }))
      .sort((a, b) => b.val - a.val)
    const top3 = savRanked.slice(0, 3)
    const low3 = savRanked.slice(-3)

    const planetFocus = PLANET_ORDER.map((p) => {
      const vals = ashtakavarga.bav[p].bindus
      let bestIdx = 0
      let worstIdx = 0
      for (let i = 1; i < vals.length; i++) {
        if (vals[i] > vals[bestIdx]) bestIdx = i
        if (vals[i] < vals[worstIdx]) worstIdx = i
      }
      return {
        planet: p,
        bestSign: bestIdx + 1,
        bestVal: vals[bestIdx],
        weakSign: worstIdx + 1,
        weakVal: vals[worstIdx],
        total: ashtakavarga.bav[p].total,
      }
    })
      .sort((a, b) => b.total - a.total)

    const guidance = [
      ashtakavarga.sav[top3[0].sign - 1] >= 32
        ? `High support zone: ${RASHI_SHORT[top3[0].sign as keyof typeof RASHI_SHORT]} is highly activated in SAV.`
        : `Moderate-high support zone: ${RASHI_SHORT[top3[0].sign as keyof typeof RASHI_SHORT]} gives better outcomes than average.`,
      ashtakavarga.sav[low3[2].sign - 1] <= 23
        ? `Caution zone: ${RASHI_SHORT[low3[2].sign as keyof typeof RASHI_SHORT]} has low bindu protection; avoid rushed decisions.`
        : `Watch zone: ${RASHI_SHORT[low3[2].sign as keyof typeof RASHI_SHORT]} needs patience and better timing.`,
      `Transit thumb rule: prefer actions when a transit planet is in signs where its own BAV is 4+ and SAV is 28+.`,
    ]

    return { top3, low3, planetFocus, guidance }
  }, [ashtakavarga])

  const transitActivation = useMemo(() => {
    if (!transitGrahas?.length) return null

    const rows = PLANET_ORDER.map((p) => {
      const transit = transitGrahas.find((g) => g.id === p)
      const sign = transit?.rashi
      if (!sign) {
        return { planet: p, available: false as const }
      }
      const bav = ashtakavarga.bav[p].bindus[sign - 1] ?? 0
      const sav = ashtakavarga.sav[sign - 1] ?? 0
      const score = Math.round((bav / 8) * 55 + (sav / 40) * 45)
      const band = score >= 72 ? 'high' : score >= 55 ? 'moderate' : 'low'
      return {
        planet: p,
        available: true as const,
        sign,
        bav,
        sav,
        score,
        band,
      }
    })

    return rows.sort((a, b) => {
      if (!a.available && !b.available) return 0
      if (!a.available) return 1
      if (!b.available) return -1
      return b.score - a.score
    })
  }, [ashtakavarga, transitGrahas])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setForecastLoading(true)
      try {
        const sampleOffsets = [0, 5, 10, 15, 20, 25, 30]
        const today = new Date()
        const toYmd = (d: Date) => d.toISOString().slice(0, 10)

        const samples = await Promise.all(sampleOffsets.map(async (offset) => {
          const d = new Date(today)
          d.setDate(today.getDate() + offset)
          const date = toYmd(d)
          const qs = new URLSearchParams({
            date,
            ayanamsha: ayanamsha ?? 'lahiri',
          })
          const res = await fetch(`/api/transits/planets?${qs.toString()}`)
          const json = await res.json()
          const grahas: Array<{ id: string; rashi: number }> = json?.success ? (json.grahas ?? []) : []

          const scores = PLANET_ORDER.map((p) => {
            const tg = grahas.find((g) => g.id === p)
            if (!tg?.rashi) return 0
            const bav = ashtakavarga.bav[p].bindus[tg.rashi - 1] ?? 0
            const sav = ashtakavarga.sav[tg.rashi - 1] ?? 0
            return (bav / 8) * 55 + (sav / 40) * 45
          })
          const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
          return { date, score: avg }
        }))

        const ranked = [...samples].sort((a, b) => b.score - a.score)
        const bestSet = new Set(ranked.slice(0, 2).map((x) => x.date))
        const lowSet = new Set(ranked.slice(-2).map((x) => x.date))
        const finalRows = samples.map((row) => ({
          ...row,
          tag: (bestSet.has(row.date) ? 'best' : lowSet.has(row.date) ? 'caution' : 'good') as 'best' | 'good' | 'caution',
        }))

        if (!cancelled) setForecastRows(finalRows)
      } catch {
        if (!cancelled) setForecastRows(null)
      } finally {
        if (!cancelled) setForecastLoading(false)
      }
    }

    void run()
    return () => { cancelled = true }
  }, [ashtakavarga, ayanamsha])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div className="card" style={{ padding: '0.85rem' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: COLOR.gold, marginBottom: '0.45rem' }}>Interpretation Highlights</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.45rem' }}>
          <div style={{ border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', padding: '0.55rem' }}>
            <div style={{ fontSize: '0.66rem', color: COLOR.muted, marginBottom: '0.2rem' }}>Top SAV Signs</div>
            <div style={{ fontSize: '0.78rem', color: COLOR.secondary, lineHeight: 1.5 }}>
              {insights.top3.map((x) => `${RASHI_SHORT[x.sign as keyof typeof RASHI_SHORT]} (${x.val})`).join(' · ')}
            </div>
          </div>
          <div style={{ border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', padding: '0.55rem' }}>
            <div style={{ fontSize: '0.66rem', color: COLOR.muted, marginBottom: '0.2rem' }}>Low SAV Signs</div>
            <div style={{ fontSize: '0.78rem', color: COLOR.secondary, lineHeight: 1.5 }}>
              {insights.low3.map((x) => `${RASHI_SHORT[x.sign as keyof typeof RASHI_SHORT]} (${x.val})`).join(' · ')}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '0.85rem' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: COLOR.gold, marginBottom: '0.45rem' }}>Planet-wise BAV Focus</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.45rem' }}>
          {insights.planetFocus.map((p) => (
            <div key={p.planet} style={{ border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', padding: '0.5rem 0.55rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>{p.planet}</span>
                <span style={{ fontSize: '0.72rem', color: COLOR.blue, fontWeight: 700 }}>{p.total}</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: COLOR.secondary, lineHeight: 1.45 }}>
                Best: <span style={{ color: COLOR.teal }}>{RASHI_SHORT[p.bestSign as keyof typeof RASHI_SHORT]} ({p.bestVal})</span>
                {' · '}
                Weak: <span style={{ color: COLOR.rose }}>{RASHI_SHORT[p.weakSign as keyof typeof RASHI_SHORT]} ({p.weakVal})</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: '0.85rem' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: COLOR.gold, marginBottom: '0.45rem' }}>Practical Guidance</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {insights.guidance.map((line, i) => (
            <div key={i} style={{ fontSize: '0.78rem', color: COLOR.secondary, lineHeight: 1.45 }}>
              {i + 1}. {line}
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: '0.85rem' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: COLOR.gold, marginBottom: '0.45rem' }}>Transit Activation (Current)</div>
        {!transitActivation ? (
          <div style={{ fontSize: '0.78rem', color: COLOR.secondary }}>
            Transit data not available in this context.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))', gap: '0.45rem' }}>
            {transitActivation.map((row) => {
              if (!row.available) {
                return (
                  <div key={row.planet} style={{ border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', padding: '0.5rem 0.55rem', color: COLOR.muted, fontSize: '0.72rem' }}>
                    {row.planet}: transit unavailable
                  </div>
                )
              }
              const bandColor = row.band === 'high' ? COLOR.teal : row.band === 'moderate' ? COLOR.gold : COLOR.rose
              return (
                <div key={row.planet} style={{ border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', padding: '0.5rem 0.55rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.22rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>{row.planet}</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: bandColor }}>{row.score}</span>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: COLOR.secondary, lineHeight: 1.4 }}>
                    Sign: {RASHI_SHORT[row.sign as keyof typeof RASHI_SHORT]} · BAV {row.bav} · SAV {row.sav}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="card" style={{ padding: '0.85rem' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: COLOR.gold, marginBottom: '0.45rem' }}>Next 30 Days Windows</div>
        {forecastLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.78rem', color: COLOR.secondary }}>
            <Spinner size={18} label="Calculating windows" />
            Calculating windows...
          </div>
        ) : !forecastRows ? (
          <div style={{ fontSize: '0.78rem', color: COLOR.secondary }}>Forecast unavailable right now.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: '0.42rem' }}>
            {forecastRows.map((row) => {
              const c = row.tag === 'best' ? COLOR.teal : row.tag === 'good' ? COLOR.gold : COLOR.rose
              return (
                <div key={row.date} style={{ border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', padding: '0.45rem 0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.72rem', color: COLOR.secondary }}>{row.date}</span>
                    <span style={{ fontSize: '0.72rem', color: c, fontWeight: 800 }}>{row.score}</span>
                  </div>
                  <div style={{ fontSize: '0.66rem', color: c, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {row.tag}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export function AshtakavargaGrid({
  ashtakavarga,
  ascRashi,
  transitGrahas,
  ayanamsha,
}: {
  ashtakavarga: AshtakavargaResult
  ascRashi: number
  transitGrahas?: GrahaData[]
  ayanamsha?: string
}) {
  const [tab, setTab] = useState<'sav' | 'bav' | 'table' | 'interpretation'>('sav')
  const [selected, setSelected] = useState<(typeof PLANET_ORDER)[number]>('Su')
  const hasReduced = Boolean(ashtakavarga.savReduced && ashtakavarga.bavReduced)
  const [reduced, setReduced] = useState(false)
  /** Default house-from-Lagna to match JHora table reading */
  const [columnMode, setColumnMode] = useState<'rasi' | 'house'>('house')

  const activeSav = savValues(ashtakavarga, reduced)
  const strongestSav = useMemo(() => {
    let idx = 0
    for (let i = 1; i < activeSav.length; i++) {
      if (activeSav[i] > activeSav[idx]) idx = i
    }
    return (idx + 1) as Rashi
  }, [activeSav])

  const tabBtn = (id: typeof tab, label: string) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      style={{
        border: '1px solid var(--border)',
        background: tab === id ? 'var(--gold-faint)' : 'var(--surface-1)',
        color: tab === id ? 'var(--text-gold)' : 'var(--text-secondary)',
        borderRadius: 'var(--r-md)',
        padding: '0.5rem 0.45rem',
        cursor: 'pointer',
        fontWeight: 700,
        fontSize: 'clamp(0.74rem, 2.8vw, 0.88rem)',
        lineHeight: 1.2,
        minHeight: 44,
        whiteSpace: 'normal',
        textAlign: 'center',
      }}
    >
      {label}
    </button>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
      <div className="card" style={{ padding: '0.75rem', display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.45rem', width: '100%' }}>
          {tabBtn('sav', 'Sarva-Ashtakavarga')}
          {tabBtn('bav', 'Bhinna-Ashtakavarga')}
          {tabBtn('table', 'Table')}
          {tabBtn('interpretation', 'Interpretation')}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem 1rem', color: COLOR.muted, fontSize: '0.75rem', flexWrap: 'wrap', width: '100%' }}>
          <span>SAV Total: <b style={{ color: COLOR.teal }}>{reduced ? (ashtakavarga.savReducedTotal ?? activeSav.reduce((a, b) => a + b, 0)) : ashtakavarga.savTotal}</b></span>
          <span>Strongest: <b style={{ color: COLOR.blue }}>{RASHI_SHORT[strongestSav]} ({activeSav[strongestSav - 1]})</b></span>
          <span>Asc: <b style={{ color: COLOR.gold }}>{RASHI_SHORT[ascRashi as Rashi]}</b></span>
          <span style={{ display: 'inline-flex', gap: '0.35rem', marginLeft: 'auto', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setColumnMode('house')}
              style={{
                border: '1px solid var(--border)',
                background: columnMode === 'house' ? 'var(--gold-faint)' : 'var(--surface-1)',
                color: columnMode === 'house' ? 'var(--text-gold)' : 'var(--text-muted)',
                borderRadius: 'var(--r-sm)',
                padding: '0.28rem 0.55rem',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.68rem',
              }}
            >
              From Lagna
            </button>
            <button
              type="button"
              onClick={() => setColumnMode('rasi')}
              style={{
                border: '1px solid var(--border)',
                background: columnMode === 'rasi' ? 'var(--gold-faint)' : 'var(--surface-1)',
                color: columnMode === 'rasi' ? 'var(--text-gold)' : 'var(--text-muted)',
                borderRadius: 'var(--r-sm)',
                padding: '0.28rem 0.55rem',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.68rem',
              }}
            >
              Aries→Pisces
            </button>
            {hasReduced ? (
              <>
                <button
                  type="button"
                  onClick={() => setReduced(false)}
                  style={{
                    border: '1px solid var(--border)',
                    background: !reduced ? 'var(--gold-faint)' : 'var(--surface-1)',
                    color: !reduced ? 'var(--text-gold)' : 'var(--text-muted)',
                    borderRadius: 'var(--r-sm)',
                    padding: '0.28rem 0.55rem',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.68rem',
                  }}
                >
                  Raw (337)
                </button>
                <button
                  type="button"
                  onClick={() => setReduced(true)}
                  style={{
                    border: '1px solid var(--border)',
                    background: reduced ? 'var(--gold-faint)' : 'var(--surface-1)',
                    color: reduced ? 'var(--text-gold)' : 'var(--text-muted)',
                    borderRadius: 'var(--r-sm)',
                    padding: '0.28rem 0.55rem',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.68rem',
                  }}
                >
                  Sodhya
                </button>
              </>
            ) : null}
          </span>
        </div>
        <div style={{ width: '100%', fontSize: '0.66rem', color: COLOR.muted }}>
          Engine: Jagannatha Hora / Parasara (Santhanam) bindu tables — match JHora when ayanamsha & planet signs match.
        </div>
      </div>

      {tab === 'sav' ? (
        <>
          <ClassicalNinePanels ashtakavarga={ashtakavarga} ascRashi={ascRashi} reduced={reduced} />
          <NorthIndianAshtakavargaChart
            valuesByRashi={activeSav}
            ascRashi={ascRashi}
            title={reduced ? 'Sarva-Ashtakavarga (Sodhita)' : 'Sarva-Ashtakavarga (JHora raw)'}
            size={320}
          />
          <BAVTable ashtakavarga={ashtakavarga} reduced={reduced} ascRashi={ascRashi} columnMode={columnMode} />
          <SodhyaPindaTable ashtakavarga={ashtakavarga} />
        </>
      ) : tab === 'bav' ? (
        <>
          <div className="card" style={{ padding: '0.75rem', overflowX: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(56px, 1fr))', gap: '0.35rem', minWidth: 430 }}>
              {PLANET_ORDER.map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setSelected(p)}
                  style={{
                    border: '1px solid var(--border)',
                    background: selected === p ? 'var(--surface-3)' : 'var(--surface-1)',
                    color: selected === p ? 'var(--text-primary)' : 'var(--text-muted)',
                    borderRadius: 'var(--r-md)',
                    padding: '0.5rem 0.4rem',
                    cursor: 'pointer',
                    fontWeight: selected === p ? 800 : 600,
                    fontSize: '0.75rem',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <NorthIndianAshtakavargaChart
            valuesByRashi={bavBindus(ashtakavarga, selected, reduced)}
            ascRashi={ascRashi}
            title={`${PLANET_NAMES[selected]} BAV (${reduced ? 'Sodhya' : 'raw'}, sign-based)`}
            size={320}
          />

          <div className="card" style={{ padding: '0.85rem', color: COLOR.secondary, fontSize: '0.8rem' }}>
            {PLANET_NAMES[selected]} has <b style={{ color: COLOR.blue }}>{bavTotal(ashtakavarga, selected, reduced)}</b>
            {reduced ? ' reduced' : ''} bindus
            {!reduced ? ` (classical total ${ashtakavarga.bav[selected].total})` : ''}.
            Values are by absolute sign, shown in the North Indian chart from your Ascendant.
          </div>
        </>
      ) : tab === 'table' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="card" style={{ padding: '0.8rem', color: COLOR.secondary, fontSize: '0.78rem' }}>
            Full Ashtakavarga matrix (JHora method). Use “From Lagna” to mirror JHora’s house columns.
          </div>
          <BAVTable ashtakavarga={ashtakavarga} reduced={reduced} ascRashi={ascRashi} columnMode={columnMode} />
          <SodhyaPindaTable ashtakavarga={ashtakavarga} />
        </div>
      ) : (
        <AshtakavargaInterpretation ashtakavarga={ashtakavarga} transitGrahas={transitGrahas} ayanamsha={ayanamsha} />
      )}
    </div>
  )
}