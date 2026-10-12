// ─────────────────────────────────────────────────────────────
//  src/lib/engine/sunAdityas.ts
//  Surya: 12 Adityas, karakatva, afflictions, spiritual flags
//  Teaching source: Vedic Surya class (Vedas / Puranas Adityas)
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, GrahaData, Rashi } from '@/types/astrology'
import { NAKSHATRA_NAMES, RASHI_NAMES } from '@/types/astrology'

export type AdityaId =
  | 'dhata'
  | 'aryama'
  | 'mitra'
  | 'varuna'
  | 'indra'
  | 'vivasvan'
  | 'usha'
  | 'tvashta'
  | 'bhaga'
  | 'anshuman'
  | 'parjanya'
  | 'vishnu'

export interface AdityaDef {
  id: AdityaId
  name: string
  sanskrit: string
  meaning: string
  significance: string[]
  /** Primary nakshatra indexes (0–26) */
  nakshatraIndexes: number[]
  /** Optional pada restriction within primary naks (1–4) */
  padas?: number[]
  /** Supporting rashis */
  rashis: Rashi[]
  /** Supporting whole-sign houses from Lagna */
  houses?: number[]
}

export interface SunFlag {
  id: string
  title: string
  active: boolean
  detail: string
}

export interface SunAdityasResult {
  sun: {
    rashi: Rashi
    rashiName: string
    nakshatraIndex: number
    nakshatraName: string
    pada: number
    house: number
    dignity: string
    isCombust: boolean
    degreeInSign: number
  }
  karakatva: string[]
  physical: { colors: string[]; metals: string[]; varna: string; transitNote: string }
  health: string[]
  dignityNotes: string[]
  primaryAditya: AdityaDef
  matchingAdityas: Array<{ aditya: AdityaDef; score: number; reasons: string[] }>
  allAdityas: AdityaDef[]
  spiritual: string[]
  afflictions: SunFlag[]
  egoNote: string
  pitruDosh: SunFlag
  kharmasNote: string
  houseNotes: string[]
  otherNames: string[]
  rays: Array<{ name: string; detail: string }>
  methodology: string[]
  dashaNote: string
}

