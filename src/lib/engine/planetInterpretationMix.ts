// ─────────────────────────────────────────────────────────────
//  src/lib/engine/planetInterpretationMix.ts
//  Mix house + rashi + planet interpretation layers already in
//  the codebase into one chart-aware placement readout.
// ─────────────────────────────────────────────────────────────

import type { GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { NAKSHATRA_NAMES, RASHI_NAMES } from '@/types/astrology'
import {
  NAKSHATRA_INTERPRETATIONS,
  SIGN_INTERPRETATIONS,
} from '@/lib/engine/interpretations'
import {
  CLASSICAL_GRAHAS,
  getHouseTheme,
  getPlanetInHouse,
  getSignInHouse,
  type ClassicalGrahaId,
  type HouseNumber,
} from '@/lib/engine/houseInterpretations'
import {
  getDignityClassicalNotes,
  getHouseClassical,
  getPlanetInHouseClassical,
  getPlanetInSignClassical,
  getRashiClassical,
  type ClassicalNote,
} from '@/lib/engine/classicalInterpretations'
import {
  getPlanetInSign,
  getRashiCoreSummary,
  getRashiInHouse,
  getRashiProfile,
} from '@/lib/engine/rashiInterpretations'
import { getVakriAstNotes } from '@/lib/engine/vakriAstInterpretations'
import { getNakshatraCharacteristics } from '@/lib/engine/nakshatraAdvanced'
import {
  getLagnaLordInHouse,
  lordOfHouse,
  SIGN_LORD_BY_RASHI,
} from '@/lib/engine/lordshipInterpretations'

export type InterpLayerId =
  | 'house_theme'
  | 'house_classical'
  | 'planet_house_platform'
  | 'planet_house_classical'
  | 'rashi_core'
  | 'rashi_classical'
  | 'rashi_in_house'
  | 'sign_in_house'
  | 'planet_sign_platform'
  | 'planet_sign_classical'
  | 'planet_sign_psych'
  | 'dignity'
  | 'nakshatra'
  | 'vakri_ast'
  | 'lordship'

export type MixScope = 'house' | 'sign' | 'meta' | 'all'

export interface InterpLayer {
  id: InterpLayerId
  label: string
  provenance: string
  texts: string[]
  classicalNotes?: ClassicalNote[]
}

export interface MixedPlanetPlacement {
  grahaId: ClassicalGrahaId
  grahaName: string
  house: number
  rashi: Rashi
  rashiName: string
  dignity: string
  nakshatraName: string
  pada: number
  layers: InterpLayer[]
  blendedSummary: string
}

const DIGNITY_INTERPRETATIONS: Record<string, string> = {
  exalted: 'Peak strength — highest constructive qualities express with ease.',
  moolatrikona: 'Purposeful strength — like a king in office; highly effective.',
  own: 'At home — reliable support and steady growth in significations.',
  great_friend: 'Highly supportive environment for the planet’s success.',
  friend: 'General support and ease; positive outcomes with moderate effort.',
  neutral: 'Mixed results — other factors and aspects decide expression.',
  enemy: 'Challenging environment; hard work needed for clean results.',
  great_enemy: 'Significant obstruction and internal conflict in themes.',
  debilitated: 'Strained or misdirected energy; nīcabhaṅga can reverse.',
}

const HOUSE_LAYER_IDS = new Set<InterpLayerId>([
  'house_theme',
  'house_classical',
  'planet_house_platform',
  'planet_house_classical',
])

const SIGN_LAYER_IDS = new Set<InterpLayerId>([
  'rashi_core',
  'rashi_classical',
  'rashi_in_house',
  'sign_in_house',
  'planet_sign_platform',
  'planet_sign_classical',
  'planet_sign_psych',
])

const META_LAYER_IDS = new Set<InterpLayerId>([
  'dignity',
  'nakshatra',
  'vakri_ast',
  'lordship',
])

function asClassical(id: string): ClassicalGrahaId | null {
  return (CLASSICAL_GRAHAS as string[]).includes(id) ? (id as ClassicalGrahaId) : null
}

function pushLayer(layers: InterpLayer[], layer: InterpLayer | null): void {
  if (!layer) return
  if (!layer.texts.length && !layer.classicalNotes?.length) return
  layers.push(layer)
}

function layerFromTexts(
  id: InterpLayerId,
  label: string,
  provenance: string,
  texts: Array<string | null | undefined>,
  classicalNotes?: ClassicalNote[],
): InterpLayer | null {
  const cleaned = [...new Set(texts.map(t => (t ?? '').trim()).filter(Boolean))]
  if (!cleaned.length && !classicalNotes?.length) return null
  return { id, label, provenance, texts: cleaned, classicalNotes }
}

function wants(scope: MixScope, id: InterpLayerId): boolean {
  if (scope === 'all') return true
  if (scope === 'house') return HOUSE_LAYER_IDS.has(id)
  if (scope === 'sign') return SIGN_LAYER_IDS.has(id)
  if (scope === 'meta') return META_LAYER_IDS.has(id)
  return true
}

/**
 * Mix house / rashi / planet interpretation sources for one placement.
 */
export function mixPlanetPlacement(input: {
  grahaId: GrahaId
  house: number
  rashi: Rashi
  dignity?: string
  isRetro?: boolean
  isCombust?: boolean
  nakshatraIndex?: number
  pada?: number
  ascRashi?: Rashi
  grahaName?: string
  scope?: MixScope
}): MixedPlanetPlacement | null {
  const g = asClassical(input.grahaId)
  if (!g) return null

  const scope = input.scope ?? 'all'
  const house = input.house
  const rashi = input.rashi
  const dignity = input.dignity ?? 'neutral'
  const nakIdx = ((input.nakshatraIndex ?? 0) % 27 + 27) % 27
  const pada = input.pada ?? 1
  const name = input.grahaName ?? g
  const layers: InterpLayer[] = []

  if (wants(scope, 'house_theme')) {
    const theme = getHouseTheme(house)
    pushLayer(
      layers,
      layerFromTexts(
        'house_theme',
        `House ${house} themes`,
        'House guide',
        theme
          ? [
              `${theme.english} (${theme.sanskrit}): ${theme.shortThemes}`,
              theme.intro,
              ...theme.coreThemes.slice(0, 4),
            ]
          : [],
      ),
    )
  }

  if (wants(scope, 'house_classical')) {
    pushLayer(
      layers,
      layerFromTexts(
        'house_classical',
        `Bhava ${house} — classics`,
        'Classical bhava',
        [],
        getHouseClassical(house),
      ),
    )
  }

  if (wants(scope, 'planet_house_platform')) {
    pushLayer(
      layers,
      layerFromTexts(
        'planet_house_platform',
        `${name} in house ${house}`,
        'Planet×house',
        [
          getPlanetInHouse(g, house, 'summary'),
          getPlanetInHouse(g, house, 'full'),
        ],
      ),
    )
  }

  if (wants(scope, 'planet_house_classical')) {
    pushLayer(
      layers,
      layerFromTexts(
        'planet_house_classical',
        `${name} in house ${house} — classics`,
        'Classical planet×house',
        [],
        getPlanetInHouseClassical(g, house),
      ),
    )
  }

  if (wants(scope, 'rashi_core')) {
    const profile = getRashiProfile(rashi)
    pushLayer(
      layers,
      layerFromTexts(
        'rashi_core',
        `${RASHI_NAMES[rashi]} rashi`,
        'Rashi guide',
        [
          getRashiCoreSummary(rashi),
          profile?.lordSummary,
          ...(profile?.coreNature.slice(0, 3) ?? []),
          profile?.specialRules[0] ?? null,
        ],
      ),
    )
  }

  if (wants(scope, 'rashi_classical')) {
    pushLayer(
      layers,
      layerFromTexts(
        'rashi_classical',
        `${RASHI_NAMES[rashi]} — classics`,
        'Classical rashi',
        [],
        getRashiClassical(rashi),
      ),
    )
  }

  if (wants(scope, 'rashi_in_house')) {
    pushLayer(
      layers,
      layerFromTexts(
        'rashi_in_house',
        `${RASHI_NAMES[rashi]} occupying house ${house}`,
        'Rashi×house',
        [getRashiInHouse(rashi, house)],
      ),
    )
  }

  if (wants(scope, 'sign_in_house')) {
    pushLayer(
      layers,
      layerFromTexts(
        'sign_in_house',
        `Sign-in-house (H${house} · ${RASHI_NAMES[rashi]})`,
        'Sign×house table',
        [getSignInHouse(house as HouseNumber, rashi)],
      ),
    )
  }

  if (wants(scope, 'planet_sign_platform')) {
    pushLayer(
      layers,
      layerFromTexts(
        'planet_sign_platform',
        `${name} in ${RASHI_NAMES[rashi]}`,
        'Planet×sign',
        [
          getPlanetInSign(g, rashi, 'summary'),
          getPlanetInSign(g, rashi, 'full'),
        ],
      ),
    )
  }

  if (wants(scope, 'planet_sign_classical')) {
    pushLayer(
      layers,
      layerFromTexts(
        'planet_sign_classical',
        `${name} in ${RASHI_NAMES[rashi]} — classics`,
        'Classical planet×sign',
        [],
        getPlanetInSignClassical(g, rashi),
      ),
    )
  }

  if (wants(scope, 'planet_sign_psych')) {
    pushLayer(
      layers,
      layerFromTexts(
        'planet_sign_psych',
        `${name} in ${RASHI_NAMES[rashi]} — psyche`,
        'Sign interpretations',
        [SIGN_INTERPRETATIONS[g]?.[rashi]],
      ),
    )
  }

  if (wants(scope, 'dignity')) {
    pushLayer(
      layers,
      layerFromTexts(
        'dignity',
        `Dignity · ${dignity.replace('_', ' ')}`,
        'Dignity',
        [DIGNITY_INTERPRETATIONS[dignity]],
        getDignityClassicalNotes(dignity, input.isCombust, input.isRetro, g, 'full'),
      ),
    )
  }

  if (wants(scope, 'nakshatra')) {
    const nakChars = getNakshatraCharacteristics(nakIdx, pada)
    pushLayer(
      layers,
      layerFromTexts(
        'nakshatra',
        `${NAKSHATRA_NAMES[nakIdx] ?? nakChars.name} P${pada}`,
        'Nakshatra',
        [
          NAKSHATRA_INTERPRETATIONS[nakIdx],
          `Lord ${nakChars.lord} · deity ${nakChars.deity} · ${nakChars.gana} gana · ${nakChars.nadi} nadi · ${nakChars.symbol}`,
          nakChars.shakti ? `Shakti: ${nakChars.shakti}` : null,
          nakChars.nature ? `Nature: ${nakChars.nature}` : null,
          nakChars.bodyPart ? `Body: ${nakChars.bodyPart}` : null,
        ],
      ),
    )
  }

  if (wants(scope, 'vakri_ast')) {
    pushLayer(
      layers,
      layerFromTexts(
        'vakri_ast',
        'Vakri / Asta',
        'Vakri·Asta',
        [],
        getVakriAstNotes(g, input.isRetro, input.isCombust, dignity, 'full'),
      ),
    )
  }

  if (wants(scope, 'lordship') && input.ascRashi != null) {
    const lagnaLord = SIGN_LORD_BY_RASHI[input.ascRashi]
    if (lagnaLord === g) {
      pushLayer(
        layers,
        layerFromTexts(
          'lordship',
          `Lagna lord in house ${house}`,
          'Lordship',
          [],
          getLagnaLordInHouse(house),
        ),
      )
    }
    const owns: string[] = []
    for (let h = 1; h <= 12; h++) {
      if (lordOfHouse(input.ascRashi, h as HouseNumber) === g) owns.push(`H${h}`)
    }
    if (owns.length) {
      pushLayer(
        layers,
        layerFromTexts(
          'lordship',
          `${name} lords ${owns.join(', ')} from this lagna`,
          'Lordship',
          [
            `As lord of ${owns.join(' · ')}, results from H${house} also color those bhavas.`,
          ],
        ),
      )
    }
  }

  const blendedParts = layers.flatMap(l => {
    const classicalTexts = (l.classicalNotes ?? []).map(n => n.text)
    const primary = l.texts[0] ?? classicalTexts[0]
    return primary ? [`${l.label}: ${primary}`] : []
  })

  return {
    grahaId: g,
    grahaName: name,
    house,
    rashi,
    rashiName: RASHI_NAMES[rashi],
    dignity,
    nakshatraName: NAKSHATRA_NAMES[nakIdx] ?? String(nakIdx),
    pada,
    layers,
    blendedSummary: blendedParts.join(' · '),
  }
}

export function mixPlanetFromGraha(
  graha: GrahaData,
  house: number,
  ascRashi?: Rashi,
  scope: MixScope = 'all',
): MixedPlanetPlacement | null {
  return mixPlanetPlacement({
    grahaId: graha.id,
    house,
    rashi: graha.rashi,
    dignity: graha.dignity,
    isRetro: graha.isRetro,
    isCombust: graha.isCombust,
    nakshatraIndex: graha.nakshatraIndex,
    pada: graha.pada,
    ascRashi,
    grahaName: graha.name,
    scope,
  })
}

export function mixPlanetInHouseCatalogue(
  grahaId: ClassicalGrahaId,
  house: number,
  grahaName = 'Mars',
): InterpLayer[] {
  return mixPlanetPlacement({
    grahaId,
    house,
    rashi: 1,
    grahaName,
    scope: 'house',
  })?.layers ?? []
}

export function mixPlanetInSignCatalogue(
  grahaId: ClassicalGrahaId,
  rashi: Rashi,
  grahaName = 'Mars',
): InterpLayer[] {
  return mixPlanetPlacement({
    grahaId,
    house: 1,
    rashi,
    grahaName,
    scope: 'sign',
  })?.layers ?? []
}
