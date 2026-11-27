// ─────────────────────────────────────────────────────────────
//  src/lib/engine/prashnaArudhaEssentials.ts
//  Arudha and the three prashna Lagnas (Udaya, Arudha, Chatra), from the
//  chapter "Introduction to Prashna": ways to fix the Arudha (number 1–108,
//  first letter spoken, Arudha Navamsa Chakra, line ends, direction), the
//  Ashtamangala figure, Chatra Lagna, the sutra between the Lagna lords,
//  signs of a sincere or insincere query, and the chapter's reference notes.
//  Reference data plus pure helpers: nothing here feeds a verdict.
// ─────────────────────────────────────────────────────────────

import type { GrahaId, Rashi } from '@/types/astrology'
import type { EngineLang } from './lang'
import { hasParasharaAspect, wholeSignCount } from './aspects'
import { naturalRelationship } from './dignity'
import {
  ARUDHA_REFERENCE_HI,
  ASHTA_PLANET_READING_HI,
  ASHTA_TEXT_HI,
  ASHTA_YONI_READING_HI,
  ELEMENT_HI,
  ELEMENT_RESULT_HI,
  SINCERITY_HI,
} from './locale/prashnaArudhaEssentials.hi'

const SIGN_LORD: GrahaId[] = ['Ma', 'Ve', 'Me', 'Mo', 'Su', 'Me', 'Ve', 'Ma', 'Ju', 'Sa', 'Sa', 'Ju']
export const signLord = (r: Rashi): GrahaId => SIGN_LORD[r - 1]
const nth = (from: Rashi, n: number): Rashi => ((((from - 1 + n - 1) % 12) + 12) % 12 + 1) as Rashi

// ── Elements ───────────────────────────────────────────────

export type Element = 'air' | 'fire' | 'earth' | 'water' | 'ether'
export const ELEMENTS: Element[] = ['air', 'fire', 'earth', 'water', 'ether']
export const ELEMENT_EN: Record<Element, string> = { air: 'Air', fire: 'Fire', earth: 'Earth', water: 'Water', ether: 'Ether' }
/** Sanskrit names, shown beside the English ones. */
export const ELEMENT_SANSKRIT: Record<Element, string> = { air: 'vayu', fire: 'agni', earth: 'prithvi', water: 'jala', ether: 'akash' }
export const ELEMENT_DEVANAGARI: Record<Element, string> = { air: 'वायु', fire: 'अग्नि', earth: 'पृथ्वी', water: 'जल', ether: 'आकाश' }
export const elementLabel = (e: Element, lang: EngineLang = 'en') => (lang === 'hi' ? ELEMENT_HI[e] : ELEMENT_EN[e])

export type Tone = 'good' | 'mixed' | 'bad'

// ── 1. Number 1–108 ─────────────────────────────────────────

export const NAVAMSHA_SPAN = 10 / 3 // 3°20′

export interface NavamshaPos { sign: Rashi; navamsha: number; /** Degrees inside the sign. */ from: number; to: number }

export const navamshaPos = (sign: Rashi, navamsha: number): NavamshaPos =>
  ({ sign, navamsha, from: (navamsha - 1) * NAVAMSHA_SPAN, to: navamsha * NAVAMSHA_SPAN })

/**
 * The querist names a number from 1 to 108. Divide by 9: the quotient is the
 * signs already passed (add one for the Arudha) and the remainder the navamsha
 * running (57 → Libra, 3rd navamsha, 6°40′–10°). A remainder of 0 closes the
 * previous sign, so 9 is Aries 9th navamsha and 108 is Pisces 9th.
 */
export function arudhaFromNumber108(n: number): NavamshaPos | null {
  if (!Number.isInteger(n) || n < 1 || n > 108) return null
  return navamshaPos((Math.floor((n - 1) / 9) + 1) as Rashi, ((n - 1) % 9) + 1)
}

