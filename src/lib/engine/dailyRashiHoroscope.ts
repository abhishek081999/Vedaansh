// ─────────────────────────────────────────────────────────────
//  src/lib/engine/dailyRashiHoroscope.ts
//  General daily horoscope for each Moon sign (Janma Rashi) —
//  no birth chart needed. Pure: reads a DailyHoroscopeSky.
//  Method: Parashari gochara from the Moon sign (favourable
//  houses + Vedha, see gocharRules.ts), with Chandra gochara
//  weighted as the day's driver and slow grahas as background.
//  Source: BPHS Gochara-phala / Phaladeepika ch. 26.
// ─────────────────────────────────────────────────────────────

import type { Rashi } from '@/types/astrology'
import { RASHI_NAMES, RASHI_SANSKRIT } from '@/types/astrology'
import {
  evaluateGochar,
  houseFrom,
  type GocharPlanet,
  type GocharStatus,
} from '@/lib/engine/gocharRules'
import type { DailyHoroscopeSky } from '@/lib/engine/dailyHoroscopeSky'
import { fill, gName, pick, rName, type EngineLang } from '@/lib/engine/divisionalLang'
import {
  DR_AREA_LABELS_HI,
  DR_AREA_TEXT_HI,
  DR_HOUSE_MATTERS_HI,
  DR_MOON_KARYA_HI,
  DR_MOON_THEMES_HI,
  DR_MOON_VARJYA_HI,
  DR_ORD_HI,
  DR_PLANET_COLOR_HI,
  DR_PLANET_DIRECTION_HI,
  DR_PLANET_KARYA_HI,
  DR_PLANET_ROLE_HI,
  DR_PLANET_VARJYA_HI,
  DR_REMEDY_ACT_HI,
  DR_TEXT_HI,
} from '@/lib/engine/locale/dailyRashiHoroscope.hi'

export type HoroscopeTone = 'excellent' | 'good' | 'mixed' | 'challenging'
export type HoroscopeAreaId = 'love' | 'career' | 'money' | 'health' | 'mind'

export interface HoroscopeArea {
  id: HoroscopeAreaId
  label: string
  /** Sanskrit name of the life area. */
  sanskrit: string
  score: number
  /** 1–5 diamonds. */
  rating: number
  tone: HoroscopeTone
  text: string
}

export interface HoroscopeTransit {
  planet: GocharPlanet
  house: number
  status: GocharStatus
  retro: boolean
  /** Planet causing Vedha, when status is 'vedha'. */
  vedhaBy?: GocharPlanet
  note: string
}

export interface HoroscopeLucky {
  /** Graha that most supports the sign today. */
  ally: GocharPlanet
  color: string
  number: number
  direction: string
  mantra: string
}

export interface RashiHoroscope {
  rashi: Rashi
  slug: string
  english: string
  sanskrit: string
  glyph: string
  /** Indian (Devanagari) sign name, e.g. मेष. */
  devanagari: string
  lord: GocharPlanet
  element: 'Fire' | 'Earth' | 'Air' | 'Water'
  score: number
  tone: HoroscopeTone
  headline: string
  summary: string
  moon: { house: number; theme: string; later: { house: number; at: string; theme: string } | null }
  areas: HoroscopeArea[]
  transits: HoroscopeTransit[]
  highlights: string[]
  cautions: string[]
  /** Slow-planet background (Saturn cycles, Jupiter year, nodes). */
  longTerm: string[]
  /** Karya — what to lean into today. */
  karya: string[]
  /** Varjya — what to go easy on today. */
  varjya: string[]
  lucky: HoroscopeLucky
  /** Shubh samay: horas of grahas favouring this sign, outside Rahu Kalam (reference-place times). */
  shubhSamay: HoroscopeWindow[]
  remedy: string
}

export interface HoroscopeWindow {
  start: string
  end: string
  lord: GocharPlanet
}

