// ─────────────────────────────────────────────────────────────
//  src/lib/engine/panchangVishesh.ts
//  Classical "vishesh" panchang layers built on the five limbs:
//  tithi strength (Sun/Moon panchak bala), Surya-rashi dagdha tithis,
//  Yugadi / Manvadi wildcard tithis, monthly parvas, esoteric tithis,
//  Krakacha, Dwi/Tri-pushkar, Yamaghanta, tithi–nakshatra doshas,
//  tithi–graha yutis, eclipse-season tithis, Tithyamsha, Vaar guna,
//  ghati/pal conversion and the 28 Anandadi yogas.
//
//  Pure functions only — no DB / React imports.
// ─────────────────────────────────────────────────────────────

import type { GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, NAKSHATRA_NAMES, RASHI_NAMES } from '@/types/astrology'
import {
  DEBILITATION_SIGN,
  NATURAL_ENEMIES,
  NATURAL_FRIENDS,
  getDignity,
} from '@/lib/engine/dignity'
import { getTithiDayMeta, lunarDayFromTithi } from '@/lib/engine/tithiMeta'
import { getVaarMeta, vaarPatiNakNote } from '@/lib/engine/vaarMeta'
import { GRAHA_HI, NAKSHATRA_HI, RASHI_HI } from '@/i18n/jyotish'
import { fill, type EngineLang } from '@/lib/engine/lang'
import {
  ANANDADI_HI,
  LEVEL_HI,
  MASA_LABEL_HI,
  PAKSHA_HI,
  PANCHAK_STATUS_HI,
  SENSITIVE_HI,
  STRENGTH_HI,
  TITHYAMSHA_HI,
  VAAR_GUNA_TRAITS_HI,
  VAAR_PATI_HI,
  WILDCARD_LABELS_HI,
  YOGAS_HI,
} from '@/lib/engine/locale/panchangVishesh.hi'

// ── Shared helpers ────────────────────────────────────────────

const NAK_SPAN = 360 / 27

function norm360(x: number): number {
  return ((x % 360) + 360) % 360
}

function rashiOf(lon: number): Rashi {
  return (Math.floor(norm360(lon) / 30) + 1) as Rashi
}

function degInSign(lon: number): number {
  return norm360(lon) % 30
}

function nakOf(lon: number): number {
  return Math.floor(norm360(lon) / NAK_SPAN) % 27
}

/** Shortest angular distance 0–180°. */
function angDist(a: number, b: number): number {
  const d = Math.abs(norm360(a) - norm360(b))
  return d > 180 ? 360 - d : d
}

/** House of `rashi` counted from `from` (1–12). */
function houseFrom(from: Rashi, rashi: Rashi): number {
  return ((rashi - from + 12) % 12) + 1
}

/** Display names in the requested language. */
function grahaName(id: GrahaId, lang: EngineLang): string {
  return lang === 'hi' ? GRAHA_HI[id] : GRAHA_NAMES[id]
}
function nakName(i: number, lang: EngineLang): string {
  return lang === 'hi' ? NAKSHATRA_HI[i] : NAKSHATRA_NAMES[i]
}
function rashiName(r: Rashi, lang: EngineLang): string {
  return lang === 'hi' ? RASHI_HI[r] : RASHI_NAMES[r]
}
function statusName(status: string, lang: EngineLang): string {
  return lang === 'hi' ? PANCHAK_STATUS_HI[status] ?? status : status
}

/** Translate a strength level ('strong' | 'moderate' | 'weak' | 'medium') for display. */
export function visheshLevelLabel(level: string, lang: EngineLang = 'en'): string {
  return lang === 'hi' ? LEVEL_HI[level] ?? level : level
}

/** Panchak status ('exalted', 'own'…) for display. */
export function panchakStatusLabel(status: string, lang: EngineLang = 'en'): string {
  return statusName(status, lang)
}

export type VisheshQuality = 'auspicious' | 'inauspicious' | 'mixed'

export type VisheshCategory =
  | 'tithi-vara'
  | 'tithi-nakshatra'
  | 'vara-nakshatra'
  | 'tithi-graha'
  | 'masa-tithi'
  | 'parva'
  | 'eclipse'

export interface VisheshYoga {
  id:       string
  label:    string
  quality:  VisheshQuality
  category: VisheshCategory
  detail:   string
}

// ── Lunar month (approximate amanta / purnimanta) ─────────────

/** Amanta month index 0 = Chaitra … 11 = Phalguna. */
export const LUNAR_MASA_NAMES = [
  'Chaitra', 'Vaishakha', 'Jyeshtha', 'Ashadha', 'Shravana', 'Bhadrapada',
  'Ashvina', 'Kartika', 'Margashirsha', 'Pausha', 'Magha', 'Phalguna',
] as const

export type LunarMasa = typeof LUNAR_MASA_NAMES[number]

export interface LunarMonthInfo {
  /** Month that began at the previous new moon (South / West Indian reckoning) */
  amanta:     LunarMasa
  /** North Indian reckoning — Krishna paksha belongs to the next month's name */
  purnimanta: LunarMasa
  /** Name used for festival rules (purnimanta for Krishna paksha, as taught) */
  festivalMasa: LunarMasa
  approximate: true
}

/**
 * Approximate lunar month from Sun–Moon elongation. The Sun's longitude at the
 * preceding new moon is back-projected (~0.9856°/day over elongation ÷ 12.19°/day).
 * Adhika masa and sign-edge new moons are not resolved — label as indicative.
 */
export function getLunarMonth(sunLon: number, moonLon: number): LunarMonthInfo {
  const elong = norm360(moonLon - sunLon)
  const daysSinceNewMoon = elong / 12.19
  const sunAtNewMoon = norm360(sunLon - daysSinceNewMoon * 0.9856)
  // Sun in Mina (12) at new moon → Chaitra; Mesha (1) → Vaishakha …
  const amantaIdx = rashiOf(sunAtNewMoon) % 12
  const isKrishna = elong >= 180
  const purnimantaIdx = isKrishna ? (amantaIdx + 1) % 12 : amantaIdx
  return {
    amanta: LUNAR_MASA_NAMES[amantaIdx],
    purnimanta: LUNAR_MASA_NAMES[purnimantaIdx],
    festivalMasa: LUNAR_MASA_NAMES[purnimantaIdx],
    approximate: true,
  }
}

// ── Ghati / pal conversion ───────────────────────────────────

/** 1 ghati = 24 min · 1 pal = 24 s · 60 pal = 1 ghati · 60 ghati = 1 vaar. */
export function ghatiPalToMinutes(ghati: number, pal: number = 0): number {
  return ghati * 24 + (pal * 24) / 60
}

export function minutesToGhatiPal(minutes: number): { ghati: number; pal: number } {
  const totalPal = Math.max(0, minutes) * 60 / 24
  const ghati = Math.floor(totalPal / 60)
  const pal = Math.round(totalPal - ghati * 60)
  return pal === 60 ? { ghati: ghati + 1, pal: 0 } : { ghati, pal }
}

// ── Tithyamsha (15 parts of a tithi) ─────────────────────────

export interface TithyamshaInfo {
  /** 1–15 */
  part:        number
  /** Fraction of the current tithi elapsed (0–1) */
  fraction:    number
  auspicious:  boolean
  note:        string
}

const SHUBH_TITHYAMSHA = new Set([1, 3, 4, 7, 8, 11])

