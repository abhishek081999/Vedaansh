// ─────────────────────────────────────────────────────────────
//  src/lib/engine/todayReading.ts
//  Personal "Today's Reading": natal chart x live transits x live
//  panchang x running dasha, folded into one explainable day report.
//
//  Pure engine — no ephemeris, DB or React. Callers supply live planet
//  positions (`/api/transits/planets`) and the day's panchang windows
//  (`/api/panchang`). Scores are a rule-based summary, not a prediction
//  guarantee; every number is backed by a listed factor.
// ─────────────────────────────────────────────────────────────

import type { DashaNode, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, NAKSHATRA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { getKarana, getTithi, getYoga } from '@/lib/engine/nakshatra'
import { getTithiDayMeta } from '@/lib/engine/tithiMeta'
import { getYogaMeta } from '@/lib/engine/yogaMeta'
import { getKaranaMeta } from '@/lib/engine/karanaMeta'
import { getNakshatraMuhurtaMeta } from '@/lib/engine/nakshatraMuhurta'
import { getVaarMeta, HORA_PURPOSE_HINTS, listHoraPurposeHints } from '@/lib/engine/vaarMeta'
import { calcChandraBala } from '@/lib/engine/muhurtaPersonal'
import { getTaraFromBirth, type TaraTone } from '@/lib/engine/navtaraPrediction'
import { getDashaPathAt } from '@/lib/engine/dasha/current'
import { HOUSE_THEMES, RASHI_LORDS, getPlanetInHouse } from '@/lib/engine/houseInterpretations'
import { PLANET_REMEDIES, type PlanetRemedy } from '@/lib/engine/dashboardInsights'
import { GRAHA_HI, NAKSHATRA_HI, RASHI_HI, termHi } from '@/i18n/jyotish'
import { fill, overlay, type EngineLang } from '@/lib/engine/lang'
import {
  AREA_LABELS_HI,
  DIGNITY_HI,
  GOCHAR_STATUS_HI,
  HOUSE_SHORT_THEMES_HI,
  LABEL_HI,
  LEVEL_LABEL_HI,
  NATAL_THEMES_HI,
  PLANET_REMEDIES_HI,
  TARA_HI,
  TODAY_HI,
  ordHi,
} from '@/lib/engine/locale/todayReading.hi'
import {
  evaluateGochar,
  houseFrom,
  isGocharPlanet,
  type GocharPlanet,
  type GocharStatus,
} from '@/lib/engine/gocharRules'

// ── Input contracts ──────────────────────────────────────────

/** The slice of a calculated chart this engine reads. `ChartOutput` satisfies it. */
export interface TodayNatalInput {
  grahas: GrahaData[]
  lagnas: { ascRashi: Rashi; ascDegree?: number }
  dashas?: { vimshottari?: DashaNode[] }
}

/** One live graha, as returned by `/api/transits/planets`. */
export interface TodayTransitGraha {
  id: GrahaId
  rashi: Rashi
  /** Degree within the sign, 0–30. */
  degree: number
  lonSidereal: number
  nakshatraIndex: number
  nakshatraName: string
  pada: number
  isRetro: boolean
  dignity: string
  /** Degrees per day; used to estimate when the Moon changes sign. */
  speed?: number
}

export interface IsoWindow { start: string; end: string }

export interface TodayChoghadiyaSlot extends IsoWindow {
  name: string
  quality: 'good' | 'mixed' | 'avoid'
}

/** Subset of the `/api/panchang` payload (ISO strings, as sent over JSON). */
export interface TodayPanchangInput {
  date: string
  vara: { number: number; name: string; lord: GrahaId }
  sunrise: string
  sunset: string
  rahuKalam: IsoWindow
  gulikaKalam: IsoWindow
  yamaganda: IsoWindow
  abhijitMuhurta: IsoWindow | null
  horaTable?: Array<IsoWindow & { lord: GrahaId }>
  choghadiya?: { day: TodayChoghadiyaSlot[]; night: TodayChoghadiyaSlot[] }
}

export interface BuildTodayReadingInput {
  natal: TodayNatalInput
  transit: TodayTransitGraha[]
  panchang: TodayPanchangInput
  now?: Date
  /** Language of every human-readable string; ids and enums stay English. */
  lang?: EngineLang
}

// ── Output contracts ─────────────────────────────────────────

export type DayLabel = 'Excellent' | 'Good' | 'Balanced' | 'Cautious' | 'Demanding'
export type Quality = 'good' | 'mixed' | 'caution'

export interface MoonDay {
  rashi: Rashi
  rashiName: string
  nakshatraName: string
  pada: number
  /** Moon's house counted from natal Moon (Chandra Bala position). */
  chandraPosition: number
  chandraQuality: 'good' | 'bad' | 'avg'
  chandraNote: string
  /** Moon's house counted from natal Lagna. */
  lagnaHouse: number
  lagnaTheme: string
  /** Natal grahas sharing the Moon's current sign. */
  overNatal: GrahaId[]
  signChange: null | {
    atIso: string
    toRashi: Rashi
    toRashiName: string
    toChandraPosition: number
    toChandraQuality: 'good' | 'bad' | 'avg'
  }
}

export interface TaraDay {
  name: string
  taraNumber: number
  tone: TaraTone
  isHard: boolean
  label: string
  advice: string
  trap?: string
}

export interface PanchangItem {
  key: 'vara' | 'tithi' | 'nakshatra' | 'yoga' | 'karana'
  label: string
  value: string
  quality: Quality
  note: string
}

export interface DashaDay {
  level: number
  levelLabel: string
  lord: GrahaId
  lordName: string
  tone: 'supportive' | 'mixed' | 'challenging'
  note: string
}

export interface GocharRow {
  planet: GocharPlanet
  planetName: string
  rashiName: string
  fromMoon: number
  fromLagna: number
  status: GocharStatus
  isRetro: boolean
  note: string
  delta: number
}

export interface TransitTrigger {
  transit: GrahaId
  natal: GrahaId | 'Asc'
  aspect: 'conjunction' | 'opposition'
  orb: number
  nature: 'supportive' | 'pressure' | 'activation'
  text: string
}

export interface AreaScore {
  id: 'mind' | 'career' | 'money' | 'love' | 'health' | 'home'
  label: string
  score: number
  verdict: 'Favourable' | 'Good' | 'Neutral' | 'Careful'
  /** `verdict` in the reading's language */
  verdictLabel: string
  drivers: string[]
}

export interface TimedWindow {
  label: string
  startIso: string
  endIso: string
  note?: string
  current: boolean
}

export interface TodayReading {
  generatedAtIso: string
  score: number
  label: DayLabel
  /** `label` in the reading's language */
  labelText: string
  headline: string
  narrative: string[]
  moon: MoonDay
  tara: TaraDay
  panchang: PanchangItem[]
  saturn: { fromMoon: number; phase: 'sade_sati' | 'kantaka' | 'ashtama' | 'clear'; note: string }
  dasha: DashaDay[]
  gochar: GocharRow[]
  triggers: TransitTrigger[]
  areas: AreaScore[]
  windows: {
    good: TimedWindow[]
    avoid: TimedWindow[]
    horas: TimedWindow[]
    currentHora: TimedWindow | null
  }
  supportive: string[]
  caution: string[]
  doList: string[]
  avoidList: string[]
  remedy: { vara: { lord: GrahaId; name: string; remedy: PlanetRemedy }; extra: Array<{ reason: string; name: string; remedy: PlanetRemedy }> }
}

// ── Small helpers ────────────────────────────────────────────

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`
}

function houseTheme(house: number): string {
  const theme = HOUSE_THEMES[clamp(house, 1, 12) as keyof typeof HOUSE_THEMES]
  return (theme?.shortThemes ?? 'life activity').toLowerCase()
}

function firstSentence(text: string | null | undefined): string {
  if (!text) return ''
  const m = /^.*?[.!?](?=\s|$)/.exec(text.trim())
  return (m ? m[0] : text).trim()
}

function ms(iso: string): number {
  return Date.parse(iso)
}

const DIGNITY_SCORE: Record<string, number> = {
  exalted: 3, moolatrikona: 2, own: 2, great_friend: 1, friend: 1,
  neutral: 0, enemy: -1, great_enemy: -2, debilitated: -3,
}

const KENDRA_TRIKONA = new Set([1, 4, 5, 7, 9, 10])
const DUSTHANA = new Set([6, 8, 12])
const UPACHAYA = new Set([3, 6, 10, 11])
const NATURAL_BENEFIC = new Set<GrahaId>(['Ju', 'Ve', 'Me', 'Mo'])
const SLOW_PLANETS: GocharPlanet[] = ['Sa', 'Ju', 'Ra', 'Ke', 'Ma', 'Su', 'Me', 'Ve']
const CORE: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

/** How much each background transit can move the day (kept small: they are slow movers). */
const GOCHAR_WEIGHT: Record<GocharPlanet, number> = {
  Sa: 4, Ju: 4, Ma: 2, Ra: 2, Ke: 1.5, Su: 1.5, Ve: 1.5, Me: 1, Mo: 0,
}

/** Natal condition of a graha: dignity + house type + combustion. Roughly −5…+5. */
function natalStrength(g: GrahaData, lagna: Rashi): number {
  const house = houseFrom(g.rashi, lagna)
  let s = DIGNITY_SCORE[g.dignity] ?? 0
  if (KENDRA_TRIKONA.has(house)) s += 1
  if (DUSTHANA.has(house) && g.id !== 'Sa' && g.id !== 'Ma') s -= 1
  if (g.isCombust && g.id !== 'Su') s -= 1
  return clamp(s, -5, 5)
}

function labelFor(score: number): DayLabel {
  if (score >= 74) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 45) return 'Balanced'
  if (score >= 32) return 'Cautious'
  return 'Demanding'
}

// ── Interval maths for time windows ──────────────────────────

interface Span { start: number; end: number }

function subtractSpans(base: Span, cuts: Span[]): Span[] {
  let parts: Span[] = [base]
  for (const c of cuts) {
    const next: Span[] = []
    for (const p of parts) {
      if (c.end <= p.start || c.start >= p.end) { next.push(p); continue }
      if (c.start > p.start) next.push({ start: p.start, end: c.start })
      if (c.end < p.end) next.push({ start: c.end, end: p.end })
    }
    parts = next
  }
  return parts
}

function toWindow(label: string, s: Span, nowMs: number, note?: string): TimedWindow {
  return {
    label,
    startIso: new Date(s.start).toISOString(),
    endIso: new Date(s.end).toISOString(),
    note,
    current: nowMs >= s.start && nowMs < s.end,
  }
}

const MIN_WINDOW_MS = 20 * 60 * 1000

// ── Static reference ─────────────────────────────────────────

const LEVEL_LABEL: Record<number, string> = {
  1: 'Mahadasha', 2: 'Antardasha', 3: 'Pratyantar', 4: 'Sookshma',
}
/** Dasha levels weigh more as they get closer to "today". */
const DASHA_WEIGHT: Record<number, number> = { 1: 3, 2: 5, 3: 4, 4: 2 }

const NATAL_THEMES: Record<GrahaId | 'Asc', string> = {
  Su: 'vitality, authority and father', Mo: 'mind, mother and emotional security',
  Ma: 'energy, courage and property', Me: 'communication, trade and intellect',
  Ju: 'wisdom, growth and guidance', Ve: 'love, comfort and pleasure',
  Sa: 'duty, discipline and endurance', Ra: 'ambition and the unconventional',
  Ke: 'detachment and the spiritual', Asc: 'body, identity and direction',
  Ur: '', Ne: '', Pl: '',
}

interface AreaDef {
  id: AreaScore['id']
  label: string
  houses: number[]
  karakas: GocharPlanet[]
}

const AREAS: AreaDef[] = [
  { id: 'mind', label: 'Mind & Mood', houses: [1, 4, 5], karakas: ['Mo'] },
  { id: 'career', label: 'Career & Status', houses: [10, 6], karakas: ['Su', 'Sa'] },
  { id: 'money', label: 'Money & Gains', houses: [2, 11], karakas: ['Ju'] },
  { id: 'love', label: 'Love & Relationships', houses: [7, 5], karakas: ['Ve'] },
  { id: 'health', label: 'Health & Energy', houses: [1, 6], karakas: ['Su', 'Mo', 'Ma'] },
  { id: 'home', label: 'Home & Family', houses: [4, 2], karakas: ['Mo', 'Ve'] },
]

function horaHint(lord: GrahaId, lang: EngineLang = 'en'): string {
  if (lang === 'hi') {
    const hits = listHoraPurposeHints('hi').filter(h => h.lords.includes(lord)).map(h => h.purpose)
    return hits.length ? fill(TODAY_HI.horaSuited, { purposes: hits.slice(0, 2).join(TODAY_HI.and) }) : TODAY_HI.horaGeneral
  }
  const hits = HORA_PURPOSE_HINTS.filter(h => h.lords.includes(lord)).map(h => h.purpose.toLowerCase())
  return hits.length ? `suited to ${hits.slice(0, 2).join(' and ')}` : 'general activity'
}

// ── Main builder ─────────────────────────────────────────────

export function buildTodayReading(input: BuildTodayReadingInput): TodayReading | null {
  const { natal, transit, panchang } = input
  const now = input.now ?? new Date()
  const nowMs = now.getTime()
  const lang = input.lang ?? 'en'
  const hi = lang === 'hi'
  const H = TODAY_HI
  /** Display helpers: English unchanged, Hindi from the glossary. */
  const gName = (id: GrahaId) => (hi ? GRAHA_HI[id] : GRAHA_NAMES[id])
  const rName = (r: Rashi) => (hi ? RASHI_HI[r] : RASHI_NAMES[r])
  const nth = (n: number) => (hi ? ordHi(n) : ordinal(n))
  const dig = (d: string) => (hi ? DIGNITY_HI[d] ?? d : d.replace('_', ' '))
  const theme = (house: number) => (hi ? HOUSE_SHORT_THEMES_HI[clamp(house, 1, 12)] : houseTheme(house))

  const natalBy = (id: GrahaId) => natal.grahas.find(g => g.id === id)
  const transitBy = (id: GrahaId) => transit.find(g => g.id === id)
  const nMoon = natalBy('Mo')
  const tMoon = transitBy('Mo')
  const tSun = transitBy('Su')
  if (!nMoon || !tMoon || !tSun) return null

  const lagna = natal.lagnas.ascRashi
  const supportive: string[] = []
  const caution: string[] = []

  // ── 1. Moon: the day's pulse ──────────────────────────────
  const chandraPos = houseFrom(tMoon.rashi, nMoon.rashi)
  const chandra = calcChandraBala(nMoon.rashi, tMoon.rashi)
  const moonLagnaHouse = houseFrom(tMoon.rashi, lagna)
  const overNatal = natal.grahas
    .filter(g => g.id !== 'Mo' && CORE.includes(g.id) && g.rashi === tMoon.rashi)
    .map(g => g.id)

  let signChange: MoonDay['signChange'] = null
  if (tMoon.speed && tMoon.speed > 0) {
    const hoursLeft = ((30 - tMoon.degree) / tMoon.speed) * 24
    const toRashi = ((tMoon.rashi % 12) + 1) as Rashi
    const toChandra = calcChandraBala(nMoon.rashi, toRashi)
    signChange = {
      atIso: new Date(nowMs + hoursLeft * 3_600_000).toISOString(),
      toRashi,
      toRashiName: rName(toRashi),
      toChandraPosition: toChandra.position,
      toChandraQuality: toChandra.quality,
    }
  }

  const chandraNote = hi
    ? chandra.quality === 'good' ? H.chandraGood : chandra.quality === 'bad' ? H.chandraBad : H.chandraAvg
    : chandra.quality === 'good'
      ? 'Chandra Bala (the Moon’s strength for you today) is good: your mind is steadier and dealing with people is easier.'
      : chandra.quality === 'bad'
        ? 'Chandra Bala (the Moon’s strength for you today) is demanding: emotions run closer to the surface, so slow down big reactions.'
        : 'Chandra Bala (the Moon’s strength for you today) is neutral: the Moon neither lifts you nor weighs you down.'

  let score = 50
  const chandraDelta = chandra.quality === 'good' ? 12 : chandra.quality === 'bad' ? -14 : 0
  score += chandraDelta
  const chandraLine = hi
    ? fill(H.chandraLine, { nth: nth(chandraPos) })
    : `Chandra Bala (the Moon’s strength for you): today’s Moon is ${ordinal(chandraPos)} from your birth Moon`
  if (chandra.quality === 'good') supportive.push(chandraLine)
  if (chandra.quality === 'bad') caution.push(chandraLine)

  const moon: MoonDay = {
    rashi: tMoon.rashi,
    rashiName: rName(tMoon.rashi),
    nakshatraName: hi ? NAKSHATRA_HI[tMoon.nakshatraIndex] : tMoon.nakshatraName || NAKSHATRA_NAMES[tMoon.nakshatraIndex],
    pada: tMoon.pada,
    chandraPosition: chandraPos,
    chandraQuality: chandra.quality,
    chandraNote,
    lagnaHouse: moonLagnaHouse,
    lagnaTheme: theme(moonLagnaHouse),
    overNatal,
    signChange,
  }

  // ── 2. Tara Bala from the Moon's nakshatra ────────────────
  const taraEn = getTaraFromBirth(nMoon.nakshatraIndex, tMoon.nakshatraIndex)
  const taraHi = hi ? TARA_HI[taraEn.name] : undefined
  const taraProfile = taraHi
    ? { ...taraEn, shortLabel: taraHi.shortLabel, decisionWindow: taraHi.decisionWindow, trap: taraEn.trap ? taraHi.trap ?? taraEn.trap : undefined }
    : taraEn
  const taraName = taraHi?.name ?? taraEn.name
  const taraDelta =
    taraProfile.tone === 'supportive' ? 10
      : taraProfile.tone === 'transformative' ? 5
        : taraProfile.tone === 'challenging' ? -12 : 0
  score += taraDelta
  const taraLine = hi
    ? fill(H.taraLine, { name: taraName, label: taraProfile.shortLabel })
    : `Tara Bala (the day’s star strength for you): ${taraProfile.name} (${taraProfile.shortLabel.toLowerCase()})`
  if (taraDelta > 0) supportive.push(taraLine)
  if (taraDelta < 0) caution.push(taraLine)
  const tara: TaraDay = {
    name: taraName,
    taraNumber: taraProfile.taraNumber,
    tone: taraProfile.tone,
    isHard: taraProfile.isHard,
    label: taraProfile.shortLabel,
    advice: taraProfile.decisionWindow,
    trap: taraProfile.trap,
  }

  // ── 3. Live panchang quality ──────────────────────────────
  const tithi = getTithi(tMoon.lonSidereal, tSun.lonSidereal)
  const yoga = getYoga(tSun.lonSidereal, tMoon.lonSidereal)
  const karana = getKarana(tMoon.lonSidereal, tSun.lonSidereal)
  const tithiMeta = getTithiDayMeta(tithi.number, lang)
  const yogaMeta = getYogaMeta(yoga.name, lang)
  const karanaMeta = getKaranaMeta(karana.name, lang)
  const nakMeta = getNakshatraMuhurtaMeta(tMoon.nakshatraIndex, tMoon.pada, lang)
  const vaar = getVaarMeta(panchang.vara.number, lang)
  const limbLabel = (en: string) => (hi ? termHi(en) : en)
  const pakshaName = limbLabel(tithi.paksha === 'shukla' ? 'Shukla' : 'Krishna')
  const yogaName = limbLabel(yoga.name)
  const karanaName = limbLabel(karana.name)
  const vaarLordNatal = natalBy(panchang.vara.lord)

  let panchangDelta = 0
  const panchangItems: PanchangItem[] = []

  const vaarStrength = vaarLordNatal ? natalStrength(vaarLordNatal, lagna) : 0
  const vaarQuality: Quality = vaarStrength >= 2 ? 'good' : vaarStrength <= -2 ? 'caution' : 'mixed'
  panchangDelta += clamp(vaarStrength, -3, 3)
  panchangItems.push({
    key: 'vara',
    label: limbLabel('Vara'),
    value: `${vaar.name} · ${vaar.lordName}`,
    quality: vaarQuality,
    note: vaarLordNatal
      ? hi
        ? fill(H.varaNote, { lord: vaar.lordName, nth: nth(houseFrom(vaarLordNatal.rashi, lagna)), dignity: dig(vaarLordNatal.dignity), guidance: vaar.dayGuidance })
        : `${vaar.lordName} rules the day and sits in your ${ordinal(houseFrom(vaarLordNatal.rashi, lagna))} house (${vaarLordNatal.dignity.replace('_', ' ')}). ${vaar.dayGuidance}`
      : vaar.dayGuidance,
  })

  const tithiGood = tithiMeta.group.nature === 'shubh'
  const isRikta = tithiMeta.group.id === 'Rikta'
  panchangDelta += tithiGood ? 3 : isRikta ? -4 : -3
  panchangItems.push({
    key: 'tithi',
    label: limbLabel('Tithi'),
    value: `${pakshaName} ${tithiMeta.name}`,
    quality: tithiGood ? 'good' : 'caution',
    note: hi
      ? fill(H.tithiNote, { group: tithiMeta.group.label, meaning: tithiMeta.group.meaning, guidance: tithiMeta.group.dayGuidance })
      : `${tithiMeta.group.id} tithi (${tithiMeta.group.meaning.toLowerCase()}). ${tithiMeta.group.dayGuidance}`,
  })

  const nakGroup = nakMeta.group.id
  const nakGood = nakGroup === 'Dhruva' || nakGroup === 'Mridu' || nakGroup === 'Laghu'
  const nakHard = nakGroup === 'Ugra' || nakGroup === 'Tikshna'
  panchangDelta += nakGood ? 2 : nakHard ? -2 : 0
  panchangItems.push({
    key: 'nakshatra',
    label: limbLabel('Nakshatra'),
    value: hi ? fill(H.nakValue, { nak: nakMeta.name, pada: tMoon.pada }) : `${nakMeta.name} · Pada ${tMoon.pada}`,
    quality: nakGood ? 'good' : nakHard ? 'caution' : 'mixed',
    note: hi ? fill(H.nakNote, { group: nakMeta.group.label, goodFor: nakMeta.group.goodFor }) : `${nakMeta.group.label}: ${nakMeta.group.goodFor}.`,
  })

  const yogaQuality: Quality =
    yoga.quality === 'auspicious' ? 'good' : yoga.quality === 'inauspicious' ? 'caution' : 'mixed'
  panchangDelta += yoga.quality === 'auspicious' ? 3 : yoga.quality === 'inauspicious' ? -4 : 0
  panchangItems.push({
    key: 'yoga',
    label: limbLabel('Yoga'),
    value: yogaName,
    quality: yogaQuality,
    note: yogaMeta
      ? hi ? fill(H.yogaNote, { meaning: yogaMeta.meaning, guidance: yogaMeta.dayGuidance }) : `${yogaMeta.meaning}. ${yogaMeta.dayGuidance}`
      : hi ? H.yogaFallback : 'The current Sun–Moon combination.',
  })

  panchangDelta += karana.isBhadra ? -4 : 0
  panchangItems.push({
    key: 'karana',
    label: limbLabel('Karana'),
    value: hi ? karanaName : karana.isBhadra ? `${karana.name} (Bhadra)` : karana.name,
    quality: karana.isBhadra ? 'caution' : 'mixed',
    note: karanaMeta
      ? hi ? fill(H.karanaNote, { meaning: karanaMeta.meaning, guidance: karanaMeta.dayGuidance }) : `${karanaMeta.meaning}. ${karanaMeta.dayGuidance}`
      : hi ? H.karanaFallback : 'The current half of the lunar day.',
  })

  panchangDelta = clamp(panchangDelta, -12, 12)
  score += panchangDelta
  for (const it of panchangItems) {
    if (it.quality === 'good' && it.key !== 'vara') supportive.push(`${it.label}: ${it.value}`)
    if (it.quality === 'caution') caution.push(`${it.label}: ${it.value}`)
  }
  if (vaarQuality === 'good') supportive.push(hi ? fill(H.varaStrong, { lord: vaar.lordName }) : `${vaar.lordName}, the ruler of today’s weekday, is strong in your chart`)
  if (vaarQuality === 'caution') caution.push(hi ? fill(H.varaWeak, { lord: vaar.lordName }) : `${vaar.lordName}, the ruler of today’s weekday, is weak in your chart`)

  // ── 4. Gochar from natal Moon (with Vedha) ────────────────
  const housesFromMoon: Partial<Record<GocharPlanet, number>> = {}
  for (const g of transit) {
    if (isGocharPlanet(g.id)) housesFromMoon[g.id] = houseFrom(g.rashi, nMoon.rashi)
  }

  const gochar: GocharRow[] = []
  let gocharDelta = 0
  const gocharStatusOf: Partial<Record<GocharPlanet, GocharStatus>> = {}

  for (const pid of SLOW_PLANETS) {
    const t = transitBy(pid)
    const ev = evaluateGochar(pid, housesFromMoon)
    if (!t || !ev) continue
    gocharStatusOf[pid] = ev.status
    const fromLagna = houseFrom(t.rashi, lagna)
    const w = GOCHAR_WEIGHT[pid]
    const delta = ev.status === 'favourable' ? w : ev.status === 'unfavourable' ? -w : 0
    gocharDelta += delta

    const where = hi ? fill(H.where, { nth: nth(ev.houseFromMoon) }) : `${ordinal(ev.houseFromMoon)} from your Moon`
    const statusText = hi
      ? ev.status === 'favourable' ? H.statusGood
        : ev.status === 'vedha' ? fill(H.statusVedha, { by: gName(ev.vedhaBy as GocharPlanet) }) : H.statusBad
      : ev.status === 'favourable' ? 'a supportive position'
        : ev.status === 'vedha'
          ? `normally supportive, but obstructed by ${GRAHA_NAMES[ev.vedhaBy as GocharPlanet]} (Vedha, a blocking influence)`
          : 'a testing position'
    const flavour = hi
      ? firstSentence(getPlanetInHouse(pid, fromLagna, 'summary', 'hi')?.replace(/।/g, '.'))?.replace(/\.$/, '।')
      : firstSentence(getPlanetInHouse(pid, fromLagna, 'summary'))
    gochar.push({
      planet: pid,
      planetName: gName(pid),
      rashiName: rName(t.rashi),
      fromMoon: ev.houseFromMoon,
      fromLagna,
      status: ev.status,
      isRetro: t.isRetro && pid !== 'Ra' && pid !== 'Ke',
      note: hi
        ? fill(H.gocharNote, { where, status: statusText }) + (flavour ? ` ${fill(H.gocharFlavour, { nth: nth(fromLagna), flavour })}` : '')
        : `${where}: ${statusText}.${flavour ? ` ${ordinal(fromLagna)} from Lagna — ${flavour}` : ''}`,
      delta,
    })
    const gocharLine = hi ? fill(H.gocharLine, { planet: gName(pid), where }) : `${GRAHA_NAMES[pid]} transits ${where}`
    if (ev.status === 'favourable' && w >= 3) supportive.push(gocharLine)
    if (ev.status === 'unfavourable' && w >= 3) caution.push(gocharLine)
  }
  gocharDelta = clamp(gocharDelta, -14, 14)
  score += gocharDelta

  // Saturn phase relative to the Moon (Sade Sati / Kantaka / Ashtama)
  const satFromMoon = housesFromMoon.Sa ?? 0
  const saturnEn: TodayReading['saturn'] =
    satFromMoon === 12 || satFromMoon === 1 || satFromMoon === 2
      ? {
          fromMoon: satFromMoon,
          phase: 'sade_sati',
          note: `Saturn is ${ordinal(satFromMoon)} from your Moon: Sade Sati ${satFromMoon === 12 ? 'rising' : satFromMoon === 1 ? 'peak' : 'setting'} phase. Sade Sati is Saturn’s roughly 7.5-year passage around your Moon. It is often a time of slower progress and more responsibility, so choose patience and routine over haste.`,
        }
      : satFromMoon === 4
        ? { fromMoon: 4, phase: 'kantaka', note: 'Saturn is 4th from your Moon (Kantaka Shani, a Saturn phase): you may feel more pressure at home and in your emotions, so keep home matters steady.' }
        : satFromMoon === 8
          ? { fromMoon: 8, phase: 'ashtama', note: 'Saturn is 8th from your Moon (Ashtama Shani, a Saturn phase): avoid risky commitments and conflict, and look after your health.' }
          : { fromMoon: satFromMoon, phase: 'clear', note: 'No Sade Sati, Kantaka or Ashtama Shani right now.' }
  const saturn: TodayReading['saturn'] = hi
    ? {
        ...saturnEn,
        note: saturnEn.phase === 'sade_sati'
          ? fill(H.sadeSati, { nth: nth(satFromMoon), phase: satFromMoon === 12 ? H.sadeRising : satFromMoon === 1 ? H.sadePeak : H.sadeSetting })
          : saturnEn.phase === 'kantaka' ? H.kantaka : saturnEn.phase === 'ashtama' ? H.ashtama : H.saturnClear,
      }
    : saturnEn
  if (saturn.phase === 'sade_sati') caution.push(hi ? fill(H.sadeLine, { nth: nth(satFromMoon) }) : `Sade Sati is active: Saturn is ${ordinal(satFromMoon)} from your Moon, so expect slower progress and more responsibility`)
  if (saturn.phase === 'ashtama') caution.push(hi ? H.ashtamaLine : 'Ashtama Shani: Saturn is 8th from your Moon, so go carefully with big risks')

  // ── 5. Dasha ──────────────────────────────────────────────
  const dasha: DashaDay[] = []
  let dashaDelta = 0
  const path = getDashaPathAt(natal.dashas?.vimshottari ?? [], nowMs).slice(0, 4)
  for (const node of path) {
    const lord = node.lord as GrahaId
    const g = natalBy(lord)
    if (!g) continue
    const level = node.level || path.indexOf(node) + 1
    const strength = natalStrength(g, lagna)

    let gocharAdj = 0
    let gocharText = ''
    if (lord === 'Mo') {
      gocharAdj = chandra.quality === 'good' ? 1 : chandra.quality === 'bad' ? -1 : 0
      gocharText = hi ? fill(H.dashaMoon, { nth: nth(chandraPos) }) : `Today the Moon is ${ordinal(chandraPos)} from your natal Moon.`
    } else if (isGocharPlanet(lord)) {
      const st = gocharStatusOf[lord]
      gocharAdj = st === 'favourable' ? 1 : st === 'unfavourable' ? -1 : 0
      const tt = transitBy(lord)
      if (tt) {
        gocharText = hi
          ? fill(H.dashaTransit, { nth: nth(houseFrom(tt.rashi, nMoon.rashi)), status: GOCHAR_STATUS_HI[st ?? 'neutral'] ?? st ?? '' })
          : `Today it transits ${ordinal(houseFrom(tt.rashi, nMoon.rashi))} from your Moon (${st ?? 'neutral'}).`
      }
    }

    const total = strength + gocharAdj
    const tone: DashaDay['tone'] = total >= 2 ? 'supportive' : total <= -2 ? 'challenging' : 'mixed'
    dashaDelta += (clamp(total, -4, 4) / 4) * (DASHA_WEIGHT[level] ?? 1)

    const owned = RASHI_LORDS.filter(r => r.lord === lord).map(r => houseFrom(r.number, lagna)).sort((a, b) => a - b)
    const ownText = owned.length
      ? hi
        ? fill(H.owns, { houses: owned.map(ordHi).join(H.and) })
        : `, ruling your ${owned.map(ordinal).join(' and ')} ${owned.length > 1 ? 'houses' : 'house'}`
      : ''
    const natalHouse = houseFrom(g.rashi, lagna)
    const levelLabel = hi ? LEVEL_LABEL_HI[level] ?? fill(H.levelLabel, { n: level }) : LEVEL_LABEL[level] ?? `Level ${level}`
    dasha.push({
      level,
      levelLabel,
      lord,
      lordName: gName(lord),
      tone,
      note: hi
        ? fill(H.dashaNote, { lord: gName(lord), rashi: rName(g.rashi), dignity: dig(g.dignity), nth: nth(natalHouse), own: ownText, gochar: gocharText }).trim()
        : `${GRAHA_NAMES[lord]} is in ${RASHI_NAMES[g.rashi]} (${g.dignity.replace('_', ' ')}), your ${ordinal(natalHouse)} house${ownText}. ${gocharText}`.trim(),
    })
    if (level >= 2 && level <= 3 && tone === 'supportive') supportive.push(hi ? fill(H.dashaGood, { level: levelLabel, lord: gName(lord) }) : `${levelLabel} lord ${GRAHA_NAMES[lord]} is well placed`)
    if (level >= 2 && level <= 3 && tone === 'challenging') caution.push(hi ? fill(H.dashaBad, { level: levelLabel, lord: gName(lord) }) : `${levelLabel} lord ${GRAHA_NAMES[lord]} is under strain`)
  }
  dashaDelta = clamp(dashaDelta, -12, 12)
  score += dashaDelta

  // ── 6. Transit-to-natal triggers (conjunction / opposition) ─
  const triggers: TransitTrigger[] = []
  const targets: Array<{ id: GrahaId | 'Asc'; lon: number }> = [
    ...natal.grahas.filter(g => CORE.includes(g.id)).map(g => ({ id: g.id, lon: g.lonSidereal })),
  ]
  if (typeof natal.lagnas.ascDegree === 'number') targets.push({ id: 'Asc', lon: natal.lagnas.ascDegree })

  /** Shortest angular distance between two longitudes, 0–180°. */
  const separation = (a: number, b: number) => Math.abs((((a - b) % 360) + 540) % 360 - 180)
  const waxing = tithi.paksha === 'shukla'

  for (const t of transit) {
    if (!CORE.includes(t.id)) continue
    const orbLimit = t.id === 'Mo' ? 6 : 3
    for (const target of targets) {
      if (target.id === t.id) continue
      const sep = separation(t.lonSidereal, target.lon)
      const slow = t.id === 'Sa' || t.id === 'Ju' || t.id === 'Ma'
      let aspect: TransitTrigger['aspect'] | null = null
      let orb = 0
      if (sep <= orbLimit) { aspect = 'conjunction'; orb = sep }
      else if (slow && 180 - sep <= orbLimit) { aspect = 'opposition'; orb = 180 - sep }
      if (!aspect) continue

      const benefic = t.id === 'Ju' || t.id === 'Ve' || (t.id === 'Mo' && waxing)
      const malefic = t.id === 'Sa' || t.id === 'Ma' || t.id === 'Ra' || t.id === 'Ke'
      const nature: TransitTrigger['nature'] =
        t.id === 'Mo' || t.id === 'Su' || t.id === 'Me' ? 'activation' : benefic ? 'supportive' : malefic ? 'pressure' : 'activation'
      const natalName = hi
        ? target.id === 'Asc' ? H.yourAsc : fill(H.natalOf, { planet: gName(target.id) })
        : target.id === 'Asc' ? 'your Ascendant' : `natal ${GRAHA_NAMES[target.id]}`
      const themes = hi ? NATAL_THEMES_HI[target.id] ?? '' : NATAL_THEMES[target.id]
      const verb = hi
        ? aspect === 'conjunction' ? H.conjoins : H.opposes
        : aspect === 'conjunction' ? 'conjoins' : 'opposes'
      const tone = hi
        ? fill(nature === 'supportive' ? H.toneSupport : nature === 'pressure' ? H.tonePressure : H.toneFocus, { themes })
        : nature === 'supportive' ? `a supportive touch on ${themes}`
          : nature === 'pressure' ? `pressure and tests around ${themes}`
            : `${themes} come into focus`
      triggers.push({
        transit: t.id,
        natal: target.id,
        aspect,
        orb: Math.round(orb * 10) / 10,
        nature,
        text: hi
          ? fill(H.triggerText, { planet: gName(t.id), natal: natalName, verb, orb: orb.toFixed(1), tone })
          : `Transit ${GRAHA_NAMES[t.id]} ${verb} ${natalName} (${orb.toFixed(1)}° orb) — ${tone}.`,
      })
    }
  }
  const slowRank: Partial<Record<GrahaId, number>> = { Sa: 0, Ju: 1, Ra: 2, Ke: 3, Ma: 4, Su: 5, Ve: 6, Me: 7, Mo: 8 }
  triggers.sort((a, b) => (slowRank[a.transit] ?? 9) - (slowRank[b.transit] ?? 9) || a.orb - b.orb)
  const topTriggers = triggers.slice(0, 6)
  let triggerDelta = 0
  for (const tr of topTriggers) {
    const heavy = tr.natal === 'Mo' || tr.natal === 'Asc' || tr.natal === 'Su' ? 1.5 : 1
    if (tr.nature === 'supportive') triggerDelta += 2 * heavy
    if (tr.nature === 'pressure') triggerDelta -= 2 * heavy
  }
  triggerDelta = clamp(triggerDelta, -8, 8)
  score += triggerDelta
  for (const tr of topTriggers) {
    const line = hi
      ? fill(H.triggerLine, { planet: gName(tr.transit), natal: tr.natal === 'Asc' ? H.ascendant : gName(tr.natal) })
      : `Transit ${GRAHA_NAMES[tr.transit]} on ${tr.natal === 'Asc' ? 'Ascendant' : GRAHA_NAMES[tr.natal]}`
    if (tr.nature === 'supportive') supportive.push(line)
    if (tr.nature === 'pressure') caution.push(line)
  }

  score = Math.round(clamp(score, 8, 94))
  const label = labelFor(score)

  // ── 7. Life-area scores ───────────────────────────────────
  const dayBase = clamp(chandraDelta + taraDelta + panchangDelta, -25, 25)
  const areas: AreaScore[] = AREAS.map(def => {
    const areaLabel = hi ? AREA_LABELS_HI[def.id] : def.label
    let s = 50 + dayBase * 0.45
    const drivers: Array<{ text: string; delta: number }> = []
    const push = (text: string, delta: number) => { s += delta; drivers.push({ text, delta }) }

    if (def.houses.includes(moonLagnaHouse)) {
      const d = chandra.quality === 'good' ? 10 : chandra.quality === 'bad' ? -10 : 3
      push(hi
        ? fill(H.areaMoon, { nth: nth(moonLagnaHouse), state: chandra.quality === 'bad' ? H.strained : H.supported })
        : `Moon activates your ${ordinal(moonLagnaHouse)} house (${chandra.quality === 'bad' ? 'strained' : 'supported'})`, d)
    }
    for (const pid of SLOW_PLANETS) {
      const t = transitBy(pid)
      if (!t) continue
      const h = houseFrom(t.rashi, lagna)
      if (!def.houses.includes(h)) continue
      let d = 0
      if (pid === 'Ju') d = 6
      else if (pid === 'Ve') d = 4
      else if (pid === 'Me') d = 2
      else if (UPACHAYA.has(h)) d = pid === 'Su' ? 2 : 3
      else d = pid === 'Su' ? -2 : -4
      push(hi ? fill(H.areaTransit, { planet: gName(pid), nth: nth(h) }) : `${GRAHA_NAMES[pid]} transits your ${ordinal(h)} house`, d)
    }
    for (const k of def.karakas) {
      if (k === 'Mo') {
        push(hi
          ? fill(H.areaChandra, { area: areaLabel, state: chandra.quality === 'good' ? H.chandraSupports : chandra.quality === 'bad' ? H.chandraStrains : H.chandraNeutral })
          : `Chandra Bala ${chandra.quality === 'good' ? 'supports' : chandra.quality === 'bad' ? 'strains' : 'is neutral for'} ${def.label.toLowerCase()}`,
          chandra.quality === 'good' ? 5 : chandra.quality === 'bad' ? -5 : 0)
        continue
      }
      const st = gocharStatusOf[k]
      if (!st) continue
      push(hi
        ? fill(H.areaKaraka, { planet: gName(k), state: st === 'favourable' ? H.favourable : st === 'vedha' ? H.obstructed : H.unfavourable })
        : `${GRAHA_NAMES[k]} (karaka) is ${st === 'favourable' ? 'favourable' : st === 'vedha' ? 'obstructed' : 'unfavourable'} in gochar`,
        st === 'favourable' ? 5 : st === 'unfavourable' ? -5 : -1)
    }
    const finalScore = Math.round(clamp(s, 8, 95))
    const verdict: AreaScore['verdict'] =
      finalScore >= 68 ? 'Favourable' : finalScore >= 55 ? 'Good' : finalScore >= 42 ? 'Neutral' : 'Careful'
    const top = drivers
      .filter(d => d.delta !== 0)
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 2)
      .map(d => d.text)
    return { id: def.id, label: areaLabel, score: finalScore, verdict, verdictLabel: hi ? H.verdict[verdict] : verdict, drivers: top }
  })

  // ── 8. Timing windows ─────────────────────────────────────
  const avoidSpans: Array<{ label: string; span: Span }> = [
    { label: hi ? H.rahu : 'Rahu Kalam', span: { start: ms(panchang.rahuKalam.start), end: ms(panchang.rahuKalam.end) } },
    { label: hi ? H.yamaganda : 'Yamaganda', span: { start: ms(panchang.yamaganda.start), end: ms(panchang.yamaganda.end) } },
    { label: hi ? H.gulika : 'Gulika Kalam', span: { start: ms(panchang.gulikaKalam.start), end: ms(panchang.gulikaKalam.end) } },
  ].filter(a => Number.isFinite(a.span.start) && Number.isFinite(a.span.end))
  const avoid = avoidSpans
    .filter(a => a.span.end > nowMs)
    .sort((a, b) => a.span.start - b.span.start)
    .map(a => toWindow(a.label, a.span, nowMs))

  const good: TimedWindow[] = []
  const abhijit = panchang.abhijitMuhurta
  if (abhijit && ms(abhijit.end) > nowMs) {
    good.push(toWindow(hi ? H.abhijit : 'Abhijit Muhurta', { start: ms(abhijit.start), end: ms(abhijit.end) }, nowMs, hi ? H.abhijitNote : 'Midday window that is classically resistant to most doshas'))
  }
  const slots = [...(panchang.choghadiya?.day ?? []), ...(panchang.choghadiya?.night ?? [])]
  for (const slot of slots) {
    if (slot.quality !== 'good') continue
    const base: Span = { start: Math.max(ms(slot.start), nowMs), end: ms(slot.end) }
    if (!(base.end > base.start)) continue
    for (const part of subtractSpans(base, avoidSpans.map(a => a.span))) {
      if (part.end - part.start < MIN_WINDOW_MS) continue
      good.push(hi
        ? toWindow(fill(H.chogSlot, { name: termHi(slot.name) }), part, nowMs, H.chogNote)
        : toWindow(`${slot.name} choghadiya`, part, nowMs, 'Good slot, clear of Rahu / Yamaganda / Gulika'))
    }
  }
  good.sort((a, b) => ms(a.startIso) - ms(b.startIso))

  // Personal horas: hora lords that are strong in the natal chart and in gochar
  const horaRows = (panchang.horaTable ?? []).filter(h => ms(h.end) > nowMs)
  const scoredHoras = horaRows.map(h => {
    const g = natalBy(h.lord)
    let hs = g ? clamp(natalStrength(g, lagna), -3, 3) : 0
    const st = isGocharPlanet(h.lord) ? gocharStatusOf[h.lord] : undefined
    hs += st === 'favourable' ? 1 : st === 'unfavourable' ? -1 : 0
    if (h.lord === 'Mo') hs += chandra.quality === 'good' ? 1 : chandra.quality === 'bad' ? -1 : 0
    if (NATURAL_BENEFIC.has(h.lord)) hs += 1
    return { h, hs }
  })
  const bestHoras = [...scoredHoras]
    .filter(x => x.hs >= 2)
    .sort((a, b) => b.hs - a.hs || ms(a.h.start) - ms(b.h.start))
    .slice(0, 3)
    .sort((a, b) => ms(a.h.start) - ms(b.h.start))
    .map(x => toWindow(hi ? fill(H.hora, { planet: gName(x.h.lord) }) : `${GRAHA_NAMES[x.h.lord]} hora`, { start: ms(x.h.start), end: ms(x.h.end) }, nowMs, horaHint(x.h.lord, lang)))
  const curHoraRow = (panchang.horaTable ?? []).find(h => nowMs >= ms(h.start) && nowMs < ms(h.end))
  const currentHora = curHoraRow
    ? toWindow(hi ? fill(H.hora, { planet: gName(curHoraRow.lord) }) : `${GRAHA_NAMES[curHoraRow.lord]} hora`, { start: ms(curHoraRow.start), end: ms(curHoraRow.end) }, nowMs, horaHint(curHoraRow.lord, lang))
    : null

  // ── 9. Do / avoid / remedy ────────────────────────────────
  const ranked = [...areas].sort((a, b) => b.score - a.score)
  const bestArea = ranked[0]
  const lowArea = ranked[ranked.length - 1]

  const doList: string[] = []
  const avoidList: string[] = []
  if (tara.advice) (tara.isHard ? avoidList : doList).push(tara.advice)
  if (tara.trap) avoidList.push(tara.trap)
  if (bestArea.score >= 58) {
    doList.push(hi
      ? fill(H.doBest, { area: bestArea.label, score: bestArea.score })
      : `Put your important effort into ${bestArea.label.toLowerCase()} — it is the best-supported area today (${bestArea.score}).`)
  }
  if (lowArea.score < 45) {
    avoidList.push(hi
      ? fill(H.avoidLow, { area: lowArea.label, score: lowArea.score })
      : `Go slowly with ${lowArea.label.toLowerCase()} today (${lowArea.score}); postpone irreversible decisions there.`)
  }
  doList.push(hi ? fill(H.doVara, { vara: vaar.name, bestFor: vaar.bestFor }) : `Best for today's ${vaar.name}: ${vaar.bestFor.toLowerCase()}.`)
  if (tithiGood) doList.push(tithiMeta.group.dayGuidance)
  if (chandra.quality === 'bad') avoidList.push(hi ? H.avoidMoon : 'Avoid arguments and emotional decisions while the Moon is tense for you; delay replies if you feel reactive.')
  if (karana.isBhadra) avoidList.push(hi ? H.avoidBhadra : 'Do not start new ventures while Vishti (Bhadra) karana runs; routine work is fine.')
  if (isRikta) avoidList.push(hi ? H.avoidRikta : 'Rikta tithi: avoid launching auspicious beginnings; finish and clear things instead.')
  if (saturn.phase === 'ashtama' || saturn.phase === 'sade_sati') avoidList.push(hi ? H.avoidSaturn : 'Skip risky bets and confrontations; steady, disciplined effort pays better under Saturn.')
  avoidList.push(hi ? fill(H.avoidVara, { challenge: vaar.challenge }) : `Vara caution: ${vaar.challenge.toLowerCase()}.`)

  const remedies = hi ? PLANET_REMEDIES_HI : PLANET_REMEDIES
  const varaRemedy = remedies[panchang.vara.lord]
  const extra: TodayReading['remedy']['extra'] = []
  if (chandra.quality === 'bad' && remedies.Mo) {
    extra.push({ reason: hi ? H.remedyMoon : 'Moon is tense for you today', name: hi ? H.moonName : 'Moon', remedy: remedies.Mo })
  }
  const antar = dasha.find(d => d.level === 2)
  if (antar && antar.tone === 'challenging' && remedies[antar.lord]) {
    extra.push({
      reason: hi ? fill(H.remedyAntar, { lord: antar.lordName }) : `${antar.lordName} (Antardasha lord) is under strain`,
      name: antar.lordName,
      remedy: remedies[antar.lord] as PlanetRemedy,
    })
  }

  // ── 10. Narrative ─────────────────────────────────────────
  const narrative: string[] = []
  const labelText = hi ? LABEL_HI[label] : label
  narrative.push(hi
    ? fill(H.narrativeMoon, {
        label: labelText, score, rashi: rName(tMoon.rashi), nak: moon.nakshatraName, nth: nth(chandraPos),
        bala: chandra.quality === 'good' ? H.balaGood : chandra.quality === 'bad' ? H.balaBad : H.balaAvg,
        lagnaNth: nth(moonLagnaHouse), theme: moon.lagnaTheme,
      })
    : `${label} day (${score}/100). The Moon in ${RASHI_NAMES[tMoon.rashi]} (${moon.nakshatraName}) is ${ordinal(chandraPos)} from your natal Moon — ${chandra.quality === 'good' ? 'a supportive Chandra Bala' : chandra.quality === 'bad' ? 'a demanding Chandra Bala' : 'a neutral Chandra Bala'} — and moves through your ${ordinal(moonLagnaHouse)} house of ${moon.lagnaTheme}.`,
  )
  narrative.push(hi
    ? fill(H.narrativeTara, { name: tara.name, label: tara.label, advice: tara.advice })
    : `${tara.name} tara (${tara.label.toLowerCase()}): ${tara.advice}`)
  narrative.push(hi
    ? fill(H.narrativePanchang, {
        vara: vaar.name, lord: vaar.lordName, paksha: pakshaName, tithi: tithiMeta.name, group: tithiMeta.group.label,
        yoga: yogaName, bhadra: karana.isBhadra ? H.bhadraRunning : '',
      })
    : `Panchang: ${vaar.name} (${vaar.lordName}), ${tithi.paksha === 'shukla' ? 'Shukla' : 'Krishna'} ${tithiMeta.name} (${tithiMeta.group.id}), ${yoga.name} yoga${karana.isBhadra ? ', with Vishti (Bhadra) karana running' : ''}.`,
  )
  const lead = dasha.find(d => d.level === 3) ?? dasha.find(d => d.level === 2) ?? dasha[0]
  if (lead) {
    narrative.push(hi
      ? fill(H.narrativeDasha, {
          chain: dasha.map(d => d.lordName).join(' › '), lord: lead.lordName, level: lead.levelLabel,
          state: lead.tone === 'supportive' ? H.dashaStateGood : lead.tone === 'challenging' ? H.dashaStateBad : H.dashaStateMixed,
        })
      : `Running dasha ${dasha.map(d => d.lordName).join(' › ')}: ${lead.lordName} (${lead.levelLabel}) is ${lead.tone === 'supportive' ? 'well placed and backs you' : lead.tone === 'challenging' ? 'under strain, so expect slower results' : 'mixed, so results depend on effort'}.`)
  }
  const strongest = [...gochar].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0]
  if (strongest && strongest.delta !== 0) {
    narrative.push(hi
      ? fill(H.narrativeTransit, { planet: strongest.planetName, rashi: strongest.rashiName, nth: nth(strongest.fromMoon), status: GOCHAR_STATUS_HI[strongest.status] ?? strongest.status })
      : `Strongest background transit: ${strongest.planetName} in ${strongest.rashiName}, ${ordinal(strongest.fromMoon)} from your Moon (${strongest.status}).`)
  }
  if (bestArea && lowArea && bestArea.score - lowArea.score >= 8) {
    narrative.push(hi
      ? fill(H.narrativeAreas, { best: bestArea.label, bestScore: bestArea.score, low: lowArea.label, lowScore: lowArea.score })
      : `Best-supported today: ${bestArea.label} (${bestArea.score}). Go slower with ${lowArea.label} (${lowArea.score}).`)
  }

  const headline = hi ? H.headline[label] :
    label === 'Excellent' ? 'A strongly supported day: act on what matters'
      : label === 'Good' ? 'A favourable day: steady progress is likely'
        : label === 'Balanced' ? 'A mixed day: choose your battles'
          : label === 'Cautious' ? 'A sensitive day: slow down and keep it simple'
            : 'A demanding day: protect your energy and delay big moves'

  return {
    generatedAtIso: now.toISOString(),
    score,
    label,
    labelText,
    headline,
    narrative,
    moon,
    tara,
    panchang: panchangItems,
    saturn,
    dasha,
    gochar,
    triggers: topTriggers,
    areas,
    windows: { good: good.slice(0, 5), avoid, horas: bestHoras, currentHora },
    supportive: supportive.slice(0, 8),
    caution: caution.slice(0, 8),
    doList: doList.slice(0, 5),
    avoidList: avoidList.slice(0, 5),
    remedy: {
      vara: { lord: panchang.vara.lord, name: vaar.lordName, remedy: varaRemedy as PlanetRemedy },
      extra,
    },
  }
}