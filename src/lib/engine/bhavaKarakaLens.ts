// ─────────────────────────────────────────────────────────────
//  src/lib/engine/bhavaKarakaLens.ts
//  Bhava + Karaka lens — event-level significations.
//
//  Classical method: a prediction needs TWO keys — the house (bhava)
//  that owns the life-area and the planet (karaka) that signifies the
//  specific item inside it. The sign only adds flavour (curly vs
//  straight hair), never the hard verdict. When the house AND the
//  item's karaka are both afflicted, that item is the pinpointed
//  trouble spot; a damaged house alone does not spoil every item.
//
//  Pure: no React / DB. Text in English here, Hindi in
//  ./locale/bhavaKarakaLens.hi.ts (same ids).
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import type { EngineLang } from '@/lib/engine/lang'
import { fill } from '@/lib/engine/lang'
import { hasParasharaAspect } from '@/lib/engine/aspects'
import { SIGN_LORD_BY_RASHI } from '@/lib/engine/lordshipInterpretations'
import { findGraha, gn, houseSign, wholeSignHouse } from '@/lib/engine/shrap/helpers'
import { BKL_HI } from '@/lib/engine/locale/bhavaKarakaLens.hi'

// ── Types ─────────────────────────────────────────────────────

export type BklHouse = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

export interface BhavaKarakaItem {
  id: string
  house: BklHouse
  /** Extra houses that must be read together (marriage timing = 7 + 9). */
  withHouses?: BklHouse[]
  /** Main karaka(s). Empty = judged from the house alone. */
  karakas: GrahaId[]
  /** Karakas other schools use (Nadi, regional). Shown, not scored. */
  altKarakas?: GrahaId[]
  /** No single classical karaka — read by context. */
  noFixedKaraka?: boolean
  /** Questions clients bring most often. */
  asked?: boolean
  /** Spouse: karaka depends on the native's gender. */
  spouse?: boolean
}

export type BklHouseState = 'afflicted' | 'mixed' | 'supported'
export type BklPlanetState = 'afflicted' | 'mixed' | 'strong'
export type BklVerdict = 'pinpointed' | 'houseOnly' | 'karakaOnly' | 'supported' | 'steady' | 'houseRead'

export interface BklReason { code: string; text: string }

export interface BklHouseReading {
  house: BklHouse
  rashi: Rashi
  lord: GrahaId
  state: BklHouseState
  score: number
  reasons: BklReason[]
}

export interface BklPlanetReading {
  id: GrahaId
  name: string
  house: number
  state: BklPlanetState
  score: number
  reasons: BklReason[]
}

export interface BklItemReading {
  id: string
  label: string
  note?: string
  house: BklHouse
  withHouses: BklHouse[]
  karakas: GrahaId[]
  altKarakas: GrahaId[]
  noFixedKaraka: boolean
  asked: boolean
  verdict: BklVerdict
  verdictLabel: string
  summary: string
}

export interface BklRuleCallout {
  id: 'moonMercuryJupiter' | 'gemGate'
  title: string
  active: boolean
  text: string
  /** Gemstones to avoid (planet in 6/8/12 from the Moon). */
  avoidGems?: { planet: GrahaId; gem: string }[]
  avoidLabel?: string
}

export interface BhavaKarakaLensReading {
  method: string[]
  houses: Record<BklHouse, BklHouseReading>
  planets: Partial<Record<GrahaId, BklPlanetReading>>
  items: BklItemReading[]
  rules: BklRuleCallout[]
  counts: Record<BklVerdict, number>
  disclaimer: string
}

// ── Teaching data ─────────────────────────────────────────────

