// ─────────────────────────────────────────────────────────────
//  src/lib/engine/chaturthamsaAnalysis.ts
//  Chaturthamsha (D4) — home, happiness, personal space, relocation
//  Class methodology: lagna hierarchy, key triad, houses, dasha moves
// ─────────────────────────────────────────────────────────────

import type {
  ChartOutput,
  Dignity,
  GrahaData,
  GrahaId,
  Rashi,
} from '@/types/astrology'
import {
  GRAHA_NAMES,
  RASHI_NAMES,
  RASHI_SANSKRIT,
} from '@/types/astrology'
import { hasParasharaAspect } from '@/lib/engine/aspects'
import { getDashaPathAt } from '@/lib/engine/dasha/current'

export type D4Tone = 'supportive' | 'challenging' | 'mixed' | 'neutral'

export type D4SignalStrength = 'occupation' | 'lord' | 'aspect' | 'sign'

export interface ChaturthamsaInsight {
  kind: 'strength' | 'caution' | 'highlight' | 'info'
  title: string
  text: string
}

export interface ChaturthamsaPlanetRow {
  id: GrahaId
  name: string
  rashi: Rashi
  rashiName: string
  house: number
  dignity: Dignity
  isRetro: boolean
  theme: string
  interpretation: string
}

export interface ChaturthamsaLagnaOccupant {
  id: GrahaId
  name: string
  isRetro: boolean
  reading: string
  signExtras: string[]
}

export interface ChaturthamsaAspectOnLagna {
  id: GrahaId
  name: string
  fromHouse: number
  fromRashiName: string
  note: string
  /** Aspects work at roughly 30–40% of occupation strength. */
  relativeStrength: 'partial'
}

export interface ChaturthamsaLagnaHeart {
  lagna: Rashi
  lagnaName: string
  lagnaSanskrit: string
  lagnaEmpty: boolean
  occupants: ChaturthamsaLagnaOccupant[]
  lagnaLord: {
    id: GrahaId
    name: string
    house: number
    rashi: Rashi
    rashiName: string
    dignity: Dignity
    isRetro: boolean
    conjunctIds: GrahaId[]
    conjunctNames: string[]
    reading: string
  }
  aspectsOnLagna: ChaturthamsaAspectOnLagna[]
  signFlavor: string
  /** Strongest available signal for the emotional “heart”. */
  primarySignal: {
    strength: D4SignalStrength
    label: string
    detail: string
  }
  nodesOnLagna: boolean
  heartDisturbed: boolean
}

export interface ChaturthamsaKeyTriadMember {
  role: 'moon' | 'fourthLord' | 'jupiter'
  roleLabel: string
  id: GrahaId
  name: string
  house: number
  rashi: Rashi
  rashiName: string
  dignity: Dignity
  isRetro: boolean
  tone: D4Tone
  reading: string
}

export interface ChaturthamsaHouseRow {
  house: number
  rashi: Rashi
  rashiName: string
  lordId: GrahaId
  lordName: string
  occupants: { id: GrahaId; name: string; isRetro: boolean }[]
  theme: string
  reading: string
  tone: D4Tone
}

export interface ChaturthamsaDashaLordOverlay {
  level: number
  levelLabel: string
  lord: GrahaId
  lordName: string
  start: string
  end: string
  d4House: number | null
  d4RashiName: string | null
  tone: D4Tone
  note: string
}

export interface ChaturthamsaRelocation {
  eighthOccupants: { id: GrahaId; name: string }[]
  eighthLordPeriodActive: boolean
  sixthEighthDashaLink: boolean
  dashaLords: ChaturthamsaDashaLordOverlay[]
  pathLabel: string
  headline: string
  detail: string
  tone: D4Tone
  highlightHouses: number[]
}

export interface ChaturthamsaAffinityNote {
  pair: string
  title: string
  text: string
  tone: D4Tone
}

export interface ChaturthamsaConflictFlag {
  id: string
  title: string
  text: string
  tone: D4Tone
}

export interface ChaturthamsaAnalysis {
  d4Lagna: Rashi
  d4LagnaName: string
  d4LagnaSanskrit: string
  summary: string
  purpose: string
  heart: ChaturthamsaLagnaHeart
  keyTriad: ChaturthamsaKeyTriadMember[]
  planets: ChaturthamsaPlanetRow[]
  houses: ChaturthamsaHouseRow[]
  focusedHouses: ChaturthamsaHouseRow[]
  relocation: ChaturthamsaRelocation | null
  affinityGuide: ChaturthamsaAffinityNote[]
  conflictFlags: ChaturthamsaConflictFlag[]
  insights: ChaturthamsaInsight[]
  retrogradeNotes: string[]
}

const CLASSICAL_ORDER: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

const SIGN_LORDS: Record<Rashi, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const STRONG_DIGNITY: Dignity[] = ['exalted', 'moolatrikona', 'own']
const WEAK_DIGNITY: Dignity[] = ['debilitated', 'great_enemy', 'enemy']
const MALEFICS: GrahaId[] = ['Ma', 'Sa', 'Ra', 'Ke']

const DASHA_LEVEL_LABELS = ['', 'Maha', 'Antar', 'Pratyantar', 'Sukshma', 'Prana', 'Deha'] as const

const FOCUS_HOUSES = [3, 4, 6, 8, 9, 11] as const

