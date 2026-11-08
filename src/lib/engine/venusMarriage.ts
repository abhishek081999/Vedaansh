// src/lib/engine/venusMarriage.ts
// Venus as the marriage bridge: intensity, a Jupiter reading, combustion, and dasha.
// A strong Venus is not read as a perfect marriage, and a weak one is not a failed one.
// Pure engine — no React/DB.

import type { ChartOutput, Dignity, GrahaData, GrahaId } from '@/types/astrology'
import { fill, type EngineLang } from '@/lib/engine/lang'
import { VM_HI } from '@/lib/engine/locale/venusMarriage.hi'
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

function note(id: string, title: string, detail: string, tone: LifeTone, lang: EngineLang = 'en'): MarriedLifeNote {
  if (lang === 'hi') {
    const row = VM_HI.notes[id as keyof typeof VM_HI.notes]
    if (row) return { id, title: row.title, detail: row.detail, tone }
  }
  return { id, title, detail, tone }
}

export function analyzeVenusMarriage(chart: ChartOutput, lang: EngineLang = 'en'): VenusMarriageReading | null {
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
      lang,
    ))
  }

  if (sukhLike) {
    notes.push(note(
      'venus-sukh-like',
      'This can feel like contentment',
      'Jupiter is strong beside a dignified Venus, so the marriage can feel content. Venus has still not given sukh (settled marital happiness): the feeling is close to comfort, not a finished gift.',
      'mixed',
      lang,
    ))
  }

  if (broken && jupiterStrong) {
    notes.push(note(
      'venus-jupiter-meaning',
      'Jupiter can interpret a damaged Venus',
      'Venus is under pressure, and Jupiter is strong enough that the damage can be understood. This does not mean the marriage fails. Even so, the two do not become sukh (settled marital happiness) just because the meaning is available.',
      'mixed',
      lang,
    ))
  }

  if (combust) {
    notes.push(note(
      'venus-combust-muhurta',
      'A combust Venus is a poor basis for a wedding date',
      'Venus is combust, meaning it sits too close to the Sun and its strength is burned away. A marriage muhurta (auspicious wedding time) is not calculated from this Venus, and a wedding date is best not fixed while the planet is in that state.',
      'caution',
      lang,
    ))
  }

  if (venusDasha) {
    notes.push(note(
      'venus-dasha-shift',
      'Venus mahadasha is not the pre-marriage result',
      'Venus is running as mahadasha. The results that belonged to the years before marriage shift once this period is the one in force. The dasha is best read separately from the promise of the birth chart.',
      'mixed',
      lang,
    ))
  }

  return {
    name: chart.meta?.name ?? (lang === 'en' ? 'This chart' : VM_HI.defaultName),
    venus: notes,
    flags: { bridge, showpiece, sukhLike, combust, venusDasha },
  }
}

export function compareVenusMarriage(
  a: VenusMarriageReading,
  b: VenusMarriageReading,
  nameA: string,
  nameB: string,
  lang: EngineLang = 'en',
): MarriedLifeNote[] {
  if (a.flags.bridge === b.flags.bridge) return []
  const wide = a.flags.bridge === 'highway' ? nameA : nameB
  const rough = a.flags.bridge === 'broken' ? nameA : nameB
  const enDetail = `${rough} brings a damaged Venus. ${wide} brings a wide one. The match has to carry both bridges, not average them into one Venus.`
  if (lang === 'hi') {
    const row = VM_HI.notes['venus-pair-bridge']
    return [{
      id: 'venus-pair-bridge',
      title: row.title,
      detail: fill(row.detail, { rough, wide }),
      tone: 'mixed',
    }]
  }
  return [note(
    'venus-pair-bridge',
    'The two Venuses are not the same bridge',
    enDetail,
    'mixed',
    lang,
  )]
}