export const SUN_ADITYAS: AdityaDef[] = [
  {
    id: 'dhata',
    name: 'Dhata',
    sanskrit: 'धाता',
    meaning: 'Creator / Vidhata — sustains and nurtures; arranges chaos into order.',
    significance: [
      'New creation and transformation of self and society',
      'Civil engineering / architecture flavour',
      'Order-seeking (crooked things must be set right)',
      'High leadership; follows rules strictly',
      'Self-made identity regardless of background',
    ],
    nakshatraIndexes: [20], // Uttara Ashadha
    padas: [1],
    rashis: [1, 9], // Aries, Sagittarius
    houses: [8, 10],
  },
  {
    id: 'aryama',
    name: 'Aryama',
    sanskrit: 'अर्यमा',
    meaning: 'Marriage, children, social bonds; pitra deity in marriage rituals.',
    significance: [
      'Gives marriage and children themes',
      'Strong social / friend circles (bouquet of friends)',
      'Surya arghya in Aryama’s name in vivaha',
      'Represents pitras (ancestors)',
    ],
    nakshatraIndexes: [11], // Uttara Phalguni (Swati minority view noted in UI)
    rashis: [5, 6],
    houses: [5],
  },
  {
    id: 'mitra',
    name: 'Mitra',
    sanskrit: 'मित्र',
    meaning: 'Friend and well-wisher; goodwill deity; paired with Varuna in Vedic worship.',
    significance: [
      'Draws toward spirituality',
      'Cannot easily wish or do harm',
      'Seeks justification — right vs wrong',
      'High strategic and negotiation power',
    ],
    nakshatraIndexes: [16], // Anuradha
    rashis: [8],
    houses: [],
  },
  {
    id: 'varuna',
    name: 'Varuna',
    sanskrit: 'वरुण',
    meaning: 'Omniscient guardian of morality and justice; water and secrets.',
    significance: [
      'Law, justice, seasons (ritus)',
      'Secrets held; repentance and deep knowledge',
      'In Cancer / 8th / 12th: introverted, hard to read, sensitive depth',
    ],
    nakshatraIndexes: [23], // Shatabhisha
    rashis: [11, 4],
    houses: [4, 12, 8],
  },
  {
    id: 'indra',
    name: 'Indra',
    sanskrit: 'इंद्र',
    meaning: 'King — powerful, energetic, accepts challenges; king of gods seat.',
    significance: [
      'Fighting spirit and debating ability',
      'Fearlessness',
      'Royalty flavour when in Leo',
    ],
    nakshatraIndexes: [17], // Jyeshtha
    padas: [1, 2],
    rashis: [8, 5],
    houses: [],
  },
  {
    id: 'vivasvan',
    name: 'Vivasvan',
    sanskrit: 'विवस्वान',
    meaning: 'Source of light and knowledge; illuminator; balances life–death cycle.',
    significance: [
      'Tremendous knowledge and formal education drive',
      'Desire to know the inner soul',
      'Scriptural / textual learning',
      'Myth: father of Manu and Yama; peaceful death themes',
    ],
    nakshatraIndexes: [7], // Pushya
    rashis: [4],
    houses: [],
  },
  {
    id: 'usha',
    name: 'Usha',
    sanskrit: 'उषा',
    meaning: 'Nurturer and guide; nourisher; linked to moksha and caretaking.',
    significance: [
      'Caregiver / sole breadwinner themes',
      'Long-distance travel',
      'Moksha flavour (12th / Kaal Purusha)',
      'Dairy / gau-paalan associations',
    ],
    nakshatraIndexes: [26], // Revati
    rashis: [12],
    houses: [12],
  },
  {
    id: 'tvashta',
    name: 'Tvashta',
    sanskrit: 'त्वष्टा',
    meaning: 'Creator-sculptor — gives shape; fine craft and manufacture.',
    significance: [
      'Intricate detail work: sculpture, design, precision parts',
      'Design-oriented professions',
    ],
    nakshatraIndexes: [13], // Chitra
    rashis: [6, 7],
    houses: [5, 2],
  },
  {
    id: 'bhaga',
    name: 'Bhaga',
    sanskrit: 'भग',
    meaning: 'Fortune, prosperity, joy — giver of wealth and attractive life.',
    significance: [
      'Love marriage / romance converting to marriage',
      'Attractive personality and luxury lifestyle',
      'Check for romantic relationship analysis',
    ],
    nakshatraIndexes: [10], // Purva Phalguni
    rashis: [5],
    houses: [5],
  },
  {
    id: 'anshuman',
    name: 'Anshuman',
    sanskrit: 'अंशुमान',
    meaning: 'Lord of rays — light and justice; spiritual teachers who speak truth.',
    significance: [
      'Spiritual awakening and teaching',
      'Spreads knowledge; fights superstition',
      'Does not endorse blind faith; points out mistakes',
    ],
    nakshatraIndexes: [24], // Purva Bhadra
    rashis: [11, 12, 9],
    houses: [3, 9],
  },
  {
    id: 'parjanya',
    name: 'Parjanya',
    sanskrit: 'पर्जन्य',
    meaning: 'Lord of rain / clouds — nourishes and rejuvenates life.',
    significance: [
      'Environment, horticulture, agriculture innovation',
      'Unconditional love for nature',
      'Maintains what is planted',
    ],
    nakshatraIndexes: [19], // Purva Ashadha
    rashis: [9, 8],
    houses: [4, 8],
  },
  {
    id: 'vishnu',
    name: 'Vishnu',
    sanskrit: 'विष्णु',
    meaning: 'Preserver — omnipresent, compassionate, giver of moksha (Surya Narayan).',
    significance: [
      'Protective, sympathetic nature',
      'Guides others toward righteousness',
    ],
    nakshatraIndexes: [21, 22], // Shravana, Dhanishtha
    rashis: [10, 11],
    houses: [],
  },
]

export const SUN_KARAKATVA = [
  'Atma Karaka — significator of the soul',
  'Self-identity and recognition',
  'Maan-samman — honour and respect',
  'Father, father figures, and boss',
  'Father’s health and happiness',
  'Government, authority, and leadership posts',
  'Name and recognition (any circle — not only media fame)',
  'Career growth and position held',
  'Government / administrative roles (govt or corporate)',
  'Medical field — especially specialization',
  'Jewellery / gold business (the trade, not gold metal alone)',
]

const SUN_HEALTH = [
  'Heart-related issues',
  'Eyes (expression differs for males and females)',
  'Bones / orthopedic issues',
  'Spinal cord (Meru Danda) — slip disc, spondylitis',
  'Headaches and migraine',
  'Fever / body temperature regulation',
]

function wholeSignHouse(planetRashi: Rashi, ascRashi: Rashi): number {
  return ((planetRashi - ascRashi + 12) % 12) + 1
}

function angularSep(a: number, b: number): number {
  let d = Math.abs((((a - b) % 360) + 360) % 360)
  if (d > 180) d = 360 - d
  return d
}

function sameSignOrConjunct(a: GrahaData, b: GrahaData, orb = 8): boolean {
  return a.rashi === b.rashi || angularSep(a.lonSidereal, b.lonSidereal) <= orb
}