const D4_PURPOSE =
  'Chaturthamsha expands the 4th house: what brings contentment, how personal space feels, property tone, and whether home life can be shared peacefully.'

const LAGNA_SIGN_FLAVOR: Record<Rashi, string> = {
  1: 'Mars-ruled lagna — decisive personal space; prefers built or claimed territory.',
  2: 'Venus-ruled lagna — comfort, beauty, and value in the home.',
  3: 'Mercury-ruled lagna — curious, communicative domestic style; likes variety nearby.',
  4: 'Moon-ruled lagna — emotionally sensitive home; needs nurturing atmosphere.',
  5: 'Sun-ruled lagna — dignity, boundaries, and assembly space around the house.',
  6: 'Mercury-ruled lagna — detail, service, and discernment in living arrangements.',
  7: 'Venus-ruled lagna — partnership and aesthetics shape what feels like home.',
  8: 'Mars-ruled lagna — intense, private, transformative personal space.',
  9: 'Jupiter-ruled lagna — faith, counsel, and expansive shelter themes.',
  10: 'Saturn-ruled lagna — structured, enduring, sometimes guarded residence.',
  11: 'Saturn-ruled lagna — networked, unconventional, or future-facing home setup.',
  12: 'Jupiter-ruled lagna — rest, retreat, and soft boundaries around the heart.',
}

const HOUSE_THEMES: Record<number, string> = {
  1: 'Personal space, heart, and what you obsess over at home',
  2: 'Family resources, speech at home, and domestic values',
  3: 'Communication, courage, and verbal expression in the house',
  4: 'Internal happiness — what quietly contentment looks like',
  5: 'Creativity, romance display, and joy projected from home',
  6: 'Conflict sources, friction, and betrayal themes in marriage/home',
  7: 'Partner as roommate — shared living chemistry',
  8: 'Upheaval, secrets, inheritance, and residence change pressure',
  9: 'Father’s habits as seen through the home lens; higher beliefs',
  10: 'Public service / karma as a path to happiness',
  11: 'Desire fulfillment and gains that touch the home',
  12: 'Sleep, absence from home, and private losses of comfort',
}

type LagnaBaseReading = { general: string; traits: string[] }

const LAGNA_PLANET_READINGS: Partial<Record<GrahaId, LagnaBaseReading>> = {
  Ke: {
    general:
      'Ketu on the D4 lagna makes personal space binary — either fully open-hearted or closed. Diplomacy is hard; bonding is total once trust exists. Contentment grows when Jupiter’s counsel or spiritual knowledge softens attachment and aversion.',
    traits: [
      'Fights over small things, yet bonds are hard to break',
      'Breakups feel intense; memories linger',
      'Struggles to share room/personal space; can feel trapped living with others',
      'Chooses house and vehicles by vibe more than specs',
    ],
  },
  Ra: {
    general:
      'Rahu on the D4 lagna drives endless wanting — competitive accumulation, big-ticket electronics and oversized household items, and hasty property decisions. Comfort with outsiders can exceed ease with family.',
    traits: [
      'Never fully satisfied with what is already in the house',
      'Inclined toward “ultra” gadgets and larger-than-needed appliances',
      'Attracted to mysterious or unconventional helpers',
      'May trust outside society more than familiar circles',
    ],
  },
  Sa: {
    general:
      'Saturn on the D4 lagna favors old, lasting, antique, or stone-style homes and hoards unique durable items from insecurity. Attraction to hard-to-read people is common.',
    traits: [
      'House fills with aged or long-lasting objects',
      'Avoids waste; keeps what feels secure',
      'Roommate/partner dynamics can turn duty-heavy if Saturn also ties the lagna lord',
    ],
  },
  Me: {
    general:
      'Mercury on the D4 lagna links happiness and sorrow to the maternal side, favors apartments and prominent balconies/living areas, and connects the native to many people (media, marketing, HR). Food presentation can be fussy.',
    traits: [
      'Maternal family themes color property and documents',
      'Wants visible balcony / living space and a view from above',
      'Picky about how food looks and is served',
      'Strong mass/public connection through the 4th significations',
    ],
  },
  Ju: {
    general:
      'Jupiter on the D4 lagna seeks solutions through temples, counselors, or wisdom. Prefers ground-floor living and a deity-forward entrance; home shrine often sits on the main level.',
    traits: [
      'Turns to faith or counsel when home life is stressed',
      'Ground floor / easy access preferred over stairs',
      'Wants the house to open onto a sacred or counsel-oriented presence',
    ],
  },
  Ma: {
    general:
      'Mars on the D4 lagna wants self-built territory — hills, plots, villas — and runs the house like a commander. Layout changes, renovations, DIY repairs, and watercraft/boat themes are classic.',
    traits: [
      '“Not my house until I build or reshape it”',
      'Frequent rearranging of beds, windows, and doors',
      'Keeps tools ready; opens machines to fix them',
      'Enjoys boats, cruises, or water-linked recreation',
    ],
  },
  Ve: {
    general:
      'Venus on the D4 lagna needs beauty, lawns, and market-adjacent living — branded stores and malls nearby. Comfort and aesthetic polish define “home.”',
    traits: [
      'House must feel beautiful and welcoming',
      'Prefers access to shopping and lifestyle hubs',
      'With Rahu or Aquarius flavor, entertainment/bar zones may stand out',
    ],
  },
  Su: {
    general:
      'Sun on the D4 lagna creates access and boundary themes — official-quarter feel, trees, controlled entry. The house often hosts gatherings, halls, or program space.',
    traits: [
      'Guests may be met downstairs rather than invited into the inner home',
      'Security or blocked boundaries depending on sign',
      'Community hall / assembly energy in or under the house',
    ],
  },
  Mo: {
    general:
      'Moon on the D4 lagna heightens emotional sensitivity at home. Well-placed Moon softens the atmosphere; malefic pressure can amplify domestic conflict.',
    traits: [
      'Very specific about comfort and emotional tone',
      'Needs a pleasant, nurturing domestic field',
      'Irritability rises if Mars or Saturn press the Moon',
    ],
  },
}

