// ─────────────────────────────────────────────────────────────
//  Eager deep-guide registry for Social Studio, tests, and server.
//  Client chart UI should use loadNakshatraDeepGuide from ./index.
// ─────────────────────────────────────────────────────────────

import type { EngineLang } from '@/lib/engine/lang'
import { NAKSHATRA_DEEP_GUIDE_HI } from '@/lib/engine/locale/nakshatraDeepGuide'
import { ASHWINI_GUIDE } from './data/ashwini'
import { BHARANI_GUIDE } from './data/bharani'
import { KRITTIKA_GUIDE } from './data/krittika'
import { ROHINI_GUIDE } from './data/rohini'
import { MRIGASHIRA_GUIDE } from './data/mrigashira'
import { ARDRA_GUIDE } from './data/ardra'
import { PUNARVASU_GUIDE } from './data/punarvasu'
import { PUSHYA_GUIDE } from './data/pushya'
import { ASHLESHA_GUIDE } from './data/ashlesha'
import { MAGHA_GUIDE } from './data/magha'
import { PURVA_PHALGUNI_GUIDE } from './data/purvaPhalguni'
import { UTTARA_PHALGUNI_GUIDE } from './data/uttaraPhalguni'
import { HASTA_GUIDE } from './data/hasta'
import { CHITRA_GUIDE } from './data/chitra'
import { SWATI_GUIDE } from './data/swati'
import { VISHAKHA_GUIDE } from './data/vishakha'
import { ANURADHA_GUIDE } from './data/anuradha'
import { JYESHTHA_GUIDE } from './data/jyeshtha'
import { MULA_GUIDE } from './data/mula'
import { PURVA_ASHADHA_GUIDE } from './data/purvaAshadha'
import { UTTARA_ASHADHA_GUIDE } from './data/uttaraAshadha'
import { SHRAVANA_GUIDE } from './data/shravana'
import { DHANISHTHA_GUIDE } from './data/dhanishtha'
import { SHATABHISHA_GUIDE } from './data/shatabhisha'
import { PURVA_BHADRA_GUIDE } from './data/purvaBhadra'
import { UTTARA_BHADRA_GUIDE } from './data/uttaraBhadra'
import { REVATI_GUIDE } from './data/revati'
import { localizeNakshatraDeepGuide } from './localize'
import type { NakshatraDeepGuide } from './types'

export type { NakshatraDeepGuide, NakshatraGuidePlanet, NakshatraPadaGuide } from './types'

const GUIDES: Record<number, NakshatraDeepGuide> = {
  0: ASHWINI_GUIDE,
  1: BHARANI_GUIDE,
  2: KRITTIKA_GUIDE,
  3: ROHINI_GUIDE,
  4: MRIGASHIRA_GUIDE,
  5: ARDRA_GUIDE,
  6: PUNARVASU_GUIDE,
  7: PUSHYA_GUIDE,
  8: ASHLESHA_GUIDE,
  9: MAGHA_GUIDE,
  10: PURVA_PHALGUNI_GUIDE,
  11: UTTARA_PHALGUNI_GUIDE,
  12: HASTA_GUIDE,
  13: CHITRA_GUIDE,
  14: SWATI_GUIDE,
  15: VISHAKHA_GUIDE,
  16: ANURADHA_GUIDE,
  17: JYESHTHA_GUIDE,
  18: MULA_GUIDE,
  19: PURVA_ASHADHA_GUIDE,
  20: UTTARA_ASHADHA_GUIDE,
  21: SHRAVANA_GUIDE,
  22: DHANISHTHA_GUIDE,
  23: SHATABHISHA_GUIDE,
  24: PURVA_BHADRA_GUIDE,
  25: UTTARA_BHADRA_GUIDE,
  26: REVATI_GUIDE,
}

export function getNakshatraDeepGuide(
  index: number,
  lang: EngineLang = 'en',
): NakshatraDeepGuide | null {
  const i = ((index % 27) + 27) % 27
  const en = GUIDES[i]
  if (!en) return null
  if (lang !== 'hi') return en
  return localizeNakshatraDeepGuide(en, NAKSHATRA_DEEP_GUIDE_HI[i])
}

export function listNakshatraDeepGuides(lang: EngineLang = 'en'): NakshatraDeepGuide[] {
  return Array.from({ length: 27 }, (_, i) => getNakshatraDeepGuide(i, lang))
    .filter((g): g is NakshatraDeepGuide => g != null)
}
