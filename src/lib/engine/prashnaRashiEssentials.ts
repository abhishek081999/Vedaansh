// ─────────────────────────────────────────────────────────────
//  src/lib/engine/prashnaRashiEssentials.ts
//  Rashi essentials for praśna: each sign's lord, symbol, places and body
//  parts, the classical sign classifications, and a few readings taken from
//  the prashna chart (time strength, dual-sign tilt, Sun-relative looks,
//  dhatu / mula / jeeva). Curated from class notes; class chatter was left out.
//  Reference data plus pure helpers: nothing here feeds a verdict.
// ─────────────────────────────────────────────────────────────

import type { GrahaId, Rashi } from '@/types/astrology'
import type { EngineLang } from './lang'
import {
  RASHI_CLASSIFICATIONS_HI,
  RASHI_CONSTITUTION_HI,
  RASHI_DIRECTION_HI,
  RASHI_LOOKS_HI,
  RASHI_LORD_NOTES_HI,
  RASHI_PROFILES_HI,
} from './locale/prashnaRashiEssentials.hi'

/** A whole sign, or one half of it (feet classification splits 9 and 10). */
export type SignRef = Rashi | { sign: Rashi; half: 1 | 2 }

export interface RashiGroup {
  /** Stable id, `<classification>-<slug>`; the Hindi table is keyed on it. */
  id: string
  label: string
  signs: SignRef[]
  note?: string
}

export interface RashiClassification {
  id: string
  title: string
  intro?: string
  groups: RashiGroup[]
  notes?: string[]
}

export type Direction = 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' | 'N' | 'NE'

export interface RashiProfile {
  rashi: Rashi
  /** Sanskrit name, Latin script (English view only). */
  sanskrit: string
  lord: GrahaId
  symbol: string
  places: string[]
  body: string[]
  colour: string
  /** Direction for Arudha Lagna (from where the querent approaches). */
  arudhaDirection: Direction
}

export const DIRECTION_EN: Record<Direction, string> = {
  E: 'East', SE: 'South-East', S: 'South', SW: 'South-West', W: 'West', NW: 'North-West', N: 'North', NE: 'North-East',
}

export const RASHI_LORD_NOTES: string[] = [
  'The Moon and the Sun own one sign each; the other planets own two. In the South Indian chart these lordships follow a set order: by increasing distance from the Sun, and by increasing sidereal period from the Moon.',
  'The ownership of Rahu and Ketu is debated, but Virgo for Rahu and Pisces for Ketu is widely accepted.',
]