const RAHU_SIGN_EXTRAS: Partial<Record<Rashi, string>> = {
  1: 'In Aries: heavy-duty or adventure vehicles and rugged survival gear.',
  3: 'In Gemini: multiples of Mercury items — windows, curtains, mirrors, earphones, stationery.',
  7: 'In Libra: obsessive focus on spouse/partner comfort and presence.',
  9: 'In Sagittarius: during trouble, visits many temples and deities.',
}

function wholeSignHouseSign(ascRashi: Rashi, house: number): Rashi {
  return (((ascRashi - 1 + house - 1) % 12) + 1) as Rashi
}

function houseOf(planetRashi: Rashi, ascRashi: Rashi): number {
  return ((planetRashi - ascRashi + 12) % 12) + 1
}

/** Sign-count from A to B: 1 = same … 12 = 12th from A. */
export function signCount(fromRashi: number, toRashi: number): number {
  return ((toRashi - fromRashi + 12) % 12) + 1
}

function dignityLabel(d: Dignity): string {
  return d.replace(/_/g, ' ')
}

function formatDashaDate(value: Date | string | number): string {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toISOString().slice(0, 10)
}

function toneFromDignity(d: Dignity, house: number): D4Tone {
  if (STRONG_DIGNITY.includes(d) && ![6, 8, 12].includes(house)) return 'supportive'
  if (WEAK_DIGNITY.includes(d) || [6, 8, 12].includes(house)) return 'challenging'
  if ([1, 4, 5, 7, 9, 10].includes(house)) return 'mixed'
  return 'neutral'
}

function planetById(grahas: GrahaData[], id: GrahaId): GrahaData | undefined {
  return grahas.find((g) => g.id === id)
}

function conjunctIds(grahas: GrahaData[], target: GrahaData): GrahaId[] {
  return grahas.filter((g) => g.id !== target.id && g.rashi === target.rashi).map((g) => g.id)
}

function buildSignExtras(id: GrahaId, lagna: Rashi, occupants: GrahaId[]): string[] {
  const extras: string[] = []
  if (id === 'Ke' && lagna === 8) {
    extras.push('In Scorpio lagna: persistent, repetitive requests (“ghuna”) until needs are met; desire stress runs high.')
  }
  if (id === 'Ra') {
    const ra = RAHU_SIGN_EXTRAS[lagna]
    if (ra) extras.push(ra)
  }
  if (id === 'Ju' && lagna === 12) {
    extras.push('In Pisces: natural healing empathy; often believes rest/sleep will resolve problems.')
  }
  if (id === 'Ve' && (lagna === 11 || occupants.includes('Ra'))) {
    extras.push('Venus with Rahu or Aquarius lagna: entertainment / bar-area prominence and intoxicated social themes need mindful boundaries.')
  }
  if (id === 'Su' && lagna === 5) {
    extras.push('Leo lagna: blocked boundaries — visiting the inner house can feel difficult.')
  }
  if (id === 'Su' && lagna === 10) {
    extras.push('Capricorn lagna: heavy security or gatekeeping before guests enter.')
  }
  if (id === 'Me' && lagna === 11) {
    extras.push('Mercury in Aquarius lagna: collecting habits (plants, information); may track family news like a private investigator.')
  }
  return extras
}

function lordConjunctionReading(lordId: GrahaId, conjuncts: GrahaId[]): string {
  const parts: string[] = []
  if (conjuncts.includes('Sa')) {
    parts.push('With Saturn: insecurity, delays, and overthinking around commitment or home decisions.')
  }
  if (conjuncts.includes('Mo') && conjuncts.includes('Sa')) {
    parts.push('Saturn–Moon (Vish-style) with the lagna lord: emotional dryness despite material comfort; marriage decisions stall through analysis.')
  }
  if (conjuncts.includes('Ke')) {
    parts.push('With Ketu: communication gaps, avoidance, or abrupt withdrawal under domestic stress.')
  }
  if (conjuncts.includes('Ra')) {
    parts.push('With Rahu: obsessive pursuit of whatever house the lagna lord occupies.')
  }
  if (conjuncts.includes('Me') && conjuncts.includes('Sa')) {
    parts.push('Saturn–Mercury: over-analysis of feelings; loyalty fears can surface.')
  }
  if (!parts.length) {
    const names = conjuncts.map((id) => GRAHA_NAMES[id]).join(', ')
    if (names) parts.push(`Conjoined ${names} — blend those graha natures into the lagna lord’s happiness story.`)
    else parts.push(`${GRAHA_NAMES[lordId]} alone steers the emotional address of D4.`)
  }
  return parts.join(' ')
}