/** Each 12° tithi has 15 tithyamshas of 0.8° (≈ 95 min on an average tithi). */
export function getTithyamsha(sunLon: number, moonLon: number, lang: EngineLang = 'en'): TithyamshaInfo {
  const elong = norm360(moonLon - sunLon)
  const fraction = (elong % 12) / 12
  const part = Math.min(15, Math.floor(fraction * 15) + 1)
  const auspicious = SHUBH_TITHYAMSHA.has(part)
  const waning = elong >= 180
  const hi = lang === 'hi'
  let note = auspicious
    ? hi ? fill(TITHYAMSHA_HI.good, { part }) : `Tithyamsha ${part} is one of the classically favourable parts (1, 3, 4, 7, 8, 11).`
    : hi ? fill(TITHYAMSHA_HI.neutral, { part }) : `Tithyamsha ${part} is a neutral part — read the main tithi first.`
  if (auspicious && waning) note += hi ? TITHYAMSHA_HI.krishna : ' Krishna paksha softens this support somewhat.'
  return { part, fraction, auspicious, note }
}

// ── Vaar guna (Sattva / Rajas / Tamas every 4 ghatis) ────────

export type VaarGuna = 'Sattva' | 'Rajas' | 'Tamas'

const GUNA_CYCLE: VaarGuna[] = ['Sattva', 'Rajas', 'Tamas']

/** First 4-ghati slot after sunrise, by vara (0 = Sun … 6 = Sat). */
const FIRST_GUNA_BY_VARA: VaarGuna[] = ['Tamas', 'Sattva', 'Rajas', 'Tamas', 'Sattva', 'Rajas', 'Tamas']

export const VAAR_GUNA_TRAITS: Record<VaarGuna, string> = {
  Sattva: 'Self-control, simplicity, compassion; content with little, dislikes being lied to.',
  Rajas:  'Courage, daring and competitive spirit; patient under pressure, loyal to supporters.',
  Tamas:  'Self-interest, shrewdness and inertia; must guard against greed, manipulation and shortcuts.',
}

export interface VaarGunaInfo {
  guna:        VaarGuna
  /** `guna` in the requested language */
  gunaLabel:   string
  /** 1-based slot of 96 minutes from sunrise */
  slot:        number
  minutesFromSunrise: number
  ishtaGhati:  { ghati: number; pal: number }
  traits:      string
}

export function getVaarGuna(varaNumber: number, sunrise: Date, at: Date, lang: EngineLang = 'en'): VaarGunaInfo | null {
  const mins = (at.getTime() - sunrise.getTime()) / 60_000
  if (!Number.isFinite(mins) || mins < 0 || mins > 24 * 60 + 30) return null
  const vara = ((Math.floor(varaNumber) % 7) + 7) % 7
  const slot = Math.floor(mins / 96)
  const start = GUNA_CYCLE.indexOf(FIRST_GUNA_BY_VARA[vara])
  const guna = GUNA_CYCLE[(start + slot) % 3]
  return {
    guna,
    gunaLabel: lang === 'hi' ? { Sattva: 'सत्त्व', Rajas: 'रजस्', Tamas: 'तमस्' }[guna] : guna,
    slot: slot + 1,
    minutesFromSunrise: Math.round(mins),
    ishtaGhati: minutesToGhatiPal(mins),
    traits: lang === 'hi' ? VAAR_GUNA_TRAITS_HI[guna] : VAAR_GUNA_TRAITS[guna],
  }
}

// ── Panchak bala for Sun & Moon (tithi strength) ─────────────

export type PanchakStatus =
  | 'exalted' | 'moolatrikona' | 'own' | 'friend' | 'neutral' | 'enemy' | 'debilitated'

/** Shubh-phala percentages taught for each status. */
export const PANCHAK_SHUBH_PERCENT: Record<PanchakStatus, number> = {
  exalted: 100,
  moolatrikona: 75,
  own: 50,
  friend: 25,
  neutral: 12.5,
  enemy: 7,
  debilitated: 0,
}

const SIGN_LORD: Record<Rashi, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

export function getPanchakStatus(graha: GrahaId, lon: number): PanchakStatus {
  const r = rashiOf(lon)
  const dig = getDignity(graha, r, degInSign(lon))
  if (dig === 'exalted' || dig === 'moolatrikona' || dig === 'own' || dig === 'debilitated') return dig
  const lord = SIGN_LORD[r]
  if (lord === graha) return 'own'
  if (NATURAL_FRIENDS[graha]?.includes(lord)) return 'friend'
  if (NATURAL_ENEMIES[graha]?.includes(lord)) return 'enemy'
  return 'neutral'
}

/** Param-neecha spans taught for tithi: Moon Vrishchika 0–3°, Sun Tula 0–10°. */
function isParamNeecha(graha: 'Su' | 'Mo', lon: number): boolean {
  const r = rashiOf(lon)
  if (DEBILITATION_SIGN[graha] !== r) return false
  const d = degInSign(lon)
  return graha === 'Mo' ? d <= 3 : d <= 10
}

export interface StrengthFactor {
  label:  string
  effect: 'plus' | 'minus'
  detail: string
}

export interface TithiStrengthResult {
  level:   'strong' | 'moderate' | 'weak'
  /** 0–100 indicative score */
  score:   number
  moonPanchak: PanchakStatus
  sunPanchak:  PanchakStatus
  pakshaBala:  'strong' | 'medium' | 'weak'
  factors: StrengthFactor[]
  summary: string
}

export interface VisheshGraha {
  id:  GrahaId
  /** Sidereal longitude 0–360 */
  lon: number
}

const NATURAL_BENEFICS: GrahaId[] = ['Ju', 'Ve', 'Me']
const NATURAL_MALEFICS: GrahaId[] = ['Sa', 'Ma', 'Ra', 'Ke', 'Su']

/**
 * Indicative tithi strength. Moon is judged first (it creates the tithi);
 * Sun's panchak and the Moon's afflictions/supports adjust the score.
 */