export interface DailyHoroscopeReport {
  date: string
  dayStart: string
  dayEnd: string
  moonRashi: Rashi
  /** Sidereal Moon longitude at 06:00 IST. */
  moonLongitude: number
  panchang: DailyHoroscopeSky['panchang']
  moonNakshatra: DailyHoroscopeSky['moonNakshatra']
  moonIngress: DailyHoroscopeSky['moonIngress']
  timings: Omit<DailyHoroscopeSky['timings'], 'horas'>
  signs: RashiHoroscope[]
}

// ── Reference tables ─────────────────────────────────────────

export const RASHI_SLUGS: Record<Rashi, string> = {
  1: 'aries', 2: 'taurus', 3: 'gemini', 4: 'cancer', 5: 'leo', 6: 'virgo',
  7: 'libra', 8: 'scorpio', 9: 'sagittarius', 10: 'capricorn', 11: 'aquarius', 12: 'pisces',
}

export const RASHI_GLYPHS: Record<Rashi, string> = {
  // U+FE0E forces the text (not emoji) presentation so glyphs take the theme colour.
  1: '♈︎', 2: '♉︎', 3: '♊︎', 4: '♋︎', 5: '♌︎', 6: '♍︎',
  7: '♎︎', 8: '♏︎', 9: '♐︎', 10: '♑︎', 11: '♒︎', 12: '♓︎',
}

export const RASHI_DEVANAGARI: Record<Rashi, string> = {
  1: 'मेष', 2: 'वृषभ', 3: 'मिथुन', 4: 'कर्क', 5: 'सिंह', 6: 'कन्या',
  7: 'तुला', 8: 'वृश्चिक', 9: 'धनु', 10: 'मकर', 11: 'कुम्भ', 12: 'मीन',
}

const RASHI_LORDS: Record<Rashi, GocharPlanet> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me', 7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const ELEMENTS = ['Fire', 'Earth', 'Air', 'Water'] as const

export function rashiFromSlug(slug: string): Rashi | null {
  const s = slug.toLowerCase()
  for (const [r, name] of Object.entries(RASHI_SLUGS)) {
    if (name === s || RASHI_SANSKRIT[Number(r) as Rashi].toLowerCase() === s) return Number(r) as Rashi
  }
  return null
}

const NAMES: Record<GocharPlanet, string> = {
  Su: 'Sun', Mo: 'Moon', Ma: 'Mars', Me: 'Mercury', Ju: 'Jupiter', Ve: 'Venus', Sa: 'Saturn', Ra: 'Rahu', Ke: 'Ketu',
}

const ORD = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th']

/** Life matters of each house counted from the Moon. */
export const HOUSE_MATTERS = [
  '',
  'self, mood and body',
  'family, speech and savings',
  'courage, effort and short travel',
  'home, mother and peace of mind',
  'children, ideas and romance',
  'competition, health routines and debts',
  'partners and public dealings',
  'hidden matters and sudden change',
  'luck, elders and dharma',
  'work, status and action',
  'gains, friends and wishes',
  'expenses, rest and distant places',
]

/** Chandra gochara: the Moon's house from the Janma Rashi sets the day's tone. */
const MOON_THEMES: Array<{ headline: string; text: string }> = [
  { headline: '', text: '' },
  { headline: 'Chandra in your sign — feeling at home', text: 'The Moon rises in your own sign: comfort, good food and an easy emotional flow. People respond to your mood, so lead with warmth.' },
  { headline: 'Mind on money and words', text: 'With the Moon in your 2nd, spending and speech need care. Keep family talk gentle and avoid impulse purchases.' },
  { headline: 'Bold moves land well', text: 'The Moon in your 3rd favours initiative: calls, pitches, short trips and anything that needs nerve tend to succeed.' },
  { headline: 'Turn inward, tend the home', text: 'The Moon in your 4th can make the mind restless. Ground yourself at home, rest well and avoid starting big disputes.' },
  { headline: 'Plans need patience', text: 'The Moon in your 5th can cloud judgement and slow plans. Revisit ideas before committing and keep speculation small.' },
  { headline: 'You outpace the competition', text: 'The Moon in your 6th brings victory over obstacles, relief from rivals and good energy for health routines.' },
  { headline: 'A people day', text: 'The Moon in your 7th supports partnerships, meetings and social comfort. Collaboration beats going solo.' },
  { headline: 'Chandrashtama — move carefully', text: 'The Moon transits your 8th (Chandrashtama). Avoid risky decisions, long drives and arguments; postpone launches.' },
  { headline: 'Mixed luck, steady faith', text: 'The Moon in your 9th can bring small delays or tiredness. Keep plans flexible and lean on mentors and routine prayer.' },
  { headline: 'Work gets noticed', text: 'The Moon in your 10th energises work and reputation. Deliver visibly — effort converts into recognition.' },
  { headline: 'Gains and good news', text: 'The Moon in your 11th is the brightest transit of the month: gains, wishes fulfilled and helpful friends.' },
  { headline: 'Spend wisely, rest deeply', text: 'The Moon in your 12th raises expenses and fatigue. Favour rest, charity, spiritual practice and quiet planning.' },
]