/** "6°40′" style label for a degree inside a sign. */
export function dm(deg: number): string {
  const total = Math.round(deg * 60)
  const d = Math.floor(total / 60)
  const m = total % 60
  return m ? `${d}°${String(m).padStart(2, '0')}′` : `${d}°`
}

// ── 2. First letter spoken ─────────────────────────────────

export interface LetterCell {
  planet: GrahaId
  element: Element
  /** Column 1–5 in the table (Air, Fire, Earth, Water, Ether). */
  pos: number
  deva: string
  roman: string
  vowel: boolean
}

const row = (planet: GrahaId, letters: [string, string][], vowel = false): LetterCell[] =>
  letters.map(([deva, roman], i) => ({ planet, element: ELEMENTS[i], pos: i + 1, deva, roman, vowel }))

/** Hindi letters by planet and element (Moon and the Sun take two rows each). */
export const LETTER_ROWS: LetterCell[][] = [
  row('Ma', [['क', 'ka'], ['ख', 'kha'], ['ग', 'ga'], ['घ', 'gha'], ['ङ', 'gna']]),
  row('Ve', [['च', 'cha'], ['छ', 'chha'], ['ज', 'ja'], ['झ', 'jha'], ['ञ', 'nya']]),
  row('Me', [['ट', 'ta'], ['ठ', 'tha'], ['ड', 'da'], ['ढ', 'dha'], ['ण', 'na']]),
  row('Ju', [['त', 'ta'], ['थ', 'tha'], ['द', 'da'], ['ध', 'dha'], ['न', 'na']]),
  row('Sa', [['प', 'pa'], ['फ', 'pha'], ['ब', 'ba'], ['भ', 'bha'], ['म', 'ma']]),
  row('Mo', [['य', 'ya'], ['र', 'ra'], ['ल', 'la'], ['व', 'va'], ['श', 'sha']]),
  row('Mo', [['ष', 'sha'], ['स', 'sa'], ['ह', 'ha'], ['ॡ', 'lra'], ['क्ष', 'ksa']]),
  row('Su', [['ए', 'e'], ['उ', 'u'], ['अ', 'a'], ['इ', 'i'], ['ओ', 'o']], true),
  row('Su', [['ऐ', 'ai'], ['ऊ', 'oo'], ['आ', 'aa'], ['ई', 'ee'], ['औ', 'ow']], true),
]

/** Odd and even sign owned by each planet (the Sun and Moon own one sign each). */
export const PLANET_SIGNS: Partial<Record<GrahaId, { odd: Rashi; even: Rashi }>> = {
  Ma: { odd: 1, even: 8 },
  Ve: { odd: 7, even: 2 },
  Me: { odd: 3, even: 6 },
  Ju: { odd: 9, even: 12 },
  Sa: { odd: 11, even: 10 },
  Su: { odd: 5, even: 5 },
  Mo: { odd: 4, even: 4 },
}

/** Natural benefics for the first-letter reading. */
const LETTER_BENEFICS: GrahaId[] = ['Ju', 'Ve', 'Me', 'Mo']

/** Letters at odd positions (1, 3, 5) give the planet's odd sign, even positions its even sign. */
export function arudhaFromLetter(cell: LetterCell): Rashi {
  const s = PLANET_SIGNS[cell.planet]!
  return cell.pos % 2 ? s.odd : s.even
}

export const ELEMENT_RESULTS: Record<Element | 'vowel', { text: string; tone: Tone }> = {
  vowel: { text: 'Ill health', tone: 'bad' },
  air: { text: 'Bad', tone: 'bad' },
  fire: { text: 'Bad and violent', tone: 'bad' },
  ether: { text: 'Very bad', tone: 'bad' },
  earth: { text: 'Mediocre results', tone: 'mixed' },
  water: { text: 'Very good', tone: 'good' },
}

export interface LetterReading {
  arudha: Rashi
  benefic: boolean
  /** Result from the element of the letter. */
  element: { element: Element; text: string; tone: Tone }
  /** For a vowel: the result for vowels (jeeva) as a class. */
  vowel?: { text: string; tone: Tone }
}