export const RASHI_PROFILES: RashiProfile[] = [
  {
    rashi: 1, sanskrit: 'Mesha', lord: 'Ma', symbol: 'Ram', colour: 'Red', arudhaDirection: 'E',
    places: [
      'Forests with four-legged animals such as sheep and goats',
      'Grassy meadows and grasslands (green grass, not dry)',
      'Canals with water, and lakes',
      'The middle or interior of forests',
      'Areas rich in precious stones, gems and minerals, including mines',
      'Snake holes and burrows',
    ],
    body: ['Brain', 'Cranium (skull bones: left, right and centre)'],
  },
  {
    rashi: 2, sanskrit: 'Vrishabha', lord: 'Ve', symbol: 'Bull', colour: 'White', arudhaDirection: 'E',
    places: [
      'Farmlands and planned agricultural land',
      'Cowsheds and gaushalas',
      'Forests with villages or colonies inside (like the interior of a national park)',
      'Waterlogged fields such as rice paddies',
      'Today: towns, big and good cities, scenic beauty spots and tourist places',
      'Business areas and business cities (e.g. Mumbai), where business is transacted',
    ],
    body: ['Face', 'Throat and food pipe (not the windpipe)', 'Facial bones', 'Ears and nose'],
  },
  {
    rashi: 3, sanskrit: 'Mithuna', lord: 'Me', colour: 'Green', arudhaDirection: 'SE',
    symbol: 'A man and a woman (a couple) holding a trumpet and harp, or a mace and violin. The shastras call the pair Purusha and Prakriti',
    places: [
      'Towns, cities and small towns (kasbas)',
      'Parks and gardens of your village or city',
      'Gambling dens, gambling houses and casinos (to find the place itself, look at Gemini)',
      'Places of worship and the puja room',
      'Pleasure houses, music and ballet rooms, concert venues',
      'Kothas (dance and music houses of classical texts) and dance practice rooms',
      'Donkeys and forest',
      'Rest and entertainment: couch, lounge, sofa, bed, bedroom, pen, rest house, guest house',
    ],
    body: ['Shoulders and neck', 'Arms, hands and arm bones', 'Upper chest and collarbone', 'Windpipe'],
  },
  {
    rashi: 4, sanskrit: 'Karka', lord: 'Mo', symbol: 'Crab', colour: 'Pink', arudhaDirection: 'S',
    places: [
      'Water and forests; places near water',
      'Ponds, rivers and pools of water in forests',
      'Cities or places on the banks of rivers or ponds',
      'Cracks in the soil that fill with water',
    ],
    body: ['Chest and breasts', 'Lungs and heart', 'Rib bones'],
  },
  {
    rashi: 5, sanskrit: 'Simha', lord: 'Su', symbol: 'Lion or other wild animals', colour: 'Off white', arudhaDirection: 'S',
    places: [
      'Mountains, caves and forests',
      'Places inhabited by hunters; hunters\' machans',
      'Old hunting grounds of kings and nawabs now inside cities (Bhopal, Jaipur, Jodhpur)',
      'Places where rishis and munis lived; sages\' ashrams',
      'Today: a sannyasi\'s hut or ashram',
    ],
    body: ['Upper abdomen (heart to navel)', 'Small intestine', 'Spine', 'Liver, spleen, gallbladder and pancreas'],
  },
  {
    rashi: 6, sanskrit: 'Kanya', lord: 'Me', colour: 'Variegated', arudhaDirection: 'SW',
    symbol: 'A slim girl holding grain in one hand and a lamp in the other',
    places: [
      'Grains',
      'Pasture and grazing land (gochar) near water',
      'Land with water and food crops; fields where cows and goats feed',
      'Food crops for daily use, fodder crops and crops near water',
      'Pleasure rooms and luxurious rooms',
      'Near a shop; temples, or a temple near a shop',
    ],
    body: ['Lower abdomen below the navel', 'Large intestine', 'Muladhara and the lowest part of the spine'],
  },
  {
    rashi: 7, sanskrit: 'Tula', lord: 'Ve', colour: 'Black', arudhaDirection: 'W',
    symbol: 'A man holding a balance with equal weights (like the blind-justice statue)',
    places: [
      'Places of business, business centres, business and trading houses',
      'Markets, bazaars and shops',
      'Theatres',
      'Valuables, articles of trade and business materials',
    ],
    body: ['Ovaries and testicles', 'Lower-back bones', 'Kidneys'],
  },
  {
    rashi: 8, sanskrit: 'Vrishchika', lord: 'Ma', symbol: 'Scorpion', colour: 'Saffron', arudhaDirection: 'W',
    places: [
      'Holes, cavities, crevices and burrows (of rats and similar animals)',
      'Anthills and places with many holes',
      'Rocky areas and rocky plateaus',
      'Habitat of poisonous insects, also in rivers and streams',
      'Partly watery places, ponds, stagnant and dirty water',
      'Caves near water bodies',
    ],
    body: ['Private parts'],
  },
  {
    rashi: 9, sanskrit: 'Dhanu', lord: 'Ju', colour: 'Golden', arudhaDirection: 'NW',
    symbol: 'Half horse, half man: a horse\'s body and a human face, holding a bow and arrow',
    places: [
      'Habitat of horses and elephants; stables',
      'The king\'s abode and palaces (today a posh upper-class locality)',
      'Battlefields and war zones',
      'Forts, or a fort-like home (today a house guarded by police, army or private security)',
      'Brave and accomplished people; today, experts in firearms and weapons',
      'Rest houses, guest houses and circuit houses',
      'Military cantonments and officers\' homes',
    ],
    body: ['Hips', 'Thighs and thigh bone'],
  },
  {
    rashi: 10, sanskrit: 'Makara', lord: 'Sa', colour: 'Various colours', arudhaDirection: 'N',
    symbol: 'A mixed animal: a deer\'s mouth, a bull\'s shoulders and an elephant\'s eyes',
    places: [
      'Forests',
      'Rivers and water places; waterlogged places',
      'Water-filled forests like the Sundarbans (also ruled by Scorpio)',
      'Potters\' (kumhar) areas and clay pots',
      'Tribal groups, tribal areas and homes',
    ],
    body: ['Knees', 'All joints (elbow, knee, ankle)'],
  },
  {
    rashi: 11, sanskrit: 'Kumbha', lord: 'Sa', colour: 'Dark brown', arudhaDirection: 'N',
    symbol: 'A man holding a water pot, or a pot of pickles',
    places: [
      'Dwelling in water; stored clean water',
      'Clay-soil areas',
      'Gambling dens and gambling houses',
      'A person with the habit or addiction of gambling (Gemini shows the place)',
      'Art galleries',
      'Homes tied to arts and crafts',
    ],
    body: ['Legs (calf and shin)', 'Blood circulation'],
  },
  {
    rashi: 12, sanskrit: 'Meena', lord: 'Ju', colour: 'White', arudhaDirection: 'NE',
    symbol: 'Two fishes, the head of each near the tail of the other, forming a circle',
    places: [
      'Deep caves and deep water; dwelling in water',
      'Temples and old temples',
      'Pilgrimages and pilgrimage places',
      'River confluences (sangam)',
    ],
    body: ['Feet and toes, with their nerves and bones'],
  },
]