/** Daily weight of each graha's gochara — the Moon drives the day, slow grahas set the backdrop. */
const DAY_WEIGHTS: Record<GocharPlanet, number> = {
  Mo: 32, Ju: 14, Su: 10, Me: 10, Ve: 10, Ma: 9, Sa: 9, Ra: 3, Ke: 3,
}

const AREA_WEIGHTS: Record<HoroscopeAreaId, Partial<Record<GocharPlanet, number>>> = {
  love:   { Ve: 3.5, Mo: 3, Ju: 1.5, Ma: 1 },
  career: { Su: 3, Sa: 2.5, Me: 2, Mo: 2, Ju: 1.5, Ma: 1 },
  money:  { Ju: 3, Ve: 2, Me: 2, Mo: 2, Sa: 1 },
  health: { Mo: 3, Su: 2.5, Ma: 2, Sa: 1.5 },
  mind:   { Mo: 4, Me: 1.5, Ju: 1.5, Sa: 1 },
}

const AREA_LABELS: Record<HoroscopeAreaId, string> = {
  career: 'Career', love: 'Love', money: 'Money', health: 'Health', mind: 'Mind',
}

const AREA_SANSKRIT: Record<HoroscopeAreaId, string> = {
  career: 'Karma', love: 'Prema', money: 'Dhana', health: 'Arogya', mind: 'Manas',
}

/** Houses (from Moon) that speak most directly to each area — a planet here counts double. */
const AREA_HOUSES: Record<HoroscopeAreaId, number[]> = {
  career: [6, 10, 11],
  love: [5, 7, 12],
  money: [2, 11],
  health: [1, 6, 8],
  mind: [1, 4, 5],
}

const AREA_TEXT: Record<HoroscopeAreaId, Record<HoroscopeTone, string>> = {
  career: {
    excellent: 'Strong day for visible work — pitch, present and ask for what you have earned.',
    good: 'Steady progress at work; finish pending tasks and keep communication crisp.',
    mixed: 'Results come with effort. Prioritise one clear goal and avoid office politics.',
    challenging: 'Hold back on major career moves; review details and let others take the lead.',
  },
  love: {
    excellent: 'Warm, magnetic energy — a fine day for dates, gestures and honest feelings.',
    good: 'Relationships feel easy; small kindness goes a long way.',
    mixed: 'Moods may differ from your partner’s. Listen first and keep expectations light.',
    challenging: 'Sensitive day for the heart; avoid old arguments and give each other space.',
  },
  money: {
    excellent: 'Favourable for gains, collections and well-researched decisions.',
    good: 'Finances hold steady; a good time to budget or plan savings.',
    mixed: 'Income and expenses balance out. Postpone non-essential purchases.',
    challenging: 'Guard against losses and lending; no speculation today.',
  },
  health: {
    excellent: 'High vitality — good for exercise and starting healthy routines.',
    good: 'Energy is stable; regular meals and sleep keep you on track.',
    mixed: 'Pace yourself; mild fatigue or stress is possible by evening.',
    challenging: 'Low reserves — rest, hydrate and avoid overexertion or risky travel.',
  },
  mind: {
    excellent: 'Clear, buoyant mind — trust your instincts and decide.',
    good: 'Calm and focused; a good day for study and planning.',
    mixed: 'Thoughts may scatter; jot things down and take short breaks.',
    challenging: 'Restless or heavy mood — meditate, walk, and avoid big decisions.',
  },
}

