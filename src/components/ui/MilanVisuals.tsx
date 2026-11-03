// ─────────────────────────────────────────────────────────────
//  src/components/ui/MilanVisuals.tsx
//  Kundali Milan visuals — 36-guna koota ring, partner dasha timeline
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useMemo } from 'react'
import type { ChartOutput, DashaNode } from '@/types/astrology'
import type { AshtakootResult } from '@/lib/engine/ashtakoot'
import type { DashaPairAnalysis } from '@/lib/engine/milanExtras'
import { lordColor, lordName } from '@/components/dasha/dashaPalette'
import { Gauge, SegmentRing, TimelineBand, VizCard, type BandSegment } from '@/components/ui/viz'

const KOOTA_ORDER = ['varna', 'vashya', 'tara', 'yoni', 'maitri', 'gana', 'bhakoot', 'nadi'] as const
const KOOTA_LABEL: Record<(typeof KOOTA_ORDER)[number], string> = {
  varna: 'Varna', vashya: 'Vashya', tara: 'Tara', yoni: 'Yoni',
  maitri: 'Maitri', gana: 'Gana', bhakoot: 'Bhakoot', nadi: 'Nadi',
}

function kootaColor(points: number, max: number, dosha?: boolean): string {
  if (dosha || points === 0) return 'var(--rose)'
  return points / max >= 0.75 ? 'var(--teal)' : 'var(--gold)'
}

export function MilanGunaRing({ ashtakoot }: { ashtakoot: AshtakootResult }) {
  const segments = KOOTA_ORDER.map((k) => {
    const s = ashtakoot[k]
    return {
      label: KOOTA_LABEL[k],
      value: s.points,
      max: s.max,
      color: kootaColor(s.points, s.max, s.dosha),
      title: `${KOOTA_LABEL[k]}: ${s.points}/${s.max} — ${s.meaning}`,
    }
  })
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '0.75rem' }}>
      <VizCard
        title="36 gunas by koota"
        caption="Each arc's length is that koota's weight (Varna 1 … Nadi 8); the filled part is what this match scored."
        legend={[
          { label: 'Strong', color: 'var(--teal)' },
          { label: 'Partial', color: 'var(--gold)' },
          { label: 'Zero / dosha', color: 'var(--rose)' },
        ]}
      >
        <SegmentRing segments={segments} centerValue={`${ashtakoot.total}`} centerLabel="of 36" size={210} ariaLabel={`Ashtakoot ${ashtakoot.total} of 36`} />
      </VizCard>
      <VizCard title="Where the score sits" caption="Traditional minimum 18 · usual range 18–32 · above 32 read with care">
        <Gauge
          value={ashtakoot.total}
          max={36}
          valueText={`${ashtakoot.total}/36`}
          label={ashtakoot.eligibility.label}
          zones={[
            { from: 0, to: 18, color: 'var(--rose)' },
            { from: 18, to: 32, color: 'var(--teal)' },
            { from: 32, to: 36, color: 'var(--gold)' },
          ]}
          size={220}
        />
      </VizCard>
    </div>
  )
}

function mahas(chart: ChartOutput): DashaNode[] {
  const nodes = chart.dashas?.vimshottari ?? []
  const l1 = nodes.filter((n) => n.level === 1)
  return l1.length ? l1 : nodes
}

const TONE_COLOR: Record<string, string> = { supportive: 'var(--teal)', caution: 'var(--rose)', mixed: 'var(--gold)' }

export function MilanDashaTimeline({
  chartA,
  chartB,
  dashaPair,
  nameA = 'Partner A',
  nameB = 'Partner B',
}: {
  chartA: ChartOutput
  chartB: ChartOutput
  dashaPair: DashaPairAnalysis
  nameA?: string
  nameB?: string
}) {
  const { segments, from, to } = useMemo(() => {
    const now = Date.now()
    const from = now - 5 * 365.25 * 864e5
    const to = now + 25 * 365.25 * 864e5
    const segs: BandSegment[] = []
    ;[mahas(chartA), mahas(chartB)].forEach((list, lane) => {
      list.forEach((n, i) => {
        segs.push({
          key: `${lane}-${i}`,
          start: n.start,
          end: n.end,
          lane,
          color: lordColor(n.lord),
          label: lordName(n.lord),
          emphasis: n.isCurrent,
          title: `${lane === 0 ? nameA : nameB}: ${lordName(n.lord)} Mahadasha`,
        })
      })
    })
    dashaPair.windows.forEach((w, i) => {
      segs.push({
        key: `w-${i}`,
        start: w.overlapStart,
        end: w.overlapEnd,
        lane: 2,
        color: TONE_COLOR[w.tone] ?? 'var(--gold)',
        label: `${w.personALord}·${w.personBLord}`,
        title: `${lordName(w.personALord)} + ${lordName(w.personBLord)} — ${w.relation}. ${w.note}`,
      })
    })
    return { segments: segs, from, to }
  }, [chartA, chartB, dashaPair, nameA, nameB])

  if (!segments.length) return null
  return (
    <VizCard
      title="Shared life phases"
      caption="Both partners' Vimshottari Mahadashas side by side; the bottom lane marks the overlap windows the engine scored. Gold line = today."
      legend={[
        { label: 'Supportive overlap', color: 'var(--teal)' },
        { label: 'Mixed', color: 'var(--gold)' },
        { label: 'Needs care', color: 'var(--rose)' },
      ]}
    >
      <TimelineBand segments={segments} laneLabels={[nameA, nameB, 'Overlap']} from={from} to={to} now={Date.now()} ariaLabel="Partner dasha timeline" />
    </VizCard>
  )
}
