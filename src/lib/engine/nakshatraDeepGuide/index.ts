// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nakshatraDeepGuide/index.ts
//  Lazy deep-guide loaders for client charts (one chunk per star/lang).
//  Sync eager API lives in ./sync for Social Studio and tests.
// ─────────────────────────────────────────────────────────────

import type { EngineLang } from '@/lib/engine/lang'
import type {
  AbhijitDeepGuideHi,
  NakshatraDeepGuideHi,
  NakshatraEncyclopediaHi,
} from '@/lib/engine/locale/nakshatraDeepGuide/types'
import { localizeNakshatraDeepGuide } from './localize'
import {
  localizeAbhijitDeepGuide,
  mergeEncyclopedia,
  mergeEncyclopediaHi,
} from './mergeEncyclopedia'
import type { AbhijitDeepGuide, NakshatraDeepGuide, NakshatraDeepGuideSeed, NakshatraEncyclopediaEntry } from './types'

export type {
  AbhijitDeepGuide,
  NakshatraDeepGuide,
  NakshatraGuidePlanet,
  NakshatraPadaGuide,
  NakshatraGuna,
} from './types'

/** All 27 indices are authored. */
export function listNakshatraDeepGuideIndices(): number[] {
  return Array.from({ length: 27 }, (_, i) => i)
}

const EN_LOADERS: Record<number, () => Promise<NakshatraDeepGuideSeed>> = {
  0: () => import('./data/ashwini').then((m) => m.ASHWINI_GUIDE),
  1: () => import('./data/bharani').then((m) => m.BHARANI_GUIDE),
  2: () => import('./data/krittika').then((m) => m.KRITTIKA_GUIDE),
  3: () => import('./data/rohini').then((m) => m.ROHINI_GUIDE),
  4: () => import('./data/mrigashira').then((m) => m.MRIGASHIRA_GUIDE),
  5: () => import('./data/ardra').then((m) => m.ARDRA_GUIDE),
  6: () => import('./data/punarvasu').then((m) => m.PUNARVASU_GUIDE),
  7: () => import('./data/pushya').then((m) => m.PUSHYA_GUIDE),
  8: () => import('./data/ashlesha').then((m) => m.ASHLESHA_GUIDE),
  9: () => import('./data/magha').then((m) => m.MAGHA_GUIDE),
  10: () => import('./data/purvaPhalguni').then((m) => m.PURVA_PHALGUNI_GUIDE),
  11: () => import('./data/uttaraPhalguni').then((m) => m.UTTARA_PHALGUNI_GUIDE),
  12: () => import('./data/hasta').then((m) => m.HASTA_GUIDE),
  13: () => import('./data/chitra').then((m) => m.CHITRA_GUIDE),
  14: () => import('./data/swati').then((m) => m.SWATI_GUIDE),
  15: () => import('./data/vishakha').then((m) => m.VISHAKHA_GUIDE),
  16: () => import('./data/anuradha').then((m) => m.ANURADHA_GUIDE),
  17: () => import('./data/jyeshtha').then((m) => m.JYESHTHA_GUIDE),
  18: () => import('./data/mula').then((m) => m.MULA_GUIDE),
  19: () => import('./data/purvaAshadha').then((m) => m.PURVA_ASHADHA_GUIDE),
  20: () => import('./data/uttaraAshadha').then((m) => m.UTTARA_ASHADHA_GUIDE),
  21: () => import('./data/shravana').then((m) => m.SHRAVANA_GUIDE),
  22: () => import('./data/dhanishtha').then((m) => m.DHANISHTHA_GUIDE),
  23: () => import('./data/shatabhisha').then((m) => m.SHATABHISHA_GUIDE),
  24: () => import('./data/purvaBhadra').then((m) => m.PURVA_BHADRA_GUIDE),
  25: () => import('./data/uttaraBhadra').then((m) => m.UTTARA_BHADRA_GUIDE),
  26: () => import('./data/revati').then((m) => m.REVATI_GUIDE),
}