export const BHAVA_KARAKA_ITEMS: readonly BhavaKarakaItem[] = [
  // 1st — Tanu
  { id: 'body', house: 1, karakas: ['Su'], asked: true },
  { id: 'head', house: 1, karakas: ['Su'] },
  { id: 'hair', house: 1, karakas: ['Sa'] },
  { id: 'birthplace', house: 1, karakas: [] },
  // 2nd — Dhana
  { id: 'wealth', house: 2, karakas: ['Ju'], altKarakas: ['Ve'], asked: true },
  { id: 'food', house: 2, karakas: ['Mo'] },
  { id: 'face', house: 2, karakas: ['Mo'] },
  { id: 'speech', house: 2, karakas: ['Me'] },
  { id: 'wiseSpeech', house: 2, karakas: ['Ju'] },
  { id: 'smell', house: 2, karakas: ['Me'] },
  { id: 'jewellery', house: 2, karakas: ['Ve'], altKarakas: ['Mo'], asked: true },
  { id: 'teeth', house: 2, karakas: ['Sa'] },
  // 3rd — Sahaja
  { id: 'courage', house: 3, karakas: ['Ma'], asked: true },
  { id: 'youngerSiblings', house: 3, karakas: ['Ma'] },
  { id: 'handWork', house: 3, karakas: ['Ma'] },
  { id: 'writing', house: 3, karakas: ['Me'] },
  { id: 'arts', house: 3, karakas: ['Ve'] },
  { id: 'shortTravel', house: 3, karakas: ['Mo'], altKarakas: ['Ra'] },
  { id: 'documents', house: 3, karakas: [], asked: true },
  { id: 'relocation', house: 3, karakas: [] },
  // 4th — Sukha
  { id: 'mother', house: 4, karakas: ['Mo'], asked: true },
  { id: 'mind', house: 4, karakas: ['Mo'] },
  { id: 'happiness', house: 4, karakas: ['Mo'] },
  { id: 'heart', house: 4, karakas: ['Su'] },
  { id: 'land', house: 4, karakas: ['Ma'], asked: true },
  { id: 'flat', house: 4, karakas: ['Ve'], altKarakas: ['Ke'], asked: true },
  { id: 'commercial', house: 4, karakas: ['Me'] },
  { id: 'construction', house: 4, karakas: ['Sa'] },
  { id: 'vehicles', house: 4, karakas: ['Ve'], altKarakas: ['Ma'], asked: true },
  { id: 'schooling', house: 4, karakas: ['Me'] },
  { id: 'knowledge', house: 4, karakas: ['Ju'] },
  { id: 'agriculture', house: 4, karakas: ['Sa'] },
  // 5th — Putra
  { id: 'children', house: 5, karakas: ['Ju'], asked: true },
  { id: 'intelligence', house: 5, karakas: ['Me'] },
  { id: 'creativity', house: 5, karakas: ['Ve'] },
  { id: 'purvaPunya', house: 5, karakas: [] },
  { id: 'paternalGrandfather', house: 5, karakas: ['Ra'] },
  // 6th — Ripu / Roga
  { id: 'disease', house: 6, karakas: ['Sa'], altKarakas: ['Ma'], asked: true },
  { id: 'job', house: 6, withHouses: [10], karakas: ['Sa'], asked: true },
  { id: 'enemies', house: 6, karakas: ['Ma'] },
  { id: 'litigation', house: 6, karakas: ['Ma'], altKarakas: ['Me'] },
  { id: 'debt', house: 6, karakas: ['Ma'] },
  { id: 'routine', house: 6, karakas: ['Su', 'Sa'] },
  // 7th — Kalatra
  { id: 'marriageTiming', house: 7, withHouses: [9], karakas: ['Ve', 'Ju'], asked: true },
  { id: 'marriedLife', house: 7, karakas: ['Ve'], asked: true },
  { id: 'spouse', house: 7, karakas: ['Ve'], spouse: true, asked: true },
  { id: 'businessPartner', house: 7, karakas: ['Me'] },
  // 8th — Ayu / Randhra
  { id: 'inheritance', house: 8, karakas: ['Ke', 'Ju', 'Su'], altKarakas: ['Ve'], noFixedKaraka: true },
  { id: 'suddenMoney', house: 8, karakas: [] },
  { id: 'research', house: 8, karakas: [] },
  { id: 'securedLoans', house: 8, karakas: [] },
  // 9th — Dharma / Bhagya
  { id: 'fortune', house: 9, karakas: ['Ju'], asked: true },
  { id: 'father', house: 9, karakas: ['Su', 'Ju'] },
  { id: 'higherEducation', house: 9, karakas: ['Ju'], asked: true },
  { id: 'spirituality', house: 9, karakas: ['Ju'] },
  { id: 'pilgrimage', house: 9, karakas: ['Ju', 'Su'] },
  { id: 'longTravel', house: 9, karakas: ['Ra', 'Ju'] },
  // 10th — Karma
  { id: 'nameFame', house: 10, karakas: [], asked: true },
  // 11th — Labha
  { id: 'gains', house: 11, karakas: ['Ju'], asked: true },
  { id: 'elderSiblings', house: 11, karakas: ['Ju'] },
  { id: 'network', house: 11, karakas: [] },
  // 12th — Vyaya
  { id: 'sleep', house: 12, karakas: ['Mo'], asked: true },
  { id: 'expenses', house: 12, karakas: [] },
  { id: 'foreign', house: 12, karakas: [], asked: true },
  { id: 'isolation', house: 12, karakas: ['Ke', 'Sa'] },
  { id: 'moksha', house: 12, karakas: ['Ke'] },
  { id: 'hospital', house: 12, karakas: ['Ma', 'Sa', 'Mo', 'Ju'], altKarakas: ['Su', 'Ra'], noFixedKaraka: true },
  { id: 'maternalGrandfather', house: 12, karakas: ['Ke'] },
]