export function getTithiStrength(input: {
  sunLon: number
  moonLon: number
  grahas?: VisheshGraha[]
  lagnaRashi?: Rashi | null
  /** Pre-computed vishesh yogas (Pushkar / Siddhi) that lift a weak tithi */
  supportiveYogas?: VisheshYoga[]
  lang?: EngineLang
}): TithiStrengthResult {
  const { sunLon, moonLon } = input
  const lang = input.lang ?? 'en'
  const hi = lang === 'hi'
  const H = STRENGTH_HI
  const elong = norm360(moonLon - sunLon)
  const factors: StrengthFactor[] = []

  // Paksha bala: Moon brightest near Purnima, weakest K-Chaturdashi → S-Pratipada.
  const brightness = elong <= 180 ? elong / 180 : (360 - elong) / 180
  const pakshaBala: TithiStrengthResult['pakshaBala'] =
    brightness >= 0.5 ? 'strong' : brightness >= 0.2 ? 'medium' : 'weak'
  if (pakshaBala === 'strong') {
    factors.push(hi ? { ...H.pakshaGood, effect: 'plus' } : { label: 'Paksha bala', effect: 'plus', detail: 'Moon is well lit (near or past the half-moon), so the tithi carries good strength.' })
  } else if (pakshaBala === 'weak') {
    factors.push(hi ? { ...H.pakshaWeak, effect: 'minus' } : { label: 'Weak paksha bala', effect: 'minus', detail: 'Moon is close to Amavasya (Krishna Chaturdashi to Shukla Pratipada window) — the mind-energy is drained.' })
  }
  if (elong < 180 && brightness < 0.2) {
    factors.push(hi ? { ...H.leavingAmavasya, effect: 'plus' } : { label: 'Moving out of Amavasya', effect: 'plus', detail: 'Moon has left the Sun and is waxing — weakness is easing, not deepening.' })
  }

  const moonPanchak = getPanchakStatus('Mo', moonLon)
  const sunPanchak = getPanchakStatus('Su', sunLon)
  const pctMoon = PANCHAK_SHUBH_PERCENT[moonPanchak]
  const pctSun = PANCHAK_SHUBH_PERCENT[sunPanchak]

  const ms = statusName(moonPanchak, lang)
  const ss = statusName(sunPanchak, lang)
  const moonLabel = hi ? fill(H.moonStatus, { status: ms }) : `Moon ${moonPanchak}`
  const sunLabel = hi ? fill(H.sunStatus, { status: ss }) : `Sun ${sunPanchak}`
  if (pctMoon >= 50) factors.push({ label: moonLabel, effect: 'plus', detail: hi ? fill(H.moonShubh, { status: ms, pct: pctMoon }) : `Moon in shubh panchak (${moonPanchak}) — about ${pctMoon}% shubh phala.` })
  if (pctMoon <= 7) factors.push({ label: moonLabel, effect: 'minus', detail: hi ? fill(H.moonAshubh, { status: ms, pct: 100 - pctMoon }) : `Moon in ashubh panchak (${moonPanchak}) — about ${100 - pctMoon}% ashubh phala.` })
  if (pctSun >= 50) factors.push({ label: sunLabel, effect: 'plus', detail: hi ? fill(H.sunShubh, { status: ss, pct: pctSun }) : `Sun in shubh panchak (${sunPanchak}) — about ${pctSun}% shubh phala.` })
  if (pctSun <= 7) factors.push({ label: sunLabel, effect: 'minus', detail: hi ? fill(H.sunAshubh, { status: ss, pct: 100 - pctSun }) : `Sun in ashubh panchak (${sunPanchak}) — about ${100 - pctSun}% ashubh phala.` })
  if (isParamNeecha('Mo', moonLon)) factors.push(hi ? { ...H.moonParam, effect: 'minus' } : { label: 'Moon param-neecha', effect: 'minus', detail: 'Moon within 0–3° Vrishchika — fully debilitated; tithi gives ashubh results unless lifted by yoga.' })
  else if (moonPanchak === 'debilitated') factors.push(hi ? { ...H.moonLeaving, effect: 'plus' } : { label: 'Moon leaving neecha', effect: 'plus', detail: 'Moon has crossed its deep-debilitation degree and is moving toward exaltation.' })
  if (isParamNeecha('Su', sunLon)) factors.push(hi ? { ...H.sunParam, effect: 'minus' } : { label: 'Sun param-neecha', effect: 'minus', detail: 'Sun within 0–10° Tula — fully debilitated.' })

  let score = 25 + brightness * 35 + pctMoon * 0.25 + pctSun * 0.15

  const grahas = input.grahas ?? []
  const byId = new Map(grahas.map((g) => [g.id, g]))
  const moonR = rashiOf(moonLon)

  // Rahu / Ketu with or close to the Moon
  for (const node of ['Ra', 'Ke'] as const) {
    const g = byId.get(node)
    if (!g) continue
    const d = angDist(g.lon, moonLon)
    if (rashiOf(g.lon) === moonR || d <= 12) {
      const ahead = norm360(g.lon - moonLon) < 30
      const nodeName = grahaName(node, lang)
      factors.push(hi
        ? {
            label: fill(H.nodeLabel, { node: nodeName }),
            effect: 'minus',
            detail: fill(H.nodeDetail, {
              node: nodeName,
              where: d <= 12 ? fill(H.nodeWithin, { deg: d.toFixed(1) }) : H.nodeSameSign,
              ahead: ahead ? H.nodeAhead : '',
            }),
          }
        : {
            label: `Moon with ${nodeName}`,
            effect: 'minus',
            detail: `${nodeName} ${d <= 12 ? `within ${d.toFixed(1)}°` : 'in the same sign'}${ahead ? ', ahead of the Moon' : ''} — grahan-like affliction weakens the tithi.`,
          })
      score -= d <= 12 ? 12 : 7
    }
  }

  // Moon in lagna / 6 / 8 / 12 while in ashubh panchak
  if (input.lagnaRashi) {
    const h = houseFrom(input.lagnaRashi, moonR)
    if ([1, 6, 8, 12].includes(h) && pctMoon <= 12.5) {
      factors.push(hi
        ? { label: fill(H.houseLabel, { h }), effect: 'minus', detail: fill(H.houseDetail, { house: h === 1 ? H.lagna : fill(H.nth, { h }) }) }
        : { label: `Moon in house ${h}`, effect: 'minus', detail: `Moon in the ${h === 1 ? 'lagna' : `${h}th`} while in ashubh panchak — sensitive birth tithi.` })
      score -= 6
    }
  }

  // Papa kartari (malefics on both sides of the Moon's sign) vs shubh kartari
  if (grahas.length) {
    const prev = (((moonR - 2 + 12) % 12) + 1) as Rashi
    const next = ((moonR % 12) + 1) as Rashi
    const inSign = (r: Rashi, list: GrahaId[]) => grahas.some((g) => list.includes(g.id) && g.id !== 'Mo' && rashiOf(g.lon) === r)
    if (inSign(prev, NATURAL_MALEFICS) && inSign(next, NATURAL_MALEFICS)) {
      factors.push(hi ? { ...H.papaKartari, effect: 'minus' } : { label: 'Papa kartari on Moon', effect: 'minus', detail: 'Malefics hem the Moon from both sides.' })
      score -= 8
    } else if (inSign(prev, NATURAL_BENEFICS) && inSign(next, NATURAL_BENEFICS)) {
      factors.push(hi ? { ...H.shubhKartari, effect: 'plus' } : { label: 'Shubh kartari on Moon', effect: 'plus', detail: 'Benefics on both sides of the Moon support the tithi.' })
      score += 8
    }
    const ju = byId.get('Ju')
    if (ju && (rashiOf(ju.lon) === moonR || houseFrom(rashiOf(ju.lon), moonR) === 7 || [5, 9].includes(houseFrom(rashiOf(ju.lon), moonR)))) {
      factors.push(hi ? { ...H.jupiter, effect: 'plus' } : { label: 'Jupiter supports Moon', effect: 'plus', detail: 'Jupiter conjoins or aspects the Moon (1/5/7/9) — Gaja-Kesari-type protection.' })
      score += 8
    }
  }

  const lifts = (input.supportiveYogas ?? []).filter((y) => y.quality === 'auspicious' && (y.id === 'dwipushkar' || y.id === 'tripushkar'))
  for (const y of lifts) {
    factors.push({ label: y.label, effect: 'plus', detail: hi ? H.pushkarLift : 'Even a weak tithi gains extra energy inside this yoga.' })
    score += 10
  }

  score = Math.round(Math.min(100, Math.max(0, score)))
  const level: TithiStrengthResult['level'] = score >= 60 ? 'strong' : score >= 38 ? 'moderate' : 'weak'
  const summary = hi ? H.summary[level] :
    level === 'strong'
      ? 'Tithi is well supported — its qualities show up clearly in temperament and timing.'
      : level === 'moderate'
        ? 'Tithi is of medium strength — read it together with the Moon and the dashas.'
        : 'Tithi is weak — Moon needs support; the tithi deity and remedies help, and the chart decides how much it shows.'

  return { level, score, moonPanchak, sunPanchak, pakshaBala, factors, summary }
}

// ── Vaar Pati strength ───────────────────────────────────────