const HI_LOADERS: Record<number, () => Promise<NakshatraDeepGuideHi>> = {
  0: () => import('@/lib/engine/locale/nakshatraDeepGuide/ashwini').then((m) => m.ASHWINI_GUIDE_HI),
  1: () => import('@/lib/engine/locale/nakshatraDeepGuide/bharani').then((m) => m.BHARANI_GUIDE_HI),
  2: () => import('@/lib/engine/locale/nakshatraDeepGuide/krittika').then((m) => m.KRITTIKA_GUIDE_HI),
  3: () => import('@/lib/engine/locale/nakshatraDeepGuide/rohini').then((m) => m.ROHINI_GUIDE_HI),
  4: () => import('@/lib/engine/locale/nakshatraDeepGuide/mrigashira').then((m) => m.MRIGASHIRA_GUIDE_HI),
  5: () => import('@/lib/engine/locale/nakshatraDeepGuide/ardra').then((m) => m.ARDRA_GUIDE_HI),
  6: () => import('@/lib/engine/locale/nakshatraDeepGuide/punarvasu').then((m) => m.PUNARVASU_GUIDE_HI),
  7: () => import('@/lib/engine/locale/nakshatraDeepGuide/pushya').then((m) => m.PUSHYA_GUIDE_HI),
  8: () => import('@/lib/engine/locale/nakshatraDeepGuide/ashlesha').then((m) => m.ASHLESHA_GUIDE_HI),
  9: () => import('@/lib/engine/locale/nakshatraDeepGuide/magha').then((m) => m.MAGHA_GUIDE_HI),
  10: () => import('@/lib/engine/locale/nakshatraDeepGuide/purvaPhalguni').then((m) => m.PURVA_PHALGUNI_GUIDE_HI),
  11: () => import('@/lib/engine/locale/nakshatraDeepGuide/uttaraPhalguni').then((m) => m.UTTARA_PHALGUNI_GUIDE_HI),
  12: () => import('@/lib/engine/locale/nakshatraDeepGuide/hasta').then((m) => m.HASTA_GUIDE_HI),
  13: () => import('@/lib/engine/locale/nakshatraDeepGuide/chitra').then((m) => m.CHITRA_GUIDE_HI),
  14: () => import('@/lib/engine/locale/nakshatraDeepGuide/swati').then((m) => m.SWATI_GUIDE_HI),
  15: () => import('@/lib/engine/locale/nakshatraDeepGuide/vishakha').then((m) => m.VISHAKHA_GUIDE_HI),
  16: () => import('@/lib/engine/locale/nakshatraDeepGuide/anuradha').then((m) => m.ANURADHA_GUIDE_HI),
  17: () => import('@/lib/engine/locale/nakshatraDeepGuide/jyeshtha').then((m) => m.JYESHTHA_GUIDE_HI),
  18: () => import('@/lib/engine/locale/nakshatraDeepGuide/mula').then((m) => m.MULA_GUIDE_HI),
  19: () => import('@/lib/engine/locale/nakshatraDeepGuide/purvaAshadha').then((m) => m.PURVA_ASHADHA_GUIDE_HI),
  20: () => import('@/lib/engine/locale/nakshatraDeepGuide/uttaraAshadha').then((m) => m.UTTARA_ASHADHA_GUIDE_HI),
  21: () => import('@/lib/engine/locale/nakshatraDeepGuide/shravana').then((m) => m.SHRAVANA_GUIDE_HI),
  22: () => import('@/lib/engine/locale/nakshatraDeepGuide/dhanishtha').then((m) => m.DHANISHTHA_GUIDE_HI),
  23: () => import('@/lib/engine/locale/nakshatraDeepGuide/shatabhisha').then((m) => m.SHATABHISHA_GUIDE_HI),
  24: () => import('@/lib/engine/locale/nakshatraDeepGuide/purvaBhadra').then((m) => m.PURVA_BHADRA_GUIDE_HI),
  25: () => import('@/lib/engine/locale/nakshatraDeepGuide/uttaraBhadra').then((m) => m.UTTARA_BHADRA_GUIDE_HI),
  26: () => import('@/lib/engine/locale/nakshatraDeepGuide/revati').then((m) => m.REVATI_GUIDE_HI),
}