/** Chandra gochara do / avoid lists by the Moon's house. */
const MOON_KARYA: string[][] = [
  [],
  ['Self-care and good meals', 'Meeting people warmly'],
  ['Budgeting and saving', 'Kind words at home'],
  ['Calls, pitches and short trips', 'Starting bold tasks'],
  ['Home chores and rest', 'Time with mother'],
  ['Reflection and study', 'Creative hobbies'],
  ['Clearing debts and backlog', 'Exercise and health routines'],
  ['Partnership talks', 'Social plans'],
  ['Research and quiet work', 'Prayer and patience'],
  ['Learning from elders', 'Charity and dharma'],
  ['Visible work and deadlines', 'Meeting seniors'],
  ['Asking for what you want', 'Networking with friends'],
  ['Rest and meditation', 'Charity and planning'],
]
const MOON_VARJYA: string[][] = [
  [],
  ['Overreacting to moods'],
  ['Impulse purchases', 'Harsh speech'],
  ['Overcommitting your energy'],
  ['Property disputes', 'Late nights'],
  ['Speculation and gambling', 'Rushed promises'],
  ['Lending money casually'],
  ['Arguments with partners'],
  ['Risky decisions and long drives', 'New launches'],
  ['Long journeys without need'],
  ['Office politics'],
  ['Overconfidence in deals'],
  ['Lavish spending', 'Neglecting sleep'],
]
const PLANET_KARYA: Partial<Record<GocharPlanet, string>> = {
  Su: 'Dealing with authority', Ma: 'Physical effort and sport', Me: 'Paperwork, writing and trade',
  Ve: 'Romance, art and comfort', Ju: 'Learning and advice',
}
const PLANET_VARJYA: Partial<Record<GocharPlanet, string>> = {
  Su: 'Ego clashes with officials', Ma: 'Anger and haste', Me: 'Signing without re-reading',
  Ve: 'Indulgence and overspending', Ju: 'Overpromising',
}

const PLANET_ROLE: Record<GocharPlanet, string> = {
  Su: 'authority and vitality',
  Mo: 'mood and daily events',
  Ma: 'drive and courage',
  Me: 'trade, talks and intellect',
  Ju: 'growth and wisdom',
  Ve: 'love, comfort and luxury',
  Sa: 'discipline and long work',
  Ra: 'ambition and the unusual',
  Ke: 'detachment and insight',
}

const PLANET_COLOR: Record<GocharPlanet, string> = {
  Su: 'Saffron', Mo: 'Pearl white', Ma: 'Coral red', Me: 'Emerald green', Ju: 'Turmeric yellow',
  Ve: 'Diamond white', Sa: 'Indigo blue', Ra: 'Smoky grey', Ke: 'Ash brown',
}
const PLANET_NUMBER: Record<GocharPlanet, number> = { Su: 1, Mo: 2, Ju: 3, Ra: 4, Me: 5, Ve: 6, Ke: 7, Sa: 8, Ma: 9 }
const PLANET_DIRECTION: Record<GocharPlanet, string> = {
  Su: 'East', Mo: 'North-west', Ma: 'South', Me: 'North', Ju: 'North-east', Ve: 'South-east', Sa: 'West', Ra: 'South-west', Ke: 'North-west',
}
const PLANET_MANTRA: Record<GocharPlanet, string> = {
  Su: 'Om Suryaya Namah', Mo: 'Om Chandraya Namah', Ma: 'Om Mangalaya Namah', Me: 'Om Budhaya Namah',
  Ju: 'Om Gurave Namah', Ve: 'Om Shukraya Namah', Sa: 'Om Shanaishcharaya Namah', Ra: 'Om Rahave Namah', Ke: 'Om Ketave Namah',
}
const REMEDY_ACT: Record<GocharPlanet, string> = {
  Su: 'offer water to the rising Sun',
  Mo: 'drink water from a silver cup and call your mother',
  Ma: 'recite Hanuman Chalisa',
  Me: 'feed green grass to a cow or donate green moong',
  Ju: 'respect teachers and donate yellow sweets',
  Ve: 'keep surroundings clean and fragrant',
  Sa: 'light a sesame-oil lamp and help a worker or elder',
  Ra: 'feed birds and avoid shortcuts',
  Ke: 'feed a dog and spend a few minutes in silence',
}

