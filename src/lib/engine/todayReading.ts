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
import { getVaarMeta, HORA_PURPOSE_HINTS } from '@/lib/engine/vaarMeta'
import { calcChandraBala } from '@/lib/engine/muhurtaPersonal'
import { getTaraFromBirth, type TaraTone } from '@/lib/engine/navtaraPrediction'
import { getDashaPathAt } from '@/lib/engine/dasha/current'
import { HOUSE_THEMES, RASHI_LORDS, getPlanetInHouse } from '@/lib/engine/houseInterpretations'
import { PLANET_REMEDIES, type PlanetRemedy } from '@/lib/engine/dashboardInsights'
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

function horaHint(lord: GrahaId): string {
  const hits = HORA_PURPOSE_HINTS.filter(h => h.lords.includes(lord)).map(h => h.purpose.toLowerCase())
  return hits.length ? `suited to ${hits.slice(0, 2).join(' and ')}` : 'general activity'
}

// ── Main builder ─────────────────────────────────────────────

export function buildTodayReading(input: BuildTodayReadingInput): TodayReading | null {
  const { natal, transit, panchang } = input
  const now = input.now ?? new Date()
  const nowMs = now.getTime()

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
      toRashiName: RASHI_NAMES[toRashi],
      toChandraPosition: toChandra.position,
      toChandraQuality: toChandra.quality,
    }
  }

  const chandraNote =
    chandra.quality === 'good'
      ? 'Chandra Bala supports you: steadier mind, easier dealings with people.'
      : chandra.quality === 'bad'
        ? 'Chandra Bala is demanding: emotions run closer to the surface, so slow down big reactions.'
        : 'Chandra Bala is neutral: neither lifted nor weighed down by the Moon.'

  let score = 50
  const chandraDelta = chandra.quality === 'good' ? 12 : chandra.quality === 'bad' ? -14 : 0
  score += chandraDelta
  if (chandra.quality === 'good') supportive.push(`Chandra Bala: Moon ${ordinal(chandraPos)} from your natal Moon`)
  if (chandra.quality === 'bad') caution.push(`Chandra Bala: Moon ${ordinal(chandraPos)} from your natal Moon`)

  const moon: MoonDay = {
    rashi: tMoon.rashi,
    rashiName: RASHI_NAMES[tMoon.rashi],
    nakshatraName: tMoon.nakshatraName || NAKSHATRA_NAMES[tMoon.nakshatraIndex],
    pada: tMoon.pada,
    chandraPosition: chandraPos,
    chandraQuality: chandra.quality,
    chandraNote,
    lagnaHouse: moonLagnaHouse,
    lagnaTheme: houseTheme(moonLagnaHouse),
    overNatal,
    signChange,
  }

  // ── 2. Tara Bala from the Moon's nakshatra ────────────────
  const taraProfile = getTaraFromBirth(nMoon.nakshatraIndex, tMoon.nakshatraIndex)
  const taraDelta =
    taraProfile.tone === 'supportive' ? 10
      : taraProfile.tone === 'transformative' ? 5
        : taraProfile.tone === 'challenging' ? -12 : 0
  score += taraDelta
  if (taraDelta > 0) supportive.push(`Tara Bala: ${taraProfile.name} (${taraProfile.shortLabel.toLowerCase()})`)
  if (taraDelta < 0) caution.push(`Tara Bala: ${taraProfile.name} (${taraProfile.shortLabel.toLowerCase()})`)
  const tara: TaraDay = {
    name: taraProfile.name,
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
  const tithiMeta = getTithiDayMeta(tithi.number)
  const yogaMeta = getYogaMeta(yoga.name)
  const karanaMeta = getKaranaMeta(karana.name)
  const nakMeta = getNakshatraMuhurtaMeta(tMoon.nakshatraIndex, tMoon.pada)
  const vaar = getVaarMeta(panchang.vara.number)
  const vaarLordNatal = natalBy(panchang.vara.lord)

  let panchangDelta = 0
  const panchangItems: PanchangItem[] = []

  const vaarStrength = vaarLordNatal ? natalStrength(vaarLordNatal, lagna) : 0
  const vaarQuality: Quality = vaarStrength >= 2 ? 'good' : vaarStrength <= -2 ? 'caution' : 'mixed'
  panchangDelta += clamp(vaarStrength, -3, 3)
  panchangItems.push({
    key: 'vara',
    label: 'Vara',
    value: `${vaar.name} · ${vaar.lordName}`,
    quality: vaarQuality,
    note: vaarLordNatal
      ? `${vaar.lordName} rules the day and sits in your ${ordinal(houseFrom(vaarLordNatal.rashi, lagna))} house (${vaarLordNatal.dignity.replace('_', ' ')}). ${vaar.dayGuidance}`
      : vaar.dayGuidance,
  })

  const tithiGood = tithiMeta.group.nature === 'shubh'
  const isRikta = tithiMeta.group.id === 'Rikta'
  panchangDelta += tithiGood ? 3 : isRikta ? -4 : -3
  panchangItems.push({
    key: 'tithi',
    label: 'Tithi',
    value: `${tithi.paksha === 'shukla' ? 'Shukla' : 'Krishna'} ${tithiMeta.name}`,
    quality: tithiGood ? 'good' : 'caution',
    note: `${tithiMeta.group.id} tithi (${tithiMeta.group.meaning.toLowerCase()}). ${tithiMeta.group.dayGuidance}`,
  })

  const nakGroup = nakMeta.group.id
  const nakGood = nakGroup === 'Dhruva' || nakGroup === 'Mridu' || nakGroup === 'Laghu'
  const nakHard = nakGroup === 'Ugra' || nakGroup === 'Tikshna'
  panchangDelta += nakGood ? 2 : nakHard ? -2 : 0
  panchangItems.push({
    key: 'nakshatra',
    label: 'Nakshatra',
    value: `${nakMeta.name} · Pada ${tMoon.pada}`,
    quality: nakGood ? 'good' : nakHard ? 'caution' : 'mixed',
    note: `${nakMeta.group.label}: ${nakMeta.group.goodFor}.`,
  })

  const yogaQuality: Quality =
    yoga.quality === 'auspicious' ? 'good' : yoga.quality === 'inauspicious' ? 'caution' : 'mixed'
  panchangDelta += yoga.quality === 'auspicious' ? 3 : yoga.quality === 'inauspicious' ? -4 : 0
  panchangItems.push({
    key: 'yoga',
    label: 'Yoga',
    value: yoga.name,
    quality: yogaQuality,
    note: yogaMeta ? `${yogaMeta.meaning}. ${yogaMeta.dayGuidance}` : 'Sun–Moon yoga of the moment.',
  })

  panchangDelta += karana.isBhadra ? -4 : 0
  panchangItems.push({
    key: 'karana',
    label: 'Karana',
    value: karana.isBhadra ? `${karana.name} (Bhadra)` : karana.name,
    quality: karana.isBhadra ? 'caution' : 'mixed',
    note: karanaMeta
      ? `${karanaMeta.meaning}. ${karanaMeta.dayGuidance}`
      : 'Half-tithi of the moment.',
  })

  panchangDelta = clamp(panchangDelta, -12, 12)
  score += panchangDelta
  for (const it of panchangItems) {
    if (it.quality === 'good' && it.key !== 'vara') supportive.push(`${it.label}: ${it.value}`)
    if (it.quality === 'caution') caution.push(`${it.label}: ${it.value}`)
  }
  if (vaarQuality === 'good') supportive.push(`Vara lord ${vaar.lordName} is strong in your chart`)
  if (vaarQuality === 'caution') caution.push(`Vara lord ${vaar.lordName} is weak in your chart`)

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

    const where = `${ordinal(ev.houseFromMoon)} from your Moon`
    const statusText =
      ev.status === 'favourable' ? 'a supportive position'
        : ev.status === 'vedha'
          ? `normally supportive, but obstructed by ${GRAHA_NAMES[ev.vedhaBy as GocharPlanet]} (Vedha)`
          : 'a testing position'
    const flavour = firstSentence(getPlanetInHouse(pid, fromLagna, 'summary'))
    gochar.push({
      planet: pid,
      planetName: GRAHA_NAMES[pid],
      rashiName: RASHI_NAMES[t.rashi],
      fromMoon: ev.houseFromMoon,
      fromLagna,
      status: ev.status,
      isRetro: t.isRetro && pid !== 'Ra' && pid !== 'Ke',
      note: `${where}: ${statusText}.${flavour ? ` ${ordinal(fromLagna)} from Lagna — ${flavour}` : ''}`,
      delta,
    })
    if (ev.status === 'favourable' && w >= 3) supportive.push(`${GRAHA_NAMES[pid]} transits ${where}`)
    if (ev.status === 'unfavourable' && w >= 3) caution.push(`${GRAHA_NAMES[pid]} transits ${where}`)
  }
  gocharDelta = clamp(gocharDelta, -14, 14)
  score += gocharDelta

  // Saturn phase relative to the Moon (Sade Sati / Kantaka / Ashtama)
  const satFromMoon = housesFromMoon.Sa ?? 0
  const saturn: TodayReading['saturn'] =
    satFromMoon === 12 || satFromMoon === 1 || satFromMoon === 2
      ? {
          fromMoon: satFromMoon,
          phase: 'sade_sati',
          note: `Saturn is ${ordinal(satFromMoon)} from your Moon: Sade Sati ${satFromMoon === 12 ? 'rising' : satFromMoon === 1 ? 'peak' : 'setting'} phase. Favour patience and routine over haste.`,
        }
      : satFromMoon === 4
        ? { fromMoon: 4, phase: 'kantaka', note: 'Saturn is 4th from your Moon (Kantaka Shani): domestic and emotional pressure; keep home matters steady.' }
        : satFromMoon === 8
          ? { fromMoon: 8, phase: 'ashtama', note: 'Saturn is 8th from your Moon (Ashtama Shani): avoid risky commitments and conflict; protect health.' }
          : { fromMoon: satFromMoon, phase: 'clear', note: 'No Sade Sati, Kantaka or Ashtama Shani right now.' }
  if (saturn.phase === 'sade_sati') caution.push(`Sade Sati active (Saturn ${ordinal(satFromMoon)} from Moon)`)
  if (saturn.phase === 'ashtama') caution.push('Ashtama Shani (Saturn 8th from Moon)')

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
      gocharText = `Today the Moon is ${ordinal(chandraPos)} from your natal Moon.`
    } else if (isGocharPlanet(lord)) {
      const st = gocharStatusOf[lord]
      gocharAdj = st === 'favourable' ? 1 : st === 'unfavourable' ? -1 : 0
      const tt = transitBy(lord)
      if (tt) gocharText = `Today it transits ${ordinal(houseFrom(tt.rashi, nMoon.rashi))} from your Moon (${st ?? 'neutral'}).`
    }

    const total = strength + gocharAdj
    const tone: DashaDay['tone'] = total >= 2 ? 'supportive' : total <= -2 ? 'challenging' : 'mixed'
    dashaDelta += (clamp(total, -4, 4) / 4) * (DASHA_WEIGHT[level] ?? 1)

    const owned = RASHI_LORDS.filter(r => r.lord === lord).map(r => houseFrom(r.number, lagna)).sort((a, b) => a - b)
    const ownText = owned.length ? `, ruling your ${owned.map(ordinal).join(' and ')} ${owned.length > 1 ? 'houses' : 'house'}` : ''
    const natalHouse = houseFrom(g.rashi, lagna)
    const levelLabel = LEVEL_LABEL[level] ?? `Level ${level}`
    dasha.push({
      level,
      levelLabel,
      lord,
      lordName: GRAHA_NAMES[lord],
      tone,
      note: `${GRAHA_NAMES[lord]} is in ${RASHI_NAMES[g.rashi]} (${g.dignity.replace('_', ' ')}), your ${ordinal(natalHouse)} house${ownText}. ${gocharText}`.trim(),
    })
    if (level >= 2 && level <= 3 && tone === 'supportive') supportive.push(`${levelLabel} lord ${GRAHA_NAMES[lord]} is well placed`)
    if (level >= 2 && level <= 3 && tone === 'challenging') caution.push(`${levelLabel} lord ${GRAHA_NAMES[lord]} is under strain`)
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
      const natalName = target.id === 'Asc' ? 'your Ascendant' : `natal ${GRAHA_NAMES[target.id]}`
      const themes = NATAL_THEMES[target.id]
      const verb = aspect === 'conjunction' ? 'conjoins' : 'opposes'
      const tone =
        nature === 'supportive' ? `a supportive touch on ${themes}`
          : nature === 'pressure' ? `pressure and tests around ${themes}`
            : `${themes} come into focus`
      triggers.push({
        transit: t.id,
        natal: target.id,
        aspect,
        orb: Math.round(orb * 10) / 10,
        nature,
        text: `Transit ${GRAHA_NAMES[t.id]} ${verb} ${natalName} (${orb.toFixed(1)}° orb) — ${tone}.`,
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
    if (tr.nature === 'supportive') supportive.push(`Transit ${GRAHA_NAMES[tr.transit]} on ${tr.natal === 'Asc' ? 'Ascendant' : GRAHA_NAMES[tr.natal]}`)
    if (tr.nature === 'pressure') caution.push(`Transit ${GRAHA_NAMES[tr.transit]} on ${tr.natal === 'Asc' ? 'Ascendant' : GRAHA_NAMES[tr.natal]}`)
  }

  score = Math.round(clamp(score, 8, 94))
  const label = labelFor(score)

  // ── 7. Life-area scores ───────────────────────────────────
  const dayBase = clamp(chandraDelta + taraDelta + panchangDelta, -25, 25)
  const areas: AreaScore[] = AREAS.map(def => {
    let s = 50 + dayBase * 0.45
    const drivers: Array<{ text: string; delta: number }> = []
    const push = (text: string, delta: number) => { s += delta; drivers.push({ text, delta }) }

    if (def.houses.includes(moonLagnaHouse)) {
      const d = chandra.quality === 'good' ? 10 : chandra.quality === 'bad' ? -10 : 3
      push(`Moon activates your ${ordinal(moonLagnaHouse)} house (${chandra.quality === 'bad' ? 'strained' : 'supported'})`, d)
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
      push(`${GRAHA_NAMES[pid]} transits your ${ordinal(h)} house`, d)
    }
    for (const k of def.karakas) {
      if (k === 'Mo') {
        push(`Chandra Bala ${chandra.quality === 'good' ? 'supports' : chandra.quality === 'bad' ? 'strains' : 'is neutral for'} ${def.label.toLowerCase()}`,
          chandra.quality === 'good' ? 5 : chandra.quality === 'bad' ? -5 : 0)
        continue
      }
      const st = gocharStatusOf[k]
      if (!st) continue
      push(`${GRAHA_NAMES[k]} (karaka) is ${st === 'favourable' ? 'favourable' : st === 'vedha' ? 'obstructed' : 'unfavourable'} in gochar`,
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
    return { id: def.id, label: def.label, score: finalScore, verdict, drivers: top }
  })

  // ── 8. Timing windows ─────────────────────────────────────
  const avoidSpans: Array<{ label: string; span: Span }> = [
    { label: 'Rahu Kalam', span: { start: ms(panchang.rahuKalam.start), end: ms(panchang.rahuKalam.end) } },
    { label: 'Yamaganda', span: { start: ms(panchang.yamaganda.start), end: ms(panchang.yamaganda.end) } },
    { label: 'Gulika Kalam', span: { start: ms(panchang.gulikaKalam.start), end: ms(panchang.gulikaKalam.end) } },
  ].filter(a => Number.isFinite(a.span.start) && Number.isFinite(a.span.end))
  const avoid = avoidSpans
    .filter(a => a.span.end > nowMs)
    .sort((a, b) => a.span.start - b.span.start)
    .map(a => toWindow(a.label, a.span, nowMs))

  const good: TimedWindow[] = []
  const abhijit = panchang.abhijitMuhurta
  if (abhijit && ms(abhijit.end) > nowMs) {
    good.push(toWindow('Abhijit Muhurta', { start: ms(abhijit.start), end: ms(abhijit.end) }, nowMs, 'Midday window that is classically resistant to most doshas'))
  }
  const slots = [...(panchang.choghadiya?.day ?? []), ...(panchang.choghadiya?.night ?? [])]
  for (const slot of slots) {
    if (slot.quality !== 'good') continue
    const base: Span = { start: Math.max(ms(slot.start), nowMs), end: ms(slot.end) }
    if (!(base.end > base.start)) continue
    for (const part of subtractSpans(base, avoidSpans.map(a => a.span))) {
      if (part.end - part.start < MIN_WINDOW_MS) continue
      good.push(toWindow(`${slot.name} choghadiya`, part, nowMs, 'Good slot, clear of Rahu / Yamaganda / Gulika'))
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
    .map(x => toWindow(`${GRAHA_NAMES[x.h.lord]} hora`, { start: ms(x.h.start), end: ms(x.h.end) }, nowMs, horaHint(x.h.lord)))
  const curHoraRow = (panchang.horaTable ?? []).find(h => nowMs >= ms(h.start) && nowMs < ms(h.end))
  const currentHora = curHoraRow
    ? toWindow(`${GRAHA_NAMES[curHoraRow.lord]} hora`, { start: ms(curHoraRow.start), end: ms(curHoraRow.end) }, nowMs, horaHint(curHoraRow.lord))
    : null

  // ── 9. Do / avoid / remedy ────────────────────────────────
  const ranked = [...areas].sort((a, b) => b.score - a.score)
  const bestArea = ranked[0]
  const lowArea = ranked[ranked.length - 1]

  const doList: string[] = []
  const avoidList: string[] = []
  if (tara.advice) (tara.isHard ? avoidList : doList).push(tara.advice)
  if (tara.trap) avoidList.push(tara.trap)
  if (bestArea.score >= 58) doList.push(`Put your important effort into ${bestArea.label.toLowerCase()} — it is the best-supported area today (${bestArea.score}).`)
  if (lowArea.score < 45) avoidList.push(`Go slowly with ${lowArea.label.toLowerCase()} today (${lowArea.score}); postpone irreversible decisions there.`)
  doList.push(`Best for today's ${vaar.name}: ${vaar.bestFor.toLowerCase()}.`)
  if (tithiGood) doList.push(tithiMeta.group.dayGuidance)
  if (chandra.quality === 'bad') avoidList.push('Avoid arguments and emotional decisions while the Moon is tense for you; delay replies if you feel reactive.')
  if (karana.isBhadra) avoidList.push('Do not start new ventures while Vishti (Bhadra) karana runs; routine work is fine.')
  if (isRikta) avoidList.push('Rikta tithi: avoid launching auspicious beginnings; finish and clear things instead.')
  if (saturn.phase === 'ashtama' || saturn.phase === 'sade_sati') avoidList.push('Skip risky bets and confrontations; steady, disciplined effort pays better under Saturn.')
  avoidList.push(`Vara caution: ${vaar.challenge.toLowerCase()}.`)

  const varaRemedy = PLANET_REMEDIES[panchang.vara.lord]
  const extra: TodayReading['remedy']['extra'] = []
  if (chandra.quality === 'bad' && PLANET_REMEDIES.Mo) {
    extra.push({ reason: 'Moon is tense for you today', name: 'Moon', remedy: PLANET_REMEDIES.Mo })
  }
  const antar = dasha.find(d => d.level === 2)
  if (antar && antar.tone === 'challenging' && PLANET_REMEDIES[antar.lord]) {
    extra.push({ reason: `${antar.lordName} (Antardasha lord) is under strain`, name: antar.lordName, remedy: PLANET_REMEDIES[antar.lord] as PlanetRemedy })
  }

  // ── 10. Narrative ─────────────────────────────────────────
  const narrative: string[] = []
  narrative.push(
    `${label} day (${score}/100). The Moon in ${RASHI_NAMES[tMoon.rashi]} (${moon.nakshatraName}) is ${ordinal(chandraPos)} from your natal Moon — ${chandra.quality === 'good' ? 'a supportive Chandra Bala' : chandra.quality === 'bad' ? 'a demanding Chandra Bala' : 'a neutral Chandra Bala'} — and moves through your ${ordinal(moonLagnaHouse)} house of ${moon.lagnaTheme}.`,
  )
  narrative.push(`${tara.name} tara (${tara.label.toLowerCase()}): ${tara.advice}`)
  narrative.push(
    `Panchang: ${vaar.name} (${vaar.lordName}), ${tithi.paksha === 'shukla' ? 'Shukla' : 'Krishna'} ${tithiMeta.name} (${tithiMeta.group.id}), ${yoga.name} yoga${karana.isBhadra ? ', with Vishti (Bhadra) karana running' : ''}.`,
  )
  const lead = dasha.find(d => d.level === 3) ?? dasha.find(d => d.level === 2) ?? dasha[0]
  if (lead) {
    narrative.push(`Running dasha ${dasha.map(d => d.lordName).join(' › ')}: ${lead.lordName} (${lead.levelLabel}) is ${lead.tone === 'supportive' ? 'well placed and backs you' : lead.tone === 'challenging' ? 'under strain, so expect slower results' : 'mixed, so results depend on effort'}.`)
  }
  const strongest = [...gochar].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0]
  if (strongest && strongest.delta !== 0) {
    narrative.push(`Strongest background transit: ${strongest.planetName} in ${strongest.rashiName}, ${ordinal(strongest.fromMoon)} from your Moon (${strongest.status}).`)
  }
  if (bestArea && lowArea && bestArea.score - lowArea.score >= 8) {
    narrative.push(`Best-supported today: ${bestArea.label} (${bestArea.score}). Go slower with ${lowArea.label} (${lowArea.score}).`)
  }

  const headline =
    label === 'Excellent' ? 'A strongly supported day: act on what matters'
      : label === 'Good' ? 'A favourable day: steady progress is likely'
        : label === 'Balanced' ? 'A mixed day: choose your battles'
          : label === 'Cautious' ? 'A sensitive day: slow down and keep it simple'
            : 'A demanding day: protect your energy and delay big moves'

  return {
    generatedAtIso: now.toISOString(),
    score,
    label,
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