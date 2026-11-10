// Aggregates Hindi overlays for all 27 nakshatra deep guides.

import type { NakshatraDeepGuideHi } from './types'

export type { NakshatraDeepGuideHi, NakshatraPadaGuideHi } from './types'

// Populated as hi modules are authored — import and register below.
import { ASHWINI_GUIDE_HI } from './ashwini'
import { BHARANI_GUIDE_HI } from './bharani'
import { KRITTIKA_GUIDE_HI } from './krittika'
import { ROHINI_GUIDE_HI } from './rohini'
import { MRIGASHIRA_GUIDE_HI } from './mrigashira'
import { ARDRA_GUIDE_HI } from './ardra'
import { PUNARVASU_GUIDE_HI } from './punarvasu'
import { PUSHYA_GUIDE_HI } from './pushya'
import { ASHLESHA_GUIDE_HI } from './ashlesha'
import { MAGHA_GUIDE_HI } from './magha'
import { PURVA_PHALGUNI_GUIDE_HI } from './purvaPhalguni'
import { UTTARA_PHALGUNI_GUIDE_HI } from './uttaraPhalguni'
import { HASTA_GUIDE_HI } from './hasta'
import { CHITRA_GUIDE_HI } from './chitra'
import { SWATI_GUIDE_HI } from './swati'
import { VISHAKHA_GUIDE_HI } from './vishakha'
import { ANURADHA_GUIDE_HI } from './anuradha'
import { JYESHTHA_GUIDE_HI } from './jyeshtha'
import { MULA_GUIDE_HI } from './mula'
import { PURVA_ASHADHA_GUIDE_HI } from './purvaAshadha'
import { UTTARA_ASHADHA_GUIDE_HI } from './uttaraAshadha'
import { SHRAVANA_GUIDE_HI } from './shravana'
import { DHANISHTHA_GUIDE_HI } from './dhanishtha'
import { SHATABHISHA_GUIDE_HI } from './shatabhisha'
import { PURVA_BHADRA_GUIDE_HI } from './purvaBhadra'
import { UTTARA_BHADRA_GUIDE_HI } from './uttaraBhadra'
import { REVATI_GUIDE_HI } from './revati'

export const NAKSHATRA_DEEP_GUIDE_HI: Partial<Record<number, NakshatraDeepGuideHi>> = {
  0: ASHWINI_GUIDE_HI,
  1: BHARANI_GUIDE_HI,
  2: KRITTIKA_GUIDE_HI,
  3: ROHINI_GUIDE_HI,
  4: MRIGASHIRA_GUIDE_HI,
  5: ARDRA_GUIDE_HI,
  6: PUNARVASU_GUIDE_HI,
  7: PUSHYA_GUIDE_HI,
  8: ASHLESHA_GUIDE_HI,
  9: MAGHA_GUIDE_HI,
  10: PURVA_PHALGUNI_GUIDE_HI,
  11: UTTARA_PHALGUNI_GUIDE_HI,
  12: HASTA_GUIDE_HI,
  13: CHITRA_GUIDE_HI,
  14: SWATI_GUIDE_HI,
  15: VISHAKHA_GUIDE_HI,
  16: ANURADHA_GUIDE_HI,
  17: JYESHTHA_GUIDE_HI,
  18: MULA_GUIDE_HI,
  19: PURVA_ASHADHA_GUIDE_HI,
  20: UTTARA_ASHADHA_GUIDE_HI,
  21: SHRAVANA_GUIDE_HI,
  22: DHANISHTHA_GUIDE_HI,
  23: SHATABHISHA_GUIDE_HI,
  24: PURVA_BHADRA_GUIDE_HI,
  25: UTTARA_BHADRA_GUIDE_HI,
  26: REVATI_GUIDE_HI,
}
