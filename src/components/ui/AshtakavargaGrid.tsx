// ─────────────────────────────────────────────────────────────
//  src/components/ui/AshtakavargaGrid.tsx
//  REDESIGNED: Modern-Classic Ashtakavarga Workspace
//  Features: Interactive SAV/BAV, Traditional Chart Views, & Heatmaps
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Spinner } from '@/components/ui/primitives/Spinner'
import { PlanGate } from '@/components/ui/patterns/PlanGate'
import { AshtakavargaAdvancedInsights } from '@/components/ui/AshtakavargaAdvancedInsights'
import { BhinnashtakavargaGuide } from '@/components/ui/BhinnashtakavargaGuide'
import {
  KakshyaTimeline,
  PrastaraTable,
  RekhasView,
  SodhyaGuidePanel,
} from '@/components/ui/AshtakavargaExtendedPanels'
import { toHousesFromLagna } from '@/lib/engine/ashtakavarga'
import { bavTransitQuality, estimateDashaResultPercent } from '@/lib/engine/ashtakavargaInsights'
import { RASHI_SHORT, GRAHA_NAMES } from '@/types/astrology'
import type { AshtakavargaResult, GrahaData, GrahaId, Rashi, UserPlan } from '@/types/astrology'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { MEDIA_QUERIES } from '@/lib/ui/breakpoints'
import styles from '@/components/ui/AshtakavargaWorkspace.module.css'

const PLANET_ORDER = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa'] as const
const BAV_PLANET_ORDER = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'As'] as const
type BavPlanet = (typeof BAV_PLANET_ORDER)[number]
type ReductionMode = 'raw' | 'sodhya' | 'mandala'
const PLANET_NAMES: Record<BavPlanet, string> = {
  Su: 'Sun',
  Mo: 'Moon',
  Ma: 'Mars',
  Me: 'Mercury',
  Ju: 'Jupiter',
  Ve: 'Venus',
  Sa: 'Saturn',
  As: 'Lagna',
}

function rashiLabel(i: number): string {
  return RASHI_SHORT[(i + 1) as Rashi] ?? String(i + 1)
}

/** Prefer reduced tables when present (new charts); fall back for saved charts. */
function bavBindus(av: AshtakavargaResult, planet: string, mode: ReductionMode): number[] {
  if (mode === 'sodhya' && av.bavReduced?.[planet]?.bindus) return av.bavReduced[planet].bindus
  return av.bav[planet]?.bindus ?? Array(12).fill(0)
}

function bavTotal(av: AshtakavargaResult, planet: string, mode: ReductionMode): number {
  if (mode === 'sodhya' && av.bavReduced?.[planet]) return av.bavReduced[planet].total
  return av.bav[planet]?.total ?? 0
}

function savValues(av: AshtakavargaResult, mode: ReductionMode): number[] {
  if (mode === 'mandala' && av.savMandalaReduced) return av.savMandalaReduced
  if (mode === 'sodhya' && av.savReduced) return av.savReduced
  return av.sav
}

