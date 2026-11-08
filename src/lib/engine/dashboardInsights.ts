// ─────────────────────────────────────────────────────────────
//  src/lib/engine/dashboardInsights.ts
//  Compact, dashboard-sized readings: dosha snapshot and remedy focus.
//  Pure engine — no React/DB. Kaal Sarp is deliberately absent: this
//  platform teaches that it is not a classical dosha (see rahuAnalysis.ts).
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, GrahaId, YogaResult } from '@/types/astrology'
import { GRAHA_NAMES, NAKSHATRA_NAMES } from '@/types/astrology'
import { calculateManglik, calculatePapeSamya, type ManglikAnalysis, type PapeSamyaAnalysis } from '@/lib/engine/doshas'
import { getDashaPathAt } from '@/lib/engine/dasha/current'
import { NAKSHATRA_REMEDIES, type NakshatraRemedies } from '@/lib/engine/nakshatraRemedies'
import { analyzeShrapDosha } from '@/lib/engine/shrapDosha'
import { fill, type EngineLang } from '@/lib/engine/lang'
import { GRAHA_HI, NAKSHATRA_DEITY_HI } from '@/i18n/jyotish'
import { ordHi, PLANET_REMEDIES_HI } from '@/lib/engine/locale/todayReading.hi'
import {
  DOSHA_HI, GANDANTA_SEVERITY_HI, INTENSITY_HI, MANGLIK_CANCEL_HI, NAK_REMEDY_HI, REMEDY_ROLE_HI, SHRAP_HI,
} from '@/lib/engine/locale/dashboardInsights.hi'

// ── Dosha snapshot ───────────────────────────────────────────

export type DoshaTone = 'clear' | 'watch' | 'strong'

export interface DoshaFlag {
  id: string
  label: string
  detail: string
  tone: DoshaTone
}

export interface DoshaSnapshot {
  manglik: ManglikAnalysis
  papeSamya: PapeSamyaAnalysis
  flags: DoshaFlag[]
  /** Malefic-category yogas already detected on the chart. */
  maleficYogas: YogaResult[]
}

const CORE: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

export function getDoshaSnapshot(chart: ChartOutput, lang: EngineLang = 'en'): DoshaSnapshot | null {
  if (lang === 'hi') return getDoshaSnapshotHi(chart)
  const asc = chart.lagnas?.ascRashi
  if (!asc || !chart.grahas?.length) return null

  const manglik = calculateManglik(chart.grahas, [], asc)
  const papeSamya = calculatePapeSamya(chart.grahas, asc)
  const flags: DoshaFlag[] = []

  const manglikTone: DoshaTone = manglik.isManglik ? (manglik.intensity === 'High' ? 'strong' : 'watch') : 'clear'
  flags.push({
    id: 'manglik',
    label: 'Manglik (Kuja)',
    tone: manglikTone,
    detail: !manglik.house
      ? 'Mars not found'
      : manglik.isManglik
        ? `Mars is in house ${manglik.house} from your rising sign, with ${manglik.intensity.toLowerCase()} intensity. This can add heat to close relationships. It does not decide your marriage.`
        : manglik.cancellations.length
          ? `Mars is in house ${manglik.house}, but its effect is softened: ${manglik.cancellations[0]}`
          : `Mars is in house ${manglik.house}, which is not a Manglik placement`,
  })

  const papeTone: DoshaTone = papeSamya.totalWeight >= 3 ? 'strong' : papeSamya.totalWeight >= 1.5 ? 'watch' : 'clear'
  flags.push({
    id: 'pape',
    label: 'Pape-Samya',
    tone: papeTone,
    detail: `Pressure score ${papeSamya.totalWeight.toFixed(2)} from difficult planets in the houses that affect relationships (1, 2, 4, 7, 8, 12). It is most useful when comparing two charts.`,
  })

  const gandanta = chart.grahas.filter(g => CORE.includes(g.id) && g.gandanta?.isGandanta)
  flags.push({
    id: 'gandanta',
    label: 'Gandanta',
    tone: gandanta.length ? 'watch' : 'clear',
    detail: gandanta.length
      ? gandanta.map(g => `${GRAHA_NAMES[g.id]} (${g.gandanta.severity})`).join(', ')
      : 'No planet sits at a sensitive point where a water sign meets a fire sign',
  })

  const mrityu = chart.grahas.filter(g => CORE.includes(g.id) && g.mrityuBhaga?.isMrityuBhaga)
  flags.push({
    id: 'mrityu',
    label: 'Mrityu Bhaga',
    tone: mrityu.length ? 'watch' : 'clear',
    detail: mrityu.length
      ? mrityu.map(g => GRAHA_NAMES[g.id]).join(', ')
      : 'No planet sits on a Mrityu Bhaga degree (a sensitive point in classical astrology)',
  })

  const warring = chart.grahas.find(g => g.yuddha?.isWarring)
  flags.push({
    id: 'yuddha',
    label: 'Graha Yuddha',
    tone: warring ? 'watch' : 'clear',
    detail: warring
      ? `Mercury and Venus are very close together, which is called a planetary war · ${warring.yuddha.winner ? `${GRAHA_NAMES[warring.yuddha.winner]} wins` : 'no clear winner'}`
      : 'No planetary war (no two planets are competing closely)',
  })

  const combust = chart.grahas.filter(g => g.isCombust && g.id !== 'Su' && CORE.includes(g.id))
  flags.push({
    id: 'combust',
    label: 'Combustion',
    tone: combust.length ? 'watch' : 'clear',
    detail: combust.length ? combust.map(g => GRAHA_NAMES[g.id]).join(', ') : 'No planet is combust (too close to the Sun and weakened)',
  })

  // Shrap desk compact flags (never emit kaalsarp)
  const shrap = analyzeShrapDosha(chart)
  if (shrap) {
    for (const row of shrap.summaryRows) {
      if (row.id === 'kaalsarp') continue
      flags.push({
        id: row.id,
        label: row.label,
        tone: row.severity,
        detail: row.present
          ? `${row.keyRemedy}. Open Dosha & Upay for full indicators.`
          : `Clear on this rule set · ${row.primaryPlanet} / ${row.primaryHouse}`,
      })
    }
  }

  const maleficYogas = (chart.yogas ?? []).filter(y => y.category === 'malefic')

  return { manglik, papeSamya, flags, maleficYogas }
}

