// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nakshatraTaramandal.ts
//  Taramandal (star-constellation groups) — distinct from Navtara.
//  Every nakshatra belongs to one or more mandals; planets in a
//  mandal take on that mandal's cosmic flavour.
//  Source: satsang teaching (Garuda, Naga, Deva, … Pashu).
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, GrahaData, GrahaId } from '@/types/astrology'
import { GRAHA_NAMES, NAKSHATRA_NAMES } from '@/types/astrology'

/** Canonical mandal ids (10 taught + 2 forthcoming stubs). */
export type TaramandalId =
  | 'garuda'
  | 'naga'
  | 'deva'
  | 'rakshasa'
  | 'pitru'
  | 'marut'
  | 'agni'
  | 'soma'
  | 'vaishya'
  | 'pashu'
  | 'mrityu_karma' // forthcoming — king known (Mula)
  | 'gyan'         // forthcoming — king known (Jyeshtha)

export type MembershipRole = 'full' | 'partial'

export interface TaramandalMember {
  nakshatraIndex: number
  role: MembershipRole
}

export interface PlanetMandalNote {
  grahaId: GrahaId
  summary: string
  details: string[]
}

export interface TaramandalDefinition {
  id: TaramandalId
  name: string
  sanskrit: string
  /** Alternate English label when taught under another name */
  aka?: string
  /** King nakshatra index (0–26); null if mandal not yet fully taught */
  kingIndex: number | null
  kingWhy: string
  theme: string
  functions: string[]
  works: string[]
  members: TaramandalMember[]
  /** Planet-in-mandal flavour notes taught so far (e.g. Sun examples) */
  planetNotes: PlanetMandalNote[]
  /** false for stubs still awaiting full nakshatra lists */
  complete: boolean
  pendingNote?: string
}

export interface TaramandalPlanetHit {
  grahaId: GrahaId
  grahaName: string
  nakshatraIndex: number
  nakshatraName: string
  pada: number
  role: MembershipRole
  isKing: boolean
  notes: PlanetMandalNote | null
}

export interface TaramandalChartView {
  mandal: TaramandalDefinition
  planetHits: TaramandalPlanetHit[]
  moonInMandal: boolean
  lagnaInMandal: boolean
}

export interface NakshatraMandalMembership {
  mandalId: TaramandalId
  mandalName: string
  role: MembershipRole
  isKing: boolean
}

export interface TaramandalChartAnalysis {
  birthNakshatraIndex: number
  birthNakshatraName: string
  birthMemberships: NakshatraMandalMembership[]
  mandals: TaramandalChartView[]
  /** Nakshatras with no taught membership yet */
  uncoveredNakshatras: Array<{ index: number; name: string }>
  insight: string
}

const CORE_GRAHAS: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

function m(index: number, role: MembershipRole = 'full'): TaramandalMember {
  return { nakshatraIndex: index, role }
}

/**
 * Ten taught Taramandals + two forthcoming stubs.
 * Indices: Ashwini=0 … Revati=26 (see NAKSHATRA_NAMES).
 */