// ── Scoring ──────────────────────────────────────────────────

function statusValue(status: GocharStatus, house: number): number {
  if (status === 'favourable') return 1
  if (status === 'vedha') return 0.15
  return house === 8 || house === 12 ? -0.9 : -0.4
}

function toneOf(score: number): HoroscopeTone {
  if (score >= 72) return 'excellent'
  if (score >= 57) return 'good'
  if (score >= 42) return 'mixed'
  return 'challenging'
}

/** Score → 1–5 diamonds. */
export function ratingOf(score: number): number {
  return Math.max(1, Math.min(5, Math.round(score / 20)))
}

function clampScore(raw: number): number {
  return Math.max(8, Math.min(96, Math.round(raw)))
}

function transitNote(planet: GocharPlanet, house: number, status: GocharStatus, vedhaBy: GocharPlanet | undefined, lang: EngineLang): string {
  if (lang === 'en') {
    const matters = HOUSE_MATTERS[house]
    if (status === 'favourable') return `${NAMES[planet]} in your ${ORD[house]} supports ${matters}.`
    if (status === 'vedha') return `${NAMES[planet]} in your ${ORD[house]} would help ${matters}, but ${NAMES[vedhaBy!]} blocks it (vedha).`
    return `${NAMES[planet]} in your ${ORD[house]} asks for care around ${matters}.`
  }
  const matters = DR_HOUSE_MATTERS_HI[house]
  const ord = DR_ORD_HI[house]
  const p = gName(planet, lang)
  if (status === 'favourable') return fill(DR_TEXT_HI.transitFavourable, { planet: p, ord, matters })
  if (status === 'vedha') return fill(DR_TEXT_HI.transitVedha, { planet: p, ord, matters, blocker: gName(vedhaBy!, lang) })
  return fill(DR_TEXT_HI.transitUnfavourable, { planet: p, ord, matters })
}

function longTermNotes(houses: Record<GocharPlanet, number>, lang: EngineLang): string[] {
  const out: string[] = []
  const sa = houses.Sa
  if (lang === 'en') {
    if (sa === 12) out.push('Sade Sati — rising phase: Saturn in your 12th asks you to trim expenses and rest more.')
    else if (sa === 1) out.push('Sade Sati — peak phase: Saturn over your Moon sign rewards patience, discipline and simple living.')
    else if (sa === 2) out.push('Sade Sati — setting phase: Saturn in your 2nd steadies finances slowly; speak with care.')
    else if (sa === 8) out.push('Ashtama Shani: Saturn in your 8th — avoid shortcuts and keep health check-ups regular.')
    else if (sa === 4) out.push('Kantaka Shani: Saturn in your 4th can weigh on home and peace of mind; keep routines simple.')
    else if (sa === 3 || sa === 6 || sa === 11) out.push(`Saturn in your ${ORD[sa]} is a strong backing — steady effort pays off this period.`)
  } else {
    if (sa === 12) out.push(DR_TEXT_HI.sadeSati12)
    else if (sa === 1) out.push(DR_TEXT_HI.sadeSati1)
    else if (sa === 2) out.push(DR_TEXT_HI.sadeSati2)
    else if (sa === 8) out.push(DR_TEXT_HI.ashtamaShani)
    else if (sa === 4) out.push(DR_TEXT_HI.kantakaShani)
    else if (sa === 3 || sa === 6 || sa === 11) out.push(fill(DR_TEXT_HI.saturnStrong, { ord: DR_ORD_HI[sa] }))
  }

  const ju = houses.Ju
  if (lang === 'en') {
    if ([2, 5, 7, 9, 11].includes(ju)) out.push(`Jupiter in your ${ORD[ju]} is a protective backdrop this year for ${HOUSE_MATTERS[ju]}.`)
    else out.push(`Jupiter in your ${ORD[ju]} gives limited help this period — rely on your own planning.`)
  } else if ([2, 5, 7, 9, 11].includes(ju)) {
    out.push(fill(DR_TEXT_HI.jupiterHelp, { ord: DR_ORD_HI[ju], matters: DR_HOUSE_MATTERS_HI[ju] }))
  } else {
    out.push(fill(DR_TEXT_HI.jupiterLimit, { ord: DR_ORD_HI[ju] }))
  }

  const ra = houses.Ra
  if ([3, 6, 11].includes(ra)) {
    if (lang === 'en') out.push(`Rahu in your ${ORD[ra]} fuels ambition — good for bold, unconventional goals.`)
    else out.push(fill(DR_TEXT_HI.rahuAmbition, { ord: DR_ORD_HI[ra] }))
  }
  return out
}