// ── Remedy focus ─────────────────────────────────────────────

export interface PlanetRemedy {
  gemstone: string
  metal: string
  day: string
  mantra: string
  charity: string
  color: string
}

/** Widely taught defaults. Gemstones are advice for after a full chart review. */
export const PLANET_REMEDIES: Partial<Record<GrahaId, PlanetRemedy>> = {
  Su: { gemstone: 'Ruby', metal: 'Gold or copper', day: 'Sunday', mantra: 'Om Suryaya Namah', charity: 'Wheat, jaggery, copper', color: 'Red or orange' },
  Mo: { gemstone: 'Pearl', metal: 'Silver', day: 'Monday', mantra: 'Om Chandraya Namah', charity: 'Rice, milk, white cloth', color: 'White' },
  Ma: { gemstone: 'Red Coral', metal: 'Copper', day: 'Tuesday', mantra: 'Om Angarakaya Namah', charity: 'Red lentils, sweets', color: 'Red' },
  Me: { gemstone: 'Emerald', metal: 'Bronze or gold', day: 'Wednesday', mantra: 'Om Budhaya Namah', charity: 'Green moong, books', color: 'Green' },
  Ju: { gemstone: 'Yellow Sapphire', metal: 'Gold', day: 'Thursday', mantra: 'Om Gurave Namah', charity: 'Chana dal, turmeric, yellow cloth', color: 'Yellow' },
  Ve: { gemstone: 'Diamond or white sapphire', metal: 'Silver or platinum', day: 'Friday', mantra: 'Om Shukraya Namah', charity: 'Rice, sugar, white cloth', color: 'White or pastel' },
  Sa: { gemstone: 'Blue Sapphire', metal: 'Iron', day: 'Saturday', mantra: 'Om Shanaishcharaya Namah', charity: 'Sesame, black urad, blankets', color: 'Blue or black' },
  Ra: { gemstone: 'Hessonite (Gomed)', metal: 'Mixed metal', day: 'Saturday', mantra: 'Om Rahave Namah', charity: 'Urad dal, blankets', color: 'Smoky blue' },
  Ke: { gemstone: "Cat's Eye", metal: 'Mixed metal or silver', day: 'Tuesday', mantra: 'Om Ketave Namah', charity: 'Blankets, feeding dogs', color: 'Grey or multicolour' },
}

export type RemedyRole = 'Mahadasha lord' | 'Antardasha lord' | 'Weakest by Shadbala'

export interface RemedyFocus {
  role: RemedyRole
  /** Display text for role (Hindi when lang is 'hi'). */
  roleLabel?: string
  graha: GrahaId
  name: string
  remedy: PlanetRemedy
}

export interface RemedySnapshot {
  moonNakshatra: { name: string; remedies: NakshatraRemedies } | null
  focus: RemedyFocus[]
}