const ODD: Rashi[] = [1, 3, 5, 7, 9, 11]
const EVEN: Rashi[] = [2, 4, 6, 8, 10, 12]
const NIGHT: Rashi[] = [1, 2, 3, 4, 9, 10]
const DAY: Rashi[] = [5, 6, 7, 8, 11, 12]

function grp(id: string, label: string, signs: SignRef[], note?: string): RashiGroup {
  return note ? { id, label, signs, note } : { id, label, signs }
}

export const RASHI_CLASSIFICATIONS: RashiClassification[] = [
  {
    id: 'rising', title: 'Mode of rising',
    groups: [
      grp('rising-head', 'Shirshodaya (rises with the head)', [3, 5, 6, 7, 8, 11]),
      grp('rising-hind', 'Prishtodaya (rises with the hind)', [1, 2, 4, 9, 10]),
      grp('rising-both', 'Ubhayodaya (rises with both)', [12]),
    ],
  },
  {
    id: 'nature-parashari', title: 'Benefic or malefic (Parashari rule)',
    intro: 'The general Parashari rule: odd signs are malefic, even signs benefic.',
    groups: [
      grp('nature-parashari-malefic', 'Malefic', ODD),
      grp('nature-parashari-benefic', 'Benefic', EVEN),
    ],
  },
  {
    id: 'nature-lord', title: 'Benefic or malefic (by lord)',
    intro: 'Another view: signs owned by benefic planets are benefic, signs owned by malefic planets are malefic.',
    notes: ['Judge both views together. Jupiter owns 9 and 12: Sagittarius is odd, so malefic by sign, yet benefic by lordship. Jupiter is a natural benefic, but check its functional role in every chart: it can still spoil matters.'],
    groups: [
      grp('nature-lord-malefic', 'Malefic lordship', [1, 5, 8, 10, 11]),
      grp('nature-lord-benefic', 'Benefic lordship', [2, 3, 4, 6, 7, 9, 12]),
    ],
  },
  {
    id: 'strength', title: 'Strength by time',
    intro: 'Very important in praśna: when was the question asked, and which lagna is rising? Flat rule: odd signs are strong by day, even signs at night. The split below is used more often.',
    groups: [
      grp('strength-night', 'Strong at night (ratribali)', NIGHT, 'Governed by the Moon'),
      grp('strength-day', 'Strong by day (divabali)', DAY, 'Governed by the Sun'),
    ],
  },
  {
    id: 'luminary-half', title: 'Lunar or solar (zodiac halves)',
    intro: 'One view splits the zodiac in two: Leo to Capricorn is solar, Cancer back to Aquarius is lunar.',
    groups: [
      grp('luminary-half-solar', 'Solar', [5, 6, 7, 8, 9, 10]),
      grp('luminary-half-lunar', 'Lunar', [4, 3, 2, 1, 12, 11]),
    ],
  },
  {
    id: 'luminary-time', title: 'Lunar or solar (by time)',
    intro: 'Another view: night signs are lunar, day signs are solar.',
    groups: [
      grp('luminary-time-lunar', 'Lunar', NIGHT),
      grp('luminary-time-solar', 'Solar', DAY),
    ],
  },
  {
    id: 'gender', title: 'Male or female',
    groups: [
      grp('gender-male', 'Male (odd signs)', ODD),
      grp('gender-female', 'Female (even signs)', EVEN),
    ],
  },
  {
    id: 'element', title: 'Element',
    groups: [
      grp('element-fire', 'Fiery', [1, 5, 9]),
      grp('element-earth', 'Earthy', [2, 6, 10]),
      grp('element-air', 'Airy', [3, 7, 11]),
      grp('element-water', 'Watery', [4, 8, 12]),
    ],
  },
  {
    id: 'mobility', title: 'Nature of mobility',
    groups: [
      grp('mobility-movable', 'Movable', [1, 4, 7, 10], 'Movement, a change of status'),
      grp('mobility-fixed', 'Fixed', [2, 5, 8, 11], 'Status quo, no change'),
      grp('mobility-dual', 'Dual', [3, 6, 9, 12], 'In between; the rising degree decides the tilt'),
    ],
    notes: ['In praśna a dual sign rising at 0–15° is closer to a fixed sign and gives fixed results; rising at 15–30° it is closer to a movable sign and gives movable results.'],
  },
  {
    id: 'direction', title: 'Direction',
    intro: 'Read from the sign rising in the Lagna.',
    groups: [
      grp('direction-east', 'East', [1, 5, 9]),
      grp('direction-south', 'South', [2, 6, 10]),
      grp('direction-west', 'West', [3, 7, 11]),
      grp('direction-north', 'North', [4, 8, 12]),
    ],
    notes: ['For Arudha Lagna, directions follow where the querent approaches the astrologer from: Aries and Taurus East, Gemini South-East, Cancer and Leo South, Virgo South-West, Libra and Scorpio West, Sagittarius North-West, Capricorn and Aquarius North, Pisces North-East.'],
  },
  {
    id: 'varna', title: 'Varna (caste)',
    groups: [
      grp('varna-kshatriya', 'Kshatriya (warrior)', [1, 5, 9]),
      grp('varna-vaishya', 'Vaishya (merchant)', [2, 6, 10]),
      grp('varna-shudra', 'Shudra (worker)', [3, 7, 11]),
      grp('varna-brahmin', 'Brahmin (priest)', [4, 8, 12]),
    ],
  },
  {
    id: 'radiance', title: 'Radiance',
    groups: [
      grp('radiance-shining', 'Shining', [3, 4, 7, 8, 11, 12]),
      grp('radiance-dull', 'Lustreless', [1, 2, 5, 6, 9, 10]),
    ],
  },
  {
    id: 'guna', title: 'Guna',
    groups: [
      grp('guna-sattva', 'Sattvik', [4, 5, 9, 12], 'Signs of the Sun, Moon and Jupiter'),
      grp('guna-rajas', 'Rajasik', [2, 3, 6, 7], 'Signs of Venus and Mercury'),
      grp('guna-tamas', 'Tamasik', [1, 8, 10, 11], 'Signs of Mars and Saturn'),
    ],
  },
  {
    id: 'appearance', title: 'Appearance',
    groups: [
      grp('appearance-rough', 'Rough', [1, 2, 5, 6, 9, 10]),
      grp('appearance-smooth', 'Smooth', [3, 4, 7, 8, 11, 12]),
    ],
  },
  {
    id: 'feet', title: 'Feet',
    groups: [
      grp('feet-biped', 'Biped (two feet)', [3, 6, 7, { sign: 9, half: 1 }, 11], 'Strong in the Lagna'),
      grp('feet-quadruped', 'Quadruped (four feet)', [1, 2, 5, { sign: 9, half: 2 }, { sign: 10, half: 1 }], 'Strong in the 10th house'),
      grp('feet-reptile', 'Reptile (many feet)', [4, { sign: 10, half: 2 }, 12], 'Strong in the 4th house'),
      grp('feet-keeta', 'Keeta (insect)', [8], 'Strong in the 7th house'),
    ],
    notes: ['Another view: Scorpio and Pisces are keeta rashis (land reptiles), while Cancer and the second half of Capricorn are watery (jalachara) reptiles.'],
  },
  {
    id: 'women', title: 'Affinity with women',
    groups: [
      grp('women-scarce', 'Scarce', [1, 5, 6, 7, 9, 10]),
      grp('women-medium', 'Medium', [2, 3, 11]),
      grp('women-excess', 'Excess', [4, 8, 12]),
    ],
  },
  {
    id: 'temperament', title: 'Temperament',
    groups: [
      grp('temperament-imperious', 'Imperious and authoritative', [1, 2, 3, 6, 7]),
      grp('temperament-philosophic', 'Philosophic and philanthropic', [4, 5, 9, 12]),
      grp('temperament-assertive', 'Assertive and energetic', [8]),
      grp('temperament-lazy', 'Lazy and indolent', [10, 11]),
    ],
  },
  {
    id: 'ascension', title: 'Ascension',
    groups: [
      grp('ascension-short', 'Short', [1, 6, 7, 12]),
      grp('ascension-medium', 'Medium', [2, 5, 8, 11]),
      grp('ascension-long', 'Long', [3, 4, 9, 10]),
    ],
    notes: ['These durations hold at the equator. How long a sign takes to rise changes with latitude and hemisphere, so keep the local rising time (oblique ascension) in mind.'],
  },
  {
    id: 'constitution', title: 'Dhatu, mula, jeeva',
    groups: [
      grp('constitution-dhatu', 'Dhatu (mineral)', [1, 4, 7, 10]),
      grp('constitution-mula', 'Mula (root)', [2, 5, 8, 11]),
      grp('constitution-jeeva', 'Jeeva (living)', [3, 6, 9, 12]),
    ],
    notes: [
      'Dhatu: an attack with a metal object (rod, knife, sword), or a metal article involved.',
      'Jeeva: a bite from a dog, cat or rat, or an animal involved.',
      'Mula: something hidden or fallen in the bedroom, the foundation, under the building, or near the roots of a tree or in a garden.',
      'Read this together with the direction and with the time of the question (day or night).',
    ],
  },
]