export function readLetter(cell: LetterCell, lang: EngineLang = 'en'): LetterReading {
  const res = (k: Element | 'vowel') => ({ text: lang === 'hi' ? ELEMENT_RESULT_HI[k] : ELEMENT_RESULTS[k].text, tone: ELEMENT_RESULTS[k].tone })
  return {
    arudha: arudhaFromLetter(cell),
    benefic: LETTER_BENEFICS.includes(cell.planet),
    element: { element: cell.element, ...res(cell.element) },
    ...(cell.vowel ? { vowel: res('vowel') } : {}),
  }
}

// ── 3. Arudha Navamsa Chakra (touch) ───────────────────────

/** Block layout in the South Indian chart: [row, col] of a 4×4 grid. */
export const SOUTH_INDIAN_BLOCK: Record<Rashi, [number, number]> = {
  12: [0, 0], 1: [0, 1], 2: [0, 2], 3: [0, 3],
  11: [1, 0], 4: [1, 3],
  10: [2, 0], 5: [2, 3],
  9: [3, 0], 8: [3, 1], 7: [3, 2], 6: [3, 3],
}

const P1 = [[1, 6, 7], [2, 5, 8], [3, 4, 9]]
const P2 = [[7, 8, 9], [6, 5, 4], [1, 2, 3]]
const P3 = [[9, 4, 3], [8, 5, 2], [7, 6, 1]]
const P4 = [[3, 2, 1], [4, 5, 6], [9, 8, 7]]

/** Navamsha numbers printed in each sign's 3×3 block, rows top to bottom. */
export const ARUDHA_NAVAMSA_CHAKRA: Record<Rashi, number[][]> = {
  12: P2, 1: P1, 2: P2, 3: P1,
  11: P3, 4: P4,
  10: P2, 5: P1,
  9: P3, 8: P4, 7: P3, 6: P4,
}

// ── 4. Line ends (touch) ───────────────────────────────────

export type Side = 'top' | 'right' | 'bottom' | 'left'
/** Three vertical and three horizontal lines; each of the 12 ends is a sign. `i` runs left→right or top→bottom. */
export const LINE_ENDS: { sign: Rashi; side: Side; i: number }[] = [
  { sign: 2, side: 'top', i: 0 }, { sign: 3, side: 'top', i: 1 }, { sign: 4, side: 'top', i: 2 },
  { sign: 5, side: 'right', i: 0 }, { sign: 6, side: 'right', i: 1 }, { sign: 7, side: 'right', i: 2 },
  { sign: 10, side: 'bottom', i: 0 }, { sign: 9, side: 'bottom', i: 1 }, { sign: 8, side: 'bottom', i: 2 },
  { sign: 1, side: 'left', i: 0 }, { sign: 12, side: 'left', i: 1 }, { sign: 11, side: 'left', i: 2 },
]

// ── Chatra Lagna ────────────────────────────────────────────

/** Veethi rashi from the Sun's sign. */
export const VEETHI_GROUPS: { sun: Rashi[]; veethi: Rashi }[] = [
  { sun: [2, 3, 4, 5], veethi: 1 },
  { sun: [1, 6, 7, 9, 12], veethi: 2 },
  { sun: [8, 10, 11], veethi: 3 },
]
export const veethiRashi = (sun: Rashi): Rashi => VEETHI_GROUPS.find(g => g.sun.includes(sun))!.veethi

/**
 * Chatra Lagna: count from the Arudha to the rising Lagna (x), then count x
 * from the veethi rashi. Arudha Sagittarius, Lagna Pisces → 4; Sun in Aries →
 * veethi Taurus → 4th from Taurus is Leo.
 */
export function chatraLagna(input: { sunRashi: Rashi; udayaRashi: Rashi; arudhaRashi: Rashi }) {
  const veethi = veethiRashi(input.sunRashi)
  const count = wholeSignCount(input.arudhaRashi, input.udayaRashi)
  return { veethi, count, chatra: nth(veethi, count) }
}

