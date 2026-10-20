// src/lib/engine/venusMarriage.ts
// Venus as the marriage bridge: intensity, a Jupiter reading, combustion, and dasha.
// A strong Venus is not read as a perfect marriage, and a weak one is not a failed one.
// Pure engine — no React/DB.

import type { ChartOutput, Dignity, GrahaData, GrahaId } from '@/types/astrology'
import type { LifeTone, MarriedLifeNote } from '@/lib/engine/marriedLifeAnalysis'

export type VenusBridge = 'highway' | 'broken'

export interface VenusMarriageFlags {
  bridge: VenusBridge
  showpiece: boolean
  sukhLike: boolean
  combust: boolean
  venusDasha: boolean
}

export interface VenusMarriageReading {
  name: string
  venus: MarriedLifeNote[]
  flags: VenusMarriageFlags
}

const STRONG: Dignity[] = ['exalted', 'moolatrikona', 'own']

function find(list: GrahaData[] | undefined, id: GrahaId): GrahaData | undefined {
  return list?.find(g => g.id === id)
}

function strong(d: Dignity | undefined): boolean {
  return !!d && STRONG.includes(d)
}

function note(id: string, title: string, detail: string, tone: LifeTone): MarriedLifeNote {
  return { id, title, detail, tone }
}

export function analyzeVenusMarriage(chart: ChartOutput): VenusMarriageReading | null {
  const asc = chart.lagnas?.ascRashi
  if (!asc) return null

  const venus = find(chart.grahas, 'Ve')
  const jupiter = find(chart.grahas, 'Ju')
  const dignified = strong(venus?.dignity)
  const jupiterStrong = strong(jupiter?.dignity)
  const combust = !!venus?.isCombust
  const broken = !venus || venus.dignity === 'debilitated' || venus.dignity === 'enemy' || venus.dignity === 'great_enemy'
  const bridge: VenusBridge = broken ? 'broken' : 'highway'
  const showpiece = bridge === 'highway' && !jupiterStrong
  const sukhLike = bridge === 'highway' && jupiterStrong
  const venusDasha = chart.dashas?.vimshottari?.[0]?.lord === 'Ve'
  const notes: MarriedLifeNote[] = []

  if (showpiece) {
    notes.push(note(
      'venus-showpiece',
      'Venus is intense, and the marriage is a showpiece',
      'Venus is dignified, and Jupiter is not strong enough to give it depth. The bond has shine and no depth. It is a showpiece, not a perfect marriage.',
      'mixed',
    ))
  }

  if (sukhLike) {
    notes.push(note(
      'venus-sukh-like',
      'This can feel like contentment',
      'Jupiter is strong beside a dignified Venus, so the marriage can feel content. Venus has still not given sukh. The feeling is close to comfort. It is still not given sukh as a finished gift.',
      'mixed',
    ))
  }

  if (broken && jupiterStrong) {
    notes.push(note(
      'venus-jupiter-meaning',
      'Jupiter can interpret a damaged Venus',
      'Venus is afflicted, and Jupiter is strong enough that the damage can be understood. This is not a sentence that the marriage fails. The two do not become sukh just because the meaning is available.',
      'mixed',
    ))
  }

  if (combust) {
    notes.push(note(
      'venus-combust-muhurta',
      'Do not fix a marriage muhurta on a combust Venus',
      'Venus is combust. A marriage muhurta is not calculated from this Venus, and the wedding date is not fixed while the planet is burned.',
      'caution',
    ))
  }

  if (venusDasha) {
    notes.push(note(
      'venus-dasha-shift',
      'Venus mahadasha is not the pre-marriage result',
      'Venus is running as mahadasha. The results that belonged to the years before marriage shift once this period is the one in force. Read the dasha apart from the natal promise.',
      'mixed',
    ))
  }

  return {
    name: chart.meta?.name ?? 'This chart',
    venus: notes,
    flags: { bridge, showpiece, sukhLike, combust, venusDasha },
  }
}

export function compareVenusMarriage(
  a: VenusMarriageReading,
  b: VenusMarriageReading,
  nameA: string,
  nameB: string,
): MarriedLifeNote[] {
  if (a.flags.bridge === b.flags.bridge) return []
  const wide = a.flags.bridge === 'highway' ? nameA : nameB
  const rough = a.flags.bridge === 'broken' ? nameA : nameB
  return [note(
    'venus-pair-bridge',
    'The two Venuses are not the same bridge',
    `${rough} brings a damaged Venus. ${wide} brings a wide one. The match has to carry both bridges, not average them into one Venus.`,
    'mixed',
  )]
}