// ── Sun-relative looks ─────────────────────────────────────

export type LookKind = 'urdhva' | 'adho' | 'tiryak' | 'agra'
export const LOOK_KINDS: LookKind[] = ['urdhva', 'adho', 'tiryak', 'agra']

export const RASHI_LOOKS: Record<LookKind, { label: string; rule: string }> = {
  urdhva: { label: 'Urdhvamukh (looking up)', rule: 'The sign the Sun has left, and its trines' },
  adho:   { label: 'Adhomukh (looking down)', rule: 'The sign the Sun occupies, and its trines' },
  tiryak: { label: 'Tiryakmukh (looking sideways)', rule: 'The sign the Sun enters next, and its trines' },
  agra:   { label: 'Agramukh (looking forward)', rule: 'The third sign from the Sun, and its trines' },
}

const wrap = (n: number): Rashi => ((((n - 1) % 12) + 12) % 12 + 1) as Rashi
const trines = (r: number): Rashi[] => [wrap(r), wrap(r + 4), wrap(r + 8)]

/** Which signs look up, down, sideways and forward, given the Sun's sign. */
export function sunLooks(sunRashi: Rashi): Record<LookKind, Rashi[]> {
  return { urdhva: trines(sunRashi - 1), adho: trines(sunRashi), tiryak: trines(sunRashi + 1), agra: trines(sunRashi + 2) }
}