// ── Sutra (Udaya lord and Arudha lord) ─────────────────────

export type SutraKind = 'friend' | 'neutral' | 'enemy'
export const SUTRA_TONE: Record<SutraKind, Tone> = { friend: 'good', neutral: 'mixed', enemy: 'bad' }

/**
 * Natural relationship between the Udaya Lagna lord and the Arudha lord:
 * friends give good results, enemies bad, neutral average. Read both ways:
 * friends only if each counts the other a friend (or one planet rules both),
 * enemies if either counts the other an enemy.
 */
export function sutra(udayaRashi: Rashi, arudhaRashi: Rashi) {
  const udayaLord = signLord(udayaRashi)
  const arudhaLord = signLord(arudhaRashi)
  const fromUdaya = udayaLord === arudhaLord ? 'friend' : naturalRelationship(udayaLord, arudhaLord)
  const fromArudha = udayaLord === arudhaLord ? 'friend' : naturalRelationship(arudhaLord, udayaLord)
  const kind: SutraKind =
    fromUdaya === 'enemy' || fromArudha === 'enemy' ? 'enemy'
      : fromUdaya === 'friend' && fromArudha === 'friend' ? 'friend'
        : 'neutral'
  return { udayaLord, arudhaLord, fromUdaya, fromArudha, kind }
}

// ── Ashtamangala ────────────────────────────────────────────

export type Yoni = 'flag' | 'smoke' | 'lion' | 'dog' | 'bull' | 'donkey' | 'elephant' | 'crow'
export type Animal = 'eagle' | 'cat' | 'lion' | 'dog' | 'serpent' | 'rat' | 'elephant' | 'hare'

export interface AshtaRow { n: number; planet: GrahaId; yoni: Yoni; animal: Animal; element: Element }

/** Remainder (1–8) → planet, yoni, animal and element. */
export const ASHTAMANGALA: AshtaRow[] = [
  { n: 1, planet: 'Su', yoni: 'flag', animal: 'eagle', element: 'earth' },
  { n: 2, planet: 'Ma', yoni: 'smoke', animal: 'cat', element: 'fire' },
  { n: 3, planet: 'Ju', yoni: 'lion', animal: 'lion', element: 'earth' },
  { n: 4, planet: 'Me', yoni: 'dog', animal: 'dog', element: 'ether' },
  { n: 5, planet: 'Ve', yoni: 'bull', animal: 'serpent', element: 'water' },
  { n: 6, planet: 'Sa', yoni: 'donkey', animal: 'rat', element: 'air' },
  { n: 7, planet: 'Mo', yoni: 'elephant', animal: 'elephant', element: 'water' },
  { n: 8, planet: 'Ra', yoni: 'crow', animal: 'hare', element: 'ether' },
]

export const ASHTA_TEXT = {
  yoni: { flag: 'Flag', smoke: 'Smoke', lion: 'Lion', dog: 'Dog', bull: 'Bull', donkey: 'Donkey', elephant: 'Elephant', crow: 'Crow' } as Record<Yoni, string>,
  animal: { eagle: 'Eagle', cat: 'Cat', lion: 'Lion', dog: 'Dog', serpent: 'Serpent', rat: 'Rat', elephant: 'Elephant', hare: 'Hare' } as Record<Animal, string>,
}