export interface VaarPatiStrengthResult {
  lord:    GrahaId
  level:   'strong' | 'moderate' | 'weak'
  factors: StrengthFactor[]
}

/** Classical lagna yogakarakas (kendra + trikona lords). */
const YOGAKARAKA_BY_LAGNA: Partial<Record<Rashi, GrahaId[]>> = {
  2: ['Sa'], 4: ['Ma'], 5: ['Ma'], 7: ['Sa'], 10: ['Ve'], 11: ['Ve'],
}

export function getVaarPatiStrength(input: {
  varaNumber: number
  grahas: VisheshGraha[]
  lagnaRashi?: Rashi | null
  /** Navamsha rashi of the Vaar Pati, if known (for vargottama) */
  vaarPatiNavamshaRashi?: Rashi | null
  supportiveYogas?: VisheshYoga[]
  lang?: EngineLang
}): VaarPatiStrengthResult | null {
  const lang = input.lang ?? 'en'
  const hi = lang === 'hi'
  const V = VAAR_PATI_HI
  const vaar = getVaarMeta(input.varaNumber)
  const lordName = getVaarMeta(input.varaNumber, lang).lordName
  const g = input.grahas.find((x) => x.id === vaar.lord)
  if (!g) return null
  const factors: StrengthFactor[] = []
  let score = 0

  const status = getPanchakStatus(vaar.lord, g.lon)
  const statusLabel = `${lordName} ${statusName(status, lang)}`
  if (['exalted', 'moolatrikona', 'own', 'friend'].includes(status)) {
    factors.push({ label: statusLabel, effect: 'plus', detail: hi ? V.shubh : 'Vaar Pati in shubh panchak — the birth weekday supports you.' })
    score += 2
  } else if (status !== 'neutral') {
    factors.push({ label: statusLabel, effect: 'minus', detail: hi ? V.ashubh : 'Vaar Pati in ashubh panchak — more effort, delays and obstacles in that planet’s areas.' })
    score -= 2
  } else {
    factors.push(hi
      ? { label: fill(V.samaLabel, { lord: lordName }), effect: 'minus', detail: V.sama }
      : { label: `${lordName} sama rashi`, effect: 'minus', detail: 'Vaar Pati in a neutral sign — limited support.' })
    score -= 1
  }

  if (input.vaarPatiNavamshaRashi && input.vaarPatiNavamshaRashi === rashiOf(g.lon)) {
    factors.push(hi ? { ...V.vargottama, effect: 'plus' } : { label: 'Vargottama', effect: 'plus', detail: 'Same sign in D1 and D9 — Vaar Pati is steady and reliable.' })
    score += 2
  }

  if (input.lagnaRashi) {
    const h = houseFrom(input.lagnaRashi, rashiOf(g.lon))
    if ([1, 4, 7, 10, 5, 9].includes(h)) {
      factors.push({ label: hi ? fill(V.house, { h }) : `House ${h}`, effect: 'plus', detail: hi ? V.kendra : 'Vaar Pati in a kendra or trikona.' })
      score += 1
    } else if ([6, 8, 12].includes(h)) {
      const malefic = NATURAL_MALEFICS.includes(vaar.lord)
      if (malefic && status === 'debilitated') {
        factors.push({ label: hi ? fill(V.houseViparita, { h }) : `House ${h} (viparita)`, effect: 'plus', detail: hi ? V.viparita : 'A debilitated malefic in a dusthana can turn its results around.' })
        score += 1
      } else {
        factors.push({ label: hi ? fill(V.house, { h }) : `House ${h}`, effect: 'minus', detail: hi ? V.dusthana : 'Vaar Pati in a dusthana (6/8/12).' })
        score -= 1
      }
    }
    const karakas = YOGAKARAKA_BY_LAGNA[input.lagnaRashi] ?? []
    if (karakas.some((k) => k !== vaar.lord && input.grahas.some((x) => x.id === k && rashiOf(x.lon) === rashiOf(g.lon)))) {
      factors.push(hi ? { ...V.yogakaraka, effect: 'plus' } : { label: 'With yogakaraka', effect: 'plus', detail: 'Vaar Pati sits with the lagna’s yogakaraka.' })
      score += 1
    }
  }

  const nakNote = vaarPatiNakNote(input.varaNumber, nakOf(g.lon))
  if (nakNote) {
    // Decide from the English note; show the note in `lang`.
    const plus = nakNote.includes('strength')
    const shownNote = vaarPatiNakNote(input.varaNumber, nakOf(g.lon), lang) ?? nakNote
    const label = hi
      ? fill(V.nakLabel, { lord: lordName, nak: nakName(nakOf(g.lon), lang) })
      : `${lordName} in ${NAKSHATRA_NAMES[nakOf(g.lon)]}`
    factors.push({ label, effect: plus ? 'plus' : 'minus', detail: shownNote })
    score += plus ? 1 : -1
  }

  if ((input.supportiveYogas ?? []).some((y) => y.quality === 'auspicious' && /siddhi|pushkar/i.test(y.id))) {
    factors.push(hi ? { ...V.siddhi, effect: 'plus' } : { label: 'Birth inside a siddhi yoga', effect: 'plus', detail: 'Sarvartha / Amrit siddhi or Pushkar yoga at birth makes the Vaar Pati shubh.' })
    score += 1
  }

  const level: VaarPatiStrengthResult['level'] = score >= 2 ? 'strong' : score >= 0 ? 'moderate' : 'weak'
  return { lord: vaar.lord, level, factors }
}

// ── Rule tables ──────────────────────────────────────────────

/** Sun's rashi → lunar days (1–15, 15 = Purnima/Amavasya) that weaken the tithi. */
const SURYA_DAGDHA: Record<Rashi, number[]> = {
  1: [1, 5], 2: [2, 5], 3: [3, 5], 4: [4, 5],
  5: [6, 10], 6: [7, 10], 7: [8, 10], 8: [9, 10],
  9: [11, 15], 10: [12, 15], 11: [13, 15], 12: [14, 15],
}

/** Tithi (lunar day) → nakshatra indices that are classically inauspicious with it. */
const TITHI_NAK_DOSHA: Record<number, number[]> = {
  1: [20],            // Uttara Ashadha
  2: [16],            // Anuradha
  3: [11, 20, 25],    // the three Uttaras
  5: [9],             // Magha
  6: [3],             // Rohini
  7: [12, 18],        // Hasta / Mula
  8: [24],            // Purva Bhadrapada
  9: [2],             // Krittika
  11: [3],            // Rohini
  12: [8],            // Ashlesha
  13: [13, 14],       // Chitra / Swati
}

/** Vara (0 = Sun) → Yamaghanta nakshatra index. */
const YAMAGHANTA_NAK = [9, 15, 5, 18, 2, 3, 12] // Magha, Vishakha, Ardra, Mula, Krittika, Rohini, Hasta

const PUSHKAR_VARAS = new Set([0, 2, 6])
const PUSHKAR_TITHIS = new Set([2, 7, 12])
const DWIPUSHKAR_NAKS = new Set([4, 13, 22])            // Mrigashira, Chitra, Dhanishtha
const TRIPUSHKAR_NAKS = new Set([2, 6, 11, 15, 20, 24]) // Krittika, Punarvasu, U.Phalguni, Vishakha, U.Ashadha, P.Bhadra

interface MasaTithiRule {
  masa: LunarMasa
  paksha: 'shukla' | 'krishna'
  lunarDay: number
  label: string
}