export const BKL_EN = {
  labels: {
    body: 'Body & build', head: 'Head', hair: 'Hair', birthplace: 'Birthplace & surroundings',
    wealth: 'Saved wealth', food: 'Food habits', face: 'Face & glow', speech: 'Everyday speech',
    wiseSpeech: 'Speech of wisdom', smell: 'Sense of smell', jewellery: 'Jewellery & gems', teeth: 'Teeth',
    courage: 'Courage to start', youngerSiblings: 'Younger siblings', handWork: 'Work with the hands',
    writing: 'Writing & messages', arts: 'Music, dance & sport', shortTravel: 'Short trips',
    documents: 'Documents & visa', relocation: 'Change of place',
    mother: 'Mother', mind: 'Mind', happiness: 'Inner happiness', heart: 'Heart', land: 'Land & plots',
    flat: 'Flat / ready home', commercial: 'Commercial property', construction: 'Construction',
    vehicles: 'Vehicles', schooling: 'Schooling', knowledge: 'Knowledge', agriculture: 'Agriculture',
    children: 'Children', intelligence: 'Intelligence', creativity: 'Artistic creativity',
    purvaPunya: 'Past-life merit', paternalGrandfather: 'Paternal grandfather',
    disease: 'Illness', job: 'Job & service', enemies: 'Enemies & rivals', litigation: 'Court cases',
    debt: 'Debts', routine: 'Daily routine',
    marriageTiming: 'When marriage happens', marriedLife: 'Married life', spouse: 'Spouse’s nature',
    businessPartner: 'Business partnership',
    inheritance: 'Inheritance', suddenMoney: 'Sudden money', research: 'Research & hidden knowledge',
    securedLoans: 'Secured loans',
    fortune: 'Fortune', father: 'Father', higherEducation: 'Higher education', spirituality: 'Spiritual practice',
    pilgrimage: 'Pilgrimage & temples', longTravel: 'Long journeys',
    nameFame: 'Name, fame & status',
    gains: 'Gains & income', elderSiblings: 'Elder siblings', network: 'Friends & network',
    sleep: 'Sleep', expenses: 'Expenses', foreign: 'Foreign lands', isolation: 'Isolation',
    moksha: 'Liberation (moksha)', hospital: 'Hospital stays', maternalGrandfather: 'Maternal grandfather',
  } as Record<string, string>,
  notes: {
    wealth: 'The 2nd is wealth that stays (savings, gold, assets), not monthly income. Nadi reads Venus here.',
    wiseSpeech: 'Mercury is ordinary talk; Jupiter is counsel and advice that carries wisdom.',
    jewellery: 'Whether gold, silver or a gem suits you is a 2nd-house + Venus question, not Sun or Moon alone.',
    hair: 'The sign shows texture (curly, straight, soft); house + Saturn show health and greying.',
    marriageTiming: 'Timing needs the 9th too: ceremony, legality and social acceptance live there.',
    job: 'The 6th is the job itself; the 10th is the status it brings.',
    spouse: 'Venus for a man’s chart; Mars (Jupiter in many Vedic schools) for a woman’s chart.',
    inheritance: 'No fixed karaka in the classics; Ketu, Jupiter and the Sun are used, Venus also works.',
    hospital: 'No single karaka: Mars (surgery), Saturn (long stays), Moon (medicine), Jupiter (healing).',
    sleep: 'Sleep, dreams and the subconscious are Moon + 12th. Meditation is the classical remedy.',
    paternalGrandfather: '9th from the 9th (father) = 5th house.',
    maternalGrandfather: '9th from the 4th (mother) = 12th house.',
    land: 'Mars is Bhumi-putra, born of the Earth.',
    higherEducation: 'Graduation and above. Research beyond it is the 8th.',
  } as Record<string, string>,
  verdict: {
    pinpointed: 'Pinpointed', houseOnly: 'House under strain', karakaOnly: 'Karaka under strain',
    supported: 'Well supported', steady: 'Steady', houseRead: 'Read from the house',
  } as Record<BklVerdict, string>,
  summary: {
    pinpointed: 'House {h} and {k} are both afflicted — this is the item where trouble shows.',
    houseOnly: 'House {h} is strained but {k} holds up, so this item is protected.',
    karakaOnly: '{k} is strained but house {h} holds, so the item bends rather than breaks.',
    supported: 'House {h} and {k} are both in good shape.',
    steady: 'Neither house {h} nor {k} shows a strong push either way.',
    houseRead: 'No single karaka — judge from house {h} (state: {s}) and the context.',
  } as Record<BklVerdict, string>,
  houseState: { afflicted: 'afflicted', mixed: 'mixed', supported: 'supported' } as Record<BklHouseState, string>,
  reasons: {
    maleficIn: '{p} occupies the house',
    maleficAspect: '{p} aspects the house',
    papaKartari: 'Hemmed by malefics on both sides (papa kartari)',
    shubhaKartari: 'Hemmed by benefics on both sides (shubha kartari)',
    lordWeak: 'House lord {p} is {d}',
    lordDusthana: 'House lord {p} sits in the {n}th (dusthana)',
    lordStrong: 'House lord {p} is {d}',
    beneficIn: '{p} occupies the house',
    jupiterAspect: 'Jupiter aspects the house',
    debilitated: 'Debilitated',
    enemySign: 'In an enemy sign',
    combust: 'Combust (too close to the Sun)',
    nodeSaturn: 'Joined or aspected by {p}',
    dusthana: 'Placed in the {n}th (dusthana)',
    dignified: 'Dignity: {d}',
    kendraTrikona: 'Placed in the {n}th (kendra / trikona)',
    retro: 'Retrograde',
  } as Record<string, string>,
  dignity: {
    exalted: 'exalted', moolatrikona: 'in moolatrikona', own: 'in its own sign', debilitated: 'debilitated',
    enemy: 'in an enemy sign', great_enemy: 'in a great-enemy sign', combust: 'combust',
  } as Record<string, string>,
  method: [
    'Step 1 — pick the house that owns the life-area.',
    'Step 2 — pick the karaka planet for the exact item inside it.',
    'Step 3 — check whether the house is afflicted (malefics, papa kartari, a weak lord).',
    'Step 4 — check whether the karaka is afflicted (debility, combustion, nodes / Saturn, dusthana).',
    'Both afflicted → that item is where the problem lands. One alone → it bends, it does not break.',
    'The sign adds flavour and texture only; never judge an event from a single parameter.',
  ],
  rules: {
    moonMercuryJupiterTitle: 'Moon + Mercury feed Jupiter',
    moonMercuryJupiterOn:
      'Moon and Mercury are both under strain here. Food and speech are the 2nd-house pair, and when they weaken, Jupiter’s results (wealth, wisdom) weaken too, however well Jupiter is placed. Disciplined food and speech is the remedy that lets money stay.',
    moonMercuryJupiterOff:
      'Moon and Mercury are not both under strain, so Jupiter is not dragged down through the 2nd-house food–speech channel.',
    gemGateTitle: 'Gem suitability gate',
    gemGateOpen:
      'The 2nd house and Venus/Moon support adornment, so a gemstone remedy can be considered. Choose among planets that are not in the 6th, 8th or 12th from the Moon.',
    gemGateClosed:
      'The 2nd house with Venus/Moon does not support adornment here. Gems are a specialised remedy; prefer mantra, charity, fasting or puja instead.',
    gemAvoid: 'From the Moon, these sit in the 6th, 8th or 12th — avoid their gems:',
  },
  disclaimer:
    'Teaching lens built on whole-sign houses and simple affliction checks. It points where to look; a full reading weighs dashas, vargas and strength.',
}

