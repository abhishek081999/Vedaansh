// ─────────────────────────────────────────────────────────────
//  src/lib/engine/moonTransitAnalysis.ts
//  Timed Moon passages over natal grahas, lagnas, and upagrahas
//  (linear Moon speed — same model as todayReading signChange)
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, GrahaId, LagnaData, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, NAKSHATRA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { getNakshatra } from '@/lib/engine/nakshatra'
import { calcChandraBala } from '@/lib/engine/muhurtaPersonal'
import { getTaraFromBirth } from '@/lib/engine/navtaraPrediction'
import { GRAHA_HI, termHi } from '@/i18n/jyotish'
import { fill, type EngineLang } from '@/lib/engine/lang'
import { HOUSE_SHORT_THEMES_HI, ordHi } from '@/lib/engine/locale/todayReading.hi'

export type MoonContactKind = 'graha' | 'lagna' | 'upagraha'
export type MoonContactTone = 'supportive' | 'mixed' | 'pressure'

export interface MoonContactTarget {
  key: string
  label: string
  code: string
  kind: MoonContactKind
  lon: number
  natalHouse: number
  grahaId?: GrahaId
}

export interface MoonContact {
  key: string
  label: string
  code: string
  kind: MoonContactKind
  grahaId?: GrahaId
  natalHouse: number
  targetLon: number
  atIso: string
  hoursFromNow: number
  /** Absolute circular separation Moon→target right now (0–180). */
  orbNow: number
  activeNow: boolean
  tone: MoonContactTone
  text: string
}

export interface MoonTransitNow {
  lon: number
  rashi: Rashi
  rashiName: string
  nakshatraName: string
  pada: number
  speedDegPerDay: number
  lagnaHouse: number
  chandraPosition: number
  chandraQuality: 'good' | 'bad' | 'avg'
  taraName: string
  taraTone: 'supportive' | 'challenging' | 'neutral' | 'transformative'
  taraIsHard: boolean
}

export interface MoonTransitReport {
  generatedAtIso: string
  moon: MoonTransitNow
  activeNow: MoonContact[]
  /** Contacts exact within the next 72 hours, soonest first. */
  nearTerm: MoonContact[]
  /** Next hit of each natal target within one ~27-day revolution. */
  cycle: MoonContact[]
}

const NEAR_HOURS = 72
const CYCLE_DAYS = 27
const ACTIVE_ORB_DEG = 3
/** Fallback sidereal Moon motion (°/day) when speed is missing or non-positive. */
export const DEFAULT_MOON_SPEED = 13.176

