// ─────────────────────────────────────────────────────────────
//  src/components/ui/MilanVisuals.tsx
//  Kundali Milan visuals — 36-guna koota ring, partner dasha timeline
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import type { ChartOutput, DashaNode } from '@/types/astrology'
import type { AshtakootResult } from '@/lib/engine/ashtakoot'
import type { DashaPairAnalysis } from '@/lib/engine/milanExtras'
import { lordColor, lordName } from '@/components/dasha/dashaPalette'
import { Gauge, SegmentRing, TimelineBand, VizCard, type BandSegment } from '@/components/ui/viz'

const KOOTA_ORDER = ['varna', 'vashya', 'tara', 'yoni', 'maitri', 'gana', 'bhakoot', 'nadi'] as const
function kootaColor(points: number, max: number, dosha?: boolean): string {
  if (dosha || points === 0) return 'var(--rose)'
  return points / max >= 0.75 ? 'var(--teal)' : 'var(--gold)'
}

export function MilanGunaRing({ ashtakoot }: { ashtakoot: AshtakootResult }) {
  const t = useTranslations('relationshipMarriage.compareMil.viz')
  const kootaLabel = (k: (typeof KOOTA_ORDER)[number]) => t(`koota.${k}`)
  const segments = KOOTA_ORDER.map((k) => {
    const s = ashtakoot[k]
    const label = kootaLabel(k)
    return {
      label,
      value: s.points,
      max: s.max,
      color: kootaColor(s.points, s.max, s.dosha),
      title: `${label}: ${s.points}/${s.max} — ${s.meaning}`,
    }
  })
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '0.75rem' }}>
      <VizCard
        title={t('gunaTitle')}
        caption={t('gunaCaption')}
        legend={[
          { label: t('strong'), color: 'var(--teal)' },
          { label: t('partial'), color: 'var(--gold)' },
          { label: t('zeroDosha'), color: 'var(--rose)' },
        ]}
      >
        <SegmentRing segments={segments} centerValue={`${ashtakoot.total}`} centerLabel={t('of36')} size={210} ariaLabel={t('ashtakootAria', { total: ashtakoot.total })} />
      </VizCard>
      <VizCard title={t('gaugeTitle')} caption={t('gaugeCaption')}>
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

  const t = useTranslations('relationshipMarriage.compareMil.viz')
  if (!segments.length) return null
  return (
    <VizCard
      title={t('timelineTitle')}
      caption={t('timelineCaption')}
      legend={[
        { label: t('supportiveOverlap'), color: 'var(--teal)' },
        { label: t('mixed'), color: 'var(--gold)' },
        { label: t('needsCare'), color: 'var(--rose)' },
      ]}
    >
      <TimelineBand segments={segments} laneLabels={[nameA, nameB, t('overlapLane')]} from={from} to={to} now={Date.now()} ariaLabel={t('timelineAria')} />
    </VizCard>
  )
}
