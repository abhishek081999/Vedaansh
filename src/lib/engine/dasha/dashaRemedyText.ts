// ─────────────────────────────────────────────────────────────
//  src/lib/engine/dasha/dashaRemedyText.ts
//  Language layer for the dasha panel's Remedies tab. The remedy
//  engine (planetaryRemedies.ts) stays English; this swaps the display
//  strings of its output for Hindi. Ids, needs and scores never change.
// ─────────────────────────────────────────────────────────────

import type { DashaLordRemedy } from '@/lib/engine/planetaryRemedies'
import { REMEDY_CORE_PRINCIPLE } from '@/lib/engine/planetaryRemedies'
import type { EngineLang } from '@/lib/engine/lang'
import { NAKSHATRA_DEITY_HI, NAKSHATRA_HI } from '@/i18n/jyotish'
import {
  REMEDY_KEY_RULE_HI,
  REMEDY_REASON_HI,
  REMEDY_TEACHINGS_HI,
} from '@/lib/engine/locale/dashaRemedies.hi'

/** The nakshatra-deity rule that heads the Remedies tab. */
export function remedyKeyRule(lang: EngineLang = 'en'): string {
  return lang === 'hi' ? REMEDY_KEY_RULE_HI : REMEDY_CORE_PRINCIPLE.keyRule
}

/** Dasha-lord remedies with display text in `lang`. English input comes back unchanged. */
export function localizeDashaLordRemedies(remedies: DashaLordRemedy[], lang: EngineLang = 'en'): DashaLordRemedy[] {
  if (lang !== 'hi') return remedies
  return remedies.map(r => {
    const a = r.assessment
    const hi = REMEDY_TEACHINGS_HI[a.grahaId]
    return {
      ...r,
      assessment: {
        ...a,
        teaching: hi ? { ...a.teaching, ...hi } : a.teaching,
        reasons: a.reasons.map(x => REMEDY_REASON_HI[x] ?? x),
        nakshatraName: NAKSHATRA_HI[a.nakshatraIndex] ?? a.nakshatraName,
        nakshatraDeity: NAKSHATRA_DEITY_HI[a.nakshatraIndex] ?? a.nakshatraDeity,
      },
    }
  })
}