function aspectNote(id: GrahaId): string {
  if (id === 'Me') return 'Mercury’s aspect eases communication around home issues (partial influence).'
  if (id === 'Ju') return 'Jupiter’s aspect offers counsel and contentment support (partial).'
  if (id === 'Sa') return 'Saturn’s aspect can dry emotions or add duty pressure on personal space (partial).'
  if (id === 'Ma') return 'Mars’s aspect heats the domestic field — irritability or renovation drive (partial).'
  if (id === 'Mo') return 'Moon’s aspect sensitizes the heart of the chart (partial).'
  if (id === 'Ve') return 'Venus’s aspect softens aesthetics and partnership comfort (partial).'
  if (id === 'Su') return 'Sun’s aspect adds authority and boundary themes (partial).'
  return `${GRAHA_NAMES[id]} aspects the D4 lagna at reduced strength versus occupation.`
}

function buildPrimarySignal(heart: Omit<ChaturthamsaLagnaHeart, 'primarySignal'>): ChaturthamsaLagnaHeart['primarySignal'] {
  if (heart.occupants.length) {
    const names = heart.occupants.map((o) => o.name).join(', ')
    return {
      strength: 'occupation',
      label: `Lagna occupied by ${names}`,
      detail: heart.occupants.map((o) => o.reading).join(' '),
    }
  }
  const lord = heart.lagnaLord
  return {
    strength: 'lord',
    label: `Empty lagna — follow ${lord.name} (lord) in H${lord.house}`,
    detail: `${lord.name} in ${lord.rashiName} (H${lord.house}) is the emotional address. ${lord.reading}`,
  }
}

function buildHouseReading(
  house: number,
  occupants: GrahaData[],
  rashi: Rashi,
): { reading: string; tone: D4Tone } {
  const theme = HOUSE_THEMES[house] ?? `D4 house ${house}`
  const names = occupants.map((g) => GRAHA_NAMES[g.id]).join(', ')
  const bits: string[] = [`${theme}.`]

  if (!occupants.length) {
    bits.push(`No planet here — read the lord of ${RASHI_NAMES[rashi]} for quieter results.`)
    return { reading: bits.join(' '), tone: 'neutral' }
  }

  bits.push(`Occupied by ${names}.`)

  if (house === 4) {
    if (occupants.some((g) => g.id === 'Mo' && g.rashi === 9)) {
      bits.push('Moon in Sagittarius here: internal happiness through devotion, bhajans, or uplifting song.')
    } else if (occupants.some((g) => g.id === 'Mo')) {
      bits.push('Moon here: emotional nourishment is the private happiness key.')
    }
    if (occupants.some((g) => g.id === 'Ju') && occupants.some((g) => g.id === 'Ra')) {
      bits.push('Jupiter–Rahu: public image of virtue may differ from private house reality — read carefully.')
    }
  }

  if (house === 6) {
    if (occupants.some((g) => g.id === 'Ve') && occupants.some((g) => g.id === 'Ra')) {
      bits.push('Venus–Rahu: heightened risk of partner friction, separation themes, or betrayal anxiety.')
    } else {
      bits.push('Watch this house for sources of marital or domestic conflict.')
    }
  }

  if (house === 8) {
    bits.push('Family secrets, inheritance surprises, or residence upheaval can surface in related dashas.')
    if (occupants.some((g) => g.id === 'Me')) {
      bits.push('Mercury here: unexpected property or document developments possible in difficult periods.')
    }
    if (occupants.some((g) => g.id === 'Ma') && occupants.some((g) => g.id === 'Ke')) {
      bits.push('Mars–Ketu: sharp verbal conflict risk; physical violence is not automatic — context matters.')
    }
  }

  if (house === 9) {
    bits.push('Father’s habits and vices can mirror through this house.')
    if (occupants.some((g) => g.id === 'Sa') && occupants.some((g) => g.id === 'Ra')) {
      bits.push('Saturn–Rahu: caution around father’s intoxicant or boundary issues.')
    }
  }

  if (house === 11) {
    if (occupants.some((g) => g.id === 'Su' && g.rashi === 11)) {
      bits.push('Sun in Aquarius: house may have two practical entrances (front and back access).')
    } else {
      bits.push('Desire fulfillment linked to home and social gains.')
    }
  }

  if (house === 3) {
    bits.push('Strong placement here supports poetic or forceful verbal expression at home.')
  }

  const maleficHit = occupants.filter((g) => MALEFICS.includes(g.id)).length
  const tone: D4Tone =
    house === 6 || house === 8
      ? maleficHit >= 2 ? 'challenging' : 'mixed'
      : house === 4 && maleficHit === 0
        ? 'supportive'
        : maleficHit >= 2
          ? 'challenging'
          : 'mixed'

  return { reading: bits.join(' '), tone }
}