function scoreAreas(houses: Record<GocharPlanet, number>, values: Record<GocharPlanet, number>, lang: EngineLang): HoroscopeArea[] {
  const labels = pick(AREA_LABELS, DR_AREA_LABELS_HI, lang)
  const texts = pick(AREA_TEXT, DR_AREA_TEXT_HI, lang)
  return (Object.keys(AREA_WEIGHTS) as HoroscopeAreaId[]).map((id) => {
    let sum = 0
    let total = 0
    for (const [p, w] of Object.entries(AREA_WEIGHTS[id]) as Array<[GocharPlanet, number]>) {
      const weight = AREA_HOUSES[id].includes(houses[p]) ? w * 2 : w
      sum += weight * values[p]
      total += weight
    }
    const score = clampScore(53 + 42 * (sum / total))
    const tone = toneOf(score)
    return {
      id,
      label: labels[id],
      sanskrit: AREA_SANSKRIT[id],
      score,
      rating: ratingOf(score),
      tone,
      text: texts[id][tone],
    }
  })
}

function karyaVarjya(houses: Record<GocharPlanet, number>, transits: HoroscopeTransit[], lang: EngineLang) {
  const moonKarya = pick(MOON_KARYA, DR_MOON_KARYA_HI, lang)
  const moonVarjya = pick(MOON_VARJYA, DR_MOON_VARJYA_HI, lang)
  const planetKarya = pick(PLANET_KARYA, DR_PLANET_KARYA_HI, lang)
  const planetVarjya = pick(PLANET_VARJYA, DR_PLANET_VARJYA_HI, lang)
  const karya = [...moonKarya[houses.Mo]]
  const varjya = [...moonVarjya[houses.Mo]]
  for (const t of transits) {
    if (t.status === 'favourable' && planetKarya[t.planet]) karya.push(planetKarya[t.planet]!)
    else if ((t.retro || [8, 12].includes(t.house)) && planetVarjya[t.planet]) varjya.push(planetVarjya[t.planet]!)
  }
  return { karya: karya.slice(0, 4), varjya: varjya.slice(0, 4) }
}

/**
 * Shubh samay: waking-hour horas (sunrise → 3 h after sunset) ruled by a graha
 * in favourable gochara for this sign, never overlapping Rahu Kalam.
 * Strongest lords first (by daily weight), one window per graha, at most two, in time order.
 */
function shubhSamay(
  sky: DailyHoroscopeSky,
  values: Record<GocharPlanet, number>,
): HoroscopeWindow[] {
  const { horas, rahuKalam, sunset } = sky.timings
  const rStart = Date.parse(rahuKalam.start)
  const rEnd = Date.parse(rahuKalam.end)
  const cutoff = Date.parse(sunset) + 3 * 3_600_000
  const picks = horas
    .filter((h) => Date.parse(h.start) < cutoff)
    .filter((h) => values[h.lord] >= 1 && h.lord !== 'Ra' && h.lord !== 'Ke')
    .filter((h) => Date.parse(h.end) <= rStart || Date.parse(h.start) >= rEnd)
    .sort((a, b) => DAY_WEIGHTS[b.lord] - DAY_WEIGHTS[a.lord] || Date.parse(a.start) - Date.parse(b.start))
    // One window per graha keeps the two picks distinct.
    .filter((h, i, arr) => arr.findIndex((x) => x.lord === h.lord) === i)
    .slice(0, 2)
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start))
  return picks.map((h) => ({ start: h.start, end: h.end, lord: h.lord }))
}

