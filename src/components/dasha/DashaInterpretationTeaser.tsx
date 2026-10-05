'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/dasha/DashaInterpretationTeaser.tsx
//  Compact Vimshottari insight for dashboard → navigates to full panel
// ─────────────────────────────────────────────────────────────

import React, { useMemo } from 'react'
import type {
  AshtakavargaResult,
  ChartOutput,
  DashaNode,
  GrahaData,
  Rashi,
  ShadbalaResult,
} from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'
import { analyzeVimshottariPeriod } from '@/lib/engine/dasha/vimshottariAnalysis'
import { getVimshottariInterpretation } from '@/lib/engine/dasha/vimshottariInterpretations'

export interface DashaInterpretationTeaserProps {
  nodes: DashaNode[]
  grahas: GrahaData[]
  ascRashi: Rashi
  shadbala?: ShadbalaResult | null
  ashtakavarga?: AshtakavargaResult | null
  navamshaGrahas?: GrahaData[] | null
  onOpenFull: () => void
}

/** Convenience wrapper from a full chart. */
export function DashaInterpretationTeaserFromChart({
  chart,
  nodes,
  onOpenFull,
}: {
  chart: ChartOutput
  nodes: DashaNode[]
  onOpenFull: () => void
}) {
  return (
    <DashaInterpretationTeaser
      nodes={nodes}
      grahas={chart.grahas}
      ascRashi={chart.lagnas.ascRashi}
      shadbala={chart.shadbala}
      ashtakavarga={chart.ashtakavarga}
      navamshaGrahas={chart.vargas?.D9}
      onOpenFull={onOpenFull}
    />
  )
}

export function DashaInterpretationTeaser({
  nodes,
  grahas,
  ascRashi,
  shadbala,
  ashtakavarga,
  navamshaGrahas,
  onOpenFull,
}: DashaInterpretationTeaserProps) {
  const { analysis, mahaTitle, antarLord } = useMemo(() => {
    const path: DashaNode[] = []
    let cur = nodes.find(n => n.isCurrent)
    while (cur) {
      path.push(cur)
      cur = cur.children?.find(c => c.isCurrent)
    }
    const maha = path[0] ? getVimshottariInterpretation(path[0].lord) : null
    return {
      analysis: analyzeVimshottariPeriod({
        nodes,
        ascRashi,
        grahas,
        shadbala,
        ashtakavarga,
        navamshaGrahas,
      }),
      mahaTitle: maha?.title ?? (path[0] ? GRAHA_NAMES[path[0].lord as keyof typeof GRAHA_NAMES] ?? path[0].lord : null),
      antarLord: path[1]?.lord ?? null,
    }
  }, [nodes, ascRashi, grahas, shadbala, ashtakavarga, navamshaGrahas])

  if (!mahaTitle || !analysis) return null

  const { insight } = analysis
  const toneColor =
    insight.toneLabel === 'Favorable stretch'
      ? 'var(--teal)'
      : insight.toneLabel === 'Challenging stretch'
        ? 'var(--rose)'
        : 'var(--gold)'

  return (
    <div
      className="card"
      style={{
        padding: '0.65rem 0.75rem',
        border: '1px solid var(--gold-faint)',
        background: 'linear-gradient(135deg, var(--surface-1) 0%, rgba(201,168,76,0.06) 100%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.45rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div style={{ minWidth: 0 }}>
          <div className="label-caps" style={{ fontSize: '0.58rem', color: 'var(--text-gold)', marginBottom: 2 }}>
            Dasha insight
          </div>
          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
            {mahaTitle}
            {antarLord && (
              <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: 6 }}>
                / {GRAHA_NAMES[antarLord as keyof typeof GRAHA_NAMES] ?? antarLord} Antar
              </span>
            )}
          </div>
          <div
            className="label-caps"
            style={{ fontSize: '0.56rem', color: toneColor, marginTop: 3, letterSpacing: '0.04em' }}
          >
            {insight.toneLabel}
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenFull}
          className="btn btn-secondary btn-sm"
          style={{ flexShrink: 0, fontSize: '0.65rem', whiteSpace: 'nowrap' }}
        >
          Full reading →
        </button>
      </div>

      <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
        {insight.headline}
      </p>

      <ul style={{ margin: 0, paddingLeft: '1.05rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {insight.bullets.map((b, i) => (
          <li key={i} style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            {b}
          </li>
        ))}
      </ul>

      {insight.watch && (
        <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--rose)', lineHeight: 1.35 }}>
          Watch: {insight.watch}
        </p>
      )}

      <div style={{ display: 'flex', height: 5, borderRadius: 3, overflow: 'hidden', background: 'var(--surface-3)' }}>
        <div style={{ width: `${analysis.favorableShare}%`, background: 'var(--teal)' }} />
        <div style={{ width: `${analysis.neutralShare}%`, background: 'var(--gold)' }} />
        <div style={{ width: `${analysis.challengingShare}%`, background: 'var(--rose)' }} />
      </div>
      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
        {analysis.favorableShare}% fav · {analysis.neutralShare}% neu · {analysis.challengingShare}% challenge
      </div>
    </div>
  )
}
