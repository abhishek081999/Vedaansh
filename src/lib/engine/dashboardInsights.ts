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

export function getDoshaSnapshot(chart: ChartOutput): DoshaSnapshot | null {
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
        ? `Mars in house ${manglik.house} from Lagna · ${manglik.intensity.toLowerCase()} intensity`
        : manglik.cancellations.length
          ? `Mars in house ${manglik.house}, softened: ${manglik.cancellations[0]}`
          : `Mars in house ${manglik.house} — not a Manglik placement`,
  })

  const papeTone: DoshaTone = papeSamya.totalWeight >= 3 ? 'strong' : papeSamya.totalWeight >= 1.5 ? 'watch' : 'clear'
  flags.push({
    id: 'pape',
    label: 'Pape-Samya',
    tone: papeTone,
    detail: `Malefic weight ${papeSamya.totalWeight.toFixed(2)} across houses 1, 2, 4, 7, 8, 12`,
  })

  const gandanta = chart.grahas.filter(g => CORE.includes(g.id) && g.gandanta?.isGandanta)
  flags.push({
    id: 'gandanta',
    label: 'Gandanta',
    tone: gandanta.length ? 'watch' : 'clear',
    detail: gandanta.length
      ? gandanta.map(g => `${GRAHA_NAMES[g.id]} (${g.gandanta.severity})`).join(', ')
      : 'No planet at a water–fire sign junction',
  })

  const mrityu = chart.grahas.filter(g => CORE.includes(g.id) && g.mrityuBhaga?.isMrityuBhaga)
  flags.push({
    id: 'mrityu',
    label: 'Mrityu Bhaga',
    tone: mrityu.length ? 'watch' : 'clear',
    detail: mrityu.length
      ? mrityu.map(g => GRAHA_NAMES[g.id]).join(', ')
      : 'No planet on a Mrityu Bhaga degree',
  })

  const warring = chart.grahas.find(g => g.yuddha?.isWarring)
  flags.push({
    id: 'yuddha',
    label: 'Graha Yuddha',
    tone: warring ? 'watch' : 'clear',
    detail: warring
      ? `Mercury and Venus at war · ${warring.yuddha.winner ? `${GRAHA_NAMES[warring.yuddha.winner]} wins` : 'no clear winner'}`
      : 'No planetary war',
  })

  const combust = chart.grahas.filter(g => g.isCombust && g.id !== 'Su' && CORE.includes(g.id))
  flags.push({
    id: 'combust',
    label: 'Combustion',
    tone: combust.length ? 'watch' : 'clear',
    detail: combust.length ? combust.map(g => GRAHA_NAMES[g.id]).join(', ') : 'No planet combust',
  })

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
  graha: GrahaId
  name: string
  remedy: PlanetRemedy
}

export interface RemedySnapshot {
  moonNakshatra: { name: string; remedies: NakshatraRemedies } | null
  focus: RemedyFocus[]
}

export function getRemedySnapshot(chart: ChartOutput, now: number = Date.now()): RemedySnapshot {
  const moon = chart.grahas?.find(g => g.id === 'Mo')
  const nak = moon ? NAKSHATRA_REMEDIES[moon.nakshatraIndex] : undefined
  const moonNakshatra = moon && nak
    ? { name: NAKSHATRA_NAMES[moon.nakshatraIndex] ?? moon.nakshatraName, remedies: nak }
    : null

  const focus: RemedyFocus[] = []
  const seen = new Set<GrahaId>()
  const push = (role: RemedyRole, id: string | undefined) => {
    const graha = id as GrahaId | undefined
    if (!graha || seen.has(graha)) return
    const remedy = PLANET_REMEDIES[graha]
    if (!remedy) return
    seen.add(graha)
    focus.push({ role, graha, name: GRAHA_NAMES[graha] ?? graha, remedy })
  }

  const path = getDashaPathAt(chart.dashas?.vimshottari ?? [], now)
  push('Mahadasha lord', path[0]?.lord)
  push('Antardasha lord', path[1]?.lord)
  push('Weakest by Shadbala', chart.shadbala?.weakest)

  return { moonNakshatra, focus }
}