export const TARAMANDALS: TaramandalDefinition[] = [
  {
    id: 'garuda',
    name: 'Garuda Mandal',
    sanskrit: 'Garuda Tārāmaṇḍala',
    kingIndex: 21, // Shravana
    kingWhy:
      'Vishnu is the deity of Shravana; cosmic sound, guidance, and direction flow through Garuda energy via this star.',
    theme: 'Protection, communication, and cosmic messaging along the sky-path.',
    functions: [
      'Protect the native',
      'Make you a communicator and message-bearer',
      'Open the sky-path (ākāśa mārga)',
      'Sharpen hearing / receptive power (śravaṇa śakti)',
      'Give direction and guidance',
    ],
    works: [
      'Relay cosmic sound, cosmic energy, and cosmic messages',
      'Travel or messages received through dreams, cosmic energy, or elders',
      'Bring career clarity',
    ],
    members: [m(21), m(22), m(23)], // Shravana, Dhanishtha, Shatabhisha
    planetNotes: [
      {
        grahaId: 'Su',
        summary: 'Guidance, leadership, intelligence, journalism / public voice.',
        details: [
          'Sun in Garuda tends to guide, lead, and broadcast intelligence.',
          'Journalism, media, and fame can show even when Mercury looks weak on paper.',
          'Sun in Shravana specifically: karmic drive to reach the top of the pyramid — CEO / apex authority in the chosen field.',
        ],
      },
    ],
    complete: true,
  },
  {
    id: 'naga',
    name: 'Naga Mandal',
    sanskrit: 'Nāga Maṇḍala',
    kingIndex: 8, // Ashlesha
    kingWhy:
      'Ashlesha is the coiled-serpent star — the seat of Naga energy that holds and transforms occult / kundalini force.',
    theme: 'Hidden powers, kundalini, fear, and transformation.',
    functions: [
      'Awaken hidden powers and kundalini',
      'Surface and work through fear',
      'Transform energy (the Naga “fan” spreads and reshapes force)',
      'Reveal hidden secrets',
    ],
    works: [
      'Bring karmas into conscious view from time to time',
      'Purify emotions',
    ],
    members: [m(5), m(8), m(17)], // Ardra, Ashlesha, Jyeshtha
    planetNotes: [
      {
        grahaId: 'Su',
        summary: 'Tantric / occult Sun — aura mastery and hard boundaries.',
        details: [
          'Sun in Naga becomes a tantric Sun: hidden anger and occult-related mastery.',
          'Whether or not you identify as spiritual, intelligence is pulled off the usual track toward occult / edge knowledge.',
          'Strong control of aura and boundaries — who enters your field, whose vibe feels safe or unsafe.',
        ],
      },
    ],
    complete: true,
  },
  {
    id: 'deva',
    name: 'Deva Mandal',
    sanskrit: 'Deva Maṇḍala',
    kingIndex: 7, // Pushya
    kingWhy:
      'Jupiter rules Pushya — the sattvic, nourishing star that anchors dharma and blessing in this group.',
    theme: 'Dharma, virtue, blessings, and the flow of knowledge.',
    functions: [
      'Protect and increase the inner flow of knowledge',
      'Distribute knowledge',
      'Uphold dharma, virtues, and blessings',
    ],
    works: [
      'Increase auspicious (śubha) karma',
      'Protect family, children, and wealth',
      'Support spiritual advancement',
    ],
    members: [m(7), m(25), m(3), m(6)], // Pushya, Uttara Bhadra, Rohini, Punarvasu
    planetNotes: [],
    complete: true,
  },
  {
    id: 'rakshasa',
    name: 'Rakshasa Mandal',
    sanskrit: 'Rākṣasa Maṇḍala',
    aka: 'Asura group',
    kingIndex: 2, // Krittika
    kingWhy:
      'Krittika is the purified form of Agni with cutting, separating, and breaking force — raw asura strength used in destruction and breakthrough.',
    theme: 'Power, strength, enjoyment (bhoga), anger, and victory.',
    functions: [
      'Grant power and strength',
      'Fuel bhoga (enjoyment) and krodha (anger)',
      'Deliver victory',
    ],
    works: [
      'Drive aggressive breakthroughs — often through destruction of the outer obstacle and the inner pattern',
      'Carry strong sexual magnetism',
    ],
    members: [m(2), m(10), m(19), m(15)], // Krittika, Purva Phalguni, Purva Ashadha, Vishakha
    planetNotes: [],
    complete: true,
  },
  {
    id: 'pitru',
    name: 'Pitru Mandal',
    sanskrit: 'Pitṛ Tārāmaṇḍala',
    kingIndex: 9, // Magha
    kingWhy:
      'The Pitrs are directly linked to Magha — throne, ancestral energy, and lineage all issue from this star.',
    theme: 'Lineage, ancestral karma, and DNA-level memory.',
    functions: [
      'Carry lineage (lineage DNA / ancestral memory)',
      'Activate ancestors’ responsibilities placed on you',
      'Leadership of family and family karma',
    ],
    works: [
      'Reflect ancestral duty into career and public role',
      'Validate and activate lineage contracts over time',
    ],
    members: [
      m(9),           // Magha
      m(11),          // Uttara Phalguni
      m(20, 'partial'), // Uttara Ashadha (partial)
    ],
    planetNotes: [
      {
        grahaId: 'Su',
        summary: 'Authority inherited from father or lineage.',
        details: [
          'Sun in Pitru almost always confers authority.',
          'That authority often arrives through the father or the wider lineage.',
        ],
      },
    ],
    complete: true,
  },
  {
    id: 'marut',
    name: 'Marut Mandal',
    sanskrit: 'Māruta Maṇḍala',
    aka: 'Vayu Mandal',
    kingIndex: 14, // Swati
    kingWhy: 'Swati is the wind-star — intelligence and speed that move like Marut / Vayu.',
    theme: 'Speed, intelligence, and communication.',
    functions: [
      'Give speed and sharp intelligence',
      'Strengthen communication',
      'Innovate thought process',
      'Build networking',
    ],
    works: [
      'Mind runs very fast before any major success',
      'Pulls the native toward intellect-related work (intellectual status / merit)',
    ],
    members: [
      m(23),           // Shatabhisha
      m(14),           // Swati
      m(22, 'partial'), // Dhanishtha (partial)
    ],
    planetNotes: [],
    complete: true,
  },
  {
    id: 'agni',
    name: 'Agni Mandal',
    sanskrit: 'Agni Maṇḍala',
    kingIndex: 24, // Purva Bhadra
    kingWhy:
      'Purva Bhadrapada holds fire, tantra, and tapas together — the central Rudra form of this mandal.',
    theme: 'Purification, tapas, and transformative fire.',
    functions: [
      'Purify',
      'Give tapas and drive toward action (karma)',
      'Keep light (ujālā) in life',
      'Fuel transformation',
    ],
    works: [
      'Sharply raise decision-making capacity',
      'Burn / balance pāpa (one’s own and, at times, others’)',
      'Accelerate speed of execution',
    ],
    members: [m(2), m(1), m(24), m(15)], // Krittika, Bharani, Purva Bhadra, Vishakha
    planetNotes: [],
    complete: true,
  },
  {
    id: 'soma',
    name: 'Soma Mandal',
    sanskrit: 'Soma Maṇḍala',
    kingIndex: 3, // Rohini
    kingWhy: 'Rohini carries the fullest Chandra / Apsara nectar of this group.',
    theme: 'Apsara and Moon energy — emotion, art, affection, softness.',
    functions: [
      'Deepen emotions and affection',
      'Open art and aesthetic sensitivity',
      'Soften and nourish (komalatā)',
    ],
    works: [
      'Colour relationships, creativity, and emotional tone of the chart',
    ],
    members: [m(3), m(12), m(26)], // Rohini, Hasta, Revati
    planetNotes: [],
    complete: true,
  },
  {
    id: 'vaishya',
    name: 'Vaishya Mandal',
    sanskrit: 'Vaiśya Maṇḍala',
    kingIndex: 16, // Anuradha
    kingWhy: 'Anuradha holds Lakshmi’s growth-and-harmony current for this group.',
    theme: 'Growth, nourishment, wealth, and good fortune (Lakshmi energy).',
    functions: [
      'Increase wealth',
      'Raise social standing',
      'Bring harmony into relationships',
    ],
    works: [
      'Nourish and expand resources over time',
      'Support saubhāgya (good fortune)',
    ],
    members: [
      m(16),           // Anuradha
      m(11),           // Uttara Phalguni
      m(21, 'partial'), // Shravana (partial)
    ],
    planetNotes: [],
    complete: true,
  },
  {
    id: 'pashu',
    name: 'Cosmic Pashu Mandal',
    sanskrit: 'Brahmāṇḍīya Paśu Maṇḍala',
    kingIndex: 0, // Ashwini
    kingWhy: 'Ashwini is the instinctive healer-horseman — survival intelligence at the head of this herd.',
    theme: 'Instincts, survival intelligence, and creativity under pressure.',
    functions: [
      'Sharpen instincts and survival intelligence',
      'Teach how to live through any difficulty',
      'Fuel creativity',
    ],
    works: [
      'Keep the native able to survive the hardest situations',
    ],
    members: [
      m(0),            // Ashwini
      m(4),            // Mrigashira
      m(13),           // Chitra
      m(24, 'partial'), // Purva Bhadra (partial)
    ],
    planetNotes: [],
    complete: true,
  },
  {
    id: 'mrityu_karma',
    name: 'Mrityu Karma Mandal',
    sanskrit: 'Mṛtyu Karma Maṇḍala',
    kingIndex: 18, // Mula
    kingWhy: 'Mula is named as the king; full member list pending further teaching.',
    theme: 'Death–karma constellation (details forthcoming).',
    functions: [],
    works: [],
    members: [m(18)], // king only until group is taught
    planetNotes: [],
    complete: false,
    pendingNote: 'Full nakshatra group not yet taught — only the king (Mula) is recorded.',
  },
  {
    id: 'gyan',
    name: 'Cosmic Gyan Mandal',
    sanskrit: 'Brahmāṇḍīya Jñāna Maṇḍala',
    kingIndex: 17, // Jyeshtha
    kingWhy: 'Jyeshtha is named as the king; full member list pending further teaching.',
    theme: 'Cosmic knowledge constellation (details forthcoming).',
    functions: [],
    works: [],
    members: [m(17)], // king only until group is taught
    planetNotes: [],
    complete: false,
    pendingNote: 'Full nakshatra group not yet taught — only the king (Jyeshtha) is recorded.',
  },
]