function scoreAdityas(sun: GrahaData, house: number): Array<{ aditya: AdityaDef; score: number; reasons: string[] }> {
  return SUN_ADITYAS.map(aditya => {
    let score = 0
    const reasons: string[] = []

    if (aditya.nakshatraIndexes.includes(sun.nakshatraIndex)) {
      const padaOk = !aditya.padas || aditya.padas.includes(sun.pada)
      if (padaOk) {
        score += 5
        reasons.push(`Sun in ${NAKSHATRA_NAMES[sun.nakshatraIndex]}${aditya.padas ? ` pada ${sun.pada}` : ''}`)
      } else {
        score += 2
        reasons.push(`Sun in ${NAKSHATRA_NAMES[sun.nakshatraIndex]} (pada ${sun.pada}; primary padas ${aditya.padas?.join('/')})`)
      }
    }
    if (aditya.rashis.includes(sun.rashi)) {
      score += 2
      reasons.push(`Sun in ${RASHI_NAMES[sun.rashi]}`)
    }
    if (aditya.houses?.includes(house)) {
      score += 1
      reasons.push(`Sun in house ${house}`)
    }
    return { aditya, score, reasons }
  })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
}

/**
 * Natal Surya analysis: Aditya form, dignity, afflictions, spiritual notes.
 */