function buildConflictFlags(
  asc: Rashi,
  grahas: GrahaData[],
  heart: ChaturthamsaLagnaHeart,
): ChaturthamsaConflictFlag[] {
  const flags: ChaturthamsaConflictFlag[] = []
  const lagnaOcc = grahas.filter((g) => houseOf(g.rashi, asc) === 1)
  const fourth = grahas.filter((g) => houseOf(g.rashi, asc) === 4)
  const seventh = grahas.filter((g) => houseOf(g.rashi, asc) === 7)

  if (heart.nodesOnLagna) {
    flags.push({
      id: 'nodes-lagna',
      title: 'Nodes on the D4 heart',
      text: 'Rahu or Ketu on any divisional lagna disturbs that chart’s heart. Expect struggle themes around personal space, contentment, or shared living until wisdom softens the node.',
      tone: 'challenging',
    })
  }

  const moon = planetById(grahas, 'Mo')
  if (moon) {
    const moonHouse = houseOf(moon.rashi, asc)
    const pressed = grahas.some(
      (g) =>
        (g.id === 'Ma' || g.id === 'Sa') &&
        (g.rashi === moon.rashi || hasParasharaAspect(g.rashi, g.id, moon.rashi)),
    )
    if (pressed) {
      flags.push({
        id: 'moon-malefic',
        title: 'Moon under malefic pressure',
        text: 'Mars or Saturn conjunct/aspecting the D4 Moon can amplify domestic irritability, raised voices, or emotional volatility at home.',
        tone: 'challenging',
      })
    }
    if (pressed && fourth.some((g) => MALEFICS.includes(g.id))) {
      flags.push({
        id: 'domestic-stress',
        title: 'Domestic conflict caution',
        text: 'Malefics on the Moon with malefics also in the D4 4th raise the risk of severe household conflict. Read with D1 and lived context — this is a caution flag, not a verdict.',
        tone: 'challenging',
      })
    }
    if (moonHouse === 1 && grahas.some((g) => g.id === 'Ma' && g.rashi === moon.rashi)) {
      flags.push({
        id: 'moon-mars-lagna',
        title: 'Moon–Mars heat on lagna',
        text: 'Moon–Mars together on the D4 lagna often shows day-long crankiness in the shared space.',
        tone: 'challenging',
      })
    }
  }

  const hasVeMa = lagnaOcc.some((g) => g.id === 'Ve') && lagnaOcc.some((g) => g.id === 'Ma')
  const saOn7 = seventh.some((g) => g.id === 'Sa')
  if (hasVeMa && saOn7) {
    flags.push({
      id: 've-ma-sa-axis',
      title: 'Passion + duty stress on the axis',
      text: 'Venus–Mars on lagna with Saturn in the 7th can mark intense partner dynamics and mutual boundary conflict. Prioritize safety and counseling language over fatalism.',
      tone: 'challenging',
    })
  }

  const maSaAxis =
    (lagnaOcc.some((g) => g.id === 'Ma') && seventh.some((g) => g.id === 'Sa')) ||
    (lagnaOcc.some((g) => g.id === 'Sa') && seventh.some((g) => g.id === 'Ma'))
  if (maSaAxis) {
    flags.push({
      id: 'mars-saturn-axis',
      title: 'Mars–Saturn 1/7 tension',
      text: 'Mars–Saturn across the lagna–7th axis correlates with hardness, control fights, and domestic intensity. Soften with clear agreements and space.',
      tone: 'challenging',
    })
  }

  return flags
}

function buildAffinityGuide(occupants: GrahaId[]): ChaturthamsaAffinityNote[] {
  const notes: ChaturthamsaAffinityNote[] = [
    {
      pair: 'Ma–Ve',
      title: 'Mars lagna ↔ Venus lagna',
      text: 'When one partner’s D4 lagna holds Mars and the other’s Venus, chemistry and passion in shared space run high — natural Mars–Venus pull.',
      tone: 'supportive',
    },
    {
      pair: 'Ju–Sa',
      title: 'Jupiter lagna ↔ Saturn lagna',
      text: 'Jupiter–Saturn lagna pairing often shows large, well-staffed, branded homes — yet Saturn’s insecurity can remain under the comfort.',
      tone: 'mixed',
    },
    {
      pair: 'Mo–Su',
      title: 'Moon in Leo (with Sun)',
      text: 'Moon with Sun / Leo themes on D4 lagna supports a spacious, comfort-rich house when otherwise unafflicted.',
      tone: 'supportive',
    },
  ]

  if (occupants.includes('Ma')) {
    notes.push({
      pair: 'native-Ma',
      title: 'Your D4 Mars lagna',
      text: 'You thrive with partners who respect renovation drive and personal command of space — Venus-leaning partners often match the heat.',
      tone: 'mixed',
    })
  }
  if (occupants.includes('Ve')) {
    notes.push({
      pair: 'native-Ve',
      title: 'Your D4 Venus lagna',
      text: 'Aesthetic harmony and market-adjacent living matter; Mars lagna partners can feel exciting if respect stays mutual.',
      tone: 'mixed',
    })
  }
  if (occupants.includes('Ju')) {
    notes.push({
      pair: 'native-Ju',
      title: 'Your D4 Jupiter lagna',
      text: 'Counsel, faith, and ground-floor calm matter; Saturn lagna partners may co-build status homes with residual worry.',
      tone: 'mixed',
    })
  }

  return notes
}