/** Results by planet; weigh each by that planet's strength in the prashna chart. */
export const ASHTA_PLANET_READING: Record<string, { text: string; tone: Tone }> = {
  Su: { text: 'Favourable; desires fulfilled, especially a position of authority, honour and triumph.', tone: 'good' },
  Ma: { text: 'Disputes, fights and fear of accident, fire, theft or weapons.', tone: 'bad' },
  Ju: { text: 'Auspicious: gain of wealth, progeny and the blessings of elders.', tone: 'good' },
  Me: { text: 'Skin diseases; analytical ability but a wavering mind, troubles and sorrows.', tone: 'mixed' },
  Ve: { text: 'Gain of ornaments and clothes, material and physical well-being, conjugal bliss if unafflicted.', tone: 'good' },
  Sa: { text: 'Troubles, losses and danger from ailments, thefts and other unexpected evils.', tone: 'bad' },
  Mo: { text: 'Overall prosperity and happiness, good food, drinks, crops.', tone: 'good' },
  Ra: { text: 'Prolonged and incurable diseases, unexplained fears, danger from poisons, disputes.', tone: 'bad' },
}

export const ASHTA_YONI_READING: Record<Yoni, { text: string; tone: Tone }> = {
  flag: { text: 'Gain of money; auspicious for general well-being and progeny.', tone: 'good' },
  smoke: { text: 'Troubles from enemies, diseases, arishta.', tone: 'bad' },
  lion: { text: 'Gain of money, progeny and other virtues.', tone: 'good' },
  dog: { text: 'Diseases, losses and disputes.', tone: 'bad' },
  bull: { text: 'Conjugal bliss, health and prosperity.', tone: 'good' },
  donkey: { text: 'Loss of money and position, failure of undertakings.', tone: 'bad' },
  elephant: { text: 'Wealth, happiness, gains and honour.', tone: 'good' },
  crow: { text: 'Grief, enemies, loss of friends, position and life.', tone: 'bad' },
}

/** Cowries left in a heap after taking out eights: a multiple of eight counts as 8. */
export const ashtaRemainder = (count: number) => ((count % 8) + 8) % 8 || 8

export type AshtaPlace = 'past' | 'present' | 'future'
export const ASHTA_PLACES: AshtaPlace[] = ['past', 'present', 'future']

export interface AshtaDigit {
  place: AshtaPlace
  row: AshtaRow
  yoniLabel: string
  animalLabel: string
  planetReading: { text: string; tone: Tone }
  yoniReading: { text: string; tone: Tone }
}

/**
 * The Ashtamangala figure: three digits 1–8 (hundreds = left heap = past,
 * tens = middle = present, ones = right = future). Returns null unless the
 * figure is three digits each from 1 to 8 (111–888).
 */
export function readAshtamangala(figure: string, lang: EngineLang = 'en'): AshtaDigit[] | null {
  if (!/^[1-8]{3}$/.test(figure.trim())) return null
  const hi = lang === 'hi'
  return figure.trim().split('').map((d, i) => {
    const r = ASHTAMANGALA[Number(d) - 1]
    return {
      place: ASHTA_PLACES[i],
      row: r,
      yoniLabel: hi ? ASHTA_TEXT_HI.yoni[r.yoni] : ASHTA_TEXT.yoni[r.yoni],
      animalLabel: hi ? ASHTA_TEXT_HI.animal[r.animal] : ASHTA_TEXT.animal[r.animal],
      planetReading: { text: hi ? ASHTA_PLANET_READING_HI[r.planet] : ASHTA_PLANET_READING[r.planet].text, tone: ASHTA_PLANET_READING[r.planet].tone },
      yoniReading: { text: hi ? ASHTA_YONI_READING_HI[r.yoni] : ASHTA_YONI_READING[r.yoni].text, tone: ASHTA_YONI_READING[r.yoni].tone },
    }
  })
}

export function ashtaLabels(lang: EngineLang = 'en') {
  return lang === 'hi' ? ASHTA_TEXT_HI : ASHTA_TEXT
}

// ── Sincere or insincere query ─────────────────────────────

export type SincerityId = 'moonSaturnMercury' | 'moonAspectedMeMa' | 'seventhLordAspected' | 'beneficInLagna' | 'maleficInLagna' | 'honestAspects' | 'udayaIsArudha'
export const SINCERITY_IDS: SincerityId[] = ['moonSaturnMercury', 'moonAspectedMeMa', 'seventhLordAspected', 'beneficInLagna', 'maleficInLagna', 'honestAspects', 'udayaIsArudha']