/** Yugadi / Manvadi and allied tithis — "wildcard" births where tithi weakness is set aside. */
const WILDCARD_TITHIS: MasaTithiRule[] = [
  { masa: 'Chaitra',    paksha: 'shukla',  lunarDay: 3,  label: 'Chaitra Shukla Tritiya' },
  { masa: 'Chaitra',    paksha: 'shukla',  lunarDay: 15, label: 'Chaitra Purnima' },
  { masa: 'Vaishakha',  paksha: 'shukla',  lunarDay: 3,  label: 'Vaishakha Shukla Tritiya (Akshaya Tritiya, Treta Yugadi)' },
  { masa: 'Ashadha',    paksha: 'shukla',  lunarDay: 10, label: 'Ashadha Shukla Dashami' },
  { masa: 'Ashadha',    paksha: 'shukla',  lunarDay: 15, label: 'Ashadha Purnima' },
  { masa: 'Bhadrapada', paksha: 'krishna', lunarDay: 8,  label: 'Bhadrapada Krishna Ashtami' },
  { masa: 'Bhadrapada', paksha: 'krishna', lunarDay: 13, label: 'Bhadrapada Krishna Trayodashi (Dwapara Yugadi)' },
  { masa: 'Bhadrapada', paksha: 'krishna', lunarDay: 15, label: 'Bhadrapada Amavasya' },
  { masa: 'Bhadrapada', paksha: 'shukla',  lunarDay: 3,  label: 'Bhadrapada Shukla Tritiya' },
  { masa: 'Kartika',    paksha: 'shukla',  lunarDay: 9,  label: 'Kartika Shukla Navami (Satya Yugadi)' },
  { masa: 'Kartika',    paksha: 'shukla',  lunarDay: 12, label: 'Kartika Shukla Dwadashi' },
  { masa: 'Kartika',    paksha: 'shukla',  lunarDay: 15, label: 'Kartika Purnima' },
  { masa: 'Magha',      paksha: 'shukla',  lunarDay: 7,  label: 'Magha Shukla Saptami (Manvadi)' },
  { masa: 'Magha',      paksha: 'krishna', lunarDay: 15, label: 'Magha Amavasya (Kali Yugadi)' },
]

// ── Main analysis ────────────────────────────────────────────

export interface PanchangVisheshInput {
  tithiNumber:    number // 1–30
  varaNumber:     number // 0 = Sun … 6 = Sat
  sunLon:         number // sidereal
  moonLon:        number // sidereal
  /** Moon nakshatra index 0–26; derived from moonLon when omitted */
  nakshatraIndex?: number
  grahas?:        VisheshGraha[]
  lagnaRashi?:    Rashi | null
  sunrise?:       Date | string | null
  /** Birth (natal) or reading moment (daily) */
  at?:            Date | string | null
  vaarPatiNavamshaRashi?: Rashi | null
  /** Output language for labels and details (ids stay English) */
  lang?:          EngineLang
}

export interface PanchangVisheshResult {
  lunarMonth:   LunarMonthInfo
  tithyamsha:   TithyamshaInfo
  vaarGuna:     VaarGunaInfo | null
  tithiStrength: TithiStrengthResult
  vaarPatiStrength: VaarPatiStrengthResult | null
  anandadi:     AnandadiYoga
  yogas:        VisheshYoga[]
  /** Parashara's sensitive-birth notes (Amavasya, Krishna Chaturdashi, Bhadra on earth) */
  sensitiveBirth: string[]
}

/** Bhadra (Vishti) residence by Moon rashi — only Bhuloka Bhadra is harmful. */
export function bhadraLoka(moonRashi: Rashi): 'Bhuloka' | 'Svarga' | 'Patala' {
  if ([4, 5, 11, 12].includes(moonRashi)) return 'Bhuloka'
  if ([1, 2, 3, 8].includes(moonRashi)) return 'Svarga'
  return 'Patala'
}