export function lookOf(rashi: Rashi, sunRashi: Rashi): LookKind {
  const looks = sunLooks(sunRashi)
  return LOOK_KINDS.find(k => looks[k].includes(rashi))!
}

// ── Dhatu, mula, jeeva ─────────────────────────────────────

export type ConstitutionKind = 'dhatu' | 'mula' | 'jeeva'
export const CONSTITUTION_KINDS: ConstitutionKind[] = ['dhatu', 'mula', 'jeeva']

export interface NavamshaScheme {
  id: 'general' | 'krishnacharya'
  title: string
  note: string
  /** Navamsha numbers (1–9 within the sign) for each kind, by lagna parity. */
  odd: Record<ConstitutionKind, number[]>
  even: Record<ConstitutionKind, number[]>
}

export const NAVAMSHA_SCHEMES: NavamshaScheme[] = [
  {
    id: 'general', title: 'General scheme', note: 'Generally accepted.',
    odd: { dhatu: [1, 4, 7], mula: [2, 5, 8], jeeva: [3, 6, 9] },
    even: { jeeva: [1, 4, 7], mula: [2, 5, 8], dhatu: [3, 6, 9] },
  },
  {
    id: 'krishnacharya', title: 'Krishnacharya',
    note: 'This difference of opinion may be why the technique sometimes fails in mook (silent) praśna; it needs more testing.',
    odd: { dhatu: [1, 6, 8], mula: [2, 4, 9], jeeva: [3, 5, 7] },
    even: { jeeva: [1, 6, 8], dhatu: [2, 4, 9], mula: [3, 5, 7] },
  },
]