export function getRemedySnapshot(chart: ChartOutput, now: number = Date.now(), lang: EngineLang = 'en'): RemedySnapshot {
  const hi = lang === 'hi'
  const moon = chart.grahas?.find(g => g.id === 'Mo')
  const nak = moon ? NAKSHATRA_REMEDIES[moon.nakshatraIndex] : undefined
  const nakHi = hi && moon ? NAK_REMEDY_HI[moon.nakshatraIndex] : undefined
  const moonNakshatra = moon && nak
    ? {
        name: NAKSHATRA_NAMES[moon.nakshatraIndex] ?? moon.nakshatraName,
        remedies: nakHi ? { ...nak, ...nakHi, deity: NAKSHATRA_DEITY_HI[moon.nakshatraIndex] ?? nak.deity } : nak,
      }
    : null

  const focus: RemedyFocus[] = []
  const seen = new Set<GrahaId>()
  const push = (role: RemedyRole, id: string | undefined) => {
    const graha = id as GrahaId | undefined
    if (!graha || seen.has(graha)) return
    const remedy = (hi ? PLANET_REMEDIES_HI[graha] : undefined) ?? PLANET_REMEDIES[graha]
    if (!remedy) return
    seen.add(graha)
    focus.push(hi
      ? { role, roleLabel: REMEDY_ROLE_HI[role], graha, name: GRAHA_NAMES[graha] ?? graha, remedy }
      : { role, graha, name: GRAHA_NAMES[graha] ?? graha, remedy })
  }

  const path = getDashaPathAt(chart.dashas?.vimshottari ?? [], now)
  push('Mahadasha lord', path[0]?.lord)
  push('Antardasha lord', path[1]?.lord)
  push('Weakest by Shadbala', chart.shadbala?.weakest)

  return { moonNakshatra, focus }
}

/** Hindi dosha snapshot: same ids, tones and analyses as the English one; only label/detail differ. */
function getDoshaSnapshotHi(chart: ChartOutput): DoshaSnapshot | null {
  const en = getDoshaSnapshot(chart)
  if (!en) return null
  const { manglik, papeSamya } = en
  const g = (id: GrahaId) => GRAHA_HI[id] ?? GRAHA_NAMES[id] ?? id
  const shrap = analyzeShrapDosha(chart)
  const shrapRows = new Map((shrap?.summaryRows ?? []).map(row => [row.id, row]))
  const flags = en.flags.map((f): DoshaFlag => {
    switch (f.id) {
      case 'manglik': {
        const house = manglik.house ? ordHi(manglik.house) : ''
        const detail = !manglik.house
          ? DOSHA_HI.marsMissing
          : manglik.isManglik
            ? fill(DOSHA_HI.manglikYes, { house, intensity: INTENSITY_HI[manglik.intensity.toLowerCase()] ?? manglik.intensity })
            : manglik.cancellations.length
              ? fill(DOSHA_HI.manglikSoftened, { house, reason: MANGLIK_CANCEL_HI[manglik.cancellations[0]] ?? manglik.cancellations[0] })
              : fill(DOSHA_HI.manglikNo, { house })
        return { ...f, label: DOSHA_HI.manglik, detail }
      }
      case 'pape':
        return { ...f, label: DOSHA_HI.pape, detail: fill(DOSHA_HI.papeDetail, { score: papeSamya.totalWeight.toFixed(2) }) }
      case 'gandanta': {
        const list = chart.grahas.filter(x => CORE.includes(x.id) && x.gandanta?.isGandanta)
        return {
          ...f,
          label: DOSHA_HI.gandanta,
          detail: list.length
            ? list.map(x => `${g(x.id)} (${GANDANTA_SEVERITY_HI[x.gandanta.severity] ?? x.gandanta.severity})`).join(', ')
            : DOSHA_HI.gandantaNone,
        }
      }
      case 'mrityu': {
        const list = chart.grahas.filter(x => CORE.includes(x.id) && x.mrityuBhaga?.isMrityuBhaga)
        return { ...f, label: DOSHA_HI.mrityu, detail: list.length ? list.map(x => g(x.id)).join(', ') : DOSHA_HI.mrityuNone }
      }
      case 'yuddha': {
        const warring = chart.grahas.find(x => x.yuddha?.isWarring)
        const winner = warring?.yuddha.winner
        return {
          ...f,
          label: DOSHA_HI.yuddha,
          detail: warring
            ? fill(DOSHA_HI.yuddhaYes, { winner: winner ? fill(DOSHA_HI.yuddhaWinner, { planet: g(winner) }) : DOSHA_HI.yuddhaNoWinner })
            : DOSHA_HI.yuddhaNone,
        }
      }
      case 'combust': {
        const list = chart.grahas.filter(x => x.isCombust && x.id !== 'Su' && CORE.includes(x.id))
        return { ...f, label: DOSHA_HI.combust, detail: list.length ? list.map(x => g(x.id)).join(', ') : DOSHA_HI.combustNone }
      }
      default: {
        const row = shrapRows.get(f.id)
        const hi = SHRAP_HI[f.id]
        if (!row || !hi) return f
        return {
          ...f,
          label: hi.label,
          detail: row.present
            ? fill(DOSHA_HI.shrapPresent, { remedy: hi.keyRemedy })
            : fill(DOSHA_HI.shrapClear, { planet: hi.primaryPlanet, house: hi.primaryHouse }),
        }
      }
    }
  })
  return { ...en, flags }
}