export function analyzePanchangVishesh(input: PanchangVisheshInput): PanchangVisheshResult {
  const t = Math.min(30, Math.max(1, Math.floor(input.tithiNumber)))
  const lunarDay = lunarDayFromTithi(t)
  const paksha: 'shukla' | 'krishna' = t <= 15 ? 'shukla' : 'krishna'
  const vara = ((Math.floor(input.varaNumber) % 7) + 7) % 7
  const nak = input.nakshatraIndex ?? nakOf(input.moonLon)
  const sunR = rashiOf(input.sunLon)
  const moonR = rashiOf(input.moonLon)
  const lang = input.lang ?? 'en'
  const hi = lang === 'hi'
  const Y = YOGAS_HI
  const tithiName = getTithiDayMeta(t, lang).name
  const varaName = getVaarMeta(vara, lang).name
  const nakLabel = nakName(nak, lang)
  const lunarMonth = getLunarMonth(input.sunLon, input.moonLon)
  const yogas: VisheshYoga[] = []
  /** Push a yoga; in Hindi, label/detail come from YOGAS_HI[key] filled with `vals`. */
  const add = (
    base: Omit<VisheshYoga, 'label' | 'detail'>,
    en: { label: string; detail: string },
    hiKey: keyof typeof YOGAS_HI | null,
    vals: Record<string, string | number> = {},
  ) => {
    const tpl = hiKey ? (YOGAS_HI[hiKey] as { label: string; detail: string }) : null
    yogas.push({
      ...base,
      label: hi && tpl ? fill(tpl.label, vals) : en.label,
      detail: hi && tpl ? fill(tpl.detail, vals) : en.detail,
    })
  }
  const triple = { vara: varaName, tithi: tithiName, nak: nakLabel }

  // Dwipushkar / Tripushkar
  if (PUSHKAR_VARAS.has(vara) && PUSHKAR_TITHIS.has(lunarDay)) {
    if (DWIPUSHKAR_NAKS.has(nak)) {
      add({ id: 'dwipushkar', quality: 'auspicious', category: 'tithi-vara' }, { label: 'Dwipushkar Yoga',
        detail: `${varaName} + ${tithiName} + ${nakLabel} — results double. A weak Moon or tithi gets extra strength.` }, 'dwipushkar', triple)
    } else if (TRIPUSHKAR_NAKS.has(nak)) {
      add({ id: 'tripushkar', quality: 'auspicious', category: 'tithi-vara' }, { label: 'Tripushkar Yoga',
        detail: `${varaName} + ${tithiName} + ${nakLabel} — results triple. Strongly lifts a weak tithi; avoid losses and debts begun now, as they repeat too.` }, 'tripushkar', triple)
    }
  }

  // Krakacha: tithi + vara (Sunday = 1) = 13
  if (lunarDay + (vara + 1) === 13) {
    add({ id: 'krakacha', quality: 'inauspicious', category: 'tithi-vara' }, { label: 'Krakacha Yoga',
      detail: `${tithiName} on ${varaName} (tithi + vara = 13) — the "saw" yoga cuts into auspiciousness. Watched closely in mundane work (storms, heavy rain) and in personal health swings.` }, 'krakacha', triple)
  }

  // Tithi–nakshatra dosha (Shukla 1–13 and Krishna 1–13 by lunar day)
  if (TITHI_NAK_DOSHA[lunarDay]?.includes(nak)) {
    add({ id: 'tithi-nak-dosha', quality: 'inauspicious', category: 'tithi-nakshatra' }, { label: 'Tithi–Nakshatra dosha',
      detail: `${tithiName} with ${nakLabel} is a classically inauspicious pair. Even a strong lagna or lagnesh can give setbacks in its dasha / antardasha — check this when a "good" dasha underperforms.` }, 'tithiNak', triple)
  }

  // Yamaghanta (vara + nakshatra)
  if (YAMAGHANTA_NAK[vara] === nak) {
    add({ id: 'yamaghanta', quality: 'inauspicious', category: 'vara-nakshatra' }, { label: 'Yamaghanta Yoga',
      detail: `${varaName} + ${nakLabel} — "death of a part of life": obstacles grow in frequency, or one area (health, emotions, material life) suffers suddenly in lagna / lagnesh periods.` }, 'yamaghanta', triple)
  }
  // Natal echo: each day-lord in its own Yamaghanta nakshatra
  for (const g of input.grahas ?? []) {
    const v = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa'].indexOf(g.id)
    if (v < 0 || g.id === 'Mo') continue
    if (YAMAGHANTA_NAK[v] === nakOf(g.lon)) {
      add({ id: `yamaghanta-${g.id}`, quality: 'inauspicious', category: 'vara-nakshatra' }, { label: `${GRAHA_NAMES[g.id]} in Yamaghanta nakshatra`,
        detail: `${GRAHA_NAMES[g.id]} in ${NAKSHATRA_NAMES[nakOf(g.lon)]} echoes the Yamaghanta pattern for that planet’s significations.` },
        'yamaghantaGraha', { graha: grahaName(g.id, lang), nak: nakName(nakOf(g.lon), lang) })
    }
  }

  // Surya-rashi dagdha tithi
  if (SURYA_DAGDHA[sunR].includes(lunarDay)) {
    add({ id: 'surya-dagdha', quality: 'inauspicious', category: 'masa-tithi' }, { label: 'Surya-rashi dagdha tithi',
      detail: `${tithiName} with Sun in ${RASHI_NAMES[sunR]} weakens the tithi (either paksha). Its effects show in daily routines and specific events more than in the whole life.` },
      'suryaDagdha', { tithi: tithiName, rashi: rashiName(sunR, lang) })
  }

  // Wildcard tithis
  const wildIdx = WILDCARD_TITHIS.findIndex((r) => r.masa === lunarMonth.festivalMasa && r.paksha === paksha && r.lunarDay === lunarDay)
  const wild = wildIdx >= 0 ? WILDCARD_TITHIS[wildIdx] : undefined
  if (wild) {
    add({ id: 'yugadi-wildcard', quality: 'auspicious', category: 'masa-tithi' }, { label: 'Yugadi / Manvadi tithi',
      detail: `${wild.label} — a "wildcard" tithi on which a yuga or manvantara began. Weakness of Sun, Moon or tithi can be set aside.` },
      'wildcard', { label: WILDCARD_LABELS_HI[wildIdx] ?? wild.label })
  }

  // Monthly parvas
  if (t === 30) add({ id: 'parva-amavasya', quality: 'mixed', category: 'parva' }, { label: 'Amavasya parva', detail: 'One of the five monthly parvas — strong for sadhana, pitru rites and inner work.' }, 'amavasya')
  if (t === 15) add({ id: 'parva-purnima', quality: 'auspicious', category: 'parva' }, { label: 'Purnima parva', detail: 'One of the five monthly parvas — Moon is full; Sri Vidya worship treats the full Moon itself as the Sri Yantra’s bindu.' }, 'purnima')
  if (lunarDay === 8) add({ id: `parva-ashtami-${paksha}`, quality: 'mixed', category: 'parva' }, { label: `${paksha === 'shukla' ? 'Shukla' : 'Krishna'} Ashtami parva`, detail: 'One of the five monthly parvas — Amavasya, the two Ashtamis and Purnima fall about seven tithis apart and carry strong energy for sadhana.' }, 'ashtami', { paksha: PAKSHA_HI[paksha] })
  if (degInSign(input.sunLon) < 1 || degInSign(input.sunLon) > 29.5) {
    const atStart = degInSign(input.sunLon) < 1
    add({ id: 'parva-sankranti', quality: 'mixed', category: 'parva' }, { label: 'Sankranti parva', detail: `Sun is at the ${atStart ? 'start' : 'end'} of ${RASHI_NAMES[sunR]} — the solar-ingress parva.` },
      'sankranti', { rashi: rashiName(sunR, lang), edge: atStart ? Y.sankranti.start : Y.sankranti.end })
  }

  // Esoteric / special tithis
  const fm = lunarMonth.festivalMasa
  if (paksha === 'krishna' && lunarDay === 8) {
    add({ id: 'kalashtami', quality: 'mixed', category: 'parva' }, { label: 'Krishna Ashtami (Kalashtami / Bhoot Ashtami)', detail: 'Used by sadhakas for release from troubling energies; Kala Bhairava worship is prescribed.' }, 'kalashtami')
  }
  if (t === 30 && vara === 6) {
    add({ id: 'shani-amavasya', quality: 'mixed', category: 'parva' }, { label: 'Shani Amavasya', detail: 'Saturday Amavasya — Shani worship for court cases and Shani pida.' }, 'shaniAmavasya')
  }
  if (paksha === 'krishna' && lunarDay === 14) {
    const maha = fm === 'Phalguna'
    add({ id: maha ? 'mahashivratri' : 'masik-shivratri', quality: 'mixed', category: 'parva' }, {
      label: maha ? 'Mahashivratri' : 'Masik Shivratri',
      detail: maha
        ? 'Phalguna Krishna Chaturdashi — Shiva tattva fully awake; worship runs through the four praharas of the night, not just the morning abhishek.'
        : 'Krishna Chaturdashi — the Moon is drained before Amavasya; Shiva, who wears the Moon, is worshipped.' }, maha ? 'mahashivratri' : 'masikShivratri')
  }
  if (fm === 'Ashvina' && t === 15) {
    add({ id: 'sharad-purnima', quality: 'auspicious', category: 'parva' }, { label: 'Ashvina (Sharad) Purnima', detail: 'Night japa for Lakshmi / Sri-kula mantras gives quick results for money that is stuck.' }, 'sharadPurnima')
  }
  if (fm === 'Ashvina' && paksha === 'shukla' && lunarDay === 8) {
    add({ id: 'mahashtami', quality: 'auspicious', category: 'parva' }, { label: 'Mahashtami', detail: 'Householders may worship the Mother in any heartfelt way — japa, dhyana or simple conversation.' }, 'mahashtami')
  }
  if ((fm === 'Ashadha' || fm === 'Magha') && paksha === 'shukla' && lunarDay <= 9) {
    add({ id: 'gupt-navratri', quality: 'mixed', category: 'parva' }, { label: 'Gupt Navratri', detail: `${fm} Gupt Navratri — Dasha Mahavidya sadhana for sadhakas, not prescribed for householders.` }, 'guptNavratri', { masa: MASA_LABEL_HI[fm] ?? fm })
  }

  // Tithi–graha yutis (transit or natal)
  const grahas = input.grahas ?? []
  const signOf = (id: GrahaId) => {
    const g = grahas.find((x) => x.id === id)
    return g ? rashiOf(g.lon) : null
  }
  const conj = (a: GrahaId, b: GrahaId) => {
    const ra = signOf(a)
    return ra != null && ra === signOf(b)
  }
  const mutualAspect = (a: GrahaId, b: GrahaId) => {
    const ra = signOf(a)
    const rb = signOf(b)
    if (ra == null || rb == null) return false
    const ab = houseFrom(ra, rb)
    const ba = houseFrom(rb, ra)
    const marsSees = (h: number) => [4, 7, 8].includes(h)
    const satSees = (h: number) => [3, 7, 10].includes(h)
    return (a === 'Ma' ? marsSees(ab) : satSees(ab)) || (b === 'Ma' ? marsSees(ba) : satSees(ba))
  }
  if (grahas.length) {
    if (lunarDay === 1 && conj('Mo', 'Me')) add({ id: 'pratipada-mo-me', quality: 'auspicious', category: 'tithi-graha' }, { label: 'Pratipada + Moon–Mercury', detail: 'Sharp, precocious intelligence — learning comes early and fast.' }, 'pratipadaMoMe')
    if (lunarDay === 2 && conj('Ve', 'Mo')) add({ id: 'dwitiya-ve-mo', quality: 'auspicious', category: 'tithi-graha' }, { label: 'Dwitiya + Venus–Moon', detail: 'Refinement, comfort and emotional grace.' }, 'dwitiyaVeMo')
    if (lunarDay === 3 && conj('Ve', 'Ju')) add({ id: 'tritiya-ve-ju', quality: 'auspicious', category: 'tithi-graha' }, { label: 'Tritiya + Venus–Jupiter', detail: 'Supports mantra siddhi along with enjoyment — "bhoga to moksha".' }, 'tritiyaVeJu')
    if (lunarDay === 4 && conj('Ma', 'Ke')) add({ id: 'chaturthi-ma-ke', quality: 'auspicious', category: 'tithi-graha' }, { label: 'Chaturthi + Mars–Ketu', detail: 'Rin-mochan window: starting Mars’ Rin Mochan stotra by vidhi on this transit helps clear debts.' }, 'chaturthiMaKe')
    if (lunarDay === 9 && (conj('Ma', 'Sa') || mutualAspect('Ma', 'Sa'))) add({ id: 'navami-ma-sa', quality: 'mixed', category: 'tithi-graha' }, { label: 'Navami + Mars–Saturn', detail: 'Fighting yoga — suited to filing cases, taking hearing dates or debates where you need the upper hand. The other side gets it too; the stronger chart wins.' }, 'navamiMaSa')
  }

  // Eclipse-season tithis
  const rahu = grahas.find((g) => g.id === 'Ra')
  if (rahu && (t === 15 || t === 30)) {
    const ketuLon = norm360(rahu.lon + 180)
    const ref = t === 15 ? input.moonLon : input.sunLon
    const dNode = Math.min(angDist(ref, rahu.lon), angDist(ref, ketuLon))
    const limit = t === 15 ? 12 : 18
    if (dNode <= limit) {
      const isLunar = t === 15
      const tpl = isLunar ? Y.chandraGrahan : Y.suryaGrahan
      let detail = hi
        ? fill(tpl.detail, { deg: dNode.toFixed(1) })
        : isLunar
          ? `Purnima with the Moon ${dNode.toFixed(1)}° from a node — lunar-eclipse season. Japa in grahan kala is multiplied many times; Tripura Bhairavi, Kali and Bagalamukhi are worshipped.`
          : `Amavasya with the Sun ${dNode.toFixed(1)}° from a node — solar-eclipse season. Chhinnamasta, Dhumavati and Tara are worshipped; the Mahabharata war began on a solar eclipse.`
      if (isLunar && conj('Ju', 'Ke') && signOf('Ju') === 4) detail += hi ? Y.guruKetu : ' Rare Guru–Ketu yuti in Karka — classically able to bestow siddhis.'
      if (isLunar && moonR === 8) detail += hi ? Y.vrishchika : ' In Vrishchika — very strong for inner transformation.'
      yogas.push({
        id: isLunar ? 'chandra-grahan-season' : 'surya-grahan-season',
        label: hi ? tpl.label : isLunar ? 'Chandra grahan tithi' : 'Surya grahan tithi',
        quality: 'mixed',
        category: 'eclipse',
        detail,
      })
    }
  }

  const sensitiveBirth: string[] = []
  if (t === 30 && hi) sensitiveBirth.push(SENSITIVE_HI.amavasya)
  else if (t === 30) sensitiveBirth.push('Amavasya birth — Parashara notes a phase of financial strain for the parents at some point; the chart shows where (upbringing, food, education or values).')
  if (t === 29 && hi) sensitiveBirth.push(SENSITIVE_HI.krishna14)
  else if (t === 29) sensitiveBirth.push('Krishna Chaturdashi birth — Moon is very weak; check paksha bala and the Moon’s degree before judging the chart.')
  const isVishti = isVishtiAt(input.sunLon, input.moonLon)
  if (isVishti && bhadraLoka(moonR) === 'Bhuloka' && hi) sensitiveBirth.push(SENSITIVE_HI.bhadra)
  else if (isVishti && bhadraLoka(moonR) === 'Bhuloka') sensitiveBirth.push('Vishti (Bhadra) with the Moon in Karka / Simha / Kumbha / Mina — Bhadra resides on earth, the sensitive form.')

  const tithiStrength = getTithiStrength({
    sunLon: input.sunLon,
    moonLon: input.moonLon,
    grahas,
    lagnaRashi: input.lagnaRashi,
    supportiveYogas: yogas,
    lang,
  })
  const vaarPatiStrength = grahas.length
    ? getVaarPatiStrength({ varaNumber: vara, grahas, lagnaRashi: input.lagnaRashi, vaarPatiNavamshaRashi: input.vaarPatiNavamshaRashi, supportiveYogas: yogas, lang })
    : null

  const sunrise = input.sunrise ? new Date(input.sunrise) : null
  const at = input.at ? new Date(input.at) : null
  const vaarGuna = sunrise && at ? getVaarGuna(vara, sunrise, at, lang) : null

  return {
    lunarMonth,
    tithyamsha: getTithyamsha(input.sunLon, input.moonLon, lang),
    vaarGuna,
    tithiStrength,
    vaarPatiStrength,
    anandadi: getAnandadiYoga(vara, input.moonLon, lang),
    yogas,
    sensitiveBirth,
  }
}

