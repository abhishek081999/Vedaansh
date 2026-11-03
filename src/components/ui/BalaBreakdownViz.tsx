// ─────────────────────────────────────────────────────────────
//  src/components/ui/BalaBreakdownViz.tsx
//  Shared visual for a single Shadbala component (Sthana, Kala, Dig…):
//  per-planet bars vs classical minimum + active planet's sub-part radar
// ─────────────────────────────────────────────────────────────
'use client'

import React from 'react'
import type { GrahaId } from '@/types/astrology'
import { lordColor } from '@/components/dasha/dashaPalette'
import { BarList, RadarChart, VizCard } from '@/components/ui/viz'

export interface BalaVizRow {
  id: GrahaId
  name: string
  virupas: number
}

export function BalaBreakdownViz({
  title,
  rows,
  classicalMin,
  activeId,
  breakdown,
  breakdownLabels,
}: {
  title: string
  rows: BalaVizRow[]
  classicalMin?: number
  activeId?: GrahaId
  /** Active planet's sub-components, in the same order as breakdownLabels. */
  breakdown?: Record<string, number> | null
  breakdownLabels?: Record<string, string>
}) {
  const keys = breakdownLabels ? Object.keys(breakdownLabels) : []
  const active = rows.find((r) => r.id === activeId)
  const showRadar = !!(breakdown && active && keys.length >= 3)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: showRadar ? 'repeat(auto-fit, minmax(260px, 1fr))' : '1fr', gap: '0.6rem' }}>
      <VizCard
        title={`${title} by planet`}
        caption={classicalMin ? `Bar = Virupas · tick = classical minimum ${classicalMin}` : 'Virupas per planet'}
      >
        <BarList
          rows={rows.map((r) => ({
            key: r.id,
            label: r.name,
            value: r.virupas,
            threshold: classicalMin,
            color: r.id === activeId ? lordColor(r.id) : classicalMin ? (r.virupas >= classicalMin ? 'var(--teal)' : 'var(--rose)') : lordColor(r.id),
            valueText: r.virupas.toFixed(0),
          }))}
          unit="V"
        />
      </VizCard>
      {showRadar && breakdown && active && breakdownLabels && (
        <VizCard title={`${active.name} · ${title} parts`} caption="Shape of the sub-strengths that make up this score">
          <RadarChart
            axes={keys.map((k) => breakdownLabels[k])}
            series={[{ label: active.name, values: keys.map((k) => Math.max(0, breakdown[k] ?? 0)), color: lordColor(active.id) }]}
            size={190}
          />
        </VizCard>
      )}
    </div>
  )
}