const CORE_GRAHAS: GrahaId[] = ['Su', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']
const BENEFICS = new Set<GrahaId>(['Ju', 'Ve', 'Me'])
const MALEFICS = new Set<GrahaId>(['Sa', 'Ma', 'Ra', 'Ke', 'Su'])
const PRESSURE_UPAGRAHAS = new Set(['Gulika', 'Maandi', 'Vyatipata', 'Dhooma'])

const SPECIAL_LAGNAS: Array<{ key: keyof LagnaData; label: string; code: string }> = [
  { key: 'bhavaLagna', label: 'Bhava Lagna', code: 'BL' },
  { key: 'horaLagna', label: 'Hora Lagna', code: 'HL' },
  { key: 'ghatiLagna', label: 'Ghati Lagna', code: 'GL' },
  { key: 'vighatiLagna', label: 'Vighati Lagna', code: 'VL' },
  { key: 'varnadaLagna', label: 'Varnada Lagna', code: 'VrL' },
  { key: 'sriLagna', label: 'Shri Lagna', code: 'SL' },
  { key: 'pranapada', label: 'Pranapada', code: 'PP' },
  { key: 'induLagna', label: 'Indu Lagna', code: 'IL' },
  { key: 'bhriguBindu', label: 'Bhrigu Bindu', code: 'BB' },
]

const UPAGRAHA_CODE: Record<string, string> = {
  Gulika: 'Gk',
  Maandi: 'Md',
  Dhooma: 'Dh',
  Vyatipata: 'Vy',
  Paridhi: 'Pa',
  Indrachapa: 'Ic',
  Upaketu: 'Uk',
  'Beeja Sphuta': 'BS',
  'Kshetra Sphuta': 'KS',
}

const HOUSE_THEME: Record<number, string> = {
  1: 'self and vitality',
  2: 'speech, family, and resources',
  3: 'courage, effort, and siblings',
  4: 'home, peace, and mother',
  5: 'creativity, romance, and intelligence',
  6: 'service, health routines, and competition',
  7: 'partnerships and public dealings',
  8: 'shared matters, depth, and change',
  9: 'dharma, fortune, and longer journeys',
  10: 'career, status, and public work',
  11: 'gains, networks, and fulfilled aims',
  12: 'rest, solitude, and release',
}

function normLon(lon: number): number {
  return ((lon % 360) + 360) % 360
}

/** Forward distance along the ecliptic from `from` to `to` (0–360). */
export function forwardDeltaDeg(from: number, to: number): number {
  return normLon(to - from)
}

/** Smallest absolute separation (0–180). */
export function absOrbDeg(a: number, b: number): number {
  const d = forwardDeltaDeg(a, b)
  return d > 180 ? 360 - d : d
}

export function hoursToConjunction(moonLon: number, targetLon: number, speedDegPerDay: number): number {
  const speed = speedDegPerDay > 0.05 ? speedDegPerDay : DEFAULT_MOON_SPEED
  const delta = forwardDeltaDeg(moonLon, targetLon)
  // Exact now → 0; otherwise next forward hit.
  if (delta < 1e-9 || delta > 360 - 1e-9) return 0
  return (delta / speed) * 24
}

function houseFrom(ascOrMoon: Rashi, pointRashi: Rashi): number {
  return ((pointRashi - ascOrMoon + 12) % 12) + 1
}

function rashiOfLon(lon: number): Rashi {
  return (Math.floor(normLon(lon) / 30) + 1) as Rashi
}

function arudhaLon(natal: ChartOutput): number | null {
  const al = natal.arudhas?.AL
  if (!al) return null
  return (al - 1) * 30 + (natal.lagnas.ascDegree % 30)
}

/** Collect natal conjunction targets for the Moon. */
const LAGNA_LABELS_HI: Record<string, string> = {
  Asc: 'लग्न', AL: 'आरूढ़ लग्न', bhavaLagna: 'भाव लग्न', horaLagna: 'होरा लग्न', ghatiLagna: 'घटी लग्न',
  vighatiLagna: 'विघटी लग्न', varnadaLagna: 'वर्णद लग्न', sriLagna: 'श्री लग्न', pranapada: 'प्राणपद',
  induLagna: 'इंदु लग्न', bhriguBindu: 'भृगु बिंदु',
}

const CONTACT_HI = {
  house: 'आपके जन्म का {target} {nth} भाव में है — {theme}।',
  grahaGood: 'चंद्रमा जन्म के {target} से मिलता है। मन और मनोदशा {theme} की ओर झुकती है। {house}',
  grahaBad: 'चंद्रमा जन्म के {target} से मिलता है। {theme} को लेकर भावनाएँ तीखी हो सकती हैं; प्रतिक्रिया धीमी रखें। {house}',
  grahaMixed: 'चंद्रमा जन्म के {target} से मिलता है। ध्यान {theme} पर केंद्रित होता है, कोई निश्चित परिणाम नहीं। {house}',
  asc: 'चंद्रमा आपके लग्न से गुज़रता है। शरीर का बोध और आप स्वयं को कैसे प्रस्तुत करते हैं, यह आगे आता है। {house}',
  lagna: 'चंद्रमा {target} से गुज़रता है। यह बताता है कि उस लग्न का विषय मनोदशा और गति में कैसे दिखता है। {house}',
  upaBad: 'चंद्रमा {target} से गुज़रता है। संपर्क सटीक रहने तक तीखी नई शुरुआत के बजाय दिनचर्या चुनें। {house}',
  upa: 'चंद्रमा {target} से गुज़रता है। {theme} के आसपास सूक्ष्म समय-संकेत। {house}',
  chandra: ' चंद्र बल स्थिर अर्थ का साथ देता है।',
  lifeThemes: 'जीवन के विषय',
}

export function collectMoonTargets(natal: ChartOutput, lang: EngineLang = 'en'): MoonContactTarget[] {
  const hi = lang === 'hi'
  const asc = natal.lagnas.ascRashi
  const out: MoonContactTarget[] = []

  for (const id of CORE_GRAHAS) {
    const g = natal.grahas.find(x => x.id === id)
    if (!g) continue
    out.push({
      key: id,
      label: hi ? GRAHA_HI[id] : GRAHA_NAMES[id],
      code: id,
      kind: 'graha',
      lon: normLon(g.lonSidereal),
      natalHouse: houseFrom(asc, g.rashi),
      grahaId: id,
    })
  }

  out.push({
    key: 'Asc',
    label: hi ? LAGNA_LABELS_HI.Asc : 'Lagna',
    code: 'As',
    kind: 'lagna',
    lon: normLon(natal.lagnas.ascDegree),
    natalHouse: 1,
  })

  const alLon = arudhaLon(natal)
  if (alLon != null) {
    out.push({
      key: 'AL',
      label: hi ? LAGNA_LABELS_HI.AL : 'Arudha Lagna',
      code: 'AL',
      kind: 'lagna',
      lon: normLon(alLon),
      natalHouse: houseFrom(asc, rashiOfLon(alLon)),
    })
  }

  for (const { key, label, code } of SPECIAL_LAGNAS) {
    const raw = natal.lagnas[key]
    if (typeof raw !== 'number' || !Number.isFinite(raw)) continue
    const lon = normLon(raw)
    out.push({
      key,
      label: hi ? LAGNA_LABELS_HI[key] ?? label : label,
      code,
      kind: 'lagna',
      lon,
      natalHouse: houseFrom(asc, rashiOfLon(lon)),
    })
  }

  for (const [key, u] of Object.entries(natal.upagrahas ?? {})) {
    if (!u || !Number.isFinite(u.lonSidereal)) continue
    out.push({
      key,
      label: hi ? termHi(u.name || key) : u.name || key,
      code: UPAGRAHA_CODE[key] ?? key.slice(0, 2),
      kind: 'upagraha',
      lon: normLon(u.lonSidereal),
      natalHouse: houseFrom(asc, u.rashi),
    })
  }

  return out
}

function contactTone(target: MoonContactTarget, chandraQuality: 'good' | 'bad' | 'avg'): MoonContactTone {
  let base: MoonContactTone = 'mixed'
  if (target.kind === 'graha' && target.grahaId) {
    if (BENEFICS.has(target.grahaId)) base = 'supportive'
    else if (MALEFICS.has(target.grahaId)) base = 'pressure'
  } else if (target.kind === 'upagraha' && PRESSURE_UPAGRAHAS.has(target.key)) {
    base = 'pressure'
  } else if (target.kind === 'lagna') {
    base = target.key === 'Asc' || target.key === 'AL' ? 'mixed' : 'mixed'
  }

  if (chandraQuality === 'bad' && base === 'supportive') return 'mixed'
  if (chandraQuality === 'bad' && base === 'mixed') return 'pressure'
  if (chandraQuality === 'good' && base === 'pressure') return 'mixed'
  if (chandraQuality === 'good' && base === 'mixed') return 'supportive'
  return base
}

function contactTextHi(target: MoonContactTarget, tone: MoonContactTone, chandraQuality: 'good' | 'bad' | 'avg'): string {
  const C = CONTACT_HI
  const theme = HOUSE_SHORT_THEMES_HI[target.natalHouse] ?? C.lifeThemes
  const house = fill(C.house, { target: target.label, nth: ordHi(target.natalHouse), theme })
  const v = { target: target.label, theme, house }
  if (target.kind === 'graha') return fill(tone === 'supportive' ? C.grahaGood : tone === 'pressure' ? C.grahaBad : C.grahaMixed, v)
  if (target.kind === 'lagna') return fill(target.key === 'Asc' ? C.asc : C.lagna, v)
  if (PRESSURE_UPAGRAHAS.has(target.key)) return fill(C.upaBad, v)
  return fill(C.upa, v) + (chandraQuality === 'good' ? C.chandra : '')
}

function contactText(target: MoonContactTarget, tone: MoonContactTone, chandraQuality: 'good' | 'bad' | 'avg', lang: EngineLang = 'en'): string {
  if (lang === 'hi') return contactTextHi(target, tone, chandraQuality)
  const theme = HOUSE_THEME[target.natalHouse] ?? 'life themes'
  const houseBit = `Your natal ${target.label} sits in the ${target.natalHouse}${suffix(target.natalHouse)} house — ${theme}.`

  if (target.kind === 'graha') {
    if (tone === 'supportive') {
      return `Moon meets natal ${target.label}. Mind and mood lean into ${theme}. ${houseBit}`
    }
    if (tone === 'pressure') {
      return `Moon meets natal ${target.label}. Emotional weather can feel sharper around ${theme}; keep reactions paced. ${houseBit}`
    }
    return `Moon meets natal ${target.label}. Attention gathers on ${theme} without a fixed outcome. ${houseBit}`
  }

  if (target.kind === 'lagna') {
    if (target.key === 'Asc') {
      return `Moon crosses your Lagna. Body-awareness and how you present yourself come forward. ${houseBit}`
    }
    return `Moon crosses ${target.label}. A timing marker for how that lagna’s agenda shows in mood and pace. ${houseBit}`
  }

  // upagraha
  if (PRESSURE_UPAGRAHAS.has(target.key)) {
    return `Moon crosses ${target.label}. Prefer routine over sharp new starts while the contact is exact. ${houseBit}`
  }
  return `Moon crosses ${target.label}. A subtle timing pulse around ${theme}. ${houseBit}${chandraQuality === 'good' ? ' Chandra Bala supports a steadier read.' : ''}`
}

function suffix(n: number): string {
  const v = n % 100
  if (v >= 11 && v <= 13) return 'th'
  return (['th', 'st', 'nd', 'rd'] as const)[n % 10] ?? 'th'
}

function buildContact(
  target: MoonContactTarget,
  moonLon: number,
  speed: number,
  nowMs: number,
  chandraQuality: 'good' | 'bad' | 'avg',
  lang: EngineLang = 'en',
): MoonContact {
  const hours = hoursToConjunction(moonLon, target.lon, speed)
  const orbNow = absOrbDeg(moonLon, target.lon)
  const tone = contactTone(target, chandraQuality)
  return {
    key: target.key,
    label: target.label,
    code: target.code,
    kind: target.kind,
    grahaId: target.grahaId,
    natalHouse: target.natalHouse,
    targetLon: target.lon,
    atIso: new Date(nowMs + hours * 3_600_000).toISOString(),
    hoursFromNow: hours,
    orbNow,
    activeNow: orbNow <= ACTIVE_ORB_DEG,
    tone,
    text: contactText(target, tone, chandraQuality, lang),
  }
}

export interface BuildMoonTransitInput {
  natal: ChartOutput
  /** Sidereal Moon longitude at the analysis moment. */
  moonLon: number
  /** Sidereal °/day (positive). Falls back to DEFAULT_MOON_SPEED. */
  moonSpeedDegPerDay?: number
  now?: Date
  nearHours?: number
  cycleDays?: number
  activeOrbDeg?: number
  /** Language of labels and text */
  lang?: EngineLang
}

/**
 * Build Moon transit contact report for a natal chart.
 * Near-term: exact hits within ~72h. Cycle: next hit of every natal target within ~27d.
 */
export function buildMoonTransitReport(input: BuildMoonTransitInput): MoonTransitReport | null {
  const natalMoon = input.natal.grahas.find(g => g.id === 'Mo')
  if (!natalMoon) return null

  const now = input.now ?? new Date()
  const nowMs = now.getTime()
  const moonLon = normLon(input.moonLon)
  const speed = input.moonSpeedDegPerDay && input.moonSpeedDegPerDay > 0.05
    ? input.moonSpeedDegPerDay
    : DEFAULT_MOON_SPEED
  const nearHours = input.nearHours ?? NEAR_HOURS
  const cycleHours = (input.cycleDays ?? CYCLE_DAYS) * 24

  const moonRashi = rashiOfLon(moonLon)
  const nak = getNakshatra(moonLon)
  const chandra = calcChandraBala(natalMoon.rashi, moonRashi)
  const tara = getTaraFromBirth(natalMoon.nakshatraIndex, nak.index)
  const lagnaHouse = houseFrom(input.natal.lagnas.ascRashi, moonRashi)

  // Chandra quality at contact time uses Moon's rashi at the hit for near-term tone;
  // for simplicity we use current Chandra quality for text, and recompute per-contact
  // from the estimated hit longitude.
  const targets = collectMoonTargets(input.natal, input.lang)
  const contacts = targets.map(t => {
    const hours = hoursToConjunction(moonLon, t.lon, speed)
    const hitLon = normLon(moonLon + (hours / 24) * speed)
    const hitRashi = rashiOfLon(hitLon)
    const hitChandra = calcChandraBala(natalMoon.rashi, hitRashi)
    const base = buildContact(t, moonLon, speed, nowMs, hitChandra.quality, input.lang)
    return base
  })

  const activeNow = contacts
    .filter(c => c.activeNow)
    .sort((a, b) => a.orbNow - b.orbNow)

  const nearTerm = contacts
    .filter(c => c.hoursFromNow <= nearHours)
    .sort((a, b) => a.hoursFromNow - b.hoursFromNow)

  const cycle = contacts
    .filter(c => c.hoursFromNow <= cycleHours)
    .sort((a, b) => a.hoursFromNow - b.hoursFromNow)

  return {
    generatedAtIso: now.toISOString(),
    moon: {
      lon: moonLon,
      rashi: moonRashi,
      rashiName: RASHI_NAMES[moonRashi],
      nakshatraName: nak.name || NAKSHATRA_NAMES[nak.index],
      pada: nak.pada,
      speedDegPerDay: speed,
      lagnaHouse,
      chandraPosition: chandra.position,
      chandraQuality: chandra.quality,
      taraName: tara.name,
      taraTone: tara.tone,
      taraIsHard: tara.isHard,
    },
    activeNow,
    nearTerm,
    cycle,
  }
}

/** Convenience: report from natal + a transit chart that includes Moon. */
export function buildMoonTransitFromCharts(
  natal: ChartOutput,
  transit: ChartOutput,
  now?: Date,
): MoonTransitReport | null {
  const tMoon = transit.grahas.find(g => g.id === 'Mo')
  if (!tMoon) return null
  return buildMoonTransitReport({
    natal,
    moonLon: tMoon.lonSidereal,
    moonSpeedDegPerDay: tMoon.speed,
    now: now ?? new Date(),
  })
}
