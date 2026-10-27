// ─────────────────────────────────────────────────────────────
//  src/lib/engine/dasha/vimshottariGochar.ts
//  Dasha × Gochar overlay — major transits vs MD/AD/PD lords
//  Educational timing only; pure engine (no React/DB).
// ─────────────────────────────────────────────────────────────

import type { GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import type { TransitPosition } from '@/lib/engine/transits'
import { hasParasharaAspect } from '@/lib/engine/aspects'

export type GocharHitTone = 'supportive' | 'caution' | 'mixed'

export interface DashaGocharHit {
  id: string
  transitLord: GrahaId
  house: number
  sign: Rashi
  tone: GocharHitTone
  label: string
  detail: string
}

export interface DashaGocharOverlay {
  hits: DashaGocharHit[]
  summary: string
  asOfLabel: string
}

const MAJOR_TRANSIT_LORDS: GrahaId[] = ['Ju', 'Sa', 'Ra', 'Ke']

function toneForMajor(transitLord: GrahaId, house: number): GocharHitTone {
  if (transitLord === 'Ju') {
    return [6, 8, 12].includes(house) ? 'mixed' : 'supportive'
  }
  if (transitLord === 'Sa') {
    return [1, 4, 7, 8, 10].includes(house) ? 'caution' : 'mixed'
  }
  // Nodes — always mixed intensity
  return 'mixed'
}

export interface AnalyzeDashaGocharInput {
  ascRashi: Rashi
  natalGrahas: GrahaData[]
  mahaLord: string
  antarLord?: string | null
  pratyaLord?: string | null
  transitPositions: TransitPosition[]
  /** ISO date label for UI */
  asOf?: string
}

/**
 * Overlay current gochar (focus Ju/Sa/Ra/Ke) on active Vimshottari lords.
 * Hits: transit over natal MD/AD/Moon/lagna signs; aspect to period lords;
 * transit occupying MD/AD owned houses (via house number match).
 */
export function analyzeDashaGochar(input: AnalyzeDashaGocharInput): DashaGocharOverlay {
  const {
    ascRashi,
    natalGrahas,
    mahaLord,
    antarLord = null,
    pratyaLord = null,
    transitPositions,
    asOf,
  } = input

  const periodLords = [mahaLord, antarLord, pratyaLord].filter(Boolean) as string[]
  const hits: DashaGocharHit[] = []
  const seen = new Set<string>()

  const push = (hit: DashaGocharHit) => {
    if (seen.has(hit.id)) return
    seen.add(hit.id)
    hits.push(hit)
  }

  const natalById = (id: string) => natalGrahas.find(g => g.id === id)
  const moon = natalById('Mo')
  const lagnaSign = ascRashi

  for (const t of transitPositions) {
    if (!MAJOR_TRANSIT_LORDS.includes(t.planetId)) continue
    const tName = GRAHA_NAMES[t.planetId] ?? t.planetId
    const signName = RASHI_NAMES[t.sign] ?? `R${t.sign}`

    // Transit in lagna
    if (t.sign === lagnaSign) {
      push({
        id: `${t.planetId}-lagna`,
        transitLord: t.planetId,
        house: t.house,
        sign: t.sign,
        tone: toneForMajor(t.planetId, 1),
        label: `${tName} over Lagna`,
        detail: `${tName} transits the lagna (${signName}, house ${t.house}). That colours the whole delivery of the dasha with the transit of ${tName}.`,
      })
    }

    // Transit over natal Moon
    if (moon && t.sign === moon.rashi) {
      push({
        id: `${t.planetId}-moon`,
        transitLord: t.planetId,
        house: t.house,
        sign: t.sign,
        tone: toneForMajor(t.planetId, t.house),
        label: `${tName} over Moon`,
        detail: `${tName} transits the sign of the natal Moon. Themes of mind and mood grow louder through the active mahadasha and antardasha.`,
      })
    }

    // Transit over / aspecting each period lord
    for (const lord of periodLords) {
      const natal = natalById(lord)
      if (!natal) continue
      const lordName = GRAHA_NAMES[lord as GrahaId] ?? lord
      const layer =
        lord === mahaLord ? 'MD' : lord === antarLord ? 'AD' : 'PD'

      if (t.sign === natal.rashi) {
        push({
          id: `${t.planetId}-over-${lord}`,
          transitLord: t.planetId,
          house: t.house,
          sign: t.sign,
          tone: toneForMajor(t.planetId, t.house),
          label: `${tName} over ${layer} lord`,
          detail: `${tName} transits natal ${lordName} (${layer}) in ${signName}. The transit heats the houses of the period lord.`,
        })
      } else if (hasParasharaAspect(t.sign, t.planetId, natal.rashi)) {
        push({
          id: `${t.planetId}-asp-${lord}`,
          transitLord: t.planetId,
          house: t.house,
          sign: t.sign,
          tone: toneForMajor(t.planetId, t.house),
          label: `${tName} aspects ${layer} lord`,
          detail: `Transiting ${tName}, in house ${t.house}, aspects natal ${lordName} (${layer}). Classically, that is a candidate for a dasha-and-transit trigger.`,
        })
      }
    }

    // Period lord itself is currently transiting a sensitive natal house (1/4/7/10 or dusthana)
    if (periodLords.includes(t.planetId)) {
      const layer =
        t.planetId === mahaLord ? 'MD' : t.planetId === antarLord ? 'AD' : 'PD'
      const sensitive = [1, 4, 7, 10, 6, 8, 12].includes(t.house)
      if (sensitive) {
        push({
          id: `${t.planetId}-self-h${t.house}`,
          transitLord: t.planetId,
          house: t.house,
          sign: t.sign,
          tone: [6, 8, 12].includes(t.house) ? 'caution' : 'mixed',
          label: `${layer} lord transit H${t.house}`,
          detail: `The active ${layer} lord, ${tName}, is now transiting house ${t.house} from the lagna. This is the live transit of the dasha planet.`,
        })
      }
    }
  }

  // Prefer highest-signal hits first
  const rank = (h: DashaGocharHit) => {
    if (h.id.includes('-over-')) return 0
    if (h.id.includes('-lagna') || h.id.includes('-moon')) return 1
    if (h.id.includes('-asp-')) return 2
    return 3
  }
  hits.sort((a, b) => rank(a) - rank(b))

  const top = hits.slice(0, 6)
  const summary = top.length
    ? `Dasha × gochar: ${top.slice(0, 3).map(h => h.label).join('; ')}.`
    : 'No major Ju/Sa/Ra/Ke gochar hits on MD/AD/Moon/lagna right now — dasha still runs; transit tone is quieter.'

  return {
    hits: top,
    summary,
    asOfLabel: asOf ?? new Date().toISOString().slice(0, 10),
  }
}