export const COMPLETE_TARAMANDALS = TARAMANDALS.filter(t => t.complete)

/** Nakshatras not yet placed in any complete mandal (teaching gaps). */
export const UNCOVERED_NAKSHATRA_INDICES = (() => {
  const covered = new Set<number>()
  for (const t of COMPLETE_TARAMANDALS) {
    for (const mem of t.members) covered.add(mem.nakshatraIndex)
  }
  const out: number[] = []
  for (let i = 0; i < 27; i++) {
    if (!covered.has(i)) out.push(i)
  }
  return out
})()

export function getTaramandal(id: TaramandalId): TaramandalDefinition | undefined {
  return TARAMANDALS.find(t => t.id === id)
}

export function getMandalsForNakshatra(nakshatraIndex: number): NakshatraMandalMembership[] {
  const i = ((nakshatraIndex % 27) + 27) % 27
  const out: NakshatraMandalMembership[] = []
  for (const t of TARAMANDALS) {
    const mem = t.members.find(m => m.nakshatraIndex === i)
    if (!mem) continue
    out.push({
      mandalId: t.id,
      mandalName: t.name,
      role: mem.role,
      isKing: t.kingIndex === i,
    })
  }
  return out
}

function lagnaNakshatraIndex(chart: ChartOutput): number {
  const ascDeg = chart.lagnas.ascDegree
  return Math.floor((((ascDeg % 360) + 360) % 360) / (360 / 27))
}