export const CONSTITUTION_PLANETS: Record<ConstitutionKind, GrahaId[]> = {
  dhatu: ['Mo', 'Ma', 'Ra', 'Sa'],
  mula: ['Su', 'Ve'],
  jeeva: ['Ju', 'Me'],
}

/** [planet kind, sign kind] → what the article is. */
export const CONSTITUTION_COMBOS: { planet: ConstitutionKind; sign: ConstitutionKind; text: string }[] = [
  { planet: 'dhatu', sign: 'dhatu', text: 'Metal' },
  { planet: 'dhatu', sign: 'mula', text: 'Trees and plants' },
  { planet: 'dhatu', sign: 'jeeva', text: 'Animals made of metal' },
  { planet: 'mula', sign: 'mula', text: 'Roots' },
  { planet: 'mula', sign: 'jeeva', text: 'Fruits, crops and roots' },
  { planet: 'mula', sign: 'dhatu', text: 'Burnt vegetation' },
  { planet: 'jeeva', sign: 'jeeva', text: 'Living beings' },
  { planet: 'jeeva', sign: 'dhatu', text: 'Animal waste or excretion' },
  { planet: 'jeeva', sign: 'mula', text: 'Seeds' },
]

export const CONSTITUTION_TEXT = {
  kinds: { dhatu: 'Dhatu (mineral)', mula: 'Mula (root)', jeeva: 'Jeeva (living)' } as Record<ConstitutionKind, string>,
  intro: 'In mook (silent) praśna the Lagna sign, its navamsha and the planet involved show what kind of article is in question: mineral, root or living.',
  combosTitle: 'Planet and sign together',
  planetsTitle: 'Planets by kind',
}

export function navamshaInSign(degreeInSign: number): number {
  return Math.min(9, Math.floor((((degreeInSign % 30) + 30) % 30) / (30 / 9)) + 1)
}

export function constitutionFor(scheme: NavamshaScheme, rashi: Rashi, navamsha: number): ConstitutionKind {
  const table = rashi % 2 === 1 ? scheme.odd : scheme.even
  return CONSTITUTION_KINDS.find(k => table[k].includes(navamsha))!
}

export function planetConstitution(id: GrahaId): ConstitutionKind | undefined {
  return CONSTITUTION_KINDS.find(k => CONSTITUTION_PLANETS[k].includes(id))
}

export function combinedIndication(planet: ConstitutionKind, sign: ConstitutionKind, lang: EngineLang = 'en'): string {
  const i = CONSTITUTION_COMBOS.findIndex(c => c.planet === planet && c.sign === sign)
  return lang === 'hi' ? RASHI_CONSTITUTION_HI.combos[i] : CONSTITUTION_COMBOS[i].text
}

// ── Readings from the prashna chart ────────────────────────

export interface PrashnaRashiReading {
  ascRashi: Rashi
  isDay: boolean
  /** True when the Lagna sign is strong at the hour of the question. */
  lagnaTimeStrong: boolean
  /** Only for a dual Lagna: which way the rising degree tilts it. */
  dualTilt?: 'fixed' | 'movable'
  degreeInSign: number
  sunRashi: Rashi
  looks: Record<LookKind, Rashi[]>
  lagnaLook: LookKind
  navamsha: number
  constitution: Record<NavamshaScheme['id'], ConstitutionKind>
  /** Planets in the Lagna sign with their kind, when they have one. */
  lagnaPlanets: { id: GrahaId; kind?: ConstitutionKind }[]
}

