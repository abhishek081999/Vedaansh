'use client'

import React, { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { DashaNode, GrahaData, GrahaId, Rashi, ShadbalaPlanet, ShadbalaResult } from '@/types/astrology'
import { SthanaBalaAnalysisPanel } from '@/components/ui/SthanaBalaAnalysisPanel'
import { KalaBalaAnalysisPanel } from '@/components/ui/KalaBalaAnalysisPanel'
import { DigDrigChestaAnalysisPanel } from '@/components/ui/DigDrigChestaAnalysisPanel'
import { useLang } from '@/i18n/useLang'
import { GRAHA_HI } from '@/i18n/jyotish'

const ORDER = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa'] as const
type PlanetCode = (typeof ORDER)[number]
type ViewMode = 'modern' | 'classic'

const PLANET_NAMES: Record<PlanetCode, string> = {
  Su: 'Sun',
  Mo: 'Moon',
  Ma: 'Mars',
  Me: 'Mercury',
  Ju: 'Jupiter',
  Ve: 'Venus',
  Sa: 'Saturn',
}

const PLANET_SYMBOL: Record<PlanetCode, string> = {
  Su: 'Su',
  Mo: 'Mo',
  Ma: 'Ma',
  Me: 'Me',
  Ju: 'Ju',
  Ve: 'Ve',
  Sa: 'Sa',
}

const COMPONENTS: Array<{ key: keyof ShadbalaPlanet; label: string; maxRupa: number }> = [
  { key: 'sthanaBala', label: 'Sthana', maxRupa: 5.0 },
  { key: 'digBala', label: 'Dig', maxRupa: 1.0 },
  { key: 'kalaBala', label: 'Kala', maxRupa: 3.0 },
  { key: 'chestaBala', label: 'Chesta', maxRupa: 1.0 },
  { key: 'naisargikaBala', label: 'Naisargika', maxRupa: 1.0 },
  { key: 'drikBala', label: 'Drik', maxRupa: 1.0 },
]

function statusColor(ratio: number) {
  if (ratio >= 1.2) return 'var(--teal)'
  if (ratio >= 1.0) return 'var(--text-gold)'
  if (ratio >= 0.85) return 'var(--amber)'
  return 'var(--rose)'
}

function statusKey(ratio: number): 'excellent' | 'strong' | 'average' | 'weak' {
  if (ratio >= 1.2) return 'excellent'
  if (ratio >= 1.0) return 'strong'
  if (ratio >= 0.85) return 'average'
  return 'weak'
}

function bandText(
  t: (key: string) => string,
  band: string | undefined,
  ratio: number,
) {
  const known = band === 'excellent' || band === 'strong' || band === 'average' || band === 'weak'
  return known ? t(`quality.${band}`) : t(`status.${statusKey(ratio)}`)
}

function toShash(rupa: number) {
  return rupa * 60
}

function ClassicMetricCharts({ planets }: { planets: Record<string, ShadbalaPlanet> }) {
  const t = useTranslations('chartTools.shadbala')
  const metrics = [
    { key: 'sthanaBala' as const, title: t('metric.sthanaBala'), scale: 60, decimals: 1 },
    { key: 'kalaBala' as const, title: t('metric.kalaBala'), scale: 60, decimals: 1 },
    { key: 'digBala' as const, title: t('metric.digBala'), scale: 60, decimals: 1 },
    { key: 'chestaBala' as const, title: t('metric.chestaBala'), scale: 60, decimals: 1 },
    { key: 'drikBala' as const, title: t('metric.drikBala'), scale: 60, decimals: 1 },
    { key: 'naisargikaBala' as const, title: t('metric.naisargikaBala'), scale: 60, decimals: 1 },
    { key: 'totalShash' as const, title: t('metric.totalShash'), scale: 1, decimals: 0 },
    { key: 'total' as const, title: t('metric.total'), scale: 1, decimals: 2 },
    { key: 'ratio' as const, title: t('metric.ratio'), scale: 100, decimals: 0 },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '0.55rem' }}>
      {metrics.map((metric) => {
        const vals = ORDER.map((id) => ((planets[id]?.[metric.key] as number) ?? 0) * metric.scale)
        const max = Math.max(...vals.map((v) => Math.abs(v)), 1)
        return (
          <div key={metric.key} style={{ border: '1px solid var(--border)', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)', padding: '0.5rem' }}>
            <div style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>{metric.title}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0,1fr))', gap: '0.2rem', alignItems: 'end', minHeight: 90 }}>
              {vals.map((v, idx) => {
                const h = Math.max(2, (Math.abs(v) / max) * 62)
                return (
                  <div key={`${metric.key}-${ORDER[idx]}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.12rem' }}>
                    <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{v.toFixed(metric.decimals)}</div>
                    <div style={{ width: '100%', maxWidth: 18, height: 66, display: 'flex', alignItems: v < 0 ? 'flex-start' : 'flex-end' }}>
                      <div style={{ width: '100%', height: h, borderRadius: 2, background: v < 0 ? 'linear-gradient(180deg,#c86a7b,#a64557)' : 'linear-gradient(180deg,#b5868f,#946870)' }} />
                    </div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontWeight: 700 }}>{ORDER[idx]}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Parashara's Light-style worksheet (all balas in Shashtiamsas) ──────────────
// Classical minimum requirement per individual bala (Virupas / Shashtiamsas).
const COMPONENT_MIN_SHASH = { sthana: 165, dig: 35, kala: 112, chesta: 50, ayana: 30 }

const SH = (v?: number) => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

type WkRow =
  | { kind: 'section'; label: string }
  | { kind: 'item'; label: string; get: (p: ShadbalaPlanet) => number }
  | { kind: 'subtotal'; label: string; get: (p: ShadbalaPlanet) => number }

type SummaryRow = { label: string; get: (p: ShadbalaPlanet) => number; fmt: (n: number) => string; strong?: boolean; ratio?: boolean }

function PLWorksheet({ planets }: { planets: Record<string, ShadbalaPlanet> }) {
  const t = useTranslations('chartTools.shadbala')
  const { hi } = useLang()
  const planetName = (id: PlanetCode) => (hi ? GRAHA_HI[id] : PLANET_NAMES[id])
  const rows: WkRow[] = [
    { kind: 'section', label: t('wk.sthanaSection') },
    { kind: 'item', label: t('wk.uccha'), get: (p) => SH(p.details?.sthana?.uccha) },
    { kind: 'item', label: t('wk.saptavargaja'), get: (p) => SH(p.details?.sthana?.saptavargaja) },
    { kind: 'item', label: t('wk.ojhayugma'), get: (p) => SH(p.details?.sthana?.ojhayugma) },
    { kind: 'item', label: t('wk.kendradi'), get: (p) => SH(p.details?.sthana?.kendradi) },
    { kind: 'item', label: t('wk.drekkana'), get: (p) => SH(p.details?.sthana?.drekkana) },
    { kind: 'subtotal', label: t('wk.sthanaSub'), get: (p) => SH(p.componentShash?.sthana) },
    { kind: 'subtotal', label: t('wk.digSub'), get: (p) => SH(p.componentShash?.dig) },
    { kind: 'section', label: t('wk.kalaSection') },
    { kind: 'item', label: t('wk.nata'), get: (p) => SH(p.details?.kala?.natha) },
    { kind: 'item', label: t('wk.paksha'), get: (p) => SH(p.details?.kala?.paksha) },
    { kind: 'item', label: t('wk.tribhaga'), get: (p) => SH(p.details?.kala?.tribhaga) },
    { kind: 'item', label: t('wk.varsha'), get: (p) => SH(p.details?.kala?.varsha) },
    { kind: 'item', label: t('wk.maasa'), get: (p) => SH(p.details?.kala?.maasa) },
    { kind: 'item', label: t('wk.vaara'), get: (p) => SH(p.details?.kala?.vaara) },
    { kind: 'item', label: t('wk.hora'), get: (p) => SH(p.details?.kala?.hora) },
    { kind: 'item', label: t('wk.ayana'), get: (p) => SH(p.details?.kala?.ayana) },
    { kind: 'item', label: t('wk.yuddha'), get: (p) => SH(p.details?.kala?.yuddha) },
    { kind: 'subtotal', label: t('wk.kalaSub'), get: (p) => SH(p.componentShash?.kala) },
    { kind: 'subtotal', label: t('wk.chestaSub'), get: (p) => SH(p.componentShash?.chesta) },
    { kind: 'subtotal', label: t('wk.naisargikaSub'), get: (p) => SH(p.componentShash?.naisargika) },
    { kind: 'subtotal', label: t('wk.drigSub'), get: (p) => SH(p.componentShash?.drik) },
  ]

  const summary: SummaryRow[] = [
    { label: t('wk.total'), get: (p) => SH(p.totalShash), fmt: (n) => n.toFixed(2), strong: true },
    { label: t('wk.rupas'), get: (p) => SH(p.total), fmt: (n) => n.toFixed(2), strong: true },
    { label: t('wk.minimum'), get: (p) => SH(p.required) * 60, fmt: (n) => n.toFixed(0), ratio: true },
    { label: t('wk.pctRequired'), get: (p) => SH(p.ratio), fmt: (n) => n.toFixed(2), ratio: true },
    { label: t('wk.sthanaPct'), get: (p) => SH(p.componentShash?.sthana) / COMPONENT_MIN_SHASH.sthana, fmt: (n) => n.toFixed(2), ratio: true },
    { label: t('wk.digPct'), get: (p) => SH(p.componentShash?.dig) / COMPONENT_MIN_SHASH.dig, fmt: (n) => n.toFixed(2), ratio: true },
    { label: t('wk.kalaPct'), get: (p) => SH(p.componentShash?.kala) / COMPONENT_MIN_SHASH.kala, fmt: (n) => n.toFixed(2), ratio: true },
    { label: t('wk.chestaPct'), get: (p) => SH(p.componentShash?.chesta) / COMPONENT_MIN_SHASH.chesta, fmt: (n) => n.toFixed(2), ratio: true },
    { label: t('wk.ayanaPct'), get: (p) => SH(p.details?.kala?.ayana) / COMPONENT_MIN_SHASH.ayana, fmt: (n) => n.toFixed(2), ratio: true },
  ]

  const cell = (v: number, opts?: { strong?: boolean }) => (
    <td
      style={{
        textAlign: 'center',
        padding: '0.28rem 0.3rem',
        fontFamily: 'var(--font-mono)',
        fontWeight: opts?.strong ? 700 : 500,
        color: v < 0 ? 'var(--rose)' : opts?.strong ? 'var(--text-primary)' : 'var(--text-secondary)',
        whiteSpace: 'nowrap',
      }}
    >
      {v.toFixed(2)}
    </td>
  )

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.74rem', minWidth: 640 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-bright)' }}>
            <th style={{ textAlign: 'left', padding: '0.35rem 0.45rem', position: 'sticky', left: 0, background: 'var(--surface-1)' }}>{t('balaHeader')}</th>
            {ORDER.map((id) => (
              <th key={id} style={{ textAlign: 'center', padding: '0.35rem 0.3rem', color: 'var(--text-gold)', fontWeight: 700 }}>
                {planetName(id)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            if (row.kind === 'section') {
              return (
                <tr key={`sec-${i}`}>
                  <td colSpan={8} style={{ padding: '0.3rem 0.45rem', fontWeight: 700, fontSize: '0.68rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-gold)', background: 'var(--surface-2)', borderTop: '1px solid var(--border)' }}>
                    {row.label}
                  </td>
                </tr>
              )
            }
            const isSub = row.kind === 'subtotal'
            return (
              <tr key={`${row.label}-${i}`} style={{ borderBottom: '1px solid var(--border-soft)', background: isSub ? 'var(--surface-2)' : 'transparent' }}>
                <td style={{ padding: '0.28rem 0.45rem', paddingLeft: isSub ? '0.45rem' : '1rem', fontWeight: isSub ? 700 : 500, color: isSub ? 'var(--text-primary)' : 'var(--text-muted)', position: 'sticky', left: 0, background: isSub ? 'var(--surface-2)' : 'var(--surface-1)' }}>
                  {row.label}
                </td>
                {ORDER.map((id) => {
                  const p = planets[id]
                  const v = p ? row.get(p) : 0
                  return (
                    <React.Fragment key={id}>
                      {cell(v, { strong: isSub })}
                    </React.Fragment>
                  )
                })}
              </tr>
            )
          })}

          <tr>
            <td colSpan={8} style={{ padding: '0.15rem' }} />
          </tr>

          {summary.map((row, i) => (
            <tr key={`sum-${i}`} style={{ borderBottom: '1px solid var(--border-soft)', background: row.strong ? 'var(--surface-2)' : 'transparent' }}>
              <td style={{ padding: '0.28rem 0.45rem', fontWeight: row.strong ? 700 : 600, color: row.strong ? 'var(--text-primary)' : 'var(--text-secondary)', position: 'sticky', left: 0, background: row.strong ? 'var(--surface-2)' : 'var(--surface-1)' }}>
                {row.label}
              </td>
              {ORDER.map((id) => {
                const p = planets[id]
                const v = p ? row.get(p) : 0
                const isReqRatio = Boolean(row.ratio)
                const color = isReqRatio && v < 1 ? 'var(--rose)' : row.strong ? 'var(--text-primary)' : 'var(--text-secondary)'
                return (
                  <td key={`${row.label}-${id}`} style={{ textAlign: 'center', padding: '0.28rem 0.3rem', fontFamily: 'var(--font-mono)', fontWeight: row.strong ? 700 : 500, color, whiteSpace: 'nowrap' }}>
                    {row.fmt(v)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: '0.5rem', fontSize: '0.66rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
        {t('footnote')}
      </div>
    </div>
  )
}

const COMP_LABEL: Record<string, 'comp.sthana' | 'comp.dig' | 'comp.kala' | 'comp.chesta' | 'comp.naisargika' | 'comp.drik'> = {
  sthanaBala: 'comp.sthana',
  digBala: 'comp.dig',
  kalaBala: 'comp.kala',
  chestaBala: 'comp.chesta',
  naisargikaBala: 'comp.naisargika',
  drikBala: 'comp.drik',
}

function PolarHex({
  planet,
}: {
  planet?: ShadbalaPlanet
}) {
  const t = useTranslations('chartTools.shadbala')
  const values = COMPONENTS.map((c) => Math.max(0, Number(planet?.[c.key] ?? 0)))
  const size = 170
  const center = size / 2
  const radius = 56
  const step = (Math.PI * 2) / 6

  const points = values
    .map((v, i) => {
      const angle = i * step - Math.PI / 2
      const max = COMPONENTS[i].maxRupa
      const use = Math.min(1, max > 0 ? v / max : 0)
      return `${center + Math.cos(angle) * radius * use},${center + Math.sin(angle) * radius * use}`
    })
    .join(' ')

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[0.25, 0.5, 0.75, 1].map((p) => {
        const ring = Array.from({ length: 6 }).map((_, i) => {
          const angle = i * step - Math.PI / 2
          return `${center + Math.cos(angle) * radius * p},${center + Math.sin(angle) * radius * p}`
        }).join(' ')
        return <polygon key={p} points={ring} fill="none" stroke="var(--border-soft)" strokeWidth="1" />
      })}
      <polygon points={points} fill="rgba(201,168,76,0.22)" stroke="var(--text-gold)" strokeWidth="2" />
      {COMPONENTS.map((c, i) => {
        const angle = i * step - Math.PI / 2
        const x = center + Math.cos(angle) * (radius + 12)
        const y = center + Math.sin(angle) * (radius + 12)
        return (
          <text key={c.key as string} x={x} y={y} textAnchor="middle" dominantBaseline="middle" style={{ fill: 'var(--text-muted)', fontSize: 9, fontWeight: 700 }}>
            {t(COMP_LABEL[c.key as string])}
          </text>
        )
      })}
    </svg>
  )
}



export function ShadbalaTable({
  shadbala,
  hideDetails = false,
  preferClassicCharts = true,
  classicMultiChartOnly = false,
  variant = 'full',
  dashaNodes,
  grahas,
  ascRashi,
  showSthanaAnalysis = true,
  showKalaAnalysis = true,
  showDigDrigChestaAnalysis = true,
}: {
  shadbala: ShadbalaResult
  hideDetails?: boolean
  preferClassicCharts?: boolean
  classicMultiChartOnly?: boolean
  variant?: 'full' | 'widget'
  /** Vimshottari (or other) nodes — used for current/next MD cues. */
  dashaNodes?: DashaNode[]
  grahas?: GrahaData[]
  ascRashi?: Rashi
  showSthanaAnalysis?: boolean
  showKalaAnalysis?: boolean
  showDigDrigChestaAnalysis?: boolean
}) {
  const t = useTranslations('chartTools.shadbala')
  const { hi } = useLang()
  const planetName = (id: string) => {
    const code = id as PlanetCode
    return hi && code in GRAHA_HI ? GRAHA_HI[code as GrahaId] : (PLANET_NAMES[code] ?? id)
  }
  const labelOf = (band: string | undefined, ratio: number) => bandText((key) => t(key as 'status.excellent'), band, ratio)
  const [viewMode, setViewMode] = useState<ViewMode>(preferClassicCharts ? 'classic' : 'modern')
  const [active, setActive] = useState<PlanetCode>('Su')
  const [chartView, setChartView] = useState<'component' | 'classic_graphs'>(preferClassicCharts ? 'classic_graphs' : 'component')
  const [matrixView, setMatrixView] = useState<'worksheet' | 'rupas'>('worksheet')
  const planets = shadbala.planets

  const ranked = useMemo(
    () => ORDER.map((id) => planets[id]).filter(Boolean).sort((a, b) => b.total - a.total),
    [planets],
  )

  const strongest = (shadbala.strongest as PlanetCode) in PLANET_NAMES ? (shadbala.strongest as PlanetCode) : 'Su'
  const weakest = (shadbala.weakest as PlanetCode) in PLANET_NAMES ? (shadbala.weakest as PlanetCode) : 'Sa'
  const avgRatio = shadbala.averageRatio ?? (ranked.length ? ranked.reduce((s, p) => s + p.ratio, 0) / ranked.length : 0)
  const activePlanet = planets[active]



  if (variant === 'widget') {
    return (
      <div className="card" style={{ padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
        <div className="label-caps">{t('snapshot')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: '0.45rem' }}>
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', padding: '0.45rem' }}>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{t('strongest')}</div>
            <div style={{ marginTop: '0.15rem', fontWeight: 700 }}>{planetName(strongest)}</div>
          </div>
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', padding: '0.45rem' }}>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{t('weakest')}</div>
            <div style={{ marginTop: '0.15rem', fontWeight: 700 }}>{planetName(weakest)}</div>
          </div>
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', padding: '0.45rem' }}>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{t('avgRatio')}</div>
            <div style={{ marginTop: '0.15rem', fontWeight: 700 }}>{avgRatio.toFixed(2)}x</div>
          </div>
        </div>
        {showSthanaAnalysis ? (
          <SthanaBalaAnalysisPanel shadbala={shadbala} dashaNodes={dashaNodes} grahas={grahas} compact />
        ) : null}
        {showKalaAnalysis ? (
          <KalaBalaAnalysisPanel
            shadbala={shadbala}
            dashaNodes={dashaNodes}
            grahas={grahas}
            ascRashi={ascRashi}
            compact
          />
        ) : null}
        {showDigDrigChestaAnalysis ? (
          <DigDrigChestaAnalysisPanel
            shadbala={shadbala}
            dashaNodes={dashaNodes}
            grahas={grahas}
            ascRashi={ascRashi}
            compact
          />
        ) : null}
      </div>
    )
  }

  if (classicMultiChartOnly) {
    return <ClassicMetricCharts planets={planets} />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <div className="card" style={{ padding: '0.85rem 1rem', background: viewMode === 'classic' ? 'linear-gradient(135deg, rgba(132,27,27,0.12), rgba(166,124,0,0.08))' : 'linear-gradient(135deg, rgba(139,124,246,0.12), rgba(201,168,76,0.08))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div className="label-caps">{viewMode === 'classic' ? t('classicalTitle') : t('analyticsTitle')}</div>
            <div style={{ marginTop: '0.2rem', fontWeight: 700, fontSize: '0.9rem' }}>
              {t('summary', { strong: planetName(strongest), weak: planetName(weakest), ratio: avgRatio.toFixed(2) })}
            </div>
            <div style={{ marginTop: '0.1rem', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              {t('profile', { name: t(`profileName.${shadbala.generatedProfile ?? 'balanced'}`) })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>

            {/* Toggles hidden as per user request for classic view only */}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem' }}>
        {ORDER.map((id) => {
          const p = planets[id]
          if (!p) return null
          const on = active === id
          return (
            <button
              key={id}
              onClick={() => setActive(id)}
              style={{
                textAlign: 'left',
                border: `1px solid ${on ? 'var(--border-bright)' : 'var(--border)'}`,
                borderRadius: 'var(--r-md)',
                background: on ? 'var(--surface-2)' : 'var(--surface-1)',
                padding: '0.6rem',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>{PLANET_SYMBOL[id]} {planetName(id)}</div>
                <div style={{ fontSize: '0.66rem', fontWeight: 700, color: statusColor(p.ratio) }}>{labelOf(undefined, p.ratio)}</div>
              </div>
              <div style={{ marginTop: '0.15rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: statusColor(p.ratio) }}>
                {p.total.toFixed(3)} R
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{toShash(p.total).toFixed(0)} Sh · {p.ratio.toFixed(3)}x</div>
            </button>
          )
        })}
      </div>

      {chartView === 'classic_graphs' ? (
        <ClassicMetricCharts planets={planets} />
      ) : (
        <div className="card" style={{ padding: '0.8rem' }}>
          <div className="label-caps" style={{ marginBottom: '0.45rem' }}>{t('componentGraph', { planet: planetName(active) })}</div>
          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4 items-center">
            <div style={{ display: 'flex', justifyContent: 'center' }}><PolarHex planet={activePlanet} /></div>
            <div style={{ display: 'grid', gap: '0.38rem' }}>
              {COMPONENTS.map((c) => {
                const val = Number(activePlanet?.[c.key] ?? 0)
                const pct = Math.max(0, Math.min(100, (val / c.maxRupa) * 100))
                return (
                  <div key={c.key as string}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                      <span style={{ fontWeight: 700 }}>{t(COMP_LABEL[c.key as string])}</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{val.toFixed(3)} R ({toShash(val).toFixed(1)} Sh)</span>
                    </div>
                    <div style={{ marginTop: '0.15rem', height: 8, borderRadius: 99, background: 'var(--surface-3)', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--text-gold), var(--accent))' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: '0.8rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.55rem' }}>
          <div className="label-caps">
            {matrixView === 'worksheet' ? t('worksheetTitle') : t('rupasTitle')}
          </div>
          <div style={{ display: 'inline-flex', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', overflow: 'hidden' }}>
            {(['worksheet', 'rupas'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMatrixView(m)}
                style={{
                  padding: '0.28rem 0.6rem',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  background: matrixView === m ? 'var(--surface-3)' : 'transparent',
                  color: matrixView === m ? 'var(--text-gold)' : 'var(--text-muted)',
                }}
              >
                {m === 'worksheet' ? t('fullWorksheet') : t('rupasSummary')}
              </button>
            ))}
          </div>
        </div>
        {matrixView === 'worksheet' ? (
          <PLWorksheet planets={planets} />
        ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-bright)' }}>
                <th style={{ textAlign: 'left', padding: '0.35rem 0.45rem' }}>{t('component')}</th>
                {ORDER.map((id) => (
                  <th key={id} style={{ textAlign: 'center', padding: '0.35rem 0.25rem' }}>{id}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPONENTS.map((c) => (
                <tr key={c.key as string} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                  <td style={{ padding: '0.35rem 0.45rem', fontWeight: 700 }}>{c.label}</td>
                  {ORDER.map((id) => <td key={`${c.key}-${id}`} style={{ textAlign: 'center', padding: '0.35rem 0.25rem' }}>{((planets[id]?.[c.key] as number) ?? 0).toFixed(3)}</td>)}
                </tr>
              ))}
              <tr style={{ borderBottom: '1px solid var(--border-soft)' }}>
                <td style={{ padding: '0.35rem 0.45rem', fontWeight: 700 }}>{t('totalRupas')}</td>
                {ORDER.map((id) => <td key={`t-${id}`} style={{ textAlign: 'center', padding: '0.35rem 0.25rem', fontWeight: 700, color: statusColor(planets[id]?.ratio ?? 0) }}>{(planets[id]?.total ?? 0).toFixed(3)}</td>)}
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-soft)' }}>
                <td style={{ padding: '0.35rem 0.45rem', fontWeight: 700 }}>{t('totalSh')}</td>
                {ORDER.map((id) => <td key={`sh-${id}`} style={{ textAlign: 'center', padding: '0.35rem 0.25rem' }}>{(planets[id]?.totalShash ?? 0).toFixed(1)}</td>)}
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-soft)' }}>
                <td style={{ padding: '0.35rem 0.45rem', fontWeight: 700 }}>{t('required')}</td>
                {ORDER.map((id) => <td key={`r-${id}`} style={{ textAlign: 'center', padding: '0.35rem 0.25rem' }}>{(planets[id]?.required ?? 0).toFixed(2)}</td>)}
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-soft)' }}>
                <td style={{ padding: '0.35rem 0.45rem', fontWeight: 700 }}>{t('ratio')}</td>
                {ORDER.map((id) => <td key={`ra-${id}`} style={{ textAlign: 'center', padding: '0.35rem 0.25rem', color: statusColor(planets[id]?.ratio ?? 0), fontWeight: 700 }}>{(planets[id]?.ratio ?? 0).toFixed(3)}x</td>)}
              </tr>
              <tr>
                <td style={{ padding: '0.35rem 0.45rem', fontWeight: 700 }}>{t('band')}</td>
                {ORDER.map((id) => <td key={`b-${id}`} style={{ textAlign: 'center', padding: '0.35rem 0.25rem', fontWeight: 700 }}>{labelOf(planets[id]?.qualityBand, planets[id]?.ratio ?? 0)}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
        )}
      </div>

      {!hideDetails && (
        <div className="card" style={{ padding: '0.8rem' }}>
          <div className="label-caps" style={{ marginBottom: '0.45rem' }}>{t('rankings')}</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-bright)' }}>
                  <th style={{ textAlign: 'left', padding: '0.35rem 0.45rem' }}>{t('rank')}</th>
                  <th style={{ textAlign: 'left', padding: '0.35rem 0.45rem' }}>{t('planet')}</th>
                  <th style={{ textAlign: 'right', padding: '0.35rem 0.45rem' }}>{t('totalR')}</th>
                  <th style={{ textAlign: 'right', padding: '0.35rem 0.45rem' }}>{t('totalSh')}</th>
                  <th style={{ textAlign: 'right', padding: '0.35rem 0.45rem' }}>{t('required')}</th>
                  <th style={{ textAlign: 'right', padding: '0.35rem 0.45rem' }}>{t('ratio')}</th>
                  <th style={{ textAlign: 'right', padding: '0.35rem 0.45rem' }}>{t('band')}</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((p, i) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                    <td style={{ padding: '0.35rem 0.45rem', fontWeight: 700 }}>#{i + 1}</td>
                    <td style={{ padding: '0.35rem 0.45rem' }}>{planetName(p.id)}</td>
                    <td style={{ padding: '0.35rem 0.45rem', textAlign: 'right', fontWeight: 700 }}>{p.total.toFixed(3)}</td>
                    <td style={{ padding: '0.35rem 0.45rem', textAlign: 'right' }}>{p.totalShash.toFixed(1)}</td>
                    <td style={{ padding: '0.35rem 0.45rem', textAlign: 'right' }}>{p.required.toFixed(2)}</td>
                    <td style={{ padding: '0.35rem 0.45rem', textAlign: 'right', color: statusColor(p.ratio), fontWeight: 700 }}>{p.ratio.toFixed(3)}x</td>
                    <td style={{ padding: '0.35rem 0.45rem', textAlign: 'right', color: statusColor(p.ratio), fontWeight: 700 }}>{labelOf(p.qualityBand, p.ratio)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showSthanaAnalysis ? (
        <SthanaBalaAnalysisPanel shadbala={shadbala} dashaNodes={dashaNodes} grahas={grahas} />
      ) : null}

      {showKalaAnalysis ? (
        <KalaBalaAnalysisPanel
          shadbala={shadbala}
          dashaNodes={dashaNodes}
          grahas={grahas}
          ascRashi={ascRashi}
        />
      ) : null}

      {showDigDrigChestaAnalysis ? (
        <DigDrigChestaAnalysisPanel
          shadbala={shadbala}
          dashaNodes={dashaNodes}
          grahas={grahas}
          ascRashi={ascRashi}
        />
      ) : null}
    </div>
  )
}