function buildRelocation(
  chart: ChartOutput,
  grahas: GrahaData[],
  asc: Rashi,
): ChaturthamsaRelocation | null {
  const eighth = grahas.filter((g) => houseOf(g.rashi, asc) === 8)
  const eighthLordId = SIGN_LORDS[wholeSignHouseSign(asc, 8)]
  const byId = new Map(grahas.map((g) => [g.id, g]))

  const nodes = chart.dashas?.vimshottari
  if (!nodes?.length) {
    return {
      eighthOccupants: eighth.map((g) => ({ id: g.id, name: GRAHA_NAMES[g.id] })),
      eighthLordPeriodActive: false,
      sixthEighthDashaLink: false,
      dashaLords: [],
      pathLabel: '',
      headline: eighth.length
        ? `D4 8th holds ${eighth.map((g) => GRAHA_NAMES[g.id]).join(', ')} — residence change pressure when their dashas run`
        : 'No planet in D4 8th — use 8th lord dashas and 6/8 links for move timing',
      detail: 'Vimshottari path unavailable on this chart — compute dashas to time relocation.',
      tone: eighth.length ? 'mixed' : 'neutral',
      highlightHouses: eighth.length ? [8] : [],
    }
  }

  const path = getDashaPathAt(nodes)
  if (!path.length) return null

  const dashaLords: ChaturthamsaDashaLordOverlay[] = path.slice(0, 4).map((seg) => {
    const lord = seg.lord as GrahaId
    const g = byId.get(lord)
    const house = g ? houseOf(g.rashi, asc) : null
    const tone: D4Tone =
      house === 8 || house === 6 ? 'challenging'
        : house === 4 || house === 1 ? 'mixed'
          : 'neutral'
    let note = g
      ? `${GRAHA_NAMES[lord]} in D4 H${house} (${RASHI_NAMES[g.rashi]})`
      : `${GRAHA_NAMES[lord]} — D4 placement missing`
    if (house === 8) note += ' — 8th house period: residence change is more likely.'
    if (lord === eighthLordId) note += ' — dasha of the D4 8th lord: watch relocation.'
    return {
      level: seg.level,
      levelLabel: DASHA_LEVEL_LABELS[seg.level] ?? `L${seg.level}`,
      lord,
      lordName: GRAHA_NAMES[lord] ?? String(lord),
      start: formatDashaDate(seg.start),
      end: formatDashaDate(seg.end),
      d4House: house,
      d4RashiName: g ? RASHI_NAMES[g.rashi] : null,
      tone,
      note,
    }
  })

  const maha = dashaLords[0]
  const antar = dashaLords[1]
  let sixthEighthDashaLink = false
  if (maha && antar) {
    const a = byId.get(maha.lord)
    const b = byId.get(antar.lord)
    if (a && b) {
      const fwd = signCount(a.rashi, b.rashi)
      const rev = signCount(b.rashi, a.rashi)
      sixthEighthDashaLink = fwd === 6 || fwd === 8 || rev === 6 || rev === 8
    }
  }

  const eighthLordPeriodActive = dashaLords.some(
    (l) => l.lord === eighthLordId || l.d4House === 8 || eighth.some((g) => g.id === l.lord),
  )

  const pathLabel = dashaLords.map((l) => l.lordName).join(' / ')
  const highlights = Array.from(
    new Set(
      dashaLords.map((l) => l.d4House).filter((h): h is number => h != null && (h === 6 || h === 8)),
    ),
  )

  let tone: D4Tone = 'neutral'
  let headline = `Current path ${pathLabel}`
  const details: string[] = []

  if (eighthLordPeriodActive) {
    tone = 'challenging'
    headline = 'Relocation window active'
    details.push('A running dasha lord sits in the D4 8th, is the 8th lord, or rules a planet there — place change is more likely.')
  }
  if (sixthEighthDashaLink) {
    tone = 'challenging'
    headline = eighthLordPeriodActive ? 'Strong relocation window' : '6/8 dasha link — move possible'
    details.push(
      `Mahadasha lord and Antardasha lord stand in a 6/8 relationship in D4 — class rule for residence change.`,
    )
  }
  if (!details.length) {
    details.push(
      eighth.length
        ? `D4 8th occupants (${eighth.map((g) => GRAHA_NAMES[g.id]).join(', ')}) time moves when their periods run.`
        : 'No strong 8th / 6–8 relocation flag in the current path — still watch gochar and D1 4th/8th.',
    )
  }

  return {
    eighthOccupants: eighth.map((g) => ({ id: g.id, name: GRAHA_NAMES[g.id] })),
    eighthLordPeriodActive,
    sixthEighthDashaLink,
    dashaLords,
    pathLabel,
    headline,
    detail: details.join(' '),
    tone,
    highlightHouses: highlights.length ? highlights : eighth.length ? [8] : [],
  }
}

function buildPlanetRow(g: GrahaData, asc: Rashi): ChaturthamsaPlanetRow {
  const house = houseOf(g.rashi, asc)
  const base = LAGNA_PLANET_READINGS[g.id]
  const theme = house === 1
    ? (base?.general.split('.')[0] ?? `${GRAHA_NAMES[g.id]} on the D4 heart`)
    : (HOUSE_THEMES[house] ?? `D4 house ${house}`)
  const parts = [
    `${GRAHA_NAMES[g.id]} in ${RASHI_NAMES[g.rashi]} (D4 H${house}, ${dignityLabel(g.dignity)}).`,
    house === 1 && base ? base.general : null,
    g.isRetro ? 'Retrograde: desire and demands intensify — obsessive persistence until the need is met.' : null,
  ].filter(Boolean)
  return {
    id: g.id,
    name: GRAHA_NAMES[g.id],
    rashi: g.rashi,
    rashiName: RASHI_NAMES[g.rashi],
    house,
    dignity: g.dignity,
    isRetro: Boolean(g.isRetro),
    theme,
    interpretation: parts.join(' '),
  }
}