export function readPrashnaRashi(input: {
  ascRashi: Rashi
  ascDegree: number
  sunRashi: Rashi
  isDay: boolean
  lagnaGrahas: GrahaId[]
}): PrashnaRashiReading {
  const { ascRashi, sunRashi, isDay } = input
  const degreeInSign = ((input.ascDegree % 30) + 30) % 30
  const navamsha = navamshaInSign(degreeInSign)
  const dual = ascRashi % 3 === 0
  return {
    ascRashi, isDay, sunRashi, degreeInSign, navamsha,
    lagnaTimeStrong: (isDay ? DAY : NIGHT).includes(ascRashi),
    ...(dual ? { dualTilt: degreeInSign < 15 ? 'fixed' as const : 'movable' as const } : {}),
    looks: sunLooks(sunRashi),
    lagnaLook: lookOf(ascRashi, sunRashi),
    constitution: {
      general: constitutionFor(NAVAMSHA_SCHEMES[0], ascRashi, navamsha),
      krishnacharya: constitutionFor(NAVAMSHA_SCHEMES[1], ascRashi, navamsha),
    },
    lagnaPlanets: input.lagnaGrahas.map(id => ({ id, kind: planetConstitution(id) })),
  }
}

// ── Lookups with language ──────────────────────────────────

export const signOf = (ref: SignRef): Rashi => (typeof ref === 'number' ? ref : ref.sign)

export function getRashiProfile(rashi: Rashi, lang: EngineLang = 'en'): RashiProfile {
  const base = RASHI_PROFILES[rashi - 1]
  if (lang !== 'hi') return base
  const hi = RASHI_PROFILES_HI[rashi]
  return { ...base, symbol: hi.symbol, places: hi.places, body: hi.body, colour: hi.colour }
}

export function getRashiClassifications(lang: EngineLang = 'en'): RashiClassification[] {
  if (lang !== 'hi') return RASHI_CLASSIFICATIONS
  return RASHI_CLASSIFICATIONS.map(c => {
    const hi = RASHI_CLASSIFICATIONS_HI[c.id]
    return {
      ...c,
      title: hi.title,
      ...(c.intro ? { intro: hi.intro } : {}),
      ...(c.notes ? { notes: hi.notes } : {}),
      groups: c.groups.map(g => {
        const hg = hi.groups[g.id]
        return g.note ? { ...g, label: hg.label, note: hg.note } : { ...g, label: hg.label }
      }),
    }
  })
}

/** For one sign, the group it falls in under every classification (with the half, if split). */
export function classificationsOf(rashi: Rashi, lang: EngineLang = 'en'): { classification: RashiClassification; group: RashiGroup; half?: 1 | 2 }[] {
  const out: { classification: RashiClassification; group: RashiGroup; half?: 1 | 2 }[] = []
  for (const c of getRashiClassifications(lang)) {
    for (const g of c.groups) {
      for (const ref of g.signs) {
        if (signOf(ref) !== rashi) continue
        out.push(typeof ref === 'number' ? { classification: c, group: g } : { classification: c, group: g, half: ref.half })
      }
    }
  }
  return out
}

export const directionLabel = (d: Direction, lang: EngineLang = 'en') => (lang === 'hi' ? RASHI_DIRECTION_HI[d] : DIRECTION_EN[d])
export const lordNotes = (lang: EngineLang = 'en') => (lang === 'hi' ? RASHI_LORD_NOTES_HI : RASHI_LORD_NOTES)
export const lookText = (k: LookKind, lang: EngineLang = 'en') => (lang === 'hi' ? RASHI_LOOKS_HI[k] : RASHI_LOOKS[k])

export function constitutionText(lang: EngineLang = 'en') {
  if (lang !== 'hi') {
    return { ...CONSTITUTION_TEXT, schemes: NAVAMSHA_SCHEMES.map(s => ({ id: s.id, title: s.title, note: s.note })) }
  }
  const hi = RASHI_CONSTITUTION_HI
  return { kinds: hi.kinds, intro: hi.intro, combosTitle: hi.combosTitle, planetsTitle: hi.planetsTitle, schemes: NAVAMSHA_SCHEMES.map(s => ({ id: s.id, ...hi.schemes[s.id] })) }
}