const ALL: GocharPlanet[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

/** Reading for one Moon sign. */
export function buildRashiHoroscope(sky: DailyHoroscopeSky, rashi: Rashi, lang: EngineLang = 'en'): RashiHoroscope {
  const moonThemes = pick(MOON_THEMES, DR_MOON_THEMES_HI, lang)
  const planetRole = pick(PLANET_ROLE, DR_PLANET_ROLE_HI, lang)
  const planetColor = pick(PLANET_COLOR, DR_PLANET_COLOR_HI, lang)
  const planetDirection = pick(PLANET_DIRECTION, DR_PLANET_DIRECTION_HI, lang)
  const remedyAct = pick(REMEDY_ACT, DR_REMEDY_ACT_HI, lang)
  const houses = {} as Record<GocharPlanet, number>
  for (const g of sky.grahas) houses[g.id] = houseFrom(g.rashi, rashi)

  const evals = ALL.map((p) => evaluateGochar(p, houses)!)
  const values = {} as Record<GocharPlanet, number>
  for (const e of evals) values[e.planet] = statusValue(e.status, e.houseFromMoon)

  // Moon ingress: blend the two Moon houses by the share of the day each covers.
  let later: RashiHoroscope['moon']['later'] = null
  if (sky.moonIngress) {
    const laterHouse = houseFrom(sky.moonIngress.toRashi, rashi)
    const laterHouses = { ...houses, Mo: laterHouse }
    const laterEval = evaluateGochar('Mo', laterHouses)!
    const span = Date.parse(sky.dayEnd) - Date.parse(sky.dayStart)
    const share = (Date.parse(sky.moonIngress.at) - Date.parse(sky.dayStart)) / span
    values.Mo = share * values.Mo + (1 - share) * statusValue(laterEval.status, laterHouse)
    later = { house: laterHouse, at: sky.moonIngress.at, theme: moonThemes[laterHouse].text }
  }

  let sum = 0
  let total = 0
  for (const p of ALL) {
    sum += DAY_WEIGHTS[p] * values[p]
    total += DAY_WEIGHTS[p]
  }
  const score = clampScore(53 + 42 * (sum / total))
  const tone = toneOf(score)

  const retro = new Map(sky.grahas.map((g) => [g.id, g.retro]))
  const transits: HoroscopeTransit[] = evals.map((e) => ({
    planet: e.planet,
    house: e.houseFromMoon,
    status: e.status,
    retro: e.planet === 'Ra' || e.planet === 'Ke' ? false : Boolean(retro.get(e.planet)),
    vedhaBy: e.vedhaBy,
    note: transitNote(e.planet, e.houseFromMoon, e.status, e.vedhaBy, lang),
  }))

  // Fast grahas carry the daily message; slow ones go to the long-term block.
  const fast: GocharPlanet[] = ['Su', 'Me', 'Ve', 'Ma']
  const highlights = transits.filter((t) => fast.includes(t.planet) && t.status === 'favourable').map((t) => t.note)
  const cautions = transits
    .filter((t) => fast.includes(t.planet) && t.status !== 'favourable' && (t.status === 'vedha' || [1, 4, 5, 8, 12].includes(t.house)))
    .map((t) => t.note)
  for (const t of transits) {
    if (t.retro && ['Me', 'Ve', 'Ma'].includes(t.planet)) {
      if (lang === 'en') {
        cautions.push(`${NAMES[t.planet]} is retrograde — revisit, repair and re-check ${PLANET_ROLE[t.planet]} rather than starting fresh.`)
      } else {
        cautions.push(fill(DR_TEXT_HI.retroCaution, { planet: gName(t.planet, lang), role: planetRole[t.planet] }))
      }
    }
  }

  const moonHouse = houses.Mo
  const theme = moonThemes[moonHouse]
  const areas = scoreAreas(houses, values, lang)
  const best = [...areas].sort((a, b) => b.score - a.score)[0]
  const weakest = [...areas].sort((a, b) => a.score - b.score)[0]
  const summaryParts = [theme.text]
  if (best.tone === 'excellent' || best.tone === 'good') {
    if (lang === 'en') summaryParts.push(`${best.label} is your strongest area today.`)
    else summaryParts.push(fill(DR_TEXT_HI.summaryStrong, { area: best.label }))
  }
  if (weakest.tone === 'challenging') {
    if (lang === 'en') summaryParts.push(`Go gently with ${weakest.label.toLowerCase()} matters.`)
    else summaryParts.push(fill(DR_TEXT_HI.summaryGentle, { area: weakest.label }))
  }

  // Ally: highest-weight favourable graha (Moon excluded — it already sets the tone); fallback to the sign lord.
  const ally =
    [...ALL]
      .filter((p) => p !== 'Mo' && p !== 'Ra' && p !== 'Ke' && values[p] >= 1)
      .sort((a, b) => DAY_WEIGHTS[b] - DAY_WEIGHTS[a])[0] ?? RASHI_LORDS[rashi]
  // Remedy targets the heaviest-weighted graha in a hard house today.
  const troubler = [...ALL]
    .filter((p) => values[p] < 0)
    .sort((a, b) => DAY_WEIGHTS[b] * -values[b] - DAY_WEIGHTS[a] * -values[a])[0]
  const remedyPlanet = troubler ?? RASHI_LORDS[rashi]
  const remedy = troubler
    ? lang === 'en'
      ? `To ease ${NAMES[troubler]}: ${REMEDY_ACT[troubler]}, and chant “${PLANET_MANTRA[troubler]}” 11 times.`
      : fill(DR_TEXT_HI.remedyTrouble, {
          planet: gName(troubler, lang),
          act: remedyAct[troubler],
          mantra: PLANET_MANTRA[troubler],
        })
    : lang === 'en'
      ? `Thank your sign lord ${NAMES[remedyPlanet]}: ${REMEDY_ACT[remedyPlanet]}.`
      : fill(DR_TEXT_HI.remedyThanks, { planet: gName(remedyPlanet, lang), act: remedyAct[remedyPlanet] })

  return {
    rashi,
    slug: RASHI_SLUGS[rashi],
    english: rName(rashi, lang),
    sanskrit: RASHI_SANSKRIT[rashi],
    glyph: RASHI_GLYPHS[rashi],
    devanagari: RASHI_DEVANAGARI[rashi],
    lord: RASHI_LORDS[rashi],
    element: ELEMENTS[(rashi - 1) % 4],
    score,
    tone,
    headline: theme.headline,
    summary: summaryParts.join(' '),
    moon: { house: moonHouse, theme: theme.text, later },
    areas,
    transits,
    highlights,
    cautions,
    longTerm: longTermNotes(houses, lang),
    ...karyaVarjya(houses, transits, lang),
    lucky: {
      ally,
      color: planetColor[ally],
      number: PLANET_NUMBER[ally],
      direction: planetDirection[ally],
      mantra: PLANET_MANTRA[ally],
    },
    shubhSamay: shubhSamay(sky, values),
    remedy,
  }
}

/** Readings for all twelve Moon signs. */
export function buildDailyHoroscopeReport(sky: DailyHoroscopeSky, lang: EngineLang = 'en'): DailyHoroscopeReport {
  const moon = sky.grahas.find((g) => g.id === 'Mo')!
  const signs = ([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as Rashi[]).map((r) => buildRashiHoroscope(sky, r, lang))
  return {
    date: sky.date,
    dayStart: sky.dayStart,
    dayEnd: sky.dayEnd,
    moonRashi: moon.rashi,
    moonLongitude: moon.longitude,
    panchang: sky.panchang,
    moonNakshatra: sky.moonNakshatra,
    moonIngress: sky.moonIngress,
    timings: {
      place: sky.timings.place,
      sunrise: sky.timings.sunrise,
      sunset: sky.timings.sunset,
      rahuKalam: sky.timings.rahuKalam,
    },
    signs,
  }
}

export const GOCHAR_PLANET_NAMES = NAMES