const GEM_EN: Record<string, string> = {
  Su: 'Ruby', Mo: 'Pearl', Ma: 'Red coral', Me: 'Emerald', Ju: 'Yellow sapphire',
  Ve: 'Diamond', Sa: 'Blue sapphire', Ra: 'Hessonite', Ke: 'Cat’s eye',
}

// ── Helpers ───────────────────────────────────────────────────

const CLASSICAL: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']
const NATURAL_MALEFICS: GrahaId[] = ['Sa', 'Ma', 'Ra', 'Ke', 'Su']
const NATURAL_BENEFICS: GrahaId[] = ['Ju', 'Ve', 'Me', 'Mo']
const DUSTHANA = [6, 8, 12]
const GOOD_HOUSES = [1, 4, 5, 7, 9, 10]
const STRONG_DIGNITY = ['exalted', 'moolatrikona', 'own']
const HOUSES: BklHouse[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

function txt(lang: EngineLang) {
  return lang === 'hi' ? BKL_HI : BKL_EN
}

function reason(lang: EngineLang, code: string, slots: Record<string, string | number> = {}): BklReason {
  const tpl = txt(lang).reasons[code] ?? BKL_EN.reasons[code] ?? code
  return { code, text: fill(tpl, slots) }
}

function dignityText(lang: EngineLang, d: string): string {
  return txt(lang).dignity[d] ?? BKL_EN.dignity[d] ?? d
}

function isStrongPlaced(g: GrahaData): boolean {
  return STRONG_DIGNITY.includes(g.dignity)
}

// ── House reading ─────────────────────────────────────────────

export function readHouse(chart: ChartOutput, house: BklHouse, lang: EngineLang = 'en'): BklHouseReading {
  const asc = chart.lagnas.ascRashi
  const rashi = houseSign(asc, house)
  const lord = SIGN_LORD_BY_RASHI[rashi]
  const grahas = (chart.grahas ?? []).filter((g) => CLASSICAL.includes(g.id))
  const reasons: BklReason[] = []
  let bad = 0
  let good = 0

  const inHouse = (g: GrahaData, h: number) => wholeSignHouse(g.rashi, asc) === h

  for (const g of grahas) {
    const name = gn(g.id, lang)
    const occupies = inHouse(g, house)
    if (NATURAL_MALEFICS.includes(g.id)) {
      // A malefic in its own / exalted sign protects rather than harms.
      if (occupies && !isStrongPlaced(g)) {
        bad += g.id === 'Su' ? 0.5 : 1
        reasons.push(reason(lang, 'maleficIn', { p: name }))
      } else if (!occupies && (g.id === 'Sa' || g.id === 'Ma') && hasParasharaAspect(g.rashi, g.id, rashi)) {
        bad += 0.75
        reasons.push(reason(lang, 'maleficAspect', { p: name }))
      }
    } else if (NATURAL_BENEFICS.includes(g.id) && occupies) {
      good += g.id === 'Ju' || g.id === 'Ve' ? 1 : 0.5
      reasons.push(reason(lang, 'beneficIn', { p: name }))
    }
  }

  const ju = findGraha(chart, 'Ju')
  if (ju && !inHouse(ju, house) && hasParasharaAspect(ju.rashi, 'Ju', rashi)) {
    good += 1
    reasons.push(reason(lang, 'jupiterAspect'))
  }

  // Kartari: what sits in the houses on either side.
  const prev = house === 1 ? 12 : house - 1
  const next = house === 12 ? 1 : house + 1
  const side = (h: number) => grahas.filter((g) => inHouse(g, h))
  const a = side(prev)
  const b = side(next)
  if (a.length && b.length) {
    if ([...a, ...b].every((g) => NATURAL_MALEFICS.includes(g.id))) {
      bad += 1
      reasons.push(reason(lang, 'papaKartari'))
    } else if ([...a, ...b].every((g) => NATURAL_BENEFICS.includes(g.id))) {
      good += 1
      reasons.push(reason(lang, 'shubhaKartari'))
    }
  }

  // The lord.
  const L = findGraha(chart, lord)
  if (L) {
    const lname = gn(lord, lang)
    const lh = wholeSignHouse(L.rashi, asc)
    if (L.dignity === 'debilitated' || L.dignity === 'enemy' || L.dignity === 'great_enemy') {
      bad += L.dignity === 'debilitated' ? 1 : 0.5
      reasons.push(reason(lang, 'lordWeak', { p: lname, d: dignityText(lang, L.dignity) }))
    } else if (STRONG_DIGNITY.includes(L.dignity)) {
      good += 1
      reasons.push(reason(lang, 'lordStrong', { p: lname, d: dignityText(lang, L.dignity) }))
    }
    if (L.isCombust && lord !== 'Su') {
      bad += 0.5
      reasons.push(reason(lang, 'lordWeak', { p: lname, d: dignityText(lang, 'combust') }))
    }
    // A dusthana lord in a dusthana is viparita, not damage.
    if (DUSTHANA.includes(lh) && !DUSTHANA.includes(house)) {
      bad += 0.75
      reasons.push(reason(lang, 'lordDusthana', { p: lname, n: lh }))
    }
  }

  const score = Math.round((bad - good) * 100) / 100
  const state: BklHouseState = score >= 1.5 ? 'afflicted' : score <= -0.5 ? 'supported' : 'mixed'
  return { house, rashi, lord, state, score, reasons }
}

// ── Planet (karaka) reading ───────────────────────────────────

export function readKaraka(chart: ChartOutput, id: GrahaId, lang: EngineLang = 'en'): BklPlanetReading | null {
  const g = findGraha(chart, id)
  if (!g) return null
  const asc = chart.lagnas.ascRashi
  const h = wholeSignHouse(g.rashi, asc)
  const reasons: BklReason[] = []
  let bad = 0
  let good = 0

  if (g.dignity === 'debilitated') { bad += 2; reasons.push(reason(lang, 'debilitated')) }
  else if (g.dignity === 'enemy' || g.dignity === 'great_enemy') { bad += 1; reasons.push(reason(lang, 'enemySign')) }
  else if (STRONG_DIGNITY.includes(g.dignity)) { good += 1.5; reasons.push(reason(lang, 'dignified', { d: dignityText(lang, g.dignity) })) }

  if (g.isCombust && id !== 'Su' && id !== 'Ra' && id !== 'Ke') { bad += 1; reasons.push(reason(lang, 'combust')) }

  // Rahu / Ketu (conjunction) and Saturn (conjunction or aspect).
  const hitters: GrahaId[] = []
  for (const m of ['Ra', 'Ke', 'Sa'] as GrahaId[]) {
    if (m === id) continue
    if ((id === 'Ra' && m === 'Ke') || (id === 'Ke' && m === 'Ra')) continue
    const mg = findGraha(chart, m)
    if (!mg) continue
    const conj = mg.rashi === g.rashi
    const asp = m === 'Sa' && hasParasharaAspect(mg.rashi, 'Sa', g.rashi)
    if (conj || asp) hitters.push(m)
  }
  if (hitters.length) {
    bad += Math.min(hitters.length, 2) * 0.75
    reasons.push(reason(lang, 'nodeSaturn', { p: hitters.map((x) => gn(x, lang)).join(', ') }))
  }

  if (DUSTHANA.includes(h)) { bad += 1; reasons.push(reason(lang, 'dusthana', { n: h })) }
  else if (GOOD_HOUSES.includes(h)) { good += 0.5; reasons.push(reason(lang, 'kendraTrikona', { n: h })) }

  if (g.isRetro && id !== 'Ra' && id !== 'Ke') reasons.push(reason(lang, 'retro'))

  const score = Math.round((bad - good) * 100) / 100
  const state: BklPlanetState = score >= 1.5 ? 'afflicted' : score <= -1 ? 'strong' : 'mixed'
  return { id, name: gn(id, lang), house: h, state, score, reasons }
}

// ── Item verdict ──────────────────────────────────────────────

/** Spouse karaka by gender: Venus for male charts, Mars for female (Jupiter as alternative). */
export function spouseKarakas(chart: ChartOutput): { karakas: GrahaId[]; alt: GrahaId[] } {
  if (chart.meta?.gender === 'female') return { karakas: ['Ma'], alt: ['Ju'] }
  return { karakas: ['Ve'], alt: [] }
}

function combineHouse(states: BklHouseState[]): BklHouseState {
  if (states.includes('afflicted')) return 'afflicted'
  if (states.every((s) => s === 'supported')) return 'supported'
  return 'mixed'
}

function combineKaraka(states: BklPlanetState[], noFixed = false): BklPlanetState {
  // No fixed karaka (context-read): only a majority of strained karakas counts.
  if (noFixed) {
    const bad = states.filter((s) => s === 'afflicted').length
    if (bad * 2 > states.length) return 'afflicted'
    if (states.filter((s) => s === 'strong').length * 2 > states.length) return 'strong'
    return 'mixed'
  }
  // Multi-karaka items: the thread breaks at its weakest strand.
  if (states.includes('afflicted')) return 'afflicted'
  if (states.length && states.every((s) => s === 'strong')) return 'strong'
  if (states.includes('strong')) return 'strong'
  return 'mixed'
}

export function verdictFor(house: BklHouseState, karaka: BklPlanetState | null): BklVerdict {
  if (karaka === null) return 'houseRead'
  if (house === 'afflicted' && karaka === 'afflicted') return 'pinpointed'
  if (house === 'afflicted') return 'houseOnly'
  if (karaka === 'afflicted') return 'karakaOnly'
  if (house === 'supported' || karaka === 'strong') return 'supported'
  return 'steady'
}

// ── Main ──────────────────────────────────────────────────────

export function buildBhavaKarakaLens(chart: ChartOutput, lang: EngineLang = 'en'): BhavaKarakaLensReading | null {
  if (!chart?.lagnas?.ascRashi || !chart.grahas?.length) return null
  const T = txt(lang)

  const houses = {} as Record<BklHouse, BklHouseReading>
  for (const h of HOUSES) houses[h] = readHouse(chart, h, lang)

  const planets: Partial<Record<GrahaId, BklPlanetReading>> = {}
  for (const id of CLASSICAL) {
    const r = readKaraka(chart, id, lang)
    if (r) planets[id] = r
  }

  const counts: Record<BklVerdict, number> = { pinpointed: 0, houseOnly: 0, karakaOnly: 0, supported: 0, steady: 0, houseRead: 0 }
  const spouse = spouseKarakas(chart)

  const items: BklItemReading[] = BHAVA_KARAKA_ITEMS.map((it) => {
    const karakas = it.spouse ? spouse.karakas : it.karakas
    const altKarakas = it.spouse ? spouse.alt : (it.altKarakas ?? [])
    const withHouses = it.withHouses ?? []
    const hState = combineHouse([it.house, ...withHouses].map((h) => houses[h].state))
    const kStates = karakas.map((k) => planets[k]?.state).filter(Boolean) as BklPlanetState[]
    const kState = kStates.length ? combineKaraka(kStates, !!it.noFixedKaraka) : null
    const verdict = verdictFor(hState, kState)
    counts[verdict]++
    const hLabel = [it.house, ...withHouses].join(' + ')
    const kLabel = karakas.map((k) => gn(k, lang)).join(' / ')
    return {
      id: it.id,
      label: T.labels[it.id] ?? BKL_EN.labels[it.id] ?? it.id,
      note: T.notes[it.id] ?? undefined,
      house: it.house,
      withHouses,
      karakas,
      altKarakas,
      noFixedKaraka: !!it.noFixedKaraka,
      asked: !!it.asked,
      verdict,
      verdictLabel: T.verdict[verdict],
      summary: fill(T.summary[verdict], { h: hLabel, k: kLabel, s: T.houseState[hState] }),
    }
  })

  // Rule: weak Moon + Mercury drags Jupiter.
  const moMe = planets.Mo?.state === 'afflicted' && planets.Me?.state === 'afflicted'
  const rules: BklRuleCallout[] = [
    {
      id: 'moonMercuryJupiter',
      title: T.rules.moonMercuryJupiterTitle,
      active: moMe,
      text: moMe ? T.rules.moonMercuryJupiterOn : T.rules.moonMercuryJupiterOff,
    },
  ]

  // Rule: gem gate (2nd house + Venus/Moon), then exclude 6/8/12 from the Moon.
  const adorn = [planets.Ve?.state, planets.Mo?.state]
  const gateOpen = houses[2].state !== 'afflicted' && adorn.some((s) => s && s !== 'afflicted')
  const moon = findGraha(chart, 'Mo')
  const avoidGems: { planet: GrahaId; gem: string }[] = []
  if (moon) {
    for (const id of CLASSICAL) {
      if (id === 'Mo') continue
      const g = findGraha(chart, id)
      if (!g) continue
      const fromMoon = wholeSignHouse(g.rashi, moon.rashi)
      if (DUSTHANA.includes(fromMoon)) {
        avoidGems.push({ planet: id, gem: (lang === 'hi' ? BKL_HI.gems[id] : GEM_EN[id]) ?? GEM_EN[id] })
      }
    }
  }
  rules.push({
    id: 'gemGate',
    title: T.rules.gemGateTitle,
    active: gateOpen,
    text: gateOpen ? T.rules.gemGateOpen : T.rules.gemGateClosed,
    avoidGems,
    avoidLabel: T.rules.gemAvoid,
  })

  return { method: [...T.method], houses, planets, items, rules, counts, disclaimer: T.disclaimer }
}

/** Labels for the UI chrome (filters, headings) — keeps the panel namespace-free. */
export function bklUiText(lang: EngineLang = 'en') {
  return lang === 'hi' ? BKL_HI.ui : BKL_UI_EN
}

export const BKL_UI_EN = {
  title: 'House + Karaka Lens',
  subtitle: 'Every event needs two keys: the house that owns it and the planet that signifies it.',
  methodTitle: 'How the lens reads',
  filterAsked: 'Client questions',
  filterAll: 'All items',
  filterFlagged: 'Flagged only',
  house: 'House {n}',
  karaka: 'Karaka',
  alt: 'Other schools',
  houseOnly: 'house alone',
  noFixed: 'no fixed karaka',
  whyHouse: 'House {n} check',
  whyKaraka: '{p} check',
  stateAfflicted: 'afflicted',
  stateMixed: 'mixed',
  stateSupported: 'supported',
  stateStrong: 'strong',
  countPinpointed: 'pinpointed',
  countSupported: 'well supported',
  empty: 'Nothing matches this filter.',
  rulesTitle: 'Rules from the classics',
  sharpTitle: 'Sharper reading',
  sharpHint: 'Open an item to see why the house and karaka were judged this way.',
}