/** Vishti karana: the 8th of every 7-karana cycle among the 56 movable ones. */
function isVishtiAt(sunLon: number, moonLon: number): boolean {
  const k = Math.floor(norm360(moonLon - sunLon) / 6) // 0–59
  if (k === 0 || k >= 57) return false
  return (k - 1) % 7 === 6
}

// ── Anandadi yogas (28, vara + nakshatra incl. Abhijit) ──────

export interface AnandadiMeta {
  number:  number // 1–28
  name:    string
  meaning: string
  quality: VisheshQuality
  /** Nakshatra and deity when counted from Ashwini (Sunday sequence) */
  sundayNakshatra: string
  deity:   string
  note:    string
}

const ANANDADI: AnandadiMeta[] = [
  { number: 1,  name: 'Ananda',     meaning: 'Bliss',               quality: 'auspicious',   sundayNakshatra: 'Ashwini',          deity: 'Ashwini Kumaras', note: 'Heart-felt joy; youthful health.' },
  { number: 2,  name: 'Kaladanda',  meaning: 'Rod of death',        quality: 'inauspicious', sundayNakshatra: 'Bharani',          deity: 'Yama',            note: 'Punishing, heavy energy.' },
  { number: 3,  name: 'Dhumra',     meaning: 'Smoke',               quality: 'inauspicious', sundayNakshatra: 'Krittika',         deity: 'Agni',            note: 'Fire that smoulders rather than burns clean.' },
  { number: 4,  name: 'Prajapati',  meaning: 'Creator',             quality: 'auspicious',   sundayNakshatra: 'Rohini',           deity: 'Brahma',          note: 'Building and creating.' },
  { number: 5,  name: 'Saumya',     meaning: 'Gentle',              quality: 'auspicious',   sundayNakshatra: 'Mrigashira',       deity: 'Chandra',         note: 'Soft, pleasant, civil.' },
  { number: 6,  name: 'Dhwanksha',  meaning: 'Crow',                quality: 'inauspicious', sundayNakshatra: 'Ardra',            deity: 'Rudra (Tandava)', note: 'Destructive, unsettling.' },
  { number: 7,  name: 'Dhwaja',     meaning: 'Flag',                quality: 'auspicious',   sundayNakshatra: 'Punarvasu',        deity: 'Aditi',           note: 'Victory and visibility.' },
  { number: 8,  name: 'Shrivatsa',  meaning: 'Mark of Lakshmi',     quality: 'auspicious',   sundayNakshatra: 'Pushya',           deity: 'Brihaspati',      note: 'Dignity and prosperity.' },
  { number: 9,  name: 'Vajra',      meaning: 'Thunderbolt',         quality: 'inauspicious', sundayNakshatra: 'Ashlesha',         deity: 'Sarpa',           note: 'Sudden, poisonous strikes.' },
  { number: 10, name: 'Mudgara',    meaning: 'Mallet',              quality: 'inauspicious', sundayNakshatra: 'Magha',            deity: 'Pitri',           note: 'Breaks through; easy ancestral gains, but harsh for new starts.' },
  { number: 11, name: 'Chhatra',    meaning: 'Royal umbrella',      quality: 'auspicious',   sundayNakshatra: 'Purva Phalguni',   deity: 'Bhaga',           note: 'Royal comfort and protection.' },
  { number: 12, name: 'Mitra',      meaning: 'Friend',              quality: 'auspicious',   sundayNakshatra: 'Uttara Phalguni',  deity: 'Aryaman',         note: 'Respect and good relations.' },
  { number: 13, name: 'Manasa',     meaning: 'Of the mind',         quality: 'auspicious',   sundayNakshatra: 'Hasta',            deity: 'Surya',           note: 'Clear, satisfied mind.' },
  { number: 14, name: 'Padma',      meaning: 'Lotus',               quality: 'auspicious',   sundayNakshatra: 'Chitra',           deity: 'Vishwakarma',     note: 'Beauty, design and skill.' },
  { number: 15, name: 'Lumbaka',    meaning: 'Tail',                quality: 'inauspicious', sundayNakshatra: 'Swati',            deity: 'Vayu (storm)',    note: 'Scattering, upheaval.' },
  { number: 16, name: 'Utpata',     meaning: 'Calamity',            quality: 'inauspicious', sundayNakshatra: 'Vishakha',         deity: 'Indra-Agni',      note: 'Disturbance, extreme weather.' },
  { number: 17, name: 'Mrityu',     meaning: 'Death',               quality: 'inauspicious', sundayNakshatra: 'Anuradha',         deity: 'Mitra',           note: 'Endings; avoid important starts.' },
  { number: 18, name: 'Kana',       meaning: 'One-eyed',            quality: 'inauspicious', sundayNakshatra: 'Jyeshtha',         deity: 'Indra',           note: 'One-sided focus; limited vision.' },
  { number: 19, name: 'Siddhi',     meaning: 'Success',             quality: 'auspicious',   sundayNakshatra: 'Mula',             deity: 'Nirriti',         note: 'Accomplishment; protection from fear.' },
  { number: 20, name: 'Shubha',     meaning: 'Auspicious',          quality: 'auspicious',   sundayNakshatra: 'Purva Ashadha',    deity: 'Jala',            note: 'Protective and good.' },
  { number: 21, name: 'Amrita',     meaning: 'Nectar',              quality: 'auspicious',   sundayNakshatra: 'Uttara Ashadha',   deity: 'Vishvedevas',     note: 'Shows the way through the worst situations.' },
  { number: 22, name: 'Musala',     meaning: 'Pestle',              quality: 'inauspicious', sundayNakshatra: 'Abhijit',          deity: 'Brahma',          note: 'Pounding and separating.' },
  { number: 23, name: 'Gada',       meaning: 'Mace / disease',      quality: 'inauspicious', sundayNakshatra: 'Shravana',         deity: 'Vishnu',          note: 'Illness tendencies; keep disorders in check.' },
  { number: 24, name: 'Matanga',    meaning: 'Elephant',            quality: 'auspicious',   sundayNakshatra: 'Dhanishtha',       deity: 'Vasu',            note: 'Abundance — the elephant beside Lakshmi.' },
  { number: 25, name: 'Rakshasa',   meaning: 'Demon',               quality: 'inauspicious', sundayNakshatra: 'Shatabhisha',      deity: 'Varuna (fierce)', note: 'Destructive storms.' },
  { number: 26, name: 'Chara',      meaning: 'Moving',              quality: 'mixed',        sundayNakshatra: 'Purva Bhadrapada', deity: 'Aja Ekapada',     note: 'Restless; good for travel, poor for settling.' },
  { number: 27, name: 'Sthira',     meaning: 'Steady',              quality: 'auspicious',   sundayNakshatra: 'Uttara Bhadrapada', deity: 'Ahirbudhnya',    note: 'Stable, grave, meditative.' },
  { number: 28, name: 'Vardhamana', meaning: 'Increasing',          quality: 'auspicious',   sundayNakshatra: 'Revati',           deity: 'Pushan (Surya)',  note: 'Growth and nourishment.' },
]