/** Which way each sign points. */
export const SINCERITY_KIND: Record<SincerityId, 'sincere' | 'insincere'> = {
  moonSaturnMercury: 'insincere',
  moonAspectedMeMa: 'insincere',
  seventhLordAspected: 'insincere',
  beneficInLagna: 'sincere',
  maleficInLagna: 'insincere',
  honestAspects: 'sincere',
  udayaIsArudha: 'sincere',
}

export const SINCERITY_RULES: Record<SincerityId, string> = {
  moonSaturnMercury: 'Moon in the Lagna, Saturn in a kendra and Mercury combust.',
  moonAspectedMeMa: 'Moon in the Lagna aspected by Mercury and Mars.',
  seventhLordAspected: 'The 7th lord aspected by Jupiter, Mercury or a planet inimical to it, with no benefic joining it.',
  beneficInLagna: 'A benefic in the Lagna shows a sincere query.',
  maleficInLagna: 'A malefic in the Lagna shows the querist is not sincere.',
  honestAspects: 'The Lagna or the 7th house aspected by the Moon, Jupiter and Mercury shows honesty.',
  udayaIsArudha: 'In sincere queries the Udaya Lagna and the Arudha Lagna fall in the same sign.',
}

export interface SincerityCheck {
  id: SincerityId
  kind: 'sincere' | 'insincere'
  rule: string
  /** null when it cannot be judged (no Arudha picked yet). */
  holds: boolean | null
  /** Planets behind the check (the aspecting or occupying ones). */
  planets: GrahaId[]
}

const SEVEN: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa']
const BENEFICS: GrahaId[] = ['Ju', 'Ve', 'Me', 'Mo']
const MALEFICS: GrahaId[] = ['Su', 'Ma', 'Sa', 'Ra', 'Ke']

export function checkSincerity(input: {
  ascRashi: Rashi
  grahas: { id: GrahaId; rashi: Rashi; isCombust?: boolean }[]
  arudhaRashi?: Rashi | null
}, lang: EngineLang = 'en'): SincerityCheck[] {
  const { ascRashi: asc } = input
  const g = (id: GrahaId) => input.grahas.find(x => x.id === id)
  const aspects = (id: GrahaId, target: Rashi) => {
    const p = g(id)
    return !!p && hasParasharaAspect(p.rashi, id, target)
  }
  const inSign = (r: Rashi, pool: GrahaId[]) => pool.filter(id => g(id)?.rashi === r)
  const moonInLagna = g('Mo')?.rashi === asc
  const seventh = nth(asc, 7)

  const out: Record<SincerityId, { holds: boolean | null; planets: GrahaId[] }> = {} as never

  // 1. Moon in Lagna, Saturn in a kendra, Mercury combust
  const sa = g('Sa')
  const saKendra = !!sa && [1, 4, 7, 10].includes(wholeSignCount(asc, sa.rashi))
  out.moonSaturnMercury = { holds: moonInLagna && saKendra && !!g('Me')?.isCombust, planets: [] }

  // 2. Moon in Lagna aspected by Mercury and Mars
  out.moonAspectedMeMa = { holds: moonInLagna && aspects('Me', asc) && aspects('Ma', asc), planets: (['Me', 'Ma'] as GrahaId[]).filter(id => aspects(id, asc)) }

  // 3. 7th lord aspected by Jupiter, Mercury or an enemy, with no benefic joining it
  const l7 = signLord(seventh)
  const l7p = g(l7)
  if (l7p) {
    const by = SEVEN.filter(id => id !== l7 && (id === 'Ju' || id === 'Me' || naturalRelationship(l7, id) === 'enemy') && aspects(id, l7p.rashi))
    const joined = inSign(l7p.rashi, BENEFICS).filter(id => id !== l7)
    out.seventhLordAspected = { holds: by.length > 0 && joined.length === 0, planets: by }
  } else out.seventhLordAspected = { holds: false, planets: [] }

  // 4–5. Benefic / malefic in the Lagna
  const ben = inSign(asc, BENEFICS)
  const mal = inSign(asc, MALEFICS)
  out.beneficInLagna = { holds: ben.length > 0, planets: ben }
  out.maleficInLagna = { holds: mal.length > 0, planets: mal }

  // 6. Moon, Jupiter and Mercury aspecting the Lagna or the 7th
  const honest = (['Mo', 'Ju', 'Me'] as GrahaId[]).filter(id => aspects(id, asc) || aspects(id, seventh))
  out.honestAspects = { holds: honest.length === 3, planets: honest }

  // 7. Udaya Lagna = Arudha Lagna
  out.udayaIsArudha = { holds: input.arudhaRashi ? input.arudhaRashi === asc : null, planets: [] }

  return SINCERITY_IDS.map(id => ({
    id,
    kind: SINCERITY_KIND[id],
    rule: lang === 'hi' ? SINCERITY_HI[id] : SINCERITY_RULES[id],
    ...out[id],
  }))
}