function buildKeyTriad(grahas: GrahaData[], asc: Rashi): ChaturthamsaKeyTriadMember[] {
  const fourthLordId = SIGN_LORDS[wholeSignHouseSign(asc, 4)]
  const specs: { role: ChaturthamsaKeyTriadMember['role']; roleLabel: string; id: GrahaId }[] = [
    { role: 'moon', roleLabel: 'Moon — emotional field', id: 'Mo' },
    { role: 'fourthLord', roleLabel: '4th lord — happiness vector', id: fourthLordId },
    { role: 'jupiter', roleLabel: 'Jupiter — santosh (contentment)', id: 'Ju' },
  ]

  return specs.map(({ role, roleLabel, id }) => {
    const g = planetById(grahas, id)
    if (!g) {
      return {
        role,
        roleLabel,
        id,
        name: GRAHA_NAMES[id],
        house: 1,
        rashi: asc,
        rashiName: RASHI_NAMES[asc],
        dignity: 'neutral' as Dignity,
        isRetro: false,
        tone: 'neutral' as D4Tone,
        reading: `${GRAHA_NAMES[id]} missing from D4 graha set.`,
      }
    }
    const house = houseOf(g.rashi, asc)
    const tone = toneFromDignity(g.dignity, house)
    const afflicted =
      WEAK_DIGNITY.includes(g.dignity) ||
      [6, 8, 12].includes(house) ||
      conjunctIds(grahas, g).some((c) => MALEFICS.includes(c))

    let reading = `${GRAHA_NAMES[id]} in ${RASHI_NAMES[g.rashi]} H${house} (${dignityLabel(g.dignity)}).`
    if (role === 'jupiter') {
      reading += afflicted
        ? ' Afflicted Jupiter in D4: even with money, people, or children, contentment can spoil — restore santosh through wisdom and counsel.'
        : ' Jupiter supports satisfaction with what the house already holds.'
    } else if (role === 'moon') {
      reading += afflicted
        ? ' Challenged Moon: emotional resilience at home needs care.'
        : ' Moon supports a livable emotional climate.'
    } else {
      reading += ` The 4th lord’s house shows where true contentment (or conflict) is sought — H${house} themes dominate.`
      if (house === 10) {
        reading += ' Happiness through public service / karma is highlighted.'
      }
    }
    if (g.isRetro) reading += ' Retrograde intensifies the craving tied to this role.'

    return {
      role,
      roleLabel,
      id,
      name: GRAHA_NAMES[id],
      house,
      rashi: g.rashi,
      rashiName: RASHI_NAMES[g.rashi],
      dignity: g.dignity,
      isRetro: Boolean(g.isRetro),
      tone,
      reading,
    }
  })
}

function buildSummary(heart: ChaturthamsaLagnaHeart, triad: ChaturthamsaKeyTriadMember[]): string {
  const ju = triad.find((t) => t.role === 'jupiter')
  const signal = heart.primarySignal.label
  const content = ju && ju.tone === 'challenging'
    ? 'Watch Jupiter for contentment gaps even when outer life looks full.'
    : 'Moon, 4th lord, and Jupiter frame whether the house feels enough.'
  return `${signal}. ${content} D4 asks: what makes this person happy, and can you share a room with them?`
}

/**
 * Analyze Chaturthamsha (D4) from chart vargas.
 * Returns null if D4 data is missing.
 */