export function analyzeSunAdityas(chart: ChartOutput): SunAdityasResult | null {
  const sun = chart.grahas.find(g => g.id === 'Su')
  if (!sun) return null

  const asc = chart.lagnas.ascRashi as Rashi
  const house = wholeSignHouse(sun.rashi, asc)
  const matching = scoreAdityas(sun, house)
  const primary = matching[0]?.aditya ?? SUN_ADITYAS[0]

  const ra = chart.grahas.find(g => g.id === 'Ra')
  const ke = chart.grahas.find(g => g.id === 'Ke')
  const sa = chart.grahas.find(g => g.id === 'Sa')

  const withRahu = ra ? sameSignOrConjunct(sun, ra) : false
  const withKetu = ke ? sameSignOrConjunct(sun, ke) : false
  const withSaturn = sa ? sameSignOrConjunct(sun, sa) : false

  const debilitated = sun.rashi === 7 || sun.dignity === 'debilitated'
  const ownLeo = sun.rashi === 5
  const exalted = sun.rashi === 1 || sun.dignity === 'exalted'
  const enemyAq = sun.rashi === 11
  const friendly = sun.rashi === 9 || sun.rashi === 8

  const withMalefic = withRahu || withKetu || withSaturn
  const pitruActive = withMalefic || debilitated
  const pitruStrong = withMalefic && (debilitated || withSaturn)

  const afflictions: SunFlag[] = [
    {
      id: 'sun_rahu',
      title: 'Sun + Rahu',
      active: withRahu,
      detail:
        'Attachment to moh-maya; intuition with dictatorship risk (“only I am right”). Ego if well-placed. Sun stays partly in darkness — qualities don’t fully limelight; unfair blame. Out-of-box drive can lose true self while chasing recognition.',
    },
    {
      id: 'sun_ketu',
      title: 'Sun + Ketu',
      active: withKetu,
      detail:
        'Detachment and klesh (clash) wherever one works — clash pushes detachment. Often clash or emotional distance from father; runs from name/fame situations.',
    },
    {
      id: 'sun_saturn',
      title: 'Sun + Saturn',
      active: withSaturn,
      detail:
        'Hot identity vs cold service — opposing natures. Strong Pitru Dosh indicator when conjunct; a positive reading of this yoga is also taught (advanced).',
    },
    {
      id: 'sun_neech',
      title: 'Debilitated Sun (Libra)',
      active: debilitated,
      detail:
        'Lowers self-respect; person is easily snubbed. Weak Sun can show speech-related physical tells. Avoid auspicious starts in classical Kharmas windows.',
    },
    {
      id: 'sun_enemy',
      title: 'Sun in Aquarius (enemy)',
      active: enemyAq,
      detail: 'Enemy sign — authority and identity themes meet friction and unconventional pressure.',
    },
  ]

  let egoNote =
    'Positive ego = self-respect, confidence, trust in capacity. Negative ego ruins condition and blocks the path.'
  if (ownLeo) {
    egoNote += ' Sun in Leo (own): generally strong, but can tip into negative ego.'
  } else if (debilitated) {
    egoNote += ' Sun in Libra (neecha): self-respect lowers; easy to be disrespected.'
  } else if (exalted) {
    egoNote += ' Sun in Aries (uchcha): full light — positive self-force when channelled.'
  }

  const dignityNotes: string[] = [
    `Dignity: ${sun.dignity.replace('_', ' ')} · ${RASHI_NAMES[sun.rashi]}`,
  ]
  if (exalted) {
    dignityNotes.push(
      'Exalted in Aries: full light at the eastern rising sign; moolatrikona theme; life-source flowering — deeper than “King with army commander Mars”.',
    )
  }
  if (ownLeo) dignityNotes.push('Own sign Leo (Simha) — natural authority seat.')
  if (friendly) dignityNotes.push('Friendly fire/dharma signs (Sagittarius / Scorpio) support Surya.')
  if (debilitated) dignityNotes.push('Debilitated in Libra — identity and honour under strain.')
  if (enemyAq) dignityNotes.push('Enemy Aquarius — friction with conventional authority expression.')

  const houseNotes: string[] = []
  if (house === 10) {
    houseNotes.push(
      'Sun in 10th: comfortable post; career success; social responsibility — devote energy to society (financial, emotional, mental, or physical).',
    )
  }
  if (house === 9) {
    houseNotes.push(
      'Sun in 9th: father, bhagya, dharma — keep high moral duty and seek inner truth; else guide toward spirituality.',
    )
  }
  if (house === 1) {
    houseNotes.push('Sun in Lagna: identity radiates through the body-self; comfortable Surya seat.')
  }

  const kharmasNote =
    sun.rashi === 9 || sun.rashi === 12
      ? 'Sun in Sagittarius or Pisces — classical Kharmas lore (tired horses / khar on the chariot): auspicious starts like griha pravesh traditionally avoided while Sun is weak in these months.'
      : 'Kharmas (weak Sun months) classically when Sun transits Sagittarius and Pisces — check gochar, not only natal.'

  return {
    sun: {
      rashi: sun.rashi,
      rashiName: RASHI_NAMES[sun.rashi],
      nakshatraIndex: sun.nakshatraIndex,
      nakshatraName: NAKSHATRA_NAMES[sun.nakshatraIndex],
      pada: sun.pada,
      house,
      dignity: sun.dignity,
      isCombust: sun.isCombust,
      degreeInSign: sun.degree,
    },
    karakatva: SUN_KARAKATVA,
    physical: {
      colors: ['Red', 'Pink'],
      metals: ['Gold', 'Copper'],
      varna: 'Kshatriya',
      transitNote: 'Gochar: Sun changes sign about every 30 days.',
    },
    health: SUN_HEALTH,
    dignityNotes,
    primaryAditya: primary,
    matchingAdityas: matching,
    allAdityas: SUN_ADITYAS,
    spiritual: [
      'Pranashakti / Pingala Nadi — male, future-sensing, Shiva-stable energy from the right nostril.',
      'Sun’s rays energize the seven chakras; weak Sun makes rising past Muladhara hard.',
      'Meru Danda (spine): will power, self-esteem, positive ego — spinal issues flag Surya.',
      'Strong Sun = Antaratma’s voice (instant yes/no) becomes your inner Guru.',
      'Manipura (solar plexus) karaka; Agni / Jatharagni in Ayurveda.',
      'Moksha via self-enlightenment (Ishopanishad path of truth) — strong Sun in high yogis.',
      'Ida = Moon, Pingala = Sun, Sushumna supports both.',
    ],
    afflictions,
    egoNote,
    pitruDosh: {
      id: 'pitru',
      title: 'Pitru Dosh (via Sun)',
      active: pitruActive,
      detail: pitruStrong
        ? 'Afflicted / debilitated Sun with Rahu, Ketu, or Saturn — ancestors’ incomplete karmas; struggle in career, health, identity. Conjunction is strongest; refine by nakshatra and house.'
        : pitruActive
          ? 'Sun meets malefic pressure — check Pitru Dosh intensity by house and nakshatra.'
          : 'No strong natal Pitru Dosh pattern from Sun+Rahu/Ketu/Saturn / neecha alone.',
    },
    kharmasNote,
    houseNotes,
    otherNames: ['Savita (Gayatri — dawn)', 'Bhaskar', 'Ravi', 'Dinkar', 'Bhanu', 'Arka', 'Pusha'],
    rays: [
      { name: 'Sushumna', detail: 'Illuminates the Moon; abundant Amrita — why Moon is Som.' },
      { name: 'Harikesh', detail: 'Earth heat/growth; poor absorption → Vitamin D themes; water element.' },
      { name: 'Vishwakarma', detail: 'Energizes nakshatras and other planets (except Moon) to rotate in orbit.' },
    ],
    methodology: [
      'Do not retrofit events into the chart after the fact.',
      'Verify birth data before deep Surya analysis.',
      'Layer: planet → house → sign → nakshatra → Aditya — then predict.',
      'Sun Mahadasha is 6 years — short because tej is intense to sustain.',
    ],
    dashaNote: 'Vimshottari: Sun Mahadasha = 6 years (shortest intensity window among luminaries).',
  }
}