// ── Reference notes from the chapter ───────────────────────

export interface ReferenceSection {
  id: string
  title: string
  points: string[]
  /** Two-column table (left, right). */
  table?: [string, string][]
}

export const ARUDHA_REFERENCE: ReferenceSection[] = [
  {
    id: 'why',
    title: 'Why prashna',
    points: [
      'Birth times are often missing or doubtful (first cry, head appearing, cord cut, first touch of the ground), and rectification is neither effective nor popular. Prashna works without them, and in urgent cases when there is no time to cast or find the birth chart.',
      'Prashna is the sixth skandha of jyotisha: ganita, samhita, hora, shakun (omens), muhurat and prashna. No skandha stands alone.',
      'Its scope is the near past and the near future, up to about one year.',
      'Some questions are best answered by prashna alone: recovery of stolen property and the thief\'s appearance; a missing person alive or dead, captive or free; whether a medicine or diagnosis is right; marriage to the person of one\'s choice; pregnancy and the sex of the child.',
    ],
  },
  {
    id: 'birthChart',
    title: 'Birth chart and prashna chart',
    points: [
      'An event promised in the birth chart and repeated in the prashna chart is sure to happen; the reverse may not hold. Like a divisional chart, the prashna chart supplements the birth chart and never replaces it.',
      'Good dasha in the birth chart with a bad period in the prashna chart: evil karmas of this life predominate. Bad dasha with a good prashna period: good karmas of this life predominate. Good or bad in both: the dridha karmas of the past birth.',
      'When the birth chart is available, read it alongside the prashna chart. When it is not, the prashna chart can be read as the birth chart too.',
      'In sincere queries the prashna Lagna often coincides with the Lagna or Moon sign of the birth chart.',
    ],
  },
  {
    id: 'approach',
    title: 'How to approach the astrologer',
    points: [
      'Come with an earnest wish to ease a present anxiety, truthfully and sincerely, never to test or mock the astrologer.',
      'Preferably in the morning, with fruits or flowers as an offering, facing or standing to the east with folded hands, and ask one question: the foremost anxiety of that moment.',
      'The offering keeps the karmic debt of the astrologer\'s effort from falling on the querist; one who comes empty-handed goes back empty-handed.',
      'A query asked casually, without respect or in abusive language, need not be answered; ask the person to come another time.',
      'Self prashna is useful as long as it is truthful and sincere; do not put it off because of an unfavourable tithi or nakshatra.',
    ],
  },
  {
    id: 'conduct',
    title: 'Conducting the prashna',
    points: [
      'In the morning the astrologer propitiates the nine planets, offers obeisance, faces east and lights an oil lamp before the querist arrives.',
      'The lamp: the vessel is the querist\'s home, the oil the body, the wick the soul and the flame the longevity.',
      'A bright, steady, straight flame of pleasant colour shows prosperity; a dim, flickering or divided flame shows misery and illness. A flame that goes out with oil left, or will not light, is evil for longevity.',
      'Flies in the oil: worms in the body. Two wicks tied together: breathing trouble. Hair or dirt in the wick: troubles from evil karmas or spirits. Oil spilling from the brim: abundant water (in questions about water).',
      'Today, flickering or failing electric light during the prashna is read the same way: any unusual event during the prashna acts as an omen (nimitta).',
    ],
    table: [
      ['Flame moving anti-clockwise', 'Troubles'],
      ['Flame towards the south-east', 'Accident by fire'],
      ['Flame towards the south', 'Death'],
      ['Flame towards the south-west', 'Mental illness (unmad)'],
    ],
  },
  {
    id: 'lagnas',
    title: 'Udaya, Arudha and Chatra Lagna',
    points: [
      'The Lagna is the body of the querist and the Moon the mind, where the desire is directed.',
      'Udaya Lagna (the rising sign) gives the best results when the querist comes unannounced, outside fixed consulting hours. When many people come in the same evening hours, the rising sign barely changes, so the Arudha Lagna becomes essential.',
      'The sutra is the relationship between the Udaya Lagna lord and the Arudha lord: friends give good results, enemies bad, neutral average.',
      'The Jaimini arudha (count from the Lagna to its lord, then as far again) has no role in prashna.',
      'The strongest of the Udaya, Arudha and Chatra Lagnas is said to give the best results. In practice choose between Udaya and Arudha; the use of Chatra Lagna still needs testing.',
    ],
  },
  {
    id: 'ancient',
    title: 'Ancient ways of fixing the Arudha',
    points: [
      'Direction: the side from which the querist approaches the astrologer gives the Arudha sign.',
      'Gold or touch: on a chart covered with water, sandal paste, grains, rice and flowers, the querist places a piece of gold or touches a sign. The gold is the jeeva, the materials the deha (the five elements of the body).',
      'Gold touching the materials: long life. Not touching: shorter life. Meagre materials: weak constitution, prone to infection. Soiled materials: sickness.',
      'Ashtamangala (Kerala): eight articles (lamp, gold, mirror, curd, milk, fruits, book, white cloth), a chart drawn in rice powder with a four-petalled lotus, a gold coin and 108 cowries. A child places the gold on a sign after circling the chart facing east: that sign is the Arudha.',
      'First word spoken: the planet and element of the first letter give the Arudha and the result.',
    ],
  },
  {
    id: 'astrologer',
    title: 'The astrologer',
    points: [
      'Varaha Mihira asks for deep knowledge of mathematical and predictive astrology, a religious and righteous nature, truthfulness, humility, discipline, austerity and faith in God.',
      'Jupiter joining or aspecting the 2nd house or its lord (vaak sthana) gives the gift of speech (vaak siddhi) that makes predictions come true.',
      'The classical authors withheld their names and credited guru or God: humility is the tradition of this knowledge.',
    ],
  },
]

export function arudhaReference(lang: EngineLang = 'en'): ReferenceSection[] {
  if (lang !== 'hi') return ARUDHA_REFERENCE
  return ARUDHA_REFERENCE.map(s => {
    const hi = ARUDHA_REFERENCE_HI[s.id]
    return { ...s, title: hi.title, points: hi.points, ...(s.table ? { table: hi.table } : {}) }
  })
}

export const ashtaPlanetReadingText = (g: GrahaId, lang: EngineLang = 'en') => (lang === 'hi' ? ASHTA_PLANET_READING_HI[g] : ASHTA_PLANET_READING[g]?.text)
export const ashtaYoniReadingText = (y: Yoni, lang: EngineLang = 'en') => (lang === 'hi' ? ASHTA_YONI_READING_HI[y] : ASHTA_YONI_READING[y].text)
export const elementResultText = (k: Element | 'vowel', lang: EngineLang = 'en') => (lang === 'hi' ? ELEMENT_RESULT_HI[k] : ELEMENT_RESULTS[k].text)