export function analyzeChaturthamsa(chart: ChartOutput): ChaturthamsaAnalysis | null {
  const asc = chart.vargaLagnas?.D4 as Rashi | undefined
  const grahas = chart.vargas?.D4
  if (!asc || !grahas?.length) return null

  const lagnaOccGrahas = grahas.filter((g) => houseOf(g.rashi, asc) === 1)
  const lagnaEmpty = lagnaOccGrahas.length === 0
  const lagnaLordId = SIGN_LORDS[asc]
  const lordG = planetById(grahas, lagnaLordId)
  const lordHouse = lordG ? houseOf(lordG.rashi, asc) : 1
  const lordConjuncts = lordG ? conjunctIds(grahas, lordG) : []

  const occupants: ChaturthamsaLagnaOccupant[] = lagnaOccGrahas.map((g) => {
    const base = LAGNA_PLANET_READINGS[g.id]
    const extras = buildSignExtras(
      g.id,
      asc,
      lagnaOccGrahas.map((x) => x.id),
    )
    const reading = [
      base?.general ?? `${GRAHA_NAMES[g.id]} colors the D4 heart.`,
      g.isRetro ? 'Retrograde intensifies insistence and obsessive wanting.' : null,
      ...extras,
    ]
      .filter(Boolean)
      .join(' ')
    return {
      id: g.id,
      name: GRAHA_NAMES[g.id],
      isRetro: Boolean(g.isRetro),
      reading,
      signExtras: extras,
    }
  })

  const aspectsOnLagna: ChaturthamsaAspectOnLagna[] = grahas
    .filter((g) => houseOf(g.rashi, asc) !== 1 && hasParasharaAspect(g.rashi, g.id, asc))
    .map((g) => ({
      id: g.id,
      name: GRAHA_NAMES[g.id],
      fromHouse: houseOf(g.rashi, asc),
      fromRashiName: RASHI_NAMES[g.rashi],
      note: aspectNote(g.id),
      relativeStrength: 'partial' as const,
    }))

  const nodesOnLagna = lagnaOccGrahas.some((g) => g.id === 'Ra' || g.id === 'Ke')

  const heartBase: Omit<ChaturthamsaLagnaHeart, 'primarySignal'> = {
    lagna: asc,
    lagnaName: RASHI_NAMES[asc],
    lagnaSanskrit: RASHI_SANSKRIT[asc],
    lagnaEmpty,
    occupants,
    lagnaLord: {
      id: lagnaLordId,
      name: GRAHA_NAMES[lagnaLordId],
      house: lordHouse,
      rashi: lordG?.rashi ?? asc,
      rashiName: RASHI_NAMES[lordG?.rashi ?? asc],
      dignity: lordG?.dignity ?? 'neutral',
      isRetro: Boolean(lordG?.isRetro),
      conjunctIds: lordConjuncts,
      conjunctNames: lordConjuncts.map((id) => GRAHA_NAMES[id]),
      reading: [
        lordG
          ? `${GRAHA_NAMES[lagnaLordId]} sits in ${RASHI_NAMES[lordG.rashi]} (H${lordHouse}, ${dignityLabel(lordG.dignity)}).`
          : `${GRAHA_NAMES[lagnaLordId]} placement unavailable.`,
        lordConjunctionReading(lagnaLordId, lordConjuncts),
        lordHouse === 10 ? 'Happiness sought through public service / karma.' : null,
      ]
        .filter(Boolean)
        .join(' '),
    },
    aspectsOnLagna,
    signFlavor: LAGNA_SIGN_FLAVOR[asc],
    nodesOnLagna,
    heartDisturbed: nodesOnLagna,
  }

  const heart: ChaturthamsaLagnaHeart = {
    ...heartBase,
    primarySignal: buildPrimarySignal(heartBase),
  }

  const planets = CLASSICAL_ORDER
    .map((id) => planetById(grahas, id))
    .filter((g): g is GrahaData => Boolean(g))
    .map((g) => buildPlanetRow(g, asc))

  const houses: ChaturthamsaHouseRow[] = []
  for (let h = 1; h <= 12; h++) {
    const rashi = wholeSignHouseSign(asc, h)
    const occ = grahas.filter((g) => houseOf(g.rashi, asc) === h)
    const { reading, tone } = buildHouseReading(h, occ, rashi)
    const lordId = SIGN_LORDS[rashi]
    houses.push({
      house: h,
      rashi,
      rashiName: RASHI_NAMES[rashi],
      lordId,
      lordName: GRAHA_NAMES[lordId],
      occupants: occ.map((g) => ({ id: g.id, name: GRAHA_NAMES[g.id], isRetro: Boolean(g.isRetro) })),
      theme: HOUSE_THEMES[h] ?? `House ${h}`,
      reading,
      tone,
    })
  }

  const focusedHouses = houses.filter((h) => (FOCUS_HOUSES as readonly number[]).includes(h.house))
  const keyTriad = buildKeyTriad(grahas, asc)
  const relocation = buildRelocation(chart, grahas, asc)
  const conflictFlags = buildConflictFlags(asc, grahas, heart)
  const affinityGuide = buildAffinityGuide(occupants.map((o) => o.id))

  const retrogradeNotes = grahas
    .filter((g) => g.isRetro)
    .map((g) => {
      const h = houseOf(g.rashi, asc)
      return `Retrograde ${GRAHA_NAMES[g.id]} in H${h}: obsessive, persistent demands around that house’s themes — intensity that is hard to ignore.`
    })

  const insights: ChaturthamsaInsight[] = []
  insights.push({
    kind: 'highlight',
    title: heart.primarySignal.label,
    text: heart.primarySignal.detail,
  })
  if (heart.lagnaEmpty) {
    insights.push({
      kind: 'info',
      title: 'Empty D4 lagna',
      text: 'No planet occupies the heart — the lagna lord’s house and conjunctions tell the emotional story at full strength. Aspects on lagna work at roughly 30–40%.',
    })
  }
  if (heart.aspectsOnLagna.length && heart.lagnaEmpty) {
    insights.push({
      kind: 'info',
      title: 'Aspects on empty lagna',
      text: heart.aspectsOnLagna.map((a) => `${a.name} from H${a.fromHouse}: ${a.note}`).join(' '),
    })
  }
  for (const flag of conflictFlags) {
    insights.push({ kind: 'caution', title: flag.title, text: flag.text })
  }
  const ju = keyTriad.find((t) => t.role === 'jupiter')
  if (ju && ju.tone === 'challenging') {
    insights.push({ kind: 'caution', title: 'Contentment (Jupiter) stressed', text: ju.reading })
  } else if (ju && ju.tone === 'supportive') {
    insights.push({ kind: 'strength', title: 'Jupiter supports santosh', text: ju.reading })
  }
  if (relocation && (relocation.eighthLordPeriodActive || relocation.sixthEighthDashaLink)) {
    insights.push({ kind: 'caution', title: relocation.headline, text: relocation.detail })
  }
  for (const note of retrogradeNotes.slice(0, 3)) {
    insights.push({ kind: 'info', title: 'Retrograde intensity', text: note })
  }

  return {
    d4Lagna: asc,
    d4LagnaName: RASHI_NAMES[asc],
    d4LagnaSanskrit: RASHI_SANSKRIT[asc],
    summary: buildSummary(heart, keyTriad),
    purpose: D4_PURPOSE,
    heart,
    keyTriad,
    planets,
    houses,
    focusedHouses,
    relocation,
    affinityGuide,
    conflictFlags,
    insights,
    retrogradeNotes,
  }
}