function savTotalValue(av: AshtakavargaResult, mode: ReductionMode, activeSav: number[]): number {
  if (mode === 'mandala') return av.savMandalaReducedTotal ?? activeSav.reduce((a, b) => a + b, 0)
  if (mode === 'sodhya') return av.savReducedTotal ?? activeSav.reduce((a, b) => a + b, 0)
  return av.savTotal
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
    <div className={`card ${styles.chartCard}`}>
      {title ? <div className={styles.chartTitle}>{title}</div> : null}
      <svg viewBox={`0 0 ${S} ${S}`} className={styles.chartSvg}>
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
  mode,
  ascRashi,
  columnMode,
}: {
  ashtakavarga: AshtakavargaResult
  mode: ReductionMode
  ascRashi: number
  columnMode: 'rasi' | 'house'
}) {
  const savRaw = savValues(ashtakavarga, mode)
  const sav = columnMode === 'house' ? toHousesFromLagna(savRaw, ascRashi) : savRaw
  const savTotal = savTotalValue(ashtakavarga, mode, savRaw)
  const lagnaRaw = bavBindus(ashtakavarga, 'As', mode)
  const lagnaBindus = columnMode === 'house' ? toHousesFromLagna(lagnaRaw, ascRashi) : lagnaRaw
  const lagnaTotal = bavTotal(ashtakavarga, 'As', mode)
  const hasLagna = Boolean(ashtakavarga.bav.As)

  const colLabel = (i: number) => {
    if (columnMode === 'house') {
      const rashi = ((ascRashi - 1 + i) % 12) + 1
      return `H${i + 1}\n${RASHI_SHORT[rashi as Rashi]}`
    }
    return rashiLabel(i)
  }

  const modeNote = mode === 'sodhya'
    ? ' Sodhita (Trikona + Ekadhipatya) bindus.'
    : mode === 'mandala'
      ? ' Mandala → Trikona → Ekadhipatya on SAV.'
      : ' Raw JHora/Parasara bindus (SAV = 337).'

  return (
    <div className={`card no-scrollbar ${styles.tableWrap}`}>
      <div className={styles.tableHint}>Swipe horizontally to see all columns</div>
      <div style={{ fontSize: '0.68rem', color: COLOR.muted, marginBottom: '0.45rem' }}>
        {columnMode === 'house'
          ? 'Columns = houses from Lagna (JHora style). Values are the same sign-based bindus.'
          : 'Columns = absolute signs Aries→Pisces.'}
        {modeNote}
      </div>
      <table className={styles.dataTable}>
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
            const raw = bavBindus(ashtakavarga, p, mode)
            const bindus = columnMode === 'house' ? toHousesFromLagna(raw, ascRashi) : raw
            return (
              <tr key={p} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                <td style={{ padding: '0.4rem', fontWeight: 700, position: 'sticky', left: 0, background: 'var(--surface-1)', zIndex: 1 }}>{p}</td>
                {bindus.map((v, i) => (
                  <td key={i} style={{ textAlign: 'center', padding: '0.35rem', color: binduColor(v, mode !== 'raw'), fontWeight: 700 }}>
                    {v}
                  </td>
                ))}
                <td style={{ textAlign: 'center', padding: '0.4rem', color: COLOR.blue, fontWeight: 800 }}>{bavTotal(ashtakavarga, p, mode)}</td>
              </tr>
            )
          })}
          <tr>
            <td style={{ padding: '0.4rem', fontWeight: 800, color: 'var(--text-gold)', position: 'sticky', left: 0, background: 'var(--surface-1)', zIndex: 1 }}>SAV</td>
            {sav.map((v, i) => (
              <td key={i} style={{ textAlign: 'center', padding: '0.35rem', color: binduColor(v, mode === 'raw'), fontWeight: 800 }}>
                {v}
              </td>
            ))}
            <td style={{ textAlign: 'center', padding: '0.4rem', color: COLOR.teal, fontWeight: 900 }}>{savTotal}</td>
          </tr>
          {hasLagna ? (
            <tr>
              <td style={{ padding: '0.4rem', fontWeight: 800, position: 'sticky', left: 0, background: 'var(--surface-1)', zIndex: 1 }}>As</td>
              {lagnaBindus.map((v, i) => (
                <td key={i} style={{ textAlign: 'center', padding: '0.35rem', color: binduColor(v, mode !== 'raw'), fontWeight: 700 }}>
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
  mode,
}: {
  ashtakavarga: AshtakavargaResult
  ascRashi: number
  mode: ReductionMode
}) {
  const lagnaValues = bavBindus(ashtakavarga, 'As', mode)
  const hasLagna = Boolean(ashtakavarga.bav.As)
  const ascName = RASHI_SHORT[ascRashi as Rashi] ?? String(ascRashi)

  const items: Array<{ key: string; title: string; values: number[] }> = [
    { key: 'SAV', title: 'SAV', values: savValues(ashtakavarga, mode) },
    ...(hasLagna ? [{ key: 'As', title: 'As', values: lagnaValues }] : []),
    ...PLANET_ORDER.map((p) => ({ key: p, title: p, values: bavBindus(ashtakavarga, p, mode) })),
  ]

  return (
    <div className="card" style={{ padding: '1rem' }}>
      <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem', color: COLOR.primary }}>
        D-1 Ashtakavarga Charts
      </div>
      <div style={{ fontSize: '0.78rem', color: COLOR.secondary, marginBottom: '1rem' }}>
        Sign-based Bhinna Ashtakavarga (JHora/Parasara) oriented from Ascendant ({ascName}).
        {mode === 'sodhya' ? ' Sodhita figures.' : mode === 'mandala' ? ' Mandala-reduced SAV.' : ' Raw bindus.'}
      </div>
      <div className={styles.nineGrid}>
        {items.map((item) => (
          <div key={item.key} className={styles.panelCard}>
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
  dashaLord,
  grahas,
  ascRashi,
}: {
  ashtakavarga: AshtakavargaResult
  transitGrahas?: GrahaData[]
  ayanamsha?: string
  dashaLord?: string
  grahas?: GrahaData[]
  ascRashi?: number
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

  const dashaHouseInsight = useMemo(() => {
    if (!dashaLord || !grahas?.length || !ascRashi) return null
    const lord = dashaLord as GrahaId
    if (!(PLANET_ORDER as readonly string[]).includes(lord)) return null
    const natal = grahas.find((g) => g.id === lord)
    if (!natal?.rashi) return null
    const house = ((natal.rashi - ascRashi + 12) % 12) + 1
    const houseSav = toHousesFromLagna(ashtakavarga.sav, ascRashi)
    const sav = houseSav[house - 1] ?? 0
    const bav = ashtakavarga.bav[lord]?.bindus[natal.rashi - 1] ?? 0
    const resultPct = estimateDashaResultPercent(sav)
    const bavQuality = bavTransitQuality(bav)
    return {
      lord,
      house,
      sign: natal.rashi,
      sav,
      bav,
      resultPct,
      bavQuality,
    }
  }, [dashaLord, grahas, ascRashi, ashtakavarga])

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
      const bavQuality = bavTransitQuality(bav)
      return {
        planet: p,
        available: true as const,
        sign,
        bav,
        sav,
        score,
        band,
        bavQuality,
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
        <div className={styles.cardGrid}>
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
        <div className={styles.cardGrid}>
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

      {dashaHouseInsight ? (
        <div className="card" style={{ padding: '0.85rem' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: COLOR.gold, marginBottom: '0.45rem' }}>
            Dasha × House Strength
          </div>
          <div style={{ fontSize: '0.78rem', color: COLOR.secondary, lineHeight: 1.5 }}>
            <b style={{ color: COLOR.primary }}>{GRAHA_NAMES[dashaHouseInsight.lord] ?? dashaHouseInsight.lord}</b>
            {' '}mahadasha lord sits in natal H{dashaHouseInsight.house}
            {' '}({RASHI_SHORT[dashaHouseInsight.sign as Rashi]}) with SAV <b style={{ color: COLOR.blue }}>{dashaHouseInsight.sav}</b>
            {' '}→ estimated expression ~<b style={{ color: COLOR.teal }}>{dashaHouseInsight.resultPct}%</b> of significations.
            {' '}BAV of lord in that sign: <b>{dashaHouseInsight.bav}</b> ({dashaHouseInsight.bavQuality}
            {dashaHouseInsight.bavQuality === 'excellent'
              ? ' — 6+ class strength'
              : dashaHouseInsight.bavQuality === 'good'
                ? ' — good (5)'
                : dashaHouseInsight.bavQuality === 'borderline'
                  ? ' — minimum acceptable (4)'
                  : ' — weak confirmation'}).
          </div>
        </div>
      ) : null}

      <div className="card" style={{ padding: '0.85rem' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: COLOR.gold, marginBottom: '0.45rem' }}>Transit Activation (Current)</div>
        <div style={{ fontSize: '0.66rem', color: COLOR.muted, marginBottom: '0.45rem', lineHeight: 1.4 }}>
          Confirm with Bhinnashtakavarga: under 4 weak, 4 borderline, 5 good, 6+ excellent. Best when SAV of the transit sign is also strong and dasha supports.
        </div>
        {!transitActivation ? (
          <div style={{ fontSize: '0.78rem', color: COLOR.secondary }}>
            Transit data not available in this context.
          </div>
        ) : (
          <div className={styles.cardGrid}>
            {transitActivation.map((row) => {
              if (!row.available) {
                return (
                  <div key={row.planet} style={{ border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', padding: '0.5rem 0.55rem', color: COLOR.muted, fontSize: '0.72rem' }}>
                    {row.planet}: transit unavailable
                  </div>
                )
              }
              const bandColor = row.band === 'high' ? COLOR.teal : row.band === 'moderate' ? COLOR.gold : COLOR.rose
                  const qColor = row.bavQuality === 'excellent' || row.bavQuality === 'good'
                    ? COLOR.teal
                    : row.bavQuality === 'borderline'
                      ? COLOR.blue
                      : COLOR.rose
              return (
                <div key={row.planet} style={{ border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', padding: '0.5rem 0.55rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.22rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>{row.planet}</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: bandColor }}>{row.score}</span>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: COLOR.secondary, lineHeight: 1.4 }}>
                    Sign: {RASHI_SHORT[row.sign as keyof typeof RASHI_SHORT]} · BAV {row.bav} · SAV {row.sav}
                  </div>
                  <div style={{ fontSize: '0.64rem', color: qColor, fontWeight: 700, marginTop: 2, textTransform: 'capitalize' }}>
                    BAV {row.bavQuality}
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
          <div className={styles.statGrid}>
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

type AvTab = 'sav' | 'bav' | 'table' | 'prastara' | 'rekhas' | 'advanced' | 'sodhya' | 'bavGuide' | 'interpretation' | 'kakshya'

const TAB_LABELS: Record<AvTab, { short: string; full: string }> = {
  sav: { short: 'SAV', full: 'Sarva-Ashtakavarga' },
  bav: { short: 'BAV', full: 'Bhinna-Ashtakavarga' },
  table: { short: 'Table', full: 'Table' },
  prastara: { short: 'Prastara', full: 'Prastara' },
  rekhas: { short: 'Rekhas', full: 'Rekhas' },
  advanced: { short: 'Advanced', full: 'Advanced' },
  sodhya: { short: 'Sodhya', full: 'Sodhya Guide' },
  bavGuide: { short: 'Guide', full: 'BAV Guide' },
  interpretation: { short: 'Interp.', full: 'Interpretation' },
  kakshya: { short: 'Kakshya', full: 'Kakshya' },
}

export function AshtakavargaGrid({
  ashtakavarga,
  ascRashi,
  transitGrahas,
  ayanamsha,
  grahas,
  janmaNakshatraIndex,
  dashaLord,
  userPlan = 'free',
}: {
  ashtakavarga: AshtakavargaResult
  ascRashi: number
  transitGrahas?: GrahaData[]
  ayanamsha?: string
  grahas?: GrahaData[]
  /** 0–26 Moon birth nakshatra index */
  janmaNakshatraIndex?: number
  /** Current Vimshottari mahadasha lord (GrahaId) */
  dashaLord?: string
  userPlan?: UserPlan
}) {
  const [tab, setTab] = useState<AvTab>('sav')
  const isMobile = useMediaQuery(MEDIA_QUERIES.md)
  const [selected, setSelected] = useState<BavPlanet>('Su')
  const hasReduced = Boolean(ashtakavarga.savReduced && ashtakavarga.bavReduced)
  const hasMandala = Boolean(ashtakavarga.savMandalaReduced)
  const [mode, setMode] = useState<ReductionMode>('raw')
  const [columnMode, setColumnMode] = useState<'rasi' | 'house'>('house')

  const activeSav = savValues(ashtakavarga, mode)
  const strongestSav = useMemo(() => {
    let idx = 0
    for (let i = 1; i < activeSav.length; i++) {
      if (activeSav[i] > activeSav[idx]) idx = i
    }
    return (idx + 1) as Rashi
  }, [activeSav])

  const tabBtn = (id: AvTab) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={`${styles.tabBtn} ${tab === id ? styles.tabBtnActive : ''}`}
    >
      {isMobile ? TAB_LABELS[id].short : TAB_LABELS[id].full}
    </button>
  )

  const chipBtn = (active: boolean, onClick: () => void, label: string) => (
    <button type="button" onClick={onClick} className={`${styles.chipBtn} ${active ? styles.chipBtnActive : ''}`}>
      {label}
    </button>
  )

  return (
    <div className={styles.workspace}>
      <div className={`card ${styles.toolbar}`}>
        <div className={styles.tabScroll}>
          <div className={styles.tabRow}>
            {tabBtn('sav')}
            {tabBtn('bav')}
            {tabBtn('table')}
            {tabBtn('prastara')}
            {tabBtn('rekhas')}
            {tabBtn('advanced')}
            {tabBtn('sodhya')}
            {tabBtn('bavGuide')}
            {tabBtn('interpretation')}
            {tabBtn('kakshya')}
          </div>
        </div>
        <div className={styles.statsRow}>
          <div className={styles.statsChips}>
            <span>SAV Total: <b style={{ color: COLOR.teal }}>{savTotalValue(ashtakavarga, mode, activeSav)}</b></span>
          <span>Strongest: <b style={{ color: COLOR.blue }}>{RASHI_SHORT[strongestSav]} ({activeSav[strongestSav - 1]})</b></span>
          <span>Asc: <b style={{ color: COLOR.gold }}>{RASHI_SHORT[ascRashi as Rashi]}</b></span>
          </div>
          <div className={styles.controls}>
            {chipBtn(columnMode === 'house', () => setColumnMode('house'), 'From Lagna')}
            {chipBtn(columnMode === 'rasi', () => setColumnMode('rasi'), 'Aries→Pisces')}
            {hasReduced ? (
              <>
                {chipBtn(mode === 'raw', () => setMode('raw'), 'Raw (337)')}
                {chipBtn(mode === 'sodhya', () => setMode('sodhya'), 'Sodhya')}
              </>
            ) : null}
            {hasMandala ? chipBtn(mode === 'mandala', () => setMode('mandala'), 'Mandala') : null}
          </div>
        </div>
      </div>


      {tab === 'sav' ? (
        <>
          <ClassicalNinePanels ashtakavarga={ashtakavarga} ascRashi={ascRashi} mode={mode} />
          <NorthIndianAshtakavargaChart
            valuesByRashi={activeSav}
            ascRashi={ascRashi}
            title={mode === 'raw' ? 'Sarva-Ashtakavarga (JHora raw)' : mode === 'sodhya' ? 'Sarva-Ashtakavarga (Sodhita)' : 'Sarva-Ashtakavarga (Mandala)'}
            size={320}
          />
          <BAVTable ashtakavarga={ashtakavarga} mode={mode} ascRashi={ascRashi} columnMode={columnMode} />
          <SodhyaPindaTable ashtakavarga={ashtakavarga} />
        </>
      ) : tab === 'bav' ? (
        <>
          <div className="card" style={{ padding: '0.75rem' }}>
            <div className={styles.planetGrid}>
              {BAV_PLANET_ORDER.map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setSelected(p)}
                  className={`${styles.planetBtn} ${selected === p ? styles.planetBtnActive : ''}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <NorthIndianAshtakavargaChart
            valuesByRashi={bavBindus(ashtakavarga, selected, mode)}
            ascRashi={ascRashi}
            title={`${PLANET_NAMES[selected]} BAV (${mode === 'raw' ? 'raw' : mode}, sign-based)`}
            size={320}
          />

          <div className="card" style={{ padding: '0.85rem', color: COLOR.secondary, fontSize: '0.8rem' }}>
            {PLANET_NAMES[selected]} has <b style={{ color: COLOR.blue }}>{bavTotal(ashtakavarga, selected, mode)}</b> bindus
            {selected === 'As' ? ' (Lagna BAV, not in SAV 337).' : mode === 'raw' ? ` (classical total ${ashtakavarga.bav[selected]?.total ?? 0}).` : '.'}
            Values are by absolute sign, shown in the North Indian chart from your Ascendant.
          </div>
        </>
      ) : tab === 'table' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="card" style={{ padding: '0.8rem', color: COLOR.secondary, fontSize: '0.78rem' }}>
            Full Ashtakavarga matrix (JHora method). Use “From Lagna” to mirror JHora’s house columns.
          </div>
          <BAVTable ashtakavarga={ashtakavarga} mode={mode} ascRashi={ascRashi} columnMode={columnMode} />
          <SodhyaPindaTable ashtakavarga={ashtakavarga} />
        </div>
      ) : tab === 'prastara' ? (
        <PrastaraTable ashtakavarga={ashtakavarga} ascRashi={ascRashi} columnMode={columnMode} />
      ) : tab === 'rekhas' ? (
        <RekhasView ashtakavarga={ashtakavarga} ascRashi={ascRashi} NorthIndianChart={NorthIndianAshtakavargaChart} />
      ) : tab === 'advanced' ? (
        <PlanGate userPlan={userPlan} required="gold" featureName="Advanced Ashtakavarga">
          <AshtakavargaAdvancedInsights
            ashtakavarga={ashtakavarga}
            ascRashi={ascRashi}
            grahas={grahas}
            janmaNakshatraIndex={janmaNakshatraIndex}
          />
        </PlanGate>
      ) : tab === 'sodhya' ? (
        <PlanGate userPlan={userPlan} required="gold" featureName="Sodhya Pinda Guide">
          <SodhyaGuidePanel ashtakavarga={ashtakavarga} />
        </PlanGate>
      ) : tab === 'bavGuide' ? (
        <PlanGate userPlan={userPlan} required="gold" featureName="BAV Guide">
          <BhinnashtakavargaGuide
            ashtakavarga={ashtakavarga}
            ascRashi={ascRashi}
            grahas={grahas}
            transitGrahas={transitGrahas}
            dashaLord={dashaLord}
            janmaNakshatraIndex={janmaNakshatraIndex}
            ayanamsha={ayanamsha}
          />
        </PlanGate>
      ) : tab === 'kakshya' ? (
        <PlanGate userPlan={userPlan} required="gold" featureName="Kakshya Timeline">
          <KakshyaTimeline ashtakavarga={ashtakavarga} transitGrahas={transitGrahas} ayanamsha={ayanamsha} />
        </PlanGate>
      ) : tab === 'interpretation' ? (
        <PlanGate userPlan={userPlan} required="gold" featureName="Ashtakavarga Interpretation">
          <AshtakavargaInterpretation
            ashtakavarga={ashtakavarga}
            transitGrahas={transitGrahas}
            ayanamsha={ayanamsha}
            dashaLord={dashaLord}
            grahas={grahas}
            ascRashi={ascRashi}
          />
        </PlanGate>
      ) : null}
    </div>
  )
}