// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lagnaDashaLinks.ts
//  Links the running Vimshottari Maha/Antar dasha lords to the Lagna's
//  houses: where each lord sits and which houses it rules
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, DashaNode, Rashi } from '@/types/astrology'
import { wholeSignHouseFromLagna, type HouseNumber } from '@/lib/engine/houseInterpretations'
import { housesRuledBy } from '@/lib/engine/lagnaChartOverlay'

export interface DashaLordLink {
  level: 'Mahadasha' | 'Antardasha'
  lord: string
  start: Date | null
  end: Date | null
  /** House where the lord sits, null for planets not in the chart (or Rahu/Ketu ownership). */
  placedHouse: HouseNumber | null
  /** Houses this lord owns for the Lagna (empty for Rahu/Ketu). */
  ruledHouses: HouseNumber[]
}

/** Current Mahadasha then Antardasha, or an empty array when no dasha is flagged current. */
export function getCurrentDashaPath(chart: Pick<ChartOutput, 'dashas'>): DashaNode[] {
  const nodes = chart.dashas?.vimshottari
  if (!nodes?.length) return []
  const path: DashaNode[] = []
  let cur: DashaNode | undefined = nodes.find((n) => n.isCurrent)
  while (cur) {
    path.push(cur)
    cur = cur.children?.find((c) => c.isCurrent)
  }
  return path
}

export function getLagnaDashaLinks(
  chart: Pick<ChartOutput, 'dashas' | 'grahas'>,
  ascRashi: Rashi,
): DashaLordLink[] {
  const path = getCurrentDashaPath(chart).slice(0, 2)
  return path.map((node, i) => {
    const g = chart.grahas.find((p) => p.id === node.lord)
    return {
      level: i === 0 ? 'Mahadasha' : 'Antardasha',
      lord: node.lord,
      start: node.start ?? null,
      end: node.end ?? null,
      placedHouse: g ? wholeSignHouseFromLagna(ascRashi, g.rashi) : null,
      ruledHouses: housesRuledBy(ascRashi, node.lord),
    }
  })
}

/** Unique houses touched by the running dasha lords (sitting or ruling), ascending. */
export function getDashaTouchedHouses(links: DashaLordLink[]): HouseNumber[] {
  const set = new Set<HouseNumber>()
  for (const l of links) {
    if (l.placedHouse) set.add(l.placedHouse)
    for (const h of l.ruledHouses) set.add(h)
  }
  return Array.from(set).sort((a, b) => a - b)
}