let encEnPromise: Promise<Record<number, NakshatraEncyclopediaEntry>> | null = null
let encHiPromise: Promise<Record<number, NakshatraEncyclopediaHi>> | null = null

function loadEncEn() {
  if (!encEnPromise) {
    encEnPromise = import('./encyclopedia/en').then((m) => m.NAKSHATRA_ENCYCLOPEDIA_EN)
  }
  return encEnPromise
}

function loadEncHi() {
  if (!encHiPromise) {
    encHiPromise = import('@/lib/engine/locale/nakshatraDeepGuide/encyclopedia.hi').then(
      (m) => m.NAKSHATRA_ENCYCLOPEDIA_HI,
    )
  }
  return encHiPromise
}

const enCache = new Map<number, Promise<NakshatraDeepGuideSeed>>()
const hiOverlayCache = new Map<number, Promise<NakshatraDeepGuideHi>>()
const localizedCache = new Map<string, Promise<NakshatraDeepGuide | null>>()

function wrapIndex(index: number): number {
  return ((index % 27) + 27) % 27
}

function loadSeed(i: number): Promise<NakshatraDeepGuideSeed> {
  let p = enCache.get(i)
  if (!p) {
    const loader = EN_LOADERS[i]
    p = loader ? loader() : Promise.reject(new Error(`No EN guide loader for ${i}`))
    enCache.set(i, p)
  }
  return p
}

function loadHiOverlay(i: number): Promise<NakshatraDeepGuideHi> {
  let p = hiOverlayCache.get(i)
  if (!p) {
    const loader = HI_LOADERS[i]
    p = loader ? loader() : Promise.reject(new Error(`No HI guide loader for ${i}`))
    hiOverlayCache.set(i, p)
  }
  return p
}

/**
 * Async deep guide for client charts — loads only the requested star (+ Hindi overlay).
 */
export async function loadNakshatraDeepGuide(
  index: number,
  lang: EngineLang = 'en',
): Promise<NakshatraDeepGuide | null> {
  const i = wrapIndex(index)
  const cacheKey = `${lang}:${i}`
  let pending = localizedCache.get(cacheKey)
  if (!pending) {
    pending = (async () => {
      try {
        const [seed, encEn] = await Promise.all([loadSeed(i), loadEncEn()])
        const enc = encEn[i]
        if (!enc) return null
        const en = mergeEncyclopedia(seed, enc)
        if (lang !== 'hi') return en
        const [hi, encHi] = await Promise.all([loadHiOverlay(i), loadEncHi()])
        const localized = localizeNakshatraDeepGuide(en, hi)
        return mergeEncyclopediaHi(localized, encHi[i])
      } catch {
        return null
      }
    })()
    localizedCache.set(cacheKey, pending)
  }
  return pending
}

/** Load several guides in parallel (birth star + occupied stars). */
export async function loadNakshatraDeepGuides(
  indices: number[],
  lang: EngineLang = 'en',
): Promise<Map<number, NakshatraDeepGuide>> {
  const unique = [...new Set(indices.map(wrapIndex))]
  const pairs = await Promise.all(
    unique.map(async (i) => {
      const g = await loadNakshatraDeepGuide(i, lang)
      return g ? ([i, g] as const) : null
    }),
  )
  return new Map(pairs.filter((p): p is readonly [number, NakshatraDeepGuide] => p != null))
}

let abhijitCache = new Map<string, Promise<AbhijitDeepGuide>>()

export async function loadAbhijitDeepGuide(lang: EngineLang = 'en'): Promise<AbhijitDeepGuide> {
  const key = lang
  let pending = abhijitCache.get(key)
  if (!pending) {
    pending = (async () => {
      const en = (await import('./data/abhijit')).ABHIJIT_GUIDE
      if (lang !== 'hi') return en
      const hi: AbhijitDeepGuideHi = (await import('@/lib/engine/locale/nakshatraDeepGuide/abhijit'))
        .ABHIJIT_GUIDE_HI
      return localizeAbhijitDeepGuide(en, hi)
    })()
    abhijitCache.set(key, pending)
  }
  return pending
}