/** 28-nakshatra start per vara: Sun Ashwini, Mon Mrigashira, Tue Ashlesha, Wed Hasta, Thu Anuradha, Fri U.Ashadha, Sat Shatabhisha. */
const ANANDADI_START_28 = [0, 4, 8, 12, 16, 20, 24]

/** Abhijit spans 276°40′ – 280°53′20″ (last quarter of U.Ashadha + start of Shravana). */
function nak28Of(moonLon: number): number {
  const l = norm360(moonLon)
  if (l >= 276 + 40 / 60 && l < 280 + 53 / 60 + 20 / 3600) return 21
  const n27 = nakOf(l)
  return n27 >= 21 ? n27 + 1 : n27
}

export interface AnandadiYoga extends AnandadiMeta {
  /** 28-scheme nakshatra name actually used (may be Abhijit) */
  nakshatraUsed: string
}

const NAK28_NAMES = [...NAKSHATRA_NAMES.slice(0, 21), 'Abhijit', ...NAKSHATRA_NAMES.slice(21)]

const NAK28_NAMES_HI = [...NAKSHATRA_HI.slice(0, 21), 'अभिजित', ...NAKSHATRA_HI.slice(21)]

function localAnandadi(meta: AnandadiMeta, lang: EngineLang): AnandadiMeta {
  if (lang !== 'hi') return meta
  const hi = ANANDADI_HI[meta.number - 1]
  return hi ? { ...meta, ...hi } : meta
}

export function getAnandadiYoga(varaNumber: number, moonLon: number, lang: EngineLang = 'en'): AnandadiYoga {
  const vara = ((Math.floor(varaNumber) % 7) + 7) % 7
  const n28 = nak28Of(moonLon)
  const idx = (n28 - ANANDADI_START_28[vara] + 28) % 28
  return {
    ...localAnandadi(ANANDADI[idx], lang),
    nakshatraUsed: lang === 'hi' ? NAK28_NAMES_HI[n28] : NAK28_NAMES[n28],
  }
}

export function listAnandadiYogas(lang: EngineLang = 'en'): AnandadiMeta[] {
  return ANANDADI.map((a) => localAnandadi(a, lang))
}
