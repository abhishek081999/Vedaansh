'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/today/TodayChartCard.tsx
//  Natal chart with today's live transit planets overlaid, so the
//  reading can be checked against where the planets actually sit.
// ─────────────────────────────────────────────────────────────

import React, { useMemo } from 'react'
import type { ChartOutput, GrahaData } from '@/types/astrology'
import type { TodayTransitGraha } from '@/lib/engine/todayReading'
import { ChakraSelector } from '@/components/chakra/ChakraSelector'
import styles from './today-reading.module.css'

/**
 * The chart components read only id / rashi / degree / retro / nakshatra from
 * the transit overlay, so the live-position payload is adapted rather than
 * recomputing a full GrahaData chart for the current instant.
 */
function toOverlay(t: TodayTransitGraha[]): GrahaData[] {
  return t.map(g => ({
    id: g.id,
    name: g.id,
    lonTropical: 0,
    lonSidereal: g.lonSidereal,
    latitude: 0,
    speed: g.speed ?? 0,
    isRetro: g.isRetro,
    isCombust: false,
    rashi: g.rashi,
    rashiName: '',
    degree: g.degree,
    totalDegree: g.lonSidereal,
    nakshatraIndex: g.nakshatraIndex,
    nakshatraName: g.nakshatraName,
    pada: g.pada,
  })) as unknown as GrahaData[]
}

export function TodayChartCard({ chart, transit }: { chart: ChartOutput; transit: TodayTransitGraha[] }) {
  const overlay = useMemo(() => toOverlay(transit), [transit])
  const moonNak = chart.grahas.find(g => g.id === 'Mo')?.nakshatraIndex ?? 0

  return (
    <section className={styles.card} aria-label="Your chart with today's transits">
      <h2 className={styles.cardTitle}>Your chart · today&apos;s transits</h2>
      <div className={styles.chartWrap}>
        <ChakraSelector
          ascRashi={chart.lagnas.ascRashi}
          grahas={chart.grahas}
          lagnas={chart.lagnas}
          transitGrahas={overlay}
          moonNakIndex={moonNak}
          defaultStyle="north"
          size={420}
        />
      </div>
      <p className={styles.note}>
        Your natal planets are shown as usual; the purple planets are where the planets are right now. Open Chart Settings to switch style or hide the natal layer.
      </p>
    </section>
  )
}