function planetNoteFor(
  mandal: TaramandalDefinition,
  grahaId: GrahaId,
): PlanetMandalNote | null {
  return mandal.planetNotes.find(n => n.grahaId === grahaId) ?? null
}

function hitsForMandal(
  mandal: TaramandalDefinition,
  grahas: GrahaData[],
): TaramandalPlanetHit[] {
  const byNak = new Map(mandal.members.map(mem => [mem.nakshatraIndex, mem]))
  const hits: TaramandalPlanetHit[] = []
  for (const g of grahas) {
    if (!CORE_GRAHAS.includes(g.id)) continue
    const mem = byNak.get(g.nakshatraIndex)
    if (!mem) continue
    hits.push({
      grahaId: g.id,
      grahaName: GRAHA_NAMES[g.id] ?? g.id,
      nakshatraIndex: g.nakshatraIndex,
      nakshatraName: NAKSHATRA_NAMES[g.nakshatraIndex] ?? g.nakshatraName,
      pada: g.pada,
      role: mem.role,
      isKing: mandal.kingIndex === g.nakshatraIndex,
      notes: planetNoteFor(mandal, g.id),
    })
  }
  return hits.sort((a, b) => CORE_GRAHAS.indexOf(a.grahaId) - CORE_GRAHAS.indexOf(b.grahaId))
}

/**
 * Map a chart onto all Taramandals: birth-star memberships + planets in each mandal.
 */
export function analyzeTaramandalChart(chart: ChartOutput): TaramandalChartAnalysis {
  const moon = chart.grahas.find(g => g.id === 'Mo')
  const birthNakshatraIndex = moon?.nakshatraIndex ?? 0
  const birthNakshatraName = NAKSHATRA_NAMES[birthNakshatraIndex] ?? 'Unknown'
  const birthMemberships = getMandalsForNakshatra(birthNakshatraIndex)
  const lagNak = lagnaNakshatraIndex(chart)

  const mandals: TaramandalChartView[] = TARAMANDALS.map(mandal => {
    const memberIdx = new Set(mandal.members.map(m => m.nakshatraIndex))
    return {
      mandal,
      planetHits: hitsForMandal(mandal, chart.grahas),
      moonInMandal: memberIdx.has(birthNakshatraIndex),
      lagnaInMandal: memberIdx.has(lagNak),
    }
  })

  const activeComplete = mandals.filter(v => v.mandal.complete && v.planetHits.length > 0)
  const insightParts: string[] = []
  if (birthMemberships.length > 0) {
    const names = birthMemberships
      .map(m => `${m.mandalName}${m.isKing ? ' (king)' : m.role === 'partial' ? ' (partial)' : ''}`)
      .join(', ')
    insightParts.push(`Janma nakshatra ${birthNakshatraName} sits in ${names}.`)
  } else {
    insightParts.push(
      `Janma nakshatra ${birthNakshatraName} is not yet placed in a complete Taramandal — teaching coverage still open for Mula’s full Mrityu Karma / Gyan groups.`,
    )
  }
  if (activeComplete.length > 0) {
    insightParts.push(
      `${activeComplete.length} complete mandal${activeComplete.length === 1 ? '' : 's'} hold natal planet(s) — planetary signification shifts toward each mandal’s cosmic work.`,
    )
  }

  return {
    birthNakshatraIndex,
    birthNakshatraName,
    birthMemberships,
    mandals,
    uncoveredNakshatras: UNCOVERED_NAKSHATRA_INDICES.map(i => ({
      index: i,
      name: NAKSHATRA_NAMES[i],
    })),
    insight: insightParts.join(' '),
  }
}
